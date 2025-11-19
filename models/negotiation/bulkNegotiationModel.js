const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     BulkNegotiation:
 *       type: object
 *       required:
 *         - businessUserId
 *         - products
 *         - totalProposedAmount
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720fab6a8c9e1b3d4f5a7de
 *         businessUserId:
 *           type: string
 *           description: Reference to business user
 *           example: 671f44e2b12a34567890abcd
 *         products:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               productName:
 *                 type: string
 *               variantName:
 *                 type: string
 *               quantity:
 *                 type: number
 *               currentPrice:
 *                 type: number
 *               proposedPrice:
 *                 type: number
 *               totalAmount:
 *                 type: number
 *         totalProposedAmount:
 *           type: number
 *           description: Total proposed amount for all products
 *           example: 15000
 *         status:
 *           type: string
 *           enum: [pending, approved, rejected, counter_offer, accepted]
 *           default: pending
 *         adminResponse:
 *           type: object
 *           properties:
 *             adminId:
 *               type: string
 *             responseDate:
 *               type: string
 *               format: date-time
 *             counterOfferAmount:
 *               type: number
 *             notes:
 *               type: string
 *         expiresAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const BulkNegotiationSchema = new Schema(
    {
        businessUserId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true
        },
        cartId: { type: Schema.Types.ObjectId, ref: 'Cart' },
        products: [{
            productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
            variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', default: null },
            productName: { type: String, required: true },
            variantName: { type: String, default: '' },
            quantity: { type: Number, required: true, min: 1 },
            currentPrice: { type: Number, required: true, min: 0 },
            proposedPrice: { type: Number, required: true, min: 0 },
            totalAmount: { type: Number, required: true, min: 0 }
        }],
        totalProposedAmount: { type: Number, required: true, min: 0 },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected', 'counter_offer', 'accepted'],
            default: 'pending'
        },
        adminResponse: {
            adminId: { type: Schema.Types.ObjectId, ref: 'User' },
            responseDate: { type: Date },
            counterOfferAmount: { type: Number, min: 0 },
            notes: { type: String }
        },
        expiresAt: { type: Date, index: { expireAfterSeconds: 0 } }
    },
    { timestamps: true }
);

// Index for efficient queries
BulkNegotiationSchema.index({ businessUserId: 1, status: 1 });
BulkNegotiationSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('BulkNegotiation', BulkNegotiationSchema);