const Queue = require('bull');
const prisma = require('../config/prisma');
const { logger } = require('../config/logger');
const executionQueue = require('./executionJob');

const REDIS_URL = process.env.REDIS_URL || 'redis://:change_me@redis:6379';

const retryQueue = new Queue('ussd-retry', REDIS_URL, {
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false,
  },
});

retryQueue.process(async (job) => {
  if (job.data.scheduled) {
    const failedTasks = await prisma.tacheUSSD.findMany({
      where: {
        statutExecution: 'echoue',
        nombreTentatives: { lt: prisma.tacheUSSD.tentativeMax },
      },
      include: { commande: true },
    });

    for (const task of failedTasks) {
      await prisma.tacheUSSD.update({
        where: { id: task.id },
        data: {
          statutExecution: 'en_attente',
          nombreTentatives: { increment: 1 },
        },
      });
      logger.info('Tâche réinsérée', { taskId: task.id, tentative: task.nombreTentatives + 1 });
    }
    logger.info(`Reprise: ${failedTasks.length} tâche(s) réinsérée(s)`);
    return;
  }

  const { taskId } = job.data;
  try {
    const task = await prisma.tacheUSSD.findUnique({
      where: { id: taskId },
    });

    if (!task || task.statutExecution !== 'echoue') return;

    if (task.nombreTentatives >= task.tentativeMax) {
      logger.warn('Tâche abandonnée - max tentatives', { taskId });
      return;
    }

    await prisma.tacheUSSD.update({
      where: { id: taskId },
      data: {
        statutExecution: 'en_attente',
        nombreTentatives: { increment: 1 },
      },
    });
    logger.info('Tâche réinsérée', { taskId, tentative: task.nombreTentatives + 1 });
  } catch (error) {
    logger.error('Erreur reprise tâche', { taskId, error: error.message });
  }
});

async function startRetryJob() {
  await retryQueue.add(
    { scheduled: true },
    {
      repeat: { every: 300000 },
      jobId: 'ussd-retry-scheduler',
    }
  );
  logger.info('Job de reprise démarré (intervalle: 5min)');
}

module.exports = { retryQueue, startRetryJob };
