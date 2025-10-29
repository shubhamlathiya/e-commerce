const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     OrderSummary:
 *       type: object
 *       required:
 *         - cartId
 *         - userId
 *         - items
 *         - subtotal
 *         - shipping
 *         - total
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720d1a2a1b23456789abcd3"
 *         cartId:
 *           type: string
 *           description: Reference to the cart used for this order summary
 *           example: "671f4b9876543210abcdef45"
 *         userId:
 *           type: string
 *           description: Reference to the user who generated the summary
 *           example: "671f4b9876543210abcdef67"
 *         items:
 *           type: array
 *           description: List of cart items included in the summary
 *           items:
 *             type: object
 *             example:
 *               productId: "671f4b1234567890abcdef12"
 *               name: "Wireless Mouse"
 *               quantity: 2
 *               price: 499
 *               finalPrice: 998
 *         subtotal:
 *           type: number
 *           description: Total price of items before tax, discount, and shipping
 *           example: 998
 *         shipping:
 *           type: number
 *           description: Shipping cost applied to the order
 *           example: 50
 *         discount:
 *           type: number
 *           description: Discount applied to the order
 *           default: 0
 *           example: 100
 *         tax:
 *           type: number
 *           description: Tax amount applied to the order
 *           default: 0
 *           example: 18
 *         total:
 *           type: number
 *           description: Final payable amount after all calculations
 *           example: 966
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the order summary was created
 *           example: "2025-10-28T12:45:00Z"
 */
const OrderSummarySchema = new Schema({
    cartId: {
        type: Schema.Types.ObjectId,
        ref: 'Cart',
        required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: {
        type: Array,
        required: true
    },
    subtotal: {
        type: Number,
        required: true
    },
    shipping: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    tax: {
        type: Number,
        default: 0
    },
    total: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('OrderSummary', OrderSummarySchema);