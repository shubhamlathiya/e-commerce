const express = require('express');
const {body, param, query} = require('express-validator');
const categoryController = require('../../controllers/productCatalog/categoryController');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const { categoryMediaUpload } = require('../../utils/upload');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name:  Catalog - Category
 *   description: Category management APIs for product catalog
 */


/**
 * @swagger
 * /api/catalog/categories:
 *   get:
 *     summary: Get a paginated list of categories
 *     tags: [Catalog - Category]
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Filter by parent category ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active/inactive categories
 *       - in: query
 *         name: level
 *         schema:
 *           type: integer
 *         description: Filter by category level
 *       - in: query
 *         name: isFeatured
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by featured categories
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by category name or slug
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
 *         description: Paginated list of categories
 *       500:
 *         description: Server error
 */
router.get('/', [
    query('parentId').optional(),
    query('status').optional().isIn(['true', 'false']),
    query('level').optional().isInt({min: 0}),
    query('isFeatured').optional().isIn(['true', 'false']),
    query('search').optional().isString(),
    query('page').optional().isInt({min: 1}),
    query('limit').optional().isInt({min: 1, max: 200}),
], categoryController.listCategories);


/**
 * @swagger
 * /api/catalog/categories/tree:
 *   get:
 *     summary: Get category tree structure
 *     tags: [Catalog - Category]
 *     parameters:
 *       - in: query
 *         name: parentId
 *         schema:
 *           type: string
 *         description: Parent category ID to start from
 *       - in: query
 *         name: maxDepth
 *         schema:
 *           type: integer
 *           default: 3
 *         description: Maximum depth of nested categories to retrieve
 *     responses:
 *       200:
 *         description: Category tree structure
 *       500:
 *         description: Server error
 */
router.get('/tree', [
    query('parentId').optional(),
    query('maxDepth').optional().isInt({min: 1, max: 10}),
], categoryController.getTree);

/**
 * @swagger
 * /api/catalog/categories/{id}/breadcrumbs:
 *   get:
 *     summary: Get breadcrumbs for a specific category
 *     tags: [Catalog - Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Breadcrumb trail for category
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get('/:id/breadcrumbs', [param('id').isMongoId()], categoryController.getBreadcrumbs);

/**
 * @swagger
 * /api/catalog/categories/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags: [Catalog - Category]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.get('/:id', [param('id').isMongoId()], categoryController.getCategoryById);

/**
 * @swagger
 * /api/catalog/categories:
 *   post:
 *     summary: Create a new category (admin only)
 *     tags: [Catalog - Category]
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
 *               - slug
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name
 *               slug:
 *                 type: string
 *                 description: URL-friendly unique identifier for the category
 *               parentId:
 *                 type: string
 *                 description: Parent category ID (if this is a subcategory)
 *               icon:
 *                 type: string
 *                 description: Icon filename or path representing the category
 *               image:
 *                 type: string
 *                 description: Image URL for the category
 *               status:
 *                 type: boolean
 *                 description: Whether the category is active
 *               sortOrder:
 *                 type: integer
 *                 description: Display order of the category
 *               metaTitle:
 *                 type: string
 *                 description: SEO meta title for the category
 *               metaDescription:
 *                 type: string
 *                 description: SEO meta description for the category
 *           example:
 *             name: "Smartphones"
 *             slug: "smartphones"
 *             parentId: "64f9a45d3efb24d6b87a0002"
 *             icon: "icon-smartphone.svg"
 *             image: "https://cdn.example.com/categories/smartphones.jpg"
 *             status: true
 *             sortOrder: 3
 *             metaTitle: "Smartphones"
 *             metaDescription: "Find the latest Android and iPhone models."
 *     responses:
 *       201:
 *         description: Category created successfully
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
router.post('/', authenticateJWT, isAdmin, categoryMediaUpload(), [
    body('name').isString().notEmpty(),
    body('slug').optional().isString(),
    body('parentId').optional().isMongoId(),
    body('icon').optional().isString(),
    body('image').optional().isString(),
    body('status').optional().isBoolean(),
    body('sortOrder').optional().isInt({min: 0}),
    body('isFeatured').optional().isBoolean(),
    body('metaTitle').optional().isString(),
    body('metaDescription').optional().isString(),
], categoryController.createCategory);


/**
 * @swagger
 * /api/catalog/categories/{id}:
 *   patch:
 *     summary: Update category details (Admin only)
 *     tags: [Catalog - Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               slug:
 *                 type: string
 *               parentId:
 *                 type: string
 *                 nullable: true
 *               icon:
 *                 type: string
 *               image:
 *                 type: string
 *               status:
 *                 type: boolean
 *               sortOrder:
 *                 type: integer
 *               isFeatured:
 *                 type: boolean
 *               metaTitle:
 *                 type: string
 *               metaDescription:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', authenticateJWT, isAdmin, categoryMediaUpload(), [
    param('id').isMongoId(),
    body('name').optional().isString(),
    body('slug').optional().isString(),
    body('parentId').optional().custom((value) => value === null || /^[a-f\d]{24}$/i.test(value)),
    body('icon').optional().isString(),
    body('image').optional().isString(),
    body('status').optional().isBoolean(),
    body('sortOrder').optional().isInt({min: 0}),
    body('isFeatured').optional().isBoolean(),
    body('metaTitle').optional().isString(),
    body('metaDescription').optional().isString(),
], categoryController.updateCategory);


/**
 * @swagger
 * /api/catalog/categories/{id}:
 *   delete:
 *     summary: Delete a category (Admin only)
 *     tags: [Catalog - Category]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *       - in: query
 *         name: cascade
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Whether to delete subcategories as well
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Category not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId(),
    query('cascade').optional().isIn(['true', 'false']),
], categoryController.deleteCategory);

module.exports = router;

