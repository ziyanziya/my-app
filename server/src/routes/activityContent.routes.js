const express = require('express');
const controller = require('../controllers/activityContent.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const validator = require('../validators/activityContent.validator');
const upload = require('../middlewares/contentUpload.middleware');

const router = express.Router();

// List contents for an activity (public)
router.get('/activity/:activityId(\\d+)', controller.listByActivity);

// Get single content
router.get('/:id(\\d+)', controller.getById);

// Admin create and upload
router.post('/activity/:activityId(\\d+)', authenticate, requireRole('admin'), validate(validator.createContent), controller.create);
router.post('/activity/:activityId(\\d+)/upload', authenticate, requireRole('admin'), upload.single('file'), controller.upload);

// Admin update/delete
router.put('/:id(\\d+)', authenticate, requireRole('admin'), validate(validator.updateContent), controller.update);
router.delete('/:id(\\d+)', authenticate, requireRole('admin'), controller.remove);

module.exports = router;
