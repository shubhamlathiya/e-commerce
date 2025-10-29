/**
 * @swagger
 * tags:
 *   name: BOGO
 *   description: Manage Buy One Get One (BOGO) offers for products and categories
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authenticateJWT, isAdmin } = require('../../middleware/authMiddleware');
const bogoController = require('../../controllers/OffersAndDiscounts/bogoController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * /api/promotions/bogo:
 *   post:
 *     summary: Create a new BOGO (Buy One Get One) offer
 *     tags: [BOGO]
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
 *               - buy
 *               - get
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: Buy 1 Get 1 Free on T-Shirts
 *               buy:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                     example: 1
 *                   products:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["671f44e2b12a34567890abcd"]
 *                   categories:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["671f44e2b12a34567890abce"]
 *               get:
 *                 type: object
 *                 properties:
 *                   quantity:
 *                     type: integer
 *                     example: 1
 *                   products:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["671f44e2b12a34567890abcf"]
 *                   discountType:
 *                     type: string
 *                     enum: [free, percent, flat]
 *                     example: free
 *                   value:
 *                     type: number
 *                     example: 0
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-11-01T00:00:00.000Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-11-15T23:59:59.000Z
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *     responses:
 *       201:
 *         description: BOGO offer created successfully
 *       400:
 *         description: Invalid input data
 */
router.post(
    '/',
    authenticateJWT,
    isAdmin,
    [
            body('title').isString().notEmpty(),
            body('buy.quantity').isInt({ min: 1 }),
            body('buy.products').optional().isArray(),
            body('buy.categories').optional().isArray(),
            body('get.quantity').isInt({ min: 1 }),
            body('get.products').optional().isArray(),
            body('get.discountType').isIn(['free', 'percent', 'flat']),
            body('get.value').optional().isFloat({ min: 0 }),
            body('startDate').isISO8601(),
            body('endDate').isISO8601(),
            body('status').optional().isIn(['active', 'inactive']),
    ],
    validate,
    bogoController.createBogo
);

/**
 * @swagger
 * /api/promotions/bogo:
 *   get:
 *     summary: Get a list of BOGO offers
 *     tags: [BOGO]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         example: active
 *         description: Filter offers by status
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         example: true
 *         description: Filter currently active offers
 *     responses:
 *       200:
 *         description: List of BOGO offers
 *       400:
 *         description: Invalid query parameters
 */
router.get(
    '/',
    [query('status').optional().isString(), query('active').optional().isBoolean()],
    validate,
    bogoController.listBogo
);

/**
 * @swagger
 * /api/promotions/bogo/{id}:
 *   patch:
 *     summary: Update a BOGO offer
 *     tags: [BOGO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the BOGO offer to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Buy 2 Get 1 Free
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: inactive
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-12-31T23:59:59.000Z
 *     responses:
 *       200:
 *         description: BOGO offer updated successfully
 *       404:
 *         description: Offer not found
 *       400:
 *         description: Invalid input
 */
router.patch(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    bogoController.updateBogo
);

/**
 * @swagger
 * /api/promotions/bogo/{id}:
 *   delete:
 *     summary: Delete a BOGO offer
 *     tags: [BOGO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the BOGO offer to delete
 *     responses:
 *       200:
 *         description: BOGO offer deleted successfully
 *       404:
 *         description: Offer not found
 */
router.delete(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    bogoController.deleteBogo
);

module.exports = router;
