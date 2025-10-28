const {validationResult} = require('express-validator');
const User = require('../../models/auth/userModel');
const {sendPasswordResetEmail} = require('../../utils/emailUtil');
const {sendPasswordResetSMS} = require('../../utils/smsUtil');
const {hashPassword} = require('../../utils/auth/passwordUtil');
const {generateOTP} = require("../../utils/auth/otpUtils");

// Store reset tokens temporarily (in production, use Redis or similar)
const resetTokenStore = {
    email: {}, // { email: { token, expires } }
    phone: {}  // { phone: { token, expires } }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {type, contact} = req.body;

        if (!type || !contact || !['email', 'phone'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Valid type (email or phone) and contact information are required'
            });
        }

        // Find user
        const query = type === 'email' ? {email: contact} : {phone: contact};
        const user = await User.findOne(query);

        if (!user) {
            // For security reasons, don't reveal that the user doesn't exist
            return res.status(200).json({
                success: true,
                message: `If a user with this ${type} exists, a reset link has been sent`
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(200).json({
                success: true,
                message: `If a user with this ${type} exists, a reset link has been sent`
            });
        }

        // Generate reset token
        const resetToken = generateOTP(6); // 6-digit OTP for password reset
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Reset token expires in 15 minutes

        // Store token
        if (type === 'email') {
            resetTokenStore.email[contact] = {
                token: resetToken,
                expires: expiresAt,
                userId: user._id.toString()
            };

            // Send reset email
            await sendPasswordResetEmail(contact, resetToken);
        } else {
            resetTokenStore.phone[contact] = {
                token: resetToken,
                expires: expiresAt,
                userId: user._id.toString()
            };

            // Send reset SMS
            await sendPasswordResetSMS(contact, resetToken);
        }

        return res.status(200).json({
            success: true,
            message: `Password reset instructions sent to your ${type}`,
            expiresAt
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while processing your request',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 */
exports.resetPassword = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const {type, contact, token, newPassword} = req.body;

        if (!type || !contact || !token || !newPassword || !['email', 'phone'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if token exists and is valid
        const resetData = type === 'email'
            ? resetTokenStore.email[contact]
            : resetTokenStore.phone[contact];

        if (!resetData || resetData.token !== token) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Check if token is expired
        if (new Date() > resetData.expires) {
            // Remove expired token
            if (type === 'email') {
                delete resetTokenStore.email[contact];
            } else {
                delete resetTokenStore.phone[contact];
            }

            return res.status(400).json({
                success: false,
                message: 'Reset token has expired'
            });
        }

        // Get user
        const userId = resetData.userId;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update user password
        user.passwordHash = passwordHash;
        await user.save();

        // Remove token from store
        if (type === 'email') {
            delete resetTokenStore.email[contact];
        } else {
            delete resetTokenStore.phone[contact];
        }

        return res.status(200).json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while resetting your password',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};