const Product = require('../../models/productCatalog/ProductModel');
const Brand = require('../../models/productCatalog/brandModel');
const Category = require('../../models/productCatalog/categoryModel');

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

exports.createProduct = async (req, res) => {
    try {
        const {
            title,
            slug,
            description,
            brandId,
            categoryIds,
            type = 'simple',
            sku,
            thumbnail,
            status = true,
            isFeatured = false,
            tags = [],
            tenantId,
        } = req.body;

        const productSlug = slug || slugify(title);

        // Optional existence checks
        if (brandId) {
            const brandExists = await Brand.findById(brandId).lean();
            if (!brandExists) return res.status(400).json({ message: 'Invalid brandId' });
        }
        if (Array.isArray(categoryIds) && categoryIds.length) {
            const count = await Category.countDocuments({ _id: { $in: categoryIds } });
            if (count !== categoryIds.length)
                return res.status(400).json({ message: 'One or more categoryIds are invalid' });
        }

        const doc = await Product.create({
            title,
            slug: productSlug,
            description,
            brandId,
            categoryIds,
            type,
            sku,
            thumbnail,
            status,
            isFeatured,
            tags,
            tenantId,
        });
        res.status(201).json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Product.findById(id).lean();
        if (!doc) return res.status(404).json({ message: 'Product not found' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.listProducts = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search,
            brandId,
            categoryId,
            status,
            isFeatured,
            type,
            sort = '-createdAt',
            tenantId,
        } = req.query;

        const q = {};
        if (tenantId) q.tenantId = tenantId;
        if (typeof status !== 'undefined') q.status = String(status) === 'true';
        if (typeof isFeatured !== 'undefined') q.isFeatured = String(isFeatured) === 'true';
        if (brandId) q.brandId = brandId;
        if (categoryId) q.categoryIds = categoryId;
        if (type) q.type = type;
        if (search) q.$text = { $search: search };

        const skip = (Number(page) - 1) * Number(limit);
        const items = await Product.find(q)
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean();
        const total = await Product.countDocuments(q);
        res.json({ items, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const update = { ...req.body };
        if (update.title && !update.slug) update.slug = slugify(update.title);

        if (update.brandId) {
            const brandExists = await Brand.findById(update.brandId).lean();
            if (!brandExists) return res.status(400).json({ message: 'Invalid brandId' });
        }
        if (Array.isArray(update.categoryIds) && update.categoryIds.length) {
            const count = await Category.countDocuments({ _id: { $in: update.categoryIds } });
            if (count !== update.categoryIds.length)
                return res.status(400).json({ message: 'One or more categoryIds are invalid' });
        }

        const doc = await Product.findByIdAndUpdate(id, update, { new: true }).lean();
        if (!doc) return res.status(404).json({ message: 'Product not found' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Product.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted', id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

