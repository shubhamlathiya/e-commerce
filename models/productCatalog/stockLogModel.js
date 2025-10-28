const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     StockLog:
 *       type: object
 *       required:
 *         - productId
 *         - type
 *         - quantity
 *         - source
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the stock log entry
 *           example: "6720b6c8e31a1f8f92b83d7c"
 *         productId:
 *           type: string
 *           description: Reference ID of the product
 *           example: "671f44e2b12a34567890abcd"
 *         variantId:
 *           type: string
 *           description: Reference ID of the product variant (if applicable)
 *           example: "671f44e2b12a34567890abce"
 *         type:
 *           type: string
 *           enum: [in, out]
 *           description: Type of stock movement — 'in' for additions, 'out' for deductions
 *           example: "in"
 *         quantity:
 *           type: integer
 *           description: Number of units adjusted
 *           example: 100
 *         source:
 *           type: string
 *           enum: [manual, order, return]
 *           description: Source of the stock adjustment
 *           example: "manual"
 *         note:
 *           type: string
 *           description: Optional note or remark for the stock change
 *           example: "Initial stock load for new product"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the stock log entry was created
 *           example: "2025-10-28T12:30:00.000Z"
 *       example:
 *         _id: "6720b6c8e31a1f8f92b83d7c"
 *         productId: "671f44e2b12a34567890abcd"
 *         variantId: "671f44e2b12a34567890abce"
 *         type: "in"
 *         quantity: 100
 *         source: "manual"
 *         note: "Initial stock load for new product"
 *         createdAt: "2025-10-28T12:30:00.000Z"
 */
const StockLogSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        variantId: { type: Schema.Types.ObjectId, ref: 'ProductVariant', index: true },
        type: { type: String, enum: ['in', 'out'], required: true },
        quantity: { type: Number, required: true, min: 1 },
        source: { type: String, enum: ['manual', 'order', 'return'], required: true },
        note: { type: String, default: '' },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

module.exports = mongoose.model('StockLog', StockLogSchema);

