const Redis = require('ioredis');
const { logger } = require('./logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis;

function createRedisClient() {
  redis = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 200, 2000);
      return delay;
    },
    reconnectOnError(err) {
      logger.error('Redis reconnect error', { error: err.message });
      return true;
    },
    lazyConnect: true,
    enableReadyCheck: true,
  });

  redis.on('connect', () => logger.info('Redis connecté'));
  redis.on('ready', () => logger.info('Redis prêt'));
  redis.on('error', (err) => logger.error('Redis error', { error: err.message }));
  redis.on('close', () => logger.warn('Redis déconnecté'));
  redis.on('reconnecting', (delay) => logger.info(`Redis reconnexion dans ${delay}ms`));

  return redis;
}

if (!redis) {
  redis = createRedisClient();
}

module.exports = redis;
