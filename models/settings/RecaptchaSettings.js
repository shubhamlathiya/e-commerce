const mongoose = require('mongoose');

const recaptchaSettingsSchema = new mongoose.Schema({
    site_key: {
        type: String,
        required: [true, 'Site key is required'],
        trim: true
    },
    secret_key: {
        type: String,
        required: [true, 'Secret key is required'],
        trim: true
    },
    status: {
        type: Boolean,
        default: false
    },
    version: {
        type: String,
        enum: ['v2', 'v3'],
        default: 'v2'
    },
    minimum_score: {
        type: Number,
        min: 0.1,
        max: 1.0,
        default: 0.5
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            // Remove secret key when converting to JSON
            delete ret.secret_key;
            return ret;
        }
    }
});

// Index for efficient querying
recaptchaSettingsSchema.index({ createdAt: -1 });

// Static method to get latest settings
recaptchaSettingsSchema.statics.getLatest = function() {
    return this.findOne().sort({ createdAt: -1 });
};

// Static method to get active settings
recaptchaSettingsSchema.statics.getActive = function() {
    return this.findOne({ status: true }).sort({ createdAt: -1 });
};

// Instance method to verify reCAPTCHA response
recaptchaSettingsSchema.methods.verifyResponse = async function(response, remoteip = '') {
    if (!this.status) {
        return { success: true, message: 'reCAPTCHA is disabled' };
    }

    try {
        const axios = require('axios');
        const verificationUrl = 'https://www.google.com/recaptcha/api/siteverify';

        const params = new URLSearchParams();
        params.append('secret', this.secret_key);
        params.append('response', response);
        if (remoteip) {
            params.append('remoteip', remoteip);
        }

        const verificationResponse = await axios.post(verificationUrl, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = verificationResponse.data;

        if (this.version === 'v3' && data.score) {
            data.success = data.success && data.score >= this.minimum_score;
        }

        return data;
    } catch (error) {
        console.error('reCAPTCHA verification error:', error);
        return { success: false, message: 'Verification failed' };
    }
};

// Pre-save middleware to validate keys format
recaptchaSettingsSchema.pre('save', function(next) {
    // Basic validation for reCAPTCHA keys format
    if (this.site_key && !this.site_key.startsWith('6L')) {
        next(new Error('Invalid reCAPTCHA site key format'));
    }
    if (this.secret_key && !this.secret_key.startsWith('6L')) {
        next(new Error('Invalid reCAPTCHA secret key format'));
    }
    next();
});

module.exports = mongoose.model('RecaptchaSettings', recaptchaSettingsSchema);