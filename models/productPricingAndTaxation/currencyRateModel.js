const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     CurrencyRate:
 *       type: object
 *       required:
 *         - from
 *         - to
 *         - rate
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720f1b2a6c9e8a3d4f5b6c7
 *         from:
 *           type: string
 *           description: ISO currency code to convert from
 *           example: USD
 *         to:
 *           type: string
 *           description: ISO currency code to convert to
 *           example: INR
 *         rate:
 *           type: number
 *           description: Conversion rate from source currency to target currency
 *           example: 83.15
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the currency rate was added
 *           example: 2025-10-28T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the currency rate was last updated
 *           example: 2025-10-28T12:30:00.000Z
 */
const CurrencyRateSchema = new Schema(
    {
        from: { type: String, required: true, trim: true },
        to: { type: String, required: true, trim: true },
        rate: { type: Number, required: true, min: 0 },
    },
    { timestamps: { createdAt: true, updatedAt: true } }
);

CurrencyRateSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('CurrencyRate', CurrencyRateSchema);

