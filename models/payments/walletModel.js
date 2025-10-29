const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WalletTransactionSchema = new Schema({
    type: {
        type: String,
        enum: ['credit', 'debit', 'refund'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    reference: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     WalletTransaction:
 *       type: object
 *       required:
 *         - type
 *         - amount
 *         - reference
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720f4c8bcd123456789abcd"
 *         type:
 *           type: string
 *           description: Type of wallet transaction
 *           enum: [credit, debit, refund]
 *           example: "credit"
 *         amount:
 *           type: number
 *           description: Transaction amount
 *           example: 250.75
 *         reference:
 *           type: string
 *           description: Reference for the transaction (e.g., order ID, admin note)
 *           example: "Order #ORD12345"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the transaction was created
 *           example: "2025-10-28T12:15:00Z"
 *
 *     Wallet:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720f4c8bcd123456789abce"
 *         userId:
 *           type: string
 *           description: Reference to the user who owns the wallet
 *           example: "671ef8b3c9a93456789dceaa"
 *         balance:
 *           type: number
 *           description: Current wallet balance
 *           example: 1200.50
 *         transactions:
 *           type: array
 *           description: List of wallet transactions
 *           items:
 *             $ref: '#/components/schemas/WalletTransaction'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Wallet creation timestamp
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the wallet was last updated
 *           example: "2025-10-28T12:30:00Z"
 */
const WalletSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0
    },
    transactions: [WalletTransactionSchema],
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
WalletSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Wallet', WalletSchema);