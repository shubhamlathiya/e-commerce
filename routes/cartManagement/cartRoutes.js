const express = require('express');
const router = express.Router();
const {check} = require('express-validator');
const cartController = require('../../controllers/cartManagement/cartController');
const {authenticateJWT} = require('../../middleware/authMiddleware');

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Cart management for guest and logged-in users
 */


/**
 * @swagger
 * /api/cart:
 *   get:
 *     summary: Get the user's cart
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         description: Session ID for guest user
 *     responses:
 *       200:
 *         description: Cart details retrieved successfully
 *       400:
 *         description: Invalid sessionId
 */
router.get('/',authenticateJWT,
    [
        check('sessionId').optional().isString()
    ],
    cartController.getCart
);

/**
 * @swagger
 * /api/cart/item:
 *   post:
 *     summary: Add an item to the cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Product ID
 *                 example: 671f44e2b12a34567890abcd
 *               variantId:
 *                 type: string
 *                 description: Optional variant ID
 *                 example: 671f44e2b12a34567890abcf
 *               quantity:
 *                 type: integer
 *                 description: Quantity to add
 *                 example: 2
 *               sessionId:
 *                 type: string
 *                 description: Session ID for guest user
 *                 example: "guest-abc-123"
 *     responses:
 *       201:
 *         description: Item added to cart successfully
 *       400:
 *         description: Validation error
 */
router.post('/item', authenticateJWT,
    [
        check('productId').isMongoId().withMessage('Valid product ID is required'),
        check('variantId').optional().isMongoId(),
        check('quantity').isInt({min: 1}).withMessage('Quantity must be at least 1'),
        check('sessionId').optional().isString()
    ],
    cartController.addItem
);

/**
 * @swagger
 * /api/cart/item/{itemId}:
 *   put:
 *     summary: Update the quantity of a specific item in the cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         description: Session ID for guest user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *                 example: 3
 *     responses:
 *       200:
 *         description: Item quantity updated successfully
 *       404:
 *         description: Item not found
 */
router.put('/item/:itemId',
    [
        check('quantity').isInt({min: 1}).withMessage('Quantity must be at least 1'),
        check('sessionId').optional().isString()
    ],
    cartController.updateItemQuantity
);

/**
 * @swagger
 * /api/cart/item/{itemId}:
 *   delete:
 *     summary: Remove an item from the cart
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *         description: Cart item ID
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         description: Session ID for guest user
 *     responses:
 *       200:
 *         description: Item removed successfully
 *       404:
 *         description: Item not found
 */
router.delete('/item',
    [
        check('sessionId').optional().isString()
    ],
    cartController.removeItem
);

/**
 * @swagger
 * /api/cart/coupon:
 *   post:
 *     summary: Apply a coupon to the cart
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - couponCode
 *             properties:
 *               couponCode:
 *                 type: string
 *                 example: SAVE10
 *               sessionId:
 *                 type: string
 *                 example: "guest-abc-123"
 *     responses:
 *       200:
 *         description: Coupon applied successfully
 *       400:
 *         description: Invalid or expired coupon
 */
router.post('/coupon',
    [
        check('couponCode').isString().withMessage('Coupon code is required'),
        check('sessionId').optional().isString()
    ],
    cartController.applyCoupon
);

/**
 * @swagger
 * /api/cart/coupon:
 *   delete:
 *     summary: Remove an applied coupon
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         description: Session ID for guest user
 *     responses:
 *       200:
 *         description: Coupon removed successfully
 */
router.delete('/coupon',
    [
        check('sessionId').optional().isString()
    ],
    cartController.removeCoupon
);

/**
 * @swagger
 * /api/cart:
 *   delete:
 *     summary: Clear all items from the cart
 *     tags: [Cart]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         schema:
 *           type: string
 *         description: Session ID for guest user
 *     responses:
 *       200:
 *         description: Cart cleared successfully
 */
router.delete('/',
    [
        check('sessionId').optional().isString()
    ],
    cartController.clearCart
);

/**
 * @swagger
 * /api/cart/merge:
 *   post:
 *     summary: Merge guest cart with user cart (after login)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *             properties:
 *               sessionId:
 *                 type: string
 *                 example: "guest-abc-123"
 *     responses:
 *       200:
 *         description: Guest cart merged with user cart successfully
 *       400:
 *         description: Invalid session or user
 */
router.post('/merge',
    authenticateJWT,
    [
        check('sessionId').isString().withMessage('Session ID is required')
    ],
    cartController.mergeCart
);

module.exports = router;