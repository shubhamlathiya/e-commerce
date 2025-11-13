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
 *   - name: Settings - Email
 *     description: Manage email configuration and SMTP settings.
 *   - name: Settings - reCAPTCHA
 *     description: Manage reCAPTCHA configuration.
 *   - name: Settings - Payment Gateways
 *     description: Configure and manage payment gateway integrations.
 *   - name: Settings - SEO Pages
 *     description: Manage site-wide SEO pages and metadata.
 *   - name: Settings - Templates
 *     description: Manage email and SMS templates.
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
 *         contactEmail:
 *           type: string
 *           format: email
 *           description: Primary business contact email
 *         phone:
 *           type: string
 *           description: Business contact phone number
 *         address:
 *           type: string
 *           description: Business address
 *         gstNumber:
 *           type: string
 *           description: GST identification number
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
 *     EmailSettings:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         smtp_host:
 *           type: string
 *           description: SMTP server host
 *         smtp_port:
 *           type: integer
 *           description: SMTP server port
 *         smtp_username:
 *           type: string
 *           description: SMTP username
 *         smtp_password:
 *           type: string
 *           description: SMTP password (encrypted)
 *         smtp_secure:
 *           type: string
 *           enum: [none, ssl, tls]
 *           description: Security protocol
 *         from_email:
 *           type: string
 *           format: email
 *           description: Sender email address
 *         from_name:
 *           type: string
 *           description: Sender display name
 *         status:
 *           type: boolean
 *           description: Whether email service is active
 *
 *     RecaptchaSettings:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         site_key:
 *           type: string
 *           description: reCAPTCHA site key
 *         secret_key:
 *           type: string
 *           description: reCAPTCHA secret key
 *         status:
 *           type: boolean
 *           description: Whether reCAPTCHA is enabled
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
 */

// =============================================
// BUSINESS SETTINGS ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/settings/business:
 *   get:
 *     summary: Get business settings
 *     description: Retrieve business configuration settings (Admin only).
 *     tags: [Settings - Business]
 *     security:
 *       - bearerAuth: []
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
 *                   $ref: '#/components/schemas/BusinessSettings'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 *   post:
 *     summary: Create business settings
 *     description: Create new business configuration settings (Admin only).
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
 *               - contactEmail
 *             properties:
 *               businessName:
 *                 type: string
 *                 description: Name of the business
 *                 example: "My Awesome Business"
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 description: Primary contact email
 *                 example: "contact@mybusiness.com"
 *               phone:
 *                 type: string
 *                 description: Business phone number
 *                 example: "+1234567890"
 *               address:
 *                 type: string
 *                 description: Business address
 *                 example: "123 Business Street, City, Country"
 *               gstNumber:
 *                 type: string
 *                 description: GST identification number
 *                 example: "GSTIN123456789"
 *               currency:
 *                 type: string
 *                 description: Default currency code
 *                 example: "INR"
 *               timezone:
 *                 type: string
 *                 description: Business timezone
 *                 example: "Asia/Kolkata"
 *     responses:
 *       201:
 *         description: Business settings created successfully
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
router.get('/business', authenticateJWT, isAdmin, settingsController.getBusinessSettings);
router.post('/business', authenticateJWT, isAdmin, [
    body('businessName').isString().notEmpty().withMessage('Business name is required'),
    body('contactEmail').isEmail().withMessage('Valid email is required'),
    body('phone').optional().isString(),
    body('address').optional().isString(),
    body('gstNumber').optional().isString(),
    body('currency').optional().isString(),
    body('timezone').optional().isString()
], settingsController.createBusinessSettings);

/**
 * @swagger
 * /api/settings/business/{id}:
 *   put:
 *     summary: Update business settings
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
 *               contactEmail:
 *                 type: string
 *                 format: email
 *                 description: Updated contact email
 *               phone:
 *                 type: string
 *                 description: Updated phone number
 *               address:
 *                 type: string
 *                 description: Updated address
 *               gstNumber:
 *                 type: string
 *                 description: Updated GST number
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
 */
router.put('/business/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid business settings ID is required')
], settingsController.updateBusinessSettings);

