const BuyXGetY = require('../../models/offersAndDiscounts/buyXGetYModel');

// Create a new Buy X Get Y (BOGO) rule
exports.createBogo = async (req, res) => {
    try {
        const newBogo = await BuyXGetY.create(req.body);
        return res.status(201).json({
            success: true,
            message: 'BOGO rule created successfully',
            data: newBogo
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error creating BOGO rule',
            error: error.message
        });
    }
};

// List all BOGO rules (with optional filters)
exports.listBogo = async (req, res) => {
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

        const rules = await BuyXGetY.find(query).sort({startDate: -1}).lean();
        console.log(rules)
        return res.status(200).json({
            success: true,
            message: 'BOGO rules fetched successfully',
            data: rules
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching BOGO rules',
            error: error.message
        });
    }
};

// Update a BOGO rule
exports.updateBogo = async (req, res) => {
    try {
        const {id} = req.params;
        const updatedBogo = await BuyXGetY.findByIdAndUpdate(id, req.body, {new: true}).lean();

        if (!updatedBogo) {
            return res.status(404).json({
                success: false,
                message: 'BOGO rule not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'BOGO rule updated successfully',
            data: updatedBogo
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating BOGO rule',
            error: error.message
        });
    }
};

// Delete a BOGO rule
exports.deleteBogo = async (req, res) => {
    try {
        const {id} = req.params;
        const deletedBogo = await BuyXGetY.findByIdAndDelete(id).lean();

        if (!deletedBogo) {
            return res.status(404).json({
                success: false,
                message: 'BOGO rule not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'BOGO rule deleted successfully',
            data: {id}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting BOGO rule',
            error: error.message
        });
    }
};
