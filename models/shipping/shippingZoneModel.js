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
 *           example: "6721a3f9cde123456789abcd"
 *         zoneName:
 *           type: string
 *           description: Name of the shipping zone
 *           example: "West India Zone"
 *         countries:
 *           type: array
 *           description: List of countries included in this shipping zone
 *           items:
 *             type: string
 *             example: "India"
 *         states:
 *           type: array
 *           description: List of states included in this shipping zone
 *           items:
 *             type: string
 *             example: "Maharashtra"
 *         pincodes:
 *           type: array
 *           description: List of pincodes covered by this zone
 *           items:
 *             type: string
 *             example: "400001"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the shipping zone was created
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the shipping zone was last updated
 *           example: "2025-10-28T12:15:00Z"
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
ShippingZoneSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('ShippingZone', ShippingZoneSchema);