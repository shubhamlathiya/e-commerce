/**
 * @swagger
 * tags:
 *   name: Coupons
 *   description: Manage discount coupons for customers
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authenticateJWT, isAdmin } = require('../../middleware/authMiddleware');
const couponController = require('../../controllers/OffersAndDiscounts/couponController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * /api/promotions/coupons:
 *   post:
 *     summary: Create a new coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - type
 *               - value
 *               - startDate
 *               - endDate
 *             properties:
 *               code:
 *                 type: string
 *                 example: FESTIVE2025
 *               type:
 *                 type: string
 *                 enum: [flat, percent]
 *                 example: percent
 *               value:
 *                 type: number
 *                 example: 15
 *               minOrderAmount:
 *                 type: number
 *                 example: 500
 *               maxDiscount:
 *                 type: number
 *                 example: 200
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-11-01T00:00:00.000Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-12-31T23:59:59.000Z
 *               usageLimit:
 *                 type: integer
 *                 example: 1000
 *               usagePerUser:
 *                 type: integer
 *                 example: 2
 *               allowedUsers:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: 671f44e2b12a34567890abcd
 *               allowedCategories:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: 671f44e2b12a34567890abcf
 *               allowedProducts:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: 671f44e2b12a34567890abc1
 *               allowedBrands:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: 671f44e2b12a34567890abc3
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: active
 *     responses:
 *       201:
 *         description: Coupon created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 */
router.post(
    '/',
    authenticateJWT,
    isAdmin,
    [
            body('code').isString().notEmpty(),
            body('type').isIn(['flat', 'percent']),
            body('value').isFloat({ min: 0 }),
            body('minOrderAmount').optional().isFloat({ min: 0 }),
            body('maxDiscount').optional().isFloat({ min: 0 }),
            body('startDate').isISO8601(),
            body('endDate').isISO8601(),
            body('usageLimit').optional().isInt({ min: 0 }),
            body('usagePerUser').optional().isInt({ min: 0 }),
            body('allowedUsers').optional().isArray(),
            body('allowedCategories').optional().isArray(),
            body('allowedProducts').optional().isArray(),
            body('allowedBrands').optional().isArray(),
            body('status').optional().isIn(['active', 'inactive']),
    ],
    validate,
    couponController.createCoupon
);

/**
 * @swagger
 * /api/promotions/coupons:
 *   get:
 *     summary: Get a list of coupons
 *     tags: [Coupons]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter coupons by status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search coupons by code or name
 *     responses:
 *       200:
 *         description: List of coupons retrieved successfully
 *       400:
 *         description: Invalid query parameters
 */
router.get(
    '/',
    [query('status').optional().isString(), query('search').optional().isString()],
    validate,
    couponController.listCoupons
);

/**
 * @swagger
 * /api/promotions/coupons/{id}:
 *   patch:
 *     summary: Update an existing coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: number
 *                 example: 20
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 example: inactive
 *     responses:
 *       200:
 *         description: Coupon updated successfully
 *       404:
 *         description: Coupon not found
 *       400:
 *         description: Invalid input data
 */
router.patch(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    couponController.updateCoupon
);

/**
 * @swagger
 * /api/promotions/coupons/{id}:
 *   delete:
 *     summary: Delete a coupon
 *     tags: [Coupons]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Coupon ID
 *     responses:
 *       200:
 *         description: Coupon deleted successfully
 *       404:
 *         description: Coupon not found
 *       401:
 *         description: Unauthorized access
 */
router.delete(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    couponController.deleteCoupon
);

module.exports = router;
