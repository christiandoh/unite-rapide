const Queue = require('bull');
const Redis = require('ioredis');
const prisma = require('../config/prisma');
const { logger } = require('../config/logger');
const { selectBestPhone, incrementPhoneActiveTasks } = require('../services/phoneSelector.service');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_CONCURRENCY = parseInt(process.env.USSD_QUEUE_CONCURRENCY || '8', 10);

const executionQueue = new Queue('ussd-execution', REDIS_URL, {
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false,
  },
  limiter: {
    max: QUEUE_CONCURRENCY,
    duration: 1000,
  },
});

const publisher = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
const gammuService = require('../services/gammu.service');

executionQueue.process(QUEUE_CONCURRENCY, async (job) => {
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

    const phone = await selectBestPhone(phonesDB);

    if (!phone) {
      logger.warn('Telephone non connecte, replanification', { operateur: operateurNom, taskId });
      await prisma.tacheUSSD.update({
        where: { id: taskId },
        data: { statutExecution: 'en_attente', messageErreur: 'En attente telephone disponible' },
      });
      await executionQueue.add({ taskId, commandeId }, { delay: 30000, jobId: `retry-${taskId}-${Date.now()}` });
      return;
    }

    await prisma.tacheUSSD.update({
      where: { id: taskId },
      data: {
        statutExecution: 'en_cours',
        telephoneExecuteurId: phone.id,
        dateDebutExecution: new Date(),
        logsExecution: [{ action: 'debut', timestamp: new Date().toISOString(), phoneId: phone.id }],
      },
    });

    if (!publisher.status || publisher.status !== 'ready') {
      await publisher.connect().catch(() => {});
    }

    const codeUssd = task.commande.service.codeUssd
      .replace(/\{numero\}/g, task.commande.telephoneBeneficiaire)
      .replace(/\{montant\}/g, task.commande.montant.toString());

    const sequence = (task.commande.service.sequenceUssd || []).map(s =>
      s.replace(/\{numero\}/g, task.commande.telephoneBeneficiaire)
       .replace(/\{montant\}/g, task.commande.montant.toString())
    );

    if (gammuService.available) {
      try {
        const res = await gammuService.executeUSSD(codeUssd);
        await prisma.commande.update({
          where: { id: commandeId },
          data: { statutCommande: res.success ? 'execute' : 'echoue' },
        });
        await prisma.tacheUSSD.update({
          where: { id: taskId },
          data: {
            statutExecution: res.success ? 'reussi' : 'echoue',
            dateFinExecution: new Date(),
            messageErreur: res.error || null,
          },
        });
        logger.info('Tache USSD executee via Gammu', { taskId, commandeId, success: res.success });
        return;
      } catch (gammuErr) {
        logger.warn('Gammu echoue, fallback vers telephone', { taskId, error: gammuErr.message });
      }
    }

    await incrementPhoneActiveTasks(phone.id);

    await publisher.publish('ussd:execute', JSON.stringify({
      taskId,
      commandeId,
      code: codeUssd,
      sequence,
      phoneId: phone.id,
    }));

    await prisma.commande.update({
      where: { id: commandeId },
      data: { statutCommande: 'en_cours_execution' },
    });

    await prisma.telephoneExecuteur.update({
      where: { id: phone.id },
      data: { statut: 'occupe' },
    });

    logger.info('Tache USSD envoyee au telephone', { taskId, commandeId, phone: phone.numeroTelephone });
  } catch (error) {
    logger.error('Erreur execution USSD', { taskId, error: error.message });
    await executionQueue.add({ taskId, commandeId }, { delay: 30000, jobId: `retry-${taskId}-${Date.now()}` }).catch(() => {});
  }
});

async function startExecutionQueue() {
  await publisher.connect().catch(() => {});
  logger.info('File d\'execution USSD demarree', { concurrency: QUEUE_CONCURRENCY });
}

module.exports = { executionQueue, startExecutionQueue };
