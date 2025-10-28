const StockLog = require('../../models/productCatalog/stockLogModel');
const ProductVariant = require('../../models/productCatalog/productVariantModel');
const Product = require('../../models/productCatalog/ProductModel');

exports.createStockLog = async (req, res) => {
    try {
        const { productId, variantId, type, quantity, source, note } = req.body;

        const product = await Product.findById(productId).lean();
        if (!product) return res.status(400).json({ message: 'Invalid productId' });

        let variantDoc = null;
        if (variantId) {
            variantDoc = await ProductVariant.findById(variantId);
            if (!variantDoc) return res.status(400).json({ message: 'Invalid variantId' });
        }

        const log = await StockLog.create({ productId, variantId, type, quantity, source, note });

        // Adjust stock for variant if provided
        if (variantDoc) {
            const delta = type === 'in' ? quantity : -quantity;
            variantDoc.stock = Math.max(0, (variantDoc.stock || 0) + delta);
            await variantDoc.save();
        }

        res.status(201).json(log);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.listStockLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, productId, variantId, source, type, sort = '-createdAt' } = req.query;
        const q = {};
        if (productId) q.productId = productId;
        if (variantId) q.variantId = variantId;
        if (source) q.source = source;
        if (type) q.type = type;

        const skip = (Number(page) - 1) * Number(limit);
        const items = await StockLog.find(q).sort(sort).skip(skip).limit(Number(limit)).lean();
        const total = await StockLog.countDocuments(q);
        res.json({ items, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

