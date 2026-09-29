// Realtime reception for messaging (Phase 6).
//
// REST persists messages; sockets only DELIVER events. Sends go
// through messagingApi; this helper only receives via Socket.IO:
// auth via { auth: { token } }, join via `conversation:join`, events
// `conversation:message` / `conversation:read` / `conversation:updated`.

import { io } from 'socket.io-client';
import { apiBaseUrl, apiClient } from './api.js';

let socket = null;

export function getMessagingSocket() {
  if (socket) return socket;
  socket = io(apiBaseUrl, {
    path: '/socket.io',
    auth: { token: apiClient.getAccessToken() },
    autoConnect: false,
  });
  return socket;
}

export function connectMessagingSocket() {
  const next = getMessagingSocket();
  next.auth = { token: apiClient.getAccessToken() };
  if (!next.connected) next.connect();
  return next;
}

export function joinConversation(socketInstance, conversationId) {
  return new Promise((resolve) => {
    socketInstance.emit('conversation:join', { conversationId }, (ack) => {
      resolve(ack ?? { ok: false });
    });
  });
}

export function disconnectMessagingSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
