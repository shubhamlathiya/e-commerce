const express = require('express');
const router = express.Router();
const {body, query, param} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const currencyController = require('../../controllers/ProductPricingAndTaxation/currencyController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * tags:
 *   - name: Pricing & Taxation - Currency
 *     description: Manage currency conversion rates used across the platform
 */

/**
 * @swagger
 * /api/pricing/currency:
 *   put:
 *     summary: Create or update a currency conversion rate (Admin only)
 *     tags: [Pricing & Taxation - Currency]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - from
 *               - to
 *               - rate
 *             properties:
 *               from:
 *                 type: string
 *                 example: "USD"
 *                 description: Source currency code
 *               to:
 *                 type: string
 *                 example: "INR"
 *                 description: Target currency code
 *               rate:
 *                 type: number
 *                 example: 83.25
 *                 description: Conversion rate from source to target currency
 *     responses:
 *       200:
 *         description: Currency rate upserted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put('/', authenticateJWT, isAdmin, [body('from').isString().notEmpty(), body('to').isString().notEmpty(), body('rate').isFloat({min: 0}),], validate, currencyController.upsertRate);

/**
 * @swagger
 * /api/pricing/currency:
 *   get:
 *     summary: Get all available currency conversion rates
 *     tags: [Pricing & Taxation - Currency]
 *     responses:
 *       200:
 *         description: List of all currency rates
 *       500:
 *         description: Server error
 */
router.get('/', currencyController.listRates);

/**
 * @swagger
 * /api/pricing/currency/one:
 *   get:
 *     summary: Get conversion rate between two specific currencies
 *     tags: [Pricing & Taxation - Currency]
 *     parameters:
 *       - in: query
 *         name: from
 *         required: true
 *         schema:
 *           type: string
 *         description: Source currency code (e.g., USD)
 *       - in: query
 *         name: to
 *         required: true
 *         schema:
 *           type: string
 *         description: Target currency code (e.g., INR)
 *     responses:
 *       200:
 *         description: Currency conversion rate retrieved successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Rate not found
 *       500:
 *         description: Server error
 */
router.get('/one', [query('from').isString().notEmpty(), query('to').isString().notEmpty()], validate, currencyController.getRate);

/**
 * @swagger
 * /api/pricing/currency/{id}:
 *   delete:
 *     summary: Delete a currency conversion rate (Admin only)
 *     tags: [Pricing & Taxation - Currency]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Currency rate record ID
 *     responses:
 *       200:
 *         description: Currency rate deleted successfully
 *       400:
 *         description: Invalid ID format
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Currency rate not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], validate, currencyController.deleteRate);

module.exports = router;
