const http = require('http');
const app = require('./app');
const { logger } = require('./config/logger');
const prisma = require('./config/prisma');
const redis = require('./config/redis');
const wsManager = require('./websocket/wsManager');

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    await prisma.$connect();
    logger.info('PostgreSQL connecté via Prisma');

    await redis.ping();
    logger.info('Redis connecté');

    const { startResultConsumer } = require('./services/ussdResultConsumer');
    startResultConsumer().catch(err => logger.error('Erreur demarrage consumer USSD', { error: err.message }));

    const server = http.createServer(app);

    server.listen(PORT, () => {
      logger.info(`Serveur démarré sur le port ${PORT}`);
    });

    const shutdown = async (signal) => {
      logger.info(`Signal ${signal} reçu, arrêt gracieux...`);
      server.close(async () => {
        await prisma.$disconnect();
        redis.disconnect();
        logger.info('Arrêt terminé');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      logger.error('Unhandled Rejection', { reason });
    });

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  } catch (error) {
    logger.error('Erreur au démarrage', { error: error.message });
    process.exit(1);
  }
}

bootstrap();
