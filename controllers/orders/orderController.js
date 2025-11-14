const Order = require('../../models/orders/orderModel');
const Cart = require('../../models/cartManagement/cartModel');
const OrderSummary = require('../../models/orders/orderSummaryModel');
const OrderHistory = require('../../models/orders/orderHistoryModel');
const OrderReturn = require('../../models/orders/orderReturnModel');
const OrderReplacement = require('../../models/orders/orderReplacementModel');
const NotificationLog = require('../../models/notifications/notificationLogModel');
const ShippingRule = require('../../models/shipping/shippingRuleModel');
const UserAddress = require('../../models/shipping/userAddressModel');
const Refund = require('../../models/orders/refundModel');
const User = require('../../models/auth/userModel');
const Variant = require('../../models/productCatalog/productVariantModel');
const nodemailer = require('nodemailer');

/**
 * Create a new order from cart
 */
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {
            cartId, paymentMethod, shippingAddress, addressId, billingAddress = null, notes = ''
        } = req.body;

        // Find the cart
        const cart = await Cart.findOne({_id: cartId, $or: [{userId}, {userId: null}]});
        if (!cart) {
            return res.status(404).json({
                success: false, message: 'Cart not found'
            });
        }

        // Get order summary
        const orderSummary = await OrderSummary.findOne({cartId});
        if (!orderSummary) {
            return res.status(404).json({
                success: false, message: 'Order summary not found. Please generate summary first.'
            });
        }

        // Resolve shipping address if addressId provided
        let finalShippingAddress = shippingAddress;
        if (!finalShippingAddress && addressId && userId) {
            const addr = await UserAddress.findOne({_id: addressId, userId}).lean();
            if (!addr) {
                return res.status(404).json({
                    success: false, message: 'Address not found'
                });
            }
            finalShippingAddress = {
                name: addr.name,
                phone: addr.phone,
                addressLine1: addr.address,
                city: addr.city,
                state: addr.state,
                country: addr.country,
                pincode: addr.pincode,
            };
        }

        // Create new order - will auto-generate orderNumber in pre-save hook
        const order = new Order({
            userId: userId || null,
            items: cart.items.map(item => ({
                productId: item.productId,
                variantId: item.variantId,
                name: item.name || `Product ${item.productId}`,
                quantity: item.quantity,
                price: item.price,
                total: item.finalPrice * item.quantity
            })),
            paymentMethod,
            paymentStatus: paymentMethod.toLowerCase() === 'cod' ? 'cod' : 'pending',
            shippingAddress: finalShippingAddress,
            billingAddress: billingAddress || finalShippingAddress,
            totals: {
                subtotal: orderSummary.subtotal,
                discount: orderSummary.discount,
                shipping: orderSummary.shipping,
                tax: orderSummary.tax,
                grandTotal: orderSummary.total
            },
            status: 'placed',
            couponCode: cart.couponCode,
            notes
        });

        await order.save();

        // Create order history entry
        const orderHistory = new OrderHistory({
            orderId: order._id, status: 'placed', comment: 'Order placed successfully', updatedBy: userId || 'system'
        });

        await orderHistory.save();

        // Create notification log
        if (userId) {
            const notification = new NotificationLog({
                userId, type: 'email', template: 'order_confirmation', orderId: order._id, status: 'sent'
            });
            await notification.save();
        }

        // Clear the cart
        cart.items = [];
        cart.couponCode = null;
        cart.discount = 0;
        cart.cartTotal = 0;
        await cart.save();

        return res.status(201).json({
            success: true, message: 'Order created successfully', data: {
                orderId: order._id, orderNumber: order.orderNumber
            }
        });
    } catch (error) {
        console.error('Create order error:', error);
        return res.status(500).json({
            success: false, message: 'Error creating order', error: error.message
        });
    }
};
/**
 * Get order by ID
 */
exports.getOrderById = async (req, res) => {
    try {
        const {id} = req.params;
        const userId = req.user?.id;

        // Admin can view any order, users can only view their own
        const query = req.isAdmin ? {_id: id} : {_id: id, userId};

        const order = await Order.findOne(query)
            // Populate product and brand/category/gallery
            .populate({
                path: 'items.productId',
                model: 'Product',
                select: 'title slug description sku thumbnail images brandId categoryIds type status isFeatured',
            })
            .populate({
                path: 'items.productId.brandId', model: 'Brand', select: 'name logo',
            })
            .populate({
                path: 'items.productId.categoryIds', model: 'Category', select: 'name slug',
            })
            .populate({
                path: 'items.productId.gallery', model: 'ProductGallery', select: 'images videos',
            })
            // Populate variant details
            .populate({
                path: 'items.variantId', model: 'ProductVariant', select: 'attributes price stock sku images',
            })
            // Populate user details
            .populate({
                path: 'userId', model: 'User', select: 'name email phone',
            })
            .lean();

        if (!order) {
            return res.status(404).json({
                success: false, message: 'Order not found'
            });
        }
        // console.log(order)
        // Transform order for frontend display
        const transformedOrder = await transformOrderData(order);

        // Get order history timeline
        const history = await OrderHistory.find({orderId: id})
            .sort({createdAt: 1})
            .lean();

        return res.status(200).json({
            success: true, data: transformedOrder, history
        });
    } catch (error) {
        console.error('Get order error:', error);
        return res.status(500).json({
            success: false, message: 'Error retrieving order', error: error.message
        });
    }
};

