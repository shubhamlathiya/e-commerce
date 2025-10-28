const express = require('express');
const {body} = require('express-validator');
const passwordController = require('../../controllers/auth/passwordController');

const router = express.Router();

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Sends a password reset OTP or link to the user's registered email or phone based on the provided type.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - contact
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, phone]
 *                 example: email
 *                 description: Specifies whether to send the reset instructions via email or SMS.
 *               contact:
 *                 type: string
 *                 example: johndoe@example.com
 *                 description: The user's registered email address or phone number.
 *     responses:
 *       200:
 *         description: Password reset instructions sent successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset instructions sent successfully.
 *       400:
 *         description: Invalid input data or unsupported type.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid input data.
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Something went wrong on the server.
 */
router.post('/forgot-password', [body('type').isIn(['email', 'phone']).withMessage('Type must be either email or phone'), body('contact').notEmpty().withMessage('Contact information is required')
    .custom((value, {req}) => {
        if (req.body.type === 'email') {
            if (!value.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
                throw new Error('Invalid email format');
            }
        } else if (req.body.type === 'phone') {
            // Basic phone validation - can be enhanced
            if (!value.match(/^\+?[0-9]{10,15}$/)) {
                throw new Error('Invalid phone format');
            }
        }
        return true;
    })], passwordController.forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     description: Allows a user to reset their password using a valid token sent to their email or phone.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - contact
 *               - token
 *               - newPassword
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, phone]
 *                 example: email
 *                 description: Method used for verification (email or phone).
 *               contact:
 *                 type: string
 *                 example: johndoe@example.com
 *                 description: The user's registered email address or phone number.
 *               token:
 *                 type: string
 *                 example: "654321"
 *                 description: The password reset token received via email or SMS.
 *               newPassword:
 *                 type: string
 *                 format: password
 *                 example: "NewStrongPassword123!"
 *                 description: The new password to set for the account.
 *     responses:
 *       200:
 *         description: Password reset successful.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Password reset successful.
 *       400:
 *         description: Invalid input data or expired/incorrect token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Invalid or expired token.
 *       404:
 *         description: User not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: User not found.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: Something went wrong on the server.
 */
router.post('/reset-password', [body('type').isIn(['email', 'phone']).withMessage('Type must be either email or phone'), body('contact').notEmpty().withMessage('Contact information is required'), body('token').notEmpty().withMessage('Reset token is required'), body('newPassword')
    .isLength({min: 8}).withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character')], passwordController.resetPassword);

module.exports = router;