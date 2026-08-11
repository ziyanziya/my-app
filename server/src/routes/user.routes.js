const express = require('express');
const controller = require('../controllers/user.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/upload.middleware');
const validator = require('../validators/user.validator');
const progressValidator = require('../validators/userTheoryProgress.validator');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.get('/profile', authenticate, controller.profile);
router.put('/profile', authenticate, validate(validator.updateProfile), controller.update);
router.post('/profile/avatar', authenticate, upload.single('avatar'), controller.uploadAvatar);
router.get('/stats', authenticate, controller.stats);
router.get('/settings', authenticate, controller.getSettings);
router.put('/settings', authenticate, validate(validator.updateSettings), controller.updateSettings);

router.get('/progress/theory/latest', authenticate, controller.getLastTheoryProgress);
router.get('/progress/theory/:worshipId(\\d+)', authenticate, controller.getTheoryProgress);
router.post('/progress/theory', authenticate, validate(progressValidator.saveTheoryProgress), controller.saveTheoryProgress);
router.put('/progress/theory/:id(\\d+)', authenticate, validate(progressValidator.updateTheoryProgress), controller.updateTheoryProgress);

module.exports = router;
