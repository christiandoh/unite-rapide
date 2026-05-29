import { io } from 'socket.io-client';

const WS_URL = process.env.REACT_APP_WS_URL || '';

let socket = null;

export function connectWebSocket() {
  if (socket?.connected) return socket;

  socket = io(`${WS_URL}/web`, {
    path: '/ws/socket.io',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 2000,
    reconnectionAttempts: Infinity,
  });

  socket.on('connect', () => console.log('📡 WebSocket connecté'));
  socket.on('disconnect', (reason) => console.warn('📡 WebSocket déconnecté:', reason));
  socket.on('connect_error', (err) => console.error('📡 WebSocket error:', err.message));

  return socket;
}

export function subscribeCommande(commandeId) {
  if (socket?.connected) {
    socket.emit('subscribe:commande', commandeId);
  }
}

export function unsubscribeCommande(commandeId) {
  if (socket?.connected) {
    socket.emit('unsubscribe:commande', commandeId);
  }
}

export function onStatusUpdate(callback) {
  if (socket) {
    socket.on('status:update', callback);
    return () => socket.off('status:update', callback);
  }
}

export function disconnectWebSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export { socket };
