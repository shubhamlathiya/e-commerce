const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReplacementItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderReplacement:
 *       type: object
 *       required:
 *         - orderId
 *         - userId
 *         - items
 *         - reason
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720c7b9a1b23456789abcd1"
 *         orderId:
 *           type: string
 *           description: Reference to the original order
 *           example: "671f4e9876543210abcdef34"
 *         userId:
 *           type: string
 *           description: Reference to the user requesting the replacement
 *           example: "671f4e9876543210abcdef56"
 *         items:
 *           type: array
 *           description: List of items to be replaced
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "671f4b1234567890abcdef99"
 *               quantity:
 *                 type: number
 *                 example: 2
 *         reason:
 *           type: string
 *           description: Reason provided by the user for requesting replacement
 *           example: "Received damaged product"
 *         status:
 *           type: string
 *           enum: [requested, approved, shipped, completed]
 *           default: requested
 *           example: "approved"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-28T11:30:00Z"
 */
const OrderReplacementSchema = new Schema({
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [ReplacementItemSchema],
    reason: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['requested', 'approved', 'shipped', 'completed'],
        default: 'requested'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
OrderReplacementSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('OrderReplacement', OrderReplacementSchema);