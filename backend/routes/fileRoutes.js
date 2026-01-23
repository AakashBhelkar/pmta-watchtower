const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileController = require('../controllers/fileController');
const config = require('../config');
const { asyncHandler } = require('../middleware/errorHandler');
const { uploadLimiter } = require('../middleware/rateLimiter');

// Configure Multer for large CSV uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, config.upload.uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: config.upload.maxFileSizeBytes }
});

// Routes
router.post('/upload', uploadLimiter, upload.array('files'), asyncHandler(fileController.uploadFiles));
router.get('/', asyncHandler(fileController.getFiles));
router.get('/:id', asyncHandler(fileController.getFileById));
router.delete('/:id', asyncHandler(fileController.deleteFile));

module.exports = router;
