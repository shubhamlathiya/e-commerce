/**
 * @swagger
 * tags:
 *   name: Tax
 *   description: Manage tax rules for pricing and regions
 */

const express = require('express');
const router = express.Router();
const { body, query, param } = require('express-validator');
const { authenticateJWT, isAdmin } = require('../../middleware/authMiddleware');
const taxController = require('../../controllers/ProductPricingAndTaxation/taxController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * /api/tax:
 *   post:
 *     summary: Create a new tax rule
 *     tags: [Tax]
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
 *               - type
 *               - value
 *             properties:
 *               name:
 *                 type: string
 *                 example: GST
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: percentage
 *               value:
 *                 type: number
 *                 example: 18
 *               status:
 *                 type: boolean
 *                 example: true
 *               country:
 *                 type: string
 *                 example: India
 *               state:
 *                 type: string
 *                 example: Maharashtra
 *     responses:
 *       201:
 *         description: Tax rule created successfully
 *       400:
 *         description: Invalid input data
 */
router.post(
    '/',
    authenticateJWT,
    isAdmin,
    [
        body('name').isString().notEmpty(),
        body('type').isIn(['percentage', 'fixed']),
        body('value').isFloat({ min: 0 }),
        body('status').optional().isBoolean(),
        body('country').optional().isString(),
        body('state').optional().isString(),
    ],
    validate,
    taxController.createTaxRule
);

/**
 * @swagger
 * /api/tax:
 *   get:
 *     summary: Get list of tax rules
 *     tags: [Tax]
 *     parameters:
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         example: India
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         example: Maharashtra
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         example: true
 *     responses:
 *       200:
 *         description: List of tax rules retrieved successfully
 *       400:
 *         description: Invalid request parameters
 */
router.get(
    '/',
    [
        query('country').optional().isString(),
        query('state').optional().isString(),
        query('status').optional().isBoolean(),
    ],
    validate,
    taxController.listTaxRules
);

/**
 * @swagger
 * /api/tax/{id}:
 *   patch:
 *     summary: Update an existing tax rule
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the tax rule
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated GST
 *               type:
 *                 type: string
 *                 enum: [percentage, fixed]
 *                 example: fixed
 *               value:
 *                 type: number
 *                 example: 100
 *               status:
 *                 type: boolean
 *                 example: false
 *               country:
 *                 type: string
 *                 example: India
 *               state:
 *                 type: string
 *                 example: Gujarat
 *     responses:
 *       200:
 *         description: Tax rule updated successfully
 *       404:
 *         description: Tax rule not found
 *       400:
 *         description: Invalid input
 */
router.patch(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    taxController.updateTaxRule
);

/**
 * @swagger
 * /api/tax/{id}:
 *   delete:
 *     summary: Delete a tax rule by ID
 *     tags: [Tax]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ID of the tax rule
 *     responses:
 *       200:
 *         description: Tax rule deleted successfully
 *       404:
 *         description: Tax rule not found
 */
router.delete(
    '/:id',
    authenticateJWT,
    isAdmin,
    [param('id').isMongoId()],
    validate,
    taxController.deleteTaxRule
);

module.exports = router;
