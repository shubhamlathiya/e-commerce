const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateJWT, isAdmin } = require('../../middleware/authMiddleware');
const analyticsController = require('../../controllers/analytics/analyticsController');




const router = express.Router();

/**
 * @swagger
 * /api/analytics/orders:
 *   get:
 *     summary: Get list of order analytics
 *     tags: [Order Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Successful response
 *       500:
 *         description: Server error
 */
router.get('/orders', authenticateJWT, isAdmin, [query('from').optional().isISO8601(), query('to').optional().isISO8601(), query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 200 })], analyticsController.listOrderAnalytics);

/**
 * @swagger
 * /api/analytics/orders/{id}:
 *   get:
 *     summary: Get order analytics by ID
 *     tags: [Order Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.get('/orders/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], analyticsController.getOrderAnalyticsById);

/**
 * @swagger
 * /api/analytics/orders:
 *   post:
 *     summary: Create a new order analytics record
 *     tags: [Order Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.post('/orders', authenticateJWT, isAdmin, [body('date').isISO8601(), body('totalOrders').isInt({ min: 0 }), body('totalSales').isFloat({ min: 0 }), body('avgOrderValue').isFloat({ min: 0 })], analyticsController.createOrderAnalytics);

/**
 * @swagger
 * /api/analytics/orders/{id}:
 *   put:
 *     summary: Update order analytics by ID
 *     tags: [Order Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.put('/orders/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], analyticsController.updateOrderAnalytics);

/**
 * @swagger
 * /api/analytics/orders/{id}:
 *   delete:
 *     summary: Delete order analytics by ID
 *     tags: [Order Analytics]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/orders/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], analyticsController.deleteOrderAnalytics);

/**
 * @swagger
 * tags:
 *   name: User Analytics
 *   description: Manage user analytics data
 */


/**
 * @swagger
 * /api/analytics/users:
 *   get:
 *     summary: Get list of user analytics
 *     description: Fetch paginated analytics data for users with optional date filters.
 *     tags:
 *       - User Analytics
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Successfully fetched user analytics
 *       401:
 *         description: Unauthorized
 */
router.get('/users', authenticateJWT, isAdmin, [query('from').optional().isISO8601(), query('to').optional().isISO8601(), query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 200 })], analyticsController.listUserAnalytics);

/**
 * @swagger
 * /api/analytics/users/{id}:
 *   get:
 *     summary: Get user analytics by ID
 *     description: Retrieve detailed analytics for a specific record.
 *     tags:
 *       - User Analytics
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 652cb1a3c3b0a2e5d76d1a90
 *     responses:
 *       200:
 *         description: Successfully fetched analytics record
 *       404:
 *         description: Record not found
 */
