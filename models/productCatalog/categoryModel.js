const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * @swagger
 * components:
 *   schemas:
 *     Category:
 *       type: object
 *       required:
 *         - name
 *         - slug
 *         - level
 *       properties:
 *         _id:
 *           type: string
 *           description: The auto-generated id of the category
 *         name:
 *           type: string
 *           description: Category name
 *         slug:
 *           type: string
 *           description: URL-friendly version of the name
 *         parentId:
 *           type: string
 *           description: Reference to parent category (null for root categories)
 *         level:
 *           type: number
 *           description: Hierarchy level (0 for root categories)
 *         icon:
 *           type: string
 *           description: URL to category icon
 *         image:
 *           type: string
 *           description: URL to category banner image
 *         status:
 *           type: boolean
 *           description: Whether the category is active
 *         sortOrder:
 *           type: number
 *           description: Order for display sorting
 *         isFeatured:
 *           type: boolean
 *           description: Whether to show on home screen
 *         metaTitle:
 *           type: string
 *           description: SEO meta title
 *         metaDescription:
 *           type: string
 *           description: SEO meta description
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 */
const CategorySchema = new Schema({
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
    parentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    level: {
        type: Number,
        required: true,
        default: 0
    },
    icon: {
        type: String,
        default: null
    },
    image: {
        type: String,
        default: null
    },
    status: {
        type: Boolean,
        default: true
    },
    sortOrder: {
        type: Number,
        default: 0
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    metaTitle: {
        type: String,
        trim: true
    },
    metaDescription: {
        type: String,
        trim: true
    }
}, { timestamps: true });

// Indexes for efficient querying
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parentId: 1 });
CategorySchema.index({ level: 1 });
CategorySchema.index({ isFeatured: 1 });
CategorySchema.index({ status: 1 });

// Pre-save hook to ensure level is set correctly based on parent
CategorySchema.pre('save', async function(next) {
    if (this.isModified('parentId')) {
        if (this.parentId === null) {
            this.level = 0;
        } else {
            const parent = await this.constructor.findById(this.parentId);
            if (parent) {
                this.level = parent.level + 1;
            } else {
                this.level = 0;
                this.parentId = null;
            }
        }
    }
    next();
});

// Virtual for getting child categories
CategorySchema.virtual('children', {
    ref: 'Category',
    localField: '_id',
    foreignField: 'parentId'
});

// Method to get full category path (breadcrumbs)
CategorySchema.methods.getPath = async function() {
    const path = [this];
    let currentCategory = this;

    while (currentCategory.parentId) {
        const parent = await this.constructor.findById(currentCategory.parentId);
        if (!parent) break;
        path.unshift(parent);
        currentCategory = parent;
    }

    return path;
};

const Category = mongoose.model('Category', CategorySchema);

module.exports = Category;