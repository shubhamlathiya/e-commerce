const mongoose = require('mongoose');
const { Schema } = mongoose;

const ImageSchema = new Schema(
    {
        url: { type: String, required: true, trim: true },
        alt: { type: String, default: '', trim: true },
    },
    { _id: false }
);

/**
 * @swagger
 * components:
 *   schemas:
 *
 *     Image:
 *       type: object
 *       required:
 *         - url
 *       properties:
 *         url:
 *           type: string
 *           description: URL of the product image
 *           example: "https://cdn.example.com/products/galaxy-s24/front.jpg"
 *         alt:
 *           type: string
 *           description: Alternative text for the image
 *           example: "Front view of Samsung Galaxy S24 Ultra"

 *     ProductGallery:
 *       type: object
 *       required:
 *         - productId
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the product gallery entry
 *           example: "6720f9c3b12a34567890abcd"
 *         productId:
 *           type: string
 *           description: Reference ID of the associated product
 *           example: "6720f2a4b12a34567890abce"
 *         images:
 *           type: array
 *           description: List of product images
 *           items:
 *             $ref: '#/components/schemas/Image'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date when the gallery entry was created
 *           example: "2025-10-28T13:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date when the gallery entry was last updated
 *           example: "2025-10-28T15:10:00.000Z"
 *       example:
 *         _id: "6720f9c3b12a34567890abcd"
 *         productId: "6720f2a4b12a34567890abce"
 *         images:
 *           - url: "https://cdn.example.com/products/galaxy-s24/front.jpg"
 *             alt: "Front view of Samsung Galaxy S24 Ultra"
 *           - url: "https://cdn.example.com/products/galaxy-s24/back.jpg"
 *             alt: "Back view of Samsung Galaxy S24 Ultra"
 *         createdAt: "2025-10-28T13:00:00.000Z"
 *         updatedAt: "2025-10-28T15:10:00.000Z"
 */
const ProductGallerySchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        images: { type: [ImageSchema], default: [] },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ProductGallery', ProductGallerySchema);

