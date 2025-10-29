const Order = require('../../models/orders/orderModel');
const Cart = require('../../models/cartManagement/cartModel');
const OrderSummary = require('../../models/orders/orderSummaryModel');
const OrderHistory = require('../../models/orders/orderHistoryModel');
const OrderReturn = require('../../models/orders/orderReturnModel');
const OrderReplacement = require('../../models/orders/orderReplacementModel');
const NotificationLog = require('../../models/notifications/notificationLogModel');
const ShippingRule = require('../../models/shipping/shippingRuleModel');
const UserAddress = require('../../models/shipping/userAddressModel');
/**
 * Create a new order from cart
 */
exports.createOrder = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            cartId,
            paymentMethod,
            shippingAddress,
            addressId,
            billingAddress = null, // Optional, defaults to shipping address
            notes = ''
        } = req.body;

        // Find the cart
        const cart = await Cart.findOne({_id: cartId, userId});
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found or does not belong to user'
            });
        }

        // Get order summary
        const orderSummary = await OrderSummary.findOne({cartId});
        if (!orderSummary) {
            return res.status(404).json({
                success: false,
                message: 'Order summary not found. Please generate summary first.'
            });
        }

        // Resolve shipping address if addressId provided
        let finalShippingAddress = shippingAddress;
        if (!finalShippingAddress && addressId) {
            const addr = await UserAddress.findOne({_id: addressId, userId}).lean();
            if (!addr) {
                return res.status(404).json({
                    success: false,
                    message: 'Address not found'
                });
            }
            finalShippingAddress = {
                name: addr.name,
                phone: addr.phone,
                address: addr.address,
                city: addr.city,
                state: addr.state,
                postalCode: addr.pincode,
                country: addr.country,
            };
        }

        // Create new order
        const order = new Order({
            userId,
            items: cart.items,
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
            orderId: order._id,
            status: 'placed',
            comment: 'Order placed successfully',
            updatedBy: userId
        });

        await orderHistory.save();

        // Create notification log
        const notification = new NotificationLog({
            userId,
            type: 'email',
            template: 'order_confirmation',
            orderId: order._id,
            status: 'sent'
        });

        await notification.save();

        // Clear the cart
        cart.items = [];
        cart.couponCode = null;
        cart.discount = 0;
        cart.cartTotal = 0;
        await cart.save();

        return res.status(201).json({
            success: true,
            message: 'Order created successfully',
            data: {
                orderId: order._id,
                orderNumber: order.orderNumber
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error creating order',
            error: error.message
        });
    }
};

/**
 * Get order by ID
 */
