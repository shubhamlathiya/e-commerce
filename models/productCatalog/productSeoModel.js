const mongoose = require('mongoose');
const { Schema } = mongoose;

function isValidUrl(url) {
    if (!url) return true;
    const re = /^(https?:\/\/)[\w.-]+(\.[\w.-]+)+(\/.*)?$/i;
    return re.test(url);
}

/**
 * @swagger
 * components:
 *   schemas:
 *     ProductSeo:
 *       type: object
 *       required:
 *         - productId
 *         - slug
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the product SEO record
 *           example: "6720d3a1f12a3e456789abcd"
 *         productId:
 *           type: string
 *           description: Reference ID of the product this SEO data belongs to
 *           example: "671f44e2b12a34567890abcd"
 *         metaTitle:
 *           type: string
 *           description: SEO title for the product
 *           example: "Wireless Noise Cancelling Headphones – Premium Sound"
 *         metaDescription:
 *           type: string
 *           description: SEO meta description for the product page
 *           example: "Experience crystal-clear audio and deep bass with our wireless noise cancelling headphones. Perfect for work, travel, and everyday use."
 *         keywords:
 *           type: array
 *           description: List of SEO keywords
 *           items:
 *             type: string
 *             example: "wireless headphones"
 *         slug:
 *           type: string
 *           description: SEO-friendly unique slug for the product
 *           example: "wireless-noise-cancelling-headphones"
 *         canonicalUrl:
 *           type: string
 *           description: Canonical URL for the product page
 *           example: "https://example.com/products/wireless-noise-cancelling-headphones"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the SEO record was created
 *           example: "2025-10-28T12:45:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the SEO record was last updated
 *           example: "2025-10-28T14:20:00.000Z"
 *       example:
 *         _id: "6720d3a1f12a3e456789abcd"
 *         productId: "671f44e2b12a34567890abcd"
 *         metaTitle: "Wireless Noise Cancelling Headphones – Premium Sound"
 *         metaDescription: "Experience crystal-clear audio and deep bass with our wireless noise cancelling headphones. Perfect for work, travel, and everyday use."
 *         keywords:
 *           - "wireless headphones"
 *           - "noise cancelling"
 *           - "Bluetooth audio"
 *           - "over-ear headset"
 *         slug: "wireless-noise-cancelling-headphones"
 *         canonicalUrl: "https://example.com/products/wireless-noise-cancelling-headphones"
 *         createdAt: "2025-10-28T12:45:00.000Z"
 *         updatedAt: "2025-10-28T14:20:00.000Z"
 */
const ProductSeoSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, unique: true, index: true },
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        keywords: [{ type: String, trim: true }],
        slug: { type: String, required: true, unique: true, index: true },
        canonicalUrl: {
            type: String,
            validate: {
                validator: isValidUrl,
                message: 'canonicalUrl must be a valid http(s) URL',
            },
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ProductSeo', ProductSeoSchema);

