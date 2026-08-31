const express = require('express');
const controller = require('../controllers/prayerWheelEvent.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const validator = require('../validators/prayerWheelEvent.validator');

const router = express.Router();

router.get('/', controller.list);
router.get('/settings', controller.getSettings);
router.post('/settings', authenticate, requireRole('admin'), controller.saveSettings);
router.put('/:id(\\d+)', authenticate, requireRole('admin'), validate(validator.update), controller.update);
router.post('/reorder', authenticate, requireRole('admin'), validate(validator.reorder), controller.reorder);

module.exports = router;
