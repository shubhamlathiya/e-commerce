const ProductGallery = require('../../models/productCatalog/productGalleryModel');
const Product = require('../../models/productCatalog/ProductModel');
const { deleteUploadedImage } = require('../../utils/upload');

exports.getGallery = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId).lean();
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Get or create gallery
        let gallery = await ProductGallery.findOne({ productId }).lean();

        if (!gallery) {
            // Create empty gallery if doesn't exist
            gallery = await ProductGallery.create({
                productId,
                images: []
            });
        }

        res.json({
            success: true,
            data: gallery
        });
    } catch (err) {
        console.error("Error fetching gallery:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.addGalleryImages = async (req, res) => {
    try {
        const { productId } = req.params;
        const { altTexts = [] } = req.body;


        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            // Clean up uploaded images if product not found
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

        // Get processed images
        const newImages = (req.processedImages || []).map((img, index) => ({
            url: img.original,
            alt: altTexts[index] || `Product image ${index + 1}`
        }));

        if (newImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images provided for gallery'
            });
        }

        // Find or create gallery
        let gallery = await ProductGallery.findOne({ productId });

        if (!gallery) {
            gallery = await ProductGallery.create({
                productId,
                images: newImages
            });
        } else {
            // Add new images to existing gallery
            gallery.images.push(...newImages);
            await gallery.save();
        }

        // Also update product's images array for backward compatibility
        const productImageUrls = newImages.map(img => img.url);
        product.images = [...(product.images || []), ...productImageUrls];
        await product.save();

        const updatedGallery = await ProductGallery.findById(gallery._id).lean();

        res.json({
            success: true,
            message: `Successfully added ${newImages.length} image(s) to gallery`,
            data: updatedGallery
        });
    } catch (err) {
        console.error("Error adding gallery images:", err);

        // Clean up uploaded images on error
        if (req.processedImages) {
            for (const img of req.processedImages) {
                await deleteUploadedImage("products", img.filename);
            }
        }

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.replaceGallery = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            // Clean up uploaded images if product not found
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

        // Get processed images for new gallery
        const newImages = (req.processedImages || []).map((img, index) => ({
            url: img.original,
            alt: `Product image ${index + 1}`
        }));

        if (newImages.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No images provided for gallery'
            });
        }

        // Find existing gallery to delete old images
        const existingGallery = await ProductGallery.findOne({ productId });

        if (existingGallery) {
            // Delete old image files from storage
            for (const image of existingGallery.images) {
                const filename = image.url.split('/').pop();
                await deleteUploadedImage("products", filename);
            }
        }

        // Update or create gallery with new images
        const gallery = await ProductGallery.findOneAndUpdate(
            { productId },
            {
                $set: {
                    images: newImages
                }
            },
            {
                new: true,
                upsert: true,
                runValidators: true
            }
        );

        // Also update product's images array
        const productImageUrls = newImages.map(img => img.url);
        product.images = productImageUrls;
        await product.save();

        res.json({
            success: true,
            message: `Gallery replaced with ${newImages.length} new image(s)`,
            data: gallery
        });
    } catch (err) {
        console.error("Error replacing gallery:", err);

        // Clean up uploaded images on error
        if (req.processedImages) {
            for (const img of req.processedImages) {
                await deleteUploadedImage("products", img.filename);
            }
        }

        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};

exports.removeGalleryImage = async (req, res) => {
    try {
        const { productId, imageIndex } = req.params;
        const index = parseInt(imageIndex);

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const gallery = await ProductGallery.findOne({ productId });
        if (!gallery || !gallery.images.length) {
            return res.status(404).json({
                success: false,
                message: 'Gallery not found or empty'
            });
        }

        if (index < 0 || index >= gallery.images.length) {
            return res.status(400).json({
                success: false,
                message: `Invalid image index. Gallery has ${gallery.images.length} images.`
            });
        }

        // Get the image to be removed for file deletion
        const removedImage = gallery.images[index];

        // Remove image from array
        gallery.images.splice(index, 1);
        await gallery.save();

        // Delete image file from storage
        if (removedImage.url) {
            const filename = removedImage.url.split('/').pop();
            await deleteUploadedImage("products", filename);
        }

        // Also update product's images array
        const productImageUrls = gallery.images.map(img => img.url);
        product.images = productImageUrls;
        await product.save();

        res.json({
            success: true,
            message: 'Image removed from gallery successfully',
            data: {
                removedImage,
                remainingCount: gallery.images.length
            }
        });
    } catch (err) {
        console.error("Error removing gallery image:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};

exports.deleteGallery = async (req, res) => {
    try {
        const { productId } = req.params;

        // Check if product exists
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const gallery = await ProductGallery.findOne({ productId });
        if (!gallery) {
            return res.status(404).json({
                success: false,
                message: 'Gallery not found'
            });
        }

        // Delete all image files from storage
        if (gallery.images && gallery.images.length > 0) {
            for (const image of gallery.images) {
                if (image.url) {
                    const filename = image.url.split('/').pop();
                    await deleteUploadedImage("products", filename);
                }
            }
        }

        // Delete gallery document
        await ProductGallery.findOneAndDelete({ productId });

        // Clear product's images array
        product.images = [];
        await product.save();

        res.json({
            success: true,
            message: 'Product gallery deleted successfully',
            data: { productId }
        });
    } catch (err) {
        console.error("Error deleting gallery:", err);
        res.status(400).json({
            success: false,
            message: err.message
        });
    }
};