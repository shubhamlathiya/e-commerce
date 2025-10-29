const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');

// Create uploads directory if it doesn't exist
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
const PRODUCT_UPLOADS = path.join(UPLOAD_DIR, 'products');
const THUMBNAIL_DIR = path.join(PRODUCT_UPLOADS, 'thumbnails');

// Ensure directories exist
[UPLOAD_DIR, PRODUCT_UPLOADS, THUMBNAIL_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, PRODUCT_UPLOADS);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

// File filter
const fileFilter = (req, file, cb) => {
    // Accept images only
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Create multer upload instance
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    }
});

/**
 * Process uploaded product image and create thumbnail
 * @param {Object} file - The uploaded file object from multer
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Paths to processed images
 */
const processProductImage = async (file, options = {}) => {
    const {
        width = 800,
        height = 800,
        thumbWidth = 200,
        thumbHeight = 200,
        quality = 80
    } = options;

    if (!file) throw new Error('No file provided');

    // Generate thumbnail filename
    const filename = path.basename(file.filename, path.extname(file.filename));
    const ext = path.extname(file.filename).toLowerCase();
    const thumbnailFilename = `${filename}-thumb${ext}`;
    const thumbnailPath = path.join(THUMBNAIL_DIR, thumbnailFilename);

    // Process main image
    await sharp(file.path)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toFile(`${file.path}.processed${ext}`);

    // Replace original with processed version
    fs.unlinkSync(file.path);
    fs.renameSync(`${file.path}.processed${ext}`, file.path);

    // Create thumbnail
    await sharp(file.path)
        .resize(thumbWidth, thumbHeight, { fit: 'cover' })
        .jpeg({ quality })
        .toFile(thumbnailPath);

    // Return paths relative to server root
    const relativePath = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
    const relativeThumbnailPath = path.relative(process.cwd(), thumbnailPath).replace(/\\/g, '/');

    return {
        original: `/${relativePath}`,
        thumbnail: `/${relativeThumbnailPath}`,
        filename: file.filename,
        thumbnailFilename
    };
};

/**
 * Delete product images
 * @param {string} filename - The filename to delete (without path)
 * @returns {Promise<boolean>} - Success status
 */
const deleteProductImages = async (filename) => {
    try {
        const mainPath = path.join(PRODUCT_UPLOADS, filename);
        const thumbName = path.basename(filename, path.extname(filename));
        const thumbExt = path.extname(filename);
        const thumbPath = path.join(THUMBNAIL_DIR, `${thumbName}-thumb${thumbExt}`);

        // Delete main image if exists
        if (fs.existsSync(mainPath)) {
            fs.unlinkSync(mainPath);
        }

        // Delete thumbnail if exists
        if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath);
        }

        return true;
    } catch (error) {
        console.error('Error deleting product images:', error);
        return false;
    }
};

/**
 * Generate product SKU
 * @param {string} productName - Product name
 * @param {string} categoryCode - Category code (optional)
 * @returns {string} - Generated SKU
 */
const generateProductSKU = (productName, categoryCode = '') => {
    const prefix = categoryCode ? `${categoryCode}-` : '';
    const namePart = productName
        .replace(/[^a-zA-Z0-9]/g, '')
        .substring(0, 5)
        .toUpperCase();
    const randomPart = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    return `${prefix}${namePart}-${randomPart}`;
};

/**
 * Format product price with currency
 * @param {number} price - Product price
 * @param {string} currency - Currency code (default: INR)
 * @returns {string} - Formatted price
 */
const formatPrice = (price, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency
    }).format(price);
};

/**
 * Calculate discount percentage
 * @param {number} originalPrice - Original price
 * @param {number} discountedPrice - Discounted price
 * @returns {number} - Discount percentage
 */
const calculateDiscountPercentage = (originalPrice, discountedPrice) => {
    if (originalPrice <= 0) return 0;
    const discount = originalPrice - discountedPrice;
    return Math.round((discount / originalPrice) * 100);
};

/**
 * Middleware for handling product image upload
 * @param {string} fieldName - Form field name for the image
 * @returns {Function} - Express middleware
 */
const productImageUpload = (fieldName = 'productImage') => {
    return (req, res, next) => {
        const uploadSingle = upload.single(fieldName);

        uploadSingle(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Error uploading image'
                });
            }

            if (!req.file) {
                return next();
            }

            try {
                const imageData = await processProductImage(req.file);
                req.processedImage = imageData;
                next();
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error processing image'
                });
            }
        });
    };
};

/**
 * Middleware for handling multiple product images upload
 * @param {string} fieldName - Form field name for the images
 * @param {number} maxCount - Maximum number of images
 * @returns {Function} - Express middleware
 */
const productImagesUpload = (fieldName = 'productImages', maxCount = 5) => {
    return (req, res, next) => {
        const uploadMultiple = upload.array(fieldName, maxCount);

        uploadMultiple(req, res, async (err) => {
            if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message || 'Error uploading images'
                });
            }

            if (!req.files || req.files.length === 0) {
                return next();
            }

            try {
                const processedImages = [];

                for (const file of req.files) {
                    const imageData = await processProductImage(file);
                    processedImages.push(imageData);
                }

                req.processedImages = processedImages;
                next();
            } catch (error) {
                return res.status(500).json({
                    success: false,
                    message: 'Error processing images'
                });
            }
        });
    };
};

module.exports = {
    upload,
    processProductImage,
    deleteProductImages,
    generateProductSKU,
    formatPrice,
    calculateDiscountPercentage,
    productImageUpload,
    productImagesUpload,
    UPLOAD_DIR,
    PRODUCT_UPLOADS,
    THUMBNAIL_DIR
};