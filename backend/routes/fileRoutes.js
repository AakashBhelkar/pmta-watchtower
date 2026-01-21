const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fileController = require('../controllers/fileController');

// Configure Multer for large CSV uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 200 * 1024 * 1024 } // 200MB limit
});

const { uploadLimiter } = require('../middleware/rateLimiter');

// Routes
router.post('/upload', uploadLimiter, upload.array('files'), fileController.uploadFiles);
router.get('/', fileController.getFiles);
router.get('/:id', fileController.getFileById);
router.delete('/:id', fileController.deleteFile);

module.exports = router;
