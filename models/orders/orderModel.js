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

// Generate unique order number BEFORE validation so required constraint passes
OrderSchema.pre('validate', async function (next) {
    if (this.orderNumber) return next();

    // Format: ORD-YYYYMMDD-HHMMSS-XXXX (random 4 digits)
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');

    let candidate;
    let attempts = 0;
    do {
        const rand = Math.floor(1000 + Math.random() * 9000); // 4 digits
        candidate = `ORD-${yyyy}${mm}${dd}-${hh}${mi}${ss}-${rand}`;
        // Guard against extremely rare collisions with unique index
        // Use this.constructor to query the same model inside hooks
        // eslint-disable-next-line no-await-in-loop
        const exists = await this.constructor.exists({ orderNumber: candidate });
        if (!exists) break;
        attempts += 1;
    } while (attempts < 3);

    this.orderNumber = candidate;
    next();
});

module.exports = mongoose.model('Order', OrderSchema);
