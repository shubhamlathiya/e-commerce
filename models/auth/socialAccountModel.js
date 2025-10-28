const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     SocialAccount:
 *       type: object
 *       required:
 *         - userId
 *         - provider
 *         - providerId
 *       properties:
 *         userId:
 *           type: string
 *           description: Reference to user ID
 *         provider:
 *           type: string
 *           enum: [google, facebook, apple]
 *           description: OAuth provider name
 *         providerId:
 *           type: string
 *           description: Unique ID from the provider
 *         providerData:
 *           type: object
 *           description: Raw provider payload (minimal)
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 */
const socialAccountSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    provider: {
        type: String,
        required: true,
        enum: ['google', 'facebook', 'apple']
    },
    providerId: {
        type: String,
        required: true
    },
    providerData: {
        type: Object,
        default: {}
    }
}, {
    timestamps: true
});

// Create compound index for provider and providerId to ensure uniqueness
socialAccountSchema.index({ provider: 1, providerId: 1 }, { unique: true });

// Create index for userId for faster queries
socialAccountSchema.index({ userId: 1 });

const SocialAccount = mongoose.model('SocialAccount', socialAccountSchema);

module.exports = SocialAccount;