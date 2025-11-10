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
const nodemailer = require('nodemailer');

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
        console.log(req.body)
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
        const {orderId, items, reason, resolution} = req.body;

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
            reason: reason || '',
            resolution: resolution && ['refund', 'replacement'].includes(resolution) ? resolution : 'refund',
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
        const {status, comment, mode, amount} = req.body;
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

        // If return is marked refunded, record refund transaction
        if (type === 'return' && status === 'refunded') {
            const refundAmount = typeof amount === 'number' && amount >= 0
                ? amount
                : request.refundAmount || 0;
            const refundMode = mode && ['wallet', 'bank'].includes(mode) ? mode : 'wallet';
            // persist refund record for audit
            await Refund.create({
                returnId: request._id,
                userId: request.userId,
                orderId: request.orderId,
                mode: refundMode,
                amount: refundAmount,
                transactionId: `RMA${Date.now()}${Math.floor(Math.random() * 1000)}`,
                status: 'completed'
            });
            // annotate admin note and processedAt on return
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

// Admin: create order directly
exports.createAdminOrder = async (req, res) => {
    // try {
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
        console.log(req.body)
        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ success: false, message: 'Items array is required' });
        }
        if (!paymentMethod) {
            return res.status(400).json({ success: false, message: 'Payment method is required' });
        }
        if (!shippingAddress || typeof shippingAddress !== 'object') {
            return res.status(400).json({ success: false, message: 'Shipping address is required' });
        }

        // Normalize items: ensure numeric price/quantity and compute line totals
        const normalizedItems = items.map((it) => {
            const qty = Number(it.quantity || 0);
            const unit = Number(it.price || 0);
            const lineTotal = Number(it.total != null ? it.total : unit * qty);
            return {
                ...it,
                quantity: qty,
                price: unit,
                total: lineTotal
            };
        });
        console.log("hy1")

        // Compute order totals robustly
        const subtotal = normalizedItems.reduce((sum, it) => sum + Number(it.total || 0), 0);
        const discount = Number(totals?.discount || 0);
        const shipping = Number(totals?.shipping || 0);
        const tax = Number(totals?.tax || 0);
        const grandTotal = totals?.grandTotal != null
            ? Number(totals.grandTotal)
            : Number((subtotal - discount + shipping + tax).toFixed(2));
        console.log("hy2")

        const calcTotals = {
            subtotal: Number(subtotal.toFixed(2)),
            discount: Number(discount.toFixed(2)),
            shipping: Number(shipping.toFixed(2)),
            tax: Number(tax.toFixed(2)),
            grandTotal: Number(grandTotal.toFixed(2))
        };
        console.log("hy3")

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
        console.log("hy")
        // Create order history safely (avoid 500 if updatedBy is unavailable)
        try {
            const history = new OrderHistory({
                orderId: order._id,
                status: order.status,
                comment: 'Order created by admin',
                updatedBy: req.user && req.user.id ? req.user.id : order.userId
            });
            await history.save();
        } catch (e) {
            // Log but don't fail the order creation
            console.error('Failed to create order history:', e?.message || e);
        }

        return res.status(201).json({ success: true, data: order });
    // } catch (error) {
    //     return res.status(500).json({ success: false, message: 'Error creating order', error: error.message });
    // }
};

// Admin: send invoice to customer (email) and log per NotificationLog schema
exports.sendInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id).lean();
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Resolve recipient
        const user = order.userId ? await User.findById(order.userId).lean() : null;
        const recipientEmail = user?.email;
        if (!recipientEmail) {
            // Log as failed when no email present
            await new NotificationLog({
                userId: order.userId,
                type: 'email',
                template: 'invoice',
                orderId: id,
                status: 'failed',
            }).save();
            return res.status(400).json({ success: false, message: 'User email not available' });
        }

        // Create transporter from env
        const transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            host: process.env.EMAIL_HOST,
            port: Number(process.env.EMAIL_PORT) || 587,
            secure: String(process.env.EMAIL_PORT) === '465',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASSWORD,
            },
        });

        // Basic HTML invoice summary
        const placedAt = order.placedAt || order.createdAt || order.updatedAt;
        const placedStr = placedAt ? new Date(placedAt).toLocaleString() : '';
        const grandTotal = order?.totals?.grandTotal ?? order?.totals?.total ?? 0;
        const number = order.orderNumber || order.number || String(order._id || id);
        const itemsHtml = Array.isArray(order.items)
            ? order.items
                .map((it, idx) => `<tr><td>${String(idx + 1).padStart(2, '0')}</td><td>${it.name || it.title || it.sku || '—'}</td><td>${it.quantity || it.qty || 1}</td><td>${Number(it.price || 0).toFixed(2)}</td></tr>`)
                .join('')
            : '';

        const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: recipientEmail,
            subject: `Invoice #${String(number).slice(-6)} - ${Number(grandTotal).toFixed(2)}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto;">
                  <h2 style="margin-bottom:8px;">Invoice #${String(number).slice(-6)}</h2>
                  <p style="margin-top:0;color:#555;">Date Issued: ${placedStr}</p>
                  <table cellpadding="8" cellspacing="0" border="1" style="width:100%; border-collapse: collapse; font-size: 14px;">
                    <thead>
                      <tr style="background:#f7f7f7;"><th>SL</th><th>Item</th><th>Qty</th><th>Unit Price</th></tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
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
            sent = false;
        }

        // Log Notification result per schema
        await new NotificationLog({
            userId: order.userId,
            type: 'email',
            template: 'invoice',
            orderId: id,
            status: sent ? 'sent' : 'failed',
        }).save();

        if (sent) {
            return res.status(200).json({ success: true, message: 'Invoice email sent successfully' });
        } else {
            return res.status(500).json({ success: false, message: 'Failed to send invoice email' });
        }
    } catch (error) {
        // Attempt to log failure if order was resolved
        try {
            const id = req?.params?.id;
            const order = id ? await Order.findById(id).lean() : null;
            if (order) {
                await new NotificationLog({
                    userId: order.userId,
                    type: 'email',
                    template: 'invoice',
                    orderId: id,
                    status: 'failed',
                }).save();
            }
        } catch (_) {
            // swallow secondary logging errors
        }
        return res.status(500).json({ success: false, message: 'Error sending invoice', error: error.message });
    }
};
