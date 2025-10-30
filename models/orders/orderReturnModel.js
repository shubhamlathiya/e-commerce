const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReturnItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    reason: {
        type: String,
        required: true
    }
}, { _id: false });

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderReturn:
 *       type: object
 *       required:
 *         - orderId
 *         - userId
 *         - items
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720c9e2a1b23456789abcd2"
 *         orderId:
 *           type: string
 *           description: Reference to the order being returned
 *           example: "671f4e9876543210abcdef45"
 *         userId:
 *           type: string
 *           description: Reference to the user requesting the return
 *           example: "671f4e9876543210abcdef67"
 *         items:
 *           type: array
 *           description: List of items being returned
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Reference to the product being returned
 *                 example: "671f4b1234567890abcdef12"
 *               quantity:
 *                 type: number
 *                 description: Quantity of the product being returned
 *                 example: 1
 *               reason:
 *                 type: string
 *                 description: Reason for returning the item
 *                 example: "Wrong size received"
 *         status:
 *           type: string
 *           enum: [requested, approved, rejected, refunded]
 *           default: requested
 *           description: Current status of the return process
 *           example: "approved"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-28T09:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-28T11:00:00Z"
 */
const OrderReturnSchema = new Schema({
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
    items: [ReturnItemSchema],
    reason: {
        type: String,
        default: ''
    },
    resolution: {
        type: String,
        enum: ['refund', 'replacement'],
        default: 'refund'
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    adminNote: {
        type: String,
        default: ''
    },
    requestDate: {
        type: Date,
        default: Date.now
    },
    processedAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['requested', 'approved', 'rejected', 'refunded'],
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
OrderReturnSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    // auto-set processedAt when moved to refunded
    if (this.isModified('status') && this.status === 'refunded' && !this.processedAt) {
        this.processedAt = Date.now();
    }
    next();
});

module.exports = mongoose.model('OrderReturn', OrderReturnSchema);