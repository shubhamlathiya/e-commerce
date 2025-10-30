const express = require('express');
const {body, param, query} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const settingsController = require('../../controllers/settings/settingsController');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Settings - Business
 *     description: Manage business configuration and settings.
 *   - name: Settings - SEO Pages
 *     description: Manage site-wide SEO pages and metadata.
 *   - name: Settings - Templates
 *     description: Manage email and SMS templates.
 *   - name: Settings - Payment Gateways
 *     description: Configure and manage payment gateway integrations.
 *   - name: Settings - Mobile App
 *     description: Manage mobile app configuration and theme settings.
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     BusinessSettings:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: Unique identifier for the business settings
 *         businessName:
 *           type: string
 *           description: Name of the business
 *         businessEmail:
 *           type: string
 *           format: email
 *           description: Primary business email
 *         businessPhone:
 *           type: string
 *           description: Business contact phone number
 *         address:
 *           type: object
 *           description: Business address details
 *         currency:
 *           type: string
 *           description: Default currency code
 *         timezone:
 *           type: string
 *           description: Business timezone
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *
 *     SEOPage:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         page:
 *           type: string
 *           description: Page identifier or route
 *         metaTitle:
 *           type: string
 *           description: SEO meta title
 *         metaDescription:
 *           type: string
 *           description: SEO meta description
 *         metaKeywords:
 *           type: array
 *           items:
 *             type: string
 *           description: SEO keywords
 *         canonicalUrl:
 *           type: string
 *           description: Canonical URL for the page
 *         ogImage:
 *           type: string
 *           description: Open Graph image URL
 *
 *     Template:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         type:
 *           type: string
 *           description: Template type (welcome, notification, etc.)
 *         channel:
 *           type: string
 *           enum: [email, sms]
 *           description: Communication channel
 *         subject:
 *           type: string
 *           description: Email subject or SMS title
 *         body:
 *           type: string
 *           description: Template content
 *         variables:
 *           type: array
 *           items:
 *             type: string
 *           description: Available template variables
 *         isActive:
 *           type: boolean
 *           description: Whether template is active
 *
 *     PaymentGateway:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         name:
 *           type: string
 *           description: Payment gateway name (stripe, paypal, etc.)
 *         config:
 *           type: object
 *           description: Gateway-specific configuration
 *         status:
 *           type: boolean
 *           description: Whether gateway is active
 *         testMode:
 *           type: boolean
 *           description: Whether in test mode
 *
 *     MobileAppConfig:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         version:
 *           type: string
 *           description: App version
 *         theme:
 *           type: object
 *           description: Theme configuration
 *         apiUrl:
 *           type: string
 *           description: Backend API URL
 *         features:
 *           type: object
 *           description: Enabled/disabled features
 *         maintenanceMode:
 *           type: boolean
 *           description: Whether app is in maintenance
 */

// =============================================
// BUSINESS SETTINGS ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/settings/business:
 *   get:
 *     summary: Get all business settings
 *     description: Retrieve paginated list of business configuration settings (Admin only).
 *     tags: [Settings - Business]
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
 *         description: Business settings retrieved successfully
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
 *                     $ref: '#/components/schemas/BusinessSettings'
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
 *   post:
 *     summary: Create new business setting
 *     description: Create a new business configuration setting (Admin only).
 *     tags: [Settings - Business]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Name of the business
 *                 example: "My Awesome Business"
 *               businessEmail:
 *                 type: string
 *                 format: email
 *                 description: Primary business email
 *                 example: "contact@mybusiness.com"
 *               businessPhone:
 *                 type: string
 *                 description: Business phone number
 *                 example: "+1234567890"
 *               address:
 *                 type: object
 *                 description: Business address
 *               currency:
 *                 type: string
 *                 description: Default currency code
 *                 example: "USD"
 *               timezone:
 *                 type: string
 *                 description: Business timezone
 *                 example: "America/New_York"
 *     responses:
 *       201:
 *         description: Business setting created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BusinessSettings'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/business', authenticateJWT, isAdmin, [
    query('page').optional().isInt({min: 1}),
    query('limit').optional().isInt({min: 1, max: 200})
], settingsController.listBusinessSettings);

router.post('/business', authenticateJWT, isAdmin, [
    body('businessName').isString().notEmpty().withMessage('Business name is required'),
    body('businessEmail').optional().isEmail().withMessage('Valid email is required'),
    body('businessPhone').optional().isString(),
    body('currency').optional().isString(),
    body('timezone').optional().isString()
], settingsController.createBusinessSettings);

