const Redis = require('ioredis');
const { logger } = require('../config/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const MAX_CONCURRENT_PER_PHONE = parseInt(process.env.USSD_MAX_CONCURRENT_PER_PHONE || '4', 10);
const ONLINE_THRESHOLD_MS = parseInt(process.env.USSD_PHONE_ONLINE_THRESHOLD_MS || '120000', 10);

let redisClient;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 1 });
  }
  return redisClient;
}

async function getPhoneActiveTaskCount(redis, phoneId) {
  const raw = await redis.get(`phone:active_tasks:${phoneId}`);
  return raw ? parseInt(raw, 10) : 0;
}

async function isPhoneOnline(redis, phoneId) {
  const statusData = await redis.get(`phone:status:${phoneId}`);
  if (!statusData) return false;

  try {
    const parsed = JSON.parse(statusData);
    if (parsed.status === 'en_ligne') return true;
    if (parsed.lastSeen) {
      const elapsed = Date.now() - new Date(parsed.lastSeen).getTime();
      return elapsed < ONLINE_THRESHOLD_MS;
    }
  } catch (_) {
    return false;
  }
  return false;
}

/**
 * Sélectionne le téléphone exécuteur le moins chargé pour un opérateur donné.
 */
async function selectBestPhone(phones) {
  if (!phones.length) return null;

  const redis = getRedis();
  if (redis.status !== 'ready') {
    await redis.connect().catch(() => {});
  }

  const candidates = [];

  for (const phone of phones) {
    const online = await isPhoneOnline(redis, phone.id);
    if (!online) continue;

    const activeTasks = await getPhoneActiveTaskCount(redis, phone.id);
    if (activeTasks >= MAX_CONCURRENT_PER_PHONE) continue;

    candidates.push({ phone, activeTasks });
  }

  if (!candidates.length) {
    logger.warn('Aucun téléphone disponible sous la limite de concurrence', {
      maxConcurrent: MAX_CONCURRENT_PER_PHONE,
    });
    return null;
  }

  candidates.sort((a, b) => a.activeTasks - b.activeTasks);
  return candidates[0].phone;
}

async function incrementPhoneActiveTasks(phoneId) {
  const redis = getRedis();
  if (redis.status !== 'ready') await redis.connect().catch(() => {});
  const key = `phone:active_tasks:${phoneId}`;
  const count = await redis.incr(key);
  await redis.expire(key, 3600);
  return count;
}

async function decrementPhoneActiveTasks(phoneId) {
  const redis = getRedis();
  if (redis.status !== 'ready') await redis.connect().catch(() => {});
  const key = `phone:active_tasks:${phoneId}`;
  const count = await redis.decr(key);
  if (count <= 0) await redis.del(key);
  return Math.max(0, count);
}

module.exports = {
  selectBestPhone,
  incrementPhoneActiveTasks,
  decrementPhoneActiveTasks,
  MAX_CONCURRENT_PER_PHONE,
};
