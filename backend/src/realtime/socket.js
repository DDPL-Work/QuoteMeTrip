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
import { corsOptions } from '../config/cors.js';
import { verifyAccessToken } from '../utils/jwt.js';
import { assertConversationMember } from '../modules/messaging/message.service.js';
import { SOCKET_EVENTS } from '../modules/messaging/message.constants.js';

let io = null;

function allowedOrigins() {
  const origins = [
    process.env.WEB_TRAVELLER_URL,
    process.env.WEB_AGENCY_URL,
    process.env.WEB_ADMIN_URL,
  ].filter(Boolean);

  if (process.env.NODE_ENV !== 'production') {
    const devDefaults = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'http://127.0.0.1:5174',
      'http://127.0.0.1:5175',
    ];
    for (const o of devDefaults) {
      if (!origins.includes(o)) origins.push(o);
    }
  }
  return origins;
}

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

export function initSocketServer(httpServer) {
  if (io) {
    return io;
  }
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins().length > 0 ? allowedOrigins() : corsOptions.origin,
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

export async function closeSocketServer() {
  if (!io) {
    return;
  }
  await io.close();
  io = null;
}
