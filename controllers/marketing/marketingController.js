const MarketingNotification = require('../../models/marketing/marketingNotificationModel');
const EmailCampaign = require('../../models/marketing/emailCampaignModel');
const AbandonedCart = require('../../models/marketing/abandonedCartModel');

function parsePageLimit(query) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(100, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    return {page, limit, skip};
}

// Notifications CRUD (admin)
exports.listNotifications = async (req, res) => {
    try {
        const {page, limit, skip} = parsePageLimit(req.query);
        const {status, type, userId} = req.query;
        const query = {};
        if (status) query.status = status;
        if (type) query.type = type;
        if (userId) query.userId = userId;
        const items = await MarketingNotification.find(query).sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await MarketingNotification.countDocuments(query);
        res.json({
            success: true,
            count: items.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: items
        });
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.getNotificationById = async (req, res) => {
    try {
        const item = await MarketingNotification.findById(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Notification not found'});
        res.json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.createNotification = async (req, res) => {
    try {
        const item = await MarketingNotification.create(req.body);
        res.status(201).json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.updateNotification = async (req, res) => {
    try {
        const item = await MarketingNotification.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!item) return res.status(404).json({success: false, message: 'Notification not found'});
        res.json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const item = await MarketingNotification.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Notification not found'});
        res.json({success: true, message: 'Deleted'});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

// Email Campaigns CRUD (admin)
exports.listCampaigns = async (req, res) => {
    try {
        const {page, limit, skip} = parsePageLimit(req.query);
        const {status} = req.query;
        const query = {};
        if (status) query.status = status;
        const items = await EmailCampaign.find(query).sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await EmailCampaign.countDocuments(query);
        res.json({
            success: true,
            count: items.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: items
        });
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.getCampaignById = async (req, res) => {
    try {
        const item = await EmailCampaign.findById(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Campaign not found'});
        res.json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.createCampaign = async (req, res) => {
    try {
        const item = await EmailCampaign.create(req.body);
        res.status(201).json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.updateCampaign = async (req, res) => {
    try {
        const item = await EmailCampaign.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!item) return res.status(404).json({success: false, message: 'Campaign not found'});
        res.json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.deleteCampaign = async (req, res) => {
    try {
        const item = await EmailCampaign.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Campaign not found'});
        res.json({success: true, message: 'Deleted'});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

// Abandoned Carts CRUD (admin)
exports.listAbandonedCarts = async (req, res) => {
    try {
        const {page, limit, skip} = parsePageLimit(req.query);
        const {notified} = req.query;
        const query = {};
        if (typeof notified !== 'undefined') query.notified = notified === 'true';
        const items = await AbandonedCart.find(query).sort({lastUpdated: -1}).skip(skip).limit(limit);
        const total = await AbandonedCart.countDocuments(query);
        res.json({
            success: true,
            count: items.length,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            data: items
        });
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.getAbandonedCartById = async (req, res) => {
    try {
        const item = await AbandonedCart.findById(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Abandoned cart not found'});
        res.json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.createAbandonedCart = async (req, res) => {
    try {
        const item = await AbandonedCart.create(req.body);
        res.status(201).json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.updateAbandonedCart = async (req, res) => {
    try {
        const item = await AbandonedCart.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!item) return res.status(404).json({success: false, message: 'Abandoned cart not found'});
        res.json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.deleteAbandonedCart = async (req, res) => {
    try {
        const item = await AbandonedCart.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Abandoned cart not found'});
        res.json({success: true, message: 'Deleted'});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

