const BusinessSettings = require('../../models/settings/businessSettingsModel');
const EmailSettings = require('../../models/settings/EmailSettings');
const RecaptchaSettings = require('../../models/settings/RecaptchaSettings');
const PaymentGateway = require('../../models/settings/paymentGatewayConfigModel');
const { validationResult } = require('express-validator');

// Business Settings Controllers
exports.getBusinessSettings = async (req, res) => {
    try {
        const settings = await BusinessSettings.findOne().sort({ createdAt: -1 });

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Business settings not found'
            });
        }

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get business settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch business settings'
        });
    }
};

exports.createBusinessSettings = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            businessName,
            contactEmail,
            phone,
            address,
            gstNumber,
            currency,
            timezone
        } = req.body;

        // Check if settings already exist
        const existingSettings = await BusinessSettings.findOne();
        if (existingSettings) {
            return res.status(400).json({
                success: false,
                message: 'Business settings already exist. Use update instead.'
            });
        }

        const settings = new BusinessSettings({
            businessName,
            contactEmail,
            phone,
            address,
            gstNumber,
            currency,
            timezone
        });

        await settings.save();

        res.status(201).json({
            success: true,
            message: 'Business settings created successfully',
            data: settings
        });
    } catch (error) {
        console.error('Create business settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create business settings'
        });
    }
};

exports.updateBusinessSettings = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const updateData = req.body;

        const settings = await BusinessSettings.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Business settings not found'
            });
        }

        res.json({
            success: true,
            message: 'Business settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Update business settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update business settings'
        });
    }
};

// Email Settings Controllers
exports.getEmailSettings = async (req, res) => {
    try {
        const settings = await EmailSettings.findOne().sort({ createdAt: -1 });

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Email settings not found'
            });
        }

        // Don't send password in response
        const settingsData = settings.toObject();
        delete settingsData.smtp_password;

        res.json({
            success: true,
            data: settingsData
        });
    } catch (error) {
        console.error('Get email settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch email settings'
        });
    }
};

exports.updateEmailSettings = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            smtp_host,
            smtp_port,
            smtp_username,
            smtp_password,
            smtp_secure,
            from_email,
            from_name,
            status
        } = req.body;

        let settings = await EmailSettings.findOne();

        if (settings) {
            // Update existing settings
            settings.smtp_host = smtp_host;
            settings.smtp_port = smtp_port;
            settings.smtp_username = smtp_username;
            if (smtp_password) {
                settings.smtp_password = smtp_password; // In production, encrypt this
            }
            settings.smtp_secure = smtp_secure;
            settings.from_email = from_email;
            settings.from_name = from_name;
            settings.status = status !== undefined ? status : true;

            await settings.save();
        } else {
            // Create new settings
            settings = new EmailSettings({
                smtp_host,
                smtp_port,
                smtp_username,
                smtp_password, // In production, encrypt this
                smtp_secure,
                from_email,
                from_name,
                status: status !== undefined ? status : true
            });

            await settings.save();
        }

        // Don't send password in response
        const settingsData = settings.toObject();
        delete settingsData.smtp_password;

        res.json({
            success: true,
            message: 'Email settings updated successfully',
            data: settingsData
        });
    } catch (error) {
        console.error('Update email settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update email settings'
        });
    }
};

// reCAPTCHA Settings Controllers
exports.getRecaptchaSettings = async (req, res) => {
    try {
        const settings = await RecaptchaSettings.findOne().sort({ createdAt: -1 });

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'reCAPTCHA settings not found'
            });
        }

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get reCAPTCHA settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch reCAPTCHA settings'
        });
    }
};

exports.updateRecaptchaSettings = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            site_key,
            secret_key,
            status
        } = req.body;

        let settings = await RecaptchaSettings.findOne();

        if (settings) {
            // Update existing settings
            settings.site_key = site_key;
            settings.secret_key = secret_key;
            settings.status = status !== undefined ? status : false;

            await settings.save();
        } else {
            // Create new settings
            settings = new RecaptchaSettings({
                site_key,
                secret_key,
                status: status !== undefined ? status : false
            });

            await settings.save();
        }

        res.json({
            success: true,
            message: 'reCAPTCHA settings updated successfully',
            data: settings
        });
    } catch (error) {
        console.error('Update reCAPTCHA settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update reCAPTCHA settings'
        });
    }
};

// Payment Gateway Controllers
exports.getPaymentGateways = async (req, res) => {
    try {
        const gateways = await PaymentGateway.find().sort({ createdAt: -1 });

        res.json({
            success: true,
            data: gateways
        });
    } catch (error) {
        console.error('Get payment gateways error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch payment gateways'
        });
    }
};

exports.createPaymentGateway = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const {
            name,
            config,
            status,
            testMode
        } = req.body;

        const gateway = new PaymentGateway({
            name,
            config: config || {},
            status: status !== undefined ? status : false,
            testMode: testMode !== undefined ? testMode : true
        });

        await gateway.save();

        res.status(201).json({
            success: true,
            message: 'Payment gateway created successfully',
            data: gateway
        });
    } catch (error) {
        console.error('Create payment gateway error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create payment gateway'
        });
    }
};

