const mongoose = require('mongoose');
const { Schema } = mongoose;

const FlashSaleItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', required: true },
        flashPrice: { type: Number, required: true, min: 0 },
        stockLimit: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     FlashSaleItem:
 *       type: object
 *       required:
 *         - productId
 *         - variantId
 *         - flashPrice
 *         - stockLimit
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ID included in the flash sale
 *           example: 6720d4a9a8f1b3e2456f789c
 *         variantId:
 *           type: string
 *           description: Variant ID of the product
 *           example: 6720d4a9a8f1b3e2456f789d
 *         flashPrice:
 *           type: number
 *           description: Discounted price for the product during the flash sale
 *           example: 499.99
 *         stockLimit:
 *           type: number
 *           description: Available stock for this product in the flash sale
 *           example: 50
 *
 *     FlashSale:
 *       type: object
 *       required:
 *         - title
 *         - products
 *         - startDate
 *         - endDate
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720d4a9a8f1b3e2456f789b
 *         title:
 *           type: string
 *           description: Title of the flash sale
 *           example: Diwali Mega Flash Sale
 *         products:
 *           type: array
 *           description: List of products included in the flash sale
 *           items:
 *             $ref: '#/components/schemas/FlashSaleItem'
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date of the flash sale
 *           example: 2025-11-01T00:00:00.000Z
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date of the flash sale
 *           example: 2025-11-05T23:59:59.000Z
 *         status:
 *           type: string
 *           enum: [scheduled, running, expired]
 *           description: Current status of the flash sale
 *           example: running
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T12:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T12:30:00.000Z
 */
const FlashSaleSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        products: { type: [FlashSaleItemSchema], default: [], validate: v => Array.isArray(v) && v.length > 0 },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: { type: String, enum: ['scheduled', 'running', 'expired'], default: 'scheduled' },
    },
    { timestamps: true }
);

FlashSaleSchema.pre('validate', function (next) {
    if (this.startDate >= this.endDate) return next(new Error('startDate must be before endDate'));
    next();
});

module.exports = mongoose.model('FlashSale', FlashSaleSchema);