// Helper function to transform order data (same as in getUserOrders)
async function transformOrderData(order) {
    const items = order.items.map(item => {
        const product = item.productId || {};
        const variant = item.variantId || {};
        console.log(product)
        const productName = product.title || `Product ${item.productId}`;
        const brand = product.brandId?.name || null;
        const brandLogo = product.brandId?.logo || null;

        // Pick best available image
        const productImage = (variant.images && variant.images[0]) || (product.thumbnail) || (product.images && product.images[0]) || null;

        // Variant attributes (e.g. Size: M, Color: Red)
        const variantDescription = (variant.attributes || [])
            .map(attr => `${attr.name || attr.attribute}: ${attr.value}`)
            .join(', ');

        return {
            productId: product._id,
            variantId: variant._id || null,
            name: productName,
            brand,
            brandLogo,
            image: productImage,
            variantAttributes: variantDescription,
            sku: variant.sku || product.sku,
            quantity: item.quantity || 1,
            unitPrice: item.price || item.unitPrice || 0,
            finalPrice: item.total || item.finalPrice || (item.price && item.quantity ? item.price * item.quantity : 0),
            productDetails: {
                title: product.title,
                slug: product.slug,
                description: product.description,
                type: product.type,
                categoryIds: product.categoryIds?.map(c => ({
                    _id: c._id, name: c.name, slug: c.slug
                })),
                status: product.status,
                isFeatured: product.isFeatured,
                thumbnail: product.thumbnail,
                gallery: product.gallery || null
            }
        };
    });

    const totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);

    const totals = order.totals || {};
    const subtotal = totals.subtotal || order.subtotal || 0;
    const shipping = totals.shipping || order.shippingCost || 0;
    const tax = totals.tax || order.tax || 0;
    const discount = totals.discount || order.discount || 0;
    const couponDiscount = order.couponDiscount || 0;
    const grandTotal = totals.grandTotal || order.total || 0;

    const shippingAddress = order.shippingAddress || null;
    const billingAddress = order.billingAddress || null;

    const payment = {
        method: order.paymentMethod,
        status: order.paymentStatus,
        transactionId: order.transactionId,
        paidAmount: grandTotal,
        paymentDate: order.paymentDate || order.placedAt
    };

    const timeline = buildOrderTimeline(order);

    const user = order.userId ? {
        name: order.userId.name, email: order.userId.email, phone: order.userId.phone
    } : null;

    return {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        items,
        totalItems,
        priceBreakdown: {
            itemsTotal: subtotal, shipping, tax, discount, couponDiscount, grandTotal
        },
        coupon: order.couponCode ? {
            code: order.couponCode, discountValue: discount
        } : null,
        shippingAddress,
        billingAddress,
        payment,
        timeline,
        placedAt: order.placedAt,
        expectedDelivery: order.expectedDelivery,
        trackingNumber: order.trackingNumber,
        notes: order.notes,
        cancellationReason: order.cancellationReason,
        user,
        summary: {
            totalItems,
            totalAmount: grandTotal.toFixed(2),
            status: order.status,
            orderDate: order.placedAt ? new Date(order.placedAt).toLocaleDateString() : 'N/A'
        },
        originalTotals: totals,
        originalOrder: order
    };
}

function buildOrderTimeline(order) {
    const timeline = [];

    if (order.placedAt) timeline.push({event: 'Order Placed', date: order.placedAt, completed: true});
    if (['confirmed', 'processing'].includes(order.status)) timeline.push({
        event: 'Order Confirmed', date: order.confirmedAt || order.updatedAt, completed: true
    });
    if (order.status === 'shipped') timeline.push({
        event: 'Shipped', date: order.shippedAt || order.updatedAt, completed: true
    });
    if (order.status === 'delivered') timeline.push({
        event: 'Delivered', date: order.deliveredAt || order.updatedAt, completed: true
    });
    if (order.status === 'cancelled') timeline.push({
        event: 'Cancelled', date: order.cancelledAt || order.updatedAt, completed: true
    });

    if (!['shipped', 'delivered', 'cancelled'].includes(order.status)) timeline.push({
        event: 'Shipped', date: null, completed: false
    });
    if (!['delivered', 'cancelled'].includes(order.status)) timeline.push({
        event: 'Delivered', date: null, completed: false
    });

    return timeline;
}

