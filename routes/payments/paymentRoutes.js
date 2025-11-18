const express = require('express');
const {check} = require('express-validator');
const paymentController = require('../../controllers/payments/paymentController');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Payment processing, methods, and transactions
 */

/**
 * @swagger
 * /api/payments/callback/{gateway}:
 *   post:
 *     summary: Handle payment callback from gateway
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: gateway
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment gateway identifier (e.g., razorpay, stripe)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             example:
 *               orderId: "672f44e2b12a34567890abcd"
 *               paymentId: "pay_Jh7Uy4x..."
 *               status: "success"
 *     responses:
 *       200:
 *         description: Callback processed successfully
 *       400:
 *         description: Invalid callback payload
 */
// router.post('/callback/:gateway',
//     paymentController.processCallback
// );

/**
 * @swagger
 * /api/payments/methods:
 *   get:
 *     summary: Get all available payment methods
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter methods by active status
 *     responses:
 *       200:
 *         description: List of payment methods
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   type:
 *                     type: string
 *                   status:
 *                     type: boolean
 *                   config:
 *                     type: object
 *       500:
 *         description: Server error
 */
// router.get('/methods',
//     [
//         check('status').optional().isBoolean()
//     ],
//     paymentController.getAllMethods
// );

/**
 * @swagger
 * /api/payments/initiate:
 *   post:
 *     summary: Initiate payment for an order
 *     tags: [Payments]
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
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 671f44e2b12a34567890abcd
 *               paymentMethod:
 *                 type: string
 *                 example: "razorpay"
 *     responses:
 *       200:
 *         description: Payment initiated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/initiate',
    authenticateJWT,
    [
        check('orderId').isMongoId().withMessage('Valid order ID is required'),
        check('paymentMethod').isString().withMessage('Payment method is required')
    ],
    paymentController.initiatePayment
);

// router.post('/razorpay/order',
//     [
//         check('amount').optional().isNumeric(),
//         check('currency').optional().isString(),
//         check('orderId').optional().isMongoId(),
//         check('userId').optional().isMongoId()
//     ],
//     paymentController.createRazorpayOrder
// );

router.post('/razorpay/verify',
    [
        check('razorpay_order_id').isString(),
        check('razorpay_payment_id').isString(),
        check('razorpay_signature').isString()
    ],
    paymentController.verifyRazorpayPayment
);

router.post('/razorpay/webhook',
    express.raw({ type: 'application/json' }),
    paymentController.razorpayWebhook
);

/**
 * @swagger
 * /api/payments/transactions/{orderId}:
 *   get:
 *     summary: Get payment transactions for a specific order
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to fetch transactions for
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       404:
 *         description: No transactions found
 */
// router.get('/transactions/:orderId',
//     authenticateJWT,
//     paymentController.getTransactionsByOrder
// );

/**
 * @swagger
 * /api/payments/methods/{id}:
 *   get:
 *     summary: Get a specific payment method by ID (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *     responses:
 *       200:
 *         description: Payment method details retrieved successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Method not found
 */
// router.get('/methods/:id',
//     authenticateJWT,
//     isAdmin,
//     paymentController.getMethodById
// );

/**
 * @swagger
 * /api/payments/methods:
 *   post:
 *     summary: Create a new payment method (Admin only)
 *     tags: [Payments]
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
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Razorpay"
 *               type:
 *                 type: string
 *                 example: "gateway"
 *               status:
 *                 type: boolean
 *                 example: true
 *               config:
 *                 type: object
 *                 example:
 *                   apiKey: "rzp_test_12345"
 *                   secret: "secretKey"
 *     responses:
 *       201:
 *         description: Payment method created successfully
 *       400:
 *         description: Validation error
 */
// router.post('/methods',
//     authenticateJWT,
//     isAdmin,
//     [
//         check('name').isString().withMessage('Name is required'),
//         check('type').isString().withMessage('Type is required'),
//         check('status').optional().isBoolean(),
//         check('config').optional().isObject()
//     ],
//     paymentController.createMethod
// );

/**
 * @swagger
 * /api/payments/methods/{id}:
 *   put:
 *     summary: Update a payment method (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment method ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               status:
 *                 type: boolean
 *               config:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment method updated successfully
 *       404:
 *         description: Payment method not found
 */
// router.put('/methods/:id',
//     authenticateJWT,
//     isAdmin,
//     [
//         check('name').optional().isString(),
//         check('type').optional().isString(),
//         check('status').optional().isBoolean(),
//         check('config').optional().isObject()
//     ],
//     paymentController.updateMethod
// );

/**
 * @swagger
 * /api/payments/methods/{id}:
 *   delete:
 *     summary: Delete a payment method (Admin only)
 *     tags: [Payments]
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
 *         description: Payment method deleted successfully
 *       404:
 *         description: Method not found
 */
// router.delete('/methods/:id',
//     authenticateJWT,
//     isAdmin,
//     paymentController.deleteMethod
// );

/**
 * @swagger
 * /api/payments/refund:
 *   post:
 *     summary: Process a refund for a transaction (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *             properties:
 *               transactionId:
 *                 type: string
 *                 example: "txn_98765abcd"
 *               amount:
 *                 type: number
 *                 example: 499.99
 *               reason:
 *                 type: string
 *                 example: "Product returned by customer"
 *     responses:
 *       200:
 *         description: Refund processed successfully
 *       400:
 *         description: Invalid refund request
 */
// router.post('/refund',
//     authenticateJWT,
//     isAdmin,
//     [
//         check('transactionId').isString().withMessage('Transaction ID is required'),
//         check('amount').optional().isNumeric(),
//         check('reason').optional().isString()
//     ],
//     paymentController.processRefund
// );

module.exports = router;