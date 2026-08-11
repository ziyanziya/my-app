const express = require('express');
const controller = require('../controllers/auth.controller');
const validator = require('../validators/auth.validator');
const validate = require('../middlewares/validate.middleware');

const router = express.Router();

router.post('/register', validate(validator.register), controller.register);
router.post('/login', validate(validator.login), controller.login);
router.post('/refresh', validate(validator.refresh), controller.refresh);
router.post('/logout', controller.logout);
router.get('/verify', controller.verify);
router.post('/forgot', validate(validator.forgot), controller.forgot);
router.post('/reset', validate(validator.reset), controller.reset);

module.exports = router;