/**
 * Get all orders for a user
 */
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {status, page = 1, limit = 10} = req.query;

        const skip = (page - 1) * limit;

        // Build query
        let query = {userId};
        if (status) {
            query.status = status;
        }

        // Fetch orders with full population
        const orders = await Order.find(query)
            .populate({
                path: 'items.productId',
                select: 'title images price mrp discount finalPrice brandId categoryIds description sku',
                populate: {
                    path: 'brandId', select: 'name logo'
                }
            })
            .populate({
                path: 'items.variantId', select: 'attributes price stock sku images'
            })
            .sort({placedAt: -1})
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Transform orders to match your data structure
        const transformedOrders = orders.map(order => {
            // Transform items with full product details
            const items = order.items.map(item => {
                const product = item.productId;
                const variant = item.variantId;

                // Get product name
                const productName = product?.title || product?.name || item.name || `Product ${item.productId}`;

                // Get product image
                let productImage = null;
                if (variant?.images && variant.images.length > 0) {
                    productImage = variant.images[0];
                } else if (product?.images && product.images.length > 0) {
                    productImage = product.images[0];
                }

                // Get variant attributes
                const variantAttributes = variant?.attributes || [];
                const variantDescription = variantAttributes.map(attr => `${attr.name || attr.attribute}: ${attr.value}`).join(', ');

                return {
                    productId: item.productId?._id || item.productId,
                    variantId: item.variantId?._id || item.variantId,
                    name: productName,
                    brand: product?.brandId?.name || null,
                    brandLogo: product?.brandId?.logo || null,
                    image: productImage,
                    variantAttributes: variantDescription,
                    sku: variant?.sku || product?.sku,
                    quantity: item.quantity || 1,
                    unitPrice: item.price || item.unitPrice || 0,
                    finalPrice: item.total || item.finalPrice || (item.price * item.quantity) || 0,
                    productDetails: {
                        title: product?.title,
                        description: product?.description,
                        categoryIds: product?.categoryIds,
                        originalPrice: product?.mrp || product?.price,
                        discount: product?.discount,
                        stock: product?.stock
                    }
                };
            });

            // Calculate total items count
            const totalItems = order.items.reduce((sum, item) => sum + (item.quantity || 1), 0);

            // Use totals from your order structure
            const totals = order.totals || {};
            const subtotal = totals.subtotal || order.subtotal || 0;
            const shippingCost = totals.shipping || order.shippingCost || 0;
            const tax = totals.tax || order.tax || 0;
            const discount = totals.discount || order.discount || 0;
            const grandTotal = totals.grandTotal || order.total || 0;

            // Shipping address details
            const shippingAddress = order.shippingAddress ? {
                name: order.shippingAddress.name,
                phone: order.shippingAddress.phone,
                address: order.shippingAddress.address,
                city: order.shippingAddress.city,
                state: order.shippingAddress.state,
                country: order.shippingAddress.country,
                pincode: order.shippingAddress.pincode,
                landmark: order.shippingAddress.landmark,
                addressType: order.shippingAddress.type || order.shippingAddress.addressType,
                isDefault: order.shippingAddress.isDefault
            } : null;

            // Billing address details
            const billingAddress = order.billingAddress ? {
                name: order.billingAddress.name,
                phone: order.billingAddress.phone,
                address: order.billingAddress.address,
                city: order.billingAddress.city,
                state: order.billingAddress.state,
                country: order.billingAddress.country,
                pincode: order.billingAddress.pincode,
                landmark: order.billingAddress.landmark,
                addressType: order.billingAddress.type || order.billingAddress.addressType,
                isDefault: order.billingAddress.isDefault
            } : null;

            // Payment details
            const paymentDetails = {
                method: order.paymentMethod,
                status: order.paymentStatus,
                transactionId: order.transactionId,
                paidAmount: grandTotal, // Use grandTotal as paid amount
                paymentDate: order.paymentDate || order.placedAt
            };

            // Order timeline based on status
            const orderTimeline = [];
            if (order.placedAt) {
                orderTimeline.push({
                    event: 'Order Placed', date: order.placedAt, completed: true
                });
            }

            // Add status-specific events
            if (order.status === 'confirmed' || order.status === 'processing') {
                orderTimeline.push({
                    event: 'Order Confirmed', date: order.confirmedAt || order.updatedAt, completed: true
                });
            }

            if (order.status === 'shipped') {
                orderTimeline.push({
                    event: 'Shipped', date: order.shippedAt || order.updatedAt, completed: true
                });
            }

            if (order.status === 'delivered') {
                orderTimeline.push({
                    event: 'Delivered', date: order.deliveredAt || order.updatedAt, completed: true
                });
            }

            if (order.status === 'cancelled') {
                orderTimeline.push({
                    event: 'Cancelled', date: order.cancelledAt || order.updatedAt, completed: true
                });
            }

            // Add pending events based on current status
            if (['placed', 'confirmed', 'processing'].includes(order.status)) {
                orderTimeline.push({
                    event: 'Shipped', date: null, completed: false
                });
            }

            if (['placed', 'confirmed', 'processing', 'shipped'].includes(order.status)) {
                orderTimeline.push({
                    event: 'Delivered', date: null, completed: false
                });
            }

            // Price breakdown using your totals structure
            const priceBreakdown = {
                itemsTotal: subtotal,
                shipping: shippingCost,
                tax: tax,
                discount: discount,
                couponDiscount: order.couponDiscount || 0,
                grandTotal: grandTotal
            };

            return {
                _id: order._id,
                orderNumber: order.orderNumber,
                status: order.status,
                items,
                totalItems,
                priceBreakdown,
                coupon: order.couponCode ? {
                    code: order.couponCode, name: order.couponCode, discountValue: discount
                } : null,
                shippingAddress,
                billingAddress,
                payment: paymentDetails,
                timeline: orderTimeline,
                placedAt: order.placedAt,
                expectedDelivery: order.expectedDelivery,
                trackingNumber: order.trackingNumber,
                notes: order.notes,
                cancellationReason: order.cancellationReason, // Summary for quick display
                summary: {
                    totalItems,
                    itemsCount: order.items.length,
                    totalAmount: `$${grandTotal.toFixed(2)}`,
                    status: order.status,
                    orderDate: order.placedAt ? new Date(order.placedAt).toLocaleDateString() : 'N/A'
                }, // Original totals for reference
                originalTotals: totals
            };
        });

        const total = await Order.countDocuments(query);
        // console.log(transformedOrders)
        return res.status(200).json({
            success: true,
            count: transformedOrders.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: transformedOrders
        });
    } catch (error) {
        console.error('Get user orders error:', error);
        return res.status(500).json({
            success: false, message: 'Error retrieving orders', error: error.message
        });
    }
};
/**
 * Get all orders (admin only)
 */
