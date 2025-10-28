const express = require('express');
const router = express.Router();
const {body, param, query} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const tagController = require('../../controllers/productCatalog/tagController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * tags:
 *   - name: Catalog - Tags
 *     description: Manage product tags within the catalog
 */

/**
 * @swagger
 * /api/catalog/tags:
 *   get:
 *     summary: Get a paginated list of tags
 *     tags: [Catalog - Tags]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by tag status (true = active, false = inactive)
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by tag name or slug
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
 *         description: Paginated list of tags
 *       500:
 *         description: Server error
 */
router.get(
    '/',
    [query('page').optional().isInt({min: 1}), query('limit').optional().isInt({
        min: 1,
        max: 200
    }), query('status').optional().isBoolean(), query('search').optional().isString()],
    validate,
    tagController.listTags
);

/**
 * @swagger
 * /api/catalog/tags/{id}:
 *   get:
 *     summary: Get a tag by ID
 *     tags: [Catalog - Tags]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag ID
 *     responses:
 *       200:
 *         description: Tag details
 *       404:
 *         description: Tag not found
 *       500:
 *         description: Server error
 */
router.get('/:id', [param('id').isMongoId()], validate, tagController.getTag);

/**
 * @swagger
 * /api/catalog/tags:
 *   post:
 *     summary: Create a new tag (Admin only)
 *     tags: [Catalog - Tags]
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
 *                 example: "New Arrival"
 *               slug:
 *                 type: string
 *                 example: "new-arrival"
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Tag created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate tag name or slug
 *       500:
 *         description: Server error
 */
router.post('/', authenticateJWT, isAdmin, [body('name').isString().notEmpty(), body('slug').optional().isString(), body('status').optional().isBoolean()], validate, tagController.createTag);

/**
 * @swagger
 * /api/catalog/tags/{id}:
 *   patch:
 *     summary: Update a tag (Admin only)
 *     tags: [Catalog - Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Featured"
 *               slug:
 *                 type: string
 *                 example: "featured"
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Tag updated successfully
 *       404:
 *         description: Tag not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', authenticateJWT, isAdmin, [param('id').isMongoId(), body('name').optional().isString(), body('slug').optional().isString(), body('status').optional().isBoolean()], validate, tagController.updateTag);

/**
 * @swagger
 * /api/catalog/tags/{id}:
 *   delete:
 *     summary: Delete a tag (Admin only)
 *     tags: [Catalog - Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag ID
 *     responses:
 *       200:
 *         description: Tag deleted successfully
 *       404:
 *         description: Tag not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], validate, tagController.deleteTag);

module.exports = router;

