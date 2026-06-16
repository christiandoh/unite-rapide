const bcrypt = require('bcrypt');
const prisma = require('../config/prisma');
const { generateTokens, verifyRefreshToken } = require('../config/jwt');
const { logger } = require('../config/logger');
const { isValidPin, normalizePin } = require('../utils/pin');

const SALT_ROUNDS = 12;

async function register(req, res, next) {
  try {
    const { nom, prenom, telephone, email, code_pin } = req.body;

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

    const codePinHash = await bcrypt.hash(normalizePin(code_pin), SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        nom,
        prenom: prenom || null,
        telephone,
        email: email || null,
        codePinHash,
        telephoneVerifie: true,
      },
      select: {
        id: true,
        nom: true,
        prenom: true,
        telephone: true,
        email: true,
        statut: true,
        role: true,
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
    const { telephone, code_pin } = req.body;

    const user = await prisma.user.findUnique({ where: { telephone } });

    if (!user || user.statut !== 'actif') {
      return res.status(401).json({ error: 'Numéro ou code incorrect' });
    }

    const isValid = await bcrypt.compare(normalizePin(code_pin), user.codePinHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Numéro ou code incorrect' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { derniereConnexion: new Date() },
    });

    const tokens = generateTokens({ userId: user.id });

    logger.info('Utilisateur connecté', { userId: user.id, telephone });

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        telephone: user.telephone,
        email: user.email,
        role: user.role,
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

async function changePin(req, res, next) {
  try {
    const { ancien_code, nouveau_code } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const isValid = await bcrypt.compare(normalizePin(ancien_code), user.codePinHash);
    if (!isValid) {
      return res.status(400).json({ error: 'Ancien code incorrect' });
    }

    const codePinHash = await bcrypt.hash(normalizePin(nouveau_code), SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: { codePinHash },
    });

    res.json({ message: 'Code modifié avec succès' });
  } catch (error) {
    next(error);
  }
}

module.exports = { register, login, refreshToken, changePin };
