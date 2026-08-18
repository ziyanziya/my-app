const express = require('express');
const controller = require('../controllers/light.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');
const validate = require('../middlewares/validate.middleware');
const validator = require('../validators/light.validator');

const router = express.Router();

router.get('/rules', authenticate, controller.listRules);
router.get('/rules/:id(\\d+)', authenticate, controller.getRule);
router.post('/rules', authenticate, requireRole('admin'), validate(validator.createRule), controller.createRule);
router.put('/rules/:id(\\d+)', authenticate, requireRole('admin'), validate(validator.updateRule), controller.updateRule);
router.delete('/rules/:id(\\d+)', authenticate, requireRole('admin'), controller.deleteRule);

router.post('/daily-checkin', authenticate, controller.performDailyCheckin);

router.get('/admin/transactions', authenticate, requireRole('admin'), controller.listAllTransactions);
router.get('/user/:userId/stats', authenticate, controller.getUserStats);
router.get('/user/:userId/transactions', authenticate, controller.getUserTransactions);
router.post('/user/:userId(\\d+)/award', authenticate, requireRole('admin'), validate(validator.awardUserLight), controller.awardUserLight);
router.post('/user/:userId(\\d+)/spend', authenticate, requireRole('admin'), validate(validator.spendUserLight), controller.spendUserLight);

module.exports = router;
