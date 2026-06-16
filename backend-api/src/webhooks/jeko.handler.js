const crypto = require('crypto');
const prisma = require('../config/prisma');
const { logger } = require('../config/logger');
const { confirmPaymentAndScheduleUssd, VALIDATED_STATUSES } = require('../services/paymentValidation.service');

function verifyJekoSignature(rawBody, signatureHeader, secret) {
  if (!secret) return true;
  if (!signatureHeader) return false;

  const computed = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const provided = signatureHeader.replace(/^sha256=/, '').trim();

  try {
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(provided, 'hex');
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return computed === provided;
  }
}

async function jekoWebhook(req, res) {
  try {
    const rawBody = Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {}));
    const signature = req.headers['jeko-signature'];
    const secret = process.env.JEKO_WEBHOOK_SECRET;

    if (secret && !verifyJekoSignature(rawBody, signature, secret)) {
      logger.warn('Webhook Jeko: signature invalide');
      return res.status(401).json({ error: 'Signature invalide' });
    }

    const payload = JSON.parse(rawBody.toString('utf8'));
    logger.info('Webhook Jeko reçu', {
      status: payload.status,
      reference: payload.transactionDetails?.reference,
      id: payload.id,
    });

    const reference = payload.transactionDetails?.reference;
    if (!reference) {
      return res.status(400).json({ error: 'Référence manquante dans transactionDetails' });
    }

    const commande = await prisma.commande.findUnique({
      where: { referenceUnique: reference },
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    if (payload.status === 'success') {
      const result = await confirmPaymentAndScheduleUssd(commande.id, 'webhook_jeko', {
        reference,
        jekoTransactionId: payload.id,
        amount: payload.amount?.amount,
        paymentMethod: payload.paymentMethod,
        counterpartIdentifier: payload.counterpartIdentifier,
      });

      return res.json({
        received: true,
        commandeId: commande.id,
        status: result.skipped ? 'deja_valide' : 'valide',
      });
    }

    if (payload.status === 'error' && !VALIDATED_STATUSES.has(commande.statutCommande)) {
      await prisma.commande.update({
        where: { id: commande.id },
        data: { statutCommande: 'paiement_rejete' },
      });

      await prisma.transactionLog.create({
        data: {
          typeEvenement: 'paiement_rejete',
          severite: 'warning',
          details: {
            reference,
            jekoTransactionId: payload.id,
            via: 'webhook_jeko',
            reason: payload.description,
          },
          commandeId: commande.id,
        },
      });
    }

    res.json({ received: true, commandeId: commande.id, status: payload.status || 'pending' });
  } catch (error) {
    logger.error('Erreur traitement webhook Jeko', { error: error.message });
    res.status(500).json({ error: 'Erreur interne' });
  }
}

module.exports = jekoWebhook;
