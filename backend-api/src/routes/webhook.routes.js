const { Router } = require('express');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { logger } = require('../config/logger');

const router = Router();

function verifyWaveSignature(req, res, next) {
  const secret = process.env.WAVE_WEBHOOK_SECRET;
  if (!secret) {
    // Pas de secret configuré → mode compatibilité (log warning)
    logger.warn('WAVE_WEBHOOK_SECRET non configuré, vérification de signature désactivée');
    return next();
  }

  const signature = req.headers['x-wave-signature'];
  if (!signature) {
    return res.status(401).json({ error: 'Signature manquante' });
  }

  const payload = JSON.stringify(req.body);
  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  try {
    const provided = Buffer.from(signature, 'hex');
    const expected = Buffer.from(computed, 'hex');
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
      return res.status(401).json({ error: 'Signature invalide' });
    }
  } catch {
    return res.status(401).json({ error: 'Signature invalide' });
  }

  next();
}

router.post('/wave', verifyWaveSignature, async (req, res) => {
  try {
    logger.info('Webhook Wave reçu', { body: req.body });

    const { reference, amount, status, transaction_id } = req.body;

    if (!reference) {
      return res.status(400).json({ error: 'Référence manquante' });
    }

    const commande = await prisma.commande.findUnique({
      where: { referenceUnique: reference },
      include: {
        preuvesPaiement: { orderBy: { createdAt: 'desc' }, take: 1 },
        service: { select: { codeUssd: true, sequenceUssd: true, operateur: { select: { nom: true } } } },
      },
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
            logsExecution: [],
            nombreTentatives: 0,
            tentativeMax: 3,
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

        // Utiliser la Bull queue au lieu de Redis publish direct
        const { executionQueue } = require('../jobs/executionJob');
        await executionQueue.add({ taskId: tache.id, commandeId: commande.id });
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
