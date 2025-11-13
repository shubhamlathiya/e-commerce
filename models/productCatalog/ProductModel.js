const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProductSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, 'Product title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters']
        },
        slug: {
            type: String,
            required: [true, 'Product slug is required'],
            unique: true,
            trim: true,
            match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters']
        },
        brandId: {
            type: Schema.Types.ObjectId,
            ref: 'Brand',
            index: true
        },
        categoryIds: [{
            type: Schema.Types.ObjectId,
            ref: 'Category',
            index: true
        }],
        type: {
            type: String,
            enum: ['simple', 'variant'],
            default: 'simple'
        },
        sku: {
            type: String,
            trim: true,
            sparse: true // Allows multiple nulls but enforces uniqueness for non-null values
        },
        thumbnail: {
            type: String,
            trim: true
        },
        images: [{
            type: String,
            trim: true
        }],
        status: {
            type: Boolean,
            default: true
        },
        isFeatured: {
            type: Boolean,
            default: false
        },
        tags: [{
            type: String,
            trim: true
        }]
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Index for better query performance
ProductSchema.index({ slug: 1 });
ProductSchema.index({ sku: 1 }, { sparse: true });
ProductSchema.index({ brandId: 1, status: 1 });
ProductSchema.index({ categoryIds: 1, status: 1 });
ProductSchema.index({ isFeatured: 1, status: 1 });
ProductSchema.index({ title: 'text', description: 'text' });

// Virtual for product gallery
ProductSchema.virtual('gallery', {
    ref: 'ProductGallery',
    localField: '_id',
    foreignField: 'productId',
    justOne: true
});

// Pre-save middleware to ensure slug is unique
ProductSchema.pre('save', async function(next) {
    if (this.isModified('slug')) {
        const existing = await mongoose.model('Product').findOne({
            slug: this.slug,
            _id: { $ne: this._id }
        });
        if (existing) {
            const error = new Error('Product with this slug already exists');
            error.name = 'ValidationError';
            return next(error);
        }
    }
    next();
});

module.exports = mongoose.model('Product', ProductSchema);