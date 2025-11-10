const express = require('express');
const router = express.Router();
const {check} = require('express-validator');
const validate = require('../../utils/productCatalog/validate');
const orderController = require('../../controllers/orders/orderController');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Manage user and admin orders
 */


/**
 * @swagger
 * /api/orders/summary:
 *   post:
 *     summary: Generate an order summary from a cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartId
 *             properties:
 *               cartId:
 *                 type: string
 *                 description: ID of the cart
 *                 example: 671f44e2b12a34567890abcd
 *               shippingAddress:
 *                 type: object
 *                 description: Optional shipping address
 *     responses:
 *       200:
 *         description: Order summary generated successfully
 *       400:
 *         description: Invalid cart ID
 */
router.post('/summary',
    authenticateJWT,
    [
        check('cartId').isMongoId().withMessage('Valid cart ID is required'),
        check('shippingAddress').optional().isObject(),
        check('addressId').optional().isMongoId()
    ],
    orderController.generateOrderSummary
);

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order from a cart
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartId
 *               - paymentMethod
 *               - shippingAddress
 *             properties:
 *               cartId:
 *                 type: string
 *                 example: 671f44e2b12a34567890abcd
 *               paymentMethod:
 *                 type: string
 *                 example: "razorpay"
 *               shippingAddress:
 *                 type: object
 *                 example:
 *                   name: John Doe
 *                   street: 123 Main St
 *                   city: Mumbai
 *                   state: MH
 *                   zip: 400001
 *               billingAddress:
 *                 type: object
 *                 example:
 *                   name: John Doe
 *                   street: 123 Main St
 *                   city: Mumbai
 *                   state: MH
 *                   zip: 400001
 *               notes:
 *                 type: string
 *                 example: "Please deliver between 10 AM - 5 PM"
 *     responses:
 *       201:
 *         description: Order created successfully
 *       400:
 *         description: Validation error
 */
router.post('/',
    authenticateJWT,
    [
        check('cartId').isMongoId().withMessage('Valid cart ID is required'),
        check('paymentMethod').isString().withMessage('Payment method is required'),
        check('shippingAddress').optional().isObject(),
        check('addressId').optional().isMongoId(),
        check('billingAddress').optional().isObject(),
        check('notes').optional().isString()
    ],
    orderController.createOrder
);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order details by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details retrieved successfully
 *       404:
 *         description: Order not found
 */
router.get('/:id',
    authenticateJWT,
    orderController.getOrderById
);

/**
 * @swagger
 * /api/orders:
 *   get:
 *     summary: Get all orders for the logged-in user
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
 */
router.get('/',
    authenticateJWT,
    orderController.getUserOrders
);

/**
 * @swagger
 * /api/orders/return:
 *   post:
 *     summary: Request an order return
 *     tags: [Orders]
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
 *               - items
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 672f44e2b12a34567890abcd
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: 671f44e2b12a34567890abcd
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *               reason:
 *                 type: string
 *                 example: "Product damaged on delivery"
 *     responses:
 *       200:
 *         description: Return request submitted successfully
 *       400:
 *         description: Validation error
 */
router.post('/return',
    authenticateJWT,
    [
        check('orderId').isMongoId().withMessage('Valid order ID is required'),
        check('items').isArray().withMessage('Items array is required'),
        check('reason').optional().isString(),
        check('resolution').optional().isIn(['refund', 'replacement']).withMessage('Resolution must be refund or replacement')
    ],
    orderController.requestReturn
);

/**
 * @swagger
 * /api/orders/replacement:
 *   post:
 *     summary: Request an order replacement
 *     tags: [Orders]
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
 *               - items
 *               - reason
 *             properties:
 *               orderId:
 *                 type: string
 *                 example: 672f44e2b12a34567890abcd
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                       example: 671f44e2b12a34567890abcd
 *                     quantity:
 *                       type: integer
 *                       example: 1
 *               reason:
 *                 type: string
 *                 example: "Wrong size delivered"
 *     responses:
 *       200:
 *         description: Replacement request submitted successfully
 */
router.post('/replacement',
    authenticateJWT,
    [
        check('orderId').isMongoId().withMessage('Valid order ID is required'),
        check('items').isArray().withMessage('Items array is required'),
        check('reason').isString().withMessage('Reason is required')
    ],
    orderController.requestReplacement
);

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Get all orders (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All orders retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get('/admin/all',
    authenticateJWT,
    isAdmin,
    orderController.getAllOrders
);

// Admin: create order directly
router.post('/admin',
    authenticateJWT,
    isAdmin,
    [
        check('items').isArray().withMessage('Items array is required'),
        check('paymentMethod').isString().withMessage('Payment method is required'),
        check('shippingAddress').isObject().withMessage('Shipping address is required'),
        check('billingAddress').optional().isObject(),
        check('totals').optional().isObject(),
        check('couponCode').optional().isString(),
        check('userId').optional().isMongoId(),
        check('status').optional().isString()
    ],
    validate,
    orderController.createAdminOrder
);

/**
 * @swagger
 * /api/orders/admin/{id}/status:
 *   put:
 *     summary: Update order status (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: "Shipped"
 *               comment:
 *                 type: string
 *                 example: "Order dispatched via Bluedart"
 *     responses:
 *       200:
 *         description: Order status updated successfully
 *       404:
 *         description: Order not found
 */
router.put('/admin/:id/status',
    authenticateJWT,
    isAdmin,
    [
        check('status').isString().withMessage('Status is required'),
        check('comment').optional().isString()
    ],
    orderController.updateOrderStatus
);

// Admin: send invoice
router.post('/admin/:id/invoice/send',
    authenticateJWT,
    isAdmin,
    orderController.sendInvoice
);

/**
 * @swagger
 * /api/orders/admin/{type}/{id}:
 *   put:
 *     summary: Process return or replacement request (Admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [return, replacement]
 *         description: Type of request to process
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 example: "Approved"
 *               comment:
 *                 type: string
 *                 example: "Return processed and refund initiated"
 *     responses:
 *       200:
 *         description: Request processed successfully
 *       404:
 *         description: Request not found
 */
router.put('/admin/:type/:id',
    authenticateJWT,
    isAdmin,
    [
        check('status').isString().withMessage('Status is required'),
        check('comment').optional().isString(),
        check('mode').optional().isIn(['wallet', 'bank']),
        check('amount').optional().isNumeric()
    ],
    orderController.processReturnReplacement
);

module.exports = router;