exports.getAllOrders = async (req, res) => {
    try {
        const {status, userId, page = 1, limit = 20} = req.query;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};
        if (status) query.status = status;
        if (userId) query.userId = userId;

        // Fetch multiple orders with deep population
        const orders = await Order.find(query)
            .populate({
                path: 'items.productId',
                model: 'Product',
                select: 'title slug description sku thumbnail images brandId categoryIds type status isFeatured',
                populate: [{path: 'brandId', model: 'Brand', select: 'name logo'}, {
                    path: 'categoryIds', model: 'Category', select: 'name slug'
                }, {path: 'gallery', model: 'ProductGallery', select: 'images videos'}]
            })
            .populate({
                path: 'items.variantId', model: 'ProductVariant', select: 'attributes price stock sku images'
            })
            .populate({
                path: 'userId', model: 'User', select: 'name email phone'
            })
            .sort({placedAt: -1})
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Transform orders
        const transformedOrders = orders.map(order => {
            const items = order.items.map(item => {
                const product = item.productId || {};
                const variant = item.variantId || {};

                const productImage = variant?.images?.[0] || product?.images?.[0] || product?.thumbnail || null;

                const variantAttributes = (variant?.attributes || [])
                    .map(attr => `${attr.name || attr.attribute}: ${attr.value}`)
                    .join(', ');

                return {
                    productId: product?._id,
                    variantId: variant?._id,
                    name: product?.title || 'Unnamed Product',
                    brand: product?.brandId?.name || null,
                    brandLogo: product?.brandId?.logo || null,
                    image: productImage,
                    sku: variant?.sku || product?.sku,
                    variantAttributes,
                    quantity: item.quantity || 1,
                    unitPrice: item.price || variant?.price || product?.finalPrice || 0,
                    finalPrice: item.total || item.finalPrice || (item.price * (item.quantity || 1)) || 0,
                    category: product?.categoryIds?.map(cat => cat.name).join(', ') || null,
                    description: product?.description || ''
                };
            });

            // Totals
            const totals = order.totals || {};
            const subtotal = totals.subtotal || order.subtotal || 0;
            const shipping = totals.shipping || order.shippingCost || 0;
            const tax = totals.tax || order.tax || 0;
            const discount = totals.discount || order.discount || 0;
            const grandTotal = totals.grandTotal || order.total || 0;

            // Helper for address
            const formatAddress = (addr) => addr ? ({
                name: addr.name,
                phone: addr.phone,
                address: addr.address,
                city: addr.city,
                state: addr.state,
                country: addr.country,
                pincode: addr.pincode,
                landmark: addr.landmark,
                addressType: addr.type || addr.addressType,
                isDefault: addr.isDefault
            }) : null;

            // Build timeline
            const timeline = [];
            const statusSteps = ['placed', 'confirmed', 'shipped', 'delivered'];
            const statusNames = {
                placed: 'Order Placed',
                confirmed: 'Order Confirmed',
                shipped: 'Shipped',
                delivered: 'Delivered',
                cancelled: 'Cancelled'
            };

            for (const step of statusSteps) {
                timeline.push({
                    event: statusNames[step],
                    date: order[`${step}At`] || (order.status === step ? order.updatedAt : null),
                    completed: statusSteps.indexOf(order.status) >= statusSteps.indexOf(step)
                });
            }

            if (order.status === 'cancelled') {
                timeline.push({
                    event: 'Cancelled', date: order.cancelledAt || order.updatedAt, completed: true
                });
            }

            return {
                _id: order._id,
                orderNumber: order.orderNumber,
                user: {
                    id: order.userId?._id,
                    name: order.userId?.name,
                    email: order.userId?.email,
                    phone: order.userId?.phone
                },
                status: order.status,
                placedAt: order.placedAt,
                expectedDelivery: order.expectedDelivery,
                trackingNumber: order.trackingNumber,
                notes: order.notes,
                cancellationReason: order.cancellationReason,
                items,
                totals: {
                    subtotal, shipping, tax, discount, grandTotal
                },
                coupon: order.couponCode ? {
                    code: order.couponCode, discountValue: order.couponDiscount || discount
                } : null,
                shippingAddress: formatAddress(order.shippingAddress),
                billingAddress: formatAddress(order.billingAddress),
                payment: {
                    method: order.paymentMethod,
                    status: order.paymentStatus,
                    transactionId: order.transactionId,
                    amount: grandTotal,
                    date: order.paymentDate || order.placedAt
                },
                timeline
            };
        });

        const total = await Order.countDocuments(query);

        return res.status(200).json({
            success: true,
            count: transformedOrders.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: transformedOrders
        });
    } catch (error) {
        console.error('Get all orders error:', error);
        return res.status(500).json({
            success: false, message: 'Error retrieving orders', error: error.message
        });
    }
};

