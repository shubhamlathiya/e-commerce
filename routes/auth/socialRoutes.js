const express = require('express');
const passport = require('passport');
const {generateAccessToken, generateRefreshToken} = require('../../utils/auth/tokenUtil');
const Device = require('../../models/auth/deviceModel');

const router = express.Router();

/**
 * @swagger
 * /api/auth/social/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     description: Redirects the user to Google’s OAuth 2.0 consent screen to authenticate and authorize the application.
 *     tags:
 *       - Social Authentication
 *     responses:
 *       302:
 *         description: Redirects to Google OAuth consent screen for user login.
 */
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

/**
 * @swagger
 * /api/auth/social/google/callback:
 *   get:
 *     summary: Handle Google OAuth callback
 *     description: Handles the callback from Google after user authorization, verifies the Google account, and issues access and refresh tokens.
 *     tags:
 *       - Social Authentication
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         required: true
 *         description: Authorization code returned by Google after successful authentication.
 *     responses:
 *       302:
 *         description: Redirects to frontend with authentication result.
 *         headers:
 *           Location:
 *             description: Frontend redirect URL containing access token or error message.
 *             schema:
 *               type: string
 *               example: https://frontend.example.com/api/auth/success?accessToken=abc123
 *       400:
 *         description: Invalid or missing authorization code.
 *       500:
 *         description: Internal server error during social login process.
 */
router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', async (err, user) => {
        if (err) {
            return res.redirect(`${process.env.FRONTEND_URL}/api/auth/error?message=${encodeURIComponent(err.message)}`);
        }

        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/api/auth/error?message=Authentication failed`);
        }

        try {
            // Create device record
            const deviceInfo = {
                userId: user._id,
                deviceName: req.headers['user-agent'] || 'Unknown Device',
                ip: req.ip,
                userAgent: req.headers['user-agent']
            };

            const device = await Device.create(deviceInfo);

            // Generate tokens
            const accessToken = generateAccessToken(user);
            const refreshToken = await generateRefreshToken(user, device._id);

            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', refreshToken.token, {
                httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', // Less strict for redirects
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Redirect to frontend with access token
            return res.redirect(`${process.env.FRONTEND_URL}/api/auth/success?accessToken=${accessToken}`);
        } catch (error) {
            console.error('Social login error:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/api/auth/error?message=Server error`);
        }
    })(req, res, next);
});

/**
 * @swagger
 * /api/auth/social/facebook:
 *   get:
 *     summary: Initiate Facebook OAuth login
 *     description: Redirects the user to Facebook’s OAuth consent screen to authenticate and authorize the application.
 *     tags:
 *       - Social Authentication
 *     responses:
 *       302:
 *         description: Redirects to Facebook OAuth consent screen for user login.
 */
router.get('/facebook', passport.authenticate('facebook', {
    scope: ['email']
}));


/**
 * @swagger
 * /api/auth/social/facebook/callback:
 *   get:
 *     summary: Facebook OAuth callback
 *     tags: [Social Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: Authorization code from Facebook
 *     responses:
 *       302:
 *         description: Redirects to frontend with tokens
 */
router.get('/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', async (err, user) => {
        // console.log("hy")
        if (err) {
            console.log(err)
            return res.redirect(`${process.env.FRONTEND_URL}/api/auth/error?message=${encodeURIComponent(err.message)}`);
        }

        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/api/auth/error?message=Authentication failed`);
        }

        // console.log("hy")
        try {
            // Create device record
            const deviceInfo = {
                userId: user._id,
                deviceName: req.headers['user-agent'] || 'Unknown Device',
                ip: req.ip,
                userAgent: req.headers['user-agent']
            };

            const device = await Device.create(deviceInfo);

            // Generate tokens
            const accessToken = generateAccessToken(user);
            const refreshToken = await generateRefreshToken(user, device._id);
            console.log("hy 1")
            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', refreshToken.token, {
                httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', // Less strict for redirects
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            console.log("hy 1")
            // Redirect to frontend with access token
            return res.redirect(`${process.env.FRONTEND_URL}/api/auth/success?accessToken=${accessToken}`);
        } catch (error) {
            console.error('Social login error:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/api/auth/error?message=Server error`);
        }
    })(req, res, next);
});

/**
 * @swagger
 * /api/auth/social/apple:
 *   get:
 *     summary: Initiate Apple OAuth login
 *     tags: [Social Authentication]
 *     responses:
 *       302:
 *         description: Redirects to Apple OAuth consent screen
 */
router.get('/apple', passport.authenticate('apple'));

/**
 * @swagger
 * /api/auth/social/apple/callback:
 *   post:
 *     summary: Apple OAuth callback
 *     tags: [Social Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *               user:
 *                 type: string
 *     responses:
 *       302:
 *         description: Redirects to frontend with tokens
 */
router.post('/apple/callback', (req, res, next) => {
    passport.authenticate('apple', async (err, user) => {
        if (err) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(err.message)}`);
        }

        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Authentication failed`);
        }

        try {
            // Create device record
            const deviceInfo = {
                userId: user._id,
                deviceName: req.headers['user-agent'] || 'Unknown Device',
                ip: req.ip,
                userAgent: req.headers['user-agent']
            };

            const device = await Device.create(deviceInfo);

            // Generate tokens
            const accessToken = generateAccessToken(user);
            const refreshToken = await generateRefreshToken(user, device._id);

            // Set refresh token in HTTP-only cookie
            res.cookie('refreshToken', refreshToken.token, {
                httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', // Less strict for redirects
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });

            // Redirect to frontend with access token
            return res.redirect(`${process.env.FRONTEND_URL}/auth/success?accessToken=${accessToken}`);
        } catch (error) {
            console.error('Social login error:', error);
            return res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=Server error`);
        }
    })(req, res, next);
});

module.exports = router;