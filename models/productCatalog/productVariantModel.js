const mongoose = require('mongoose');
const { Schema } = mongoose;

const AttributePairSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true },
    },
    { _id: false }
);


/**
 * @swagger
 * components:
 *   schemas:
 *     ProductVariant:
 *       type: object
 *       required:
 *         - productId
 *         - sku
 *         - price
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the product variant
 *           example: "6720c8b4f12a3e456789abcd"
 *         productId:
 *           type: string
 *           description: Reference ID of the main product
 *           example: "671f44e2b12a34567890abcd"
 *         sku:
 *           type: string
 *           description: Unique stock keeping unit for this variant
 *           example: "SKU-IPHONE15-BLACK-128GB"
 *         attributes:
 *           type: array
 *           description: List of attribute name-value pairs (e.g., color, size)
 *           items:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Attribute name
 *                 example: "Color"
 *               value:
 *                 type: string
 *                 description: Attribute value
 *                 example: "Black"
 *         price:
 *           type: number
 *           format: float
 *           description: Selling price of the variant
 *           example: 999.99
 *         compareAtPrice:
 *           type: number
 *           format: float
 *           description: Original or old price for comparison
 *           example: 1099.99
 *         stock:
 *           type: integer
 *           description: Available quantity in stock
 *           example: 25
 *         barcode:
 *           type: string
 *           description: Barcode or unique identifier for inventory tracking
 *           example: "8901234567890"
 *         status:
 *           type: boolean
 *           description: Whether the variant is active or inactive
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the variant was created
 *           example: "2025-10-28T12:30:00.000Z"
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the variant was last updated
 *           example: "2025-10-28T14:45:00.000Z"
 *       example:
 *         _id: "6720c8b4f12a3e456789abcd"
 *         productId: "671f44e2b12a34567890abcd"
 *         sku: "SKU-IPHONE15-BLACK-128GB"
 *         attributes:
 *           - name: "Color"
 *             value: "Black"
 *           - name: "Storage"
 *             value: "128GB"
 *         price: 999.99
 *         compareAtPrice: 1099.99
 *         stock: 25
 *         barcode: "8901234567890"
 *         status: true
 *         createdAt: "2025-10-28T12:30:00.000Z"
 *         updatedAt: "2025-10-28T14:45:00.000Z"
 */
const ProductVariantSchema = new Schema(
    {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
        sku: { type: String, required: true, unique: true, trim: true },
        attributes: { type: [AttributePairSchema], default: [] },
        price: { type: Number, required: true },
        compareAtPrice: { type: Number },
        stock: { type: Number, default: 0, min: 0 },
        barcode: { type: String, trim: true },
        status: { type: Boolean, default: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model('ProductVariant', ProductVariantSchema);