/**
 * Update order status (admin only)
 */
exports.updateOrderStatus = async (req, res) => {
    try {
        const {id} = req.params;
        const {status, comment} = req.body;
        const adminId = req.user?.id;

        // Validate status
        const validStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false, message: 'Invalid status value'
            });
        }

        // Find and update order
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false, message: 'Order not found'
            });
        }

        order.status = status;
        await order.save();

        // Create order history entry
        const orderHistory = new OrderHistory({
            orderId: id, status, comment: comment || `Order status updated to ${status}`, updatedBy: adminId || 'system'
        });

        await orderHistory.save();

        // Create notification log if user exists
        if (order.userId) {
            const notification = new NotificationLog({
                userId: order.userId, type: 'email', template: `order_${status}`, orderId: id, status: 'sent'
            });
            await notification.save();
        }

        return res.status(200).json({
            success: true, message: 'Order status updated successfully', data: {
                orderId: id, status
            }
        });
    } catch (error) {
        console.error('Update order status error:', error);
        return res.status(500).json({
            success: false, message: 'Error updating order status', error: error.message
        });
    }
};

/**
 * Generate order summary from cart
 */
exports.generateOrderSummary = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {cartId, shippingAddress, addressId} = req.body;
        console.log(req.body);

        // Build base query for cart
        const cartQuery = {_id: cartId, $or: [{userId}, {userId: null}]};

        // Try to populate with Variant model, if it exists
        let cart;
        try {
            cart = await Cart.findOne(cartQuery)
                .populate({
                    path: 'items.productId',
                    select: 'title name images price mrp discount finalPrice brandId categoryIds description',
                    populate: {
                        path: 'brandId', select: 'name logo'
                    }
                })
                .populate({
                    path: 'items.variantId', select: 'attributes price stock sku images'
                });
        } catch (populateError) {
            // If Variant population fails, try without variant population
            console.log('Variant population failed, trying without variant population:', populateError.message);
            cart = await Cart.findOne(cartQuery)
                .populate({
                    path: 'items.productId',
                    select: 'title name images price mrp discount finalPrice brandId categoryIds description',
                    populate: {
                        path: 'brandId', select: 'name logo'
                    }
                });
        }

        if (!cart) {
            return res.status(404).json({
                success: false, message: 'Cart not found'
            });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({
                success: false, message: 'Cart is empty'
            });
        }

        // Calculate subtotal from cart items and prepare detailed items
        let subtotal = 0;
        const detailedItems = cart.items.map((item) => {
            const product = item.productId;

            // Handle case where variantId might not be populated
            const variant = item.variantId;

            // Get product name
            let productName = product?.title || product?.name || `Product ${item.productId}`;

            // Get product image
            let productImage = null;
            if (variant?.images && variant.images.length > 0) {
                productImage = variant.images[0];
            } else if (product?.images && product.images.length > 0) {
                productImage = product.images[0];
            }

            // Determine price - variant price takes precedence, then product price
            const unitPrice = variant?.price || product?.finalPrice || product?.price || item.price || 0;
            const finalPrice = unitPrice * item.quantity;

            // Add to subtotal
            subtotal += finalPrice;

            // Get brand name if available
            const brandName = product?.brandId?.name || null;
            const brandLogo = product?.brandId?.logo || null;

            // Get variant attributes if available
            const variantAttributes = variant?.attributes || [];
            const variantDescription = variantAttributes.map(attr => `${attr.name || attr.attribute}: ${attr.value}`).join(', ');

            return {
                productId: item.productId?._id || item.productId,
                variantId: item.variantId?._id || item.variantId || null,
                name: productName,
                brand: brandName,
                brandLogo: brandLogo,
                image: productImage,
                variantAttributes: variantDescription,
                sku: variant?.sku || product?.sku,
                quantity: item.quantity,
                unitPrice: unitPrice,
                finalPrice: finalPrice,
                stock: variant?.stock || product?.stock,
                productDetails: {
                    title: product?.title,
                    description: product?.description,
                    categoryIds: product?.categoryIds,
                    originalPrice: product?.mrp || product?.price,
                    discount: product?.discount
                }
            };
        });

        // Resolve shipping address via addressId if provided
        let resolvedShippingAddress = shippingAddress;
        if (!resolvedShippingAddress && addressId && userId) {
            const addr = await UserAddress.findOne({_id: addressId, userId}).lean();
            if (!addr) {
                return res.status(404).json({
                    success: false, message: 'Address not found'
                });
            }
            resolvedShippingAddress = {
                name: addr.name,
                phone: addr.phone,
                addressLine1: addr.address,
                city: addr.city,
                state: addr.state,
                country: addr.country,
                pincode: addr.pincode,
                landmark: addr.landmark,
                addressType: addr.addressType
            };
        }

        // Calculate shipping cost
        let shippingCost = 0;
        if (resolvedShippingAddress) {
            const {country, state, pincode} = resolvedShippingAddress;

            // Find applicable shipping rule
            const shippingRule = await ShippingRule.findOne({
                minOrderValue: {$lte: subtotal},
                maxOrderValue: {$gte: subtotal},
                country,
                state,
                postalCodes: pincode,
                status: true
            });

            if (shippingRule) {
                shippingCost = shippingRule.shippingCost;
            } else {
                // Default shipping rule
                const defaultRule = await ShippingRule.findOne({
                    status: true
                }).sort({shippingCost: 1});

                if (defaultRule) {
                    shippingCost = defaultRule.shippingCost;
                }
            }
        }

        // Calculate tax (example: 5% of subtotal)
        const taxRate = 0.05;
        const tax = subtotal * taxRate;

        // Calculate total
        const total = subtotal + shippingCost + tax - (cart.discount || 0);

        // Calculate total items count
        const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

        // Create or update order summary
        let orderSummary = await OrderSummary.findOne({cartId});

        const summaryData = {
            cartId,
            userId: userId || null,
            items: detailedItems,
            subtotal,
            shipping: shippingCost,
            discount: cart.discount || 0,
            tax,
            total,
            totalItems,
            shippingAddress: resolvedShippingAddress,
            priceBreakdown: {
                itemsTotal: subtotal, shipping: shippingCost, tax: tax, discount: cart.discount || 0, grandTotal: total
            }
        };

        if (orderSummary) {
            orderSummary = await OrderSummary.findByIdAndUpdate(orderSummary._id, summaryData, {new: true});
        } else {
            orderSummary = new OrderSummary(summaryData);
            await orderSummary.save();
        }

        return res.status(200).json({
            success: true, message: 'Order summary generated successfully', data: {
                ...orderSummary.toObject(), summary: {
                    totalItems,
                    subtotal: `$${subtotal.toFixed(2)}`,
                    shipping: `$${shippingCost.toFixed(2)}`,
                    tax: `$${tax.toFixed(2)}`,
                    discount: `$${(cart.discount || 0).toFixed(2)}`,
                    total: `$${total.toFixed(2)}`
                }
            }
        });
    } catch (error) {
        console.error('Generate order summary error:', error);
        return res.status(500).json({
            success: false, message: 'Error generating order summary', error: error.message
        });
    }
};


