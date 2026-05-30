const prisma = require('../config/prisma');
const Redis = require('ioredis');
const { logger } = require('../config/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://:changeme_redis_2026@redis:6379';

async function telephones(req, res, next) {
  try {
    let telephones = await prisma.telephoneExecuteur.findMany({
      include: {
        operateur: { select: { nom: true } },
        _count: { select: { tachesUssd: { where: { statutExecution: 'en_cours' } } } },
      },
      orderBy: { derniereConnexion: 'desc' },
    });

    try {
      const redis = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
      await redis.connect();

      const enriched = await Promise.all(telephones.map(async (p) => {
        try {
          const statusData = await redis.get(`phone:status:${p.id}`);
          if (statusData) {
            const parsed = JSON.parse(statusData);
            if (parsed.lastSeen) p.derniereConnexion = new Date(parsed.lastSeen);
            if (parsed.status) {
              p.statut = parsed.status;
            } else if (parsed.lastSeen) {
              const elapsed = Date.now() - new Date(parsed.lastSeen).getTime();
              p.statut = elapsed < 120000 ? 'en_ligne' : 'hors_ligne';
            }
          }
        } catch (_) {}
        return p;
      }));

      await redis.quit().catch(() => {});
      telephones = enriched;
    } catch (_) {}

    res.json({ telephones });
  } catch (error) {
    next(error);
  }
}

async function dashboard(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      commandesAujourdhui,
      commandesTotal,
      telephonesActifs,
      fileAttente,
    ] = await Promise.all([
      prisma.commande.count({
        where: { createdAt: { gte: today } },
      }),
      prisma.commande.count(),
      prisma.telephoneExecuteur.count({
        where: { statut: 'en_ligne' },
      }),
      prisma.tacheUSSD.count({
        where: { statutExecution: 'en_attente' },
      }),
    ]);

    const commandesReussies = await prisma.commande.count({
      where: { statutCommande: 'execute', createdAt: { gte: today } },
    });

    const tauxSucces = commandesAujourdhui > 0
      ? ((commandesReussies / commandesAujourdhui) * 100).toFixed(1)
      : 0;

    res.json({
      stats_jour: {
        commandes: commandesAujourdhui,
        taux_succes: parseFloat(tauxSucces),
      },
      telephones_actifs: telephonesActifs,
      file_attente: fileAttente,
      commandes_total: commandesTotal,
    });
  } catch (error) {
    next(error);
  }
}