// =============================================
// EMAIL SETTINGS ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/settings/email:
 *   get:
 *     summary: Get email settings
 *     description: Retrieve email configuration settings (Admin only).
 *     tags: [Settings - Email]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Email settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EmailSettings'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update email settings
 *     description: Update email configuration settings (Admin only).
 *     tags: [Settings - Email]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - smtp_host
 *               - smtp_port
 *               - from_email
 *             properties:
 *               smtp_host:
 *                 type: string
 *                 description: SMTP server host
 *                 example: "smtp.gmail.com"
 *               smtp_port:
 *                 type: integer
 *                 description: SMTP server port
 *                 example: 587
 *               smtp_username:
 *                 type: string
 *                 description: SMTP username
 *                 example: "your-email@gmail.com"
 *               smtp_password:
 *                 type: string
 *                 description: SMTP password
 *                 example: "your-app-password"
 *               smtp_secure:
 *                 type: string
 *                 enum: [none, ssl, tls]
 *                 description: Security protocol
 *                 example: "tls"
 *               from_email:
 *                 type: string
 *                 format: email
 *                 description: Sender email address
 *                 example: "noreply@mybusiness.com"
 *               from_name:
 *                 type: string
 *                 description: Sender display name
 *                 example: "My Business"
 *               status:
 *                 type: boolean
 *                 description: Whether email service is active
 *                 example: true
 *     responses:
 *       200:
 *         description: Email settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/EmailSettings'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/email', authenticateJWT, isAdmin, settingsController.getEmailSettings);
router.put('/email', authenticateJWT, isAdmin, [
    body('smtp_host').isString().notEmpty().withMessage('SMTP host is required'),
    body('smtp_port').isInt({ min: 1, max: 65535 }).withMessage('Valid SMTP port is required'),
    body('smtp_username').optional().isString(),
    body('smtp_password').optional().isString(),
    body('smtp_secure').isIn(['none', 'ssl', 'tls']).withMessage('Security must be none, ssl, or tls'),
    body('from_email').isEmail().withMessage('Valid from email is required'),
    body('from_name').optional().isString(),
    body('status').optional().isBoolean()
], settingsController.updateEmailSettings);

// =============================================
// RECAPTCHA SETTINGS ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/settings/recaptcha:
 *   get:
 *     summary: Get reCAPTCHA settings
 *     description: Retrieve reCAPTCHA configuration settings (Admin only).
 *     tags: [Settings - reCAPTCHA]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: reCAPTCHA settings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RecaptchaSettings'
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 *   put:
 *     summary: Update reCAPTCHA settings
 *     description: Update reCAPTCHA configuration settings (Admin only).
 *     tags: [Settings - reCAPTCHA]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - site_key
 *               - secret_key
 *             properties:
 *               site_key:
 *                 type: string
 *                 description: reCAPTCHA site key
 *                 example: "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI"
 *               secret_key:
 *                 type: string
 *                 description: reCAPTCHA secret key
 *                 example: "6LeIxAcTAAAAAGG-vFI1TnRWxMZNFuojJ4WifJWe"
 *               status:
 *                 type: boolean
 *                 description: Whether reCAPTCHA is enabled
 *                 example: true
 *     responses:
 *       200:
 *         description: reCAPTCHA settings updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/RecaptchaSettings'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized access
 *       403:
 *         description: Admin access required
 *       500:
 *         description: Server error
 */
router.get('/recaptcha', authenticateJWT, isAdmin, settingsController.getRecaptchaSettings);
router.put('/recaptcha', authenticateJWT, isAdmin, [
    body('site_key').isString().notEmpty().withMessage('Site key is required'),
    body('secret_key').isString().notEmpty().withMessage('Secret key is required'),
    body('status').optional().isBoolean()
], settingsController.updateRecaptchaSettings);

// =============================================
// PAYMENT GATEWAYS ENDPOINTS
// =============================================

