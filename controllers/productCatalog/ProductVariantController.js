const ProductVariant = require('../../models/productCatalog/productVariantModel');
const Product = require('../../models/productCatalog/ProductModel');

exports.createVariant = async (req, res) => {
    try {
        const {productId, sku, attributes = [], price, compareAtPrice, stock = 0, barcode, status = true} = req.body;
        const product = await Product.findById(productId).lean();
        if (!product) return res.status(400).json({message: 'Invalid productId'});

        const doc = await ProductVariant.create({
            productId,
            sku,
            attributes,
            price,
            compareAtPrice,
            stock,
            barcode,
            status
        });
        res.status(201).json(doc);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.getVariant = async (req, res) => {
    try {
        const {id} = req.params;
        const doc = await ProductVariant.findById(id).lean();
        if (!doc) return res.status(404).json({message: 'Variant not found'});
        res.json(doc);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.listVariants = async (req, res) => {
    try {
        const {page = 1, limit = 20, productId, status, search, sort = '-createdAt'} = req.query;
        const q = {};
        if (productId) q.productId = productId;
        if (typeof status !== 'undefined') q.status = String(status) === 'true';
        if (search) q.$or = [{sku: new RegExp(search, 'i')}, {barcode: new RegExp(search, 'i')}];

        const skip = (Number(page) - 1) * Number(limit);
        const items = await ProductVariant.find(q).sort(sort).skip(skip).limit(Number(limit)).lean();
        const total = await ProductVariant.countDocuments(q);
        res.json({items, total, page: Number(page), limit: Number(limit)});
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.updateVariant = async (req, res) => {
    try {
        const {id} = req.params;
        const update = {...req.body};
        const doc = await ProductVariant.findByIdAndUpdate(id, update, {new: true}).lean();
        if (!doc) return res.status(404).json({message: 'Variant not found'});
        res.json(doc);
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

exports.deleteVariant = async (req, res) => {
    try {
        const {id} = req.params;
        const doc = await ProductVariant.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({message: 'Variant not found'});
        res.json({message: 'Variant deleted', id});
    } catch (err) {
        res.status(400).json({message: err.message});
    }
};

