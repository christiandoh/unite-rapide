const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { generateTokens, verifyRefreshToken } = require('../config/jwt');
const { logger } = require('../config/logger');

const SALT_ROUNDS = 12;

async function register(req, res, next) {
  try {
    const { nom, prenom, telephone, email, mot_de_passe } = req.body;

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ telephone }, ...(email ? [{ email }] : [])],
      },
    });

    if (existing) {
      return res.status(409).json({
        error: 'Un compte existe déjà avec ce téléphone ou cet email',
      });
    }

    const motDePasseHash = await bcrypt.hash(mot_de_passe, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        nom,
        prenom: prenom || null,
        telephone,
        email: email || null,
        motDePasseHash,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        telephone: true,
        email: true,
        statut: true,
        createdAt: true,
      },
    });

    const tokens = generateTokens({ userId: user.id });

    logger.info('Nouvel utilisateur inscrit', { userId: user.id, telephone });

    res.status(201).json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { telephone, email, mot_de_passe } = req.body;
    const identifiant = telephone || email;

    if (!identifiant) {
      return res.status(400).json({ error: 'Téléphone ou email requis' });
    }

    const user = email
      ? await prisma.user.findUnique({ where: { email } })
      : await prisma.user.findUnique({ where: { telephone: identifiant } });

    if (!user || user.statut !== 'actif') {
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    }

    const isValid = await bcrypt.compare(mot_de_passe, user.motDePasseHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { derniereConnexion: new Date() },
    });

    const tokens = generateTokens({ userId: user.id });

    logger.info('Utilisateur connecté', { userId: user.id, identifiant });

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        email: user.email,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function refreshToken(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requis' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    const tokens = generateTokens({ userId: decoded.userId });

    res.json({ token: tokens.accessToken });
  } catch (error) {
    return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
  }
}

async function verifyPhone(req, res, next) {
  try {
    const { telephone, code } = req.body;

    if (!telephone || !code) {
      return res.status(400).json({ error: 'Téléphone et code requis' });
    }

    const redis = require('../config/redis');
    const storedCode = await redis.get(`sms:verify:${telephone}`);

    if (!storedCode) {
      return res.status(400).json({ error: 'Code expiré ou inexistant. Demandez un nouveau code.' });
    }

    if (storedCode !== code) {
      return res.status(400).json({ error: 'Code incorrect' });
    }

    await redis.del(`sms:verify:${telephone}`);

    await prisma.user.updateMany({
      where: { telephone },
      data: { telephoneVerifie: true },
    });

    await prisma.transactionLog.create({
      data: {
        typeEvenement: 'telephone_verifie',
        severite: 'info',
        details: { telephone },
      },
    });

    logger.info(`Téléphone vérifié: ${telephone}`);
    res.json({ message: 'Téléphone vérifié avec succès' });
  } catch (error) {
    next(error);
  }
}

async function sendVerifyCode(req, res, next) {
  try {
    const { telephone } = req.body;

    if (!telephone) {
      return res.status(400).json({ error: 'Téléphone requis' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const redis = require('../config/redis');

    await redis.setex(`sms:verify:${telephone}`, 300, code);
    logger.info(`Code de vérification généré pour ${telephone}: ${code}`);

    res.json({ message: 'Code de vérification envoyé' });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refreshToken, verifyPhone, sendVerifyCode };
