const jwt = require('jsonwebtoken');
const User = require('../models/auth/userModel');

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header and verifies it
 * Adds user object to request if token is valid
 */
exports.authenticateJWT = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        console.log(authHeader);
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        const token = authHeader.split(' ')[1];

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
        console.log(decoded);
        // Check if token is expired
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (decoded.exp && decoded.exp < currentTimestamp) {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }

        // Get user from database
        const user = await User.findById(decoded.id);

        // Check if user exists and is active
        if (!user || user.status !== 'active') {
            return res.status(401).json({
                success: false,
                message: 'User not found or inactive'
            });
        }

        // Add user to request object
        req.user = {
            id: user._id,
            email: user.email,
            phone: user.phone,
            name: user.name,
            roles: user.roles
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        console.error('Authentication error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred during authentication',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

/**
 * Middleware to check if user has required roles
 * @param {string[]} requiredRoles - Array of required roles
 * @returns {function} - Express middleware function
 */
exports.authorizeRoles = (requiredRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Check if user has any of the required roles
        const hasRequiredRole = req.user.roles.some(role =>
            requiredRoles.includes(role)
        );

        if (!hasRequiredRole) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Middleware to check if user is an admin
 */
exports.isAdmin = (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    // Check if user has admin role
    if (!req.user.roles.includes('admin')) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required'
        });
    }

    next();
};

/**
 * Middleware to check if user is accessing their own resource
 * @param {string} paramName - Name of the parameter containing the resource ID
 * @returns {function} - Express middleware function
 */
exports.isResourceOwner = (paramName = 'userId') => {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        // Get resource ID from request parameters
        const resourceId = req.params[paramName];

        // Check if user is the owner of the resource
        if (resourceId !== req.user.id.toString()) {
            // Allow admin to access any resource
            if (req.user.roles.includes('admin')) {
                return next();
            }

            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only access your own resources'
            });
        }

        next();
    };
};