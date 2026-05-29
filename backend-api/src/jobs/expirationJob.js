const Queue = require('bull');
const prisma = require('../config/prisma');
const { logger } = require('../config/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://:change_me@redis:6379';

const expirationQueue = new Queue('command-expiration', REDIS_URL, {
  defaultJobOptions: {
    repeat: { every: 60000 },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

expirationQueue.process(async () => {
  try {
    const now = new Date();

    const expired = await prisma.commande.updateMany({
      where: {
        statutCommande: 'en_attente_paiement',
        dateExpirationPaiement: { lte: now },
      },
      data: {
        statutCommande: 'echoue',
      },
    });

    if (expired.count > 0) {
      logger.info('Commandes expirées traitées', { count: expired.count });
    }
  } catch (error) {
    logger.error('Erreur traitement expiration', { error: error.message });
  }
});

async function startExpirationJob() {
  await expirationQueue.add({}, {
    repeat: { every: 60000 },
    jobId: 'command-expiration',
  });
  logger.info('Job d\'expiration démarré (intervalle: 60s)');
}

module.exports = { expirationQueue, startExpirationJob };
