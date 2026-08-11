const express = require('express');
const controller = require('../controllers/achievement.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const validator = require('../validators/achievement.validator');

const router = express.Router();

// Public listing
router.get('/', controller.list);
router.get('/:id(\\d+)', controller.getById);

// Admin CRUD
router.post('/', authenticate, requireRole('admin'), validate(validator.createAchievement), controller.create);
router.put('/:id(\\d+)', authenticate, requireRole('admin'), validate(validator.updateAchievement), controller.update);

// User achievements
router.get('/user/:userId(\\d+)', authenticate, controller.listUser);
router.post('/user/:userId(\\d+)/unlock', authenticate, controller.tryUnlock);

module.exports = router;
