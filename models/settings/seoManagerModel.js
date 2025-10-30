const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * @swagger
 * components:
 *   schemas:
 *     SeoManager:
 *       type: object
 *       required:
 *         - page
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the SEO entry
 *           example: 67205d8e9f3c5b1d6f8e3b90
 *         page:
 *           type: string
 *           description: Page name or route associated with SEO data
 *           example: "home"
 *         metaTitle:
 *           type: string
 *           description: Meta title for the page
 *           example: "Buy Best Products Online - E-Commerce Store"
 *         metaDescription:
 *           type: string
 *           description: Meta description content for SEO
 *           example: "Shop the best electronics, fashion, and home items at unbeatable prices."
 *         metaKeywords:
 *           type: array
 *           items:
 *             type: string
 *           description: List of meta keywords
 *           example: ["ecommerce", "shopping", "online store"]
 *         canonicalUrl:
 *           type: string
 *           description: Canonical URL for the page
 *           example: "https://www.example.com/home"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *           example: "2025-10-28T10:00:00Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record update timestamp
 *           example: "2025-10-28T10:30:00Z"
 */
const SeoManagerSchema = new Schema(
    {
        page: { type: String, required: true, trim: true, unique: true },
        metaTitle: { type: String, default: '', trim: true },
        metaDescription: { type: String, default: '', trim: true },
        metaKeywords: { type: [String], default: [] },
        canonicalUrl: { type: String, default: '' },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SeoManager', SeoManagerSchema);