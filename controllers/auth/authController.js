const {validationResult} = require('express-validator');
const User = require('../../models/auth/userModel');
const Role = require('../../models/auth/roleModel');
const Device = require('../../models/auth/deviceModel');
const {hashPassword, verifyPassword} = require('../../utils/auth/passwordUtil');
const {sendVerificationEmail, send2FAEmail} = require('../../utils/emailUtil');
const {sendVerificationSMS, isValidPhoneNumber, send2FASMS} = require('../../utils/smsUtil');
const {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    rotateRefreshToken,
    revokeRefreshToken
} = require('../../utils/auth/tokenUtil');
const {generateOTP} = require("../../utils/auth/otpUtils");
const {otpStore} = require("../../utils/auth/otpStore");


/**
 * Register a new user
 * @route POST /api/auth/register
 */
exports.register = async (req, res) => {
    try {
        // Validate request
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }
        const {email, phone, password, name} = req.body;

        // Ensure at least email or phone is provided
        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Either email or phone is required'
            });
        }

        let existingUser = null;

        if (email && phone) {
            existingUser = await User.findOne({ $or: [{ email }, { phone }] });
        } else if (email) {
            existingUser = await User.findOne({ email });
        } else if (phone) {
            existingUser = await User.findOne({ phone });
        }

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or phone already exists'
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Get default user role
        let userRole = await Role.findOne({name: 'user'});
        if (!userRole) {
            // Create default user role if it doesn't exist
            userRole = await Role.create({
                name: 'user',
                displayName: 'User',
                description: 'Regular user with standard privileges'
            });
        }

        // Create user
        const user = await User.create({
            email,
            phone,
            passwordHash,
            name,
            roles: [userRole.name],
            status: 'active',
            emailVerified: false,
            phoneVerified: false
        });

        // Generate and send verification OTP
        if (email) {
            const otp = generateOTP();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

            otpStore.email[email] = {
                otp,
                expires: expiresAt
            };

            sendVerificationEmail(email, otp);
        } else {
            if (phone && isValidPhoneNumber(phone)) {
                const otp = generateOTP();
                const expiresAt = new Date();
                expiresAt.setMinutes(expiresAt.getMinutes() + 10);

                otpStore.phone[phone] = {
                    otp,
                    expires: expiresAt
                };

                sendVerificationSMS(phone, otp);
            }
        }

        // Return success response
        return res.status(201).json({
            success: true,
            message: 'User registered successfully. Verification required.',
            userId: user._id,
            requiresEmailVerification: !!email,
            requiresPhoneVerification: !!(phone && isValidPhoneNumber(phone))
        });
    } catch (error) {
        console.error('Registration error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify email with OTP
 * @route POST /api/auth/verify-email
 */
exports.verifyEmail = async (req, res) => {
    try {
        const {email, otp} = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and OTP are required'
            });
        }

        // Check if OTP exists and is valid
        const storedOTP = otpStore.email[email];
        if (!storedOTP || storedOTP.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check if OTP is expired
        if (new Date() > storedOTP.expires) {
            // Remove expired OTP
            delete otpStore.email[email];

            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Update user
        const user = await User.findOneAndUpdate(
            {email},
            {emailVerified: true},
            {new: true}
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove OTP from store
        delete otpStore.email[email];

        // Generate tokens if both email and phone are verified (if applicable)
        let tokens = null;
        if (
            (user.email && user.emailVerified) &&
            (!user.phone || user.phoneVerified)
        ) {
            const accessToken = generateAccessToken(user);
            const refreshToken = await generateRefreshToken(user);

            tokens = {
                accessToken,
                refreshToken: refreshToken.token,
                expiresAt: refreshToken.expiresAt
            };
        }

        return res.status(200).json({
            success: true,
            message: 'Email verified successfully',
            isFullyVerified: (!user.phone || user.phoneVerified),
            tokens
        });
    } catch (error) {
        console.error('Email verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during email verification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify phone with OTP
 * @route POST /api/auth/verify-phone
 */
exports.verifyPhone = async (req, res) => {
    try {
        const {phone, otp} = req.body;

        if (!phone || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Phone and OTP are required'
            });
        }

        // Check if OTP exists and is valid
        const storedOTP = otpStore.phone[phone];
        if (!storedOTP || storedOTP.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check if OTP is expired
        if (new Date() > storedOTP.expires) {
            // Remove expired OTP
            delete otpStore.phone[phone];

            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Update user
        const user = await User.findOneAndUpdate(
            {phone},
            {phoneVerified: true},
            {new: true}
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove OTP from store
        delete otpStore.phone[phone];

        // Generate tokens if both email and phone are verified (if applicable)
        let tokens = null;
        if (
            (!user.email || user.emailVerified) &&
            (user.phone && user.phoneVerified)
        ) {
            const accessToken = generateAccessToken(user);
            const refreshToken = await generateRefreshToken(user);

            tokens = {
                accessToken,
                refreshToken: refreshToken.token,
                expiresAt: refreshToken.expiresAt
            };
        }

        return res.status(200).json({
            success: true,
            message: 'Phone verified successfully',
            isFullyVerified: (!user.email || user.emailVerified),
            tokens
        });
    } catch (error) {
        console.error('Phone verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during phone verification',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Resend verification OTP
 * @route POST /api/auth/resend-verification
 */
exports.resendVerification = async (req, res) => {
    try {
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
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if already verified
        if ((type === 'email' && user.emailVerified) || (type === 'phone' && user.phoneVerified)) {
            return res.status(400).json({
                success: false,
                message: `${type === 'email' ? 'Email' : 'Phone'} is already verified`
            });
        }

        // Generate and send new OTP
        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

        if (type === 'email') {
            otpStore.email[contact] = {
                otp,
                expires: expiresAt
            };
            await sendVerificationEmail(contact, otp);
        } else {
            otpStore.phone[contact] = {
                otp,
                expires: expiresAt
            };
            await sendVerificationSMS(contact, otp);
        }

        return res.status(200).json({
            success: true,
            message: `Verification code sent to ${type === 'email' ? 'email' : 'phone'}`
        });
    } catch (error) {
        console.error('Resend verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while resending verification code',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Login with password
 * @route POST /api/auth/login
 */
exports.login = async (req, res) => {
    try {

        const {email, phone, password} = req.body;

        // Ensure either email or phone is provided
        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Either email or phone is required'
            });
        }

        // Find user
        const query = email ? {email} : {phone};
        const user = await User.findOne(query);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: `Account is ${user.status}`
            });
        }

        if (req.body.email) {
            // Login via Email
            if (!user.emailVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Email not verified. Please verify your email to continue.',
                    requiresEmailVerification: true,
                    requiresPhoneVerification: false
                });
            }
        } else if (req.body.phone) {
            // Login via Phone
            if (!user.phoneVerified) {
                return res.status(403).json({
                    success: false,
                    message: 'Phone not verified. Please verify your phone number to continue.',
                    requiresEmailVerification: false,
                    requiresPhoneVerification: true
                });
            }
        }

        // Verify password
        if (!user.passwordHash) {
            return res.status(400).json({
                success: false,
                message: 'Account requires social login or OTP login'
            });
        }

        const isPasswordValid = await verifyPassword(user.passwordHash, password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const twoFA = user.profile?.twoFactorAuth;
        if (twoFA?.enabled) {
            const method = twoFA.method;

            // Send OTP for email/phone
            if (method === 'email' || method === 'phone') {
                const otp = Math.floor(100000 + Math.random() * 900000).toString();
                const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

                // Save OTP in memory or DB (depending on your setup)
                if (!otpStore[method]) otpStore[method] = {};
                otpStore[method][user._id] = {otp, expires};


                if (method === 'email') {
                    send2FAEmail(user.email, otp);
                } else if (method === 'phone') {
                    send2FASMS(user.phone, otp);
                }

                return res.status(200).json({
                    success: true,
                    message: `2FA required via ${method}. Please verify the OTP.`,
                    requires2FA: true,
                    method,
                    userId: user._id
                });
            }

            // If 2FA method is app (Google Authenticator)
            if (method === 'app') {
                return res.status(200).json({
                    success: true,
                    message: '2FA required via authenticator app. Please provide the verification code.',
                    requires2FA: true,
                    method: 'app',
                    userId: user._id
                });
            }
        }

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
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
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
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Login with OTP
 * @route POST /api/auth/login-otp/request
 */
exports.requestLoginOTP = async (req, res) => {
    try {
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
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if user is active
        if (user.status !== 'active') {
            return res.status(403).json({
                success: false,
                message: `Account is ${user.status}`
            });
        }

        // Check if contact is verified
        if ((type === 'email' && !user.emailVerified) || (type === 'phone' && !user.phoneVerified)) {
            return res.status(403).json({
                success: false,
                message: `${type === 'email' ? 'Email' : 'Phone'} is not verified`
            });
        }

        // Generate and send OTP
        const otp = generateOTP();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes

        if (type === 'email') {
            otpStore.email[contact] = {
                otp,
                expires: expiresAt,
                isLoginOTP: true
            };
            await sendVerificationEmail(contact, otp);
        } else {
            otpStore.phone[contact] = {
                otp,
                expires: expiresAt,
                isLoginOTP: true
            };
            await sendVerificationSMS(contact, otp);
        }

        return res.status(200).json({
            success: true,
            message: `Login code sent to ${type === 'email' ? 'email' : 'phone'}`,
            expiresAt
        });
    } catch (error) {
        console.error('Login OTP request error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred while requesting login code',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Verify login OTP
 * @route POST /api/auth/login-otp/verify
 */
exports.verifyLoginOTP = async (req, res) => {
    try {
        const {type, contact, otp} = req.body;

        if (!type || !contact || !otp || !['email', 'phone'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Valid type (email or phone), contact, and OTP are required'
            });
        }

        // Check if OTP exists and is valid
        const otpData = type === 'email' ? otpStore.email[contact] : otpStore.phone[contact];

        if (!otpData || otpData.otp !== otp || !otpData.isLoginOTP) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        // Check if OTP is expired
        if (new Date() > otpData.expires) {
            // Remove expired OTP
            if (type === 'email') {
                delete otpStore.email[contact];
            } else {
                delete otpStore.phone[contact];
            }

            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Find user
        const query = type === 'email' ? {email: contact} : {phone: contact};
        const user = await User.findOne(query);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Remove OTP from store
        if (type === 'email') {
            delete otpStore.email[contact];
        } else {
            delete otpStore.phone[contact];
        }

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
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            message: 'Login successful',
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
        console.error('Login OTP verification error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during login',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Refresh access token
 * @route POST /api/auth/refresh-token
 */
exports.refreshToken = async (req, res) => {
    try {
        // Get refresh token from cookie or request body
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const {userId, tokenDoc} = await verifyRefreshToken(refreshToken);

        // Get user
        const user = await User.findById(userId);
        if (!user || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'Invalid user or account is inactive'
            });
        }

        // Generate new tokens
        const accessToken = generateAccessToken(user);
        const newRefreshToken = await rotateRefreshToken(tokenDoc._id, user, tokenDoc.deviceId);

        // Update cookie
        res.cookie('refreshToken', newRefreshToken.token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        return res.status(200).json({
            success: true,
            accessToken,
            refreshToken: newRefreshToken.token,
            expiresAt: newRefreshToken.expiresAt
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Logout user
 * @route POST /api/auth/logout
 */
exports.logout = async (req, res) => {
    try {
        // Get refresh token from cookie or request body
        const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if (refreshToken) {
            try {
                // Verify and revoke refresh token
                const {tokenDoc} = await verifyRefreshToken(refreshToken);
                await revokeRefreshToken(tokenDoc._id);
            } catch (error) {
                // Ignore errors for invalid tokens
                console.log('Error revoking token:', error.message);
            }
        }

        // Clear cookie
        res.clearCookie('refreshToken');

        return res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        console.error('Logout error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during logout',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};