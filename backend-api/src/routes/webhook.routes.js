const { Router } = require('express');
const prisma = require('../config/prisma');
const { logger } = require('../config/logger');

const router = Router();

router.post('/wave', async (req, res) => {
  try {
    logger.info('Webhook Wave reçu', { body: req.body });

    const { reference, amount, status, transaction_id } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Référence manquante' });
    }

    const commande = await prisma.commande.findUnique({
      where: { referenceUnique: reference },
      include: { preuvesPaiement: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const isSuccess = status === 'success' || status === 'completed';

    await prisma.$transaction(async (tx) => {
      if (isSuccess) {
        await tx.commande.update({
          where: { id: commande.id },
          data: { statutCommande: 'paiement_valide' },
        });

        const tache = await tx.tacheUSSD.create({
          data: {
            commandeId: commande.id,
            priorite: 5,
            statutExecution: 'en_attente',
          },
        });

        await tx.transactionLog.create({
          data: {
            typeEvenement: 'paiement_valide',
            severite: 'info',
            details: { reference, transaction_id, amount, via: 'webhook_wave' },
            commandeId: commande.id,
          },
        });

        logger.info(`Paiement validé via webhook: ${reference}`);

        const redis = require('../config/redis');
        await redis.publish('ussd:execute', JSON.stringify({
          commandeId: commande.id,
          taskId: tache.id,
          code: commande.service?.codeUssd,
        }));
      } else {
        await tx.commande.update({
          where: { id: commande.id },
          data: { statutCommande: 'paiement_rejete' },
        });

        await tx.transactionLog.create({
          data: {
            typeEvenement: 'paiement_rejete',
            severite: 'warning',
            details: { reference, transaction_id, reason: status },
            commandeId: commande.id,
          },
        });
      }
    });

    res.json({ received: true, commandeId: commande.id, status: isSuccess ? 'valide' : 'rejete' });
  } catch (error) {
    logger.error('Erreur traitement webhook Wave', { error: error.message });
    res.status(500).json({ error: 'Erreur interne' });
  }
});

module.exports = router;
