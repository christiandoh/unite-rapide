const prisma = require('../config/prisma');
const { logger } = require('../config/logger');

async function updateProfile(req, res, next) {
  try {
    const { nom, prenom, email } = req.body;
    const data = {};
    if (nom !== undefined) data.nom = nom;
    if (prenom !== undefined) data.prenom = prenom;
    if (email !== undefined) data.email = email;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: { id: true, nom: true, prenom: true, telephone: true, email: true, photoUrl: true },
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
}

async function uploadPhoto(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Photo requise' });
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { photoUrl },
      select: { id: true, photoUrl: true },
    });

    logger.info('Photo de profil mise a jour', { userId: req.user.id });

    res.json({ success: true, photoUrl: user.photoUrl });
  } catch (error) {
    next(error);
  }
}

module.exports = { updateProfile, uploadPhoto };
