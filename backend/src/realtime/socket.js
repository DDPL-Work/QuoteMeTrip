/**
 * Socket.IO realtime layer (Phase 6).
 *
 * REST persists messages; sockets only DELIVER events (never the
 * source of truth). Authentication: the access-token Bearer credential
 * is verified on every connection. Room discipline: clients may only
 * join `conversation:<id>` rooms they belong to (membership is checked
 * server-side via the messaging service) — arbitrary room joining is
 * rejected. All sends go through REST; there is no socket send path.
 */
import { Server } from 'socket.io';
import { isAllowedOrigin } from '../config/cors.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { assertConversationMember } from '../modules/messaging/message.service.js';
import { SOCKET_EVENTS } from '../modules/messaging/message.constants.js';

let io = null;

function credentialsFrom(handshake) {
  const auth = handshake?.auth || {};
  const header = handshake?.headers?.authorization || '';
  if (auth.token) {
    return String(auth.token);
  }
  if (header.toLowerCase().startsWith('bearer ')) {
    return header.slice(7);
  }
  return null;
}

export function roomForConversation(conversationId) {
  return `conversation:${Number(conversationId)}`;
}

const userPresenceMap = new Map();

export function getUserPresence(userId) {
  const data = userPresenceMap.get(Number(userId));
  if (!data) {
    return { isOnline: false, lastSeen: null };
  }
  return { isOnline: data.isOnline, lastSeen: data.lastSeen };
}

export function initSocketServer(httpServer) {
  if (io) {
    return io;
  }
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedOrigin(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    },
    path: '/socket.io',
  });

  io.use((socket, next) => {
    const token = credentialsFrom(socket.handshake);
    if (!token) {
      return next(new Error('Authentication required.'));
    }
    try {
      const decoded = verifyAccessToken(token);
      socket.data.user = { id: decoded.sub, role: decoded.role };
      return next();
    } catch {
      return next(new Error('Invalid access token.'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    const uid = Number(user.id);

    socket.join(`user:${uid}`);

    let presence = userPresenceMap.get(uid);
    if (!presence) {
      presence = { isOnline: true, lastSeen: null, socketIds: new Set() };
      userPresenceMap.set(uid, presence);
    }
    presence.socketIds.add(socket.id);
    const wasOffline = !presence.isOnline;
    presence.isOnline = true;

    if (wasOffline) {
      io.emit('presence:update', { userId: uid, isOnline: true });
    }

    socket.on('presence:get', (payload, acknowledge) => {
      const targetId = Number(payload?.userId);
      if (targetId) {
        acknowledge?.({ ok: true, presence: getUserPresence(targetId) });
      }
    });

    socket.on('disconnect', () => {
      const current = userPresenceMap.get(uid);
      if (current) {
        current.socketIds.delete(socket.id);
        if (current.socketIds.size === 0) {
          current.isOnline = false;
          current.lastSeen = new Date();
          io.emit('presence:update', { userId: uid, isOnline: false, lastSeen: current.lastSeen });
        }
      }
    });

    socket.on('conversation:join', async (payload, acknowledge) => {
      const conversationId = Number(payload?.conversationId);
      if (!Number.isInteger(conversationId) || conversationId < 1) {
        acknowledge?.({ ok: false, code: 'VALIDATION_ERROR', message: 'Invalid conversation.' });
        return;
      }
      try {
        await assertConversationMember(conversationId, user.id, user.role);
        await socket.join(roomForConversation(conversationId));
        acknowledge?.({ ok: true, conversationId });
      } catch {
        acknowledge?.({
          ok: false,
          code: 'NOT_FOUND',
          message: 'Conversation not found.',
        });
      }
    });

    socket.on('conversation:leave', async (payload, acknowledge) => {
      const conversationId = Number(payload?.conversationId);
      if (Number.isInteger(conversationId) && conversationId > 0) {
        await socket.leave(roomForConversation(conversationId));
      }
      acknowledge?.({ ok: true });
    });
  });

  return io;
}

export function getSocketServer() {
  return io;
}

/** Test hook: drop the singleton (fresh server per test process). */
export function resetSocketServer() {
  io = null;
}

/**
 * Deliver an event to a conversation room. No-op when sockets are not
 * initialized (unit tests, degraded boot) — REST remains authoritative.
 */
export function emitToConversation(conversationId, event, payload = {}) {
  if (!io) {
    return false;
  }
  if (!Object.values(SOCKET_EVENTS).includes(event)) {
    return false;
  }
  io.to(roomForConversation(conversationId)).emit(event, payload);
  return true;
}

/**
 * Deliver a real-time event to a specific user's connected clients.
 */
export function emitToUser(userId, event, payload = {}) {
  if (!io) {
    return false;
  }
  io.to(`user:${Number(userId)}`).emit(event, payload);
  return true;
}

export async function closeSocketServer() {
  if (!io) {
    return;
  }
  await io.close();
  io = null;
}