exports.updatePaymentGateway = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { id } = req.params;
        const updateData = req.body;

        const gateway = await PaymentGateway.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!gateway) {
            return res.status(404).json({
                success: false,
                message: 'Payment gateway not found'
            });
        }

        res.json({
            success: true,
            message: 'Payment gateway updated successfully',
            data: gateway
        });
    } catch (error) {
        console.error('Update payment gateway error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update payment gateway'
        });
    }
};

exports.deletePaymentGateway = async (req, res) => {
    try {
        const { id } = req.params;

        const gateway = await PaymentGateway.findByIdAndDelete(id);

        if (!gateway) {
            return res.status(404).json({
                success: false,
                message: 'Payment gateway not found'
            });
        }

        res.json({
            success: true,
            message: 'Payment gateway deleted successfully'
        });
    } catch (error) {
        console.error('Delete payment gateway error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete payment gateway'
        });
    }
};

// Existing controllers (for backward compatibility)
exports.listBusinessSettings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const settings = await BusinessSettings.find()
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const total = await BusinessSettings.countDocuments();
        const pages = Math.ceil(total / limit);

        res.json({
            success: true,
            data: settings,
            pagination: {
                page,
                limit,
                total,
                pages
            }
        });
    } catch (error) {
        console.error('List business settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch business settings'
        });
    }
};

exports.getBusinessSettingsById = async (req, res) => {
    try {
        const { id } = req.params;
        const settings = await BusinessSettings.findById(id);

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Business settings not found'
            });
        }

        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Get business settings by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch business settings'
        });
    }
};

exports.deleteBusinessSettings = async (req, res) => {
    try {
        const { id } = req.params;
        const settings = await BusinessSettings.findByIdAndDelete(id);

        if (!settings) {
            return res.status(404).json({
                success: false,
                message: 'Business settings not found'
            });
        }

        res.json({
            success: true,
            message: 'Business settings deleted successfully'
        });
    } catch (error) {
        console.error('Delete business settings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete business settings'
        });
    }
};

// Placeholder controllers for existing endpoints
exports.listSeoPages = async (req, res) => {
    // Implementation for list SEO pages
    res.json({ success: true, data: [], message: 'SEO pages endpoint' });
};

exports.createSeoPage = async (req, res) => {
    // Implementation for create SEO page
    res.status(201).json({ success: true, message: 'SEO page created' });
};

exports.getSeoPageById = async (req, res) => {
    // Implementation for get SEO page by ID
    res.json({ success: true, data: {}, message: 'SEO page details' });
};

exports.updateSeoPage = async (req, res) => {
    // Implementation for update SEO page
    res.json({ success: true, message: 'SEO page updated' });
};

exports.deleteSeoPage = async (req, res) => {
    // Implementation for delete SEO page
    res.json({ success: true, message: 'SEO page deleted' });
};

exports.listTemplates = async (req, res) => {
    // Implementation for list templates
    res.json({ success: true, data: [], message: 'Templates endpoint' });
};

exports.createTemplate = async (req, res) => {
    // Implementation for create template
    res.status(201).json({ success: true, message: 'Template created' });
};

exports.getTemplateById = async (req, res) => {
    // Implementation for get template by ID
    res.json({ success: true, data: {}, message: 'Template details' });
};

exports.updateTemplate = async (req, res) => {
    // Implementation for update template
    res.json({ success: true, message: 'Template updated' });
};

exports.deleteTemplate = async (req, res) => {
    // Implementation for delete template
    res.json({ success: true, message: 'Template deleted' });
};

exports.listMobileConfigs = async (req, res) => {
    // Implementation for list mobile configs
    res.json({ success: true, data: [], message: 'Mobile configs endpoint' });
};

exports.createMobileConfig = async (req, res) => {
    // Implementation for create mobile config
    res.status(201).json({ success: true, message: 'Mobile config created' });
};

exports.getMobileConfigById = async (req, res) => {
    // Implementation for get mobile config by ID
    res.json({ success: true, data: {}, message: 'Mobile config details' });
};

exports.updateMobileConfig = async (req, res) => {
    // Implementation for update mobile config
    res.json({ success: true, message: 'Mobile config updated' });
};

exports.deleteMobileConfig = async (req, res) => {
    // Implementation for delete mobile config
    res.json({ success: true, message: 'Mobile config deleted' });
};

exports.listPaymentConfigs = async (req, res) => {
    // Alias for getPaymentGateways for backward compatibility
    exports.getPaymentGateways(req, res);
};

exports.getPaymentConfigById = async (req, res) => {
    // Implementation for get payment config by ID
    res.json({ success: true, data: {}, message: 'Payment config details' });
};

exports.createPaymentConfig = async (req, res) => {
    // Alias for createPaymentGateway for backward compatibility
    exports.createPaymentGateway(req, res);
};

exports.updatePaymentConfig = async (req, res) => {
    // Alias for updatePaymentGateway for backward compatibility
    exports.updatePaymentGateway(req, res);
};

exports.deletePaymentConfig = async (req, res) => {
    // Alias for deletePaymentGateway for backward compatibility
    exports.deletePaymentGateway(req, res);
};