const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductPricing:
 *       type: object
 *       required:
 *         - productId
 *         - basePrice
 *         - finalPrice
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
 *         basePrice:
 *           type: number
 *           description: Original base price of the product
 *           example: 1000
 *         discountType:
 *           type: string
 *           enum: [flat, percent]
 *           description: Type of discount applied
 *           example: percent
 *         discountValue:
 *           type: number
 *           description: Discount value (either flat amount or percent)
 *           example: 10
 *         finalPrice:
 *           type: number
 *           description: Price after discount is applied
 *           example: 900
 *         currency:
 *           type: string
 *           description: Currency code in which the price is stored
 *           example: INR
 *         status:
 *           type: boolean
 *           description: Indicates whether the pricing is active
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
const ProductPricingSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', default: null, index: true },
        basePrice: { type: Number, required: true, min: 0 },
        discountType: { type: String, enum: ['flat', 'percent'], default: null },
        discountValue: { type: Number, default: 0, min: 0 },
        finalPrice: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'INR' },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Unique pricing per product/variant pair
ProductPricingSchema.index({ productId: 1, variantId: 1 }, { unique: true });

function computeFinal(basePrice, discountType, discountValue) {
    let price = Number(basePrice || 0);
    if (discountType === 'flat') {
        price = Math.max(0, price - Number(discountValue || 0));
    } else if (discountType === 'percent') {
        price = price * (1 - Math.min(100, Number(discountValue || 0)) / 100);
    }
    return Number(price.toFixed(2));
}

ProductPricingSchema.pre('validate', function (next) {
    this.finalPrice = computeFinal(this.basePrice, this.discountType, this.discountValue);
    next();
});

module.exports = mongoose.model('ProductPricing', ProductPricingSchema);

