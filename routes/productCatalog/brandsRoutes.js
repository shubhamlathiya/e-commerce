const express = require('express');
const { body, param, query } = require('express-validator');
const brandController = require('../../controllers/productCatalog/brandController');
const { authenticateJWT, isAdmin } = require('../../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Catalog - Brands
 *     description: Manage product brands in the catalog
 */

/**
 * @swagger
 * /api/catalog/brands:
 *   get:
 *     summary: Get a paginated list of brands
 *     tags: [Catalog - Brands]
 *     parameters:
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by featured status
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active/inactive brands
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by brand name or slug
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
 *         description: Paginated list of brands
 *       500:
 *         description: Server error
 */
router.get('/', [
    query('isFeatured').optional().isIn(['true', 'false']),
    query('status').optional().isIn(['true', 'false']),
    query('search').optional().isString(),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 200 }),
], brandController.listBrands);

router.get('/:id', [param('id').isMongoId()], brandController.getBrand);

/**
 * @swagger
 * /api/catalog/brands:
 *   post:
 *     summary: Create a new brand (admin only)
 *     tags: [Catalog - Brands]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Brand name
 *               slug:
 *                 type: string
 *                 description: Optional custom slug (auto-generated if omitted)
 *               logo:
 *                 type: string
 *                 description: URL or file path to brand logo
 *               description:
 *                 type: string
 *                 description: Description of the brand
 *               website:
 *                 type: string
 *                 description: Brand’s official website
 *               status:
 *                 type: boolean
 *                 description: Whether the brand is active
 *               isFeatured:
 *                 type: boolean
 *                 description: Whether the brand is featured
 *           example:
 *             name: "Samsung"
 *             slug: "samsung"
 *             logo: "https://cdn.example.com/brands/samsung.png"
 *             description: "Leading electronics and smartphone brand"
 *             website: "https://localhost.com"
 *             status: true
 *             isFeatured: true
 *     responses:
 *       201:
 *         description: Brand created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Slug already exists
 *       500:
 *         description: Server error
 */
router.post('/', authenticateJWT, isAdmin, [
    body('name').isString().notEmpty(),
    body('slug').optional().isString(),
    body('logo').optional().isString(),
    body('description').optional().isString(),
    body('website').optional().isString(),
    body('status').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
], brandController.createBrand);



/**
 * @swagger
 * /api/catalog/brands/{id}:
 *   patch:
 *     summary: Update an existing brand (admin only)
 *     tags: [Catalog - Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Brand name
 *               slug:
 *                 type: string
 *                 description: Slug for the brand (auto-updates if name changes)
 *               logo:
 *                 type: string
 *                 description: Brand logo URL or path
 *               description:
 *                 type: string
 *                 description: Brand description
 *               website:
 *                 type: string
 *                 description: Official website
 *               status:
 *                 type: boolean
 *                 description: Active or inactive
 *               isFeatured:
 *                 type: boolean
 *                 description: Featured flag
 *     responses:
 *       200:
 *         description: Brand updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Brand not found
 *       409:
 *         description: Slug already exists
 *       500:
 *         description: Server error
 */
router.patch('/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId(),
    body('name').optional().isString(),
    body('slug').optional().isString(),
    body('logo').optional().isString(),
    body('description').optional().isString(),
    body('website').optional().isString(),
    body('status').optional().isBoolean(),
    body('isFeatured').optional().isBoolean(),
], brandController.updateBrand);

/**
 * @swagger
 * /api/catalog/brands/{id}:
 *   delete:
 *     summary: Delete a brand (admin only)
 *     tags: [Catalog - Brands]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Brand ID
 *     responses:
 *       200:
 *         description: Brand deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Brand not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], brandController.deleteBrand);

module.exports = router;

