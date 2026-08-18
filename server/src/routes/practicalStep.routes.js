const express = require('express');
const controller = require('../controllers/practicalStep.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const validator = require('../validators/practicalStep.validator');
const upload = require('../middlewares/practicalMediaUpload.middleware');

const router = express.Router();

router.get('/worship/:worshipId(\\d+)', controller.listByWorship);
router.get('/progress/:worshipId(\\d+)', authenticate, controller.getUserProgress);
router.post('/:id(\\d+)/complete', authenticate, controller.completeStep);

router.get('/:id(\\d+)/media', controller.listMedia);
router.post('/:id(\\d+)/media/link', authenticate, requireRole('admin'), controller.addMediaLink);
router.post('/:id(\\d+)/media/upload', authenticate, requireRole('admin'), upload.single('video'), controller.uploadMedia);
router.delete('/media/:mediaId(\\d+)', authenticate, requireRole('admin'), controller.removeMedia);
router.get('/:id(\\d+)', controller.getById);
router.post('/', authenticate, requireRole('admin'), validate(validator.createStep), controller.create);
router.put('/:id(\\d+)', authenticate, requireRole('admin'), validate(validator.updateStep), controller.update);
router.delete('/:id(\\d+)', authenticate, requireRole('admin'), controller.remove);
router.post('/reorder', authenticate, requireRole('admin'), validate(validator.reorderSteps), controller.reorder);

module.exports = router;
