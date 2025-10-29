const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     AutoDiscount:
 *       type: object
 *       required:
 *         - title
 *         - discountType
 *         - value
 *         - applicableTo
 *         - startDate
 *         - endDate
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720c1b5f12a9e89b1a3c4de
 *         title:
 *           type: string
 *           description: Title or name of the automatic discount
 *           example: Festive Flat ₹200 Off
 *         discountType:
 *           type: string
 *           enum: [flat, percent]
 *           description: Type of discount applied
 *           example: flat
 *         value:
 *           type: number
 *           description: Discount amount or percentage value
 *           example: 200
 *         minCartValue:
 *           type: number
 *           description: Minimum cart value required for discount to apply
 *           example: 1000
 *         applicableTo:
 *           type: object
 *           required:
 *             - type
 *           properties:
 *             type:
 *               type: string
 *               enum: [product, category, brand, all]
 *               description: Type of entity the discount applies to
 *               example: category
 *             ids:
 *               type: array
 *               items:
 *                 type: string
 *                 example: 671f44e2b12a34567890abcd
 *               description: List of product/category/brand IDs if applicable
 *         priority:
 *           type: number
 *           description: Priority for discount application (higher runs first)
 *           example: 1
 *         startDate:
 *           type: string
 *           format: date-time
 *           example: 2025-10-20T00:00:00.000Z
 *         endDate:
 *           type: string
 *           format: date-time
 *           example: 2025-12-31T23:59:59.000Z
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Current status of the discount
 *           example: active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T12:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T12:10:00.000Z
 */
const AutoDiscountSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        discountType: { type: String, enum: ['flat', 'percent'], required: true },
        value: { type: Number, required: true, min: 0 },
        minCartValue: { type: Number, default: 0 },
        applicableTo: {
            type: new Schema(
                {
                    type: { type: String, enum: ['product', 'category', 'brand', 'all'], required: true },
                    ids: [{ type: Schema.Types.ObjectId }],
                },
                { _id: false }
            ),
            required: true,
        },
        priority: { type: Number, default: 0 },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    },
    { timestamps: true }
);

AutoDiscountSchema.pre('validate', function (next) {
    if (this.startDate >= this.endDate) return next(new Error('startDate must be before endDate'));
    next();
});

module.exports = mongoose.model('AutoDiscount', AutoDiscountSchema);

