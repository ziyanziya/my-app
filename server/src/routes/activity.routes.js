const express = require('express');
const controller = require('../controllers/activity.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const validator = require('../validators/activity.validator');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

// Public listing and read
router.get('/', controller.list);
router.get('/:id(\\d+)', controller.getById);

// Admin only: create/update/delete
router.post('/', authenticate, requireRole('admin'), validate(validator.createActivity), controller.create);
router.put('/:id(\\d+)', authenticate, requireRole('admin'), validate(validator.updateActivity), controller.update);
router.delete('/:id(\\d+)', authenticate, requireRole('admin'), controller.remove);
// reorder positions for wheel segments
router.post('/reorder', authenticate, requireRole('admin'), controller.reorder);
router.post('/import-defaults', authenticate, requireRole('admin'), controller.importDefaults);

module.exports = router;
