const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     ShippingRule:
 *       type: object
 *       required:
 *         - title
 *         - shippingCost
 *         - country
 *       properties:
 *         _id:
 *           type: string
 *           example: "6720f5c9bcd123456789abcf"
 *         title:
 *           type: string
 *           description: Name or description of the shipping rule
 *           example: "Free Shipping for Orders Above ₹1000"
 *         minOrderValue:
 *           type: number
 *           description: Minimum order value for which this rule applies
 *           example: 500
 *         maxOrderValue:
 *           type: number
 *           description: Maximum order value for which this rule applies
 *           example: 5000
 *         shippingCost:
 *           type: number
 *           description: Shipping cost to be applied under this rule
 *           example: 50
 *         country:
 *           type: string
 *           description: Country where the shipping rule applies
 *           example: "India"
 *         state:
 *           type: string
 *           description: Optional state for more specific rule targeting
 *           example: "Maharashtra"
 *         postalCodes:
 *           type: array
 *           description: List of postal codes applicable for this rule
 *           items:
 *             type: string
 *             example: "400001"
 *         status:
 *           type: boolean
 *           description: Indicates whether the rule is active
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the rule was created
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Timestamp when the rule was last updated
 *           example: "2025-10-28T12:30:00Z"
 */
const ShippingRuleSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    maxOrderValue: {
        type: Number,
        default: Number.MAX_SAFE_INTEGER
    },
    shippingCost: {
        type: Number,
        required: true
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    state: {
        type: String,
        default: '',
        trim: true
    },
    postalCodes: [{
        type: String,
        trim: true
    }],
    status: {
        type: Boolean,
        default: true
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
ShippingRuleSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ShippingRule', ShippingRuleSchema);