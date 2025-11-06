const Product = require('../../models/productCatalog/ProductModel');
const Brand = require('../../models/productCatalog/brandModel');
const Category = require('../../models/productCatalog/categoryModel');
const { deleteUploadedImage } = require('../../utils/upload');

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
        console.log("Creating product - req.body:", req.body);
        console.log("req.processedImage:", req.processedImage);
        console.log("req.processedImages:", req.processedImages);

        const {
            title,
            slug,
            description,
            brandId,
            categoryIds = [],
            type = "simple",
            sku,
            status = true,
            isFeatured = false,
            tags = [],
        } = req.body;

        // Parse array fields
        const parsedCategoryIds = Array.isArray(categoryIds) ? categoryIds :
            (categoryIds ? JSON.parse(categoryIds) : []);

        if (Array.isArray(tags)) {
            parsedTags = tags;
        } else if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                parsedTags = [tags]; // if it's just a plain string like "hy"
            }
        }

        const productSlug = slug || slugify(title);

        // Check for duplicate slug
        const existingSlug = await Product.findOne({ slug: productSlug });
        if (existingSlug) {
            // Clean up uploaded images if duplicate found
            if (req.processedImage) {
                await deleteUploadedImage("products", req.processedImage.filename);
            }
            if (req.processedImages) {
                for (const img of req.processedImages) {
                    await deleteUploadedImage("products", img.filename);
                }
            }
            return res.status(400).json({
                success: false,
                message: "Product with this slug already exists"
            });
        }

        // Check for duplicate SKU
        if (sku) {
            const existingSku = await Product.findOne({ sku });
            if (existingSku) {
                // Clean up uploaded images
                if (req.processedImage) {
                    await deleteUploadedImage("products", req.processedImage.filename);
                }
                if (req.processedImages) {
                    for (const img of req.processedImages) {
                        await deleteUploadedImage("products", img.filename);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: "Product with this SKU already exists"
                });
            }
        }

        // Validate brand
        if (brandId) {
            const brandExists = await Brand.findById(brandId);
            if (!brandExists) {
                // Clean up uploaded images
                if (req.processedImage) {
                    await deleteUploadedImage("products", req.processedImage.filename);
                }
                if (req.processedImages) {
                    for (const img of req.processedImages) {
                        await deleteUploadedImage("products", img.filename);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: "Invalid brandId"
                });
            }
        }

        // Validate categories
        if (parsedCategoryIds.length > 0) {
            const validCategories = await Category.countDocuments({
                _id: { $in: parsedCategoryIds }
            });
            if (validCategories !== parsedCategoryIds.length) {
                // Clean up uploaded images
                if (req.processedImage) {
                    await deleteUploadedImage("products", req.processedImage.filename);
                }
                if (req.processedImages) {
                    for (const img of req.processedImages) {
                        await deleteUploadedImage("products", img.filename);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: "One or more category IDs are invalid"
                });
            }
        }

        // Handle image paths
        const thumbnailPath = req.processedImage?.original || null;
        const galleryImages = req.processedImages?.map(img => img.original) || [];

        // Parse boolean values
        const productStatus = status === "true" || status === true;
        const productIsFeatured = isFeatured === "true" || isFeatured === true;

        // Create product
        const newProduct = await Product.create({
            title: title.trim(),
            slug: productSlug,
            description: description?.trim() || '',
            brandId: brandId || null,
            categoryIds: parsedCategoryIds,
            type,
            sku: sku?.trim() || null,
            thumbnail: thumbnailPath,
            images: galleryImages,
            status: productStatus,
            isFeatured: productIsFeatured,
            tags: parsedTags,
        });

        // Populate references for response
        const populatedProduct = await Product.findById(newProduct._id)
            .populate('brandId', 'name slug')
            .populate('categoryIds', 'name slug')
            .lean();

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            data: populatedProduct,
        });
    } catch (err) {
        console.error("Error creating product:", err);

        // Clean up uploaded images on error
        if (req.processedImage) {
            await deleteUploadedImage("products", req.processedImage.filename);
        }
        if (req.processedImages) {
            for (const img of req.processedImages) {
                await deleteUploadedImage("products", img.filename);
            }
        }

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.getProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const doc = await Product.findById(id)
            .populate('brandId', 'name slug logo')
            .populate('categoryIds', 'name slug')
            .lean();

        if (!doc) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: doc
        });
    } catch (err) {
        console.error("Error fetching product:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
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
        } = req.query;

        // Build query
        const query = {};

        if (typeof status !== 'undefined') query.status = status === 'true';
        if (typeof isFeatured !== 'undefined') query.isFeatured = isFeatured === 'true';
        if (brandId) query.brandId = brandId;
        if (categoryId) query.categoryIds = categoryId;
        if (type) query.type = type;

        // Search in title and description
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        // Get products with population
        const items = await Product.find(query)
            .populate('brandId', 'name slug')
            .populate('categoryIds', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean();

        const total = await Product.countDocuments(query);

        res.json({
            success: true,
            data: {
                items,
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit))
            }
        });
    } catch (err) {
        console.error("Error listing products:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            // Clean up newly uploaded images if product not found
            if (req.processedImage) {
                await deleteUploadedImage("products", req.processedImage.filename);
            }
            if (req.processedImages) {
                for (const img of req.processedImages) {
                    await deleteUploadedImage("products", img.filename);
                }
            }
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const updateData = { ...req.body };

        // Handle slug generation
        if (updateData.title && !updateData.slug) {
            updateData.slug = slugify(updateData.title);
        }

        // Check for duplicate slug (excluding current product)
        if (updateData.slug) {
            const existingSlug = await Product.findOne({
                slug: updateData.slug,
                _id: { $ne: id }
            });
            if (existingSlug) {
                // Clean up newly uploaded images
                if (req.processedImage) {
                    await deleteUploadedImage("products", req.processedImage.filename);
                }
                if (req.processedImages) {
                    for (const img of req.processedImages) {
                        await deleteUploadedImage("products", img.filename);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: "Another product with this slug already exists"
                });
            }
        }

        // Check for duplicate SKU (excluding current product)
        if (updateData.sku) {
            const existingSku = await Product.findOne({
                sku: updateData.sku,
                _id: { $ne: id }
            });
            if (existingSku) {
                // Clean up newly uploaded images
                if (req.processedImage) {
                    await deleteUploadedImage("products", req.processedImage.filename);
                }
                if (req.processedImages) {
                    for (const img of req.processedImages) {
                        await deleteUploadedImage("products", img.filename);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: "Another product with this SKU already exists"
                });
            }
        }

        // Validate brand
        if (updateData.brandId) {
            const brandExists = await Brand.findById(updateData.brandId);
            if (!brandExists) {
                // Clean up newly uploaded images
                if (req.processedImage) {
                    await deleteUploadedImage("products", req.processedImage.filename);
                }
                if (req.processedImages) {
                    for (const img of req.processedImages) {
                        await deleteUploadedImage("products", img.filename);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: 'Invalid brandId'
                });
            }
        }

        // Validate categories
        if (Array.isArray(updateData.categoryIds) && updateData.categoryIds.length) {
            const count = await Category.countDocuments({
                _id: { $in: updateData.categoryIds }
            });
            if (count !== updateData.categoryIds.length) {
                // Clean up newly uploaded images
                if (req.processedImage) {
                    await deleteUploadedImage("products", req.processedImage.filename);
                }
                if (req.processedImages) {
                    for (const img of req.processedImages) {
                        await deleteUploadedImage("products", img.filename);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: 'One or more category IDs are invalid'
                });
            }
        }

        // Handle image updates
        if (req.processedImage?.original) {
            // Delete old thumbnail if exists
            if (existingProduct.thumbnail) {
                const oldFilename = existingProduct.thumbnail.split('/').pop();
                await deleteUploadedImage("products", oldFilename);
            }
            updateData.thumbnail = req.processedImage.original;
        }

        if (req.processedImages && req.processedImages.length > 0) {
            // Delete old gallery images if replacing all
            if (existingProduct.images && existingProduct.images.length > 0) {
                for (const oldImage of existingProduct.images) {
                    const oldFilename = oldImage.split('/').pop();
                    await deleteUploadedImage("products", oldFilename);
                }
            }
            updateData.images = req.processedImages.map(img => img.original);
        }

        // Parse array fields if they are strings
        if (updateData.categoryIds && typeof updateData.categoryIds === 'string') {
            updateData.categoryIds = JSON.parse(updateData.categoryIds);
        }
        if (updateData.tags && typeof updateData.tags === 'string') {
            updateData.tags = JSON.parse(updateData.tags);
        }

        // Parse boolean fields
        if (typeof updateData.status === 'string') {
            updateData.status = updateData.status === 'true';
        }
        if (typeof updateData.isFeatured === 'string') {
            updateData.isFeatured = updateData.isFeatured === 'true';
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('brandId', 'name slug')
            .populate('categoryIds', 'name slug')
            .lean();

        res.json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct
        });
    } catch (err) {
        console.error("Error updating product:", err);

        // Clean up newly uploaded images on error
        if (req.processedImage) {
            await deleteUploadedImage("products", req.processedImage.filename);
        }
        if (req.processedImages) {
            for (const img of req.processedImages) {
                await deleteUploadedImage("products", img.filename);
            }
        }

        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;

        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Delete associated images
        if (product.thumbnail) {
            const thumbFilename = product.thumbnail.split('/').pop();
            await deleteUploadedImage("products", thumbFilename);
        }

        if (product.images && product.images.length > 0) {
            for (const image of product.images) {
                const imageFilename = image.split('/').pop();
                await deleteUploadedImage("products", imageFilename);
            }
        }

        await Product.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Product deleted successfully',
            data: { id }
        });
    } catch (err) {
        console.error("Error deleting product:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};