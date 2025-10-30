// const express = require('express');
// const {body, param, query} = require('express-validator');
// const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
// // const ctrl = require('../../controllers/orders/refundController');
//
// const router = express.Router();
//
// /**
//  * @swagger
//  * tags:
//  *   - name: Refunds
//  *     description: Order refund management operations (Admin only)
//  */
//
// /**
//  * @swagger
//  * components:
//  *   schemas:
//  *     Refund:
//  *       type: object
//  *       properties:
//  *         _id:
//  *           type: string
//  *           description: Unique identifier for the refund
//  *         returnId:
//  *           type: string
//  *           description: Reference to the return request (if applicable)
//  *         userId:
//  *           type: string
//  *           description: ID of the user receiving the refund
//  *         orderId:
//  *           type: string
//  *           description: ID of the original order
//  *         mode:
//  *           type: string
//  *           enum: [wallet, bank]
//  *           description: Refund method
//  *         amount:
//  *           type: number
//  *           format: float
//  *           minimum: 0
//  *           description: Refund amount
//  *         transactionId:
//  *           type: string
//  *           description: External transaction ID from payment gateway
//  *         status:
//  *           type: string
//  *           enum: [initiated, processed, failed]
//  *           description: Current refund status
//  *         reason:
//  *           type: string
//  *           description: Reason for refund
//  *         notes:
//  *           type: string
//  *           description: Admin notes or additional information
//  *         processedBy:
//  *           type: string
//  *           description: Admin user ID who processed the refund
//  *         processedAt:
//  *           type: string
//  *           format: date-time
//  *           description: When the refund was processed
//  *         createdAt:
//  *           type: string
//  *           format: date-time
//  *         updatedAt:
//  *           type: string
//  *           format: date-time
//  *
//  *     RefundCreate:
//  *       type: object
//  *       required:
//  *         - amount
//  *       properties:
//  *         returnId:
//  *           type: string
//  *           description: Reference to the return request
//  *           example: "507f1f77bcf86cd799439011"
//  *         userId:
//  *           type: string
//  *           description: ID of the user receiving the refund
//  *           example: "507f1f77bcf86cd799439012"
//  *         orderId:
//  *           type: string
//  *           description: ID of the original order
//  *           example: "507f1f77bcf86cd799439013"
//  *         mode:
//  *           type: string
//  *           enum: [wallet, bank]
//  *           description: Refund method
//  *           example: "wallet"
//  *         amount:
//  *           type: number
//  *           format: float
//  *           minimum: 0
//  *           description: Refund amount
//  *           example: 99.99
//  *         transactionId:
//  *           type: string
//  *           description: External transaction ID
//  *           example: "txn_1A2b3C4d5E6f7G8h9I0j"
//  *         status:
//  *           type: string
//  *           enum: [initiated, processed, failed]
//  *           description: Initial refund status
//  *           example: "initiated"
//  *         reason:
//  *           type: string
//  *           description: Reason for refund
//  *           example: "Product return"
//  *         notes:
//  *           type: string
//  *           description: Admin notes
//  *           example: "Refund processed for damaged item"
//  *
//  *     RefundUpdate:
//  *       type: object
//  *       properties:
//  *         mode:
//  *           type: string
//  *           enum: [wallet, bank]
//  *           description: Updated refund method
//  *         amount:
//  *           type: number
//  *           format: float
//  *           minimum: 0
//  *           description: Updated refund amount
//  *         transactionId:
//  *           type: string
//  *           description: Updated transaction ID
//  *         status:
//  *           type: string
//  *           enum: [initiated, processed, failed]
//  *           description: Updated refund status
//  *         reason:
//  *           type: string
//  *           description: Updated reason
//  *         notes:
//  *           type: string
//  *           description: Updated admin notes
//  *
//  *     Error:
//  *       type: object
//  *       properties:
//  *         error:
//  *           type: string
//  *           description: Error message
//  *         details:
//  *           type: array
//  *           items:
//  *             type: object
//  *           description: Detailed error information
//  */
//
// /**
//  * @swagger
//  * /api/refunds:
//  *   get:
//  *     summary: List all refunds
//  *     description: Retrieve a paginated list of refunds with filtering options (Admin only)
//  *     tags: [Refunds]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: query
//  *         name: status
//  *         schema:
//  *           type: string
//  *         description: Filter by refund status
//  *         example: "processed"
//  *       - in: query
//  *         name: mode
//  *         schema:
//  *           type: string
//  *           enum: [wallet, bank]
//  *         description: Filter by refund method
//  *         example: "wallet"
//  *       - in: query
//  *         name: userId
//  *         schema:
//  *           type: string
//  *           pattern: '^[0-9a-fA-F]{24}$'
//  *         description: Filter by user ID
//  *         example: "507f1f77bcf86cd799439012"
//  *       - in: query
//  *         name: orderId
//  *         schema:
//  *           type: string
//  *           pattern: '^[0-9a-fA-F]{24}$'
//  *         description: Filter by order ID
//  *         example: "507f1f77bcf86cd799439013"
//  *       - in: query
//  *         name: returnId
//  *         schema:
//  *           type: string
//  *           pattern: '^[0-9a-fA-F]{24}$'
//  *         description: Filter by return request ID
//  *         example: "507f1f77bcf86cd799439011"
//  *       - in: query
//  *         name: page
//  *         schema:
//  *           type: integer
//  *           minimum: 1
//  *           default: 1
//  *         description: Page number for pagination
//  *       - in: query
//  *         name: limit
//  *         schema:
//  *           type: integer
//  *           minimum: 1
//  *           maximum: 200
//  *           default: 20
//  *         description: Number of records per page
//  *     responses:
//  *       200:
//  *         description: List of refunds retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                 data:
//  *                   type: array
//  *                   items:
//  *                     $ref: '#/components/schemas/Refund'
//  *                 pagination:
//  *                   type: object
//  *                   properties:
//  *                     page:
//  *                       type: integer
//  *                     limit:
//  *                       type: integer
//  *                     total:
//  *                       type: integer
//  *                     pages:
//  *                       type: integer
//  *       401:
//  *         description: Unauthorized access
//  *       403:
//  *         description: Admin access required
//  *       500:
//  *         description: Server error
//  */
// router.get('/', authenticateJWT, isAdmin, [
//     query('status').optional().isString(),
//     query('mode').optional().isIn(['wallet', 'bank']),
//     query('userId').optional().isMongoId(),
//     query('orderId').optional().isMongoId(),
//     query('returnId').optional().isMongoId(),
//     query('page').optional().isInt({min: 1}),
//     query('limit').optional().isInt({min: 1, max: 200})
// ], ctrl.listRefunds);
//
// /**
//  * @swagger
//  * /api/refunds/{id}:
//  *   get:
//  *     summary: Get refund by ID
//  *     description: Retrieve detailed information about a specific refund (Admin only)
//  *     tags: [Refunds]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *           pattern: '^[0-9a-fA-F]{24}$'
//  *         description: MongoDB ObjectId of the refund
//  *         example: "507f1f77bcf86cd799439014"
//  *     responses:
//  *       200:
//  *         description: Refund details retrieved successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                 data:
//  *                   $ref: '#/components/schemas/Refund'
//  *       400:
//  *         description: Invalid refund ID format
//  *       401:
//  *         description: Unauthorized access
//  *       403:
//  *         description: Admin access required
//  *       404:
//  *         description: Refund not found
//  *       500:
//  *         description: Server error
//  */
// router.get('/:id', authenticateJWT, isAdmin, [
//     param('id').isMongoId().withMessage('Valid refund ID is required')
// ], ctrl.getRefundById);
//
// /**
//  * @swagger
//  * /api/refunds:
//  *   post:
//  *     summary: Create a new refund
//  *     description: Create a new refund record (Admin only). Requires at least one of returnId, userId, or orderId.
//  *     tags: [Refunds]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/RefundCreate'
//  *     responses:
//  *       201:
//  *         description: Refund created successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                 data:
//  *                   $ref: '#/components/schemas/Refund'
//  *       400:
//  *         description: Invalid input data or missing required references
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/Error'
//  *       401:
//  *         description: Unauthorized access
//  *       403:
//  *         description: Admin access required
//  *       404:
//  *         description: Referenced resource (user, order, or return) not found
//  *       500:
//  *         description: Server error
//  */
// router.post('/', authenticateJWT, isAdmin, [
//     body('returnId').optional().isMongoId().withMessage('Valid return ID is required'),
//     body('userId').optional().isMongoId().withMessage('Valid user ID is required'),
//     body('orderId').optional().isMongoId().withMessage('Valid order ID is required'),
//     body('mode').optional().isIn(['wallet', 'bank']).withMessage('Mode must be wallet or bank'),
//     body('amount').isFloat({min: 0}).withMessage('Valid amount greater than 0 is required'),
//     body('transactionId').optional().isString().withMessage('Transaction ID must be a string'),
//     body('status').optional().isIn(['initiated', 'processed', 'failed']).withMessage('Status must be initiated, processed, or failed'),
//     body('reason').optional().isString(),
//     body('notes').optional().isString()
// ], ctrl.createRefund);
//
// /**
//  * @swagger
//  * /api/refunds/{id}:
//  *   put:
//  *     summary: Update a refund
//  *     description: Update an existing refund record (Admin only)
//  *     tags: [Refunds]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *           pattern: '^[0-9a-fA-F]{24}$'
//  *         description: MongoDB ObjectId of the refund to update
//  *         example: "507f1f77bcf86cd799439014"
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/RefundUpdate'
//  *     responses:
//  *       200:
//  *         description: Refund updated successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                 data:
//  *                   $ref: '#/components/schemas/Refund'
//  *       400:
//  *         description: Invalid input data
//  *       401:
//  *         description: Unauthorized access
//  *       403:
//  *         description: Admin access required
//  *       404:
//  *         description: Refund not found
//  *       409:
//  *         description: Cannot update refund in current status
//  *       500:
//  *         description: Server error
//  */
// router.put('/:id', authenticateJWT, isAdmin, [
//     param('id').isMongoId().withMessage('Valid refund ID is required')
// ], ctrl.updateRefund);
//
// /**
//  * @swagger
//  * /api/refunds/{id}:
//  *   delete:
//  *     summary: Delete a refund
//  *     description: Permanently delete a refund record (Admin only). Note: Only refunds with 'initiated' status can be deleted.
//  *     tags: [Refunds]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: id
//  *         required: true
//  *         schema:
//  *           type: string
//  *           pattern: '^[0-9a-fA-F]{24}$'
//  *         description: MongoDB ObjectId of the refund to delete
//  *         example: "507f1f77bcf86cd799439014"
//  *     responses:
//  *       200:
//  *         description: Refund deleted successfully
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 success:
//  *                   type: boolean
//  *                 message:
//  *                   type: string
//  *       400:
//  *         description: Invalid refund ID
//  *       401:
//  *         description: Unauthorized access
//  *       403:
//  *         description: Admin access required
//  *       404:
//  *         description: Refund not found
//  *       409:
//  *         description: Cannot delete refund in current status
//  *       500:
//  *         description: Server error
//  */
// router.delete('/:id', authenticateJWT, isAdmin, [
//     param('id').isMongoId().withMessage('Valid refund ID is required')
// ], ctrl.deleteRefund);
//
// module.exports = router;