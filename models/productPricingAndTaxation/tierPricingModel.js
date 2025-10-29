const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     TierPricing:
 *       type: object
 *       required:
 *         - productId
 *         - minQty
 *         - maxQty
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720fab6a8c9e1b3d4f5a7de
 *         productId:
 *           type: string
 *           description: Reference ID of the product
 *           example: 671f44e2b12a34567890abcd
 *         variantId:
 *           type: string
 *           description: Reference ID of the product variant (optional)
 *           example: 671f44e2b12a34567890abce
 *         minQty:
 *           type: number
 *           description: Minimum quantity for this tier
 *           example: 5
 *         maxQty:
 *           type: number
 *           description: Maximum quantity for this tier
 *           example: 10
 *         price:
 *           type: number
 *           description: Unit price applicable for this quantity range
 *           example: 450
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T11:30:00.000Z
 */
const TierPricingSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', default: null, index: true },
        minQty: { type: Number, required: true, min: 1 },
        maxQty: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
    },
    { timestamps: true }
);

TierPricingSchema.index({ productId: 1, variantId: 1, minQty: 1, maxQty: 1 }, { unique: true });

TierPricingSchema.pre('validate', function (next) {
    if (this.minQty > this.maxQty) return next(new Error('minQty cannot be greater than maxQty'));
    next();
});

module.exports = mongoose.model('TierPricing', TierPricingSchema);

