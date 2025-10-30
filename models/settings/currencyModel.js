const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     Currency:
 *       type: object
 *       required:
 *         - code
 *         - symbol
 *         - exchangeRate
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the currency
 *           example: 67203f8d2b6a1c0f8d5f8a45
 *         code:
 *           type: string
 *           description: ISO currency code
 *           example: "USD"
 *         symbol:
 *           type: string
 *           description: Currency symbol
 *           example: "$"
 *         exchangeRate:
 *           type: number
 *           description: Exchange rate against the base currency
 *           example: 83.25
 *         isDefault:
 *           type: boolean
 *           description: Indicates if this is the default currency
 *           example: false
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 *           example: "2025-10-28T12:15:00Z"
 */
const CurrencySchema = new Schema(
    {
        code: { type: String, required: true, trim: true, uppercase: true, unique: true },
        symbol: { type: String, required: true, trim: true },
        exchangeRate: { type: Number, required: true, min: 0 },
        isDefault: { type: Boolean, default: false },
    },
    { timestamps: true }
);

CurrencySchema.index({ isDefault: 1 });

module.exports = mongoose.model('Currency', CurrencySchema);

