const mongoose = require('mongoose');
const { Schema } = mongoose;

const ComboItemSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
    },
    { _id: false }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     ComboOffer:
 *       type: object
 *       required:
 *         - title
 *         - items
 *         - comboPrice
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720d4a9a8f1b3e2456f789c
 *         title:
 *           type: string
 *           description: Title of the combo offer
 *           example: Summer Essentials Combo
 *         items:
 *           type: array
 *           description: List of products included in the combo
 *           items:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID of the product included in the combo
 *                 example: 671f44e2b12a34567890abcd
 *               quantity:
 *                 type: integer
 *                 description: Quantity of the product in the combo
 *                 example: 2
 *         comboPrice:
 *           type: number
 *           description: Total price for the combo offer
 *           example: 499.99
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Current status of the combo offer
 *           example: active
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Start date of the combo offer
 *           example: 2025-10-25T00:00:00.000Z
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: End date of the combo offer
 *           example: 2025-12-31T23:59:59.000Z
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T12:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T12:05:00.000Z
 */
const ComboOfferSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        items: { type: [ComboItemSchema], default: [], validate: v => Array.isArray(v) && v.length > 0 },
        comboPrice: { type: Number, required: true, min: 0 },
        status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    { timestamps: true }
);

ComboOfferSchema.pre('validate', function (next) {
    if (this.startDate && this.endDate && this.startDate >= this.endDate) {
        return next(new Error('startDate must be before endDate'));
    }
    next();
});

module.exports = mongoose.model('ComboOffer', ComboOfferSchema);

