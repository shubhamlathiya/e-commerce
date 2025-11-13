const express = require('express');
const {body} = require('express-validator');
const authController = require('../../controllers/auth/authController');

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account using either email or phone along with a password.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *                 description: Full name of the user.
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *                 description: User's email address. Required if phone is not provided.
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *                 description: User's phone number. Required if email is not provided.
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Pass@1234
 *                 description: Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.
 *     responses:
 *       201:
 *         description: User registered successfully.
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
 *                   example: User registered successfully.
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 64f0c2a7e1f2a2c5d4b6a3e1
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     phone:
 *                       type: string
 *                       example: "+919876543210"
 *       400:
 *         description: Invalid input data.
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
 *                   example: Invalid input.
 *       409:
 *         description: User already exists.
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
 *                   example: User already exists.
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
router.post(
    '/register',
    // [
    //     body('email').optional().isEmail().withMessage('Must be a valid email address'),
    //     body('phone').optional().isMobilePhone().withMessage('Must be a valid phone number'),
    //     body('password')
    //         .isLength({min: 8})
    //         .withMessage('Password must be at least 8 characters long')
    //         .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    //         .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    //         .matches(/[0-9]/).withMessage('Password must contain at least one number')
    //         .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
    //     body('name').optional().isString().withMessage('Name must be a string')
    // ],
    authController.register
);

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user's email using OTP
 *     description: This endpoint verifies a user's email address by matching the provided OTP with the one sent to their email.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *                 description: Registered email address of the user.
 *               otp:
 *                 type: string
 *                 example: "482916"
 *                 description: One-Time Password sent to the user's email for verification.
 *     responses:
 *       200:
 *         description: Email verified successfully.
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
 *                   example: Email verified successfully.
 *       400:
 *         description: Invalid or expired OTP.
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
 *                   example: Invalid or expired OTP.
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
router.post(
    '/verify-email',
    [
        body('email').isEmail().withMessage('Must be a valid email address'),
        body('otp').isString().withMessage('OTP must be a string')
    ],
    authController.verifyEmail
);

