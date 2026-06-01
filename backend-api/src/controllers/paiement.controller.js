const prisma = require('../config/prisma');
const { logger } = require('../config/logger');
const FormData = require('form-data');
const fs = require('fs');

const IA_VALIDATOR_URL = process.env.IA_VALIDATOR_URL || 'http://ia-validator:8000';

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
      include: { service: { select: { montantWave: true } } },
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

    // Appel asynchrone à l'IA validator (ne bloque pas la réponse)
    validateWithIA(commande, preuve, req.file).catch(err =>
      logger.error('Erreur validation IA asynchrone', { error: err.message, preuveId: preuve.id })
    );

    res.status(201).json({
      statut_validation: 'en_cours',
      temps_estime: '10-30 secondes',
      preuve_id: preuve.id,
    });
  } catch (error) {
    next(error);
  }
}

async function validateWithIA(commande, preuve, file) {
  const axios = require('axios');

  const form = new FormData();
  form.append('image', fs.createReadStream(file.path), file.filename);
  form.append('commande_id', commande.id);
  form.append('expected_amount', String(Number(commande.service.montantWave)));
  form.append('expected_phone', commande.telephoneBeneficiaire);

  let response;
  try {
    response = await axios.post(`${IA_VALIDATOR_URL}/validate/payment`, form, {
      headers: form.getHeaders(),
      timeout: 60000,
    });
  } catch (err) {
    if (err.response?.status === 400) {
      response = err.response;
    } else {
      throw err;
    }
  }

  const iaResult = response.data;
  const score = iaResult.confidence_score || 0;
  const decision = iaResult.status || 'a_reviser';

  const statutValidation = decision === 'valide_auto' ? 'valide_auto'
    : decision === 'rejete' ? 'rejete'
    : 'a_reviser';

  await prisma.preuvePaiement.update({
    where: { id: preuve.id },
    data: {
      statutValidation,
      scoreConfiance: score,
      donneesExtraites: iaResult.extracted_data || {},
      flagsFraude: iaResult.flags || [],
    },
  });

  if (decision === 'valide_auto') {
    await prisma.commande.update({
      where: { id: commande.id },
      data: { statutCommande: 'paiement_valide' },
    });

    const task = await prisma.tacheUSSD.create({
      data: {
        commandeId: commande.id,
        priorite: 5,
        statutExecution: 'en_attente',
        logsExecution: [],
        nombreTentatives: 0,
        tentativeMax: 3,
      },
    });

    const { executionQueue } = require('../jobs/executionJob');
    await executionQueue.add({ taskId: task.id, commandeId: commande.id });

    logger.info('Validation IA auto OK, tache USSD creee', {
      commandeId: commande.id,
      taskId: task.id,
      score,
    });
  } else {
    await prisma.commande.update({
      where: { id: commande.id },
      data: { statutCommande: decision === 'rejete' ? 'paiement_rejete' : 'a_reviser' },
    });

    logger.info('Validation IA requiert attention', {
      commandeId: commande.id,
      decision,
      score,
    });
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
