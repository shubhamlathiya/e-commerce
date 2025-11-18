const Razorpay = require("razorpay");
const crypto = require("crypto");

const PaymentTransaction = require("../../models/payments/paymentTransactionModel");
const PaymentGatewayConfig = require("../../models/settings/paymentGatewayConfigModel");
const PaymentCallback = require("../../models/payments/paymentCallbackModel");
const Order = require("../../models/orders/orderModel");

/* ============================================================
   GET PAYMENT METHODS (Razorpay + COD)
============================================================ */
exports.getPaymentMethods = async (req, res) => {
    try {
        const list = [];

        const razorpayConfig = await PaymentGatewayConfig.findOne({
            name: "razorpay",
            status: true
        }).lean();

        if (razorpayConfig) {
            list.push({
                name: "Razorpay",
                code: "razorpay",
                status: true,
                currency: razorpayConfig.config.currency || "INR",
                description: "UPI, Cards, Net Banking, Wallets"
            });
        }

        list.push({
            name: "Cash on Delivery",
            code: "cod",
            status: true
        });

        res.json({ success: true, data: list });
    } catch (err) {
        console.error("getPaymentMethods:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ============================================================
   INITIATE PAYMENT (Frontend Entry)
============================================================ */
exports.initiatePayment = async (req, res) => {
    try {
        const { orderId, paymentMethod } = req.body;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required"
            });
        }

        if (paymentMethod !== "razorpay") {
            return res.status(400).json({
                success: false,
                message: "Invalid payment method"
            });
        }

        const order = await Order.findById(orderId)
            .populate('userId', 'name email phone')
            .populate('billingAddress');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Order not found"
            });
        }

        // Validate order amount
        if (!order.totals || !order.totals.grandTotal) {
            return res.status(400).json({
                success: false,
                message: "Invalid order total"
            });
        }

        const razorOrder = await createRazorpayOrder(order);

        res.json({
            success: true,
            message: "Payment initiated successfully",
            data: razorOrder
        });

    } catch (err) {
        console.error("❌ initiatePayment error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Payment initiation failed"
        });
    }
};

/* ============================================================
   INTERNAL: CREATE RAZORPAY ORDER
============================================================ */
async function createRazorpayOrder(order) {
    const gateway = await PaymentGatewayConfig.findOne({
        name: "razorpay",
        status: true
    }).lean();

    if (!gateway) {
        throw new Error("Razorpay payment gateway is not configured");
    }

    const cfg = gateway.config;

    // Validate Razorpay configuration
    if (!cfg.key_id || !cfg.key_secret) {
        throw new Error("Razorpay credentials are missing");
    }

    const rzp = new Razorpay({
        key_id: cfg.key_id,
        key_secret: cfg.key_secret
    });

    // FIX: Ensure precise amount calculation
    const grandTotal = parseFloat(order.totals.grandTotal);

    if (isNaN(grandTotal) || grandTotal <= 0) {
        throw new Error("Invalid order total for payment initialization");
    }

    const amountPaise = Math.round(grandTotal * 100);

    // Razorpay minimum amount validation
    if (amountPaise < 100) {
        throw new Error("Payment amount is below minimum required (₹1)");
    }

    // FIX: Add proper order creation with error handling
    const orderOptions = {
        amount: amountPaise,
        currency: cfg.currency || "INR",
        receipt: order.orderNumber || `order_${order._id}`,
        payment_capture: 1, // Auto capture payment
        notes: {
            app_order_id: order._id.toString(),
            app_order_number: order.orderNumber,
            user_id: order.userId?._id?.toString() || order.userId?.toString(),
            source: "mobile_app"
        }
    };

    let rzpOrder;
    try {
        rzpOrder = await rzp.orders.create(orderOptions);
    } catch (rzpError) {
        console.error('❌ Razorpay order creation failed:', rzpError);
        throw new Error(`Razorpay order creation failed: ${rzpError.error?.description || rzpError.message}`);
    }

    // Save transaction in DB
    await PaymentTransaction.create({
        userId: order.userId?._id || order.userId,
        orderId: order._id,
        paymentMethod: "razorpay",
        transactionId: rzpOrder.id,
        amount: grandTotal,
        currency: cfg.currency || "INR",
        status: "pending",
        gatewayResponse: rzpOrder
    });

    // Prepare user data for frontend
    const userData = order.userId || {};
    const billingAddress = order.billingAddress || {};
    // await testRazorpayConnection()
    return {
        keyId: cfg.key_id,
        orderId: rzpOrder.id,
        amount: amountPaise,
        currency: cfg.currency || "INR",
        billingAddress: billingAddress,
        user: {
            email: userData.email,
            name: userData.name,
            phone: userData.phone
        },
        paymentUrl: `https://api.razorpay.com/v1/checkout/embedded?order_id=${rzpOrder.id}`
    };
}

