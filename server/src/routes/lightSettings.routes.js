const express = require('express');
const controller = require('../controllers/lightSettings.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();

router.get('/', authenticate, requireRole('admin'), controller.getSettings);
router.put('/', authenticate, requireRole('admin'), controller.updateSettings);

module.exports = router;
