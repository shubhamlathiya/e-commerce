// utils/otpStore.js

// Temporary in-memory OTP storage
const otpStore = {
    email: {}, // { userId: { otp, expires } }
    phone: {}, // { userId: { otp, expires } }
};

/**
 * Save OTP for a user and method
 */
const saveOTP = (method, userId, otp, expiresInMinutes = 10) => {
    const expires = new Date(Date.now() + expiresInMinutes * 60 * 1000);
    otpStore[method][userId] = { otp, expires };
};

/**
 * Verify OTP for a user and method
 */
const verifyOTP = (method, userId, token) => {
    const record = otpStore[method]?.[userId];
    if (!record) return false;

    const isValid = record.otp === token && new Date() <= record.expires;
    if (isValid) {
        delete otpStore[method][userId]; // Clear OTP after successful verification
    }
    return isValid;
};

/**
 * Clear expired OTPs (optional housekeeping)
 */
const clearExpiredOTPs = () => {
    const now = new Date();
    for (const method in otpStore) {
        for (const userId in otpStore[method]) {
            if (otpStore[method][userId].expires <= now) {
                delete otpStore[method][userId];
            }
        }
    }
};

module.exports = {
    otpStore,
    saveOTP,
    verifyOTP,
    clearExpiredOTPs,
};
