const argon2 = require('argon2');

/**
 * Hash a password using Argon2
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
    try {
        // Using Argon2id which balances resistance against side-channel and GPU attacks
        return await argon2.hash(password, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16, // 64 MiB
            timeCost: 3, // 3 iterations
            parallelism: 1, // 1 degree of parallelism
            hashLength: 32 // 32 bytes output
        });
    } catch (error) {
        throw new Error(`Error hashing password: ${error.message}`);
    }
};

/**
 * Verify a password against a hash
 * @param {string} hash - Hashed password
 * @param {string} password - Plain text password to verify
 * @returns {Promise<boolean>} True if password matches
 */
const verifyPassword = async (hash, password) => {
    try {
        // console.log(password);
        return await argon2.verify(hash, password);
    } catch (error) {
        throw new Error(`Error verifying password: ${error.message}`);
    }
};

/**
 * Check if password meets complexity requirements
 * @param {string} password - Password to check
 * @returns {Object} Validation result with isValid and message
 */
const validatePasswordStrength = (password) => {
    // Password must be at least 8 characters
    if (password.length < 8) {
        return {
            isValid: false,
            message: 'Password must be at least 8 characters long'
        };
    }

    // Password must contain at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one uppercase letter'
        };
    }

    // Password must contain at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one lowercase letter'
        };
    }

    // Password must contain at least one number
    if (!/[0-9]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one number'
        };
    }

    // Password must contain at least one special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return {
            isValid: false,
            message: 'Password must contain at least one special character'
        };
    }

    return {
        isValid: true,
        message: 'Password meets complexity requirements'
    };
};

module.exports = {
    hashPassword,
    verifyPassword,
    validatePasswordStrength
};