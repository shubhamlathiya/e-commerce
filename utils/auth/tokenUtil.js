const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../../models/auth/refreshTokenModel');

/**
 * Generate JWT access token
 * @param {Object} user - User object
 * @returns {String} JWT token
 */
const generateAccessToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            email: user.email,
            phone: user.phone,
            roles: user.roles
        },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY || '7d' }
    );
};

/**
 * Generate refresh token
 * @param {Object} user - User object
 * @param {String} deviceId - Device ID (optional)
 * @returns {Object} Refresh token object with token and hash
 */
const generateRefreshToken = async (user, deviceId = null) => {
    // Generate a random token
    const refreshToken = crypto.randomBytes(40).toString('hex');

    // Hash the token for storage
    const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    // Calculate expiry date
    const expiresIn = process.env.JWT_REFRESH_EXPIRY || '7d';
    const expiresAt = new Date();

    // Convert expiry string to milliseconds and add to current date
    if (expiresIn.endsWith('d')) {
        expiresAt.setDate(expiresAt.getDate() + parseInt(expiresIn));
    } else if (expiresIn.endsWith('h')) {
        expiresAt.setHours(expiresAt.getHours() + parseInt(expiresIn));
    } else if (expiresIn.endsWith('m')) {
        expiresAt.setMinutes(expiresAt.getMinutes() + parseInt(expiresIn));
    }

    // Create refresh token in database
    const refreshTokenDoc = await RefreshToken.create({
        userId: user._id,
        tokenHash: refreshTokenHash,
        deviceId: deviceId,
        expiresAt: expiresAt
    });

    return {
        token: refreshToken,
        id: refreshTokenDoc._id,
        expiresAt
    };
};

/**
 * Verify refresh token
 * @param {String} refreshToken - Refresh token
 * @returns {Promise<Object>} User ID and token document
 */
const verifyRefreshToken = async (refreshToken) => {
    // Hash the provided token
    const refreshTokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

    // Find the token in database
    const tokenDoc = await RefreshToken.findOne({
        tokenHash: refreshTokenHash,
        revoked: false,
        expiresAt: { $gt: new Date() }
    });

    if (!tokenDoc) {
        throw new Error('Invalid or expired refresh token');
    }

    return {
        userId: tokenDoc.userId,
        tokenDoc
    };
};

/**
 * Revoke refresh token
 * @param {String} tokenId - Refresh token ID
 * @returns {Promise<Boolean>} Success status
 */
const revokeRefreshToken = async (tokenId) => {
    const result = await RefreshToken.updateOne(
        { _id: tokenId },
        { revoked: true }
    );

    return result.modifiedCount > 0;
};

/**
 * Revoke all refresh tokens for a user
 * @param {String} userId - User ID
 * @returns {Promise<Number>} Number of tokens revoked
 */
const revokeAllUserTokens = async (userId) => {
    const result = await RefreshToken.updateMany(
        { userId, revoked: false },
        { revoked: true }
    );

    return result.modifiedCount;
};

/**
 * Rotate refresh token (revoke old, create new)
 * @param {String} oldTokenId - Old refresh token ID
 * @param {Object} user - User object
 * @param {String} deviceId - Device ID (optional)
 * @returns {Object} New refresh token
 */
const rotateRefreshToken = async (oldTokenId, user, deviceId = null) => {
    // Generate new refresh token
    const newRefreshToken = await generateRefreshToken(user, deviceId);

    // Revoke old token and link to new one
    await RefreshToken.updateOne(
        { _id: oldTokenId },
        {
            revoked: true,
            replacedBy: newRefreshToken.id
        }
    );

    return newRefreshToken;
};

/**
 * Generate temporary 2FA token
 * Used for users who have 2FA enabled and need to complete verification
 * @param {ObjectId} userId - User ID
 * @returns {String} JWT token valid for a few minutes
 */
const generateTemp2FAToken = (userId) => {
    return jwt.sign(
        { id: userId, type: '2fa' },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: '5m' } // expires in 5 minutes
    );
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    rotateRefreshToken,
    generateTemp2FAToken,
};