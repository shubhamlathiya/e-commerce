const mongoose = require('mongoose');

const emailSettingsSchema = new mongoose.Schema({
    smtp_host: {
        type: String,
        required: [true, 'SMTP host is required'],
        trim: true
    },
    smtp_port: {
        type: Number,
        required: [true, 'SMTP port is required'],
        min: [1, 'Port must be between 1 and 65535'],
        max: [65535, 'Port must be between 1 and 65535']
    },
    smtp_username: {
        type: String,
        trim: true
    },
    smtp_password: {
        type: String,
        required: [true, 'SMTP password is required']
    },
    smtp_secure: {
        type: String,
        enum: {
            values: ['none', 'ssl', 'tls'],
            message: 'Security must be either none, ssl, or tls'
        },
        default: 'tls'
    },
    from_email: {
        type: String,
        required: [true, 'From email is required'],
        trim: true,
        lowercase: true,
        validate: {
            validator: function(email) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            },
            message: 'Please provide a valid email address'
        }
    },
    from_name: {
        type: String,
        trim: true,
        default: ''
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function(doc, ret) {
            // Remove password when converting to JSON
            delete ret.smtp_password;
            return ret;
        }
    }
});

// Index for efficient querying
emailSettingsSchema.index({ createdAt: -1 });

// Static method to get latest settings
emailSettingsSchema.statics.getLatest = function() {
    return this.findOne().sort({ createdAt: -1 });
};

// Instance method to test SMTP connection
emailSettingsSchema.methods.testConnection = async function() {
    // This would contain logic to test SMTP connection
    // For now, return a mock response
    return {
        success: true,
        message: 'SMTP connection test would be implemented here'
    };
};

// Pre-save middleware to encrypt password (in production, use proper encryption)
emailSettingsSchema.pre('save', function(next) {
    // In production, you would encrypt the password here
    // For example: this.smtp_password = bcrypt.hashSync(this.smtp_password, 10);
    next();
});

// Virtual for display name
emailSettingsSchema.virtual('displayName').get(function() {
    return this.from_name || this.from_email;
});

module.exports = mongoose.model('EmailSettings', emailSettingsSchema);