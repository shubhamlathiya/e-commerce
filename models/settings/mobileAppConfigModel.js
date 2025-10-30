const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     MobileAppConfig:
 *       type: object
 *       required:
 *         - version
 *         - apiUrl
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the mobile app configuration
 *           example: 67204a1e5b8a2c0d7e4a5b3d
 *         version:
 *           type: string
 *           description: App version for which the configuration is valid
 *           example: "2.5.0"
 *         theme:
 *           type: object
 *           description: Theme settings for the mobile app (colors, fonts, etc.)
 *           example:
 *             primaryColor: "#2196F3"
 *             secondaryColor: "#FFC107"
 *             darkMode: true
 *         apiUrl:
 *           type: string
 *           description: Base API URL used by the mobile app
 *           example: "https://api.ecommerceapp.com/v1"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last configuration update timestamp
 *           example: "2025-10-28T10:00:00Z"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *           example: "2025-10-28T09:45:00Z"
 */
const MobileAppConfigSchema = new Schema(
    {
        version: { type: String, required: true, trim: true },
        theme: { type: Object, default: {} },
        apiUrl: { type: String, required: true, trim: true },
        updatedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model('MobileAppConfig', MobileAppConfigSchema);

