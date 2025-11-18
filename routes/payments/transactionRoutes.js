const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../../middleware/authMiddleware');
const PaymentTransaction = require('../../models/payments/paymentTransactionModel');
const Order = require('../../models/orders/orderModel');

/**
 * @swagger
 * tags:
 *   name: Payment Transactions
 *   description: User payment transactions and history
 */

/**
 * @swagger
 * /api/transactions:
 *   get:
 *     summary: Get user's payment transaction history
 *     tags: [Payment Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (success, failed, pending, refund)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by transaction type
 *     responses:
 *       200:
 *         description: Payment transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       transactionId:
 *                         type: string
 *                       orderId:
 *                         type: string
 *                       amount:
 *                         type: number
 *                       currency:
 *                         type: string
 *                       status:
 *                         type: string
 *                       paymentMethod:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       orderNumber:
 *                         type: string
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalItems:
 *                       type: integer
 *                     hasNext:
 *                       type: boolean
 *                     hasPrev:
 *                       type: boolean
 */
router.get('/', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const { page = 1, limit = 20, status, type } = req.query;

        const skip = (page - 1) * limit;

        // Build filter query
        let filter = { userId };
        if (status) filter.status = status;
        if (type) filter.transactionType = type;

        const transactions = await PaymentTransaction.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .lean();

        // Get order details for each transaction
        const transactionsWithOrderDetails = await Promise.all(
            transactions.map(async (transaction) => {
                const order = await Order.findById(transaction.orderId)
                    .select('orderNumber totals')
                    .lean();

                return {
                    ...transaction,
                    orderNumber: order?.orderNumber || 'N/A',
                    orderTotal: order?.totals?.grandTotal || transaction.amount
                };
            })
        );

        const total = await PaymentTransaction.countDocuments(filter);

        return res.status(200).json({
            success: true,
            data: transactionsWithOrderDetails,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(total / limit),
                totalItems: total,
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get transactions error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving transactions',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /api/{transactionId}:
 *   get:
 *     summary: Get specific transaction details
 *     tags: [Payment Transactions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction details retrieved successfully
 *       404:
 *         description: Transaction not found
 */
router.get('/:transactionId', authenticateJWT, async (req, res) => {
    try {
        const userId = req.user.id;
        const { transactionId } = req.params;

        const transaction = await PaymentTransaction.findOne({
            _id: transactionId,
            userId
        }).lean();

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: 'Transaction not found'
            });
        }

        // Get order details
        const order = await Order.findById(transaction.orderId)
            .select('orderNumber items totals shippingAddress')
            .lean();

        return res.status(200).json({
            success: true,
            data: {
                ...transaction,
                orderDetails: order
            }
        });

    } catch (error) {
        console.error('Get transaction error:', error);
        return res.status(500).json({
            success: false,
            message: 'Error retrieving transaction',
            error: error.message
        });
    }
});

module.exports = router;