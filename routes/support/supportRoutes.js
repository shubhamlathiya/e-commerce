const express = require('express');
const {body, param, query} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const supportController = require('../../controllers/support/supportController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Support - Enquiries
 *     description: Manage customer contact enquiries.
 *   - name: Support - Tickets
 *     description: Manage user and admin support tickets.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Enquiry:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the enquiry
 *         name:
 *           type: string
 *           description: Name of the person making the enquiry
 *         email:
 *           type: string
 *           format: email
 *           description: Email address for contact
 *         phone:
 *           type: string
 *           description: Phone number for contact
 *         message:
 *           type: string
 *           description: The enquiry message
 *         status:
 *           type: string
 *           enum: [new, resolved]
 *           description: Current status of the enquiry
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the enquiry was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the enquiry was last updated
 *
 *     Ticket:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the ticket
 *         userId:
 *           type: string
 *           description: ID of the user who created the ticket
 *         subject:
 *           type: string
 *           description: Subject of the support ticket
 *         description:
 *           type: string
 *           description: Detailed description of the issue
 *         priority:
 *           type: string
 *           enum: [low, medium, high]
 *           description: Priority level of the ticket
 *         status:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *           description: Current status of the ticket
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: When the ticket was last updated
 *
 *     Error:
 *       type: object
 *       properties:
 *         error:
 *           type: string
 *           description: Error message
 *         details:
 *           type: array
 *           items:
 *             type: object
 *           description: Detailed error information
 */

// =============================================
// ENQUIRIES ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/support/enquiries:
 *   get:
 *     summary: Get all contact enquiries
 *     description: Allows admin users to fetch a paginated list of customer contact enquiries.
 *     tags: [Support - Enquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, resolved]
 *         description: Filter enquiries by status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 20
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: List of enquiries retrieved successfully
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
 *                     $ref: '#/components/schemas/Enquiry'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/enquiries', authenticateJWT, isAdmin, [
    query('status').optional().isIn(['new', 'resolved']),
    query('page').optional().isInt({min: 1}),
    query('limit').optional().isInt({min: 1, max: 200})
], supportController.listEnquiries);

/**
 * @swagger
 * /api/support/enquiries:
 *   post:
 *     summary: Create a new contact enquiry
 *     description: Allows anyone to submit a new contact enquiry (no authentication required).
 *     tags: [Support - Enquiries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 description: Full name of the person
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Email address for contact
 *                 example: john.doe@example.com
 *               phone:
 *                 type: string
 *                 description: Phone number for contact
 *                 example: "+1234567890"
 *               message:
 *                 type: string
 *                 description: The enquiry message
 *                 example: "I need help with my recent purchase"
 *     responses:
 *       201:
 *         description: Enquiry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enquiry'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 */
router.post('/enquiries', [
    body('name').isString().notEmpty().withMessage('Name is required'),
    body('email').optional().isEmail().withMessage('Valid email is required'),
    body('phone').optional().isString().withMessage('Phone must be a string'),
    body('message').isString().notEmpty().withMessage('Message is required')
], supportController.createEnquiry);

/**
 * @swagger
 * /api/support/enquiries/{id}:
 *   get:
 *     summary: Get enquiry details by ID
 *     description: Fetch a specific contact enquiry using its unique ID (Admin only).
 *     tags: [Support - Enquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the enquiry
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Enquiry details fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enquiry'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Enquiry not found
 *       500:
 *         description: Server error
 */
router.get('/enquiries/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid enquiry ID is required')
], supportController.getEnquiryById);

/**
 * @swagger
 * /api/support/enquiries/{id}:
 *   put:
 *     summary: Update an existing enquiry
 *     description: Allows admin to update enquiry details such as status or message.
 *     tags: [Support - Enquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the enquiry
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Updated email
 *               phone:
 *                 type: string
 *                 description: Updated phone number
 *               message:
 *                 type: string
 *                 description: Updated message
 *               status:
 *                 type: string
 *                 enum: [new, resolved]
 *                 description: Updated status
 *     responses:
 *       200:
 *         description: Enquiry updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Enquiry'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Enquiry not found
 *       500:
 *         description: Server error
 */
