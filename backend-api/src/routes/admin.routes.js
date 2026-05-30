const { Router } = require('express');
const { authenticate, requireAdmin } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator');
const adminController = require('../controllers/admin.controller');

const router = Router();

router.use(authenticate, requireAdmin);

router.get('/dashboard', adminController.dashboard);
router.get('/telephones', adminController.telephones);
router.post('/telephones', adminController.createTelephone);
router.put('/telephones/:id', adminController.updateTelephone);
router.delete('/telephones/:id', adminController.deleteTelephone);
router.get('/commandes', adminController.commandes);
router.post('/commandes/:id/revalider', validate('revalidation'), adminController.revalider);
router.get('/logs', adminController.logs);

router.get('/services', adminController.listServices);
router.post('/services', validate('createService'), adminController.createService);
router.put('/services/:id', validate('updateService'), adminController.updateService);
router.delete('/services/:id', adminController.deleteService);

router.post('/ussd/executer', adminController.executerUssd);
router.post('/ussd/test', adminController.testUssd);

router.get('/stats/historique', adminController.historique);

module.exports = router;
