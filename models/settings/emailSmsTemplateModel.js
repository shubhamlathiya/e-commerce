const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailSmsTemplate:
 *       type: object
 *       required:
 *         - type
 *         - body
 *         - channel
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the template
 *           example: 67203f8d2b6a1c0f8d5f8a45
 *         type:
 *           type: string
 *           description: Template type or identifier (e.g. order confirmation, password reset)
 *           example: "order_confirm"
 *         subject:
 *           type: string
 *           description: Subject line for the email (optional for SMS)
 *           example: "Your Order Confirmation"
 *         body:
 *           type: string
 *           description: Content body of the template (HTML for email or text for SMS)
 *           example: "<p>Your order has been confirmed!</p>"
 *         channel:
 *           type: string
 *           enum: [email, sms]
 *           description: Communication channel
 *           example: "email"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 *           example: "2025-10-28T12:15:00Z"
 */
const EmailSmsTemplateSchema = new Schema(
    {
        type: { type: String, required: true, trim: true },
        subject: { type: String, default: '', trim: true },
        body: { type: String, required: true },
        channel: { type: String, enum: ['email', 'sms'], required: true },
    },
    { timestamps: true }
);

EmailSmsTemplateSchema.index({ type: 1, channel: 1 }, { unique: true });

module.exports = mongoose.model('EmailSmsTemplate', EmailSmsTemplateSchema);

