const { validationResult } = require('express-validator');
const Brand = require('../../models/productCatalog/brandModel');
const { processImage, UPLOAD_DIR } = require("../../utils/upload"); // your upload helper
const fs = require("fs");
const path = require("path");

const slugify = (text) =>
    text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/&/g, '-and-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');

exports.createBrand = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const {
            name,
            slug,
            logo, // may come as URL or plain text
            description,
            website,
            status = true,
            isFeatured = false,
        } = req.body;

        const finalSlug = slug || slugify(name);
        const exists = await Brand.findOne({ slug: finalSlug });
        if (exists) {
            return res.status(409).json({ success: false, message: "Slug already exists" });
        }

        let finalLogoPath = null;
        const brandUploadPath = path.join(UPLOAD_DIR, "brands");

        // ------------------------------------------
        // CASE 1: Uploaded file (multer)
        // ------------------------------------------
        if (req.brandLogo?.path) {
            finalLogoPath = req.brandLogo.path;
        }

            // ------------------------------------------
            // CASE 2: External URL
        // ------------------------------------------
        else if (logo && /^https?:\/\/.+/i.test(logo)) {
            const fileExt = path.extname(new URL(logo).pathname) || ".jpg";
            const fileName = `brand-${Date.now()}${fileExt}`;
            const filePath = path.join(brandUploadPath, fileName);

            if (!fs.existsSync(brandUploadPath)) {
                fs.mkdirSync(brandUploadPath, { recursive: true });
            }

            const response = await axios.get(logo, { responseType: "arraybuffer" });
            fs.writeFileSync(filePath, response.data);

            finalLogoPath = `/uploads/brands/${fileName}`;
        }

            // ------------------------------------------
            // CASE 3: Plain text value (fallback)
        // ------------------------------------------
        else if (logo && !/^blob:/i.test(logo)) {
            finalLogoPath = logo.trim();
        }

        // Create brand
        const brand = await Brand.create({
            name,
            slug: finalSlug,
            logo: finalLogoPath,
            description,
            website,
            status,
            isFeatured,
        });

        return res.status(201).json({
            success: true,
            message: "Brand created successfully",
            data: brand,
        });

    } catch (error) {
        console.error("Create brand error:", error);
        return res.status(500).json({
            success: false,
            message: "Server error while creating brand",
        });
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

        const existingBrand = await Brand.findById(id);
        if (!existingBrand) {
            return res.status(404).json({ success: false, message: 'Not found' });
        }

        // Slug logic
        if (updates.name && !updates.slug) {
            updates.slug = slugify(updates.name);
        }

        if (updates.slug) {
            const exists = await Brand.findOne({
                slug: updates.slug,
                _id: { $ne: id }
            });
            if (exists) {
                return res.status(409).json({
                    success: false,
                    message: 'Slug already exists'
                });
            }
        }

        let newLogoPath = null;

        // --------------------------------------------------
        // CASE 1: Uploaded logo (multer)
        // --------------------------------------------------
        if (req.brandLogo?.path) {
            newLogoPath = req.brandLogo.path;

            // Delete old logo file if exists
            if (existingBrand.logo) {
                const oldFilename = existingBrand.logo.split("/").pop();
                await deleteUploadedImage("brands", oldFilename);
            }
        }

            // --------------------------------------------------
            // CASE 2: External image URL
        // --------------------------------------------------
        else if (updates.logo && /^https?:\/\/.+/i.test(updates.logo)) {
            const brandUploadPath = path.join(UPLOAD_DIR, "brands");
            const fileExt = path.extname(new URL(updates.logo).pathname) || ".jpg";
            const fileName = `brand-${Date.now()}${fileExt}`;
            const filePath = path.join(brandUploadPath, fileName);

            if (!fs.existsSync(brandUploadPath)) {
                fs.mkdirSync(brandUploadPath, { recursive: true });
            }

            const response = await axios.get(updates.logo, { responseType: "arraybuffer" });
            fs.writeFileSync(filePath, response.data);

            newLogoPath = `/uploads/brands/${fileName}`;

            // Delete old logo
            if (existingBrand.logo) {
                const oldFilename = existingBrand.logo.split("/").pop();
                await deleteUploadedImage("brands", oldFilename);
            }
        }

            // --------------------------------------------------
            // CASE 3: Plain text assigned directly
        // --------------------------------------------------
        else if (updates.logo && !/^blob:/i.test(updates.logo)) {
            newLogoPath = updates.logo.trim();
        }

        // Apply final logo value
        if (newLogoPath !== null) {
            updates.logo = newLogoPath;
        }

        const updatedBrand = await Brand.findByIdAndUpdate(id, updates, { new: true });

        return res
            .status(200)
            .json({ success: true, data: updatedBrand });

    } catch (error) {
        console.error('Update brand error:', error);
        return res
            .status(500)
            .json({ success: false, message: 'Server error' });
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

