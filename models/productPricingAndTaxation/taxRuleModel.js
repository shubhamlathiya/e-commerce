const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     TaxRule:
 *       type: object
 *       required:
 *         - name
 *         - type
 *         - value
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720f9a6a8c9e1b3d4f5a7c9
 *         name:
 *           type: string
 *           description: Name of the tax rule (e.g., GST, VAT)
 *           example: GST 18%
 *         type:
 *           type: string
 *           enum: [percentage, fixed]
 *           description: Type of tax — percentage or fixed amount
 *           example: percentage
 *         value:
 *           type: number
 *           description: Tax value (either percentage or fixed amount)
 *           example: 18
 *         status:
 *           type: boolean
 *           description: Indicates if the tax rule is active
 *           example: true
 *         country:
 *           type: string
 *           description: Country where the tax rule applies
 *           example: India
 *         state:
 *           type: string
 *           description: State or region where the tax rule applies
 *           example: Maharashtra
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T10:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T12:00:00.000Z
 */
const TaxRuleSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        type: { type: String, enum: ['percentage', 'fixed'], required: true },
        value: { type: Number, required: true, min: 0 },
        status: { type: Boolean, default: true },
        country: { type: String, default: null },
        state: { type: String, default: null },
    },
    { timestamps: true }
);

TaxRuleSchema.index({ name: 1, country: 1, state: 1 }, { unique: true });

module.exports = mongoose.model('TaxRule', TaxRuleSchema);

