const mongoose = require('mongoose');
const { Schema } = mongoose;

const BuySchema = new Schema(
    {
        quantity: { type: Number, required: true, min: 1 },
        products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
        categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    },
    { _id: false }
);

const GetSchema = new Schema(
    {
        quantity: { type: Number, required: true, min: 1 },
        products: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
        discountType: { type: String, enum: ['free', 'percent', 'flat'], required: true },
        value: { type: Number, default: 0 },
    },
    { _id: false }
);

/**
 * @swagger
 * components:
 *   schemas:
 *     BuyXGetY:
 *       type: object
 *       required:
 *         - title
 *         - buy
 *         - get
 *         - startDate
 *         - endDate
 *       properties:
 *         _id:
 *           type: string
 *           example: 6720c1b5f12a9e89b1a3c4de
 *         title:
 *           type: string
 *           description: Title or name of the BOGO offer
 *           example: Buy 2 Get 1 Free on T-Shirts
 *         buy:
 *           type: object
 *           required:
 *             - quantity
 *           properties:
 *             quantity:
 *               type: number
 *               description: Number of items the customer must buy
 *               example: 2
 *             products:
 *               type: array
 *               items:
 *                 type: string
 *                 example: 671f44e2b12a34567890abcd
 *               description: List of product IDs eligible for the buy part
 *             categories:
 *               type: array
 *               items:
 *                 type: string
 *                 example: 671f44e2b12a34567890abc1
 *               description: List of category IDs eligible for the buy part
 *         get:
 *           type: object
 *           required:
 *             - quantity
 *             - discountType
 *           properties:
 *             quantity:
 *               type: number
 *               description: Number of items the customer gets as part of the offer
 *               example: 1
 *             products:
 *               type: array
 *               items:
 *                 type: string
 *                 example: 671f44e2b12a34567890abf2
 *               description: List of product IDs eligible for the get part
 *             discountType:
 *               type: string
 *               enum: [free, percent, flat]
 *               description: Type of discount for the “get” items
 *               example: free
 *             value:
 *               type: number
 *               description: Discount value if applicable (for percent or flat)
 *               example: 50
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
 *           description: Current status of the offer
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
const BuyXGetYSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        buy: { type: BuySchema, required: true },
        get: { type: GetSchema, required: true },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    },
    { timestamps: true }
);

BuyXGetYSchema.pre('validate', function (next) {
    if (this.startDate >= this.endDate) return next(new Error('startDate must be before endDate'));
    next();
});

module.exports = mongoose.model('BuyXGetY', BuyXGetYSchema);