router.put('/enquiries/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid enquiry ID is required')
], supportController.updateEnquiry);

/**
 * @swagger
 * /api/support/enquiries/{id}:
 *   delete:
 *     summary: Delete a contact enquiry
 *     description: Permanently delete a contact enquiry (Admin only).
 *     tags: [Support - Enquiries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the enquiry to delete
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Enquiry deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Enquiry not found
 *       500:
 *         description: Server error
 */
router.delete('/enquiries/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid enquiry ID is required')
], supportController.deleteEnquiry);

// =============================================
// TICKETS ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/support/tickets:
 *   get:
 *     summary: Get all support tickets (Admin only)
 *     description: Retrieve a paginated list of all support tickets with filtering options.
 *     tags: [Support - Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filter tickets by status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filter tickets by priority
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: Filter tickets by user ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 20
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: List of tickets retrieved successfully
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
 *                     $ref: '#/components/schemas/Ticket'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/tickets', authenticateJWT, isAdmin, [
    query('status').optional().isIn(['open', 'in_progress', 'resolved', 'closed']),
    query('priority').optional().isIn(['low', 'medium', 'high']),
    query('userId').optional().isMongoId(),
    query('page').optional().isInt({min: 1}),
    query('limit').optional().isInt({min: 1, max: 200})
], supportController.listTickets);

/**
 * @swagger
 * /api/support/tickets/my:
 *   get:
 *     summary: Get current user's support tickets
 *     description: Retrieve a paginated list of support tickets created by the authenticated user.
 *     tags: [Support - Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 20
 *         description: Number of records per page
 *     responses:
 *       200:
 *         description: User's tickets retrieved successfully
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
 *                     $ref: '#/components/schemas/Ticket'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
router.get('/tickets/my', authenticateJWT, [
    query('page').optional().isInt({min: 1}),
    query('limit').optional().isInt({min: 1, max: 200})
], supportController.listMyTickets);

/**
 * @swagger
 * /api/support/tickets/{id}:
 *   get:
 *     summary: Get ticket details by ID
 *     description: Retrieve detailed information about a specific support ticket. Users can only access their own tickets, admins can access any ticket.
 *     tags: [Support - Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the ticket
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Ticket details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Access denied - users can only access their own tickets
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.get('/tickets/:id', authenticateJWT, [
    param('id').isMongoId().withMessage('Valid ticket ID is required')
], supportController.getTicketById);

/**
 * @swagger
 * /api/support/tickets:
 *   post:
 *     summary: Create a new support ticket
 *     description: Create a new support ticket for the authenticated user.
 *     tags: [Support - Tickets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Subject/title of the support ticket
 *                 example: "Login issues"
 *               description:
 *                 type: string
 *                 description: Detailed description of the issue
 *                 example: "I'm unable to login to my account despite using correct credentials."
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Priority level of the ticket
 *                 default: medium
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       500:
 *         description: Server error
 */
router.post('/tickets', authenticateJWT, [
    body('subject').isString().notEmpty().withMessage('Subject is required'),
    body('description').isString().notEmpty().withMessage('Description is required'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high')
], supportController.createTicket);

/**
 * @swagger
 * /api/support/tickets/{id}:
 *   put:
 *     summary: Update a support ticket
 *     description: Update a support ticket. Users can update their own tickets, admins can update any ticket.
 *     tags: [Support - Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the ticket to update
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 description: Updated subject
 *               description:
 *                 type: string
 *                 description: Updated description
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 description: Updated priority
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *                 description: Updated status (admins only)
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Ticket'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Access denied - users can only update their own tickets
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.put('/tickets/:id', authenticateJWT, [
    param('id').isMongoId().withMessage('Valid ticket ID is required')
], supportController.updateTicket);

/**
 * @swagger
 * /api/support/tickets/{id}:
 *   delete:
 *     summary: Delete a support ticket (Admin only)
 *     description: Permanently delete a support ticket. This action is only available to admin users.
 *     tags: [Support - Tickets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the ticket to delete
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Ticket deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Ticket not found
 *       500:
 *         description: Server error
 */
router.delete('/tickets/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid ticket ID is required')
], supportController.deleteTicket);

module.exports = router;