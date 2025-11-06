const ComboOffer = require('../../models/offersAndDiscounts/comboOfferModel');

/**
 * Create a new combo offer
 */
exports.createCombo = async (req, res) => {
    try {
        const combo = await ComboOffer.create(req.body);
        return res.status(201).json({
            success: true,
            message: 'Combo offer created successfully',
            data: combo
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error creating combo offer',
            error: error.message
        });
    }
};

/**
 * Get list of combo offers (optionally filter by status)
 */
exports.listCombos = async (req, res) => {
    try {
        const {status} = req.query;
        const query = {};

        if (status) query.status = status;

        const combos = await ComboOffer.find(query)
            .sort({createdAt: -1})
            .lean();
        // console.log(combos)
        return res.status(200).json({
            success: true,
            message: 'Combo offers fetched successfully',
            data: combos
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching combo offers',
            error: error.message
        });
    }
};

/**
 * Update a combo offer
 */
exports.updateCombo = async (req, res) => {
    try {
        const {id} = req.params;
        const updatedCombo = await ComboOffer.findByIdAndUpdate(id, req.body, {new: true}).lean();

        if (!updatedCombo) {
            return res.status(404).json({
                success: false,
                message: 'Combo offer not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Combo offer updated successfully',
            data: updatedCombo
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating combo offer',
            error: error.message
        });
    }
};

/**
 * Delete a combo offer
 */
exports.deleteCombo = async (req, res) => {
    try {
        const {id} = req.params;
        const deletedCombo = await ComboOffer.findByIdAndDelete(id).lean();

        if (!deletedCombo) {
            return res.status(404).json({
                success: false,
                message: 'Combo offer not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Combo offer deleted successfully',
            data: {id}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting combo offer',
            error: error.message
        });
    }
};
