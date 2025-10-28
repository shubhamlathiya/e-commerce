const Tag = require('../../models/productCatalog/TagModel');

function slugify(text) {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

exports.createTag = async (req, res) => {
    try {
        const { name, slug, status = true } = req.body;
        const doc = await Tag.create({ name, slug: slug || slugify(name), status });
        res.status(201).json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getTag = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Tag.findById(id).lean();
        if (!doc) return res.status(404).json({ message: 'Tag not found' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.listTags = async (req, res) => {
    try {
        const { page = 1, limit = 50, status, search, sort = 'name' } = req.query;
        const q = {};
        if (typeof status !== 'undefined') q.status = String(status) === 'true';
        if (search) q.$or = [{ name: new RegExp(search, 'i') }, { slug: new RegExp(search, 'i') }];
        const skip = (Number(page) - 1) * Number(limit);
        const items = await Tag.find(q).sort(sort).skip(skip).limit(Number(limit)).lean();
        const total = await Tag.countDocuments(q);
        res.json({ items, total, page: Number(page), limit: Number(limit) });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.updateTag = async (req, res) => {
    try {
        const { id } = req.params;
        const update = { ...req.body };
        if (update.name && !update.slug) update.slug = slugify(update.name);
        const doc = await Tag.findByIdAndUpdate(id, update, { new: true }).lean();
        if (!doc) return res.status(404).json({ message: 'Tag not found' });
        res.json(doc);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteTag = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Tag.findByIdAndDelete(id).lean();
        if (!doc) return res.status(404).json({ message: 'Tag not found' });
        res.json({ message: 'Tag deleted', id });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

