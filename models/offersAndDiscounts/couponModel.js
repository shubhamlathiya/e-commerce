const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     Coupon:
 *       type: object
 *       required:
 *         - code
 *         - type
 *         - value
 *         - startDate
 *         - endDate
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720d4a9a8f1b3e2456f789c
 *         code:
 *           type: string
 *           description: Unique coupon code
 *           example: SAVE20
 *         type:
 *           type: string
 *           enum: [flat, percent]
 *           description: Type of discount
 *           example: percent
 *         value:
 *           type: number
 *           description: Discount value (percentage or fixed amount)
 *           example: 20
 *         minOrderAmount:
 *           type: number
 *           description: Minimum order amount required to use the coupon
 *           example: 500
 *         maxDiscount:
 *           type: number
 *           description: Maximum discount amount allowed (for percent type)
 *           example: 200
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: Coupon start date
 *           example: 2025-10-25T00:00:00.000Z
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: Coupon expiry date
 *           example: 2025-12-31T23:59:59.000Z
 *         usageLimit:
 *           type: number
 *           description: Maximum number of times the coupon can be used
 *           example: 100
 *         usagePerUser:
 *           type: number
 *           description: Maximum number of times a user can use this coupon
 *           example: 2
 *         allowedUsers:
 *           type: array
 *           items:
 *             type: string
 *           description: List of user IDs allowed to use this coupon
 *           example: ["671f44e2b12a34567890abcd"]
 *         allowedCategories:
 *           type: array
 *           items:
 *             type: string
 *           description: Category IDs applicable for the coupon
 *           example: ["671f44e2b12a34567890abce"]
 *         allowedProducts:
 *           type: array
 *           items:
 *             type: string
 *           description: Product IDs applicable for the coupon
 *           example: ["671f44e2b12a34567890abcf"]
 *         allowedBrands:
 *           type: array
 *           items:
 *             type: string
 *           description: Brand IDs applicable for the coupon
 *           example: ["671f44e2b12a34567890abd0"]
 *         status:
 *           type: string
 *           enum: [active, inactive]
 *           description: Current coupon status
 *           example: active
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T12:00:00.000Z
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: 2025-10-28T12:05:00.000Z
 */
const CouponSchema = new Schema(
    {
        code: { type: String, required: true, unique: true, trim: true },
        type: { type: String, enum: ['flat', 'percent'], required: true },
        value: { type: Number, required: true, min: 0 },
        minOrderAmount: { type: Number, default: 0 },
        maxDiscount: { type: Number, default: 0 },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        usageLimit: { type: Number, default: 0 },
        usagePerUser: { type: Number, default: 0 },
        allowedUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        allowedCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
        allowedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
        allowedBrands: [{ type: Schema.Types.ObjectId, ref: 'Brand' }],
        status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    },
    { timestamps: true }
);

CouponSchema.pre('validate', function (next) {
    if (this.startDate >= this.endDate) return next(new Error('startDate must be before endDate'));
    next();
});

module.exports = mongoose.model('Coupon', CouponSchema);

