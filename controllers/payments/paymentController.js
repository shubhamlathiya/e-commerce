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
                description: "UPI, Cards, Net Banking"
            });
        }

        list.push({ // Always available
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

        if (!orderId) return res.status(400).json({ success: false, message: "Order ID is required" });
        if (paymentMethod !== "razorpay") return res.status(400).json({ success: false, message: "Invalid payment method" });

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        const razorOrder = await createRazorpayOrder(order);

        res.json({
            success: true,
            message: "Payment initiated",
            data: razorOrder
        });

    } catch (err) {
        console.error("initiatePayment:", err);
        res.status(500).json({ success: false, message: err.message });
    }
};

/* ============================================================
   INTERNAL: CREATE RAZORPAY ORDER
============================================================ */
async function createRazorpayOrder(order) {
    const gateway = await PaymentGatewayConfig.findOne({ name: "razorpay", status: true }).lean();
    if (!gateway) throw new Error("Razorpay not configured");

    const cfg = gateway.config;
    const rzp = new Razorpay({ key_id: cfg.key_id, key_secret: cfg.key_secret });

    const amountPaise = Math.round(order.totals.grandTotal * 100);

    const rzpOrder = await rzp.orders.create({
        amount: amountPaise,
        currency: cfg.currency || "INR",
        receipt: order.orderNumber,
    });

    // Save transaction in DB
    await PaymentTransaction.create({
        userId: order.userId,
        orderId: order._id,
        paymentMethod: "razorpay",
        transactionId: rzpOrder.id,
        amount: order.totals.grandTotal,
        currency: cfg.currency || "INR",
        status: "pending"
    });

    return {
        keyId: cfg.key_id,
        orderId: rzpOrder.id,
        amount: amountPaise,
        currency: cfg.currency || "INR",
        paymentUrl: `https://api.razorpay.com/v1/checkout/embedded?order_id=${rzpOrder.id}`
    };
}

/* ============================================================
   VERIFY PAYMENT (Frontend Callback)
============================================================ */
exports.verifyRazorpayPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

        const gateway = await PaymentGatewayConfig.findOne({ name: "razorpay" }).lean();
        const secret = gateway?.config?.key_secret;
        if (!secret) return res.status(500).json({ success: false, message: "Razorpay secret missing" });

        const generatedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({ success: false, message: "Invalid signature" });
        }

        const txn = await PaymentTransaction.findOne({ transactionId: razorpay_order_id });
        if (!txn) return res.status(404).json({ success: false, message: "Transaction not found" });

        txn.status = "success";
        txn.gatewayPaymentId = razorpay_payment_id;
        await txn.save();

        await Order.findByIdAndUpdate(txn.orderId, { paymentStatus: "paid" });

        res.json({ success: true, message: "Payment verified successfully", data: { orderId: txn.orderId } });

    } catch (err) {
        console.error("verifyRazorpayPayment:", err);
        res.status(500).json({ success: false, message: err.message });
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
