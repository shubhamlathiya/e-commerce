const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     PaymentGatewayConfig:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the payment gateway configuration
 *           example: 67204b2e9f3c5b1d6f8e3a22
 *         name:
 *           type: string
 *           description: Name of the payment gateway
 *           example: "Razorpay"
 *         config:
 *           type: object
 *           description: Configuration details for the payment gateway (like API keys, secrets, and settings)
 *           example:
 *             key_id: "rzp_test_1DP5mmOlF5G5ag"
 *             key_secret: "your_secret_key_here"
 *             currency: "INR"
 *         status:
 *           type: boolean
 *           description: Indicates whether the payment gateway is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *           example: "2025-10-28T09:45:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last record update timestamp
 *           example: "2025-10-28T10:15:00Z"
 */
const PaymentGatewayConfigSchema = new Schema(
    {
        name: { type: String, required: true, trim: true, unique: true },
        config: { type: Object, default: {} },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('PaymentGatewayConfig', PaymentGatewayConfigSchema);