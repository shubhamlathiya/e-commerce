/**
 * @swagger
 * tags:
 *   name: Pricing
 *   description: Manage product pricing, tiers, and special prices
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authenticateJWT, isAdmin } = require('../../middleware/authMiddleware');
const pricingController = require('../../controllers/ProductPricingAndTaxation/pricingController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * /api/pricing/product:
 *   put:
 *     summary: Create or update product pricing
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 671f44e2b12a34567890abcd
 *               variantId:
 *                 type: string
 *                 example: 671f44e2b12a34567890abce
 *               basePrice:
 *                 type: number
 *                 example: 499.99
 *               discountType:
 *                 type: string
 *                 enum: [flat, percent]
 *                 example: percent
 *               discountValue:
 *                 type: number
 *                 example: 10
 *               currency:
 *                 type: string
 *                 example: USD
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Product pricing created or updated
 *       400:
 *         description: Invalid input data
 */
router.put(
    '/product',
    authenticateJWT,
    isAdmin,
    [
            body('productId').isMongoId(),
            body('variantId').optional().isMongoId(),
            body('basePrice').isFloat({ min: 0 }),
            body('discountType').optional().isIn(['flat', 'percent']),
            body('discountValue').optional().isFloat({ min: 0 }),
            body('currency').optional().isString(),
            body('status').optional().isBoolean(),
    ],
    validate,
    pricingController.upsertProductPricing
);

/**
 * @swagger
 * /api/pricing/product:
 *   get:
 *     summary: Get product pricing by product and variant
 *     tags: [Pricing]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         example: 671f44e2b12a34567890abcd
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *           example: 671f44e2b12a34567890abce
 *     responses:
 *       200:
 *         description: Product pricing retrieved
 *       404:
 *         description: Pricing not found
 */
router.get('/product', [query('productId').isMongoId(), query('variantId').optional().isMongoId()], validate, pricingController.getProductPricing);

/**
 * @swagger
 * /api/pricing/product:
 *   delete:
 *     summary: Delete product pricing
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Pricing deleted successfully
 *       404:
 *         description: Pricing not found
 */
router.delete('/product', authenticateJWT, isAdmin, [query('productId').isMongoId(), query('variantId').optional().isMongoId()], validate, pricingController.deleteProductPricing);

/**
 * @swagger
 * /api/pricing/tier:
 *   post:
 *     summary: Create a tier pricing entry
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               minQty:
 *                 type: integer
 *                 example: 5
 *               maxQty:
 *                 type: integer
 *                 example: 10
 *               price:
 *                 type: number
 *                 example: 450
 *     responses:
 *       201:
 *         description: Tier created successfully
 */
router.post(
    '/tier',
    authenticateJWT,
    isAdmin,
    [
            body('productId').isMongoId(),
            body('variantId').optional().isMongoId(),
            body('minQty').isInt({ min: 1 }),
            body('maxQty').isInt({ min: 1 }),
            body('price').isFloat({ min: 0 }),
    ],
    validate,
    pricingController.createTier
);

/**
 * @swagger
 * /api/pricing/tier:
 *   get:
 *     summary: List tier pricing
 *     tags: [Pricing]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tier pricing list retrieved
 */
router.get('/tier', [query('productId').optional().isMongoId(), query('variantId').optional().isMongoId()], validate, pricingController.listTiers);

/**
 * @swagger
 * /api/pricing/tier/{id}:
 *   delete:
 *     summary: Delete a tier pricing entry
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tier deleted successfully
 *       404:
 *         description: Tier not found
 */
router.delete('/tier/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], validate, pricingController.deleteTier);

/**
 * @swagger
 * /api/pricing/special:
 *   post:
 *     summary: Create special pricing
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               specialPrice:
 *                 type: number
 *                 example: 399.99
 *               startDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *               status:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Special pricing created successfully
 */
router.post(
    '/special',
    authenticateJWT,
    isAdmin,
    [
            body('productId').isMongoId(),
            body('variantId').optional().isMongoId(),
            body('specialPrice').isFloat({ min: 0 }),
            body('startDate').isISO8601(),
            body('endDate').isISO8601(),
            body('status').optional().isBoolean(),
    ],
    validate,
    pricingController.createSpecial
);

/**
 * @swagger
 * /api/pricing/special:
 *   get:
 *     summary: List special pricings
 *     tags: [Pricing]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: active
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Special pricing list retrieved
 */
router.get('/special', [query('productId').optional().isMongoId(), query('variantId').optional().isMongoId(), query('active').optional().isBoolean()], validate, pricingController.listSpecials);

/**
 * @swagger
 * /api/pricing/special/{id}:
 *   delete:
 *     summary: Delete special pricing
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Special pricing deleted successfully
 *       404:
 *         description: Special pricing not found
 */
router.delete('/special/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], validate, pricingController.deleteSpecial);

/**
 * @swagger
 * /api/pricing/resolve:
 *   get:
 *     summary: Resolve effective product price with discounts, taxes, and currency conversion
 *     tags: [Pricing]
 *     parameters:
 *       - in: query
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: variantId
 *         schema:
 *           type: string
 *       - in: query
 *         name: qty
 *         schema:
 *           type: integer
 *           example: 2
 *       - in: query
 *         name: currency
 *         schema:
 *           type: string
 *           example: INR
 *       - in: query
 *         name: includeTax
 *         schema:
 *           type: boolean
 *           example: true
 *     responses:
 *       200:
 *         description: Effective price resolved successfully
 */
router.get(
    '/resolve',
    [
            query('productId').isMongoId(),
            query('variantId').optional().isMongoId(),
            query('qty').optional().isInt({ min: 1 }),
            query('currency').optional().isString(),
            query('country').optional().isString(),
            query('state').optional().isString(),
            query('includeTax').optional().isBoolean(),
    ],
    validate,
    pricingController.resolvePrice
);

module.exports = router;
