const { validationResult } = require('express-validator');
const Attribute = require('../../models/productCatalog/attributeModel');

const slugify = (text) =>
    text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/&/g, '-and-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

exports.createAttribute = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, slug, type, values = [], isFilter = true, status = true } = req.body;
        console.log(req.body)
        const finalSlug = slug || slugify(name);
        const exists = await Attribute.findOne({ slug: finalSlug });
        if (exists) return res.status(409).json({ success: false, message: 'Slug already exists' });

        const formattedValues = Array.isArray(values)
            ? values.map(v => (typeof v === 'string' ? { id: v.toLowerCase(), label: v } : v))
            : [];


        const attr = await Attribute.create({ name, slug: finalSlug, type, values : formattedValues, isFilter, status });
        return res.status(201).json({ success: true, data: attr });
    } catch (error) {
        console.error('Create attribute error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getAttribute = async (req, res) => {
    try {
        const { id } = req.params;
        const attr = await Attribute.findById(id);
        if (!attr) return res.status(404).json({ success: false, message: 'Not found' });
        return res.status(200).json({ success: true, data: attr });
    } catch (error) {
        console.error('Get attribute error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.listAttributes = async (req, res) => {
    try {
        const { isFilter, status, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (typeof isFilter !== 'undefined') query.isFilter = isFilter === 'true';
        if (typeof status !== 'undefined') query.status = status === 'true';
        if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { slug: { $regex: search, $options: 'i' } }];

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Attribute.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
            Attribute.countDocuments(query),
        ]);

        return res.status(200).json({ success: true, data: items, page: Number(page), limit: Number(limit), total });
    } catch (error) {
        console.error('List attributes error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateAttribute = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
        if (updates.slug) {
            const exists = await Attribute.findOne({ slug: updates.slug, _id: { $ne: id } });
            if (exists) return res.status(409).json({ success: false, message: 'Slug already exists' });
        }
        const attr = await Attribute.findByIdAndUpdate(id, updates, { new: true });
        if (!attr) return res.status(404).json({ success: false, message: 'Not found' });
        return res.status(200).json({ success: true, data: attr });
    } catch (error) {
        console.error('Update attribute error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteAttribute = async (req, res) => {
    try {
        const { id } = req.params;
        const attr = await Attribute.findByIdAndDelete(id);
        if (!attr) return res.status(404).json({ success: false, message: 'Not found' });
        return res.status(200).json({ success: true, message: 'Attribute deleted' });
    } catch (error) {
        console.error('Delete attribute error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

