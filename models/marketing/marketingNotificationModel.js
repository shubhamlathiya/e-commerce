const mongoose = require('mongoose');
const {Schema} = mongoose;


/**
 * @swagger
 * components:
 *   schemas:
 *     MarketingNotification:
 *       type: object
 *       required:
 *         - type
 *         - title
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the notification
 *           example: 67201e5a2b6a1c0f8d5f9a34
 *         userId:
 *           type: string
 *           nullable: true
 *           description: Linked user (null for broadcast or system notifications)
 *           example: 671fce902b6a1c0f8d5f1234
 *         type:
 *           type: string
 *           enum: [push, email, sms]
 *           description: Channel through which the notification is sent
 *           example: "email"
 *         title:
 *           type: string
 *           description: Notification title or subject line
 *           example: "Special Offer: 20% Off on All Electronics!"
 *         message:
 *           type: string
 *           description: Main content or body of the notification
 *           example: "Hurry! Get 20% off on your next purchase. Offer valid till Sunday."
 *         targetUrl:
 *           type: string
 *           description: Link or deep URL to open when user interacts with the notification
 *           example: "https://shopnow.example.com/offers"
 *         status:
 *           type: string
 *           enum: [sent, pending, failed]
 *           default: pending
 *           description: Current delivery status of the notification
 *           example: "sent"
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
const MarketingNotificationSchema = new Schema(
    {
        userId: {type: Schema.Types.ObjectId, ref: 'User', default: null, index: true},
        type: {type: String, enum: ['push', 'email', 'sms'], required: true},
        title: {type: String, required: true, trim: true},
        message: {type: String, required: true, trim: true},
        targetUrl: {type: String, default: ''},
        status: {type: String, enum: ['sent', 'pending', 'failed'], default: 'pending'},
    },
    {timestamps: true}
);

MarketingNotificationSchema.index({type: 1, status: 1, createdAt: -1});

module.exports = mongoose.model('MarketingNotification', MarketingNotificationSchema);