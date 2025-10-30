const BusinessSettings = require('../../models/settings/businessSettingsModel');
const SeoManager = require('../../models/settings/seoManagerModel');
const EmailSmsTemplate = require('../../models/settings/emailSmsTemplateModel');
const PaymentGatewayConfig = require('../../models/settings/paymentGatewayConfigModel');
const MobileAppConfig = require('../../models/settings/mobileAppConfigModel');

function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(200, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
}

// Business settings
exports.listBusinessSettings = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const items = await BusinessSettings.find({}).sort({ updatedAt: -1 }).skip(skip).limit(limit);
        const total = await BusinessSettings.countDocuments({});
        res.json({ success: true, count: items.length, total, totalPages: Math.ceil(total / limit), currentPage: page, data: items });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getBusinessSettingsById = async (req, res) => {
    try {
        const item = await BusinessSettings.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Business settings not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createBusinessSettings = async (req, res) => {
    try {
        const item = await BusinessSettings.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updateBusinessSettings = async (req, res) => {
    try {
        const item = await BusinessSettings.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ success: false, message: 'Business settings not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deleteBusinessSettings = async (req, res) => {
    try {
        const item = await BusinessSettings.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Business settings not found' });
        res.json({ success: true, message: 'Deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// SEO Manager (page-level)
exports.listSeoPages = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const { page: pageName } = req.query;
        const q = {};
        if (pageName) q.page = pageName;
        const items = await SeoManager.find(q).sort({ updatedAt: -1 }).skip(skip).limit(limit);
        const total = await SeoManager.countDocuments(q);
        res.json({ success: true, count: items.length, total, totalPages: Math.ceil(total / limit), currentPage: page, data: items });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getSeoPageById = async (req, res) => {
    try {
        const item = await SeoManager.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'SEO page not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createSeoPage = async (req, res) => {
    try {
        const item = await SeoManager.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updateSeoPage = async (req, res) => {
    try {
        const item = await SeoManager.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ success: false, message: 'SEO page not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deleteSeoPage = async (req, res) => {
    try {
        const item = await SeoManager.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'SEO page not found' });
        res.json({ success: true, message: 'Deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Email/SMS Templates
exports.listTemplates = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const { channel, type } = req.query;
        const q = {};
        if (channel) q.channel = channel;
        if (type) q.type = type;
        const items = await EmailSmsTemplate.find(q).sort({ updatedAt: -1 }).skip(skip).limit(limit);
        const total = await EmailSmsTemplate.countDocuments(q);
        res.json({ success: true, count: items.length, total, totalPages: Math.ceil(total / limit), currentPage: page, data: items });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getTemplateById = async (req, res) => {
    try {
        const item = await EmailSmsTemplate.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Template not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createTemplate = async (req, res) => {
    try {
        const item = await EmailSmsTemplate.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updateTemplate = async (req, res) => {
    try {
        const item = await EmailSmsTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ success: false, message: 'Template not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deleteTemplate = async (req, res) => {
    try {
        const item = await EmailSmsTemplate.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Template not found' });
        res.json({ success: true, message: 'Deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Payment gateway config
exports.listPaymentConfigs = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const { name, status } = req.query;
        const q = {};
        if (name) q.name = name;
        if (typeof status !== 'undefined') q.status = String(status) === 'true';
        const items = await PaymentGatewayConfig.find(q).sort({ updatedAt: -1 }).skip(skip).limit(limit);
        const total = await PaymentGatewayConfig.countDocuments(q);
        res.json({ success: true, count: items.length, total, totalPages: Math.ceil(total / limit), currentPage: page, data: items });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getPaymentConfigById = async (req, res) => {
    try {
        const item = await PaymentGatewayConfig.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Config not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createPaymentConfig = async (req, res) => {
    try {
        const item = await PaymentGatewayConfig.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updatePaymentConfig = async (req, res) => {
    try {
        const item = await PaymentGatewayConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ success: false, message: 'Config not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deletePaymentConfig = async (req, res) => {
    try {
        const item = await PaymentGatewayConfig.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Config not found' });
        res.json({ success: true, message: 'Deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

// Mobile app config
exports.listMobileConfigs = async (req, res) => {
    try {
        const { page, limit, skip } = parsePagination(req.query);
        const items = await MobileAppConfig.find({}).sort({ updatedAt: -1 }).skip(skip).limit(limit);
        const total = await MobileAppConfig.countDocuments({});
        res.json({ success: true, count: items.length, total, totalPages: Math.ceil(total / limit), currentPage: page, data: items });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.getMobileConfigById = async (req, res) => {
    try {
        const item = await MobileAppConfig.findById(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Mobile app config not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};
exports.createMobileConfig = async (req, res) => {
    try {
        const item = await MobileAppConfig.create(req.body);
        res.status(201).json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.updateMobileConfig = async (req, res) => {
    try {
        const item = await MobileAppConfig.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item) return res.status(404).json({ success: false, message: 'Mobile app config not found' });
        res.json({ success: true, data: item });
    } catch (err) { res.status(400).json({ success: false, message: err.message }); }
};
exports.deleteMobileConfig = async (req, res) => {
    try {
        const item = await MobileAppConfig.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ success: false, message: 'Mobile app config not found' });
        res.json({ success: true, message: 'Deleted' });
    } catch (err) { res.status(500).json({ success: false, message: err.message }); }
};

