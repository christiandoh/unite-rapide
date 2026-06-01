import { io } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || '';

let socket = null;
let pendingSubscriptions = [];
let statusCallbacks = [];

export function connectWebSocket() {
  if (socket?.connected) return socket;

  if (!socket) {
    socket = io(`${WS_URL}/web`, {
      path: '/ws/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: Infinity,
    });

    socket.on('connect', () => {
      console.log('📡 WebSocket connecté');
      // Re-souscrire toutes les commandes en attente
      const subs = [...pendingSubscriptions];
      pendingSubscriptions = [];
      subs.forEach(id => socket.emit('subscribe:commande', id));
    });

    socket.on('disconnect', (reason) => console.warn('📡 WebSocket déconnecté:', reason));
    socket.on('connect_error', (err) => console.error('📡 WebSocket error:', err.message));

    socket.on('status:update', (data) => {
      statusCallbacks.forEach(cb => cb(data));
    });
  }

  return socket;
}

export function subscribeCommande(commandeId) {
  if (socket?.connected) {
    socket.emit('subscribe:commande', commandeId);
  } else {
    // Enregistrer pour souscription ultérieure
    if (!pendingSubscriptions.includes(commandeId)) {
      pendingSubscriptions.push(commandeId);
    }
  }
}

export function unsubscribeCommande(commandeId) {
  pendingSubscriptions = pendingSubscriptions.filter(id => id !== commandeId);
  if (socket?.connected) {
    socket.emit('unsubscribe:commande', commandeId);
  }
}

export function onStatusUpdate(callback) {
  statusCallbacks.push(callback);
  return () => {
    statusCallbacks = statusCallbacks.filter(cb => cb !== callback);
  };
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  pendingSubscriptions = [];
  statusCallbacks = [];
}

export { socket };
