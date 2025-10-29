/**
 * @swagger
 * tags:
 *   name: Flash Sales
 *   description: Manage time-limited flash sales for products
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authenticateJWT, isAdmin } = require('../../middleware/authMiddleware');
const flashSaleController = require('../../controllers/OffersAndDiscounts/flashSaleController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * /api/promotions/flash-sales:
 *   post:
 *     summary: Create a new flash sale
 *     tags: [Flash Sales]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - products
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: Diwali Flash Sale
 *               products:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - productId
 *                     - flashPrice
 *                     - stockLimit
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: 671f44e2b12a34567890abcd
 *                     variantId:
 *                       type: string
 *                       example: 671f44e2b12a34567890abcf
 *                     flashPrice:
 *                       type: number
 *                       example: 499
 *                     stockLimit:
 *                       type: integer
 *                       example: 50
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-11-01T00:00:00.000Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-11-10T23:59:59.000Z
 *               status:
 *                 type: string
 *                 enum: [scheduled, running, expired]
 *                 example: scheduled
 *     responses:
 *       201:
 *         description: Flash sale created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/',
    authenticateJWT,
    isAdmin,
    [
        body('title').isString().notEmpty(),
        body('products').isArray({ min: 1 }),
        body('products.*.productId').isMongoId(),
        body('products.*.variantId').optional().isMongoId(),
        body('products.*.flashPrice').isFloat({ min: 0 }),
        body('products.*.stockLimit').isInt({ min: 0 }),
        body('startDate').isISO8601(),
        body('endDate').isISO8601(),
        body('status').optional().isIn(['scheduled', 'running', 'expired']),
    ],
    validate,
    flashSaleController.createFlashSale
);

/**
 * @swagger
 * /api/promotions/flash-sales:
 *   get:
 *     summary: List all flash sales
 *     tags: [Flash Sales]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, running, expired]
 *         description: Filter flash sales by status
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         description: Show only active flash sales
 *     responses:
 *       200:
 *         description: List of flash sales retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
router.get(
    '/',
    [query('status').optional().isString(), query('active').optional().isBoolean()],
    validate,
    flashSaleController.listFlashSales
);

/**
 * @swagger
 * /api/promotions/flash-sales/{id}:
 *   patch:
 *     summary: Update an existing flash sale
 *     tags: [Flash Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Flash sale ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Flash Sale
 *               status:
 *                 type: string
 *                 enum: [scheduled, running, expired]
 *                 example: running
 *     responses:
 *       200:
 *         description: Flash sale updated successfully
 *       404:
 *         description: Flash sale not found
 *       400:
 *         description: Invalid data
 */
router.patch(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    flashSaleController.updateFlashSale
);

/**
 * @swagger
 * /api/promotions/flash-sales/{id}:
 *   delete:
 *     summary: Delete a flash sale
 *     tags: [Flash Sales]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Flash sale ID
 *     responses:
 *       200:
 *         description: Flash sale deleted successfully
 *       404:
 *         description: Flash sale not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    flashSaleController.deleteFlashSale
);

module.exports = router;
