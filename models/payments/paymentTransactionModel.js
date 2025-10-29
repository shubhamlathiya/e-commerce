const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentTransaction:
 *       type: object
 *       required:
 *         - orderId
 *         - userId
 *         - paymentMethod
 *         - transactionId
 *         - amount
 *         - currency
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720f3a9bcd123456789abcd"
 *         orderId:
 *           type: string
 *           description: Reference to the associated order
 *           example: "671ef9c1a2b93456789dcdef"
 *         userId:
 *           type: string
 *           description: Reference to the user who made the payment
 *           example: "671ef8b3c9a93456789dceaa"
 *         paymentMethod:
 *           type: string
 *           description: Payment gateway used for the transaction
 *           enum: [razorpay, stripe, paypal, paytm]
 *           example: "razorpay"
 *         transactionId:
 *           type: string
 *           description: Unique ID returned by the payment gateway
 *           example: "txn_1234567890"
 *         amount:
 *           type: number
 *           description: Transaction amount
 *           example: 499.99
 *         currency:
 *           type: string
 *           description: Currency used for the transaction
 *           example: "INR"
 *         status:
 *           type: string
 *           description: Current transaction status
 *           enum: [initiated, pending, success, failed, refund]
 *           example: "success"
 *         responseData:
 *           type: object
 *           description: Raw response or metadata from the payment gateway
 *           example:
 *             gatewayOrderId: "order_ABC123"
 *             paymentId: "pay_XYZ987"
 *             signature: "abc123xyz"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the transaction was created
 *           example: "2025-10-28T12:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the transaction was last updated
 *           example: "2025-10-28T12:30:00Z"
 */
const PaymentTransactionSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay', 'stripe', 'paypal', 'paytm'],
        required: true
    },
    transactionId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['initiated', 'pending', 'success', 'failed', 'refund'],
        default: 'initiated'
    },
    responseData: {
        type: Object,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
PaymentTransactionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('PaymentTransaction', PaymentTransactionSchema);