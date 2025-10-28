const express = require('express');
const router = express.Router();
const {body, param, query} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const controller = require('../../controllers/productCatalog/ProductVariantController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * tags:
 *   - name: Catalog - Product Variants
 *     description: Manage product variants within the catalog
 */

/**
 * @swagger
 * /api/catalog/variants:
 *   get:
 *     summary: Get a paginated list of product variants
 *     tags: [Catalog - Product Variants]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter variants by product ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by variant status (true = active, false = inactive)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by SKU or barcode
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Paginated list of product variants
 *       500:
 *         description: Server error
 */
router.get(
    '/',
    [
        query('page').optional().isInt({min: 1}),
        query('limit').optional().isInt({min: 1, max: 200}),
        query('productId').optional().isMongoId(),
        query('status').optional().isBoolean(),
        query('search').optional().isString(),
    ],
    validate,
    controller.listVariants
);

/**
 * @swagger
 * /api/catalog/variants/{id}:
 *   get:
 *     summary: Get a product variant by ID
 *     tags: [Catalog - Product Variants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Product variant details
 *       404:
 *         description: Variant not found
 *       500:
 *         description: Server error
 */
router.get('/:id', [param('id').isMongoId()], validate, controller.getVariant);

/**
 * @swagger
 * /api/catalog/variants:
 *   post:
 *     summary: Create a new product variant (Admin only)
 *     tags: [Catalog - Product Variants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - sku
 *               - price
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Associated product ID
 *               sku:
 *                 type: string
 *                 example: "TSHIRT-BLACK-M"
 *               attributes:
 *                 type: array
 *                 description: List of variant attributes (e.g. color, size)
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Color"
 *                     value:
 *                       type: string
 *                       example: "Black"
 *               price:
 *                 type: number
 *                 example: 999.99
 *               compareAtPrice:
 *                 type: number
 *                 example: 1199.99
 *               stock:
 *                 type: integer
 *                 example: 100
 *               barcode:
 *                 type: string
 *                 example: "1234567890123"
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Product variant created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate SKU or slug
 *       500:
 *         description: Server error
 */
router.post(
    '/',
    authenticateJWT,
    isAdmin,
    [
        body('productId').isMongoId(),
        body('sku').isString().notEmpty(),
        body('attributes').optional().isArray(),
        body('price').isFloat({gt: 0}),
        body('compareAtPrice').optional().isFloat({gt: 0}),
        body('stock').optional().isInt({min: 0}),
        body('barcode').optional().isString(),
        body('status').optional().isBoolean(),
    ],
    validate,
    controller.createVariant
);

/**
 * @swagger
 * /api/catalog/variants/{id}:
 *   patch:
 *     summary: Update a product variant (Admin only)
 *     tags: [Catalog - Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sku:
 *                 type: string
 *                 example: "TSHIRT-BLACK-L"
 *               attributes:
 *                 type: array
 *                 description: Updated attributes for the variant
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Size"
 *                     value:
 *                       type: string
 *                       example: "Large"
 *               price:
 *                 type: number
 *                 example: 1099.99
 *               compareAtPrice:
 *                 type: number
 *                 example: 1299.99
 *               stock:
 *                 type: integer
 *                 example: 75
 *               barcode:
 *                 type: string
 *                 example: "9876543210987"
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Product variant updated successfully
 *       404:
 *         description: Variant not found
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id',
    authenticateJWT,
    isAdmin,
    [
        param('id').isMongoId(),
        body('sku').optional().isString(),
        body('attributes').optional().isArray(),
        body('price').optional().isFloat({gt: 0}),
        body('compareAtPrice').optional().isFloat({gt: 0}),
        body('stock').optional().isInt({min: 0}),
        body('barcode').optional().isString(),
        body('status').optional().isBoolean(),
    ],
    validate,
    controller.updateVariant
);

/**
 * @swagger
 * /api/catalog/variants/{id}:
 *   delete:
 *     summary: Delete a product variant (Admin only)
 *     tags: [Catalog - Product Variants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Variant ID
 *     responses:
 *       200:
 *         description: Product variant deleted successfully
 *       404:
 *         description: Variant not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], validate, controller.deleteVariant);

module.exports = router;

