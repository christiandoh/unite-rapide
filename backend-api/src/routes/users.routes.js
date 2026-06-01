const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const usersController = require('../controllers/users.controller');

const router = Router();

router.use(authenticate);

router.put('/profile', usersController.updateProfile);
router.post('/photo', (req, res, next) => { req.uploadDir = 'profiles'; next(); }, upload.single('photo'), usersController.uploadPhoto);

module.exports = router;
