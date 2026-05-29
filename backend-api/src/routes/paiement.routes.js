const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const upload = require('../middleware/upload.middleware');
const paiementController = require('../controllers/paiement.controller');

const router = Router();

router.use(authenticate);

router.post('/upload-proof', upload.single('image'), paiementController.uploadProof);
router.get('/status/:commandeId', paiementController.getStatus);

module.exports = router;
