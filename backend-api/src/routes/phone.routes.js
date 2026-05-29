const { Router } = require('express');
const prisma = require('../config/prisma');
const Redis = require('ioredis');
const { logger } = require('../config/logger');

const REDIS_URL = process.env.REDIS_URL || 'redis://:changeme_redis_2026@redis:6379';
const redis = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 0 });

redis.connect().catch(() => {});

const router = Router();

router.post('/lookup', async (req, res, next) => {
  try {
    const { code, telephone } = req.body;

    if (!code || !telephone) {
      return res.status(400).json({ error: 'Code et telephone requis' });
    }

    const phone = await prisma.telephoneExecuteur.findFirst({
      where: { nomAppareil: code, numeroTelephone: telephone },
      select: { id: true, tokenAuth: true, nomAppareil: true, operateur: { select: { nom: true } } },
    });

    if (!phone) {
      return res.status(404).json({ error: 'Telephone non trouve. Verifiez le code et le numero.' });
    }

    const token = phone.tokenAuth;

    await redis.set(`phone:token:${token}`, JSON.stringify({
      id: phone.id,
      operateur: phone.operateur?.nom || 'Inconnu',
      numeroTelephone: telephone,
    }));

    logger.info('Phone lookup reussi', { code, telephone });

    const publicUrl = process.env.PUBLIC_URL || `http://${req.hostname}`;

    res.json({
      token,
      serveur: {
        ws: `${publicUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')}/unite/ws`,
        api: `${publicUrl}/unite/api`,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
