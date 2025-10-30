const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     SupportTicket:
 *       type: object
 *       required:
 *         - userId
 *         - subject
 *         - description
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the support ticket
 *           example: 6720b2f1a1b45b0a9d4f99c8
 *         userId:
 *           type: string
 *           description: ID of the user who created the ticket
 *           example: 671ff21de8b23f8a9f3dce01
 *         subject:
 *           type: string
 *           description: Short summary of the issue
 *           example: "Unable to track my order"
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *           example: "I placed an order last week but the tracking link is not working."
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Priority level of the ticket
 *           example: "high"
 *         status:
 *           type: string
 *           enum: [open, in-progress, resolved]
 *           description: Current status of the support ticket
 *           example: "open"
 *         assignedTo:
 *           type: string
 *           description: ID of the admin or staff assigned to handle the ticket
 *           example: 6720b12fe9b23f8a9f3dcd88
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the ticket was created
 *           example: "2025-10-28T09:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the ticket was last updated
 *           example: "2025-10-28T10:30:00Z"
 */
const SupportTicketSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        subject: { type: String, required: true, trim: true },
        description: { type: String, required: true },
        priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
        status: { type: String, enum: ['open', 'in-progress', 'resolved'], default: 'open' },
        assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);

