require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const Redis = require('ioredis');
const { createLogger, format, transports } = require('winston');

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(format.timestamp(), format.json()),
  transports: [
    new transports.Console({
      format: format.combine(format.colorize(), format.printf(({ timestamp, level, message }) => `${timestamp} ${level}: ${message}`)),
    }),
  ],
});

const REDIS_URL = process.env.REDIS_URL || 'redis://:change_me@redis:6379';
const PORT = process.env.PORT || 8080;

const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 200, 2000),
  lazyConnect: true,
});

const app = express();
const server = http.createServer(app);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});

const phones = new Map();
const webClients = new Map();

io.on('connection', async (socket) => {
  const token = socket.handshake.auth?.token;
  if (token) {
    try {
      const phoneData = await redis.get(`phone:token:${token}`);
      if (phoneData) {
        const phone = JSON.parse(phoneData);
        socket.phoneId = phone.id;
        socket.operator = phone.operateur;
        socket.phoneNumber = phone.numeroTelephone;
        handlePhoneConnection(socket);
        return;
      }
    } catch (_) {}
  }
  const webId = socket.id;
  webClients.set(webId, { socketId: webId, connectedAt: new Date() });
  logger.info(`🌐 Client Web connecté: ${webId}`);
  socket.on('subscribe:commande', (commandeId) => socket.join(`commande:${commandeId}`));
  socket.on('unsubscribe:commande', (commandeId) => socket.leave(`commande:${commandeId}`));
  socket.on('disconnect', () => {
    webClients.delete(webId);
    logger.info(`🌐 Client Web déconnecté: ${webId}`);
  });
});

io.of('/phones').use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Token d\'authentification requis'));
  try {
    const phoneData = await redis.get(`phone:token:${token}`);
    if (!phoneData) return next(new Error('Token invalide'));
    const phone = JSON.parse(phoneData);
    socket.phoneId = phone.id;
    socket.operator = phone.operateur;
    socket.phoneNumber = phone.numeroTelephone;
    next();
  } catch (err) {
    next(new Error('Erreur d\'authentification'));
  }
});

io.of('/phones').on('connection', (socket) => {
  handlePhoneConnection(socket);
});

function handlePhoneConnection(socket) {
  logger.info(`📱 Téléphone connecté: ${socket.phoneNumber} (${socket.operator})`);

  phones.set(socket.phoneId, {
    id: socket.phoneId,
    socketId: socket.id,
    operator: socket.operator,
    number: socket.phoneNumber,
    connectedAt: new Date(),
    status: 'en_ligne',
  });

  redis.set(`phone:status:${socket.phoneId}`, JSON.stringify({
    status: 'en_ligne',
    lastSeen: new Date().toISOString(),
  }));

  io.of('/web').emit('phone:status', {
    phoneId: socket.phoneId,
    status: 'en_ligne',
    number: socket.phoneNumber,
  });

  socket.on('phone:status', async (statusData) => {
    const existing = phones.get(socket.phoneId);
    if (existing) {
      phones.set(socket.phoneId, { ...existing, ...statusData });
    }
    try {
      const prevData = await redis.get(`phone:status:${socket.phoneId}`);
      const prev = prevData ? JSON.parse(prevData) : {};
      await redis.set(`phone:status:${socket.phoneId}`, JSON.stringify({
        ...prev,
        ...statusData,
        lastSeen: new Date().toISOString(),
      }));
    } catch (_) {}
    io.of('/web').emit('phone:status', {
      phoneId: socket.phoneId,
      ...statusData,
    });
  });

  socket.on('ussd:execute', (data) => {
    logger.info(`📤 USSD envoyé au téléphone ${socket.phoneNumber}`, { data });
    io.of('/web').emit('status:update', {
      commandeId: data.commandeId,
      status: 'en_cours_execution',
      message: 'Code USSD en cours d\'exécution',
    });
  });

  socket.on('ussd:result', async (data) => {
    logger.info(`📥 Résultat USSD de ${socket.phoneNumber}`, { data });

    const { commandeId, success, message, logs } = data;

    await redis.publish('ussd:results', JSON.stringify({
      commandeId,
      phoneId: socket.phoneId,
      success,
      message,
      logs,
      timestamp: new Date().toISOString(),
    }));

    io.of('/web').emit('status:update', {
      commandeId,
      status: success ? 'execute' : 'echoue',
      message,
    });
  });

  socket.on('disconnect', () => {
    logger.info(`📱 Téléphone déconnecté: ${socket.phoneNumber}`);

    phones.delete(socket.phoneId);

    redis.set(`phone:status:${socket.phoneId}`, JSON.stringify({
      status: 'hors_ligne',
      lastSeen: new Date().toISOString(),
    }));

    io.of('/web').emit('phone:status', {
      phoneId: socket.phoneId,
      status: 'hors_ligne',
    });
  });
}

io.of('/web').on('connection', (socket) => {
  logger.info(`🌐 Client Web connecté: ${socket.id}`);

  socket.on('subscribe:commande', (commandeId) => {
    socket.join(`commande:${commandeId}`);
    logger.info(`Client ${socket.id} suit la commande ${commandeId}`);
  });

  socket.on('unsubscribe:commande', (commandeId) => {
    socket.leave(`commande:${commandeId}`);
  });

  socket.on('get:phones', () => {
    const phoneList = Array.from(phones.values());
    socket.emit('phones:list', phoneList);
  });

  socket.on('ussd:send', (data) => {
    const { phoneId, code, sequence, commandeId } = data;
    const phone = phones.get(phoneId);
    if (phone) {
      io.of('/phones').to(phone.socketId).emit('ussd:execute', {
        commandeId,
        code,
        sequence,
      });
    }
  });

  socket.on('disconnect', () => {
    logger.info(`🌐 Client Web déconnecté: ${socket.id}`);
  });
});

async function bootstrap() {
  try {
    await redis.connect();
    logger.info('Redis connecté');

    const sub = new Redis(REDIS_URL, { lazyConnect: true });
    await sub.connect();
    await sub.subscribe('ussd:execute');
    sub.on('message', (channel, message) => {
      if (channel !== 'ussd:execute') return;
      try {
        const parsed = JSON.parse(message);
        const { taskId, commandeId, code, sequence, phoneId } = parsed;
        const phone = phoneId ? phones.get(phoneId) : null;
        if (phone) {
          io.of('/phones').to(phone.socketId).emit('ussd:execute', { commandeId, code, sequence });
          io.of('/web').emit('status:update', { commandeId, status: 'en_cours_execution', message: 'Code USSD envoye au telephone' });
          logger.info(`Commande USSD envoyee au telephone ${phone.number}`, { commandeId, taskId });
        } else {
          logger.warn('Aucun telephone disponible pour execution', { commandeId, taskId });
        }
      } catch (err) {
        logger.error(`Erreur traitement message ussd:execute: ${err.message}`);
      }
    });
    logger.info('Redis subscriber actif (channel: ussd:execute)');

    server.listen(PORT, () => {
      logger.info(`WebSocket Server demarre sur le port ${PORT}`);
    });
  } catch (error) {
    logger.error('Erreur demarrage', { error: error.message });
    process.exit(1);
  }
}

bootstrap();
