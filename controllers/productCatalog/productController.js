const Product = require('../../models/productCatalog/ProductModel');
const Brand = require('../../models/productCatalog/brandModel');
const Category = require('../../models/productCatalog/categoryModel');
const ProductVariant = require('../../models/productCatalog/productVariantModel');
const ProductFaq = require('../../models/productCatalog/productFaqModel');
const ProductGallery = require('../../models/productCatalog/productGalleryModel');
const ProductSeo = require('../../models/productCatalog/productSeoModel');
const ProductPricing = require('../../models/productPricingAndTaxation/productPricingModel');
const TierPricing = require('../../models/productPricingAndTaxation/tierPricingModel');
const SpecialPricing = require('../../models/productPricingAndTaxation/specialPricingModel');
const StockLog = require('../../models/productCatalog/stockLogModel');
const Variant = require('../../models/productCatalog/productVariantModel');
const FlashSale = require('../../models/offersAndDiscounts/flashSaleModel');
const {deleteUploadedImage} = require('../../utils/upload');
const {startSession} = require("mongoose");


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
        // console.log("req.processedImage:", req.processedImage);
        // console.log("req.processedImages:", req.processedImages);

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
            // Pricing fields
            basePrice,
            discountType,
            discountValue = 0,
            currency = 'INR',
            // Stock fields (for simple products)
            stock = 0,
            compareAtPrice,
            barcode,
            // Variant data (for variant products)
            variants = []
        } = req.body;

        // Parse category IDs
        let parsedCategoryIds = [];
        if (Array.isArray(categoryIds)) {
            parsedCategoryIds = categoryIds;
        } else if (typeof categoryIds === 'string') {
            if (categoryIds.trim().startsWith('[') || categoryIds.trim().startsWith('{')) {
                try {
                    parsedCategoryIds = JSON.parse(categoryIds);
                } catch (err) {
                    parsedCategoryIds = [categoryIds];
                }
            } else {
                parsedCategoryIds = [categoryIds];
            }
        }

        // Parse tags
        let parsedTags = [];
        if (Array.isArray(tags)) {
            parsedTags = tags;
        } else if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            } catch (e) {
                parsedTags = [tags];
            }
        }

        // Parse variants if it's a string (from FormData)
        let parsedVariants = [];
        if (type === 'variant') {
            if (Array.isArray(variants)) {
                parsedVariants = variants;
            } else if (typeof variants === 'string') {
                try {
                    parsedVariants = JSON.parse(variants);
                } catch (err) {
                    console.error("Error parsing variants JSON:", err);
                    throw new Error('Invalid variants data format');
                }
            }

            // Validate that we have variants for variant products
            if (!Array.isArray(parsedVariants) || parsedVariants.length === 0) {
                throw new Error('Variants array is required for variant products');
            }
        }

        const productSlug = slug || slugify(title);

        // Check for duplicate slug
        const existingSlug = await Product.findOne({ slug: productSlug });
        if (existingSlug) {
            await cleanupUploadedImages(req);
            return res.status(400).json({
                success: false,
                message: "Product with this slug already exists"
            });
        }

        // Check for duplicate SKU
        if (sku) {
            const existingSku = await Product.findOne({ sku });
            if (existingSku) {
                await cleanupUploadedImages(req);
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
                await cleanupUploadedImages(req);
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
                await cleanupUploadedImages(req);
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

        // Create main product
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

        // Handle product creation based on type
        if (type === 'simple') {
            await handleSimpleProductCreation(newProduct, {
                basePrice,
                discountType,
                discountValue,
                currency,
                stock,
                compareAtPrice,
                barcode
            });
        } else if (type === 'variant') {
            await handleVariantProductCreation(newProduct, parsedVariants);
        }

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
        await cleanupUploadedImages(req);

        return res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
// Helper function for simple product creation
async function handleSimpleProductCreation(product, pricingData) {
    const { basePrice, discountType, discountValue, currency, stock, compareAtPrice, barcode, attributes } = pricingData;

    // Validate required pricing data for simple products
    if (!basePrice && basePrice !== 0) {
        throw new Error('basePrice is required for simple products');
    }

    // Generate SKU if not provided
    const variantSku = product.sku || `SKU-${product.slug}-${Date.now()}`;

    // Create product variant for simple product
    const variant = await ProductVariant.create({
        productId: product._id,
        sku: variantSku,
        attributes: attributes || [], // Use provided attributes or empty array
        price: basePrice, // Store base price in variant
        compareAtPrice: compareAtPrice || null,
        stock: parseInt(stock) || 0,
        barcode: barcode || null,
        status: product.status
    });

    // Create pricing record
    await ProductPricing.create({
        productId: product._id,
        variantId: variant._id, // Link to the created variant
        basePrice: parseFloat(basePrice),
        discountType: discountType || null,
        discountValue: parseFloat(discountValue) || 0,
        finalPrice: computeFinalPrice(basePrice, discountType, discountValue),
        currency: currency || 'INR',
        status: product.status
    });
}

// Helper function for variant product creation
async function handleVariantProductCreation(product, variants) {
    // console.log("Processing variants:", JSON.stringify(variants, null, 2));

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
        throw new Error('Variants array is required for variant products');
    }

    // Check for duplicate SKUs in variants
    const variantSkus = variants.map(v => v.sku).filter(Boolean);
    const uniqueSkus = new Set(variantSkus);
    if (variantSkus.length !== uniqueSkus.size) {
        throw new Error('Duplicate SKUs found in variants');
    }

    // Check for existing SKUs in database
    const existingVariants = await ProductVariant.find({
        sku: { $in: variantSkus }
    });

    if (existingVariants.length > 0) {
        throw new Error('One or more variant SKUs already exist');
    }

    // Create variants and pricing records
    for (const variantData of variants) {
        // console.log("Processing variant:", variantData.sku);
        // console.log("Variant attributes:", variantData.attributes, "Type:", typeof variantData.attributes);

        let { sku, attributes, price, compareAtPrice, stock, barcode, basePrice, discountType, discountValue = 0, currency = 'INR' } = variantData;

        if (!sku || (price === undefined && basePrice === undefined)) {
            throw new Error('SKU and price are required for each variant');
        }

        // Parse attributes if it's a string
        let parsedAttributes = [];
        if (Array.isArray(attributes)) {
            parsedAttributes = attributes;
        } else if (typeof attributes === 'string') {
            try {
                parsedAttributes = JSON.parse(attributes);
            } catch (err) {
                console.error("Error parsing attributes JSON:", err);
                // If parsing fails, try to handle it as a simple string
                parsedAttributes = [];
            }
        }

        // Ensure attributes have the correct structure for Mongoose
        const validAttributes = parsedAttributes.map(attr => {
            if (typeof attr === 'object' && attr !== null && attr.name && attr.value) {
                return {
                    name: String(attr.name || ''),
                    value: String(attr.value || '')
                };
            }
            return null;
        }).filter(attr => attr !== null);

        console.log("Valid attributes:", validAttributes);

        // Use price if basePrice not provided
        const actualBasePrice = basePrice !== undefined ? basePrice : price;
        const actualPrice = price !== undefined ? price : computeFinalPrice(actualBasePrice, discountType, discountValue);

        // Create variant
        const variant = await ProductVariant.create({
            productId: product._id,
            sku: sku.trim(),
            attributes: validAttributes,
            price: parseFloat(actualPrice),
            compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : null,
            stock: parseInt(stock) || 0,
            barcode: barcode || null,
            status: product.status
        });

        // console.log("Variant created:", variant._id);

        // Create pricing record for variant
        await ProductPricing.create({
            productId: product._id,
            variantId: variant._id,
            basePrice: parseFloat(actualBasePrice),
            discountType: discountType || null,
            discountValue: parseFloat(discountValue) || 0,
            finalPrice: computeFinalPrice(actualBasePrice, discountType, discountValue),
            currency: currency || 'INR',
            status: product.status
        });
    }
}

// Helper function to compute final price
function computeFinalPrice(basePrice, discountType, discountValue) {
    let price = parseFloat(basePrice);
    if (discountType === 'flat') {
        price = Math.max(0, price - parseFloat(discountValue || 0));
    } else if (discountType === 'percent') {
        price = price * (1 - Math.min(100, parseFloat(discountValue || 0)) / 100);
    }
    return Number(price.toFixed(2));
}

// Helper function to clean up uploaded images
async function cleanupUploadedImages(req) {
    try {
        if (req.processedImage) {
            await deleteUploadedImage("products", req.processedImage.filename);
        }
        if (req.processedImages) {
            for (const img of req.processedImages) {
                await deleteUploadedImage("products", img.filename);
            }
        }
    } catch (error) {
        console.error("Error cleaning up uploaded images:", error);
    }
}

exports.getProduct = async (req, res) => {
    try {
        const {id} = req.params;

        // Fetch product with brand and category populated
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

        // Fetch related variants for this product
        const variants = await Variant.find({productId: id})
            .select('name price stock sku attributes images')
            .lean();

        // Add computed price info
        let minPrice = null;
        let maxPrice = null;

        if (variants.length > 0) {
            const prices = variants.map(v => v.price);
            minPrice = Math.min(...prices);
            maxPrice = Math.max(...prices);
        } else if (doc.price) {
            minPrice = maxPrice = doc.price;
        }

        // Merge variant and price details into product response
        const productData = {
            ...doc,
            priceRange: {
                min: minPrice,
                max: maxPrice
            },
            variants
        };

        res.json({
            success: true,
            data: productData
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

        // Build query filters
        const query = {};

        if (typeof status !== 'undefined') query.status = status === 'true';
        if (typeof isFeatured !== 'undefined') query.isFeatured = isFeatured === 'true';
        if (brandId) query.brandId = brandId;
        if (categoryId) query.categoryIds = categoryId;
        if (type) query.type = type;

        // Handle text search
        if (search) {
            query.$or = [
                {title: {$regex: search, $options: 'i'}},
                {description: {$regex: search, $options: 'i'}},
            ];
        }

        const skip = (Number(page) - 1) * Number(limit);

        // Fetch products
        const products = await Product.find(query)
            .populate('brandId', 'name slug')
            .populate('categoryIds', 'name slug')
            .sort(sort)
            .skip(skip)
            .limit(Number(limit))
            .lean();

        // Get total count
        const total = await Product.countDocuments(query);

        // Fetch related pricing and variants in parallel
        const productIds = products.map(p => p._id);

        const [pricingList, variantsList] = await Promise.all([
            ProductPricing.find({productId: {$in: productIds}, status: true})
                .select('productId variantId basePrice finalPrice discountType discountValue')
                .lean(),
            Variant.find({productId: {$in: productIds}})
                .select('productId name sku attributes stock status')
                .lean(),
        ]);

        // Map and merge pricing + variants with products
        const items = products.map(product => {
            const productVariants = variantsList.filter(v => v.productId.toString() === product._id.toString());
            const productPricing = pricingList.filter(p => p.productId.toString() === product._id.toString());

            // Find default or base pricing (variantId = null)
            const basePrice = productPricing.find(p => !p.variantId);
            const finalPrice = basePrice ? basePrice.finalPrice : null;

            return {
                ...product,
                basePrice: basePrice ? basePrice.basePrice : null,
                finalPrice: finalPrice,
                discount: basePrice
                    ? {
                        type: basePrice.discountType || null,
                        value: basePrice.discountValue || 0,
                    }
                    : null,
                variants: productVariants.map(v => {
                    const variantPrice = productPricing.find(p => p.variantId?.toString() === v._id.toString());
                    return {
                        ...v,
                        basePrice: variantPrice ? variantPrice.price : basePrice?.basePrice || null,
                        finalPrice: variantPrice ? variantPrice.finalPrice : basePrice?.finalPrice || null,
                    };
                }),
            };
        });

        // console.log(items)
        // Response
        return res.status(200).json({
            success: true,
            data: {
                items,
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / Number(limit)),
            },
        });
    } catch (err) {
        console.error('Error listing products:', err);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: err.message,
        });
    }
};


