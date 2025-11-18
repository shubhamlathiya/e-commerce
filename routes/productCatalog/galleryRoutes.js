const express = require('express');
const router = express.Router();
const {body, param} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const productGalleryController = require('../../controllers/productCatalog/productGalleryController');
const validate = require('../../utils/productCatalog/validate');
const {combinedImageUpload} = require("../../utils/upload");

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
 *   post:
 *     summary: Add images to product gallery (Admin only)
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - images
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Gallery images to upload
 *     responses:
 *       200:
 *         description: Images added to gallery successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.post(
    '/:productId',
    authenticateJWT,
    isAdmin,
    combinedImageUpload("products"),
    [
        param('productId').isMongoId(),
        body('altTexts').optional().isArray(),
        body('altTexts.*').optional().isString().isLength({ max: 255 })
    ],
    validate,
    productGalleryController.addGalleryImages
);

/**
 * @swagger
 * /api/catalog/product-gallery/{productId}:
 *   put:
 *     summary: Replace all gallery images (Admin only)
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: New gallery images (replaces all existing)
 *     responses:
 *       200:
 *         description: Gallery images replaced successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product not found
 *       500:
 *         description: Server error
 */
router.put(
    '/:productId',
    authenticateJWT,
    isAdmin,
    combinedImageUpload("products"),
    [
        param('productId').isMongoId()
    ],
    validate,
    productGalleryController.replaceGallery
);

/**
 * @swagger
 * /api/catalog/product-gallery/{productId}/images/{imageIndex}:
 *   delete:
 *     summary: Remove specific image from gallery (Admin only)
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
 *       - in: path
 *         name: imageIndex
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Index of the image to remove
 *     responses:
 *       200:
 *         description: Image removed successfully
 *       400:
 *         description: Invalid image index
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Product or image not found
 *       500:
 *         description: Server error
 */
router.delete(
    '/:productId/images/:imageIndex',
    authenticateJWT,
    isAdmin,
    [
        param('productId').isMongoId(),
        param('imageIndex').isInt({ min: 0 })
    ],
    validate,
    productGalleryController.removeGalleryImage
);

/**
 * @swagger
 * /api/catalog/product-gallery/{productId}:
 *   delete:
 *     summary: Delete entire product gallery (Admin only)
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
router.delete(
    '/:productId',
    authenticateJWT,
    isAdmin,
    [param('productId').isMongoId()],
    validate,
    productGalleryController.deleteGallery
);

module.exports = router;