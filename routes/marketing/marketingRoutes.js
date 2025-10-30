const express = require('express');
const {body, param, query} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const ctrl = require('../../controllers/marketing/marketingController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Marketing - Notifications
 *     description: Manage push, email, and SMS notifications.
 *   - name: Marketing - Campaigns
 *     description: Manage email marketing campaigns.
 *   - name: Marketing - Abandoned Carts
 *     description: Manage and track abandoned carts.
 */

/**
 * @swagger
 * /marketing/notifications:
 *   get:
 *     summary: Get all notifications
 *     tags: [Marketing - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [sent, pending, failed]
 *         description: Filter by notification status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [push, email, sms]
 *         description: Filter by notification type
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: List of notifications
 *       401:
 *         description: Unauthorized
 */
router.get(
    '/notifications',
    authenticateJWT,
    isAdmin,
    [query('status').optional().isIn(['sent', 'pending', 'failed']), query('type').optional().isIn(['push', 'email', 'sms']), query('userId').optional().isMongoId()],
    ctrl.listNotifications
);

/**
 * @swagger
 * /marketing/notifications/{id}:
 *   get:
 *     summary: Get a notification by ID
 *     tags: [Marketing - Notifications]
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
 *         description: Notification details
 *       404:
 *         description: Notification not found
 */
router.get('/notifications/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], ctrl.getNotificationById);

/**
 * @swagger
 * /marketing/notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Marketing - Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, title, message]
 *             properties:
 *               userId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [push, email, sms]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               targetUrl:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [sent, pending, failed]
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
    '/notifications',
    authenticateJWT,
    isAdmin,
    [
        body('userId').optional().isMongoId(),
        body('type').isIn(['push', 'email', 'sms']),
        body('title').isString().notEmpty(),
        body('message').isString().notEmpty(),
        body('targetUrl').optional().isString(),
        body('status').optional().isIn(['sent', 'pending', 'failed'])
    ],
    ctrl.createNotification
);

/**
 * @swagger
 * /marketing/notifications/{id}:
 *   put:
 *     summary: Update a notification
 *     tags: [Marketing - Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [sent, pending, failed]
 *     responses:
 *       200:
 *         description: Notification updated successfully
 *       404:
 *         description: Notification not found
 */
router.put('/notifications/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], ctrl.updateNotification);

/**
 * @swagger
 * /marketing/notifications/{id}:
 *   delete:
 *     summary: Delete a notification
 *     tags: [Marketing - Notifications]
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
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 */
router.delete('/notifications/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], ctrl.deleteNotification);

/**
 * @swagger
 * /marketing/campaigns:
 *   get:
 *     summary: Get all campaigns
 *     tags: [Marketing - Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, scheduled, sent]
 *         description: Filter by campaign status
 *     responses:
 *       200:
 *         description: List of campaigns
 */
router.get('/campaigns', authenticateJWT, isAdmin, [query('status').optional().isIn(['draft', 'scheduled', 'sent'])], ctrl.listCampaigns);

/**
 * @swagger
 * /marketing/campaigns/{id}:
 *   get:
 *     summary: Get a campaign by ID
 *     tags: [Marketing - Campaigns]
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
 *         description: Campaign details
 *       404:
 *         description: Campaign not found
 */
router.get('/campaigns/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], ctrl.getCampaignById);

/**
 * @swagger
 * /marketing/campaigns:
 *   post:
 *     summary: Create a new email campaign
 *     tags: [Marketing - Campaigns]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, subject, body]
 *             properties:
 *               name: { type: string }
 *               subject: { type: string }
 *               body: { type: string }
 *               recipients: { type: array, items: { type: string } }
 *               filters: { type: object }
 *               status: { type: string, enum: [draft, scheduled, sent] }
 *               scheduledAt: { type: string, format: date-time }
 *     responses:
 *       201:
 *         description: Campaign created successfully
 */
router.post(
    '/campaigns',
    authenticateJWT,
    isAdmin,
    [
        body('name').isString().notEmpty(),
        body('subject').isString().notEmpty(),
        body('body').isString().notEmpty(),
        body('recipients').optional().isArray(),
        body('filters').optional().isObject(),
        body('status').optional().isIn(['draft', 'scheduled', 'sent']),
        body('scheduledAt').optional().isISO8601()
    ],
    ctrl.createCampaign
);

/**
 * @swagger
 * /marketing/campaigns/{id}:
 *   put:
 *     summary: Update a campaign
 *     tags: [Marketing - Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Campaign updated successfully
 */
router.put('/campaigns/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], ctrl.updateCampaign);

/**
 * @swagger
 * /marketing/campaigns/{id}:
 *   delete:
 *     summary: Delete a campaign
 *     tags: [Marketing - Campaigns]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Campaign deleted successfully
 */
router.delete('/campaigns/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], ctrl.deleteCampaign);

/**
 * @swagger
 * /marketing/abandoned-carts:
 *   get:
 *     summary: Get all abandoned carts
 *     tags: [Marketing - Abandoned Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: notified
 *         schema: { type: boolean }
 *         description: Filter by notified status
 *     responses:
 *       200:
 *         description: List of abandoned carts
 */
router.get('/abandoned-carts', authenticateJWT, isAdmin, [query('notified').optional().isBoolean()], ctrl.listAbandonedCarts);

/**
 * @swagger
 * /marketing/abandoned-carts/{id}:
 *   get:
 *     summary: Get abandoned cart by ID
 *     tags: [Marketing - Abandoned Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Abandoned cart details
 *       404:
 *         description: Abandoned cart not found
 */
router.get('/abandoned-carts/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], ctrl.getAbandonedCartById);

/**
 * @swagger
 * /marketing/abandoned-carts:
 *   post:
 *     summary: Create a new abandoned cart record
 *     tags: [Marketing - Abandoned Carts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *               sessionId: { type: string }
 *               lastUpdated: { type: string, format: date-time }
 *               notified: { type: boolean }
 *     responses:
 *       201:
 *         description: Abandoned cart created successfully
 */
router.get('/abandoned-carts/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], ctrl.getAbandonedCartById);

/**
 * @swagger
 * /marketing/abandoned-carts:
 *   post:
 *     summary: Create a new abandoned cart record
 *     tags: [Marketing - Abandoned Carts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId: { type: string }
 *               sessionId: { type: string }
 *               lastUpdated: { type: string, format: date-time }
 *               notified: { type: boolean }
 *     responses:
 *       201:
 *         description: Abandoned cart created successfully
 */
router.post(
    '/abandoned-carts',
    authenticateJWT,
    isAdmin,
    [body('userId').optional().isMongoId(), body('sessionId').optional().isString(), body('lastUpdated').optional().isISO8601(), body('notified').optional().isBoolean()],
    ctrl.createAbandonedCart
);

/**
 * @swagger
 * /marketing/abandoned-carts/{id}:
 *   put:
 *     summary: Update an abandoned cart record
 *     tags: [Marketing - Abandoned Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Abandoned cart updated successfully
 */
router.put('/abandoned-carts/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], ctrl.updateAbandonedCart);

/**
 * @swagger
 * /marketing/abandoned-carts/{id}:
 *   delete:
 *     summary: Delete an abandoned cart record
 *     tags: [Marketing - Abandoned Carts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Abandoned cart deleted successfully
 */
router.delete('/abandoned-carts/:id', authenticateJWT, isAdmin, [param('id').isMongoId()], ctrl.deleteAbandonedCart);

module.exports = router;
