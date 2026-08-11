const express = require('express');
const controller = require('../controllers/theorySection.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const validator = require('../validators/theorySection.validator');

const router = express.Router();

router.get('/worship/:worshipId(\\d+)', controller.listByWorship);
router.get('/:id(\\d+)', controller.getById);
router.post('/', authenticate, requireRole('admin'), validate(validator.createSection), controller.create);
router.put('/:id(\\d+)', authenticate, requireRole('admin'), validate(validator.updateSection), controller.update);
router.delete('/:id(\\d+)', authenticate, requireRole('admin'), controller.remove);
router.post('/reorder', authenticate, requireRole('admin'), validate(validator.reorderSections), controller.reorder);

module.exports = router;
