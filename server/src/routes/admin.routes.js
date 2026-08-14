const express = require('express');
const controller = require('../controllers/admin.controller');
const adhanController = require('../controllers/adhan.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.resolve(__dirname, '..', '..', 'uploads', 'adhan');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
	destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
	filename: (_req, file, cb) => {
		const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
		cb(null, safe);
	},
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith('audio/')),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const router = express.Router();
router.use(authenticate, requireRole('admin'));
router.get('/dashboard', controller.dashboard);
router.get('/users', controller.listUsers);
router.patch('/users/:id(\\d+)', controller.updateUser);

// Adhan management
router.get('/adhan', adhanController.list);
router.post('/adhan', upload.single('file'), adhanController.upload);
router.put('/adhan/:name', upload.single('file'), adhanController.update);
router.delete('/adhan/:name', adhanController.remove);
router.get('/adhan/settings', adhanController.getSettings);
router.post('/adhan/settings', adhanController.saveSettings);

module.exports = router;
