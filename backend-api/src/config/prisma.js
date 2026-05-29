const { PrismaClient } = require('@prisma/client');
const redis = require('./redis');
const { logger } = require('./logger');

const baseClient = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

baseClient.$on('error', (e) => logger.error('Prisma error', { message: e.message }));
baseClient.$on('warn', (e) => logger.warn('Prisma warn', { message: e.message }));
baseClient.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug('Prisma query', { query: e.query, duration: e.duration });
  }
});

const prisma = baseClient.$extends({
  query: {
    async $allOperations({ model, operation, args, query }) {
      const cacheKey = `prisma:${model}:${operation}:${JSON.stringify(args)}`;
      const ttl = 60;

      if (['findUnique', 'findFirst', 'findMany', 'count'].includes(operation)) {
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            logger.debug(`Cache hit: ${cacheKey}`);
            return JSON.parse(cached);
          }
        } catch (err) {
          logger.warn('Cache read error', { error: err.message });
        }
      }

      const result = await query(args);

      if (['create', 'update', 'delete', 'upsert', 'updateMany', 'deleteMany'].includes(operation)) {
        try {
          const keys = await redis.keys(`prisma:${model}:*`);
          if (keys.length > 0) {
            await redis.del(keys);
            logger.debug(`Cache invalidated for model: ${model} (${keys.length} keys)`);
          }
        } catch (err) {
          logger.warn('Cache invalidation error', { error: err.message });
        }
      }

      if (['findUnique', 'findFirst', 'findMany', 'count'].includes(operation)) {
        try {
          await redis.setex(cacheKey, ttl, JSON.stringify(result));
        } catch (err) {
          logger.warn('Cache write error', { error: err.message });
        }
      }

      return result;
    },
  },
});

module.exports = prisma;
