const Coupon = require('../../models/offersAndDiscounts/couponModel');

/**
 * Create a new coupon
 */
exports.createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        return res.status(201).json({
            success: true,
            message: 'Coupon created successfully',
            data: coupon
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error creating coupon',
            error: error.message
        });
    }
};

/**
 * Get list of coupons (filter by status or search term)
 */
exports.listCoupons = async (req, res) => {
    try {
        const {status, search} = req.query;
        const query = {};

        if (status) query.status = status;

        if (search) {
            query.$or = [
                {code: new RegExp(search, 'i')},
                {title: new RegExp(search, 'i')}
            ];
        }

        const coupons = await Coupon.find(query)
            .sort({startDate: -1})
            .lean();

        return res.status(200).json({
            success: true,
            message: 'Coupons fetched successfully',
            data: coupons
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching coupons',
            error: error.message
        });
    }
};

/**
 * Update coupon details
 */
exports.updateCoupon = async (req, res) => {
    try {
        const {id} = req.params;
        const updatedCoupon = await Coupon.findByIdAndUpdate(id, req.body, {new: true}).lean();

        if (!updatedCoupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Coupon updated successfully',
            data: updatedCoupon
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating coupon',
            error: error.message
        });
    }
};

/**
 * Delete a coupon
 */
exports.deleteCoupon = async (req, res) => {
    try {
        const {id} = req.params;
        const deletedCoupon = await Coupon.findByIdAndDelete(id).lean();

        if (!deletedCoupon) {
            return res.status(404).json({
                success: false,
                message: 'Coupon not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Coupon deleted successfully',
            data: {id}
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting coupon',
            error: error.message
        });
    }
};
