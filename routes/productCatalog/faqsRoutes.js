const express = require('express');
const router = express.Router();
const {body, param, query} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const productFaqController = require('../../controllers/productCatalog/productFaqController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * tags:
 *   - name: Catalog - Product FAQs
 *     description: Manage product FAQs in the catalog
 */

/**
 * @swagger
 * /api/catalog/product-faqs:
 *   get:
 *     summary: Get a paginated list of FAQs for products
 *     tags: [Catalog - Product FAQs]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter FAQs by product ID
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
 *         description: Paginated list of product FAQs
 *       500:
 *         description: Server error
 */
router.get('/', [query('productId').optional().isMongoId(), query('page').optional().isInt({min: 1}), query('limit').optional().isInt({
    min: 1, max: 200
})], validate, productFaqController.listFaqs);

/**
 * @swagger
 * /api/catalog/product-faqs/{id}:
 *   get:
 *     summary: Get a specific product FAQ by ID
 *     tags: [Catalog - Product FAQs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product FAQ ID
 *     responses:
 *       200:
 *         description: Product FAQ details
 *       404:
 *         description: FAQ not found
 *       500:
 *         description: Server error
 */
router.get('/:id', [param('id').isMongoId()], validate, productFaqController.getFaq);

/**
 * @swagger
 * /api/catalog/product-faqs:
 *   post:
 *     summary: Create a new product FAQ (Admin only)
 *     tags: [Catalog - Product FAQs]
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
 *               - question
 *               - answer
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Related product ID
 *               question:
 *                 type: string
 *                 example: "Does this product come with a warranty?"
 *               answer:
 *                 type: string
 *                 example: "Yes, it includes a 1-year manufacturer warranty."
 *     responses:
 *       201:
 *         description: Product FAQ created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', authenticateJWT, isAdmin, [body('productId').isMongoId(), body('question').isString().notEmpty(), body('answer').isString().notEmpty()], validate, productFaqController.createFaq);

/**
 * @swagger
 * /api/catalog/product-faqs/{id}:
 *   patch:
 *     summary: Update an existing product FAQ (Admin only)
 *     tags: [Catalog - Product FAQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product FAQ ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               question:
 *                 type: string
 *                 example: "Is there a return policy?"
 *               answer:
 *                 type: string
 *                 example: "Yes, returns are accepted within 30 days of delivery."
 *     responses:
 *       200:
 *         description: Product FAQ updated successfully
 *       404:
 *         description: FAQ not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', authenticateJWT, isAdmin, [param('id').isMongoId(), body('question').optional().isString(), body('answer').optional().isString()], validate, productFaqController.updateFaq);

/**
 * @swagger
 * /api/catalog/product-faqs/{id}:
 *   delete:
 *     summary: Delete a product FAQ (Admin only)
 *     tags: [Catalog - Product FAQs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Product FAQ ID
 *     responses:
 *       200:
 *         description: Product FAQ deleted successfully
 *       404:
 *         description: FAQ not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], validate, productFaqController.deleteFaq);

module.exports = router;

