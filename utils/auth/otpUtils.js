/**
 * Utility functions for OTP generation and validation
 */

/**
 * Generate a random OTP of specified length
 * @param {number} length - Length of OTP (default: 6)
 * @returns {string} - Generated OTP
 */
const generateOTP = (length = 6) => {
    // Generate a random number with specified length
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
};

/**
 * Calculate OTP expiration time
 * @param {number} minutes - Minutes until expiration (default: 10)
 * @returns {Date} - Expiration date
 */
const calculateOTPExpiry = (minutes = 10) => {
    return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = {
    generateOTP,
    calculateOTPExpiry
};