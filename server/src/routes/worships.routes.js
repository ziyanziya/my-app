const express = require('express');
const controller = require('../controllers/worship.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const validator = require('../validators/worship.validator');

const router = express.Router();

router.get('/', controller.list);
router.get('/:id(\d+)', controller.getById);
router.post('/', authenticate, requireRole('admin'), validate(validator.createWorship), controller.create);
router.put('/:id(\d+)', authenticate, requireRole('admin'), validate(validator.updateWorship), controller.update);
router.delete('/:id(\d+)', authenticate, requireRole('admin'), controller.remove);
router.post('/:id(\\d+)/complete', authenticate, controller.complete);

module.exports = router;