/**
 * @swagger
 * /api/auth/verify-phone:
 *   post:
 *     summary: Verify user's phone number using OTP
 *     description: Confirms a user's phone number by validating the OTP sent via SMS.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *                 description: Registered phone number of the user.
 *               otp:
 *                 type: string
 *                 example: "739420"
 *                 description: One-Time Password sent to the user's phone for verification.
 *     responses:
 *       200:
 *         description: Phone verified successfully.
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
 *                   example: Phone verified successfully.
 *       400:
 *         description: Invalid or expired OTP.
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
 *                   example: Invalid or expired OTP.
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
router.post(
    '/verify-phone',
    [
        body('phone').isMobilePhone().withMessage('Must be a valid phone number'),
        body('otp').isString().withMessage('OTP must be a string')
    ],
    authController.verifyPhone
);

/**
 * @swagger
 * /api/auth/resend-verification:
 *   post:
 *     summary: Resend verification OTP
 *     description: Resends a new verification code (OTP) to the user's registered email or phone number based on the specified type.
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
 *                 description: Specifies whether the verification OTP should be sent to email or phone.
 *               contact:
 *                 type: string
 *                 example: johndoe@example.com
 *                 description: The user's email address or phone number, depending on the selected type.
 *     responses:
 *       200:
 *         description: Verification code resent successfully.
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
 *                   example: Verification code sent successfully.
 *       400:
 *         description: Invalid request or missing input data.
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
 *                   example: Invalid input or unsupported type.
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
router.post(
    '/resend-verification',
    [
        body('type').isIn(['email', 'phone']).withMessage('Type must be either email or phone'),
        body('contact').isString().withMessage('Contact must be a string')
    ],
    authController.resendVerification
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login using email or phone and password
 *     description: Authenticates a user using their registered email or phone number and password. Returns an access token upon successful login.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@example.com
 *                 description: Registered email address. Required if phone is not provided.
 *               phone:
 *                 type: string
 *                 example: "+919876543210"
 *                 description: Registered phone number. Required if email is not provided.
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Pass@1234
 *                 description: User's account password.
 *     responses:
 *       200:
 *         description: Login successful.
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
 *                   example: Login successful.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 64f0c2a7e1f2a2c5d4b6a3e1
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     phone:
 *                       type: string
 *                       example: "+919876543210"
 *       401:
 *         description: Invalid credentials.
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
 *                   example: Invalid email, phone, or password.
 *       403:
 *         description: Account not verified.
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
 *                   example: Please verify your account before logging in.
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
router.post(
    '/login',
    [
        body('email').optional().isEmail().withMessage('Must be a valid email address'),
        body('phone').optional().isMobilePhone().withMessage('Must be a valid phone number'),
        body('password').isString().withMessage('Password must be a string')
    ],
    authController.login
);

/**
 * @swagger
 * /api/auth/login-otp/request:
 *   post:
 *     summary: Request OTP for login
 *     description: Sends a one-time password (OTP) to the user's registered email or phone for login authentication.
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
 *                 example: phone
 *                 description: Determines whether the OTP will be sent via email or SMS.
 *               contact:
 *                 type: string
 *                 example: "+919876543210"
 *                 description: The user's registered email address or phone number, depending on the selected type.
 *     responses:
 *       200:
 *         description: OTP sent successfully.
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
 *                   example: Login OTP sent successfully.
 *       400:
 *         description: Invalid input or unsupported request type.
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
router.post(
    '/login-otp/request',
    [
        body('type').isIn(['email', 'phone']).withMessage('Type must be either email or phone'),
        body('contact').isString().withMessage('Contact must be a string')
    ],
    authController.requestLoginOTP
);

/**
 * @swagger
 * /api/auth/login-otp/verify:
 *   post:
 *     summary: Verify OTP for login
 *     description: Verifies the OTP sent to the user's registered email or phone and logs the user in if valid.
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
 *               - otp
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [email, phone]
 *                 example: phone
 *                 description: Specifies whether the OTP was sent via email or phone.
 *               contact:
 *                 type: string
 *                 example: "+919876543210"
 *                 description: The user's registered email address or phone number.
 *               otp:
 *                 type: string
 *                 example: "739420"
 *                 description: The one-time password received by the user.
 *     responses:
 *       200:
 *         description: Login successful.
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
 *                   example: Login successful.
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 64f0c2a7e1f2a2c5d4b6a3e1
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: johndoe@example.com
 *                     phone:
 *                       type: string
 *                       example: "+919876543210"
 *       400:
 *         description: Invalid or expired OTP.
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
 *                   example: Invalid or expired OTP.
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
router.post(
    '/login-otp/verify',
    [
        body('type').isIn(['email', 'phone']).withMessage('Type must be either email or phone'),
        body('contact').isString().withMessage('Contact must be a string'),
        body('otp').isString().withMessage('OTP must be a string')
    ],
    authController.verifyLoginOTP
);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Generates a new access token using a valid refresh token. If the refresh token is invalid or expired, the request will be rejected.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 description: The refresh token issued during login.
 *     responses:
 *       200:
 *         description: Token refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 refreshToken:
 *                   type: string
 *                   example: eyJhY2Nlc3NfdG9rZW4iOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid or expired refresh token.
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
 *                   example: Invalid or expired refresh token.
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
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out the authenticated user by invalidating the provided refresh token, if any.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 description: The refresh token to invalidate. Optional if handled via cookies.
 *     responses:
 *       200:
 *         description: Logged out successfully.
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
 *                   example: Logged out successfully.
 *       400:
 *         description: Invalid or missing refresh token.
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
 *                   example: Invalid or missing refresh token.
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
router.post('/logout', authController.logout);

module.exports = router;