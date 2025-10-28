const ProductSeo = require('../../models/productCatalog/productSeoModel');
const Product = require('../../models/productCatalog/ProductModel');

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

exports.getSeo = async (req, res) => {
    try {
        const { productId } = req.params;
        const doc = await ProductSeo.findOne({ productId }).lean();
        if (!doc) return res.status(404).json({ message: 'SEO not found' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.upsertSeo = async (req, res) => {
    try {
        const { productId } = req.params;
        const product = await Product.findById(productId).lean();
        if (!product) return res.status(400).json({ message: 'Invalid productId' });

        const { metaTitle, metaDescription, keywords, slug, canonicalUrl } = req.body;
        const seoSlug = slug || slugify(product.title);

        const doc = await ProductSeo.findOneAndUpdate(
            { productId },
            { productId, metaTitle, metaDescription, keywords, slug: seoSlug, canonicalUrl },
            { upsert: true, new: true }
        ).lean();
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteSeo = async (req, res) => {
    try {
        const { productId } = req.params;
        const doc = await ProductSeo.findOneAndDelete({ productId }).lean();
        if (!doc) return res.status(404).json({ message: 'SEO not found' });
        res.json({ message: 'SEO deleted', productId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

