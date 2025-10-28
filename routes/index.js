const express = require('express');
const router = express.Router();

// Import routes
const authRoutes = require('./auth/authRoutes');
const adminRoutes = require('./admin/adminRoutes');
const passwordRoutes = require('./auth/passwordRoutes');
const twoFARoutes = require('./auth/twoFARoutes');
const socialRoutes = require('./auth/socialRoutes');
const categoryRoutes = require('././productCatalog/categoriesRoutes');
const attributeRoutes = require('././productCatalog/attributesRoutes');
const brandRoutes = require('././productCatalog/brandsRoutes');
const productRoutes = require('././productCatalog/productsRoutes');
const variantRoutes = require('././productCatalog/variantsRoutes');
const galleryRoutes = require('././productCatalog/galleryRoutes');
const stockRoutes = require('././productCatalog/stockRoutes');
const tagRoutes = require('././productCatalog/tagsRoutes');
const seoRoutes = require('././productCatalog/seoRoutes');
const faqRoutes = require('././productCatalog/faqsRoutes');


// Auth routes
router.use('/api/auth', authRoutes);
router.use('/api/auth', passwordRoutes);
router.use('/api/auth/2fa', twoFARoutes);
router.use('/api/auth/social', socialRoutes);

// Catalog routes
router.use('/api/catalog/categories', categoryRoutes);
router.use('/api/catalog/attributes', attributeRoutes);
router.use('/api/catalog/brands', brandRoutes);
router.use('/api/catalog/products', productRoutes);
router.use('/api/catalog/variants', variantRoutes);
router.use('/api/catalog/product-gallery', galleryRoutes);
router.use('/api/catalog/stock', stockRoutes);
router.use('/api/catalog/tags', tagRoutes);
router.use('/api/catalog/seo', seoRoutes);
router.use('/api/catalog/product-faqs', faqRoutes);

// Admin routes
router.use('/api/admin', adminRoutes);

module.exports = router;