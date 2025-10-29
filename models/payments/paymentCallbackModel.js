const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentCallback:
 *       type: object
 *       required:
 *         - gateway
 *         - rawRequest
 *         - status
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720f2a9bcd123456789abcd"
 *         gateway:
 *           type: string
 *           description: Name of the payment gateway (e.g., Razorpay, Paytm, Stripe)
 *           example: "Razorpay"
 *         rawRequest:
 *           type: object
 *           description: Raw callback payload received from the payment gateway
 *           example:
 *             order_id: "order_9A33XWu170gUtm"
 *             payment_id: "pay_29QQoUBi66xm2f"
 *             signature: "5d55f0c3b8d8c2cfe0d50e4a7cb3d3bcb4f0"
 *         status:
 *           type: string
 *           description: Status of the payment callback processing
 *           example: "success"
 *         receivedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the callback was received
 *           example: "2025-10-28T13:30:00Z"
 */
const PaymentCallbackSchema = new Schema({
    gateway: {
        type: String,
        required: true
    },
    rawRequest: {
        type: Object,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    receivedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PaymentCallback', PaymentCallbackSchema);