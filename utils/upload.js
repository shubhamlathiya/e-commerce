const fs = require('fs');
const path = require('path');
const multer = require('multer');
const sharp = require('sharp');
const crypto = require('crypto');

// Root uploads folder
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Define subfolders
const SUBFOLDERS = ['products', 'brands', 'categories', 'banners'];

// Ensure all directories exist
SUBFOLDERS.forEach((folder) => {
    const mainDir = path.join(UPLOAD_DIR, folder);
    const thumbDir = path.join(mainDir, 'thumbnails');
    if (!fs.existsSync(mainDir)) fs.mkdirSync(mainDir, { recursive: true });
    if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });
});

// Reusable helper to generate safe file names
const generateFileName = (prefix, originalName) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(originalName).toLowerCase();
    return `${prefix}-${unique}${ext}`;
};

// Common Multer storage (dynamic based on upload type)
const getStorage = (uploadType) =>
    multer.diskStorage({
        destination: (req, file, cb) => {
            const targetDir = path.join(UPLOAD_DIR, uploadType);
            cb(null, targetDir);
        },
        filename: (req, file, cb) => {
            cb(null, generateFileName(uploadType, file.originalname));
        },
    });

// Common file filter (only allow images)
const fileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};

// Helper to ensure output directories exist
const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
};

/**
 * Process uploaded image & generate thumbnail
 * @param {Object} file - The uploaded file
 * @param {String} uploadType - Folder name (brands/products/etc.)
 * @param {Object} options - Resize options
 */
const processImage = async (file, uploadType, options = {}) => {
    const {
        width = 800,
        height = 800,
        thumbWidth = 200,
        thumbHeight = 200,
        quality = 80,
    } = options;

    const uploadDir = path.join(UPLOAD_DIR, uploadType);
    const thumbDir = path.join(uploadDir, 'thumbnails');
    ensureDir(thumbDir);

    const ext = path.extname(file.filename).toLowerCase();
    const filename = path.basename(file.filename, ext);
    const thumbFilename = `${filename}-thumb${ext}`;
    const thumbPath = path.join(thumbDir, thumbFilename);

    // Resize main image
    await sharp(file.path)
        .resize(width, height, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality })
        .toFile(`${file.path}.processed${ext}`);

    fs.unlinkSync(file.path);
    fs.renameSync(`${file.path}.processed${ext}`, file.path);

    // Create thumbnail
    await sharp(file.path)
        .resize(thumbWidth, thumbHeight, { fit: 'cover' })
        .jpeg({ quality })
        .toFile(thumbPath);

    const relativeMain = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
    const relativeThumb = path.relative(process.cwd(), thumbPath).replace(/\\/g, '/');

    return {
        original: `/${relativeMain}`,
        thumbnail: `/${relativeThumb}`,
        filename: file.filename,
        thumbnailFilename: thumbFilename,
    };
};

/**
 * Middleware to handle single image upload & processing
 * @param {String} fieldName - Form field name (e.g., 'logo')
 * @param {String} uploadType - Folder (e.g., 'brands', 'products')
 */
const singleImageUpload = (fieldName = 'image', uploadType = 'products') => {
    const upload = multer({
        storage: getStorage(uploadType),
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }).single(fieldName);

    return (req, res, next) => {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (!req.file) return next();

            try {
                const processed = await processImage(req.file, uploadType);
                req.processedImage = processed;
                next();
            } catch (error) {
                console.error('Image processing error:', error);
                return res.status(500).json({ success: false, message: 'Error processing image' });
            }
        });
    };
};

/**
 * Middleware to handle multiple image uploads
 * @param {String} fieldName - Form field name (e.g., 'gallery')
 * @param {String} uploadType - Folder (e.g., 'products')
 * @param {Number} maxCount - Max number of files
 */
const multipleImageUpload = (fieldName = 'images', uploadType = 'products', maxCount = 5) => {
    const upload = multer({
        storage: getStorage(uploadType),
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    }).array(fieldName, maxCount);

    return (req, res, next) => {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }
            if (!req.files || req.files.length === 0) return next();

            try {
                const processedImages = [];
                for (const file of req.files) {
                    const imgData = await processImage(file, uploadType);
                    processedImages.push(imgData);
                }
                req.processedImages = processedImages;
                next();
            } catch (error) {
                console.error('Error processing images:', error);
                return res.status(500).json({ success: false, message: 'Error processing images' });
            }
        });
    };
};

/**
 * Delete uploaded image & thumbnail
 * @param {String} uploadType - Folder (e.g., 'brands')
 * @param {String} filename - File to delete
 */
const deleteUploadedImage = async (uploadType, filename) => {
    try {
        const mainPath = path.join(UPLOAD_DIR, uploadType, filename);
        const thumbPath = path.join(
            UPLOAD_DIR,
            uploadType,
            'thumbnails',
            `${path.parse(filename).name}-thumb${path.extname(filename)}`
        );

        if (fs.existsSync(mainPath)) fs.unlinkSync(mainPath);
        if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        return true;
    } catch (err) {
        console.error('Error deleting image:', err);
        return false;
    }
};

const combinedImageUpload = (uploadType = 'products') => {
    const upload = multer({
        storage: getStorage(uploadType),
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    }).fields([
        { name: 'thumbnail', maxCount: 1 },
        { name: 'images', maxCount: 10 }
    ]);

    return (req, res, next) => {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            try {
                // Process thumbnail (if available)
                if (req.files?.thumbnail) {
                    const processedThumb = await processImage(req.files.thumbnail[0], uploadType);
                    req.processedImage = processedThumb;
                }

                // Process gallery images (if available)
                if (req.files?.images?.length > 0) {
                    const processedImages = [];
                    for (const file of req.files.images) {
                        const imgData = await processImage(file, uploadType);
                        processedImages.push(imgData);
                    }
                    req.processedImages = processedImages;
                }

                next();
            } catch (error) {
                console.error('Error processing images:', error);
                return res.status(500).json({ success: false, message: 'Error processing images' });
            }
        });
    };
};

module.exports = {
    UPLOAD_DIR,
    singleImageUpload,
    multipleImageUpload,
    processImage,
    deleteUploadedImage,
    combinedImageUpload
};

// Upload handler for categories: supports 'image' and 'icon' fields
// Sets req.processedCategoryImage and req.processedCategoryIcon when present
const categoryMediaUpload = () => {
    const upload = multer({
        storage: getStorage('categories'),
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    }).fields([
        { name: 'image', maxCount: 1 },
        { name: 'icon', maxCount: 1 },
    ]);

    return (req, res, next) => {
        upload(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            try {
                if (req.files?.image?.[0]) {
                    const processed = await processImage(req.files.image[0], 'categories');
                    req.processedCategoryImage = processed;
                }
                if (req.files?.icon?.[0]) {
                    const processedIcon = await processImage(req.files.icon[0], 'categories');
                    req.processedCategoryIcon = processedIcon;
                }
                next();
            } catch (error) {
                console.error('Category media processing error:', error);
                return res.status(500).json({ success: false, message: 'Error processing category media' });
            }
        });
    };
};

module.exports.categoryMediaUpload = categoryMediaUpload;
