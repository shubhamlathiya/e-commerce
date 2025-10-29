const mongoose = require('mongoose');
const { Schema } = mongoose;

const HistorySchema = new Schema(
    {
        type: { type: String, enum: ['earn', 'redeem'], required: true },
        points: { type: Number, required: true, min: 1 },
        orderId: { type: Schema.Types.ObjectId, ref: 'Order' },
        date: { type: Date, default: Date.now },
    },
    { _id: false }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     LoyaltyHistory:
 *       type: object
 *       required:
 *         - type
 *         - points
 *       properties:
 *         type:
 *           type: string
 *           enum: [earn, redeem]
 *           description: Type of transaction — either earning or redeeming points
 *           example: earn
 *         points:
 *           type: number
 *           description: Number of points earned or redeemed
 *           example: 100
 *         orderId:
 *           type: string
 *           description: Associated order ID if applicable
 *           example: 6720e1b5f4a3a5c1b2c3d4e5
 *         date:
 *           type: string
 *           format: date-time
 *           description: Date when the transaction occurred
 *           example: 2025-10-28T12:30:00.000Z
 *
 *     LoyaltyReward:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720e1b5f4a3a5c1b2c3d4f0
 *         userId:
 *           type: string
 *           description: ID of the user associated with this loyalty account
 *           example: 671ffbc2b6d3a7e2a4c5f1b9
 *         points:
 *           type: number
 *           description: Current available points for the user
 *           example: 250
 *         totalEarned:
 *           type: number
 *           description: Total points earned by the user
 *           example: 1000
 *         totalRedeemed:
 *           type: number
 *           description: Total points redeemed by the user
 *           example: 750
 *         history:
 *           type: array
 *           description: List of point transactions for this user
 *           items:
 *             $ref: '#/components/schemas/LoyaltyHistory'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-20T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T11:45:00.000Z
 */
const LoyaltyRewardSchema = new Schema(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
        points: { type: Number, default: 0, min: 0 },
        history: { type: [HistorySchema], default: [] },
        totalEarned: { type: Number, default: 0, min: 0 },
        totalRedeemed: { type: Number, default: 0, min: 0 },
    },
    { timestamps: true }
);

module.exports = mongoose.model('LoyaltyReward', LoyaltyRewardSchema);

