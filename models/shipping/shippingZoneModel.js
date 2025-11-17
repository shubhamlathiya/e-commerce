const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     ShippingZone:
 *       type: object
 *       required:
 *         - zoneName
 *       properties:
 *         _id:
 *           type: string
 *         zoneName:
 *           type: string
 *         countries:
 *           type: array
 *           items:
 *             type: string
 *         states:
 *           type: array
 *           items:
 *             type: string
 *         pincodes:
 *           type: array
 *           items:
 *             type: string
 *         marketFees:
 *           type: number
 *           description: Additional marketplace fees applied for this zone
 *           example: 15.50
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const ShippingZoneSchema = new Schema({
    zoneName: {
        type: String,
        required: true,
        trim: true
    },
    countries: [{
        type: String,
        trim: true
    }],
    states: [{
        type: String,
        trim: true
    }],
    pincodes: [{
        type: String,
        trim: true
    }],

    // ⭐ NEW FIELD ADDED
    marketFees: {
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

// Update updatedAt on save
ShippingZoneSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ShippingZone', ShippingZoneSchema);
