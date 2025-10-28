const twilio = require('twilio');

// Initialize Twilio client
let twilioClient;

/**
 * Initialize Twilio client
 */
const initializeTwilioClient = () => {
    twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
};

/**
 * Send verification SMS with OTP
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - One-time password
 * @returns {Promise<boolean>} Success status
 */
const sendVerificationSMS = async (phoneNumber, otp) => {
    if (!twilioClient) {
        initializeTwilioClient();
    }

    try {
        await twilioClient.messages.create({
            body: `Your verification code is: ${otp}. This code will expire in 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });
        return true;
    } catch (error) {
        console.error('Error sending verification SMS:', error);
        return false;
    }
};

/**
 * Send password reset SMS with OTP
 * @param {string} phoneNumber - Recipient phone number
 * @param {string} otp - One-time password
 * @returns {Promise<boolean>} Success status
 */
const sendPasswordResetSMS = async (phoneNumber, otp) => {
    if (!twilioClient) {
        initializeTwilioClient();
    }

    try {
        await twilioClient.messages.create({
            body: `Your password reset code is: ${otp}. This code will expire in 10 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });
        return true;
    } catch (error) {
        console.error('Error sending password reset SMS:', error);
        return false;
    }
};

/**
 * Send 2FA login OTP SMS
 * @param {string} phoneNumber
 * @param {string} otp
 */
const send2FASMS = async (phoneNumber, otp) => {
    if (!twilioClient) {
        initializeTwilioClient();
    }

    try {
        await twilioClient.messages.create({
            body: `Your login verification code is: ${otp}. It expires in 5 minutes.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: phoneNumber
        });
        return true;
    } catch (error) {
        console.error('Error sending 2FA SMS:', error);
        return false;
    }
};


/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} Is valid phone number
 */
const isValidPhoneNumber = (phoneNumber) => {
    // Basic validation - can be enhanced with more specific rules
    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
};

module.exports = {
    sendVerificationSMS, sendPasswordResetSMS, isValidPhoneNumber, send2FASMS
};