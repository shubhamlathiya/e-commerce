const mongoose = require('mongoose');
const {Schema} = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductFaq:
 *       type: object
 *       required:
 *         - productId
 *         - question
 *         - answer
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the FAQ entry
 *           example: "6720fae2b12a34567890abcd"
 *         productId:
 *           type: string
 *           description: Reference ID of the associated product
 *           example: "6720f2a4b12a34567890abce"
 *         question:
 *           type: string
 *           description: The frequently asked question about the product
 *           example: "Does this smartphone support wireless charging?"
 *         answer:
 *           type: string
 *           description: The answer to the FAQ question
 *           example: "Yes, it supports Qi wireless charging up to 15W."
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the FAQ entry was created
 *           example: "2025-10-28T13:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the FAQ entry was last updated
 *           example: "2025-10-28T15:10:00.000Z"
 *       example:
 *         _id: "6720fae2b12a34567890abcd"
 *         productId: "6720f2a4b12a34567890abce"
 *         question: "Does this smartphone support wireless charging?"
 *         answer: "Yes, it supports Qi wireless charging up to 15W."
 *         createdAt: "2025-10-28T13:00:00.000Z"
 *         updatedAt: "2025-10-28T15:10:00.000Z"
 */
const ProductFaqSchema = new Schema(
    {
        productId: {type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true},
        question: {type: String, required: true, trim: true},
        answer: {type: String, required: true, trim: true},
    },
    {timestamps: true}
);

module.exports = mongoose.model('ProductFaq', ProductFaqSchema);
