/**
 * @swagger
 * tags:
 *   name: AutoDiscount
 *   description: Manage automatic discounts for products, categories, and brands
 */

const express = require('express');
const router = express.Router();
const {body, query, param} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const autoDiscountController = require('../../controllers/OffersAndDiscounts/autoDiscountController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * /api/promotions/auto-discount:
 *   post:
 *     summary: Create a new automatic discount rule
 *     tags: [AutoDiscount]
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
 *               - discountType
 *               - value
 *               - applicableTo
 *               - startDate
 *               - endDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: Diwali Mega Sale
 *               discountType:
 *                 type: string
 *                 enum: [flat, percent]
 *                 example: percent
 *               value:
 *                 type: number
 *                 example: 10
 *               minCartValue:
 *                 type: number
 *                 example: 500
 *               applicableTo:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [product, category, brand, all]
 *                     example: category
 *                   ids:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["671f44e2b12a34567890abcd", "671f44e2b12a34567890abce"]
 *               priority:
 *                 type: integer
 *                 example: 1
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
 *         description: Auto discount created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
    '/',
    authenticateJWT,
    isAdmin,
    [
        body('title').isString().notEmpty(),
        body('discountType').isIn(['flat', 'percent']),
        body('value').isFloat({min: 0}),
        body('minCartValue').optional().isFloat({min: 0}),
        body('applicableTo.type').isIn(['product', 'category', 'brand', 'all']),
        body('applicableTo.ids').optional().isArray(),
        body('priority').optional().isInt(),
        body('startDate').isISO8601(),
        body('endDate').isISO8601(),
        body('status').optional().isIn(['active', 'inactive']),
    ],
    validate,
    autoDiscountController.createAutoDiscount
);

/**
 * @swagger
 * /api/promotions/auto-discount:
 *   get:
 *     summary: Get all automatic discounts
 *     tags: [AutoDiscount]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         example: active
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *         example: true
 *     responses:
 *       200:
 *         description: List of automatic discounts
 *       400:
 *         description: Invalid query parameters
 */
router.get(
    '/',
    [query('status').optional().isString(), query('active').optional().isBoolean()],
    validate,
    autoDiscountController.listAutoDiscounts
);

/**
 * @swagger
 * /api/promotions/auto-discount/{id}:
 *   patch:
 *     summary: Update an automatic discount
 *     tags: [AutoDiscount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auto discount to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Updated Diwali Offer
 *               discountType:
 *                 type: string
 *                 enum: [flat, percent]
 *                 example: flat
 *               value:
 *                 type: number
 *                 example: 200
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: inactive
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-12-01T23:59:59.000Z
 *     responses:
 *       200:
 *         description: Auto discount updated successfully
 *       404:
 *         description: Discount not found
 *       400:
 *         description: Invalid input
 */
router.patch(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    autoDiscountController.updateAutoDiscount
);

/**
 * @swagger
 * /api/promotions/auto-discount/{id}:
 *   delete:
 *     summary: Delete an automatic discount by ID
 *     tags: [AutoDiscount]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the auto discount to delete
 *     responses:
 *       200:
 *         description: Auto discount deleted successfully
 *       404:
 *         description: Discount not found
 */
router.delete(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    autoDiscountController.deleteAutoDiscount
);

module.exports = router;
