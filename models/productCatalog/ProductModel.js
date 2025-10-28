const mongoose = require('mongoose');
const { Schema } = mongoose;

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - title
 *         - slug
 *         - type
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the product
 *           example: "6720e1a4b12a34567890abcd"
 *         title:
 *           type: string
 *           description: Product title or name
 *           example: "Samsung Galaxy S24 Ultra"
 *         slug:
 *           type: string
 *           description: URL-friendly slug (auto-generated from title if not provided)
 *           example: "samsung-galaxy-s24-ultra"
 *         description:
 *           type: string
 *           description: Detailed product description
 *           example: "The Samsung Galaxy S24 Ultra features a 200MP camera, 5000mAh battery, and Snapdragon 8 Gen 3 processor."
 *         brandId:
 *           type: string
 *           description: Reference ID of the brand associated with the product
 *           example: "671f44e2b12a34567890abcd"
 *         categoryIds:
 *           type: array
 *           description: List of category IDs the product belongs to
 *           items:
 *             type: string
 *             example: "671f44e2b12a34567890abce"
 *         type:
 *           type: string
 *           enum: [simple, variable]
 *           description: Product type — simple (single SKU) or variable (has variants)
 *           example: "simple"
 *         sku:
 *           type: string
 *           description: Stock Keeping Unit (required for simple products)
 *           example: "SKU-S24U-256GB-BLK"
 *         thumbnail:
 *           type: string
 *           description: URL of the main product image
 *           example: "https://cdn.example.com/products/s24ultra/main.jpg"
 *         status:
 *           type: boolean
 *           description: Whether the product is active or inactive
 *           example: true
 *         isFeatured:
 *           type: boolean
 *           description: Whether the product is featured on the store
 *           example: false
 *         tags:
 *           type: array
 *           description: List of searchable product tags
 *           items:
 *             type: string
 *             example: "smartphone"
 *         tenantId:
 *           type: string
 *           description: Tenant or store identifier (for multi-tenant environments)
 *           example: "tenant_abc123"
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the product was created
 *           example: "2025-10-28T13:00:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the product was last updated
 *           example: "2025-10-28T15:10:00.000Z"
 *       example:
 *         _id: "6720e1a4b12a34567890abcd"
 *         title: "Samsung Galaxy S24 Ultra"
 *         slug: "samsung-galaxy-s24-ultra"
 *         description: "The Samsung Galaxy S24 Ultra features a 200MP camera, 5000mAh battery, and Snapdragon 8 Gen 3 processor."
 *         brandId: "671f44e2b12a34567890abcd"
 *         categoryIds:
 *           - "671f44e2b12a34567890abce"
 *           - "671f44e2b12a34567890abcf"
 *         type: "simple"
 *         sku: "SKU-S24U-256GB-BLK"
 *         thumbnail: "https://cdn.example.com/products/s24ultra/main.jpg"
 *         status: true
 *         isFeatured: false
 *         tags:
 *           - "smartphone"
 *           - "android"
 *           - "samsung"
 *         tenantId: "tenant_abc123"
 *         createdAt: "2025-10-28T13:00:00.000Z"
 *         updatedAt: "2025-10-28T15:10:00.000Z"
 */
const ProductSchema = new Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, index: true },
        description: { type: String, default: '' },
        brandId: { type: Schema.Types.ObjectId, ref: 'Brand', index: true },
        categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category', index: true }],
        type: { type: String, enum: ['simple', 'variable'], default: 'simple', required: true },
        sku: { type: String, sparse: true, unique: true, trim: true },
        thumbnail: { type: String, default: '' },
        status: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
        tags: [{ type: String, lowercase: true, trim: true }],
        tenantId: { type: String, index: true },
    },
    { timestamps: true }
);

// Text index for search optimization
ProductSchema.index({ title: 'text' });

// Ensure sku if simple type
ProductSchema.pre('validate', function (next) {
    if (this.type === 'simple' && !this.sku) {
        return next(new Error('SKU is required for simple products'));
    }
    next();
});

// Auto slug from title if not provided
ProductSchema.pre('validate', function (next) {
    if (!this.slug && this.title) {
        this.slug = slugify(this.title);
    }
    next();
});

module.exports = mongoose.model('Product', ProductSchema);

