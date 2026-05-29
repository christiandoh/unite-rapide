const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validator');
const commandesController = require('../controllers/commandes.controller');

const router = Router();

router.use(authenticate);

router.post('/', validate('commande'), commandesController.create);
router.get('/mes-commandes', commandesController.myCommandes);
router.get('/:id', commandesController.getById);
router.post('/:id/annuler', commandesController.cancel);

module.exports = router;
