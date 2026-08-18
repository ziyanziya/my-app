const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin_notification.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const requireAdmin = require('../middlewares/requireAdmin.middleware');
const validate = require('../middlewares/validate.middleware');
const validator = require('../validators/adminNotification.validator');

router.use(authenticate, requireAdmin);

router.post('/', validate(validator.create), controller.create);
router.get('/', controller.list);
router.get('/:id', controller.get);
router.put('/:id', validate(validator.transition), controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
