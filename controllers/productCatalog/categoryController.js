const {validationResult} = require('express-validator');
const Category = require('../../models/productCatalog/categoryModel');
const { deleteUploadedImage } = require('../../utils/upload');

const slugify = (text) =>
    text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/&/g, '-and-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-');

exports.createCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({success: false, errors: errors.array()});
        }

        const {
            name,
            slug,
            parentId = null,
            icon,
            image,
            status = true,
            sortOrder = 0,
            isFeatured = false,
            metaTitle,
            metaDescription,
        } = req.body;

        let finalSlug = slug || slugify(name);
        // Ensure slug uniqueness
        const existingSlug = await Category.findOne({slug: finalSlug});
        if (existingSlug) {
            return res.status(409).json({success: false, message: 'Slug already exists'});
        }

        // Validate parent
        let level = 0;
        if (parentId) {
            const parent = await Category.findById(parentId);
            if (!parent) {
                return res.status(400).json({success: false, message: 'Invalid parentId'});
            }
            level = parent.level + 1;
        }

        const category = await Category.create({
            name,
            slug: finalSlug,
            parentId: parentId || null,
            level,
            icon: (req.processedCategoryIcon?.original || icon) || null,
            image: (req.processedCategoryImage?.original || image) || null,
            status,
            sortOrder,
            isFeatured,
            metaTitle,
            metaDescription,
        });

        return res.status(201).json({success: true, data: category});
    } catch (error) {
        console.error('Create category error:', error);
        return res.status(500).json({success: false, message: 'Server error'});
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const {id} = req.params;
        const category = await Category.findById(id);
        if (!category) return res.status(404).json({success: false, message: 'Not found'});
        return res.status(200).json({success: true, data: category});
    } catch (error) {
        console.error('Get category error:', error);
        return res.status(500).json({success: false, message: 'Server error'});
    }
};

exports.listCategories = async (req, res) => {
    try {
        const {
            parentId,
            status,
            level,
            isFeatured,
            search,
            page = 1,
            limit = 20,
            sort = 'sortOrder:asc,name:asc',
        } = req.query;

        const query = {};
        if (parentId === 'null') query.parentId = null;
        else if (parentId) query.parentId = parentId;
        if (typeof status !== 'undefined') query.status = status === 'true';
        if (typeof isFeatured !== 'undefined') query.isFeatured = isFeatured === 'true';
        if (typeof level !== 'undefined') query.level = Number(level);
        if (search) {
            query.$or = [
                {name: {$regex: search, $options: 'i'}},
                {slug: {$regex: search, $options: 'i'}},
            ];
        }

        const [sortField1, sortField2] = (sort || '').split(',');
        const sortObj = {};
        [sortField1, sortField2].forEach((f) => {
            if (!f) return;
            const [key, dir] = f.split(':');
            sortObj[key] = dir === 'desc' ? -1 : 1;
        });

        const skip = (Number(page) - 1) * Number(limit);
        const [items, total] = await Promise.all([
            Category.find(query).sort(sortObj).skip(skip).limit(Number(limit)),
            Category.countDocuments(query),
        ]);

        return res.status(200).json({success: true, data: items, page: Number(page), limit: Number(limit), total});
    } catch (error) {
        console.error('List categories error:', error);
        return res.status(500).json({success: false, message: 'Server error'});
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const {id} = req.params;
        const updates = {...req.body};

        if (updates.name && !updates.slug) {
            updates.slug = slugify(updates.name);
        }
        if (updates.slug) {
            const exists = await Category.findOne({slug: updates.slug, _id: {$ne: id}});
            if (exists) return res.status(409).json({success: false, message: 'Slug already exists'});
        }

        if (typeof updates.parentId !== 'undefined') {
            if (updates.parentId) {
                const parent = await Category.findById(updates.parentId);
                if (!parent) return res.status(400).json({success: false, message: 'Invalid parentId'});
                updates.level = parent.level + 1;
            } else {
                updates.level = 0;
                updates.parentId = null;
            }
        }

        // Handle uploaded media replacements
        const existing = await Category.findById(id);
        if (!existing) return res.status(404).json({success: false, message: 'Not found'});

        if (req.processedCategoryImage?.original) {
            if (existing.image) {
                const oldFilename = String(existing.image).split('/').pop();
                await deleteUploadedImage('categories', oldFilename);
            }
            updates.image = req.processedCategoryImage.original;
        }

        if (req.processedCategoryIcon?.original) {
            if (existing.icon) {
                const oldIconFilename = String(existing.icon).split('/').pop();
                await deleteUploadedImage('categories', oldIconFilename);
            }
            updates.icon = req.processedCategoryIcon.original;
        }

        const category = await Category.findByIdAndUpdate(id, updates, {new: true});
        if (!category) return res.status(404).json({success: false, message: 'Not found'});
        return res.status(200).json({success: true, data: category});
    } catch (error) {
        console.error('Update category error:', error);
        return res.status(500).json({success: false, message: 'Server error'});
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const {id} = req.params;
        const {cascade = 'false'} = req.query;
        const category = await Category.findById(id);
        if (!category) return res.status(404).json({success: false, message: 'Not found'});

        const children = await Category.find({parentId: id});
        if (children.length > 0 && cascade !== 'true') {
            return res.status(409).json({
                success: false,
                message: 'Category has children. Pass cascade=true to delete subtree.',
                childrenCount: children.length,
            });
        }

        if (cascade === 'true') {
            // Delete subtree: BFS
            const queue = [id];
            const toDelete = [];
            while (queue.length) {
                const current = queue.shift();
                toDelete.push(current);
                const subs = await Category.find({parentId: current}).select('_id');
                subs.forEach((c) => queue.push(c._id.toString()));
            }
            await Category.deleteMany({_id: {$in: toDelete}});
        } else {
            await Category.findByIdAndDelete(id);
        }

        return res.status(200).json({success: true, message: 'Category deleted'});
    } catch (error) {
        console.error('Delete category error:', error);
        return res.status(500).json({success: false, message: 'Server error'});
    }
};

exports.getTree = async (req, res) => {
    try {
        const {parentId = null, maxDepth = 5} = req.query;

        // Load all categories once for building tree in memory
        const all = await Category.find({}).sort({sortOrder: 1, name: 1}).lean();
        const byParent = new Map();
        all.forEach((c) => {
            const key = c.parentId ? c.parentId.toString() : 'null';
            if (!byParent.has(key)) byParent.set(key, []);
            byParent.get(key).push(c);
        });

        const build = (pid, depth) => {
            if (depth > maxDepth) return [];
            const key = pid ? pid.toString() : 'null';
            const children = byParent.get(key) || [];
            return children.map((c) => ({
                ...c,
                children: build(c._id, depth + 1),
            }));
        };

        const tree = build(parentId ? parentId : null, 0);
        return res.status(200).json({success: true, data: tree});
    } catch (error) {
        console.error('Get tree error:', error);
        return res.status(500).json({success: false, message: 'Server error'});
    }
};

exports.getBreadcrumbs = async (req, res) => {
    try {
        const {id} = req.params;
        const category = await Category.findById(id);
        if (!category) return res.status(404).json({success: false, message: 'Not found'});
        const path = await category.getPath();
        return res.status(200).json({success: true, data: path});
    } catch (error) {
        console.error('Get breadcrumbs error:', error);
        return res.status(500).json({success: false, message: 'Server error'});
    }
};

