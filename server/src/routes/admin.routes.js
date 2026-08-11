const express = require('express');
const controller = require('../controllers/admin.controller');
const { authenticate, requireRole } = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authenticate, requireRole('admin'));
router.get('/dashboard', controller.dashboard);
router.get('/users', controller.listUsers);
router.patch('/users/:id(\\d+)', controller.updateUser);
module.exports = router;
