const PaymentMethod = require('../../models/payments/paymentMethodModel');
const PaymentTransaction = require('../../models/payments/paymentTransactionModel');
const PaymentCallback = require('../../models/payments/paymentCallbackModel');
const Order = require('../../models/orders/orderModel');

// Allowed online gateway types per schema
const ALLOWED_GATEWAYS = ['razorpay', 'stripe', 'paypal', 'paytm'];

/**
 * Get all payment methods (sanitized for client)
 */
exports.getAllMethods = async (req, res) => {
    try {
        const {status} = req.query;
        const q = {};
        if (status !== undefined) q.status = status === 'true' || status === true;
        const methods = await PaymentMethod.find(q).sort({name: 1}).lean();
        const sanitized = methods.map(({_id, name, type, status}) => ({_id, name, type, status}));
        res.json({success: true, count: sanitized.length, data: sanitized});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

/**
 * Get payment method by ID (admin view, includes config)
 */
exports.getMethodById = async (req, res) => {
    try {
        const doc = await PaymentMethod.findById(req.params.id).lean();
        if (!doc) return res.status(404).json({success: false, message: 'Payment method not found'});
        res.json({success: true, data: doc});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
};

/**
 * Create payment method (admin)
 */
exports.createMethod = async (req, res) => {
    try {
        const {name, type, status = true, config = {}} = req.body;
        const doc = await PaymentMethod.create({name, type, status, config});
        res.status(201).json({success: true, message: 'Payment method created', data: doc});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
};

/**
 * Update payment method (admin)
 */
exports.updateMethod = async (req, res) => {
    try {
        const {id} = req.params;
        const doc = await PaymentMethod.findByIdAndUpdate(id, req.body, {new: true}).lean();
        if (!doc) return res.status(404).json({success: false, message: 'Payment method not found'});
        res.json({success: true, message: 'Payment method updated', data: doc});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
};

/**
 * Delete payment method (admin)
 */
exports.deleteMethod = async (req, res) => {
    try {
        const {id} = req.params;
        const doc = await PaymentMethod.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({success: false, message: 'Payment method not found'});
        res.json({success: true, message: 'Payment method deleted', id});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
};

/**
 * Initiate payment transaction
 */
exports.initiatePayment = async (req, res) => {
    try {
        const {orderId, paymentMethod} = req.body;
        const userId = req.user?.id;
        if (!orderId || !paymentMethod) {
            return res.status(400).json({success: false, message: 'orderId and paymentMethod are required'});
        }

        // Validate order (must belong to user unless admin)
        const orderQuery = req.isAdmin ? {_id: orderId} : {_id: orderId, userId};
        const order = await Order.findOne(orderQuery).lean();
        if (!order) return res.status(404).json({success: false, message: 'Order not found'});
        if (order.paymentStatus === 'paid') {
            return res.status(400).json({success: false, message: 'Order already paid'});
        }

        // Handle COD shortcut (no online transaction)
        if (paymentMethod.toLowerCase() === 'cod') {
            const updated = await Order.findByIdAndUpdate(order._id, {paymentStatus: 'cod'}, {new: true}).lean();
            return res.json({
                success: true,
                message: 'Order marked for Cash on Delivery',
                data: {orderId: updated._id}
            });
        }

        // Resolve active payment method by name or type
        const method = await PaymentMethod.findOne({
            status: true,
            $or: [
                {name: paymentMethod},
                {type: paymentMethod}
            ]
        }).lean();
        if (!method) return res.status(404).json({success: false, message: 'Payment method not found or inactive'});

        const gateway = (method.type || method.name || '').toLowerCase();
        if (!ALLOWED_GATEWAYS.includes(gateway)) {
            return res.status(400).json({success: false, message: 'Unsupported gateway type'});
        }

        // Idempotency: reuse existing initiated/pending transaction
        const existing = await PaymentTransaction.findOne({
            orderId: order._id,
            paymentMethod: gateway,
            status: {$in: ['initiated', 'pending']}
        }).lean();
        if (existing) {
            return res.json({
                success: true,
                message: 'Payment already initiated',
                data: {transactionId: existing.transactionId, amount: existing.amount, currency: existing.currency}
            });
        }

        const currency = (method.config && method.config.currency) ? method.config.currency : 'INR';

        const transaction = await PaymentTransaction.create({
            orderId: order._id,
            userId: order.userId || userId,
            paymentMethod: gateway,
            transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
            amount: order.totals.grandTotal,
            currency,
            status: 'initiated',
            responseData: {}
        });

        // Build gateway-specific client init payload using safe, non-secret fields
        let paymentData = {
            gateway,
            transactionId: transaction.transactionId,
            amount: transaction.amount,
            currency: transaction.currency,
        };

        const cfg = method.config || {};
        switch (gateway) {
            case 'razorpay': {
                paymentData = {
                    ...paymentData,
                    keyId: cfg.keyId, // do NOT expose keySecret
                    orderRequest: {
                        amountPaise: Math.round(transaction.amount * 100),
                        currency: transaction.currency,
                        receipt: order.orderNumber,
                        notes: {orderId: String(order._id)}
                    },
                    checkout: {
                        name: cfg.merchantName || 'Checkout',
                        description: cfg.description || `Order ${order.orderNumber}`,
                        theme: {color: cfg.themeColor || '#3399cc'},
                    }
                };
                break;
            }
            case 'stripe': {
                paymentData = {
                    ...paymentData,
                    publishableKey: cfg.publishableKey, // do NOT expose secretKey
                    intentRequest: {
                        amountCents: Math.round(transaction.amount * 100),
                        currency: transaction.currency.toLowerCase(),
                        metadata: {orderId: String(order._id), orderNumber: order.orderNumber}
                    }
                };
                break;
            }
            case 'paypal': {
                paymentData = {
                    ...paymentData,
                    clientId: cfg.clientId, // do NOT expose clientSecret
                    orderRequest: {
                        intent: 'CAPTURE',
                        purchase_units: [
                            {
                                amount: {
                                    currency_code: transaction.currency,
                                    value: String(transaction.amount.toFixed(2))
                                }
                            }
                        ]
                    }
                };
                break;
            }
            case 'paytm': {
                paymentData = {
                    ...paymentData,
                    mid: cfg.MID, // do NOT expose merchantKey
                    orderRequest: {
                        ORDER_ID: transaction.transactionId,
                        TXN_AMOUNT: String(transaction.amount.toFixed(2)),
                        CUST_ID: String(order.userId || userId || 'guest'),
                        CALLBACK_URL: cfg.callbackUrl || `/api/payment/callback/paytm`,
                        CHANNEL_ID: cfg.CHANNEL_ID || 'WEB',
                        INDUSTRY_TYPE_ID: cfg.INDUSTRY_TYPE_ID || 'Retail',
                        WEBSITE: cfg.WEBSITE || 'WEBSTAGING'
                    }
                };
                break;
            }
        }

        // Save non-secret init payload snapshot for audit
        await PaymentTransaction.updateOne({_id: transaction._id}, {responseData: {initPayload: paymentData}});

        res.json({success: true, message: 'Payment initiated', data: paymentData});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

/**
 * Process payment callback/webhook
 */
exports.processCallback = async (req, res) => {
    try {
        const {gateway} = req.params;
        const payload = req.body || {};

        // Log raw callback
        await PaymentCallback.create({gateway, rawRequest: payload, status: 'received'});

        const gw = (gateway || '').toLowerCase();
        if (!ALLOWED_GATEWAYS.includes(gw)) return res.status(400).json({
            success: false,
            message: 'Unsupported payment gateway'
        });

        // Attempt to derive transactionId and status heuristically per gateway
        let transactionId = payload.transactionId || payload.id || payload.razorpay_payment_id || payload.TXNID || payload.order_id || payload.payment_id;
        let status = 'failed';
        switch (gw) {
            case 'razorpay':
                status = (payload.status === 'captured' || payload.razorpay_payment_link_status === 'paid') ? 'success' : 'failed';
                break;
            case 'stripe':
                status = (payload.status === 'succeeded') ? 'success' : 'failed';
                break;
            case 'paypal':
                status = (payload.status === 'COMPLETED') ? 'success' : 'failed';
                break;
            case 'paytm':
                status = (payload.STATUS === 'TXN_SUCCESS') ? 'success' : 'failed';
                break;
        }

        if (!transactionId) return res.status(400).json({success: false, message: 'transactionId missing in callback'});

        const txn = await PaymentTransaction.findOne({transactionId}).lean();
        if (!txn) return res.status(404).json({success: false, message: 'Transaction not found'});

        await PaymentTransaction.updateOne({_id: txn._id}, {status, responseData: payload, updatedAt: new Date()});

        if (status === 'success') {
            await Order.updateOne({_id: txn.orderId}, {paymentStatus: 'paid', updatedAt: new Date()});
        }

        res.json({success: true, message: 'Callback processed', data: {transactionId, status}});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

/**
 * Get payment transactions for an order
 */
exports.getTransactionsByOrder = async (req, res) => {
    try {
        const {orderId} = req.params;
        const userId = req.user?.id;
        const order = await Order.findById(orderId).lean();
        if (!order) return res.status(404).json({success: false, message: 'Order not found'});
        if (!req.isAdmin && String(order.userId) !== String(userId)) {
            return res.status(403).json({success: false, message: 'Not authorized to view transactions'});
        }
        const items = await PaymentTransaction.find({orderId}).sort({createdAt: -1}).lean();
        res.json({success: true, count: items.length, data: items});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

/**
 * Process refund (admin)
 */
exports.processRefund = async (req, res) => {
    try {
        const {transactionId, amount, reason} = req.body;
        const orig = await PaymentTransaction.findOne({transactionId}).lean();
        if (!orig) return res.status(404).json({success: false, message: 'Original transaction not found'});
        if (amount && amount > orig.amount) {
            return res.status(400).json({success: false, message: 'Refund amount exceeds original amount'});
        }

        const refundAmount = amount || orig.amount;
        const refundTxn = await PaymentTransaction.create({
            orderId: orig.orderId,
            userId: orig.userId,
            paymentMethod: orig.paymentMethod,
            transactionId: `REF${Date.now()}${Math.floor(Math.random() * 1000)}`,
            amount: refundAmount,
            currency: orig.currency,
            status: 'refund',
            responseData: {originalTransactionId: transactionId, reason: reason || 'Refund'}
        });

        // In a real integration, invoke gateway refund API here.
        res.json({success: true, message: 'Refund recorded', data: refundTxn});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};
