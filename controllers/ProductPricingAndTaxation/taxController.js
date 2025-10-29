const TaxRule = require('../../models/productPricingAndTaxation/taxRuleModel');

exports.createTaxRule = async (req, res) => {
    try {
        const doc = await TaxRule.create(req.body);
        res.status(201).json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.listTaxRules = async (req, res) => {
    try {
        const { country, state, status } = req.query;
        const q = {};
        if (country) q.country = country;
        if (state) q.state = state;
        if (typeof status !== 'undefined') q.status = String(status) === 'true';
        const items = await TaxRule.find(q).sort({ name: 1 }).lean();
        res.json(items);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateTaxRule = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await TaxRule.findByIdAndUpdate(id, req.body, { new: true }).lean();
        if (!doc) return res.status(404).json({ message: 'Tax rule not found' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteTaxRule = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await TaxRule.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({ message: 'Tax rule not found' });
        res.json({ message: 'Tax rule deleted', id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

