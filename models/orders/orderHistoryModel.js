const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderHistory:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720a9b9c23f456789abcd12"
 *         orderId:
 *           type: string
 *           description: Reference to the associated order
 *           example: "671f4b1234567890abcdef99"
 *         status:
 *           type: string
 *           description: Current order status
 *           example: "Shipped"
 *         comment:
 *           type: string
 *           description: Additional details or admin comment
 *           example: "Order shipped via BlueDart with tracking ID 12345"
 *         updatedBy:
 *           type: string
 *           description: ID of the user/admin who updated the status
 *           example: "671f4e9876543210abcdef34"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the update
 *           example: "2025-10-28T14:25:00Z"
 */
const OrderHistorySchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    status: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        default: ''
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('OrderHistory', OrderHistorySchema);