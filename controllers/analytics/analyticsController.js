const AnalyticsOrder = require('../../models/analytics/analyticsOrderModel');
const UserAnalytics = require('../../models/analytics/analyticsUserModel');
const AnalyticsProduct = require('../../models/analytics/analyticsProductModel');
const {validationResult} = require('express-validator');

function parsePagination(query) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.max(1, Math.min(200, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;
    return {page, limit, skip};
}

// ---- Orders analytics ----
exports.listOrderAnalytics = async (req, res) => {
    try {
        const {page, limit, skip} = parsePagination(req.query);
        const {from, to} = req.query;
        const filter = {};

        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from);
            if (to) filter.date.$lte = new Date(to);
        }

        const items = await AnalyticsOrder.find(filter).sort({date: -1}).skip(skip).limit(limit);
        const total = await AnalyticsOrder.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'Order analytics fetched successfully',
            pagination: {total, totalPages: Math.ceil(total / limit), currentPage: page},
            data: items,
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

exports.getOrderAnalyticsById = async (req, res) => {
    try {
        const record = await AnalyticsOrder.findById(req.params.id);
        if (!record) {
            return res.status(404).json({success: false, message: 'Record not found'});
        }

        res.status(200).json({
            success: true, message: 'Order analytics record fetched successfully', data: record,
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

exports.createOrderAnalytics = async (req, res) => {
    try {
        const record = await AnalyticsOrder.create(req.body);
        res.status(201).json({
            success: true, message: 'Order analytics created successfully', data: record,
        });
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
};

exports.updateOrderAnalytics = async (req, res) => {
    try {
        const record = await AnalyticsOrder.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!record) {
            return res.status(404).json({success: false, message: 'Record not found'});
        }

        res.status(200).json({
            success: true, message: 'Order analytics updated successfully', data: record,
        });
    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
};

exports.deleteOrderAnalytics = async (req, res) => {
    try {
        const record = await AnalyticsOrder.findByIdAndDelete(req.params.id);
        if (!record) {
            return res.status(404).json({success: false, message: 'Record not found'});
        }

        res.status(200).json({
            success: true, message: 'Order analytics deleted successfully',
        });
    } catch (error) {
        res.status(500).json({success: false, message: error.message});
    }
};

// ---- Users analytics ----
exports.listUserAnalytics = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()});

        const {from, to, page = 1, limit = 10} = req.query;
        const filter = {};

        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from);
            if (to) filter.date.$lte = new Date(to);
        }

        const data = await UserAnalytics.find(filter)
            .sort({date: -1})
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await UserAnalytics.countDocuments(filter);

        res.status(200).json({
            success: true,
            message: 'User analytics fetched successfully',
            data,
            pagination: {total, page: Number(page), limit: Number(limit)},
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
};

exports.getUserAnalyticsById = async (req, res) => {
    try {
        const record = await UserAnalytics.findById(req.params.id);
        if (!record) return res.status(404).json({success: false, message: 'Record not found'});

        res.status(200).json({success: true, message: 'Record fetched successfully', data: record});
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
};

exports.createUserAnalytics = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({errors: errors.array()});

        const record = await UserAnalytics.create(req.body);
        res.status(201).json({success: true, message: 'User analytics created', data: record});
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
};

exports.updateUserAnalytics = async (req, res) => {
    try {
        const record = await UserAnalytics.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!record) return res.status(404).json({success: false, message: 'Record not found'});

        res.status(200).json({success: true, message: 'Record updated successfully', data: record});
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
};

exports.deleteUserAnalytics = async (req, res) => {
    try {
        const record = await UserAnalytics.findByIdAndDelete(req.params.id);
        if (!record) return res.status(404).json({success: false, message: 'Record not found'});

        res.status(200).json({success: true, message: 'Record deleted successfully'});
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
};

// ---- Products analytics ----
// @desc    Get all user analytics with filters & pagination
// @route   GET /api/analytics/users
exports.listUserAnalytics = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({success: false, errors: errors.array()});
        }

        const {from, to, page = 1, limit = 10} = req.query;
        const filter = {};

        if (from || to) {
            filter.date = {};
            if (from) filter.date.$gte = new Date(from);
            if (to) filter.date.$lte = new Date(to);
        }

        const data = await UserAnalytics.find(filter)
            .sort({date: -1})
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await UserAnalytics.countDocuments(filter);

        res.status(200).json({
            success: true, message: 'User analytics retrieved successfully', data, pagination: {
                total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
};

// @desc    Get single user analytics record
// @route   GET /api/analytics/users/:id
exports.getUserAnalyticsById = async (req, res) => {
    try {
        const record = await UserAnalytics.findById(req.params.id);
        if (!record) {
            return res.status(404).json({success: false, message: 'User analytics record not found'});
        }

        res.status(200).json({
            success: true, message: 'User analytics record retrieved successfully', data: record,
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
};

// @desc    Create new user analytics record
// @route   POST /api/analytics/users
exports.createUserAnalytics = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({success: false, errors: errors.array()});
        }

        const record = await UserAnalytics.create(req.body);
        res.status(201).json({
            success: true, message: 'User analytics record created successfully', data: record,
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Failed to create record', error: error.message});
    }
};

// @desc    Update user analytics record
// @route   PUT /api/analytics/users/:id
exports.updateUserAnalytics = async (req, res) => {
    try {
        const record = await UserAnalytics.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!record) {
            return res.status(404).json({success: false, message: 'User analytics record not found'});
        }

        res.status(200).json({
            success: true, message: 'User analytics record updated successfully', data: record,
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Failed to update record', error: error.message});
    }
};

// @desc    Delete user analytics record
// @route   DELETE /api/analytics/users/:id
exports.deleteUserAnalytics = async (req, res) => {
    try {
        const record = await UserAnalytics.findByIdAndDelete(req.params.id);
        if (!record) {
            return res.status(404).json({success: false, message: 'User analytics record not found'});
        }

        res.status(200).json({
            success: true, message: 'User analytics record deleted successfully',
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Failed to delete record', error: error.message});
    }
};


/* ================================
   PRODUCT ANALYTICS CONTROLLERS
================================ */

// @desc    Get all product analytics with pagination and filters
// @route   GET /api/analytics/products
exports.listProductAnalytics = async (req, res) => {
    try {
        const {page, limit, skip} = parsePagination(req.query);
        const {productId} = req.query;
        const filter = {};

        if (productId) filter.productId = productId;

        const data = await AnalyticsProduct.find(filter)
            .sort({totalRevenue: -1})
            .skip(skip)
            .limit(limit);

        const total = await AnalyticsProduct.countDocuments(filter);

        res.status(200).json({
            success: true, message: 'Product analytics retrieved successfully', data, pagination: {
                total, page, limit, totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
};

// @desc    Get single product analytics record
// @route   GET /api/analytics/products/:id
exports.getProductAnalyticsById = async (req, res) => {
    try {
        const record = await AnalyticsProduct.findById(req.params.id);
        if (!record) {
            return res.status(404).json({success: false, message: 'Product analytics record not found'});
        }

        res.status(200).json({
            success: true, message: 'Product analytics record retrieved successfully', data: record,
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Server error', error: error.message});
    }
};

// @desc    Create new product analytics record
// @route   POST /api/analytics/products
exports.createProductAnalytics = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({success: false, errors: errors.array()});
        }

        const record = await AnalyticsProduct.create(req.body);
        res.status(201).json({
            success: true, message: 'Product analytics record created successfully', data: record,
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Failed to create record', error: error.message});
    }
};

// @desc    Update product analytics record
// @route   PUT /api/analytics/products/:id
exports.updateProductAnalytics = async (req, res) => {
    try {
        const record = await AnalyticsProduct.findByIdAndUpdate(req.params.id, req.body, {new: true});
        if (!record) {
            return res.status(404).json({success: false, message: 'Product analytics record not found'});
        }

        res.status(200).json({
            success: true, message: 'Product analytics record updated successfully', data: record,
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Failed to update record', error: error.message});
    }
};

// @desc    Delete product analytics record
// @route   DELETE /api/analytics/products/:id
exports.deleteProductAnalytics = async (req, res) => {
    try {
        const record = await AnalyticsProduct.findByIdAndDelete(req.params.id);
        if (!record) {
            return res.status(404).json({success: false, message: 'Product analytics record not found'});
        }

        res.status(200).json({
            success: true, message: 'Product analytics record deleted successfully',
        });
    } catch (error) {
        res.status(500).json({success: false, message: 'Failed to delete record', error: error.message});
    }
};