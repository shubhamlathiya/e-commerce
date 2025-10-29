/**
 * @swagger
 * tags:
 *   name: Loyalty Program
 *   description: Manage user loyalty points, reward balances, and transaction history
 */

const express = require('express');
const router = express.Router();
const {body, query, param} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const loyaltyController = require('../../controllers/OffersAndDiscounts/loyaltyController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * /api/loyalty/account/{userId}:
 *   get:
 *     summary: Get loyalty account details for a specific user
 *     tags: [Loyalty Program]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *     responses:
 *       200:
 *         description: Loyalty account details retrieved successfully
 *         content:
 *           application/json:
 *             example:
 *               userId: 671f44e2b12a34567890abcd
 *               points: 1200
 *               tier: Gold
 *               lastUpdated: 2025-10-20T12:30:00.000Z
 *       404:
 *         description: User loyalty account not found
 *       400:
 *         description: Invalid user ID
 */
router.get(
    '/account/:userId',
    [param('userId').isMongoId()],
    validate,
    loyaltyController.getReward
);

/**
 * @swagger
 * /api/loyalty/account/{userId}:
 *   put:
 *     summary: Upsert loyalty points for a specific user (Admin only)
 *     tags: [Loyalty Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - points
 *             properties:
 *               points:
 *                 type: integer
 *                 example: 1500
 *     responses:
 *       200:
 *         description: Loyalty points updated successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Loyalty points updated
 *               userId: 671f44e2b12a34567890abcd
 *               points: 1500
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put(
    '/account/:userId',
    authenticateJWT,
    isAdmin,
    [param('userId').isMongoId(), body('points').isInt({min: 0})],
    validate,
    loyaltyController.upsertReward
);

/**
 * @swagger
 * /api/loyalty/history/{userId}:
 *   post:
 *     summary: Add a loyalty transaction (earn or redeem points)
 *     tags: [Loyalty Program]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID (MongoDB ObjectId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - points
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [earn, redeem]
 *                 example: earn
 *               points:
 *                 type: integer
 *                 example: 100
 *               orderId:
 *                 type: string
 *                 example: 671f44e2b12a34567890abcf
 *               date:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-10-28T12:00:00.000Z
 *     responses:
 *       201:
 *         description: Loyalty transaction recorded successfully
 *         content:
 *           application/json:
 *             example:
 *               message: Points added to loyalty history
 *               userId: 671f44e2b12a34567890abcd
 *               type: earn
 *               points: 100
 *               date: 2025-10-28T12:00:00.000Z
 *       400:
 *         description: Invalid data or missing fields
 *       401:
 *         description: Unauthorized
 */
router.post(
    '/history/:userId',
    authenticateJWT,
    isAdmin,
    [
        param('userId').isMongoId(),
        body('type').isIn(['earn', 'redeem']),
        body('points').isInt({min: 1}),
        body('orderId').optional().isMongoId(),
        body('date').optional().isISO8601(),
    ],
    validate,
    loyaltyController.addHistory
);

module.exports = router;
