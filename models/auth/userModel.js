const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const twoFactorAuthSchema = new Schema({
    enabled: {type: Boolean, default: false},
    method: {type: String, enum: ['email', 'phone', 'app'], default: null},
    secret: {type: String, default: null},
    tempSecret: {type: String, default: null},
    backupCodes: [{type: String}],
    updatedAt: {type: Date, default: null}
}, {_id: false}); // no _id for subdocument

// STEP 2: Define Profile Schema — includes 2FA schema
const profileSchema = new Schema({
    picture: {type: String, default: null},      // You can add more profile fields here
    twoFactorAuth: {type: twoFactorAuthSchema, default: {}}
}, {_id: false});


/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         email:
 *           type: string
 *           description: User's email address
 *         phone:
 *           type: string
 *           description: User's phone number
 *         passwordHash:
 *           type: string
 *           description: Hashed password using argon2
 *         name:
 *           type: string
 *           description: User's full name
 *         roles:
 *           type: array
 *           items:
 *             type: string
 *           description: User roles (admin, staff, etc.)
 *         status:
 *           type: string
 *           enum: [active, suspended, deleted]
 *           description: Account status
 *         emailVerified:
 *           type: boolean
 *           description: Whether email has been verified
 *         phoneVerified:
 *           type: boolean
 *           description: Whether phone has been verified
 *         profile:
 *           type: object
 *           description: Additional user profile information
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Account creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Account last update timestamp
 */
const userSchema = new Schema({
    email: {
        type: String, trim: true, lowercase: true, sparse: true, // Allow null but enforce uniqueness when present
        index: true
    }, phone: {
        type: String, trim: true, sparse: true, // Allow null but enforce uniqueness when present
        index: true
    }, passwordHash: {
        type: String, required: false // Can be null for social-only accounts
    }, name: {
        type: String, trim: true
    }, roles: [{
        type: String, ref: 'Role'
    }], status: {
        type: String, enum: ['active', 'suspended', 'deleted'], default: 'active', required: true
    }, emailVerified: {
        type: Boolean, default: false
    }, phoneVerified: {
        type: Boolean, default: false
    }, profile: {type: profileSchema, default: {}}
}, {
    timestamps: true // Automatically add createdAt and updatedAt
});

// Ensure either email or phone is provided
userSchema.pre('validate', function (next) {
    if (!this.email && !this.phone) {
        next(new Error('Either email or phone is required'));
    } else {
        next();
    }
});

// Create compound index for email uniqueness
userSchema.index({email: 1}, {
    unique: true, partialFilterExpression: {email: {$type: 'string'}}
});

// Create compound index for phone uniqueness
userSchema.index({phone: 1}, {
    unique: true, partialFilterExpression: {phone: {$type: 'string'}}
});

// Create index for roles for faster queries
userSchema.index({roles: 1});

// Create index for status for faster queries
userSchema.index({status: 1});

const User = mongoose.model('User', userSchema);

module.exports = User;