/**
 * Request order return
 */
exports.requestReturn = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {orderId, items, reason, resolution} = req.body;

        // Validate order belongs to user
        const order = await Order.findOne({_id: orderId, userId});
        if (!order) {
            return res.status(404).json({
                success: false, message: 'Order not found or does not belong to user'
            });
        }

        // Validate order status
        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false, message: 'Only delivered orders can be returned'
            });
        }

        // Create return request
        const returnRequest = new OrderReturn({
            orderId,
            userId,
            items,
            reason: reason || '',
            resolution: resolution && ['refund', 'replacement'].includes(resolution) ? resolution : 'refund',
            status: 'requested'
        });

        await returnRequest.save();

        // Create order history entry
        const orderHistory = new OrderHistory({
            orderId, status: 'return_requested', comment: reason || 'Return requested by customer', updatedBy: userId
        });

        await orderHistory.save();

        return res.status(201).json({
            success: true, message: 'Return request submitted successfully', data: returnRequest
        });
    } catch (error) {
        console.error('Request return error:', error);
        return res.status(500).json({
            success: false, message: 'Error requesting return', error: error.message
        });
    }
};

/**
 * Request order replacement
 */
exports.requestReplacement = async (req, res) => {
    try {
        const userId = req.user?.id;
        const {orderId, items, reason} = req.body;

        // Validate order belongs to user
        const order = await Order.findOne({_id: orderId, userId});
        if (!order) {
            return res.status(404).json({
                success: false, message: 'Order not found or does not belong to user'
            });
        }

        // Validate order status
        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false, message: 'Only delivered orders can request replacement'
            });
        }

        // Create replacement request
        const replacementRequest = new OrderReplacement({
            orderId, userId, items, reason, status: 'requested'
        });

        await replacementRequest.save();

        // Create order history entry
        const orderHistory = new OrderHistory({
            orderId,
            status: 'replacement_requested',
            comment: reason || 'Replacement requested by customer',
            updatedBy: userId
        });

        await orderHistory.save();

        return res.status(201).json({
            success: true, message: 'Replacement request submitted successfully', data: replacementRequest
        });
    } catch (error) {
        console.error('Request replacement error:', error);
        return res.status(500).json({
            success: false, message: 'Error requesting replacement', error: error.message
        });
    }
};

