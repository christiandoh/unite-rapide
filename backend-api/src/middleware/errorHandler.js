const { logger } = require('../config/logger');

function errorHandler(err, req, res, next) {
  logger.error('Error handler', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Erreur de validation',
      details: err.details,
    });
  }

  if (err.code === 'P2002') {
    return res.status(409).json({
      error: 'Conflit',
      message: 'Cette ressource existe déjà',
    });
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      error: 'Non trouvé',
      message: 'La ressource demandée n\'existe pas',
    });
  }

  const status = err.status || err.statusCode || 500;
  const message = err.expose ? err.message : 'Erreur interne du serveur';

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
