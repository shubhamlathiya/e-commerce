const express = require('express');
const router = express.Router();
const {body, param} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const productGalleryController = require('../../controllers/productCatalog/productGalleryController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * tags:
 *   - name: Catalog - Product Gallery
 *     description: Manage product gallery images
 */


/**
 * @swagger
 * /api/catalog/product-gallery/{productId}:
 *   get:
 *     summary: Get gallery images of a product
 *     tags: [Catalog - Product Gallery]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: List of product gallery images
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */

router.get('/:productId', [param('productId').isMongoId()], validate, productGalleryController.getGallery);


/**
 * @swagger
 * /api/catalog/product-gallery/{productId}:
 *   put:
 *     summary: Set or update product gallery (Admin only)
 *     tags: [Catalog - Product Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 description: List of image objects for the product
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                       description: Image URL
 *                     alt:
 *                       type: string
 *                       description: Alternative text for accessibility
 *           example:
 *             images:
 *               - url: "https://cdn.example.com/products/671f44e2b12a34567890abcd/image1.jpg"
 *                 alt: "Front view of product"
 *               - url: "https://cdn.example.com/products/671f44e2b12a34567890abcd/image2.jpg"
 *                 alt: "Side angle"
 *               - url: "https://cdn.example.com/products/671f44e2b12a34567890abcd/image3.jpg"
 *                 alt: "Back view"
 *               - url: "https://cdn.example.com/products/671f44e2b12a34567890abcd/image4.jpg"
 *                 alt: "Top close-up"
 *               - url: "https://cdn.example.com/products/671f44e2b12a34567890abcd/image5.jpg"
 *                 alt: "Packaging photo"
 *     responses:
 *       200:
 *         description: Product gallery updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.put('/:productId', authenticateJWT, isAdmin, [param('productId').isMongoId(), body('images').isArray()], validate, productGalleryController.setGallery);

/**
 * @swagger
 * /api/catalog/product-gallery/{productId}:
 *   delete:
 *     summary: Delete product gallery (Admin only)
 *     tags: [Catalog - Product Gallery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product gallery deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.delete('/:productId', authenticateJWT, isAdmin, [param('productId').isMongoId()], validate, productGalleryController.deleteGallery);

module.exports = router;

