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
const pricingRoutes = require('./productPricingAndTaxation/pricingRoutes');
const taxRoutes = require('./productPricingAndTaxation/taxRoutes');
const currencyRoutes = require('./productPricingAndTaxation/currencyRoutes');
const couponRoutes = require('./offersAndDiscounts/couponsRoutes');
const autoDiscountRoutes = require('./offersAndDiscounts/autoDiscountRoutes');
const bogoRoutes = require('./offersAndDiscounts/bogoRoutes');
const flashSaleRoutes = require('./offersAndDiscounts/flashSaleRoutes');
const comboRoutes = require('./offersAndDiscounts/comboRoutes');
const loyaltyRoutes = require('./offersAndDiscounts/loyaltyRoutes');
// Checkout & orders
const cartRoutes = require('./cartManagement/cartRoutes');
const shippingRoutes = require('././shipping/shippingRoutes');
const addressRoutes = require('././shipping/addressRoutes')
const paymentRoutes = require('././payments/paymentRoutes');
const orderRoutes = require('././orders/orderRoutes');
const walletRoutes = require('././payments/walletRoutes');

const marketingRoutes = require('././marketing/marketingRoutes');
const analyticsRoutes = require('././analytics/analyticsRoutes');
const settingsRoutes = require('././settings/settingsRoutes');
const supportRoutes = require('././support/supportRoutes');
const refundRoutes = require('././orders/refundRoutes');
const notificationRoutes = require('././notifications/notificationRoutes');

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

// Pricing & tax
router.use('/api/pricing', pricingRoutes);
router.use('/api/tax', taxRoutes);
router.use('/api/catalog/currency', currencyRoutes);
// Promotions
router.use('/api/promotions/coupons', couponRoutes);
router.use('/api/promotions/auto-discount', autoDiscountRoutes);
router.use('/api/promotions/bogo', bogoRoutes);
router.use('/api/promotions/flash-sales', flashSaleRoutes);
router.use('/api/promotions/combo', comboRoutes);
// Loyalty
router.use('/api/loyalty', loyaltyRoutes);
// Checkout & orders
router.use('/api/cart', cartRoutes);
router.use('/api/shipping', shippingRoutes);
router.use('/api/address', addressRoutes);
router.use('/api/payments', paymentRoutes);
router.use('/api/orders', orderRoutes);
router.use('/api/order', orderRoutes);
router.use('/api/wallet', walletRoutes);

router.use('/api/marketing', marketingRoutes);
router.use('/api/analytics', analyticsRoutes);
router.use('/api/settings', settingsRoutes);
router.use('/api/support', supportRoutes);
router.use('/api/refunds', refundRoutes);
router.use('/api/notifications', notificationRoutes);

// Admin routes
router.use('/api/admin', adminRoutes);

module.exports = router;