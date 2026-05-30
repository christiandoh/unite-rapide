const Redis = require('ioredis');
const prisma = require('../config/prisma');
const { logger } = require('../config/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://:changeme_redis_2026@redis:6379';

async function startResultConsumer() {
  const sub = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });

  try {
    await sub.connect();
    await sub.subscribe('ussd:results');

    sub.on('message', async (channel, message) => {
      if (channel !== 'ussd:results') return;

      try {
        const { commandeId, phoneId, success, message: msg } = JSON.parse(message);

        // Idempotence: ignorer si deja traite
        const commande = await prisma.commande.findUnique({
          where: { id: commandeId },
          select: { statutCommande: true },
        });
        if (!commande || commande.statutCommande === 'execute' || commande.statutCommande === 'echoue') {
          return;
        }

        const taskStatus = success ? 'reussi' : 'echoue';
        const cmdStatus = success ? 'execute' : 'echoue';

        await prisma.tacheUSSD.updateMany({
          where: { commandeId, telephoneExecuteurId: phoneId },
          data: {
            statutExecution: taskStatus,
            dateFinExecution: new Date(),
            messageErreur: success ? null : msg || 'Echec execution',
            logsExecution: [{ action: taskStatus, message: msg, timestamp: new Date().toISOString() }],
          },
        });

        await prisma.commande.update({
          where: { id: commandeId },
          data: { statutCommande: cmdStatus },
        });

        await prisma.telephoneExecuteur.updateMany({
          where: { id: phoneId },
          data: { statut: 'en_ligne' },
        });

        logger.info(`Resultat USSD traite: commande=${commandeId.slice(0,8)} etat=${taskStatus}`);
      } catch (err) {
        logger.error('Erreur traitement resultat USSD', { error: err.message });
      }
    });

    logger.info('Consommateur resultats USSD actif (channel: ussd:results)');
  } catch (err) {
    logger.error('Erreur demarrage consommateur USSD', { error: err.message });
  }
}

module.exports = { startResultConsumer };