/**
 * Process return/replacement request (admin only)
 */
exports.processReturnReplacement = async (req, res) => {
    try {
        const {id, type} = req.params;
        const {status, comment, mode, amount} = req.body;
        const adminId = req.user?.id;

        // Validate type
        if (!['return', 'replacement'].includes(type)) {
            return res.status(400).json({
                success: false, message: 'Invalid request type'
            });
        }

        // Validate status
        const validStatuses = type === 'return' ? ['approved', 'rejected', 'refunded'] : ['approved', 'rejected', 'shipped', 'completed'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false, message: 'Invalid status value'
            });
        }

        // Find and update request
        let request;
        if (type === 'return') {
            request = await OrderReturn.findById(id);
        } else {
            request = await OrderReplacement.findById(id);
        }

        if (!request) {
            return res.status(404).json({
                success: false, message: `${type.charAt(0).toUpperCase() + type.slice(1)} request not found`
            });
        }

        request.status = status;
        await request.save();

        // If return is marked refunded, record refund transaction
        if (type === 'return' && status === 'refunded') {
            const refundAmount = typeof amount === 'number' && amount >= 0 ? amount : request.refundAmount || 0;
            const refundMode = mode && ['wallet', 'bank'].includes(mode) ? mode : 'wallet';

            // Create refund record
            await Refund.create({
                returnId: request._id,
                userId: request.userId,
                orderId: request.orderId,
                mode: refundMode,
                amount: refundAmount,
                transactionId: `RMA${Date.now()}${Math.floor(Math.random() * 1000)}`,
                status: 'completed'
            });

            // Update return request with admin note
            request.adminNote = comment || request.adminNote;
            request.refundAmount = refundAmount;
            request.processedAt = new Date();
            await request.save();
        }

        // Create order history entry
        const orderHistory = new OrderHistory({
            orderId: request.orderId,
            status: `${type}_${status}`,
            comment: comment || `${type.charAt(0).toUpperCase() + type.slice(1)} request ${status}`,
            updatedBy: adminId || 'system'
        });

        await orderHistory.save();

        // Create notification log
        if (request.userId) {
            const notification = new NotificationLog({
                userId: request.userId,
                type: 'email',
                template: `${type}_${status}`,
                orderId: request.orderId,
                status: 'sent'
            });
            await notification.save();
        }

        return res.status(200).json({
            success: true,
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} request updated successfully`,
            data: request
        });
    } catch (error) {
        console.error('Process return/replacement error:', error);
        return res.status(500).json({
            success: false, message: 'Error processing request', error: error.message
        });
    }
};

/**
 * Create order directly (admin only)
 */
exports.createAdminOrder = async (req, res) => {
    try {
        const {
            userId = null,
            items = [],
            paymentMethod,
            shippingAddress,
            billingAddress,
            totals,
            couponCode = null,
            status = 'placed'
        } = req.body;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({success: false, message: 'Items array is required'});
        }
        if (!paymentMethod) {
            return res.status(400).json({success: false, message: 'Payment method is required'});
        }
        if (!shippingAddress || typeof shippingAddress !== 'object') {
            return res.status(400).json({success: false, message: 'Shipping address is required'});
        }

        // Normalize items
        const normalizedItems = items.map((it) => {
            const qty = Number(it.quantity || 0);
            const unit = Number(it.price || 0);
            const lineTotal = Number(it.total != null ? it.total : unit * qty);
            return {
                productId: it.productId,
                variantId: it.variantId || null,
                name: it.name || `Product ${it.productId}`,
                quantity: qty,
                price: unit,
                total: lineTotal
            };
        });

        // Compute order totals
        const subtotal = normalizedItems.reduce((sum, it) => sum + Number(it.total || 0), 0);
        const discount = Number(totals?.discount || 0);
        const shipping = Number(totals?.shipping || 0);
        const tax = Number(totals?.tax || 0);
        const grandTotal = totals?.grandTotal != null ? Number(totals.grandTotal) : Number((subtotal - discount + shipping + tax).toFixed(2));

        const calcTotals = {
            subtotal: Number(subtotal.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            grandTotal: Number(grandTotal.toFixed(2))
        };

        const order = new Order({
            userId,
            items: normalizedItems,
            paymentMethod,
            paymentStatus: paymentMethod.toLowerCase() === 'cod' ? 'cod' : 'pending',
            shippingAddress,
            billingAddress: billingAddress || shippingAddress,
            totals: calcTotals,
            status,
            couponCode
        });

        await order.save();

        // Create order history
        try {
            const history = new OrderHistory({
                orderId: order._id,
                status: order.status,
                comment: 'Order created by admin',
                updatedBy: req.user?.id || 'system'
            });
            await history.save();
        } catch (e) {
            console.error('Failed to create order history:', e?.message || e);
        }

        return res.status(201).json({
            success: true, message: 'Order created successfully', data: order
        });
    } catch (error) {
        console.error('Create admin order error:', error);
        return res.status(500).json({
            success: false, message: 'Error creating order', error: error.message
        });
    }
};

/**
 * Send invoice to customer
 */
exports.sendInvoice = async (req, res) => {
    try {
        const {id} = req.params;
        const order = await Order.findById(id).lean();
        if (!order) {
            return res.status(404).json({success: false, message: 'Order not found'});
        }

        // Resolve recipient
        const user = order.userId ? await User.findById(order.userId).lean() : null;
        const recipientEmail = user?.email;
        if (!recipientEmail) {
            await new NotificationLog({
                userId: order.userId, type: 'email', template: 'invoice', orderId: id, status: 'failed',
            }).save();
            return res.status(400).json({success: false, message: 'User email not available'});
        }

        // Create email transporter
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: String(process.env.EMAIL_PORT) === '465',
            auth: {
                user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Generate invoice HTML
        const placedAt = order.placedAt || order.createdAt || order.updatedAt;
        const placedStr = placedAt ? new Date(placedAt).toLocaleString() : '';
        const grandTotal = order?.totals?.grandTotal ?? 0;
        const number = order.orderNumber || String(order._id || id);
        const itemsHtml = Array.isArray(order.items) ? order.items
            .map((it, idx) => `
                    <tr>
                        <td>${String(idx + 1).padStart(2, '0')}</td>
                        <td>${it.name || 'Product'}</td>
                        <td>${it.quantity || 1}</td>
                        <td>₹${Number(it.price || 0).toFixed(2)}</td>
                        <td>₹${Number(it.total || 0).toFixed(2)}</td>
                    </tr>
                `).join('') : '';

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `Invoice #${number} - ₹${Number(grandTotal).toFixed(2)}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
                    <h2 style="margin-bottom:8px;">Invoice #${number}</h2>
                    <p style="margin-top:0;color:#555;">Date Issued: ${placedStr}</p>
                    <table cellpadding="8" cellspacing="0" border="1" style="width:100%; border-collapse: collapse; font-size: 14px;">
                        <thead>
                            <tr style="background:#f7f7f7;">
                                <th>#</th>
                                <th>Item</th>
                                <th>Qty</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    <p style="text-align:right; font-weight:600; margin-top:12px;">Grand Total: ₹${Number(grandTotal).toFixed(2)}</p>
                    <p style="color:#777; font-size:13px;">Thank you for your purchase!</p>
                </div>
            `,
        };

        let sent = false;
        try {
            await transporter.sendMail(mailOptions);
            sent = true;
        } catch (err) {
            console.error('Email send error:', err);
            sent = false;
        }

        // Log notification result
        await new NotificationLog({
            userId: order.userId, type: 'email', template: 'invoice', orderId: id, status: sent ? 'sent' : 'failed',
        }).save();

        if (sent) {
            return res.status(200).json({success: true, message: 'Invoice email sent successfully'});
        } else {
            return res.status(500).json({success: false, message: 'Failed to send invoice email'});
        }
    } catch (error) {
        console.error('Send invoice error:', error);
        return res.status(500).json({
            success: false, message: 'Error sending invoice', error: error.message
        });
    }
};