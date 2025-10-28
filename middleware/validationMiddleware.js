const Joi = require('joi');
const { ApiError } = require('./errorHandler');

/**
 * Validation middleware factory
 * @param {Object} schema - Joi validation schema
 * @returns {Function} - Express middleware function
 */
const validate = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);

        if (error) {
            const errorMessage = error.details.map(detail => detail.message).join(', ');
            return next(new ApiError(errorMessage, 400));
        }

        next();
    };
};

// Registration validation schema
const registerSchema = Joi.object({
    name: Joi.string().required().min(2).max(50).messages({
        'string.empty': 'Name is required',
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters'
    }),
    email: Joi.string().required().email().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
    }),
    password: Joi.string().required().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).messages({
        'string.empty': 'Password is required',
        'string.min': 'Password must be at least 8 characters long',
        'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
    otp: Joi.string().length(6).pattern(/^[0-9]+$/).messages({
        'string.empty': 'OTP is required',
        'string.length': 'OTP must be 6 digits',
        'string.pattern.base': 'OTP must contain only numbers'
    })
});

// Login validation schema
const loginSchema = Joi.object({
    email: Joi.string().required().email().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
    }),
    password: Joi.string().required().messages({
        'string.empty': 'Password is required'
    })
});

// Email validation schema (for OTP sending)
const emailSchema = Joi.object({
    email: Joi.string().required().email().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
    })
});

// Reset password validation schema
const resetPasswordSchema = Joi.object({
    email: Joi.string().required().email().messages({
        'string.empty': 'Email is required',
        'string.email': 'Please provide a valid email address'
    }),
    otp: Joi.string().required().length(6).pattern(/^[0-9]+$/).messages({
        'string.empty': 'OTP is required',
        'string.length': 'OTP must be 6 digits',
        'string.pattern.base': 'OTP must contain only numbers'
    }),
    newPassword: Joi.string().required().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')).messages({
        'string.empty': 'New password is required',
        'string.min': 'New password must be at least 8 characters long',
        'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    })
});

module.exports = {
    validateRegister: validate(registerSchema),
    validateLogin: validate(loginSchema),
    validateEmail: validate(emailSchema),
    validateResetPassword: validate(resetPasswordSchema)
};