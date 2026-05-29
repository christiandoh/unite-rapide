const prisma = require('../config/prisma');
const { generatePaymentLink } = require('../services/wave.service');
const { logger } = require('../config/logger');

async function create(req, res, next) {
  try {
    const { service_id, telephone_beneficiaire } = req.body;

    const service = await prisma.serviceCatalogue.findUnique({
      where: { id: service_id },
      include: { operateur: true },
    });

    if (!service || !service.actif) {
      return res.status(404).json({ error: 'Service non trouvé ou inactif' });
    }

    const reference = generateReference();
    const paymentData = generatePaymentLink(service.montantWave, reference);

    const commande = await prisma.commande.create({
      data: {
        userId: req.user.id,
        serviceId: service_id,
        telephoneBeneficiaire: telephone_beneficiaire,
        referenceUnique: reference,
        montant: service.montantWave,
        lienPaiementWave: paymentData.url,
        dateExpirationPaiement: new Date(Date.now() + 15 * 60 * 1000),
      },
      include: {
        service: {
          include: { operateur: { select: { nom: true } } },
        },
      },
    });

    logger.info('Nouvelle commande créée', {
      commandeId: commande.id,
      reference,
      userId: req.user.id,
      montant: service.montantWave,
    });

    res.status(201).json({
      commande: {
        id: commande.id,
        reference: commande.referenceUnique,
        montant: commande.montant,
        statut: commande.statutCommande,
        dateExpiration: commande.dateExpirationPaiement,
        service: commande.service.nom,
        operateur: commande.service.operateur.nom,
      },
      lien_paiement: paymentData.url,
      qr_code: paymentData.qrCode,
      reference,
      expire_dans: '15 minutes',
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
