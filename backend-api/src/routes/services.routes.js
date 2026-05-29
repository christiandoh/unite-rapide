const { Router } = require('express');
const servicesController = require('../controllers/services.controller');

const router = Router();

router.get('/', servicesController.list);
router.get('/featured', servicesController.featured);
router.get('/:id', servicesController.getById);

module.exports = router;
