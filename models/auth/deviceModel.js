const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     Device:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           description: Reference to user ID
 *         deviceName:
 *           type: string
 *           description: Name of the device
 *         fingerprintHash:
 *           type: string
 *           description: Hashed device fingerprint
 *         ip:
 *           type: string
 *           description: IP address
 *         userAgent:
 *           type: string
 *           description: User agent string
 *         lastActiveAt:
 *           type: string
 *           format: date-time
 *           description: Last activity timestamp
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Device first seen timestamp
 */
const deviceSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    deviceName: {
        type: String,
        trim: true
    },
    fingerprintHash: {
        type: String,
        trim: true
    },
    ip: {
        type: String,
        trim: true
    },
    userAgent: {
        type: String
    },
    lastActiveAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Create index for userId for faster queries
deviceSchema.index({userId: 1});

// Create index for fingerprintHash for faster queries
deviceSchema.index({fingerprintHash: 1});

const Device = mongoose.model('Device', deviceSchema);

module.exports = Device;