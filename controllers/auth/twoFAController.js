const {validationResult} = require('express-validator');
const User = require('../../models/auth/userModel');
const {sendVerificationEmail} = require('../../utils/emailUtil');
const {sendVerificationSMS} = require('../../utils/smsUtil');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const {generateOTP} = require("../../utils/auth/otpUtils");
const {generateAccessToken, generateRefreshToken} = require("../../utils/auth/tokenUtil");
const Device = require("../../models/auth/deviceModel");
const {otpStore} = require("../../utils/auth/otpStore");


/**
 * Enable 2FA for a user
 * @route POST /api/auth/2fa/enable
 */
exports.enable2FA = async (req, res) => {
    try {
        console.log(req.headers);
        const userId = req.user.id;
        console.log(userId)
        const {method} = req.body;

        if (!['email', 'phone', 'app'].includes(method)) {
            return res.status(400).json({
                success: false, message: 'Invalid 2FA method. Choose email, phone, or app'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false, message: 'User not found'
            });
        }

        // Initialize or update user's 2FA settings
        if (!user.profile) {
            user.profile = {};
        }

        if (!user.profile.twoFactorAuth) {
            user.profile.twoFactorAuth = {
                enabled: false, method: null, secret: null, backupCodes: []
            };
        }

        // Handle different 2FA methods
        if (method === 'app') {
            // Generate secret for authenticator app
            const secret = speakeasy.generateSecret({
                name: `RealTimeApp:${user.email || user.phone}`
            });

            // Store secret temporarily until verified
            user.profile.twoFactorAuth.tempSecret = secret.base32;

            // Generate QR code
            const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

            await user.save();

            return res.status(200).json({
                success: true, message: 'Authenticator app setup initiated', data: {
                    secret: secret.base32, qrCode: qrCodeUrl
                }
            });
        } else if (method === 'email') {
            // Verify email exists and is verified
            if (!user.email || !user.emailVerified) {
                return res.status(400).json({
                    success: false, message: 'Verified email required for email-based 2FA'
                });
            }

            // Generate and send OTP
            const otp = generateOTP(6);
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            otpStore.email[userId] = {
                otp, expires: expiresAt
            };

            await sendVerificationEmail(user.email, otp, '2FA Setup');

            return res.status(200).json({
                success: true, message: 'Verification code sent to your email', expiresAt
            });
        } else if (method === 'phone') {
            // Verify phone exists and is verified
            if (!user.phone || !user.phoneVerified) {
                return res.status(400).json({
                    success: false, message: 'Verified phone required for SMS-based 2FA'
                });
            }

            // Generate and send OTP
            const otp = generateOTP(6);
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            otpStore.phone[userId] = {
                otp, expires: expiresAt
            };

            await sendVerificationSMS(user.phone, otp, '2FA Setup');

            return res.status(200).json({
                success: true, message: 'Verification code sent to your phone', expiresAt
            });
        }
    } catch (error) {
        console.error('Enable 2FA error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while setting up 2FA',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify and complete 2FA setup
 * @route POST /api/auth/2fa/verify
 */
exports.verify2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const {method, token} = req.body;

        if (!['email', 'phone', 'app'].includes(method) || !token) {
            return res.status(400).json({
                success: false, message: 'Valid method and verification token required'
            });
        }

        const user = await User.findById(userId);
        console.log(user)
        if (!user || !user.profile || !user.profile.twoFactorAuth) {
            return res.status(404).json({
                success: false, message: 'User or 2FA setup not found'
            });
        }

        let verified = false;

        // Verify based on method
        if (method === 'app') {
            // Verify token against temporary secret
            const tempSecret = user.profile.twoFactorAuth.tempSecret;
            if (!tempSecret) {
                return res.status(400).json({
                    success: false, message: '2FA setup not initiated'
                });
            }

            verified = speakeasy.totp.verify({
                secret: tempSecret, encoding: 'base32', token: token
            });

            if (verified) {
                // Move from temporary to permanent secret
                user.profile.twoFactorAuth.secret = tempSecret;
                user.profile.twoFactorAuth.tempSecret = undefined;
            }
        } else if (method === 'email') {
            // Verify email OTP
            const otpData = otpStore.email[userId];
            if (!otpData || otpData.otp !== token) {
                return res.status(400).json({
                    success: false, message: 'Invalid verification code'
                });
            }

            // Check if expired
            if (new Date() > otpData.expires) {
                delete otpStore.email[userId];
                return res.status(400).json({
                    success: false, message: 'Verification code expired'
                });
            }

            verified = true;
            delete otpStore.email[userId];
        } else if (method === 'phone') {
            // Verify phone OTP
            const otpData = otpStore.phone[userId];
            if (!otpData || otpData.otp !== token) {
                return res.status(400).json({
                    success: false, message: 'Invalid verification code'
                });
            }

            // Check if expired
            if (new Date() > otpData.expires) {
                delete otpStore.phone[userId];
                return res.status(400).json({
                    success: false, message: 'Verification code expired'
                });
            }

            verified = true;
            delete otpStore.phone[userId];
        }

        if (!verified) {
            return res.status(400).json({
                success: false, message: 'Verification failed'
            });
        }

        // Generate backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            backupCodes.push(Math.random().toString(36).substring(2, 10).toUpperCase());
        }

        // Update user 2FA settings
        user.profile.twoFactorAuth.enabled = true;
        user.profile.twoFactorAuth.method = method;
        user.profile.twoFactorAuth.backupCodes = backupCodes;
        user.profile.twoFactorAuth.updatedAt = new Date();

        await user.save();

        return res.status(200).json({
            success: true, message: '2FA enabled successfully', data: {
                method, backupCodes
            }
        });
    } catch (error) {
        console.error('Verify 2FA error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while verifying 2FA',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Disable 2FA for a user
 * @route POST /api/auth/2fa/disable
 */
exports.disable2FA = async (req, res) => {
    try {
        const userId = req.user.id;
        const {password} = req.body;
        console.log(req.body.password)
        console.log(password)
        // For security, require password to disable 2FA
        if (!password) {
            return res.status(400).json({
                success: false, message: 'Password required to disable 2FA'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false, message: 'User not found'
            });
        }

        // Verify password (this should use your password verification utility)
        const isPasswordValid = await require('../../utils/auth/passwordUtil').verifyPassword(user.passwordHash,password );
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false, message: 'Invalid password'
            });
        }

        // Check if 2FA is enabled
        if (!user.profile?.twoFactorAuth?.enabled) {
            return res.status(400).json({
                success: false, message: '2FA is not enabled'
            });
        }

        // Disable 2FA
        user.profile.twoFactorAuth = {
            enabled: false, method: null, secret: null, backupCodes: []
        };

        await user.save();

        return res.status(200).json({
            success: true, message: '2FA disabled successfully'
        });
    } catch (error) {
        console.error('Disable 2FA error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while disabling 2FA',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify 2FA during login
 * @route POST /api/auth/2fa/authenticate
 */
exports.authenticate2FA = async (req, res) => {
    try {
        const { userId, token, method } = req.body;

        if (!userId || !token || !method) {
            return res.status(400).json({
                success: false,
                message: 'User ID, token, and method are required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const twoFA = user.profile?.twoFactorAuth;
        if (!twoFA?.enabled) {
            return res.status(400).json({
                success: false,
                message: '2FA is not enabled for this user'
            });
        }

        // Verify the code
        let verified = false;

        if (method === 'app') {
            verified = speakeasy.totp.verify({
                secret: twoFA.secret,
                encoding: 'base32',
                token,
                window: 1
            });
        } else if (method === 'email' || method === 'phone') {
            const otpData = otpStore[method]?.[userId];
            console.log(otpStore)
            if (otpData && otpData.otp === token && new Date() <= otpData.expires) {
                verified = true;
                delete otpStore[method][userId];
            }
        } else if (method === 'backup') {
            const backupCodes = twoFA.backupCodes || [];
            const codeIndex = backupCodes.indexOf(token);
            if (codeIndex !== -1) {
                verified = true;
                backupCodes.splice(codeIndex, 1);
                user.profile.twoFactorAuth.backupCodes = backupCodes;
                await user.save();
            }
        }

        if (!verified) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired verification code'
            });
        }

        // Generate tokens after successful 2FA
        const device = await Device.create({
            userId: user._id,
            deviceName: req.headers['user-agent'] || 'Unknown Device',
            ip: req.ip,
            userAgent: req.headers['user-agent']
        });

        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user, device._id);

        res.cookie('refreshToken', refreshToken.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful (2FA verified)',
            user: {
                id: user._id,
                email: user.email,
                phone: user.phone,
                name: user.name,
                roles: user.roles
            },
            accessToken,
            refreshToken: refreshToken.token,
            expiresAt: refreshToken.expiresAt
        });
    } catch (error) {
        console.error('2FA authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during 2FA verification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// Get current 2FA status for authenticated user
exports.get2FAStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        const twoFA = user.profile?.twoFactorAuth || {};
        return res.status(200).json({
            success: true,
            data: {
                enabled: !!twoFA.enabled,
                method: twoFA.method || null,
            },
        });
    } catch (error) {
        console.error('Get 2FA status error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while fetching 2FA status',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};
