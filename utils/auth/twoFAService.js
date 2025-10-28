const {sendVerificationEmail} = require('../emailUtil');
const {sendVerificationSMS} = require('../smsUtil');
const User = require('../../models/auth/userModel');
const {generateOTP} = require("./otpUtils");


/**
 * Send 2FA code based on user preference (email or phone)
 */
const send2FAOtp = async (user, method) => {
    const otp = generateOTP();
    user.twoFA = {
        ...user.twoFA,
        otp,
        expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes expiry
    };
    await user.save();

    if (method === 'email') {
        await sendVerificationEmail(user.email, otp);
    } else if (method === 'phone') {
        await sendVerificationSMS(user.phone, otp);
    }

    return otp;
};

module.exports = {send2FAOtp};
