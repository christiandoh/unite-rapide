const prisma = require('../config/prisma');
const { createPaymentRequestWithQR, isConfigured } = require('../services/jeko.service');
const { logger } = require('../config/logger');

async function create(req, res, next) {
  try {
    const { service_id, telephone_beneficiaire, methode_paiement } = req.body;

    if (!isConfigured()) {
      return res.status(503).json({
        error: 'Paiement Jeko non configuré. Contactez l\'administrateur.',
      });
    }

    const service = await prisma.serviceCatalogue.findUnique({
      where: { id: service_id },
      include: { operateur: true },
    });

    if (!service || !service.actif) {
      return res.status(404).json({ error: 'Service non trouvé ou inactif' });
    }

    const reference = generateReference();

    const commande = await prisma.commande.create({
      data: {
        userId: req.user.id,
        serviceId: service_id,
        telephoneBeneficiaire: telephone_beneficiaire,
        referenceUnique: reference,
        montant: service.montantWave,
        lienPaiement: '',
        dateExpirationPaiement: new Date(Date.now() + 15 * 60 * 1000),
      },
      include: {
        service: {
          include: { operateur: { select: { nom: true } } },
        },
      },
    });

    let paymentData;
    try {
      paymentData = await createPaymentRequestWithQR({
        amount: service.montantWave,
        reference,
        commandeId: commande.id,
        payerPhone: req.user.telephone,
        paymentMethod: methode_paiement,
      });
    } catch (err) {
      await prisma.commande.delete({ where: { id: commande.id } }).catch(() => {});
      logger.error('Erreur création paiement Jeko', { error: err.message, reference });
      const message = err.response?.data?.message || err.message || 'Impossible de créer la demande de paiement';
      return res.status(502).json({ error: message });
    }

    const updated = await prisma.commande.update({
      where: { id: commande.id },
      data: {
        lienPaiement: paymentData.url,
        jekoPaymentRequestId: paymentData.paymentRequestId,
        methodePaiement: paymentData.paymentMethod,
      },
    });

    logger.info('Nouvelle commande créée avec paiement Jeko', {
      commandeId: commande.id,
      reference,
      jekoId: paymentData.paymentRequestId,
      userId: req.user.id,
      montant: service.montantWave,
    });

    res.status(201).json({
      commande: {
        id: updated.id,
        reference: updated.referenceUnique,
        montant: updated.montant,
        statut: updated.statutCommande,
        dateExpiration: updated.dateExpirationPaiement,
        service: commande.service.nom,
        operateur: commande.service.operateur.nom,
        methode_paiement: paymentData.paymentMethod,
      },
      lien_paiement: paymentData.url,
      qr_code: paymentData.qrCode,
      reference,
      expire_dans: '15 minutes',
      provider: 'jeko',
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const commande = await prisma.commande.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
      },
      include: {
        service: {
          include: { operateur: { select: { nom: true, logoUrl: true } } },
        },
        preuvesPaiement: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        tachesUssd: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!commande) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json({ commande });
  } catch (error) {
    next(error);
  }
}

async function myCommandes(req, res, next) {
  try {
    const { statut, page = 1, limit = 10 } = req.query;

    const where = { userId: req.user.id };
    if (statut) where.statutCommande = statut;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [commandes, total] = await Promise.all([
      prisma.commande.findMany({
        where,
        include: {
          service: {
            include: { operateur: { select: { nom: true } } },
          },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.commande.count({ where }),
    ]);

    res.json({
      commandes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function cancel(req, res, next) {
  try {
    const commande = await prisma.commande.findFirst({
      where: {
        id: req.params.id,
        userId: req.user.id,
        statutCommande: 'en_attente_paiement',
      },
    });

    if (!commande) {
      return res.status(404).json({
        error: 'Commande non trouvée ou ne peut pas être annulée',
      });
    }

    await prisma.commande.update({
      where: { id: commande.id },
      data: { statutCommande: 'echoue' },
    });

    res.json({ message: 'Commande annulée' });
  } catch (error) {
    next(error);
  }
}

function generateReference() {
  const date = new Date();
  const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let random = '';
  for (let i = 0; i < 6; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `USSD-${dateStr}-${random}`;
}

module.exports = { create, getById, myCommandes, cancel };
