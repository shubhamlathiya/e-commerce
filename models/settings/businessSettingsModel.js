const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     BusinessSettings:
 *       type: object
 *       required:
 *         - businessName
 *         - contactEmail
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the business settings record
 *           example: 67203f8d2b6a1c0f8d5f8a45
 *         businessName:
 *           type: string
 *           description: Official business name
 *           example: "NextGen Electronics Pvt. Ltd."
 *         logo:
 *           type: string
 *           description: URL of the company logo
 *           example: "https://cdn.example.com/images/logo.png"
 *         contactEmail:
 *           type: string
 *           format: email
 *           description: Business contact email address
 *           example: "support@nextgenstore.com"
 *         phone:
 *           type: string
 *           description: Contact phone number
 *           example: "+91-9876543210"
 *         address:
 *           type: string
 *           description: Registered business address
 *           example: "123 MG Road, Bengaluru, India"
 *         gstNumber:
 *           type: string
 *           description: GST or tax registration number
 *           example: "29ABCDE1234F1Z5"
 *         timezone:
 *           type: string
 *           description: Business timezone
 *           example: "Asia/Kolkata"
 *         currency:
 *           type: string
 *           description: Default currency for the store
 *           example: "INR"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 *           example: "2025-10-28T12:15:00Z"
 */
const BusinessSettingsSchema = new Schema(
    {
        businessName: { type: String, required: true, trim: true },
        logo: { type: String, default: '' },
        contactEmail: { type: String, required: true, trim: true },
        phone: { type: String, default: '' },
        address: { type: String, default: '' },
        gstNumber: { type: String, default: '' },
        timezone: { type: String, default: 'Asia/Kolkata' },
        currency: { type: String, default: 'INR' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('BusinessSettings', BusinessSettingsSchema);

