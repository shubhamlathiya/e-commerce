const ContactEnquiry = require('../../models/support/contactEnquiryModel');
const SupportTicket = require('../../models/support/supportTicketModel');

function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(200, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    return {page, limit, skip};
}

// Contact enquiries
exports.listEnquiries = async (req, res) => {
    try {
        const {page, limit, skip} = parsePagination(req.query);
        const {status} = req.query;
        const q = {};
        if (status) q.status = status;
        const items = await ContactEnquiry.find(q).sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await ContactEnquiry.countDocuments(q);
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
exports.getEnquiryById = async (req, res) => {
    try {
        const item = await ContactEnquiry.findById(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Enquiry not found'});
        res.json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};
exports.createEnquiry = async (req, res) => {
    try {
        const item = await ContactEnquiry.create(req.body);
        res.status(201).json({success: true, data: item});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
};
exports.updateEnquiry = async (req, res) => {
    try {
        const item = await ContactEnquiry.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!item) return res.status(404).json({success: false, message: 'Enquiry not found'});
        res.json({success: true, data: item});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
};
exports.deleteEnquiry = async (req, res) => {
    try {
        const item = await ContactEnquiry.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Enquiry not found'});
        res.json({success: true, message: 'Deleted'});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

// Support tickets
exports.listTickets = async (req, res) => {
    try {
        const {page, limit, skip} = parsePagination(req.query);
        const {status, priority, userId} = req.query;
        const q = {};
        if (status) q.status = status;
        if (priority) q.priority = priority;
        if (userId) q.userId = userId;
        const items = await SupportTicket.find(q).sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await SupportTicket.countDocuments(q);
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
exports.listMyTickets = async (req, res) => {
    try {
        const {page, limit, skip} = parsePagination(req.query);
        const q = {userId: req.user.id};
        const items = await SupportTicket.find(q).sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await SupportTicket.countDocuments(q);
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
exports.getTicketById = async (req, res) => {
    try {
        const item = await SupportTicket.findById(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Ticket not found'});
        // Owner or admin only
        if (!req.user.roles.includes('admin') && String(item.userId) !== String(req.user.id)) {
            return res.status(403).json({success: false, message: 'Not authorized'});
        }
        res.json({success: true, data: item});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};
exports.createTicket = async (req, res) => {
    try {
        const payload = {...req.body, userId: req.user.id};
        const item = await SupportTicket.create(payload);
        res.status(201).json({success: true, data: item});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
};
exports.updateTicket = async (req, res) => {
    try {
        const item = await SupportTicket.findById(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Ticket not found'});
        // Admin or owner can update
        if (!req.user.roles.includes('admin') && String(item.userId) !== String(req.user.id)) {
            return res.status(403).json({success: false, message: 'Not authorized'});
        }
        const updated = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, {new: true});
        res.json({success: true, data: updated});
    } catch (err) {
        res.status(400).json({success: false, message: err.message});
    }
};
exports.deleteTicket = async (req, res) => {
    try {
        const item = await SupportTicket.findById(req.params.id);
        if (!item) return res.status(404).json({success: false, message: 'Ticket not found'});
        if (!req.user.roles.includes('admin')) {
            return res.status(403).json({success: false, message: 'Admin only'});
        }
        await SupportTicket.findByIdAndDelete(req.params.id);
        res.json({success: true, message: 'Deleted'});
    } catch (err) {
        res.status(500).json({success: false, message: err.message});
    }
};

