const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     EmailCampaign:
 *       type: object
 *       required:
 *         - name
 *         - subject
 *         - body
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the email campaign
 *           example: 67200c8f2b6a1c0f8d5f7b99
 *         name:
 *           type: string
 *           description: Internal name for the campaign
 *           example: "Diwali Festival Offers"
 *         subject:
 *           type: string
 *           description: Email subject line
 *           example: "🎉 Get up to 50% off this Diwali!"
 *         body:
 *           type: string
 *           description: Full HTML or text body of the email
 *           example: "<h1>Special Offer</h1><p>Shop now and save big!</p>"
 *         recipients:
 *           type: array
 *           items:
 *             type: string
 *             format: email
 *           description: List of recipient email addresses
 *           example: ["user1@example.com", "user2@example.com"]
 *         filters:
 *           type: object
 *           description: Targeting filters (e.g., user segment conditions)
 *           example:
 *             country: "IN"
 *             minOrders: 2
 *         status:
 *           type: string
 *           enum: [draft, scheduled, sent]
 *           default: draft
 *           description: Current status of the campaign
 *           example: "scheduled"
 *         scheduledAt:
 *           type: string
 *           format: date-time
 *           nullable: true
 *           description: Scheduled date and time for campaign delivery
 *           example: "2025-11-01T09:00:00Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 *           example: "2025-10-28T12:45:00Z"
 */
const EmailCampaignSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        subject: { type: String, required: true, trim: true },
        body: { type: String, required: true },
        recipients: { type: [String], default: [] },
        filters: { type: Object, default: {} },
        status: { type: String, enum: ['draft', 'scheduled', 'sent'], default: 'draft' },
        scheduledAt: { type: Date, default: null },
    },
    { timestamps: true }
);

EmailCampaignSchema.index({ status: 1, scheduledAt: 1 });

module.exports = mongoose.model('EmailCampaign', EmailCampaignSchema);