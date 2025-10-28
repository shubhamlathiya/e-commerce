const User = require('../models/auth/userModel');
const Role = require('../models/auth/roleModel');


/**
 * Get all users (admin only)
 * @route GET /api/admin/users
 */
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.find()
            .select('-passwordHash')
            .skip(skip)
            .limit(limit)
            .sort({createdAt: -1});

        const totalUsers = await User.countDocuments();

        return res.status(200).json({
            success: true,
            users,
            pagination: {
                total: totalUsers,
                page,
                limit,
                pages: Math.ceil(totalUsers / limit)
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching users',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Get user by ID (admin only)
 * @route GET /api/admin/users/:userId
 */
exports.getUserById = async (req, res) => {
    try {
        const {userId} = req.params;

        const user = await User.findById(userId).select('-passwordHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching user',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update user status (admin only)
 * @route PATCH /api/admin/users/:userId/status
 */
exports.updateUserStatus = async (req, res) => {
    try {
        const {userId} = req.params;
        const {status} = req.body;

        if (!['active', 'suspended', 'deleted'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status. Must be active, suspended, or deleted'
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {status},
            {new: true}
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: `User status updated to ${status}`,
            user
        });
    } catch (error) {
        console.error('Update user status error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating user status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Update user roles (admin only)
 * @route PATCH /api/admin/users/:userId/roles
 */
exports.updateUserRoles = async (req, res) => {
    try {
        const {userId} = req.params;
        const {roles} = req.body;

        if (!Array.isArray(roles) || roles.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Roles must be a non-empty array'
            });
        }

        // Verify all roles exist
        const existingRoles = await Role.find({name: {$in: roles}});
        const validRoleNames = existingRoles.map(role => role.name);

        const invalidRoles = roles.filter(role => !validRoleNames.includes(role));
        if (invalidRoles.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid roles: ${invalidRoles.join(', ')}`
            });
        }

        const user = await User.findByIdAndUpdate(
            userId,
            {roles: validRoleNames},
            {new: true}
        ).select('-passwordHash');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User roles updated',
            user
        });
    } catch (error) {
        console.error('Update user roles error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while updating user roles',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};