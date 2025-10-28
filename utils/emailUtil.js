const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create reusable transporter
let transporter;

/**
 * Initialize email transporter
 */
const initializeTransporter = () => {
    transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
            user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD
        }
    });
};

/**
 * Send verification email with OTP
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 * @returns {Promise<boolean>} Success status
 */
const sendVerificationEmail = async (email, otp) => {
    if (!transporter) {
        initializeTransporter();
    }

    try {
        const mailOptions = {
            from: `"Authentication Service" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Email Verification',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Verify Your Email Address</h2>
          <p>Thank you for registering! Please use the following verification code to complete your registration:</p>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this verification, please ignore this email.</p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending verification email:', error);
        return false;
    }
};

/**
 * Send password reset email with OTP
 * @param {string} email - Recipient email
 * @param {string} otp - One-time password
 * @returns {Promise<boolean>} Success status
 */
const sendPasswordResetEmail = async (email, otp) => {
    if (!transporter) {
        initializeTransporter();
    }

    try {
        const mailOptions = {
            from: `"Authentication Service" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Password Reset Request',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password. Please use the following code to reset your password:</p>
          <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
            ${otp}
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending password reset email:', error);
        return false;
    }
};

/**
 * Send 2FA login OTP email
 * @param {string} email
 * @param {string} otp
 */
const send2FAEmail = async (email, otp) => {
    if (!transporter) {
        initializeTransporter();
    }

    try {
        const mailOptions = {
            from: `"Security Team" <${process.env.EMAIL_FROM}>`,
            to: email,
            subject: 'Your Login Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2>Login Verification</h2>
                  <p>We detected a login attempt on your account. Please enter this code to verify it's you:</p>
                  <div style="background-color: #f4f4f4; padding: 10px; text-align: center; font-size: 24px; letter-spacing: 5px; font-weight: bold;">
                    ${otp}
                  </div>
                  <p>This code will expire in 5 minutes.</p>
                  <p>If this wasn't you, please change your password immediately.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Error sending 2FA email:', error);
        return false;
    }
};


module.exports = {
    sendVerificationEmail, sendPasswordResetEmail,send2FAEmail
};