const mongoose = require('mongoose');
const {Schema} = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     AbandonedCart:
 *       type: object
 *       required:
 *         - sessionId
 *         - lastUpdated
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the abandoned cart record
 *           example: 671f3a8a2b6a1c0f8d5f7b99
 *         userId:
 *           type: string
 *           nullable: true
 *           description: Reference to the user (null for guest carts)
 *           example: "671f3a8a2b6a1c0f8d5f7b22"
 *         sessionId:
 *           type: string
 *           description: Session identifier for guest users
 *           example: "sess_abc123xyz789"
 *         lastUpdated:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the cart was last updated
 *           example: "2025-10-28T12:30:00Z"
 *         notified:
 *           type: boolean
 *           description: Whether the user was notified about the abandoned cart
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was created
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was last updated
 *           example: "2025-10-28T12:30:00Z"
 */
const AbandonedCartSchema = new Schema(
    {
        userId: {type: Schema.Types.ObjectId, ref: 'User', default: null, index: true},
        sessionId: {type: String, required: true, index: true},
        lastUpdated: {type: Date, required: true},
        notified: {type: Boolean, default: false},
    },
    {timestamps: true}
);

AbandonedCartSchema.index({lastUpdated: -1, notified: 1});

module.exports = mongoose.model('AbandonedCart', AbandonedCartSchema);