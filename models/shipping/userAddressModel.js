const mongoose = require('mongoose');

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     Address:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           example: 671f44e2b12a34567890abcd
 *         userId:
 *           type: string
 *           example: 671f44e2b12a34567890a111
 *         name:
 *           type: string
 *           example: John Doe
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *         address:
 *           type: string
 *           example: "123 Main Street"
 *         city:
 *           type: string
 *           example: "Mumbai"
 *         state:
 *           type: string
 *           example: "Maharashtra"
 *         pincode:
 *           type: string
 *           example: "400001"
 *         country:
 *           type: string
 *           example: "India"
 *         type:
 *           type: string
 *           enum: [home, office]
 *           example: home
 *         isDefault:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
const UserAddressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, required: true },
    type: { type: String, enum: ['home', 'office'], default: 'home' },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

UserAddressSchema.pre('save', function(next) {
    this.updatedAt = new Date();
    next();
});

// When setting an address as default, unset others for the same user
UserAddressSchema.statics.setDefaultForUser = async function(userId, addressId) {
    await this.updateMany({ userId }, { $set: { isDefault: false } });
    await this.findByIdAndUpdate(addressId, { $set: { isDefault: true } });
};

module.exports = mongoose.model('UserAddress', UserAddressSchema);

