const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     AnalyticsOrder:
 *       type: object
 *       required:
 *         - date
 *         - totalOrders
 *         - totalSales
 *         - avgOrderValue
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the analytics record
 *           example: 671f1f8d5b4c1b2a6f8f7d91
 *         date:
 *           type: string
 *           format: date
 *           description: The date for which the analytics data is recorded
 *           example: "2025-10-27"
 *         totalOrders:
 *           type: integer
 *           minimum: 0
 *           description: Total number of orders placed on the given date
 *           example: 250
 *         totalSales:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Total sales amount for the given date
 *           example: 54000.75
 *         avgOrderValue:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Average order value for the given date
 *           example: 216.00
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was created
 *           example: "2025-10-27T10:30:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the record was last updated
 *           example: "2025-10-27T12:00:00Z"
 */
const AnalyticsOrderSchema = new Schema(
    {
        date: { type: Date, required: true, index: true },
        totalOrders: { type: Number, required: true, min: 0 },
        totalSales: { type: Number, required: true, min: 0 },
        avgOrderValue: { type: Number, required: true, min: 0 },
    },
    { timestamps: true }
);

AnalyticsOrderSchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('AnalyticsOrder', AnalyticsOrderSchema);