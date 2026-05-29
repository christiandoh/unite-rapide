const prisma = require('../config/prisma');
const { logger } = require('../config/logger');

async function uploadProof(req, res, next) {
  try {
    const { commande_id } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Image requise' });
    }

    const commande = await prisma.commande.findFirst({
      where: {
        id: commande_id,
        userId: req.user.id,
        statutCommande: 'en_attente_paiement',
      },
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    await prisma.commande.update({
      where: { id: commande.id },
      data: { statutCommande: 'paiement_soumis' },
    });

    const preuve = await prisma.preuvePaiement.create({
      data: {
        commandeId: commande.id,
        imageOriginaleUrl: `/uploads/proofs/${req.file.filename}`,
      },
    });

    logger.info('Preuve de paiement soumise', {
      preuveId: preuve.id,
      commandeId: commande.id,
      userId: req.user.id,
    });

    res.status(201).json({
      statut_validation: 'en_cours',
      temps_estime: '10-30 secondes',
      preuve_id: preuve.id,
    });
  } catch (error) {
    next(error);
  }
}

async function getStatus(req, res, next) {
  try {
    const preuve = await prisma.preuvePaiement.findFirst({
      where: {
        commande: {
          id: req.params.commandeId,
          userId: req.user.id,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!preuve) {
      return res.status(404).json({ error: 'Aucune preuve trouvée' });
    }

    res.json({
      statut: preuve.statutValidation,
      score_confiance: preuve.scoreConfiance,
      extractions: preuve.donneesExtraites,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { uploadProof, getStatus };