exports.updateProduct = async (req, res) => {
    try {
        const {id} = req.params;
        // console.log("Updating product - req.body:", req.body);

        // Check if product exists
        const existingProduct = await Product.findById(id);
        if (!existingProduct) {
            if (req.processedImage) await deleteUploadedImage("products", req.processedImage.filename);
            if (req.processedImages) {
                for (const img of req.processedImages) {
                    await deleteUploadedImage("products", img.filename);
                }
            }
            return res.status(404).json({
                success: false,
                message: "Product not found",
            });
        }

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

        // -------- Parse arrays safely --------
        let parsedCategoryIds = [];
        if (Array.isArray(categoryIds)) {
            parsedCategoryIds = categoryIds;
        } else if (typeof categoryIds === "string") {
            if (categoryIds.trim().startsWith("[") || categoryIds.trim().startsWith("{")) {
                try {
                    parsedCategoryIds = JSON.parse(categoryIds);
                } catch {
                    parsedCategoryIds = [categoryIds];
                }
            } else {
                parsedCategoryIds = [categoryIds];
            }
        }

        let parsedTags = [];
        if (Array.isArray(tags)) {
            parsedTags = tags;
        } else if (tags) {
            try {
                parsedTags = JSON.parse(tags);
            } catch {
                parsedTags = [tags];
            }
        }

        // -------- Parse boolean values --------
        const productStatus = status === "true" || status === true;
        const productIsFeatured = isFeatured === "true" || isFeatured === true;

        // -------- Generate or validate slug --------
        const productSlug = slug || slugify(title);

        // Check duplicate slug (excluding same product)
        const existingSlug = await Product.findOne({
            slug: productSlug,
            _id: {$ne: id},
        });
        if (existingSlug) {
            if (req.processedImage) await deleteUploadedImage("products", req.processedImage.filename);
            if (req.processedImages) {
                for (const img of req.processedImages) {
                    await deleteUploadedImage("products", img.filename);
                }
            }
            return res.status(400).json({
                success: false,
                message: "Another product with this slug already exists",
            });
        }

        // Check duplicate SKU (excluding same product)
        if (sku) {
            const existingSku = await Product.findOne({
                sku,
                _id: {$ne: id},
            });
            if (existingSku) {
                if (req.processedImage) await deleteUploadedImage("products", req.processedImage.filename);
                if (req.processedImages) {
                    for (const img of req.processedImages) {
                        await deleteUploadedImage("products", img.filename);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: "Another product with this SKU already exists",
                });
            }
        }

        // -------- Validate brand --------
        if (brandId) {
            const brandExists = await Brand.findById(brandId);
            if (!brandExists) {
                if (req.processedImage) await deleteUploadedImage("products", req.processedImage.filename);
                if (req.processedImages) {
                    for (const img of req.processedImages) {
                        await deleteUploadedImage("products", img.filename);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: "Invalid brandId",
                });
            }
        }

        // -------- Validate categories --------
        if (parsedCategoryIds.length > 0) {
            const validCategories = await Category.countDocuments({
                _id: {$in: parsedCategoryIds},
            });
            if (validCategories !== parsedCategoryIds.length) {
                if (req.processedImage) await deleteUploadedImage("products", req.processedImage.filename);
                if (req.processedImages) {
                    for (const img of req.processedImages) {
                        await deleteUploadedImage("products", img.filename);
                    }
                }
                return res.status(400).json({
                    success: false,
                    message: "One or more category IDs are invalid",
                });
            }
        }

        // -------- Handle images --------
        const thumbnailPath = req.processedImage?.original || existingProduct.thumbnail;
        const galleryImages =
            req.processedImages?.map((img) => img.original) || existingProduct.images || [];

        // Delete old images only if replaced
        if (req.processedImage?.original && existingProduct.thumbnail) {
            const oldFilename = existingProduct.thumbnail.split("/").pop();
            await deleteUploadedImage("products", oldFilename);
        }

        if (req.processedImages?.length && existingProduct.images?.length) {
            for (const oldImage of existingProduct.images) {
                const oldFilename = oldImage.split("/").pop();
                await deleteUploadedImage("products", oldFilename);
            }
        }

        // -------- Prepare update object --------
        const updateData = {
            title: title?.trim() || existingProduct.title,
            slug: productSlug,
            description: description?.trim() || "",
            brandId: brandId || existingProduct.brandId,
            categoryIds: parsedCategoryIds,
            type,
            sku: sku?.trim() || existingProduct.sku,
            thumbnail: thumbnailPath,
            images: galleryImages,
            status: productStatus,
            isFeatured: productIsFeatured,
            tags: parsedTags,
        };

        // -------- Update product --------
        const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        })
            .populate("brandId", "name slug")
            .populate("categoryIds", "name slug")
            .lean();

        return res.json({
            success: true,
            message: "Product updated successfully",
            data: updatedProduct,
        });
    } catch (err) {
        console.error("Error updating product:", err);

        // Cleanup newly uploaded images on error
        if (req.processedImage) await deleteUploadedImage("products", req.processedImage.filename);
        if (req.processedImages) {
            for (const img of req.processedImages) {
                await deleteUploadedImage("products", img.filename);
            }
        }

        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};