router.get('/users/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], analyticsController.getUserAnalyticsById);

/**
 * @swagger
 * /api/analytics/users:
 *   post:
 *     summary: Create a new user analytics record
 *     description: Add a new analytics entry for tracking user data.
 *     tags:
 *       - User Analytics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               newUsers:
 *                 type: number
 *               totalUsers:
 *                 type: number
 *               repeatCustomers:
 *                 type: number
 *     responses:
 *       201:
 *         description: Analytics record created successfully
 *       400:
 *         description: Validation error
 */
router.post('/users', authenticateJWT, isAdmin, [body('date').isISO8601(), body('newUsers').isInt({ min: 0 }), body('totalUsers').isInt({ min: 0 }), body('repeatCustomers').isInt({ min: 0 })], analyticsController.createUserAnalytics);

/**
 * @swagger
 * /api/analytics/users/{id}:
 *   put:
 *     summary: Update user analytics record
 *     description: Modify analytics data for a given ID.
 *     tags:
 *       - User Analytics
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 652cb1a3c3b0a2e5d76d1a90
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newUsers:
 *                 type: number
 *               totalUsers:
 *                 type: number
 *               repeatCustomers:
 *                 type: number
 *     responses:
 *       200:
 *         description: Record updated successfully
 *       404:
 *         description: Record not found
 */
router.put('/users/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], analyticsController.updateUserAnalytics);

/**
 * @swagger
 * /api/analytics/users/{id}:
 *   delete:
 *     summary: Delete user analytics record
 *     description: Remove a specific analytics record from the system.
 *     tags:
 *       - User Analytics
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 652cb1a3c3b0a2e5d76d1a90
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 */
router.delete('/users/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], analyticsController.deleteUserAnalytics);

/**
 * @swagger
 * /api/analytics/products:
 *   get:
 *     summary: Get product analytics list
 *     description: Fetch paginated analytics data for all products. Can be filtered by product ID.
 *     tags:
 *       - Product Analytics
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema:
 *           type: string
 *           example: 652cb1a3c3b0a2e5d76d1a90
 *         description: Filter analytics by specific product ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 20
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: Successfully fetched product analytics
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/products', authenticateJWT, isAdmin, [query('productId').optional().isMongoId(), query('page').optional().isInt({ min: 1 }), query('limit').optional().isInt({ min: 1, max: 200 })], analyticsController.listProductAnalytics);

/**
 * @swagger
 * /api/analytics/products/{id}:
 *   get:
 *     summary: Get product analytics by ID
 *     description: Retrieve detailed analytics for a single product by its ID.
 *     tags:
 *       - Product Analytics
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Analytics record ID
 *         schema:
 *           type: string
 *           example: 652cb1a3c3b0a2e5d76d1a90
 *     responses:
 *       200:
 *         description: Successfully fetched analytics record
 *       404:
 *         description: Record not found
 *       401:
 *         description: Unauthorized
 */
router.get('/products/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], analyticsController.getProductAnalyticsById);

/**
 * @swagger
 * /api/analytics/products:
 *   post:
 *     summary: Create a new product analytics record
 *     description: Add a new analytics record for a specific product.
 *     tags:
 *       - Product Analytics
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 example: 652cb1a3c3b0a2e5d76d1a90
 *               totalSales:
 *                 type: integer
 *                 example: 120
 *               totalRevenue:
 *                 type: number
 *                 format: float
 *                 example: 54000.50
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 4.6
 *     responses:
 *       201:
 *         description: Product analytics created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/products', authenticateJWT, isAdmin, [body('productId').isMongoId(), body('totalSales').isInt({ min: 0 }), body('totalRevenue').isFloat({ min: 0 }), body('rating').optional().isFloat({ min: 0, max: 5 })], analyticsController.createProductAnalytics);

/**
 * @swagger
 * /api/analytics/products/{id}:
 *   put:
 *     summary: Update product analytics record
 *     description: Modify an existing product analytics record.
 *     tags:
 *       - Product Analytics
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Analytics record ID
 *         schema:
 *           type: string
 *           example: 652cb1a3c3b0a2e5d76d1a90
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totalSales:
 *                 type: integer
 *                 example: 180
 *               totalRevenue:
 *                 type: number
 *                 format: float
 *                 example: 75000.00
 *               rating:
 *                 type: number
 *                 format: float
 *                 example: 4.8
 *     responses:
 *       200:
 *         description: Product analytics updated successfully
 *       404:
 *         description: Record not found
 *       401:
 *         description: Unauthorized
 */
router.put('/products/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], analyticsController.updateProductAnalytics);


/**
 * @swagger
 * /api/analytics/products/{id}:
 *   delete:
 *     summary: Delete product analytics record
 *     description: Remove a product analytics record by its ID.
 *     tags:
 *       - Product Analytics
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Analytics record ID
 *         schema:
 *           type: string
 *           example: 652cb1a3c3b0a2e5d76d1a90
 *     responses:
 *       200:
 *         description: Record deleted successfully
 *       404:
 *         description: Record not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/products/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], analyticsController.deleteProductAnalytics);

module.exports = router;

