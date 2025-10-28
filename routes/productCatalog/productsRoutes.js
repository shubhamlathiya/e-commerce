const express = require('express');
const router = express.Router();
const { body, param, query } = require('express-validator');
const { authenticateJWT, isAdmin } = require('../../middleware/authMiddleware');
const productController = require('../../controllers/productCatalog/productController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * tags:
 *   - name: Catalog - Products
 *     description: Manage products in the catalog
 */


/**
 * @swagger
 * /api/catalog/products:
 *   get:
 *     summary: Get a paginated list of products
 *     tags: [Catalog - Products]
 *     parameters:
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
 *       - in: query
 *         name: brandId
 *         schema:
 *           type: string
 *         description: Filter by brand ID
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by active/inactive status
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: boolean
 *         description: Filter by featured products
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [simple, variable]
 *         description: Filter by product type
 *     responses:
 *       200:
 *         description: Paginated list of products
 *       500:
 *         description: Server error
 */
router.get(
    '/',
    [
        query('page').optional().isInt({ min: 1 }),
        query('limit').optional().isInt({ min: 1, max: 200 }),
        query('brandId').optional().isMongoId(),
        query('categoryId').optional().isMongoId(),
        query('status').optional().isBoolean(),
        query('isFeatured').optional().isBoolean(),
        query('type').optional().isIn(['simple', 'variable']),
    ],
    validate,
    productController.listProducts
);


/**
 * @swagger
 * /api/catalog/products/{id}:
 *   get:
 *     summary: Get product details by ID
 *     tags: [Catalog - Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details retrieved successfully
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.get('/:id', [param('id').isMongoId()], validate, productController.getProduct);


/**
 * @swagger
 * /api/catalog/products:
 *   post:
 *     summary: Create a new product (Admin only)
 *     tags: [Catalog - Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Product title
 *               slug:
 *                 type: string
 *                 description: Product slug (auto-generated if not provided)
 *               brandId:
 *                 type: string
 *                 description: Associated brand ID
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of category IDs
 *               type:
 *                 type: string
 *                 enum: [simple, variable]
 *                 description: Product type
 *               sku:
 *                 type: string
 *                 description: Product SKU
 *               thumbnail:
 *                 type: string
 *                 description: Thumbnail image URL
 *               status:
 *                 type: boolean
 *                 description: Active or inactive status
 *               isFeatured:
 *                 type: boolean
 *                 description: Mark product as featured
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Associated tags
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post(
    '/',
    authenticateJWT,
    isAdmin,
    [
        body('title').isString().notEmpty(),
        body('slug').optional().isString(),
        body('brandId').optional().isMongoId(),
        body('categoryIds').optional().isArray(),
        body('type').optional().isIn(['simple', 'variable']),
        body('sku').optional().isString(),
        body('thumbnail').optional().isString(),
        body('status').optional().isBoolean(),
        body('isFeatured').optional().isBoolean(),
        body('tags').optional().isArray(),
    ],
    validate,
    productController.createProduct
);


/**
 * @swagger
 * /api/catalog/products/{id}:
 *   patch:
 *     summary: Update an existing product (Admin only)
 *     tags: [Catalog - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               slug:
 *                 type: string
 *               brandId:
 *                 type: string
 *               categoryIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               type:
 *                 type: string
 *                 enum: [simple, variable]
 *               sku:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               status:
 *                 type: boolean
 *               isFeatured:
 *                 type: boolean
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.patch(
    '/:id',
    authenticateJWT,
    isAdmin,
    [
        param('id').isMongoId(),
        body('title').optional().isString(),
        body('slug').optional().isString(),
        body('brandId').optional().isMongoId(),
        body('categoryIds').optional().isArray(),
        body('type').optional().isIn(['simple', 'variable']),
        body('sku').optional().isString(),
        body('thumbnail').optional().isString(),
        body('status').optional().isBoolean(),
        body('isFeatured').optional().isBoolean(),
        body('tags').optional().isArray(),
    ],
    validate,
    productController.updateProduct
);


/**
 * @swagger
 * /api/catalog/products/{id}:
 *   delete:
 *     summary: Delete a product (Admin only)
 *     tags: [Catalog - Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to delete
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], validate, productController.deleteProduct);

module.exports = router;

