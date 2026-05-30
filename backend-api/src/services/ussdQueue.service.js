const Queue = require('bull');
const { logger } = require('../config/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const ussdQueue = new Queue('ussd-execution', REDIS_URL, {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
    timeout: 60000,
  },
  limiter: {
    max: 2,
    duration: 1000,
  },
  settings: {
    stalledInterval: 30000,
    maxStalledCount: 2,
  },
});

ussdQueue.on('completed', (job, result) => {
  logger.info('Tâche USSD terminée', { jobId: job.id, result });
});

ussdQueue.on('failed', (job, err) => {
  logger.error('Tâche USSD échouée', {
    jobId: job.id,
    error: err.message,
    attempts: job.attemptsMade,
  });
});

ussdQueue.on('stalled', (job) => {
  logger.warn('Tâche USSD bloquée', { jobId: job.id });
});

async function addUSSDTask(taskData) {
  const job = await ussdQueue.add(taskData, {
    jobId: taskData.taskId,
    priority: taskData.priorite || 5,
    attempts: taskData.tentativeMax || 3,
  });

  logger.info('Tâche USSD ajoutée à la file', {
    taskId: taskData.taskId,
    jobId: job.id,
    phoneId: taskData.phoneId,
  });

  return job;
}

async function getQueueStats() {
  const [waiting, active, completed, failed, delayed] = await Promise.all([
    ussdQueue.getWaitingCount(),
    ussdQueue.getActiveCount(),
    ussdQueue.getCompletedCount(),
    ussdQueue.getFailedCount(),
    ussdQueue.getDelayedCount(),
  ]);

  return { waiting, active, completed, failed, delayed };
}

async function removeJob(jobId) {
  const job = await ussdQueue.getJob(jobId);
  if (job) {
    await job.remove();
    logger.info('Tâche supprimée de la file', { jobId });
  }
}

module.exports = { ussdQueue, addUSSDTask, getQueueStats, removeJob };