/**
 * @swagger
 * /api/settings/payment-gateways:
 *   get:
 *     summary: Get payment gateways
 *     description: Retrieve all payment gateway configurations (Admin only).
 *     tags: [Settings - Payment Gateways]
 *     security:
 *       - bearerAuth: []
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
 *     summary: Create payment gateway
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
 *                 example: "razorpay"
 *               config:
 *                 type: object
 *                 description: Gateway-specific configuration
 *                 example: {"key_id": "rzp_test_123", "key_secret": "secret_123"}
 *               status:
 *                 type: boolean
 *                 description: Whether gateway is active
 *                 example: false
 *               testMode:
 *                 type: boolean
 *                 description: Whether in test mode
 *                 example: true
 *     responses:
 *       201:
 *         description: Payment gateway created successfully
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
router.get('/payment-gateways', authenticateJWT, isAdmin, settingsController.getPaymentGateways);
router.post('/payment-gateways', authenticateJWT, isAdmin, [
    body('name').isString().notEmpty().withMessage('Gateway name is required'),
    body('config').optional().isObject(),
    body('status').optional().isBoolean(),
    body('testMode').optional().isBoolean()
], settingsController.createPaymentGateway);

/**
 * @swagger
 * /api/settings/payment-gateways/{id}:
 *   put:
 *     summary: Update payment gateway
 *     description: Update existing payment gateway configuration (Admin only).
 *     tags: [Settings - Payment Gateways]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the payment gateway
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated gateway name
 *               config:
 *                 type: object
 *                 description: Updated configuration
 *               status:
 *                 type: boolean
 *                 description: Updated status
 *               testMode:
 *                 type: boolean
 *                 description: Updated test mode
 *     responses:
 *       200:
 *         description: Payment gateway updated successfully
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
 *       404:
 *         description: Payment gateway not found
 *       500:
 *         description: Server error
 *   delete:
 *     summary: Delete payment gateway
 *     description: Delete payment gateway configuration (Admin only).
 *     tags: [Settings - Payment Gateways]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^[0-9a-fA-F]{24}$'
 *         description: MongoDB ObjectId of the payment gateway to delete
 *     responses:
 *       200:
 *         description: Payment gateway deleted successfully
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
 *         description: Payment gateway not found
 *       500:
 *         description: Server error
 */
router.put('/payment-gateways/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid payment gateway ID is required')
], settingsController.updatePaymentGateway);
router.delete('/payment-gateways/:id', authenticateJWT, isAdmin, [
    param('id').isMongoId().withMessage('Valid payment gateway ID is required')
], settingsController.deletePaymentGateway);

// =============================================
// EXISTING ENDPOINTS (KEPT FOR BACKWARD COMPATIBILITY)
// =============================================

// SEO Pages endpoints
router.get('/seo-pages', authenticateJWT, isAdmin, settingsController.listSeoPages);
router.post('/seo-pages', authenticateJWT, isAdmin, settingsController.createSeoPage);
router.get('/seo-pages/:id', authenticateJWT, isAdmin, settingsController.getSeoPageById);
router.put('/seo-pages/:id', authenticateJWT, isAdmin, settingsController.updateSeoPage);
router.delete('/seo-pages/:id', authenticateJWT, isAdmin, settingsController.deleteSeoPage);

// Templates endpoints
router.get('/templates', authenticateJWT, isAdmin, settingsController.listTemplates);
router.post('/templates', authenticateJWT, isAdmin, settingsController.createTemplate);
router.get('/templates/:id', authenticateJWT, isAdmin, settingsController.getTemplateById);
router.put('/templates/:id', authenticateJWT, isAdmin, settingsController.updateTemplate);
router.delete('/templates/:id', authenticateJWT, isAdmin, settingsController.deleteTemplate);

// Mobile App endpoints
router.get('/mobile-app', authenticateJWT, isAdmin, settingsController.listMobileConfigs);
router.post('/mobile-app', authenticateJWT, isAdmin, settingsController.createMobileConfig);
router.get('/mobile-app/:id', authenticateJWT, isAdmin, settingsController.getMobileConfigById);
router.put('/mobile-app/:id', authenticateJWT, isAdmin, settingsController.updateMobileConfig);
router.delete('/mobile-app/:id', authenticateJWT, isAdmin, settingsController.deleteMobileConfig);

module.exports = router;