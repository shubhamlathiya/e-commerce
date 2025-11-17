const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: 'Variant'
    },
    shippingCharge: {
        type: Number,
        default: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    price: {
        type: Number,
        required: true
    },
    finalPrice: {
        type: Number,
        required: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     CartItem:
 *       type: object
 *       properties:
 *         productId:
 *           type: string
 *           description: Product ID
 *           example: "64b9d9b8e23f2d001f56a2c1"
 *         variantId:
 *           type: string
 *           description: Variant ID (if applicable)
 *           example: "64b9da12f23f2d001f56a2d3"
 *         quantity:
 *           type: number
 *           description: Quantity of the product
 *           example: 2
 *         price:
 *           type: number
 *           description: Price per unit
 *           example: 499.99
 *         finalPrice:
 *           type: number
 *           description: Final price after discount/tax
 *           example: 459.99
 *         addedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-28T10:30:00Z"
 *
 *     Cart:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: "64c1b2d9f9a1b80017d43e7f"
 *         userId:
 *           type: string
 *           description: User ID if logged in, otherwise null
 *           example: "64b9d8a7e23f2d001f56a2af"
 *         sessionId:
 *           type: string
 *           description: Session ID for guest users
 *           example: "guest_abc123xyz"
 *         items:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CartItem'
 *         couponCode:
 *           type: string
 *           example: "SAVE10"
 *         discount:
 *           type: number
 *           example: 100
 *         cartTotal:
 *           type: number
 *           example: 899.98
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-28T10:10:00Z"
 */
const CartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    sessionId: {
        type: String,
        required: true,
        index: true
    },
    items: [CartItemSchema],
    couponCode: {
        type: String,
        default: null
    },
    discount: {
        type: Number,
        default: 0
    },
    cartTotal: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
CartSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Cart', CartSchema);