const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

// Root uploads folder
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Subfolders
const SUBFOLDERS = ['products', 'brands', 'categories', 'banners'];

SUBFOLDERS.forEach(folder => {
    const dir = path.join(UPLOAD_DIR, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Generate unique safe filename
const generateFileName = (prefix, originalName) => {
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(originalName);
    return `${prefix}-${unique}${ext}`;
};

// Multer dynamic storage
const getStorage = (uploadType) =>
    multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.join(UPLOAD_DIR, uploadType));
        },
        filename: (req, file, cb) => {
            cb(null, generateFileName(uploadType, file.originalname));
        }
    });

// Allowed image types
const fileFilter = (req, file, cb) => {
    if (!file.originalname.match(/\.(jpg|jpeg|png|webp)$/i)) {
        return cb(new Error('Only image files are allowed'), false);
    }
    cb(null, true);
};

/*---------------------------------------------------------------------
    SINGLE FILE UPLOAD
---------------------------------------------------------------------*/
const singleImageUpload = (fieldName = 'image', uploadType = 'products') => {
    const upload = multer({
        storage: getStorage(uploadType),
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    }).single(fieldName);

    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            if (req.file) {
                const relative = path.relative(process.cwd(), req.file.path).replace(/\\/g, '/');
                req.uploadedImage = {
                    path: `/${relative}`,
                    filename: req.file.filename
                };
            }

            next();
        });
    };
};

/*---------------------------------------------------------------------
    MULTIPLE FILE UPLOAD
---------------------------------------------------------------------*/
const multipleImageUpload = (fieldName = 'images', uploadType = 'products', maxCount = 10) => {
    const upload = multer({
        storage: getStorage(uploadType),
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    }).array(fieldName, maxCount);

    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            if (req.files?.length) {
                req.uploadedImages = req.files.map(file => {
                    const relative = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
                    return {
                        path: `/${relative}`,
                        filename: file.filename
                    };
                });
            }

            next();
        });
    };
};

/*---------------------------------------------------------------------
    COMBINED UPLOAD (thumbnail + images)
---------------------------------------------------------------------*/

function combinedImageUpload(folderName) {
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const dir = path.join(UPLOAD_DIR, folderName);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            cb(null, dir);
        },
        filename: (req, file, cb) => {
            const ext = path.extname(file.originalname);
            const name = `${file.fieldname}-${Date.now()}${ext}`;
            cb(null, name);
        }
    });

    const upload = multer({ storage }).fields([
        { name: "thumbnail", maxCount: 1 },
        { name: "images", maxCount: 10 }
    ]);

    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) return res.status(400).json({ success: false, message: err.message });

            // Assign paths in the format your controller expects
            if (req.files?.thumbnail?.length) {
                req.productThumbnail = {
                    path: `/uploads/${folderName}/${req.files.thumbnail[0].filename}`
                };
            }

            if (req.files?.images?.length) {
                req.productImages = req.files.images.map((file) => ({
                    path: `/uploads/${folderName}/${file.filename}`
                }));
            }

            next();
        });
    };
}
/*---------------------------------------------------------------------
    CATEGORY UPLOAD (image + icon)
---------------------------------------------------------------------*/
const categoryMediaUpload = () => {
    const upload = multer({
        storage: getStorage('categories'),
        fileFilter,
        limits: { fileSize: 5 * 1024 * 1024 },
    }).fields([
        { name: 'image', maxCount: 1 },
        { name: 'icon', maxCount: 1 }
    ]);

    return (req, res, next) => {
        upload(req, res, (err) => {
            if (err) {
                return res.status(400).json({ success: false, message: err.message });
            }

            if (req.files?.image?.[0]) {
                const file = req.files.image[0];
                const relative = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
                req.categoryImage = {
                    path: `/${relative}`,
                    filename: file.filename
                };
            }

            if (req.files?.icon?.[0]) {
                const file = req.files.icon[0];
                const relative = path.relative(process.cwd(), file.path).replace(/\\/g, '/');
                req.categoryIcon = {
                    path: `/${relative}`,
                    filename: file.filename
                };
            }

            next();
        });
    };
};

/*---------------------------------------------------------------------
    DELETE UPLOADED FILE
---------------------------------------------------------------------*/
const deleteUploadedImage = async (uploadType, filename) => {
    try {
        const filePath = path.join(UPLOAD_DIR, uploadType, filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        return true;
    } catch (err) {
        console.error('Error deleting image:', err);
        return false;
    }
};

module.exports = {
    UPLOAD_DIR,
    singleImageUpload,
    multipleImageUpload,
    combinedImageUpload,
    categoryMediaUpload,
    deleteUploadedImage,
};
