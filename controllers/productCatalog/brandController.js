const { validationResult } = require('express-validator');
const Brand = require('../../models/productCatalog/brandModel');

const slugify = (text) =>
    text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/&/g, '-and-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

exports.createBrand = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        console.log(req.body)
        const { name, slug, logo, description, website, status = true, isFeatured = false } = req.body;

        const finalSlug = slug || slugify(name);
        const exists = await Brand.findOne({ slug: finalSlug });
        if (exists) return res.status(409).json({ success: false, message: 'Slug already exists' });

        const brand = await Brand.create({ name, slug: finalSlug, logo, description, website, status, isFeatured });
        return res.status(201).json({ success: true, data: brand });
    } catch (error) {
        console.error('Create brand error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.getBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const brand = await Brand.findById(id);
        if (!brand) return res.status(404).json({ success: false, message: 'Not found' });
        return res.status(200).json({ success: true, data: brand });
    } catch (error) {
        console.error('Get brand error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.listBrands = async (req, res) => {
    try {
        const { isFeatured, status, search, page = 1, limit = 20 } = req.query;
        const query = {};
        if (typeof isFeatured !== 'undefined') query.isFeatured = isFeatured === 'true';
        if (typeof status !== 'undefined') query.status = status === 'true';
        if (search) query.$or = [{ name: { $regex: search, $options: 'i' } }, { slug: { $regex: search, $options: 'i' } }];

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Brand.find(query).sort({ name: 1 }).skip(skip).limit(Number(limit)),
            Brand.countDocuments(query),
        ]);

        return res.status(200).json({ success: true, data: items, page: Number(page), limit: Number(limit), total });
    } catch (error) {
        console.error('List brands error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };
        if (updates.name && !updates.slug) updates.slug = slugify(updates.name);
        if (updates.slug) {
            const exists = await Brand.findOne({ slug: updates.slug, _id: { $ne: id } });
            if (exists) return res.status(409).json({ success: false, message: 'Slug already exists' });
        }
        const brand = await Brand.findByIdAndUpdate(id, updates, { new: true });
        if (!brand) return res.status(404).json({ success: false, message: 'Not found' });
        return res.status(200).json({ success: true, data: brand });
    } catch (error) {
        console.error('Update brand error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const brand = await Brand.findByIdAndDelete(id);
        if (!brand) return res.status(404).json({ success: false, message: 'Not found' });
        return res.status(200).json({ success: true, message: 'Brand deleted' });
    } catch (error) {
        console.error('Delete brand error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

