const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const adhanController = require('../controllers/adhan.controller');
const { authenticate } = require('../middlewares/auth.middleware');

const router = express.Router();
const uploadDirectory = path.resolve(__dirname, '..', '..', 'uploads', 'adhan');
if (!fs.existsSync(uploadDirectory)) fs.mkdirSync(uploadDirectory, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, callback) => callback(null, uploadDirectory),
    filename: (_req, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`),
  }),
  fileFilter: (_req, file, callback) => callback(null, file.mimetype.startsWith('audio/')),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.get('/', adhanController.list);
router.get('/settings', adhanController.getSettings);
router.post('/upload', authenticate, upload.single('file'), adhanController.upload);

module.exports = router;
