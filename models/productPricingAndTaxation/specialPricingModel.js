const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     SpecialPricing:
 *       type: object
 *       required:
 *         - productId
 *         - specialPrice
 *         - startDate
 *         - endDate
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720f3a4a6c9e8a3d4f5b6c8
 *         productId:
 *           type: string
 *           description: Reference to the product
 *           example: 671ff9d6a8b2e7a5e3c1a8c2
 *         variantId:
 *           type: string
 *           description: Reference to the product variant (if applicable)
 *           example: 671ff9d6a8b2e7a5e3c1a8c3
 *         specialPrice:
 *           type: number
 *           description: Special discounted price for the product
 *           example: 750
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Date when the special pricing starts
 *           example: 2025-11-01T00:00:00.000Z
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Date when the special pricing ends
 *           example: 2025-11-10T23:59:59.000Z
 *         status:
 *           type: boolean
 *           description: Indicates whether the special pricing is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T12:00:00.000Z
 */
const SpecialPricingSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', default: null, index: true },
        specialPrice: { type: Number, required: true, min: 0 },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

SpecialPricingSchema.index({ productId: 1, variantId: 1, startDate: 1, endDate: 1 });

SpecialPricingSchema.pre('validate', function (next) {
    if (this.startDate >= this.endDate) return next(new Error('startDate must be before endDate'));
    next();
});

module.exports = mongoose.model('SpecialPricing', SpecialPricingSchema);

