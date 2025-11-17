const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationLog:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "671f5b1234567890abcdef12"
 *         userId:
 *           type: string
 *           description: ID of the user who received the notification
 *           example: "671f4e9876543210abcdef34"
 *         type:
 *           type: string
 *           enum: [email, sms]
 *           description: Notification type
 *           example: "email"
 *         template:
 *           type: string
 *           description: Notification template identifier or name
 *           example: "order_confirmation"
 *         orderId:
 *           type: string
 *           description: Related order ID (if applicable)
 *           example: "671f4b1234567890abcdef99"
 *         status:
 *           type: string
 *           enum: [sent, failed]
 *           description: Delivery status of the notification
 *           example: "sent"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Time when the notification was created
 *           example: "2025-10-28T12:45:00Z"
 */
const NotificationLogSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['email', 'sms'],
        required: true
    },
    template: {
        type: String,
        required: true
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order'
    },
    status: {
        type: String,
        enum: ['sent', 'failed'],
        required: true
    },
    read: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('NotificationLog', NotificationLogSchema);