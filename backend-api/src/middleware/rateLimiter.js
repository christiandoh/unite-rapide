const rateLimit = require('express-rate-limit');
const redis = require('../config/redis');

async function redisStore(windowMs) {
  return {
    async increment(key) {
      const now = Date.now();
      const redisKey = `rl:${key}`;
      const multi = redis.multi();
      multi.zadd(redisKey, now, `${now}-${Math.random()}`);
      multi.zremrangebyscore(redisKey, 0, now - windowMs);
      multi.zcard(redisKey);
      multi.expire(redisKey, Math.ceil(windowMs / 1000));
      const results = await multi.exec();
      return { total: results[2][1], remaining: Math.max(0, results[2][1]) };
    },
    async decrement(key) {
      const redisKey = `rl:${key}`;
      await redis.zremrangebyrank(redisKey, 0, 0);
    },
    async resetKey(key) {
      await redis.del(`rl:${key}`);
    },
  };
}

function createRateLimiter({ windowMs = 15 * 60 * 1000, max = 20, keyPrefix = 'rl:', message, useRedis = false } = {}) {
  const opts = {
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${keyPrefix}${req.ip}`,
    handler: (req, res) => {
      res.status(429).json({ error: message || 'Trop de requêtes, réessayez plus tard.' });
    },
  };

  if (useRedis) {
    redisStore(windowMs).then(store => {
      opts.store = store;
    }).catch(() => {});
  }

  return rateLimit(opts);
}

const authLimiter = createRateLimiter({
  windowMs: 10 * 1000,
  max: 30,
  keyPrefix: 'rl:auth:',
  message: 'Trop de tentatives de connexion. Réessayez dans 1 minute.',
});

module.exports = { createRateLimiter, authLimiter };
