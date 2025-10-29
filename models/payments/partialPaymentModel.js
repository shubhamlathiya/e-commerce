const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     PartialPayment:
 *       type: object
 *       required:
 *         - orderId
 *         - userId
 *         - totalAmount
 *         - advancePaid
 *         - balanceDue
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720e8f2a1b23456789abcde"
 *         orderId:
 *           type: string
 *           description: Reference to the order for which partial payment is made
 *           example: "671f4b9876543210abcdef45"
 *         userId:
 *           type: string
 *           description: Reference to the user making the payment
 *           example: "671f4b9876543210abcdef67"
 *         totalAmount:
 *           type: number
 *           description: Total amount of the order
 *           example: 1500
 *         advancePaid:
 *           type: number
 *           description: Amount already paid as advance
 *           example: 500
 *         balanceDue:
 *           type: number
 *           description: Remaining balance yet to be paid
 *           example: 1000
 *         status:
 *           type: string
 *           enum: [pending, paid]
 *           description: Payment completion status
 *           example: "pending"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the partial payment record was created
 *           example: "2025-10-28T12:45:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the partial payment record was last updated
 *           example: "2025-10-28T13:10:00Z"
 */
const PartialPaymentSchema = new Schema({
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
    totalAmount: {
        type: Number,
        required: true
    },
    advancePaid: {
        type: Number,
        required: true
    },
    balanceDue: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'paid'],
        default: 'pending'
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
PartialPaymentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('PartialPayment', PartialPaymentSchema);