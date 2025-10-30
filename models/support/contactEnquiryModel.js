const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     ContactEnquiry:
 *       type: object
 *       required:
 *         - name
 *         - email
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the contact enquiry
 *           example: 6720a5bde9b23f8a9f3dce10
 *         name:
 *           type: string
 *           description: Full name of the user making the enquiry
 *           example: "Ravi Sharma"
 *         email:
 *           type: string
 *           description: Email address of the user
 *           example: "ravi@example.com"
 *         phone:
 *           type: string
 *           description: Contact phone number of the user
 *           example: "+91 9876543210"
 *         message:
 *           type: string
 *           description: User’s message or enquiry details
 *           example: "I want to know about your product return policy."
 *         status:
 *           type: string
 *           enum: [new, resolved]
 *           description: Current status of the enquiry
 *           example: "new"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the enquiry was created
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the enquiry was last updated
 *           example: "2025-10-28T11:15:00Z"
 */
const ContactEnquirySchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, trim: true },
        phone: { type: String, default: '' },
        message: { type: String, required: true },
        status: { type: String, enum: ['new', 'resolved'], default: 'new' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ContactEnquiry', ContactEnquirySchema);

