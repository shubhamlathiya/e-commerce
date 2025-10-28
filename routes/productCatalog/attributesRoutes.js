const express = require('express');
const {body, param, query} = require('express-validator');
const attributeController = require('../../controllers/productCatalog/attributeController');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Catalog - Attributes
 *   description: Manage product attributes (admin and public)
 */

/**
 * @swagger
 * /api/catalog/attributes:
 *   get:
 *     summary: Get all attributes
 *     description: Retrieve a paginated list of product attributes. Publicly accessible.
 *     tags: [Catalog - Attributes]
 *     parameters:
 *       - in: query
 *         name: isFilter
 *         schema:
 *           type: boolean
 *         description: Filter only attributes used for filtering (true/false)
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by active status (true/false)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or slug
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of attributes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Attribute'
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 total:
 *                   type: integer
 *       500:
 *         description: Server error
 */
router.get('/', [
    query('isFilter').optional().isIn(['true', 'false']),
    query('status').optional().isIn(['true', 'false']),
    query('search').optional().isString(),
    query('page').optional().isInt({min: 1}),
    query('limit').optional().isInt({min: 1, max: 200}),
], attributeController.listAttributes);

/**
 * @swagger
 * /api/catalog/attributes/{id}:
 *   get:
 *     summary: Get attribute by ID
 *     description: Retrieve a single attribute by its ID. Publicly accessible.
 *     tags: [Catalog - Attributes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attribute ID
 *     responses:
 *       200:
 *         description: Attribute details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Attribute'
 *       404:
 *         description: Attribute not found
 *       500:
 *         description: Server error
 */
router.get('/:id', [param('id').isMongoId()], attributeController.getAttribute);

/**
 * @swagger
 * /api/catalog/attributes:
 *   post:
 *     summary: Create a new attribute
 *     description: Create a new product attribute (admin only)
 *     tags: [Catalog - Attributes]
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
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *                 example: Color
 *               slug:
 *                 type: string
 *                 example: color
 *               type:
 *                 type: string
 *                 enum: [text, number, select, multiselect]
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Red", "Blue", "Green"]
 *               isFilter:
 *                 type: boolean
 *                 example: true
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Attribute created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Slug already exists
 *       500:
 *         description: Server error
 */
router.post('/', authenticateJWT, isAdmin, [
    body('name').isString().notEmpty(),
    body('slug').optional().isString(),
    body('type').isIn(['text', 'number', 'select', 'multiselect']),
    body('values').optional().isArray(),
    body('isFilter').optional().isBoolean(),
    body('status').optional().isBoolean(),
], attributeController.createAttribute);

/**
 * @swagger
 * /api/catalog/attributes/{id}:
 *   patch:
 *     summary: Update an attribute
 *     description: Update an existing attribute by ID (admin only)
 *     tags: [Catalog - Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attribute ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Color
 *               slug:
 *                 type: string
 *                 example: color
 *               type:
 *                 type: string
 *                 enum: [text, number, select, multiselect]
 *               values:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Red", "Blue", "Green"]
 *               isFilter:
 *                 type: boolean
 *                 example: true
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Attribute updated successfully
 *       404:
 *         description: Attribute not found
 *       409:
 *         description: Slug already exists
 *       500:
 *         description: Server error
 */
router.patch('/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId(),
    body('name').optional().isString(),
    body('slug').optional().isString(),
    body('type').optional().isIn(['text', 'number', 'select', 'multiselect']),
    body('values').optional().isArray(),
    body('isFilter').optional().isBoolean(),
    body('status').optional().isBoolean(),
], attributeController.updateAttribute);

/**
 * @swagger
 * /api/catalog/attributes/{id}:
 *   delete:
 *     summary: Delete an attribute
 *     description: Delete an attribute by ID (admin only)
 *     tags: [Catalog - Attributes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Attribute ID
 *     responses:
 *       200:
 *         description: Attribute deleted successfully
 *       404:
 *         description: Attribute not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], attributeController.deleteAttribute);

module.exports = router;