async function commandes(req, res, next) {
  try {
    const { statut, page = 1, limit = 20 } = req.query;

    const where = {};
    if (statut) where.statutCommande = statut;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [commandes, total] = await Promise.all([
      prisma.commande.findMany({
        where,
        include: {
          user: { select: { id: true, nom: true, prenom: true, telephone: true } },
          service: { select: { nom: true } },
          tachesUssd: { select: { statutExecution: true, id: true }, orderBy: { createdAt: 'desc' }, take: 1 },
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

async function revalider(req, res, next) {
  try {
    const { id } = req.params;
    const { action, commentaire } = req.body;

    const preuve = await prisma.preuvePaiement.findFirst({
      where: { commandeId: id },
      orderBy: { createdAt: 'desc' },
    });

    if (!preuve) {
      return res.status(404).json({ error: 'Aucune preuve trouvée' });
    }

    const statutValidation = action === 'valider' ? 'valide_manuel' : 'rejete';

    await prisma.preuvePaiement.update({
      where: { id: preuve.id },
      data: {
        statutValidation,
        validePar: req.user.id,
        commentaireValidation: commentaire || null,
      },
    });

    if (action === 'valider') {
      const commande = await prisma.commande.update({
        where: { id },
        data: { statutCommande: 'paiement_valide' },
        include: { service: { select: { codeUssd: true, sequenceUssd: true, operateur: { select: { nom: true } } } } },
      });

      const task = await prisma.tacheUSSD.create({
        data: {
          commandeId: id,
          priorite: 5,
          statutExecution: 'en_attente',
          logsExecution: [],
          nombreTentatives: 0,
          tentativeMax: 3,
        },
      });

      // Find available phone and dispatch directly via Redis
      _dispatchUSSD(task, commande).catch(err =>
        logger.error('Erreur dispatch USSD', { taskId: task.id, error: err.message }));

      logger.info('Tache USSD creee', { taskId: task.id, commandeId: id });
    }

    logger.info('Revalidation manuelle effectuee', {
      commandeId: id,
      action,
      adminId: req.user.id,
    });

    res.json({ message: `Commande ${action === 'valider' ? 'validee' : 'rejetee'} avec succes` });
  } catch (error) {
    next(error);
  }
}

async function _dispatchUSSD(task, commande) {
  const REDIS_URL = process.env.REDIS_URL || 'redis://:changeme_redis_2026@redis:6379';
  const publisher = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  await publisher.connect().catch(() => {});

  try {
    const operateurNom = commande.service.operateur.nom;
    const phones = await prisma.telephoneExecuteur.findMany({
      where: { operateur: { nom: operateurNom } },
      orderBy: { derniereConnexion: 'desc' },
    });

    let selectedPhone = null;
    for (const p of phones) {
      try {
        const data = await publisher.get(`phone:status:${p.id}`);
        if (data) {
          const parsed = JSON.parse(data);
          const isOnline = parsed.status === 'en_ligne' ||
            (!parsed.status && parsed.lastSeen && (Date.now() - new Date(parsed.lastSeen).getTime() < 120000));
          if (isOnline) { selectedPhone = p; break; }
        }
      } catch (_) {}
    }

    if (!selectedPhone) {
      logger.warn('Aucun telephone en ligne', { operateur: operateurNom, taskId: task.id });
      await prisma.tacheUSSD.update({
        where: { id: task.id },
        data: { statutExecution: 'en_attente', messageErreur: 'En attente telephone disponible' },
      });
      return;
    }

    await prisma.tacheUSSD.update({
      where: { id: task.id },
      data: {
        statutExecution: 'en_cours',
        telephoneExecuteurId: selectedPhone.id,
        dateDebutExecution: new Date(),
        logsExecution: [{ action: 'debut', timestamp: new Date().toISOString() }],
      },
    });

    await publisher.publish('ussd:execute', JSON.stringify({
      taskId: task.id,
      commandeId: commande.id,
      code: commande.service.codeUssd,
      sequence: commande.service.sequenceUssd,
      phoneId: selectedPhone.id,
    }));

    logger.info('USSD envoye au telephone', { taskId: task.id, phone: selectedPhone.numeroTelephone });
  } finally {
    await publisher.quit().catch(() => {});
  }
}

async function logs(req, res, next) {
  try {
    const { severite, date_debut, date_fin, page = 1, limit = 50 } = req.query;

    const where = {};
    if (severite) where.severite = severite;
    if (date_debut || date_fin) {
      where.createdAt = {};
      if (date_debut) where.createdAt.gte = new Date(date_debut);
      if (date_fin) where.createdAt.lte = new Date(date_fin);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.transactionLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.transactionLog.count({ where }),
    ]);

    res.json({
      logs,
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

async function listServices(req, res, next) {
  try {
    const { operateur_id, actif } = req.query;
    const where = {};
    if (operateur_id) where.operateurId = operateur_id;
    if (actif !== undefined) where.actif = actif === 'true';

    const services = await prisma.serviceCatalogue.findMany({
      where,
      include: { operateur: { select: { nom: true, prefixe: true } } },
      orderBy: [{ populaire: 'desc' }, { nom: 'asc' }],
    });

    res.json({ services });
  } catch (error) {
    next(error);
  }
}

async function createService(req, res, next) {
  try {
    const { operateur_id, nom, type_service, code_ussd, sequence_ussd, montant_wave, volume_data, duree_validite, populaire } = req.body;

    const operateur = await prisma.operateur.findUnique({ where: { id: operateur_id } });
    if (!operateur) return res.status(404).json({ error: 'Opérateur non trouvé' });

    const service = await prisma.serviceCatalogue.create({
      data: {
        operateurId: operateur_id,
        nom,
        typeService: type_service,
        codeUssd: code_ussd,
        sequenceUssd: sequence_ussd,
        montantWave: montant_wave,
        volumeData: volume_data || null,
        dureeValidite: duree_validite || null,
        populaire: populaire || false,
      },
      include: { operateur: { select: { nom: true } } },
    });

    logger.info('Service créé', { serviceId: service.id, nom: service.nom });
    res.status(201).json({ service });
  } catch (error) {
    next(error);
  }
}

async function updateService(req, res, next) {
  try {
    const { id } = req.params;
    const { nom, type_service, code_ussd, sequence_ussd, montant_wave, volume_data, duree_validite, actif, populaire } = req.body;

    const existing = await prisma.serviceCatalogue.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Service non trouvé' });

    const service = await prisma.serviceCatalogue.update({
      where: { id },
      data: {
        ...(nom !== undefined && { nom }),
        ...(type_service !== undefined && { typeService: type_service }),
        ...(code_ussd !== undefined && { codeUssd: code_ussd }),
        ...(sequence_ussd !== undefined && { sequenceUssd: sequence_ussd }),
        ...(montant_wave !== undefined && { montantWave: montant_wave }),
        ...(volume_data !== undefined && { volumeData: volume_data }),
        ...(duree_validite !== undefined && { dureeValidite: duree_validite }),
        ...(actif !== undefined && { actif }),
        ...(populaire !== undefined && { populaire }),
      },
      include: { operateur: { select: { nom: true } } },
    });

    logger.info('Service mis à jour', { serviceId: id });
    res.json({ service });
  } catch (error) {
    next(error);
  }
}

async function deleteService(req, res, next) {
  try {
    const { id } = req.params;

    const commandesLiees = await prisma.commande.count({ where: { serviceId: id } });
    if (commandesLiees > 0) {
      return res.status(409).json({
        error: 'Impossible de supprimer : des commandes sont liées à ce service',
        commandes: commandesLiees,
      });
    }

    await prisma.serviceCatalogue.delete({ where: { id } });
    logger.info('Service supprimé', { serviceId: id });
    res.json({ message: 'Service supprimé avec succès' });
  } catch (error) {
    next(error);
  }
}

async function historique(req, res, next) {
  try {
    const jours = 30;
    const depuis = new Date();
    depuis.setDate(depuis.getDate() - jours);
    depuis.setHours(0, 0, 0, 0);

    const commandes = await prisma.commande.findMany({
      where: { createdAt: { gte: depuis } },
      select: { createdAt: true, statutCommande: true, montant: true },
      orderBy: { createdAt: 'asc' },
    });

    const quotidien = {};
    for (let i = 0; i < jours; i++) {
      const d = new Date(depuis);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      quotidien[key] = { date: key, total: 0, reussi: 0, echoue: 0, montant: 0 };
    }

    for (const cmd of commandes) {
      const date = cmd.createdAt instanceof Date ? cmd.createdAt : new Date(cmd.createdAt);
      const key = date.toISOString().slice(0, 10);
      if (quotidien[key]) {
        quotidien[key].total++;
        quotidien[key].montant += Number(cmd.montant);
        if (cmd.statutCommande === 'execute') quotidien[key].reussi++;
        else if (['echoue', 'paiement_rejete'].includes(cmd.statutCommande)) quotidien[key].echoue++;
      }
    }

    const statsOperateurs = await prisma.commande.groupBy({
      by: ['statutCommande'],
      _count: { id: true },
      _sum: { montant: true },
    });

    res.json({
      quotidien: Object.values(quotidien),
      stats: {
        total: commandes.length,
        montantTotal: commandes.reduce((s, c) => s + Number(c.montant), 0),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function createTelephone(req, res, next) {
  try {
    const { code, telephone, operateur_id } = req.body;

    const existant = await prisma.telephoneExecuteur.findUnique({ where: { numeroTelephone: telephone } });
    if (existant) {
      return res.status(409).json({ error: 'Ce numero de telephone est deja enregistre' });
    }

    const operateur = operateur_id
      ? await prisma.operateur.findUnique({ where: { id: operateur_id } })
      : await prisma.operateur.findFirst({ where: { prefixe: telephone.substring(0, 2) } });

    const token = `phone-${code.toLowerCase()}-${Date.now().toString(36)}`;

    const phone = await prisma.telephoneExecuteur.create({
      data: {
        nomAppareil: code,
        modele: 'Android',
        numeroTelephone: telephone,
        operateurId: operateur?.id || (await prisma.operateur.findFirst()).id,
        tokenAuth: token,
      },
      select: { id: true, nomAppareil: true, numeroTelephone: true, tokenAuth: true, operateur: { select: { nom: true } } },
    });

    logger.info('Telephone cree', { code, telephone, token });

    res.status(201).json({ telephone: phone });
  } catch (error) {
    next(error);
  }
}

async function updateTelephone(req, res, next) {
  try {
    const { id } = req.params;
    const { code, telephone, operateur_id } = req.body;

    const phone = await prisma.telephoneExecuteur.findUnique({ where: { id } });
    if (!phone) return res.status(404).json({ error: 'Telephone non trouve' });

    if (telephone && telephone !== phone.numeroTelephone) {
      const existant = await prisma.telephoneExecuteur.findUnique({ where: { numeroTelephone: telephone } });
      if (existant) return res.status(409).json({ error: 'Ce numero est deja utilise' });
    }

    const updated = await prisma.telephoneExecuteur.update({
      where: { id },
      data: {
        ...(code && { nomAppareil: code }),
        ...(telephone && { numeroTelephone: telephone }),
        ...(operateur_id && { operateurId: operateur_id }),
      },
    });
    logger.info('Telephone modifie', { id, code: updated.nomAppareil });
    res.json({ message: 'Telephone modifie', telephone: updated });
  } catch (error) {
    next(error);
  }
}

async function deleteTelephone(req, res, next) {
  try {
    const { id } = req.params;

    const phone = await prisma.telephoneExecuteur.findUnique({ where: { id } });
    if (!phone) return res.status(404).json({ error: 'Telephone non trouve' });

    const tachesEnCours = await prisma.tacheUSSD.count({
      where: { telephoneExecuteurId: id, statutExecution: { in: ['en_attente', 'en_cours'] } },
    });
    if (tachesEnCours > 0) {
      return res.status(409).json({ error: `Impossible de supprimer: ${tachesEnCours} tache(s) en cours` });
    }

    await prisma.telephoneExecuteur.delete({ where: { id } });
    logger.info('Telephone supprime', { id, code: phone.nomAppareil });
    res.json({ message: 'Telephone supprime' });
  } catch (error) {
    next(error);
  }
}

async function executerUssd(req, res, next) {
  try {
    const { service_id, telephone_beneficiaire } = req.body;

    if (!service_id || !telephone_beneficiaire) {
      return res.status(400).json({ error: 'service_id et telephone_beneficiaire requis' });
    }

    const service = await prisma.serviceCatalogue.findUnique({
      where: { id: service_id, actif: true },
      include: { operateur: { select: { nom: true } } },
    });

    if (!service) return res.status(404).json({ error: 'Service non trouve ou inactif' });

    // Check for duplicate running command (idempotency)
    const existante = await prisma.commande.findFirst({
      where: {
        telephoneBeneficiaire: telephone_beneficiaire,
        serviceId: service_id,
        statutCommande: { in: ['en_attente_paiement', 'paiement_soumis', 'en_cours_execution'] },
        createdAt: { gte: new Date(Date.now() - 3600000) },
      },
    });
    if (existante) {
      return res.status(409).json({ error: 'Une commande identique est deja en cours', commandeId: existante.id });
    }

    // Create command directly in "paiement_valide" status (skip payment)
    const reference = `USSD-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${Math.random().toString(36).substring(2,8).toUpperCase()}`;

    const commande = await prisma.commande.create({
      data: {
        user: { connect: { id: req.user.id } },
        service: { connect: { id: service.id } },
        telephoneBeneficiaire: telephone_beneficiaire,
        referenceUnique: reference,
        montant: service.montantWave,
        statutCommande: 'paiement_valide',
        lienPaiementWave: '',
        dateExpirationPaiement: new Date(Date.now() + 900000),
      },
    });

    // Create USSD task
    const task = await prisma.tacheUSSD.create({
      data: {
        commandeId: commande.id,
        statutExecution: 'en_attente',
        priorite: 5,
      },
    });

    // Add to execution queue
    const { executionQueue } = require('../jobs/executionJob');
    await executionQueue.add({ taskId: task.id, commandeId: commande.id });

    logger.info('USSD execute depuis admin', { commandeId: commande.id, service: service.nom, telephone: telephone_beneficiaire });

    res.status(201).json({
      message: 'Commande USSD creee et mise en file',
      commande: {
        id: commande.id,
        reference,
        service: service.nom,
        operateur: service.operateur.nom,
        telephone: telephone_beneficiaire,
        code_ussd: service.codeUssd,
        sequence: service.sequenceUssd,
        montant: service.montantWave,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { dashboard, telephones, commandes, revalider, logs, listServices, createService, updateService, deleteService, historique, createTelephone, updateTelephone, deleteTelephone, executerUssd };
