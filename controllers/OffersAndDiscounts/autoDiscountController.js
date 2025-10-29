const AutoDiscount = require('../../models/offersAndDiscounts/autoDiscountModel');

// Create new auto discount
exports.createAutoDiscount = async (req, res) => {
    try {
        const newDiscount = await AutoDiscount.create(req.body);
        return res.status(201).json({
            success: true,
            message: 'Auto discount created successfully',
            data: newDiscount
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error creating auto discount',
            error: error.message
        });
    }
};

// List all auto discounts (with optional filters)
exports.listAutoDiscounts = async (req, res) => {
    try {
        const {status, active} = req.query;
        const query = {};

        if (status) query.status = status;

        if (String(active) === 'true') {
            const now = new Date();
            query.$and = [
                {startDate: {$lte: now}},
                {endDate: {$gte: now}},
                {status: 'active'}
            ];
        }

        const discounts = await AutoDiscount.find(query).sort({priority: -1}).lean();

        return res.status(200).json({
            success: true,
            message: 'Auto discounts fetched successfully',
            data: discounts
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching auto discounts',
            error: error.message
        });
    }
};

// Update auto discount
exports.updateAutoDiscount = async (req, res) => {
    try {
        const {id} = req.params;
        const updatedDiscount = await AutoDiscount.findByIdAndUpdate(id, req.body, {new: true}).lean();

        if (!updatedDiscount) {
            return res.status(404).json({
                success: false,
                message: 'Auto discount not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Auto discount updated successfully',
            data: updatedDiscount
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating auto discount',
            error: error.message
        });
    }
};

// Delete auto discount
exports.deleteAutoDiscount = async (req, res) => {
    try {
        const {id} = req.params;
        const deletedDiscount = await AutoDiscount.findByIdAndDelete(id).lean();

        if (!deletedDiscount) {
            return res.status(404).json({
                success: false,
                message: 'Auto discount not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Auto discount deleted successfully',
            data: {id}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting auto discount',
            error: error.message
        });
    }
};