/**
 * @swagger
 * /api/settings/business/{id}:
 *   get:
 *     summary: Get business setting by ID
 *     description: Retrieve specific business settings by ID (Admin only).
 *     tags: [Settings - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the business settings
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Business setting details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BusinessSettings'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Business settings not found
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update business setting
 *     description: Update existing business settings (Admin only).
 *     tags: [Settings - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the business settings
 *         example: 507f1f77bcf86cd799439011
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Updated business name
 *               businessEmail:
 *                 type: string
 *                 format: email
 *                 description: Updated business email
 *               businessPhone:
 *                 type: string
 *                 description: Updated business phone
 *               address:
 *                 type: object
 *                 description: Updated address
 *               currency:
 *                 type: string
 *                 description: Updated currency
 *               timezone:
 *                 type: string
 *                 description: Updated timezone
 *     responses:
 *       200:
 *         description: Business settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/BusinessSettings'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Business settings not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete business setting
 *     description: Delete business settings configuration (Admin only).
 *     tags: [Settings - Business]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the business settings to delete
 *         example: 507f1f77bcf86cd799439011
 *     responses:
 *       200:
 *         description: Business settings deleted successfully
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
 *         description: Business settings not found
 *       500:
 *         description: Server error
 */
router.get('/business/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid business settings ID is required')
], settingsController.getBusinessSettingsById);

router.put('/business/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid business settings ID is required')
], settingsController.updateBusinessSettings);

router.delete('/business/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid business settings ID is required')
], settingsController.deleteBusinessSettings);

// =============================================
// SEO PAGES ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/settings/seo-pages:
 *   get:
 *     summary: List SEO pages
 *     description: Retrieve all SEO pages with optional filtering by page name (Admin only).
 *     tags: [Settings - SEO Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *         description: Filter by page name/identifier
 *     responses:
 *       200:
 *         description: List of SEO pages retrieved successfully
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
 *                     $ref: '#/components/schemas/SEOPage'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create SEO page
 *     description: Create a new SEO page configuration (Admin only).
 *     tags: [Settings - SEO Pages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - page
 *             properties:
 *               page:
 *                 type: string
 *                 description: Page identifier or route
 *                 example: "home"
 *               metaTitle:
 *                 type: string
 *                 description: SEO meta title
 *                 example: "My Business - Home"
 *               metaDescription:
 *                 type: string
 *                 description: SEO meta description
 *                 example: "Welcome to My Business - your trusted partner"
 *               metaKeywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: SEO keywords
 *                 example: ["business", "services", "quality"]
 *               canonicalUrl:
 *                 type: string
 *                 description: Canonical URL
 *                 example: "https://mybusiness.com"
 *               ogImage:
 *                 type: string
 *                 description: Open Graph image URL
 *     responses:
 *       201:
 *         description: SEO page created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/SEOPage'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/seo-pages', authenticateJWT, isAdmin, [
    query('page').optional().isString()
], settingsController.listSeoPages);

router.post('/seo-pages', authenticateJWT, isAdmin, [
    body('page').isString().notEmpty().withMessage('Page identifier is required'),
    body('metaTitle').optional().isString(),
    body('metaDescription').optional().isString(),
    body('metaKeywords').optional().isArray(),
    body('canonicalUrl').optional().isString(),
    body('ogImage').optional().isString()
], settingsController.createSeoPage);

/**
 * @swagger
 * /api/settings/seo-pages/{id}:
 *   get:
 *     summary: Get SEO page by ID
 *     tags: [Settings - SEO Pages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *     responses:
 *       200:
 *         description: SEO page details
 *       404:
 *         description: SEO page not found
 *   put:
 *     summary: Update SEO page
 *     tags: [Settings - SEO Pages]
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
 *         description: SEO page updated successfully
 *   delete:
 *     summary: Delete SEO page
 *     tags: [Settings - SEO Pages]
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
 *         description: SEO page deleted successfully
 */
router.get('/seo-pages/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid SEO page ID is required')
], settingsController.getSeoPageById);

router.put('/seo-pages/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid SEO page ID is required')
], settingsController.updateSeoPage);

router.delete('/seo-pages/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid SEO page ID is required')
], settingsController.deleteSeoPage);

// =============================================
// TEMPLATES ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/settings/templates:
 *   get:
 *     summary: List templates
 *     description: Retrieve email and SMS templates with filtering options (Admin only).
 *     tags: [Settings - Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: channel
 *         schema:
 *           type: string
 *           enum: [email, sms]
 *         description: Filter by communication channel
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by template type
 *     responses:
 *       200:
 *         description: Template list retrieved successfully
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
 *                     $ref: '#/components/schemas/Template'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create template
 *     description: Create a new email or SMS template (Admin only).
 *     tags: [Settings - Templates]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - channel
 *               - body
 *             properties:
 *               type:
 *                 type: string
 *                 description: Template type identifier
 *                 example: "welcome_email"
 *               channel:
 *                 type: string
 *                 enum: [email, sms]
 *                 description: Communication channel
 *                 example: "email"
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Welcome to Our Service!"
 *               body:
 *                 type: string
 *                 description: Template content with variables
 *                 example: "Hello {{name}}, welcome to our platform!"
 *               variables:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Available template variables
 *                 example: ["name", "email"]
 *               isActive:
 *                 type: boolean
 *                 description: Whether template is active
 *                 default: true
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Template'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/templates', authenticateJWT, isAdmin, [
    query('channel').optional().isIn(['email', 'sms']),
    query('type').optional().isString()
], settingsController.listTemplates);

