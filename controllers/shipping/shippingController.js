const ShippingRule = require('../../models/shipping/shippingRuleModel');
const ShippingZone = require('../../models/shipping/shippingZoneModel');

/**
 * Get all shipping rules
 */
exports.getAllRules = async (req, res) => {
    try {
        const {status} = req.query;

        let query = {};
        if (status !== undefined) {
            query.status = status === 'true';
        }

        const rules = await ShippingRule.find(query).sort({createdAt: -1});

        return res.status(200).json({
            success: true,
            count: rules.length,
            data: rules
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving shipping rules',
            error: error.message
        });
    }
};

/**
 * Get shipping rule by ID
 */
exports.getRuleById = async (req, res) => {
    try {
        const rule = await ShippingRule.findById(req.params.id);

        if (!rule) {
            return res.status(404).json({
                success: false,
                message: 'Shipping rule not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: rule
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving shipping rule',
            error: error.message
        });
    }
};

/**
 * Create shipping rule
 */
exports.createRule = async (req, res) => {
    try {
        const {title, minOrderValue, maxOrderValue, shippingCost, country, state, postalCodes, status} = req.body;

        const rule = new ShippingRule({
            title,
            minOrderValue: minOrderValue || 0,
            maxOrderValue: maxOrderValue || Number.MAX_SAFE_INTEGER,
            shippingCost,
            country,
            state: state || '',
            postalCodes: postalCodes || [],
            status: status !== undefined ? status : true
        });

        await rule.save();

        return res.status(201).json({
            success: true,
            message: 'Shipping rule created successfully',
            data: rule
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error creating shipping rule',
            error: error.message
        });
    }
};

/**
 * Update shipping rule
 */
exports.updateRule = async (req, res) => {
    try {
        const {title, minOrderValue, maxOrderValue, shippingCost, country, state, postalCodes, status} = req.body;

        const rule = await ShippingRule.findById(req.params.id);

        if (!rule) {
            return res.status(404).json({
                success: false,
                message: 'Shipping rule not found'
            });
        }

        if (title) rule.title = title;
        if (minOrderValue !== undefined) rule.minOrderValue = minOrderValue;
        if (maxOrderValue !== undefined) rule.maxOrderValue = maxOrderValue;
        if (shippingCost !== undefined) rule.shippingCost = shippingCost;
        if (country) rule.country = country;
        if (state !== undefined) rule.state = state;
        if (postalCodes) rule.postalCodes = postalCodes;
        if (status !== undefined) rule.status = status;

        await rule.save();

        return res.status(200).json({
            success: true,
            message: 'Shipping rule updated successfully',
            data: rule
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating shipping rule',
            error: error.message
        });
    }
};

/**
 * Delete shipping rule
 */
exports.deleteRule = async (req, res) => {
    try {
        const rule = await ShippingRule.findById(req.params.id);

        if (!rule) {
            return res.status(404).json({
                success: false,
                message: 'Shipping rule not found'
            });
        }

        await ShippingRule.deleteOne({_id: req.params.id});

        return res.status(200).json({
            success: true,
            message: 'Shipping rule deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting shipping rule',
            error: error.message
        });
    }
};

/**
 * Calculate shipping cost
 */
exports.calculateShipping = async (req, res) => {
    try {
        const {orderValue, country, state, postalCode} = req.body;

        if (!orderValue || !country) {
            return res.status(400).json({
                success: false,
                message: 'Order value and country are required'
            });
        }

        // Find applicable shipping rules
        let query = {
            status: true,
            country,
            minOrderValue: {$lte: orderValue},
            maxOrderValue: {$gte: orderValue}
        };

        if (state) {
            query.state = state;
        }

        let rules = await ShippingRule.find(query);

        // Filter by postal code if provided
        if (postalCode && rules.length > 0) {
            rules = rules.filter(rule => {
                if (rule.postalCodes.length === 0) return true;
                return rule.postalCodes.includes(postalCode);
            });
        }

        // If no specific rules found, try to find a general rule for the country
        if (rules.length === 0) {
            rules = await ShippingRule.find({
                status: true,
                country,
                minOrderValue: {$lte: orderValue},
                maxOrderValue: {$gte: orderValue},
                state: '',
                postalCodes: {$size: 0}
            });
        }

        // If still no rules found, return error
        if (rules.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No shipping rules found for the given criteria'
            });
        }

        // Find the rule with the lowest shipping cost
        const cheapestRule = rules.reduce((prev, curr) => {
            return prev.shippingCost < curr.shippingCost ? prev : curr;
        });

        return res.status(200).json({
            success: true,
            data: {
                shippingCost: cheapestRule.shippingCost,
                ruleId: cheapestRule._id,
                ruleName: cheapestRule.title
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error calculating shipping cost',
            error: error.message
        });
    }
};

/**
 * Get all shipping zones
 */
exports.getAllZones = async (req, res) => {
    try {
        const zones = await ShippingZone.find().sort({zoneName: 1});

        return res.status(200).json({
            success: true,
            count: zones.length,
            data: zones
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving shipping zones',
            error: error.message
        });
    }
};

/**
 * Get shipping zone by ID
 */
exports.getZoneById = async (req, res) => {
    try {
        const zone = await ShippingZone.findById(req.params.id);

        if (!zone) {
            return res.status(404).json({
                success: false,
                message: 'Shipping zone not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: zone
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error retrieving shipping zone',
            error: error.message
        });
    }
};

/**
 * Create shipping zone
 */
exports.createZone = async (req, res) => {
    try {
        const {zoneName, countries, states, pincodes} = req.body;

        const zone = new ShippingZone({
            zoneName,
            countries: countries || [],
            states: states || [],
            pincodes: pincodes || []
        });

        await zone.save();

        return res.status(201).json({
            success: true,
            message: 'Shipping zone created successfully',
            data: zone
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error creating shipping zone',
            error: error.message
        });
    }
};

/**
 * Update shipping zone
 */
exports.updateZone = async (req, res) => {
    try {
        const {zoneName, countries, states, pincodes} = req.body;

        const zone = await ShippingZone.findById(req.params.id);

        if (!zone) {
            return res.status(404).json({
                success: false,
                message: 'Shipping zone not found'
            });
        }

        if (zoneName) zone.zoneName = zoneName;
        if (countries) zone.countries = countries;
        if (states) zone.states = states;
        if (pincodes) zone.pincodes = pincodes;

        await zone.save();

        return res.status(200).json({
            success: true,
            message: 'Shipping zone updated successfully',
            data: zone
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error updating shipping zone',
            error: error.message
        });
    }
};

/**
 * Delete shipping zone
 */
exports.deleteZone = async (req, res) => {
    try {
        const zone = await ShippingZone.findById(req.params.id);

        if (!zone) {
            return res.status(404).json({
                success: false,
                message: 'Shipping zone not found'
            });
        }

        await ShippingZone.deleteOne({_id: req.params.id});

        return res.status(200).json({
            success: true,
            message: 'Shipping zone deleted successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error deleting shipping zone',
            error: error.message
        });
    }
};