/* ============================================================
   VERIFY PAYMENT (Frontend Callback)
============================================================ */
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Missing required payment parameters"
            });
        }

        const gateway = await PaymentGatewayConfig.findOne({ name: "razorpay" }).lean();
        const secret = gateway?.config?.key_secret;

        if (!secret) {
            return res.status(500).json({
                success: false,
                message: "Razorpay configuration error"
            });
        }

        // Generate signature for verification
        const generatedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            console.error('❌ Signature verification failed');
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature"
            });
        }

        // Find and update transaction
        const txn = await PaymentTransaction.findOne({ transactionId: razorpay_order_id });
        if (!txn) {
            return res.status(404).json({
                success: false,
                message: "Transaction not found"
            });
        }

        // Update transaction status
        txn.status = "success";
        txn.gatewayPaymentId = razorpay_payment_id;
        txn.paymentDate = new Date();
        await txn.save();

        // Update order payment status
        await Order.findByIdAndUpdate(txn.orderId, {
            paymentStatus: "paid",
            status: "confirmed"
        });

        res.json({
            success: true,
            message: "Payment verified successfully",
            data: {
                orderId: txn.orderId,
                paymentId: razorpay_payment_id
            }
        });

    } catch (err) {
        console.error("❌ verifyRazorpayPayment error:", err);
        res.status(500).json({
            success: false,
            message: err.message || "Payment verification failed"
        });
    }
};

/* ============================================================
   RAZORPAY WEBHOOK (Optional)
============================================================ */
exports.razorpayWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        const signature = req.headers["x-razorpay-signature"];
        const body = JSON.stringify(req.body);

        const expected = crypto
            .createHmac("sha256", secret)
            .update(body)
            .digest("hex");

        if (expected !== signature) return res.status(400).json({ success: false, message: "Invalid webhook signature" });

        const razorpayOrderId = req.body?.payload?.payment?.entity?.order_id;
        if (razorpayOrderId) {
            const txn = await PaymentTransaction.findOne({ transactionId: razorpayOrderId });
            if (txn) {
                txn.status = "success";
                await txn.save();
                await Order.findByIdAndUpdate(txn.orderId, { paymentStatus: "paid" });
            }
        }

        await PaymentCallback.create({ gateway: "razorpay", rawRequest: req.body, status: "processed" });
        res.json({ success: true });

    } catch (err) {
        console.error("razorpayWebhook:", err);
        res.status(500).json({ success: false });
    }
};

// // Add this to your OrderConfirmationScreen
// const testRazorpayConnection = async () => {
//     try {
//         const testOrder = {
//             amount: 100, // ₹1
//             currency: "INR",
//             receipt: "test_receipt",
//             notes: {
//                 source: "connection_test"
//             }
//         };
//
//         // Make direct API call to test
//         const response = await fetch('https://api.razorpay.com/v1/orders', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//                 'Authorization': 'Basic ' + btoa('rzp_test_RfVItjH4qUOXhA:Z0w3ACVkLj3JflmDFsFaXUYm')
//             },
//             body: JSON.stringify(testOrder)
//         });
//
//         const data = await response.json();
//         console.log('🔗 Razorpay Connection Test:', data);
//
//         if (data.error) {
//             console.error('❌ Razorpay Error:', data.error);
//         }
//     } catch (error) {
//         console.error('❌ Connection Test Failed:', error);
//     }
// };