router.post('/templates', authenticateJWT, isAdmin, [
    body('type').isString().notEmpty().withMessage('Template type is required'),
    body('channel').isIn(['email', 'sms']).withMessage('Channel must be email or sms'),
    body('subject').optional().isString(),
    body('body').isString().notEmpty().withMessage('Template body is required'),
    body('variables').optional().isArray(),
    body('isActive').optional().isBoolean()
], settingsController.createTemplate);

router.get('/templates/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid template ID is required')
], settingsController.getTemplateById);

router.put('/templates/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid template ID is required')
], settingsController.updateTemplate);

router.delete('/templates/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid template ID is required')
], settingsController.deleteTemplate);

// =============================================
// PAYMENT GATEWAYS ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/settings/payment-gateways:
 *   get:
 *     summary: List payment gateway configurations
 *     description: Retrieve all payment gateway configurations with filtering (Admin only).
 *     tags: [Settings - Payment Gateways]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by gateway name
 *       - in: query
 *         name: status
 *         schema:
 *           type: boolean
 *         description: Filter by active status
 *     responses:
 *       200:
 *         description: Payment gateways retrieved successfully
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
 *                     $ref: '#/components/schemas/PaymentGateway'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create payment gateway config
 *     description: Create a new payment gateway configuration (Admin only).
 *     tags: [Settings - Payment Gateways]
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
 *             properties:
 *               name:
 *                 type: string
 *                 description: Payment gateway name
 *                 example: "stripe"
 *               config:
 *                 type: object
 *                 description: Gateway-specific configuration
 *                 example: {"apiKey": "sk_test_...", "webhookSecret": "whsec_..."}
 *               status:
 *                 type: boolean
 *                 description: Whether gateway is active
 *                 default: false
 *               testMode:
 *                 type: boolean
 *                 description: Whether in test mode
 *                 default: true
 *     responses:
 *       201:
 *         description: Payment gateway configuration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/PaymentGateway'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/payment-gateways', authenticateJWT, isAdmin, [
    query('name').optional().isString(),
    query('status').optional().isBoolean()
], settingsController.listPaymentConfigs);

router.post('/payment-gateways', authenticateJWT, isAdmin, [
    body('name').isString().notEmpty().withMessage('Gateway name is required'),
    body('config').optional().isObject(),
    body('status').optional().isBoolean(),
    body('testMode').optional().isBoolean()
], settingsController.createPaymentConfig);

router.get('/payment-gateways/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid payment gateway ID is required')
], settingsController.getPaymentConfigById);

router.put('/payment-gateways/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid payment gateway ID is required')
], settingsController.updatePaymentConfig);

router.delete('/payment-gateways/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid payment gateway ID is required')
], settingsController.deletePaymentConfig);

// =============================================
// MOBILE APP CONFIG ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/settings/mobile-app:
 *   get:
 *     summary: List mobile app configurations
 *     description: Retrieve paginated list of mobile app configurations (Admin only).
 *     tags: [Settings - Mobile App]
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
 *         description: Mobile app configurations retrieved successfully
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
 *                     $ref: '#/components/schemas/MobileAppConfig'
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
 *   post:
 *     summary: Create mobile app config
 *     description: Create a new mobile app configuration (Admin only).
 *     tags: [Settings - Mobile App]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *             properties:
 *               version:
 *                 type: string
 *                 description: App version number
 *                 example: "1.2.0"
 *               theme:
 *                 type: object
 *                 description: Theme configuration
 *                 example: {"primaryColor": "#3498db", "fontFamily": "Arial"}
 *               apiUrl:
 *                 type: string
 *                 description: Backend API URL
 *                 example: "https://api.myapp.com/v1"
 *               features:
 *                 type: object
 *                 description: Feature flags
 *                 example: {"chat": true, "payments": false}
 *               maintenanceMode:
 *                 type: boolean
 *                 description: Whether app is in maintenance
 *                 default: false
 *     responses:
 *       201:
 *         description: Mobile app configuration created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/MobileAppConfig'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/mobile-app', authenticateJWT, isAdmin, [
    query('page').optional().isInt({min: 1}),
    query('limit').optional().isInt({min: 1, max: 200})
], settingsController.listMobileConfigs);

router.post('/mobile-app', authenticateJWT, isAdmin, [
    body('version').isString().notEmpty().withMessage('Version is required'),
    body('theme').optional().isObject(),
    body('apiUrl').optional().isString(),
    body('features').optional().isObject(),
    body('maintenanceMode').optional().isBoolean()
], settingsController.createMobileConfig);

router.get('/mobile-app/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid mobile config ID is required')
], settingsController.getMobileConfigById);

router.put('/mobile-app/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid mobile config ID is required')
], settingsController.updateMobileConfig);

router.delete('/mobile-app/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid mobile config ID is required')
], settingsController.deleteMobileConfig);

module.exports = router;