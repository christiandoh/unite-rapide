const Queue = require('bull');
const Redis = require('ioredis');
const prisma = require('../config/prisma');
const { logger } = require('../config/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://:changeme_redis_2026@redis:6379';

const executionQueue = new Queue('ussd-execution', REDIS_URL, {
  defaultJobOptions: {
    attempts: 10,
    backoff: { type: 'exponential', delay: 15000 },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

const publisher = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });

executionQueue.process(async (job) => {
  const { taskId, commandeId } = job.data;

  try {
    const task = await prisma.tacheUSSD.findUnique({
      where: { id: taskId },
      include: {
        commande: {
          include: {
            service: { select: { codeUssd: true, sequenceUssd: true, operateur: { select: { nom: true } } } },
          },
        },
      },
    });

    if (!task || task.statutExecution !== 'en_attente') {
      logger.warn('Tache indisponible', { taskId, statut: task?.statutExecution });
      return;
    }

    const operateurNom = task.commande.service.operateur.nom;
    const phonesDB = await prisma.telephoneExecuteur.findMany({
      where: { operateur: { nom: operateurNom } },
      orderBy: { derniereConnexion: 'desc' },
    });

    let phone = null;
    for (const p of phonesDB) {
      try {
        const statusData = await publisher.get(`phone:status:${p.id}`);
        if (statusData) {
          const parsed = JSON.parse(statusData);
          if (parsed.status === 'en_ligne') { phone = p; break; }
          if (!parsed.status && parsed.lastSeen) {
            const elapsed = Date.now() - new Date(parsed.lastSeen).getTime();
            if (elapsed < 120000) { phone = p; break; }
          }
        }
      } catch (_) {}
    }

    if (!phone) {
      logger.warn('Telephone non connecte, replanification', { operateur: operateurNom, taskId });
      await prisma.tacheUSSD.update({
        where: { id: taskId },
        data: { statutExecution: 'en_attente', messageErreur: 'En attente telephone disponible' },
      });
      await executionQueue.add({ taskId, commandeId }, { delay: 30000 });
      return;
    }

    await prisma.tacheUSSD.update({
      where: { id: taskId },
      data: {
        statutExecution: 'en_cours',
        telephoneExecuteurId: phone.id,
        dateDebutExecution: new Date(),
        logsExecution: [{ action: 'debut', timestamp: new Date().toISOString() }],
      },
    });

    if (!publisher.status || publisher.status !== 'ready') {
      await publisher.connect().catch(() => {});
    }

    await publisher.publish('ussd:execute', JSON.stringify({
      taskId,
      commandeId,
      code: task.commande.service.codeUssd,
      sequence: task.commande.service.sequenceUssd,
      phoneId: phone.id,
    }));

    await prisma.telephoneExecuteur.update({
      where: { id: phone.id },
      data: { statut: 'occupe' },
    });

    logger.info('Tache USSD envoyee au telephone', { taskId, commandeId, phone: phone.numeroTelephone });
  } catch (error) {
    logger.error('Erreur execution USSD', { taskId, error: error.message });
    await executionQueue.add({ taskId, commandeId }, { delay: 30000 }).catch(() => {});
  }
});

async function startExecutionQueue() {
  await publisher.connect().catch(() => {});
  logger.info('File d\'execution USSD demarree');
}

module.exports = { executionQueue, startExecutionQueue };
