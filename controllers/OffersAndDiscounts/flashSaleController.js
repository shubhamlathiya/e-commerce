const FlashSale = require('../../models/offersAndDiscounts/flashSaleModel');

/**
 * Create a new flash sale
 */
exports.createFlashSale = async (req, res) => {
    try {
        const flashSale = await FlashSale.create(req.body);
        return res.status(201).json({
            success: true,
            message: 'Flash sale created successfully',
            data: flashSale
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error creating flash sale',
            error: error.message
        });
    }
};

/**
 * Get list of flash sales
 * Filters: status, active
 */
exports.listFlashSales = async (req, res) => {
    try {
        const { status, active } = req.query;
        const query = {};

        if (status) query.status = status;

        if (String(active) === 'true') {
            const now = new Date();
            query.$and = [
                { startDate: { $lte: now } },
                { endDate: { $gte: now } },
                { status: 'running' }
            ];
        }

        const flashSales = await FlashSale.find(query)
            .sort({ startDate: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Flash sales fetched successfully',
            data: flashSales
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching flash sales',
            error: error.message
        });
    }
};

/**
 * Update a flash sale by ID
 */
exports.updateFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedFlashSale = await FlashSale.findByIdAndUpdate(id, req.body, { new: true }).lean();

        if (!updatedFlashSale) {
            return res.status(404).json({
                success: false,
                message: 'Flash sale not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Flash sale updated successfully',
            data: updatedFlashSale
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating flash sale',
            error: error.message
        });
    }
};

/**
 * Delete a flash sale by ID
 */
exports.deleteFlashSale = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedFlashSale = await FlashSale.findByIdAndDelete(id).lean();

        if (!deletedFlashSale) {
            return res.status(404).json({
                success: false,
                message: 'Flash sale not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Flash sale deleted successfully',
            data: { id }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting flash sale',
            error: error.message
        });
    }
};
