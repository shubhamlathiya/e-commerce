const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsProduct:
 *       type: object
 *       required:
 *         - productId
 *         - totalSales
 *         - totalRevenue
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the analytics product record
 *           example: 671f2b5a9c8f4a1e4c2b6f91
 *         productId:
 *           type: string
 *           description: Reference to the product being analyzed
 *           example: 671f1a7b8b2c4a6d9f0c1e12
 *         totalSales:
 *           type: integer
 *           minimum: 0
 *           description: Total number of units sold for the product
 *           example: 350
 *         totalRevenue:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Total revenue generated from the product
 *           example: 87500.50
 *         rating:
 *           type: number
 *           format: float
 *           minimum: 0
 *           maximum: 5
 *           description: Average product rating based on customer feedback
 *           example: 4.3
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was created
 *           example: "2025-10-28T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was last updated
 *           example: "2025-10-28T12:00:00Z"
 */
const AnalyticsProductSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        totalSales: { type: Number, required: true, min: 0 },
        totalRevenue: { type: Number, required: true, min: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
    },
    { timestamps: true }
);

AnalyticsProductSchema.index({ productId: 1 }, { unique: true });

module.exports = mongoose.model('AnalyticsProduct', AnalyticsProductSchema);