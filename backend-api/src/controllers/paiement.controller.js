const prisma = require('../config/prisma');
const { getPaymentRequest, hasCredentials } = require('../services/jeko.service');

async function getStatus(req, res, next) {
  try {
    const commande = await prisma.commande.findFirst({
      where: {
        id: req.params.commandeId,
        userId: req.user.id,
      },
      select: {
        id: true,
        statutCommande: true,
        referenceUnique: true,
        jekoPaymentRequestId: true,
        methodePaiement: true,
        lienPaiement: true,
      },
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    let jekoStatus = null;
    if (commande.jekoPaymentRequestId && hasCredentials()) {
      try {
        const pr = await getPaymentRequest(commande.jekoPaymentRequestId);
        jekoStatus = pr.status;
      } catch (_) {}
    }

    res.json({
      statut: commande.statutCommande,
      reference: commande.referenceUnique,
      methode_paiement: commande.methodePaiement,
      jeko_status: jekoStatus,
      lien_paiement: commande.lienPaiement,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getStatus };
