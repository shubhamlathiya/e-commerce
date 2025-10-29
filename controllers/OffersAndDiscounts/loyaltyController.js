const LoyaltyReward = require('../../models/offersAndDiscounts/loyaltyRewardModel');

/**
 * Get loyalty reward details for a specific user
 */
exports.getReward = async (req, res) => {
    try {
        const {userId} = req.params;
        const reward = await LoyaltyReward.findOne({userId}).lean();

        if (!reward) {
            return res.status(404).json({
                success: false,
                message: 'Loyalty reward account not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Loyalty reward fetched successfully',
            data: reward
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error fetching loyalty reward',
            error: error.message
        });
    }
};

/**
 * Create or update (upsert) loyalty reward points for a user
 */
exports.upsertReward = async (req, res) => {
    try {
        const {userId} = req.params;
        const {points = 0} = req.body;

        const reward = await LoyaltyReward.findOneAndUpdate(
            {userId},
            {$set: {userId, points}},
            {upsert: true, new: true, lean: true}
        );

        return res.status(200).json({
            success: true,
            message: 'Loyalty reward updated successfully',
            data: reward
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating loyalty reward',
            error: error.message
        });
    }
};

/**
 * Add history record for earning or redeeming points
 */
exports.addHistory = async (req, res) => {
    try {
        const {userId} = req.params;
        const {type, points, orderId, date} = req.body;

        const reward = await LoyaltyReward.findOne({userId});
        if (!reward) {
            return res.status(404).json({
                success: false,
                message: 'Loyalty reward account not found'
            });
        }

        reward.history.push({type, points, orderId, date});

        if (type === 'earn') {
            reward.points += points;
            reward.totalEarned += points;
        } else if (type === 'redeem') {
            reward.points = Math.max(0, reward.points - points);
            reward.totalRedeemed += points;
        }

        await reward.save();

        return res.status(200).json({
            success: true,
            message: 'Loyalty reward history updated successfully',
            data: reward.toObject()
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating loyalty reward history',
            error: error.message
        });
    }
};
