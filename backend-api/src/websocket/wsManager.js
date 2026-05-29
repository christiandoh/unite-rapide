const { io } = require('socket.io-client');
const { logger } = require('../config/logger');
const redis = require('../config/redis');

const WS_URL = process.env.WS_SERVER_URL || 'http://websocket-server:8080';

let socket;

function connect() {
  socket = io(`${WS_URL}/web`, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 30000,
  });

  socket.on('connect', () => {
    logger.info('WebSocket client connecté au serveur');
    redis.set('ws:connected', 'true');
  });

  socket.on('disconnect', (reason) => {
    logger.warn('WebSocket client déconnecté', { reason });
    redis.set('ws:connected', 'false');
  });

  socket.on('connect_error', (error) => {
    logger.error('WebSocket connexion error', { error: error.message });
  });

  socket.on('status:update', (data) => {
    logger.info('Status update reçu', { data });
  });
}

function notifyCommandeUpdate(commandeId, data) {
  if (socket?.connected) {
    socket.emit('status:update', { commandeId, ...data });
  }
}

function getConnectionStatus() {
  return socket?.connected || false;
}

module.exports = { connect, notifyCommandeUpdate, getConnectionStatus };
