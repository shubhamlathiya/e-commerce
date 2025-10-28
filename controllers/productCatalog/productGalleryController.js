const ProductGallery = require('../../models/productCatalog/productGalleryModel');
const Product = require('../../models/productCatalog/ProductModel');

exports.getGallery = async (req, res) => {
    try {
        const { productId } = req.params;
        const doc = await ProductGallery.findOne({ productId }).lean();
        if (!doc) return res.status(404).json({ message: 'Gallery not found' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.setGallery = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId).lean();
        if (!product) return res.status(400).json({ message: 'Invalid productId' });
        const { images = [] } = req.body;
        const doc = await ProductGallery.findOneAndUpdate(
            { productId },
            { productId, images },
            { upsert: true, new: true }
        ).lean();
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteGallery = async (req, res) => {
    try {
        const { productId } = req.params;
        const doc = await ProductGallery.findOneAndDelete({ productId }).lean();
        if (!doc) return res.status(404).json({ message: 'Gallery not found' });
        res.json({ message: 'Gallery deleted', productId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

