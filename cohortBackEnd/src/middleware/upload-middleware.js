import multer from 'multer';
import path from 'path';

function checkFileType(file, cb) {
    const allowedExtensions = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.bmp']);
    const allowedMimeTypes = new Set([
        'image/jpg',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'image/avif',
        'image/bmp'
    ]);
    const extname = allowedExtensions.has(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedMimeTypes.has((file.mimetype || '').toLowerCase());

    if (extname && mimetype) {
        return cb(null, true);
    } else {
        cb(new Error('Please upload a JPG, PNG, GIF, WebP, SVG, AVIF, or BMP image.'));
    }
}

const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    },
    limits: { fileSize: 10 * 1024 * 1024 }
});

export default upload;
