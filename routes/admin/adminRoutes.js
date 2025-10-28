const express = require('express');
const {body} = require('express-validator');
const adminController = require('../../controllers/adminController');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');

const router = express.Router();


// Apply authentication middleware to all admin routes
router.use(authenticateJWT);
router.use(isAdmin);


/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Retrieve all users (Admin only)
 *     description: Returns a paginated list of users. Requires admin privileges.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number (for pagination)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users per page
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 total:
 *                   type: integer
 *                   example: 42
 *       401:
 *         description: Unauthorized — missing or invalid token
 *       403:
 *         description: Forbidden — admin access required
 */
router.get('/users', adminController.getAllUsers);

/**
 * @swagger
 * /api/admin/users/{userId}:
 *   get:
 *     summary: Retrieve user details by ID (Admin only)
 *     description: Fetch detailed information for a specific user by their ID.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique ID of the user
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin access required
 *       404:
 *         description: User not found
 */
router.get('/users/:userId', adminController.getUserById);

/**
 * @swagger
 * /api/admin/users/{userId}/status:
 *   patch:
 *     summary: Update user account status (Admin only)
 *     description: Change a user's account status to active, suspended, or deleted.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update
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
 *                 enum: [active, suspended, deleted]
 *                 example: suspended
 *     responses:
 *       200:
 *         description: User status updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: User status updated
 *       400:
 *         description: Invalid status value
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin access required
 *       404:
 *         description: User not found
 */
router.patch(
    '/users/:userId/status',
    [
        body('status').isIn(['active', 'suspended', 'deleted']).withMessage('Status must be active, suspended, or deleted')
    ],
    adminController.updateUserStatus
);

/**
 * @swagger
 * /api/admin/users/{userId}/roles:
 *   patch:
 *     summary: Update user roles (Admin only)
 *     description: Assign or modify roles for a user. Accepts an array of role names or IDs.
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roles
 *             properties:
 *               roles:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["admin", "user"]
 *     responses:
 *       200:
 *         description: User roles updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Roles updated
 *       400:
 *         description: Invalid roles provided
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden — admin access required
 *       404:
 *         description: User not found
 */
router.patch(
    '/users/:userId/roles',
    [
        body('roles').isArray().withMessage('Roles must be an array')
    ],
    adminController.updateUserRoles
);

module.exports = router;