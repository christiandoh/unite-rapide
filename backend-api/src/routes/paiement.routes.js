const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const paiementController = require('../controllers/paiement.controller');

const router = Router();

router.use(authenticate);
router.get('/status/:commandeId', paiementController.getStatus);

module.exports = router;
