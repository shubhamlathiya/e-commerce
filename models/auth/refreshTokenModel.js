const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     RefreshToken:
 *       type: object
 *       required:
 *         - userId
 *         - tokenHash
 *         - expiresAt
 *       properties:
 *         userId:
 *           type: string
 *           description: Reference to user ID
 *         tokenHash:
 *           type: string
 *           description: Hashed refresh token
 *         deviceId:
 *           type: string
 *           description: Reference to device ID (optional)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Token creation timestamp
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Token expiration timestamp
 *         revoked:
 *           type: boolean
 *           description: Whether token has been revoked
 *         replacedBy:
 *           type: string
 *           description: ID of token that replaced this one
 */
const refreshTokenSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId, ref: 'User', required: true
    }, tokenHash: {
        type: String, required: true
    }, deviceId: {
        type: Schema.Types.ObjectId, ref: 'Device', required: false
    }, expiresAt: {
        type: Date, required: true
    }, revoked: {
        type: Boolean, default: false
    }, replacedBy: {
        type: Schema.Types.ObjectId, ref: 'RefreshToken', default: null
    }
}, {
    timestamps: true
});

// Create TTL index for automatic expiration
refreshTokenSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

// Create index for userId for faster queries
refreshTokenSchema.index({userId: 1});

// Create index for tokenHash for faster queries
refreshTokenSchema.index({tokenHash: 1});

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
