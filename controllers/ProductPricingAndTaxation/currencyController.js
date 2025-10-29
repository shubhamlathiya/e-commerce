const CurrencyRate = require('../../models/productPricingAndTaxation/currencyRateModel');

exports.upsertRate = async (req, res) => {
    try {
        const { from, to, rate } = req.body;
        const doc = await CurrencyRate.findOneAndUpdate(
            { from, to },
            { from, to, rate },
            { upsert: true, new: true, runValidators: true }
        ).lean();
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getRate = async (req, res) => {
    try {
        const { from, to } = req.query;
        const doc = await CurrencyRate.findOne({ from, to }).lean();
        if (!doc) return res.status(404).json({ message: 'Rate not found' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.listRates = async (req, res) => {
    try {
        const items = await CurrencyRate.find({}).sort({ updatedAt: -1 }).lean();
        res.json(items);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteRate = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await CurrencyRate.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({ message: 'Rate not found' });
        res.json({ message: 'Rate deleted', id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

