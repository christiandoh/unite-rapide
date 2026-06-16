const { Router } = require('express');
const { validate } = require('../middleware/validator');
const { authLimiter } = require('../middleware/rateLimiter');
const authController = require('../controllers/auth.controller');

const router = Router();

router.post('/register', validate('register'), authController.register);
router.post('/login', authLimiter, validate('login'), authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/change-pin', require('../middleware/auth.middleware').authenticate, validate('changePin'), authController.changePin);

module.exports = router;
