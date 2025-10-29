const express = require('express');
const router = express.Router();
const {check, param} = require('express-validator');
const addressController = require('../../controllers/shipping/addressController');
const {authenticateJWT} = require('../../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: User Addresses
 *   description: Manage user shipping addresses
 */


/**
 * @swagger
 * /api/address:
 *   get:
 *     summary: Get all addresses for the logged-in user
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user addresses
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
 *                   example: Addresses retrieved successfully
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Address'
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticateJWT, addressController.getMyAddresses);

/**
 * @swagger
 * /api/address/{id}:
 *   get:
 *     summary: Get a specific address by ID
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Address'
 *       404:
 *         description: Address not found
 */
router.get('/:id', authenticateJWT, [param('id').isMongoId()], addressController.getAddressById);

/**
 * @swagger
 * /api/address:
 *   post:
 *     summary: Create a new address
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, address, city, state, pincode, country]
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *               address:
 *                 type: string
 *                 example: "123 Main Street"
 *               city:
 *                 type: string
 *                 example: "Mumbai"
 *               state:
 *                 type: string
 *                 example: "Maharashtra"
 *               pincode:
 *                 type: string
 *                 example: "400001"
 *               country:
 *                 type: string
 *                 example: "India"
 *               type:
 *                 type: string
 *                 enum: [home, office]
 *                 example: home
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Missing or invalid fields
 */
router.post('/',
    authenticateJWT,
    [
        check('name').isString(),
        check('phone').isString(),
        check('address').isString(),
        check('city').isString(),
        check('state').isString(),
        check('pincode').isString(),
        check('country').isString(),
        check('type').optional().isIn(['home', 'office']),
        check('isDefault').optional().isBoolean(),
    ],
    addressController.createAddress
);

/**
 * @swagger
 * /api/address/{id}:
 *   put:
 *     summary: Update an existing address
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               pincode:
 *                 type: string
 *               country:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [home, office]
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       404:
 *         description: Address not found
 */
router.put('/:id',
    authenticateJWT,
    [
        param('id').isMongoId(),
        check('name').optional().isString(),
        check('phone').optional().isString(),
        check('address').optional().isString(),
        check('city').optional().isString(),
        check('state').optional().isString(),
        check('pincode').optional().isString(),
        check('country').optional().isString(),
        check('type').optional().isIn(['home', 'office']),
        check('isDefault').optional().isBoolean(),
    ],
    addressController.updateAddress
);

/**
 * @swagger
 * /api/address/{id}:
 *   delete:
 *     summary: Delete an address
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       404:
 *         description: Address not found
 */
router.delete('/:id', authenticateJWT, [param('id').isMongoId()], addressController.deleteAddress);

/**
 * @swagger
 * /api/address/{id}/default:
 *   post:
 *     summary: Set an address as default
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Default address updated successfully
 *       404:
 *         description: Address not found
 */
router.post('/:id/default', authenticateJWT, [param('id').isMongoId()], addressController.setDefault);

/**
 * @swagger
 * /api/address/{id}/select:
 *   post:
 *     summary: Select an address for checkout
 *     tags: [User Addresses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Address ID
 *     responses:
 *       200:
 *         description: Address selected for checkout
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
 *                   example: Address selected for checkout
 *                 data:
 *                   type: object
 *                   example:
 *                     name: John Doe
 *                     phone: "+919876543210"
 *                     address: "123 Main Street"
 *                     city: "Mumbai"
 *                     state: "Maharashtra"
 *                     postalCode: "400001"
 *                     country: "India"
 */
router.post('/:id/select', authenticateJWT, [param('id').isMongoId()], addressController.selectForCheckout);

module.exports = router;