exports.deleteProduct = async (req, res) => {
    try {
        const {id} = req.params;

        // Find product
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found',
            });
        }

        // Delete associated images (thumbnail + gallery)
        if (product.thumbnail) {
            const thumbFilename = product.thumbnail.split('/').pop();
            await deleteUploadedImage('products', thumbFilename);
        }

        // Delete gallery images if exist
        const gallery = await ProductGallery.findOne({productId: id});
        if (gallery && gallery.images?.length > 0) {
            for (const img of gallery.images) {
                const filename = img.url.split('/').pop();
                await deleteUploadedImage('products', filename);
            }
            await ProductGallery.deleteOne({productId: id});
        }

        // Delete SEO
        await ProductSeo.deleteOne({productId: id});

        // Delete FAQs
        await ProductFaq.deleteMany({productId: id});

        // Delete Variants
        await ProductVariant.deleteMany({productId: id});

        // Delete Stock Logs
        await StockLog.deleteMany({productId: id});

        // Delete all Pricing Info
        await ProductPricing.deleteMany({productId: id});
        await TierPricing.deleteMany({productId: id});
        await SpecialPricing.deleteMany({productId: id});

        // Remove any Flash Sales referencing this product
        await FlashSale.updateMany(
            {'products.productId': id},
            {$pull: {products: {productId: id}}}
        );

        // Finally, delete the product itself
        await Product.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Product and all related data deleted successfully',
            data: {id},
        });
    } catch (err) {
        console.error('Error deleting product:', err);
        res.status(400).json({
            success: false,
            message: err.message,
        });
    }
};