const express = require('express');
const router = express.Router();
const {body, query} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const StockLogController = require('../../controllers/productCatalog/StockLogController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * tags:
 *   - name: Catalog - Stock Logs
 *     description: Manage stock adjustments and movement history for products and variants
 */


/**
 * @swagger
 * /api/catalog/stock:
 *   post:
 *     summary: Create a stock log entry (Admin only)
 *     tags: [Catalog - Stock Logs]
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
 *               - type
 *               - quantity
 *               - source
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID
 *                 example: "690074965e14ec6006bc7c70"
 *               variantId:
 *                 type: string
 *                 description: Variant ID (if applicable)
 *                 example: "6900784bcf00063cf78b0fb3"
 *               type:
 *                 type: string
 *                 enum: [in, out]
 *                 description: Type of stock movement (in or out)
 *                 example: "in"
 *               quantity:
 *                 type: integer
 *                 description: Quantity adjusted
 *                 example: 100
 *               source:
 *                 type: string
 *                 enum: [manual, order, return]
 *                 description: Source of the stock change
 *                 example: "manual"
 *               note:
 *                 type: string
 *                 description: Optional note for reference
 *                 example: "Initial stock load for new product"
 *     responses:
 *       201:
 *         description: Stock log created successfully
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
        body('productId').isMongoId(),
        body('variantId').optional().isMongoId(),
        body('type').isIn(['in', 'out']),
        body('quantity').isInt({min: 1}),
        body('source').isIn(['manual', 'order', 'return']),
        body('note').optional().isString(),
    ],
    validate,
    StockLogController.createStockLog
);


/**
 * @swagger
 * /api/catalog/stock:
 *   get:
 *     summary: Get a paginated list of stock logs (Admin only)
 *     tags: [Catalog - Stock Logs]
 *     security:
 *       - bearerAuth: []
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
 *         name: productId
 *         schema:
 *           type: string
 *         description: Filter logs by product ID
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *         description: Filter logs by variant ID
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [in, out]
 *         description: Filter by stock movement type
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [manual, order, return]
 *         description: Filter by stock source
 *     responses:
 *       200:
 *         description: Paginated list of stock logs
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get(
    '/',
    authenticateJWT,
    isAdmin,
    [
        query('page').optional().isInt({min: 1}),
        query('limit').optional().isInt({min: 1, max: 200}),
        query('productId').optional().isMongoId(),
        query('variantId').optional().isMongoId(),
        query('type').optional().isIn(['in', 'out']),
        query('source').optional().isIn(['manual', 'order', 'return']),
    ],
    validate,
    StockLogController.listStockLogs
);

module.exports = router;

