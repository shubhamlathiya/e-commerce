const express = require('express');
const router = express.Router();
const {check} = require('express-validator');
const shippingController = require('../../controllers/shipping/shippingController');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Shipping
 *   description: Manage shipping cost calculations, rules, and zones
 */


/**
 * @swagger
 * /api/shipping/calculate:
 *   post:
 *     summary: Calculate shipping cost based on order value and location
 *     tags: [Shipping]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderValue
 *               - country
 *             properties:
 *               orderValue:
 *                 type: number
 *                 example: 1500
 *               country:
 *                 type: string
 *                 example: "India"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               postalCode:
 *                 type: string
 *                 example: "400001"
 *     responses:
 *       200:
 *         description: Shipping cost calculated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shippingCost:
 *                   type: number
 *                   example: 80
 *       400:
 *         description: Invalid input data
 */
router.post('/calculate',
    [
        check('orderValue').isNumeric().withMessage('Order value is required'),
        check('country').isString().withMessage('Country is required'),
        check('state').optional().isString(),
        check('postalCode').optional().isString()
    ],
    shippingController.calculateShipping
);

/**
 * @swagger
 * /api/shipping/rules:
 *   get:
 *     summary: Get all shipping rules (Admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all shipping rules
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   title:
 *                     type: string
 *                     example: "Free Shipping over ₹1000"
 *                   minOrderValue:
 *                     type: number
 *                   maxOrderValue:
 *                     type: number
 *                   shippingCost:
 *                     type: number
 *                   country:
 *                     type: string
 *                   state:
 *                     type: string
 *                   status:
 *                     type: boolean
 *       403:
 *         description: Forbidden
 */
router.get('/rules',
    authenticateJWT,
    isAdmin,
    shippingController.getAllRules
);

/**
 * @swagger
 * /api/shipping/rules/{id}:
 *   get:
 *     summary: Get a shipping rule by ID (Admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipping rule ID
 *     responses:
 *       200:
 *         description: Shipping rule details
 *       404:
 *         description: Rule not found
 */
router.get('/rules/:id',
    authenticateJWT,
    isAdmin,
    shippingController.getRuleById
);

/**
 * @swagger
 * /api/shipping/rules:
 *   post:
 *     summary: Create a new shipping rule (Admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - minOrderValue
 *               - maxOrderValue
 *               - shippingCost
 *               - country
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Free Shipping on Orders Above ₹1000"
 *               minOrderValue:
 *                 type: number
 *                 example: 1000
 *               maxOrderValue:
 *                 type: number
 *                 example: 5000
 *               shippingCost:
 *                 type: number
 *                 example: 0
 *               country:
 *                 type: string
 *                 example: "India"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               postalCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["400001", "400002"]
 *               status:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Shipping rule created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/rules',
    authenticateJWT,
    isAdmin,
    [
        check('title').isString().withMessage('Title is required'),
        check('minOrderValue').isNumeric().withMessage('Minimum order value is required'),
        check('maxOrderValue').isNumeric().withMessage('Maximum order value is required'),
        check('shippingCost').isNumeric().withMessage('Shipping cost is required'),
        check('country').isString().withMessage('Country is required'),
        check('state').optional().isString(),
        check('postalCodes').optional().isArray(),
        check('status').optional().isBoolean()
    ],
    shippingController.createRule
);

/**
 * @swagger
 * /api/shipping/rules/{id}:
 *   put:
 *     summary: Update a shipping rule (Admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipping rule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               minOrderValue:
 *                 type: number
 *               maxOrderValue:
 *                 type: number
 *               shippingCost:
 *                 type: number
 *               country:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCodes:
 *                 type: array
 *                 items:
 *                   type: string
 *               status:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Shipping rule updated successfully
 *       404:
 *         description: Rule not found
 */
router.put('/rules/:id',
    authenticateJWT,
    isAdmin,
    [
        check('title').optional().isString(),
        check('minOrderValue').optional().isNumeric(),
        check('maxOrderValue').optional().isNumeric(),
        check('shippingCost').optional().isNumeric(),
        check('country').optional().isString(),
        check('state').optional().isString(),
        check('postalCodes').optional().isArray(),
        check('status').optional().isBoolean()
    ],
    shippingController.updateRule
);

/**
 * @swagger
 * /api/shipping/rules/{id}:
 *   delete:
 *     summary: Delete a shipping rule (Admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipping rule ID
 *     responses:
 *       200:
 *         description: Shipping rule deleted successfully
 *       404:
 *         description: Rule not found
 */
router.delete('/rules/:id',
    authenticateJWT,
    isAdmin,
    shippingController.deleteRule
);


/**
 * @swagger
 * /api/shipping/zones:
 *   get:
 *     summary: Get all shipping zones (Admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of shipping zones
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   zoneName:
 *                     type: string
 *                     example: "South Zone"
 *                   countries:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["India"]
 *                   states:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["Tamil Nadu", "Kerala"]
 *                   pincodes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["600001", "600002"]
 */
router.get('/zones',
    authenticateJWT,
    isAdmin,
    shippingController.getAllZones
);

/**
 * @swagger
 * /api/shipping/zones/{id}:
 *   get:
 *     summary: Get a shipping zone by ID (Admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipping zone ID
 *     responses:
 *       200:
 *         description: Shipping zone details
 *       404:
 *         description: Zone not found
 */
router.get('/zones/:id',
    authenticateJWT,
    isAdmin,
    shippingController.getZoneById
);

/**
 * @swagger
 * /api/shipping/zones:
 *   post:
 *     summary: Create a shipping zone (Admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - zoneName
 *               - countries
 *             properties:
 *               zoneName:
 *                 type: string
 *                 example: "North Zone"
 *               countries:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["India"]
 *               states:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["Delhi", "Haryana"]
 *               pincodes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["110001", "110002"]
 *     responses:
 *       201:
 *         description: Shipping zone created successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/zones',
    authenticateJWT,
    isAdmin,
    [
        check('zoneName').isString().withMessage('Zone name is required'),
        check('countries').isArray().withMessage('Countries array is required'),
        check('states').optional().isArray(),
        check('pincodes').optional().isArray()
    ],
    shippingController.createZone
);

/**
 * @swagger
 * /api/shipping/zones/{id}:
 *   put:
 *     summary: Update a shipping zone (Admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipping zone ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               zoneName:
 *                 type: string
 *               countries:
 *                 type: array
 *                 items:
 *                   type: string
 *               states:
 *                 type: array
 *                 items:
 *                   type: string
 *               pincodes:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Shipping zone updated successfully
 *       404:
 *         description: Zone not found
 */
router.put('/zones/:id',
    authenticateJWT,
    isAdmin,
    [
        check('zoneName').optional().isString(),
        check('countries').optional().isArray(),
        check('states').optional().isArray(),
        check('pincodes').optional().isArray()
    ],
    shippingController.updateZone
);

/**
 * @swagger
 * /api/shipping/zones/{id}:
 *   delete:
 *     summary: Delete a shipping zone (Admin only)
 *     tags: [Shipping]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Shipping zone ID
 *     responses:
 *       200:
 *         description: Shipping zone deleted successfully
 *       404:
 *         description: Zone not found
 */
router.delete('/zones/:id',
    authenticateJWT,
    isAdmin,
    shippingController.deleteZone
);

module.exports = router;