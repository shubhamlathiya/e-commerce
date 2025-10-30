const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     Faq:
 *       type: object
 *       required:
 *         - category
 *         - question
 *         - answer
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the FAQ entry
 *           example: 6720a5bde9b23f8a9f3dce10
 *         category:
 *           type: string
 *           description: Category or section this FAQ belongs to
 *           example: "Shipping"
 *         question:
 *           type: string
 *           description: The frequently asked question
 *           example: "How long does shipping take?"
 *         answer:
 *           type: string
 *           description: The answer to the FAQ question
 *           example: "Shipping typically takes 3-5 business days depending on your location."
 *         status:
 *           type: boolean
 *           description: Indicates whether the FAQ is active or hidden
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the FAQ was created
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the FAQ was last updated
 *           example: "2025-10-28T11:00:00Z"
 */
const FaqSchema = new Schema(
    {
        category: { type: String, required: true, trim: true },
        question: { type: String, required: true, trim: true },
        answer: { type: String, required: true, trim: true },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

FaqSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Faq', FaqSchema);

