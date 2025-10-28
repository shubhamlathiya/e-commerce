const ProductFaq = require('../../models/productCatalog/productFaqModel');
const Product = require('../../models/productCatalog/ProductModel');

exports.createFaq = async (req, res) => {
    try {
        const { productId, question, answer } = req.body;
        const product = await Product.findById(productId).lean();
        if (!product) return res.status(400).json({ message: 'Invalid productId' });
        const doc = await ProductFaq.create({ productId, question, answer });
        res.status(201).json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.listFaqs = async (req, res) => {
    try {
        const { productId, page = 1, limit = 50, sort = '-createdAt' } = req.query;
        const q = {};
        if (productId) q.productId = productId;
        const skip = (Number(page) - 1) * Number(limit);
        const items = await ProductFaq.find(q).sort(sort).skip(skip).limit(Number(limit)).lean();
        const total = await ProductFaq.countDocuments(q);
        res.json({ items, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getFaq = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await ProductFaq.findById(id).lean();
        if (!doc) return res.status(404).json({ message: 'FAQ not found' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateFaq = async (req, res) => {
    try {
        const { id } = req.params;
        const update = { ...req.body };
        const doc = await ProductFaq.findByIdAndUpdate(id, update, { new: true }).lean();
        if (!doc) return res.status(404).json({ message: 'FAQ not found' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteFaq = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await ProductFaq.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({ message: 'FAQ not found' });
        res.json({ message: 'FAQ deleted', id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

