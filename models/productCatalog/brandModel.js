const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     Brand:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the brand
 *         name:
 *           type: string
 *           description: Brand name
 *         slug:
 *           type: string
 *           description: URL-friendly version of the name
 *         logo:
 *           type: string
 *           description: URL to brand logo
 *         description:
 *           type: string
 *           description: Brand description
 *         website:
 *           type: string
 *           description: Brand website URL
 *         status:
 *           type: boolean
 *           description: Whether the brand is active
 *         isFeatured:
 *           type: boolean
 *           description: Whether to show in featured sections
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
const BrandSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    logo: {
        type: String,
        default: null
    },
    description: {
        type: String,
        trim: true
    },
    website: {
        type: String,
        trim: true
    },
    status: {
        type: Boolean,
        default: true
    },
    isFeatured: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Indexes for efficient querying
BrandSchema.index({ slug: 1 });
BrandSchema.index({ name: 1 });
BrandSchema.index({ isFeatured: 1 });
BrandSchema.index({ status: 1 });

// Validate website URL format if provided
BrandSchema.path('website').validate(function(value) {
    if (!value) return true;

    try {
        new URL(value);
        return true;
    } catch (err) {
        return false;
    }
}, 'Invalid website URL format');

const Brand = mongoose.model('Brand', BrandSchema);

module.exports = Brand;