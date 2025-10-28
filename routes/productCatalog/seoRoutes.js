const express = require('express');
const router = express.Router();
const {body, param} = require('express-validator');
const {authenticateJWT, isAdmin} = require('../../middleware/authMiddleware');
const productSeoController = require('../../controllers/productCatalog/productSeoController');
const validate = require('../../utils/productCatalog/validate');

/**
 * @swagger
 * tags:
 *   - name: Catalog - Product SEO
 *     description: Manage SEO metadata for individual products
 */


/**
 * @swagger
 * /api/catalog/seo/{productId}:
 *   get:
 *     summary: Get SEO metadata for a product
 *     tags: [Catalog - Product SEO]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to retrieve SEO details for
 *     responses:
 *       200:
 *         description: SEO details retrieved successfully
 *       400:
 *         description: Invalid product ID
 *       404:
 *         description: SEO details not found
 *       500:
 *         description: Server error
 */
router.get('/:productId', [param('productId').isMongoId()], validate, productSeoController.getSeo);


/**
 * @swagger
 * /api/catalog/seo/{productId}:
 *   put:
 *     summary: Create or update SEO metadata for a product (Admin only)
 *     tags: [Catalog - Product SEO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to associate SEO metadata with
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               metaTitle:
 *                 type: string
 *                 description: SEO title for the product
 *               metaDescription:
 *                 type: string
 *                 description: SEO description for the product
 *               keywords:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of SEO keywords
 *               slug:
 *                 type: string
 *                 description: Custom product slug for SEO
 *               canonicalUrl:
 *                 type: string
 *                 description: Canonical URL for the product
 *           example:
 *             metaTitle: "Wireless Noise Cancelling Headphones – Premium Sound"
 *             metaDescription: "Experience crystal-clear audio and deep bass with our wireless noise cancelling headphones. Perfect for work, travel, and everyday use."
 *             keywords:
 *               - "wireless headphones"
 *               - "noise cancelling"
 *               - "Bluetooth audio"
 *               - "over-ear headset"
 *             slug: "wireless-noise-cancelling-headphones"
 *             canonicalUrl: "https://example.com/products/wireless-noise-cancelling-headphones"
 *     responses:
 *       200:
 *         description: SEO metadata upserted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.put(
    '/:productId',
    authenticateJWT,
    isAdmin,
    [
        param('productId').isMongoId(),
        body('metaTitle').optional().isString(),
        body('metaDescription').optional().isString(),
        body('keywords').optional().isArray(),
        body('slug').optional().isString(),
        body('canonicalUrl').optional().isString(),
    ],
    validate,
    productSeoController.upsertSeo
);


/**
 * @swagger
 * /api/catalog/seo/{productId}:
 *   delete:
 *     summary: Delete SEO metadata for a product (Admin only)
 *     tags: [Catalog - Product SEO]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID to delete SEO metadata for
 *     responses:
 *       200:
 *         description: SEO metadata deleted successfully
 *       400:
 *         description: Invalid product ID
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: SEO record not found
 *       500:
 *         description: Server error
 */
router.delete('/:productId', authenticateJWT, isAdmin, [param('productId').isMongoId()], validate, productSeoController.deleteSeo);

module.exports = router;