exports.getOrderById = async (req, res) => {
    try {
        const {id} = req.params;
        const userId = req.user.id;

        // Find order - admins can view any order, users can only view their own
        const query = req.isAdmin ? {_id: id} : {_id: id, userId};
        const order = await Order.findOne(query);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Get order history
        const history = await OrderHistory.find({orderId: id}).sort({createdAt: 1});

        return res.status(200).json({
            success: true,
            data: {
                order,
                history
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving order',
            error: error.message
        });
    }
};

/**
 * Get all orders for a user
 */
exports.getUserOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const {status, page = 1, limit = 10} = req.query;

        const skip = (page - 1) * limit;

        // Build query
        let query = {userId};
        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .sort({placedAt: -1})
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        return res.status(200).json({
            success: true,
            count: orders.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: orders
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving orders',
            error: error.message
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
        let query = {};
        if (status) query.status = status;
        if (userId) query.userId = userId;

        const orders = await Order.find(query)
            .sort({placedAt: -1})
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(query);

        return res.status(200).json({
            success: true,
            count: orders.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            data: orders
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving orders',
            error: error.message
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
        const adminId = req.user.id;

        // Validate status
        const validStatuses = ['processing', 'shipped', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        // Find and update order
        const order = await Order.findById(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        order.status = status;
        await order.save();

        // Create order history entry
        const orderHistory = new OrderHistory({
            orderId: id,
            status,
            comment: comment || `Order status updated to ${status}`,
            updatedBy: adminId
        });

        await orderHistory.save();

        // Create notification log
        const notification = new NotificationLog({
            userId: order.userId,
            type: 'email',
            template: `order_${status}`,
            orderId: id,
            status: 'sent'
        });

        await notification.save();

        return res.status(200).json({
            success: true,
            message: 'Order status updated successfully',
            data: {
                orderId: id,
                status
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating order status',
            error: error.message
        });
    }
};

/**
 * Generate order summary from cart
 */
exports.generateOrderSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const {cartId, shippingAddress, addressId} = req.body;

        // Find the cart
        const cart = await Cart.findOne({_id: cartId, userId});
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Cart not found or does not belong to user'
            });
        }

        if (cart.items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Cart is empty'
            });
        }

        // Calculate subtotal
        const subtotal = cart.cartTotal;

        // Resolve shipping address via addressId if provided
        let resolvedShippingAddress = shippingAddress;
        if (!resolvedShippingAddress && addressId) {
            const addr = await UserAddress.findOne({_id: addressId, userId}).lean();
            if (!addr) {
                return res.status(404).json({success: false, message: 'Address not found'});
            }
            resolvedShippingAddress = {
                name: addr.name,
                phone: addr.phone,
                address: addr.address,
                city: addr.city,
                state: addr.state,
                postalCode: addr.pincode,
                country: addr.country,
            };
        }

        // Calculate shipping cost
        let shippingCost = 0;
        if (resolvedShippingAddress) {
            const {country, state, postalCode} = resolvedShippingAddress;

            // Find applicable shipping rule
            const shippingRule = await ShippingRule.findOne({
                minOrderValue: {$lte: subtotal},
                maxOrderValue: {$gte: subtotal},
                country,
                state,
                postalCodes: postalCode,
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
        const total = subtotal + shippingCost + tax - cart.discount;

        // Create or update order summary
        let orderSummary = await OrderSummary.findOne({cartId});

        if (orderSummary) {
            orderSummary.items = cart.items;
            orderSummary.subtotal = subtotal;
            orderSummary.shipping = shippingCost;
            orderSummary.discount = cart.discount;
            orderSummary.tax = tax;
            orderSummary.total = total;
        } else {
            orderSummary = new OrderSummary({
                cartId,
                userId,
                items: cart.items,
                subtotal,
                shipping: shippingCost,
                discount: cart.discount,
                tax,
                total
            });
        }

        await orderSummary.save();

        return res.status(200).json({
            success: true,
            message: 'Order summary generated successfully',
            data: orderSummary
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error generating order summary',
            error: error.message
        });
    }
};

/**
 * Request order return
 */
exports.requestReturn = async (req, res) => {
    try {
        const userId = req.user.id;
        const {orderId, items, reason} = req.body;

        // Validate order belongs to user
        const order = await Order.findOne({_id: orderId, userId});
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or does not belong to user'
            });
        }

        // Validate order status
        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Only delivered orders can be returned'
            });
        }

        // Create return request
        const returnRequest = new OrderReturn({
            orderId,
            userId,
            items,
            status: 'requested'
        });

        await returnRequest.save();

        // Create order history entry
        const orderHistory = new OrderHistory({
            orderId,
            status: 'return_requested',
            comment: reason || 'Return requested by customer',
            updatedBy: userId
        });

        await orderHistory.save();

        return res.status(201).json({
            success: true,
            message: 'Return request submitted successfully',
            data: returnRequest
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error requesting return',
            error: error.message
        });
    }
};

/**
 * Request order replacement
 */
exports.requestReplacement = async (req, res) => {
    try {
        const userId = req.user.id;
        const {orderId, items, reason} = req.body;

        // Validate order belongs to user
        const order = await Order.findOne({_id: orderId, userId});
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or does not belong to user'
            });
        }

        // Validate order status
        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Only delivered orders can request replacement'
            });
        }

        // Create replacement request
        const replacementRequest = new OrderReplacement({
            orderId,
            userId,
            items,
            reason,
            status: 'requested'
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
            success: true,
            message: 'Replacement request submitted successfully',
            data: replacementRequest
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error requesting replacement',
            error: error.message
        });
    }
};

/**
 * Process return/replacement request (admin only)
 */
exports.processReturnReplacement = async (req, res) => {
    try {
        const {id, type} = req.params;
        const {status, comment} = req.body;
        const adminId = req.user.id;

        // Validate type
        if (!['return', 'replacement'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid request type'
            });
        }

        // Validate status
        const validStatuses = type === 'return'
            ? ['approved', 'rejected', 'refunded']
            : ['approved', 'rejected', 'shipped', 'completed'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
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
                success: false,
                message: `${type.charAt(0).toUpperCase() + type.slice(1)} request not found`
            });
        }

        request.status = status;
        await request.save();

        // Create order history entry
        const orderHistory = new OrderHistory({
            orderId: request.orderId,
            status: `${type}_${status}`,
            comment: comment || `${type.charAt(0).toUpperCase() + type.slice(1)} request ${status}`,
            updatedBy: adminId
        });

        await orderHistory.save();

        // Create notification log
        const notification = new NotificationLog({
            userId: request.userId,
            type: 'email',
            template: `${type}_${status}`,
            orderId: request.orderId,
            status: 'sent'
        });

        await notification.save();

        return res.status(200).json({
            success: true,
            message: `${type.charAt(0).toUpperCase() + type.slice(1)} request updated successfully`,
            data: request
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error processing request',
            error: error.message
        });
    }
};