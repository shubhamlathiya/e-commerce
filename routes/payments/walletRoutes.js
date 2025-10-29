const express = require('express');
const router = express.Router();
const {check} = require('express-validator');
const walletController = require('../../controllers//payments/walletController');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Wallet
 *   description: User wallet management and admin wallet operations
 */


/**
 * @swagger
 * /api/wallet:
 *   get:
 *     summary: Get logged-in user's wallet details
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   example: 1250.50
 *                 totalAdded:
 *                   type: number
 *                   example: 3000
 *                 totalSpent:
 *                   type: number
 *                   example: 1750
 *       401:
 *         description: Unauthorized
 */
router.get('/',
    authenticateJWT,
    walletController.getUserWallet
);

/**
 * @swagger
 * /api/wallet/transactions:
 *   get:
 *     summary: Get wallet transaction history for logged-in user
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wallet transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   type:
 *                     type: string
 *                     example: "credit"
 *                   amount:
 *                     type: number
 *                     example: 500
 *                   description:
 *                     type: string
 *                     example: "Refund for Order #1234"
 *                   date:
 *                     type: string
 *                     format: date-time
 */
router.get('/transactions',
    authenticateJWT,
    walletController.getWalletTransactions
);

/**
 * @swagger
 * /api/wallet/payment:
 *   post:
 *     summary: Process wallet payment for an order
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "672f5d3e9a1a56789abc1234"
 *               amount:
 *                 type: number
 *                 example: 299.99
 *     responses:
 *       200:
 *         description: Wallet payment processed successfully
 *       400:
 *         description: Insufficient balance or invalid data
 *       401:
 *         description: Unauthorized
 */
router.post('/payment',
    authenticateJWT,
    [
        check('orderId').isMongoId().withMessage('Valid order ID is required'),
        check('amount').optional().isNumeric()
    ],
    walletController.processWalletPayment
);

/**
 * @swagger
 * /api/wallet/admin/all:
 *   get:
 *     summary: Get all user wallets (Admin only)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all user wallets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                   balance:
 *                     type: number
 *                   totalAdded:
 *                     type: number
 *                   totalSpent:
 *                     type: number
 *       403:
 *         description: Forbidden (admin only)
 */
router.get('/admin/all',
    authenticateJWT,
    isAdmin,
    walletController.getAllWallets
);

/**
 * @swagger
 * /api/wallet/admin/add:
 *   post:
 *     summary: Add funds to a user's wallet (Admin only)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "672f5d3e9a1a56789abc1234"
 *               amount:
 *                 type: number
 *                 example: 1000
 *               reference:
 *                 type: string
 *                 example: "Manual credit by admin"
 *     responses:
 *       200:
 *         description: Funds added successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Forbidden
 */
router.post('/admin/add',
    authenticateJWT,
    isAdmin,
    [
        check('userId').isMongoId().withMessage('Valid user ID is required'),
        check('amount').isNumeric().withMessage('Amount is required'),
        check('reference').optional().isString()
    ],
    walletController.addFunds
);


/**
 * @swagger
 * /api/wallet/admin/deduct:
 *   post:
 *     summary: Deduct funds from a user's wallet (Admin only)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - amount
 *             properties:
 *               userId:
 *                 type: string
 *                 example: "672f5d3e9a1a56789abc1234"
 *               amount:
 *                 type: number
 *                 example: 500
 *               reference:
 *                 type: string
 *                 example: "Adjustment due to refund"
 *     responses:
 *       200:
 *         description: Funds deducted successfully
 *       400:
 *         description: Invalid data or insufficient funds
 *       403:
 *         description: Forbidden
 */
router.post('/admin/deduct',
    authenticateJWT,
    isAdmin,
    [
        check('userId').isMongoId().withMessage('Valid user ID is required'),
        check('amount').isNumeric().withMessage('Amount is required'),
        check('reference').optional().isString()
    ],
    walletController.deductFunds
);

/**
 * @swagger
 * /api/wallet/admin/refund:
 *   post:
 *     summary: Process refund to wallet (Admin only)
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: "672f5d3e9a1a56789abc1234"
 *               amount:
 *                 type: number
 *                 example: 299.99
 *               reason:
 *                 type: string
 *                 example: "Product returned by customer"
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid request
 *       403:
 *         description: Forbidden
 */
router.post('/admin/refund',
    authenticateJWT,
    isAdmin,
    [
        check('orderId').isMongoId().withMessage('Valid order ID is required'),
        check('amount').optional().isNumeric(),
        check('reason').optional().isString()
    ],
    walletController.processRefund
);

module.exports = router;