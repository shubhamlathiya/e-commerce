const mongoose = require('mongoose');
const { Schema } = mongoose;

const ImageSchema = new Schema(
    {
        url: {
            type: String,
            required: [true, 'Image URL is required'],
            trim: true
        },
        alt: {
            type: String,
            default: '',
            trim: true,
            maxlength: [255, 'Alt text cannot exceed 255 characters']
        },
    },
    { _id: true } // Give each image its own ID for easier management
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
 *         _id:
 *           type: string
 *           description: Unique identifier for the image
 *           example: "6720f9c3b12a34567890abcd"
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
 *           - _id: "6720f9c3b12a34567890abcf"
 *             url: "https://cdn.example.com/products/galaxy-s24/front.jpg"
 *             alt: "Front view of Samsung Galaxy S24 Ultra"
 *           - _id: "6720f9c3b12a34567890abd0"
 *             url: "https://cdn.example.com/products/galaxy-s24/back.jpg"
 *             alt: "Back view of Samsung Galaxy S24 Ultra"
 *         createdAt: "2025-10-28T13:00:00.000Z"
 *         updatedAt: "2025-10-28T15:10:00.000Z"
 */
const ProductGallerySchema = new Schema(
    {
        productId: {
            type: Schema.Types.ObjectId,
            ref: 'Product',
            required: [true, 'Product ID is required'],
            index: true,
            unique: true // One gallery per product
        },
        images: {
            type: [ImageSchema],
            default: [],
            validate: {
                validator: function(images) {
                    return images.length <= 20; // Maximum 20 images per gallery
                },
                message: 'Gallery cannot have more than 20 images'
            }
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Index for better query performance
ProductGallerySchema.index({ productId: 1 });
ProductGallerySchema.index({ 'images._id': 1 });

// Virtual for product details
ProductGallerySchema.virtual('product', {
    ref: 'Product',
    localField: 'productId',
    foreignField: '_id',
    justOne: true
});

// Pre-remove middleware to handle image file deletion
ProductGallerySchema.pre('findOneAndDelete', async function(next) {
    try {
        const gallery = await this.model.findOne(this.getFilter());
        if (gallery && gallery.images.length > 0) {
            const { deleteUploadedImage } = require('../../utils/upload');
            for (const image of gallery.images) {
                if (image.url) {
                    const filename = image.url.split('/').pop();
                    await deleteUploadedImage("products", filename);
                }
            }
        }
        next();
    } catch (error) {
        next(error);
    }
});

module.exports = mongoose.model('ProductGallery', ProductGallerySchema);