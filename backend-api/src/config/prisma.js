const { PrismaClient, Prisma } = require('@prisma/client');
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

// Sérialiseur qui gère Date, Decimal, BigInt
function serialize(value) {
  return JSON.stringify(value, (key, val) => {
    if (typeof val === 'bigint') return val.toString();
    if (val instanceof Date) return val.toISOString();
    if (val && typeof val === 'object' && 's' in val && 'e' in val) {
      // Prisma Decimal peut arriver sous forme d'objet Decimal
      return String(val);
    }
    return val;
  });
}

async function invalidateModelCache(model) {
  let cursor = '0';
  let deleted = 0;
  do {
    const [nextCursor, keys] = await redis.scan(cursor, {
      match: `prisma:${model}:*`,
      count: 100,
    });
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(keys);
      deleted += keys.length;
    }
  } while (cursor !== '0');
  if (deleted > 0) {
    logger.debug(`Cache invalidated for model: ${model} (${deleted} keys)`);
  }
}

const READ_OPS = ['findUnique', 'findFirst', 'findMany', 'count'];
const WRITE_OPS = ['create', 'update', 'delete', 'upsert', 'updateMany', 'deleteMany'];

const prisma = baseClient.$extends({
  query: {
    async $allOperations({ model, operation, args, query }) {
      const isRead = READ_OPS.includes(operation);
      const isWrite = WRITE_OPS.includes(operation);

      if (isRead) {
        const cacheKey = `prisma:${model}:${operation}:${serialize(args)}`;
        try {
          const cached = await redis.get(cacheKey);
          if (cached) {
            logger.debug(`Cache hit: ${cacheKey}`);
            return JSON.parse(cached);
          }
          const result = await query(args);
          const safeResult = JSON.parse(serialize(result));
          await redis.setex(cacheKey, 60, serialize(safeResult));
          return result;
        } catch (err) {
          logger.warn('Cache error', { error: err.message });
          return query(args);
        }
      }

      const result = await query(args);

      if (isWrite) {
        try {
          await invalidateModelCache(model);
        } catch (err) {
          logger.warn('Cache invalidation error', { error: err.message });
        }
      }

      return result;
    },
  },
});

module.exports = prisma;
