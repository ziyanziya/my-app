const express = require('express');
const controller = require('../controllers/notification.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const validator = require('../validators/notification.validator');

const router = express.Router();

// Admin create notification (can be immediate or scheduled)
router.post('/', authenticate, requireRole('admin'), validate(validator.createNotification), controller.create);
router.get('/', authenticate, requireRole('admin'), controller.list);
router.post('/:id(\\d+)/send', authenticate, requireRole('admin'), controller.sendNow);
router.delete('/:id(\\d+)', authenticate, requireRole('admin'), controller.delete);

module.exports = router;
