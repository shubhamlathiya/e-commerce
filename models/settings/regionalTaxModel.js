const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     RegionalTax:
 *       type: object
 *       required:
 *         - country
 *         - taxRate
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the regional tax entry
 *           example: 67204cfa9f3c5b1d6f8e3a25
 *         region:
 *           type: string
 *           description: Specific region name or zone within the state or country
 *           example: "South Zone"
 *         country:
 *           type: string
 *           description: Country name where the tax applies
 *           example: "India"
 *         state:
 *           type: string
 *           description: State or province where the tax applies
 *           example: "Maharashtra"
 *         taxRate:
 *           type: number
 *           format: float
 *           description: Tax rate percentage for the region
 *           example: 18
 *         gstCode:
 *           type: string
 *           description: GST or tax code identifier for the region
 *           example: "27"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *           example: "2025-10-28T09:45:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last record update timestamp
 *           example: "2025-10-28T10:15:00Z"
 */
const RegionalTaxSchema = new Schema(
    {
        region: { type: String, default: '', trim: true },
        country: { type: String, required: true, trim: true },
        state: { type: String, default: '', trim: true },
        taxRate: { type: Number, required: true, min: 0 },
        gstCode: { type: String, default: '' },
    },
    { timestamps: true }
);

RegionalTaxSchema.index({ country: 1, state: 1 });

module.exports = mongoose.model('RegionalTax', RegionalTaxSchema);