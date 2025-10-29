const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - items
 *         - paymentMethod
 *         - shippingAddress
 *         - billingAddress
 *         - totals
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720b5a9f45d987654abcd12"
 *         orderNumber:
 *           type: string
 *           description: Unique order identifier
 *           example: "ORD123456789"
 *         userId:
 *           type: string
 *           description: Reference to the user who placed the order
 *           example: "671f4e9876543210abcdef34"
 *         items:
 *           type: array
 *           description: List of products in the order
 *           items:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "671f4b1234567890abcdef99"
 *               variantId:
 *                 type: string
 *                 example: "671f4b9876543210abcdef22"
 *               name:
 *                 type: string
 *                 example: "Wireless Bluetooth Headphones"
 *               quantity:
 *                 type: number
 *                 example: 2
 *               price:
 *                 type: number
 *                 example: 1499
 *               total:
 *                 type: number
 *                 example: 2998
 *         paymentMethod:
 *           type: string
 *           description: Payment mode used for the order
 *           example: "razorpay"
 *         paymentStatus:
 *           type: string
 *           enum: [pending, paid, failed, cod]
 *           default: pending
 *           example: "paid"
 *         shippingAddress:
 *           type: object
 *           description: Shipping address details
 *           example:
 *             name: "John Doe"
 *             phone: "9876543210"
 *             addressLine1: "123 MG Road"
 *             city: "Bangalore"
 *             state: "Karnataka"
 *             country: "India"
 *             pincode: "560001"
 *         billingAddress:
 *           type: object
 *           description: Billing address details
 *           example:
 *             name: "John Doe"
 *             phone: "9876543210"
 *             addressLine1: "123 MG Road"
 *             city: "Bangalore"
 *             state: "Karnataka"
 *             country: "India"
 *             pincode: "560001"
 *         totals:
 *           type: object
 *           properties:
 *             subtotal:
 *               type: number
 *               example: 3000
 *             discount:
 *               type: number
 *               example: 200
 *             shipping:
 *               type: number
 *               example: 100
 *             tax:
 *               type: number
 *               example: 150
 *             grandTotal:
 *               type: number
 *               example: 3050
 *         status:
 *           type: string
 *           enum: [placed, processing, shipped, delivered, cancelled]
 *           default: placed
 *           example: "processing"
 *         couponCode:
 *           type: string
 *           example: "NEWUSER50"
 *         placedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2025-10-28T12:30:00Z"
 */
const OrderSchema = new Schema({
    orderNumber: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    items: {
        type: Array,
        required: true
    },
    paymentMethod: {
        type: String,
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'cod'],
        default: 'pending'
    },
    shippingAddress: {
        type: Object,
        required: true
    },
    billingAddress: {
        type: Object,
        required: true
    },
    totals: {
        subtotal: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0
        },
        shipping: {
            type: Number,
            default: 0
        },
        tax: {
            type: Number,
            default: 0
        },
        grandTotal: {
            type: Number,
            required: true
        }
    },
    status: {
        type: String,
        enum: ['placed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'placed'
    },
    couponCode: {
        type: String,
        default: null
    },
    placedAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
OrderSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Generate unique order number before saving
OrderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        // Generate order number with prefix ORD followed by timestamp and random digits
        const timestamp = new Date().getTime().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        this.orderNumber = `ORD${timestamp}${random}`;
    }
    next();
});

module.exports = mongoose.model('Order', OrderSchema);