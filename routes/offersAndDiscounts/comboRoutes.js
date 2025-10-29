/**
 * @swagger
 * tags:
 *   name: Combo Offers
 *   description: Manage combo offers combining multiple products at a special price
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authenticateJWT, isAdmin } = require('../../middleware/authMiddleware');
const comboController = require('../../controllers/OffersAndDiscounts/comboController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * /api/promotions/combo:
 *   post:
 *     summary: Create a new combo offer
 *     tags: [Combo Offers]
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
 *               - items
 *               - comboPrice
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: Festive Combo Pack
 *               items:
 *                 type: array
 *                 description: List of products included in the combo
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: 671f44e2b12a34567890abcd
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *               comboPrice:
 *                 type: number
 *                 example: 999.99
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-11-01T00:00:00.000Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-11-30T23:59:59.000Z
 *     responses:
 *       201:
 *         description: Combo offer created successfully
 *       400:
 *         description: Invalid request data
 */
router.post(
    '/',
    authenticateJWT,
    isAdmin,
    [
            body('title').isString().notEmpty(),
            body('items').isArray({ min: 1 }),
            body('items.*.productId').isMongoId(),
            body('items.*.quantity').isInt({ min: 1 }),
            body('comboPrice').isFloat({ min: 0 }),
            body('status').optional().isIn(['active', 'inactive']),
            body('startDate').isISO8601(),
            body('endDate').isISO8601(),
    ],
    validate,
    comboController.createCombo
);

/**
 * @swagger
 * /api/promotions/combo:
 *   get:
 *     summary: Get a list of combo offers
 *     tags: [Combo Offers]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter combos by status
 *     responses:
 *       200:
 *         description: List of combo offers retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
router.get(
    '/',
    [query('status').optional().isString()],
    validate,
    comboController.listCombos
);

/**
 * @swagger
 * /api/promotions/combo/{id}:
 *   patch:
 *     summary: Update an existing combo offer
 *     tags: [Combo Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Combo offer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Festive Combo Pack
 *               comboPrice:
 *                 type: number
 *                 example: 899.99
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: inactive
 *     responses:
 *       200:
 *         description: Combo offer updated successfully
 *       404:
 *         description: Combo offer not found
 *       400:
 *         description: Invalid input data
 */
router.patch(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    comboController.updateCombo
);

/**
 * @swagger
 * /api/promotions/combo/{id}:
 *   delete:
 *     summary: Delete a combo offer
 *     tags: [Combo Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Combo offer ID
 *     responses:
 *       200:
 *         description: Combo offer deleted successfully
 *       404:
 *         description: Combo offer not found
 */
router.delete(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    comboController.deleteCombo
);

module.exports = router;
