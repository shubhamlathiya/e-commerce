const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentMethod:
 *       type: object
 *       required:
 *         - name
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720f3a9bcd123456789abcd"
 *         name:
 *           type: string
 *           description: Display name of the payment method
 *           example: "Razorpay"
 *         type:
 *           type: string
 *           description: Type of payment method (e.g., online, cod, wallet)
 *           example: "online"
 *         status:
 *           type: boolean
 *           description: Whether the payment method is active
 *           example: true
 *         config:
 *           type: object
 *           description: Configuration details or API keys for the payment gateway
 *           example:
 *             apiKey: "rzp_test_xxx"
 *             secret: "secret_key_xxx"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the payment method was created
 *           example: "2025-10-28T13:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the payment method was last updated
 *           example: "2025-10-28T14:00:00Z"
 */
const PaymentMethodSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: Boolean,
        default: true
    },
    config: {
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
PaymentMethodSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('PaymentMethod', PaymentMethodSchema);