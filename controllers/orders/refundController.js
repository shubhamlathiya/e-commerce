const Refund = require('../../models/orders/refundModel');

function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(200, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    return {page, limit, skip};
}

exports.listRefunds = async (req, res) => {
    try {
        const {page, limit, skip} = parsePagination(req.query);
        const {status, mode, userId, orderId, returnId} = req.query;
        const q = {};
        if (status) q.status = status;
        if (mode) q.mode = mode;
        if (userId) q.userId = userId;
        if (orderId) q.orderId = orderId;
        if (returnId) q.returnId = returnId;
        const items = await Refund.find(q).sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await Refund.countDocuments(q);
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

exports.getRefundById = async (req, res) => {
    try {
        const item = await Refund.findById(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Refund not found'});
        res.json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

exports.createRefund = async (req, res) => {
    try {
        const item = await Refund.create(req.body);
        res.status(201).json({success: true, data: item});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
};

exports.updateRefund = async (req, res) => {
    try {
        const item = await Refund.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!item) return res.status(404).json({success: false, message: 'Refund not found'});
        res.json({success: true, data: item});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
};

exports.deleteRefund = async (req, res) => {
    try {
        const item = await Refund.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Refund not found'});
        res.json({success: true, message: 'Deleted'});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

