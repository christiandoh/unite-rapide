const prisma = require('../config/prisma');

async function list(req, res, next) {
  try {
    const {
      operateur,
      type,
      search,
      min_price,
      max_price,
      page = 1,
      limit = 20,
    } = req.query;

    const where = { actif: true };

    if (operateur) {
      where.operateur = { nom: { equals: operateur, mode: 'insensitive' } };
    }

    if (type) {
      where.typeService = type;
    }

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (min_price || max_price) {
      where.montantWave = {};
      if (min_price) where.montantWave.gte = parseFloat(min_price);
      if (max_price) where.montantWave.lte = parseFloat(max_price);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [services, total] = await Promise.all([
      prisma.serviceCatalogue.findMany({
        where,
        include: {
          operateur: { select: { id: true, nom: true, logoUrl: true } },
        },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceCatalogue.count({ where }),
    ]);

    res.json({
      services,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
}

async function getById(req, res, next) {
  try {
    const service = await prisma.serviceCatalogue.findUnique({
      where: { id: req.params.id },
      include: {
        operateur: { select: { id: true, nom: true, logoUrl: true, prefixe: true } },
      },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service non trouvé' });
    }

    res.json({ service });
  } catch (error) {
    next(error);
  }
}

async function featured(req, res, next) {
  try {
    const populaires = await prisma.serviceCatalogue.findMany({
      where: { actif: true, populaire: true },
      include: {
        operateur: { select: { id: true, nom: true, logoUrl: true } },
      },
      take: 6,
    });

    res.json({ populaires, promotions: [] });
  } catch (error) {
    next(error);
  }
}

module.exports = { list, getById, featured };
