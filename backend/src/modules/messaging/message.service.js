/**
 * Messaging service (Phase 6).
 *
 * REST persists messages; Socket.IO only delivers events (never the
 * source of truth). Contact visibility is resolved per conversation
 * from the live-job rule (see contact-visibility.js).
 */
import { Op } from 'sequelize';
import { initModels } from '../../db/models/index.js';
import { withTransaction } from '../../db/transaction.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../../utils/errors.js';
import * as repository from './message.repository.js';
import {
  toPublicMessage,
  toPublicConversation,
  travellerSnippet,
  agencySnippet,
} from './message.mapper.js';
import { MESSAGE_ERROR_CODES, SOCKET_EVENTS } from './message.constants.js';
import { isContactRevealedForRequest } from '../contact/contact-visibility.js';
import {
  NOTIFICATION_EVENTS,
  emitNotificationEvent,
} from '../notifications/notification-events.js';
import { emitToConversation, getUserPresence } from '../../realtime/socket.js';

function forbidden(message) {
  return new ForbiddenError(message, { code: MESSAGE_ERROR_CODES.FORBIDDEN });
}

function notFound(message = 'Conversation not found.') {
  return new NotFoundError(message, { code: MESSAGE_ERROR_CODES.NOT_FOUND });
}

async function resolveAgencyId(models, userId, { transaction = null } = {}) {
  const agency = await models.AgencyProfile.findOne({ where: { userId }, transaction });
  if (!agency) {
    throw notFound('Agency profile not found.');
  }
  return agency;
}

async function buildSnippets(models, conversation, { transaction = null } = {}) {
  const revealed = await isContactRevealedForRequest(conversation.travelRequestId, {
    transaction,
    registry: models,
  });
  const user = await models.User.findByPk(conversation.travellerId, { transaction });
  const profile = await models.TravellerProfile.findOne({
    where: { userId: conversation.travellerId },
    transaction,
  });
  const agency = await models.AgencyProfile.findByPk(conversation.agencyId, { transaction });
  return {
    revealed,
    traveller: travellerSnippet(user, profile, { revealed }),
    agency: agencySnippet(agency, { revealed }),
  };
}

/**
 * Membership check shared by REST and the socket layer.
 * Returns the conversation when the identity may access it.
 */
export async function assertConversationMember(conversationId, userId, role) {
  const models = initModels();
  const conversation = await repository.findConversationById(conversationId);
  if (!conversation) {
    throw notFound();
  }
  if (role === 'admin') {
    return { conversation, models };
  }
  if (role === 'traveller' && conversation.travellerId === Number(userId)) {
    return { conversation, models };
  }
  if (role === 'agency') {
    const agency = await models.AgencyProfile.findOne({ where: { userId } });
    if (agency && conversation.agencyId === agency.id) {
      return { conversation, models, agency };
    }
  }
  throw notFound();
}

async function lastMessageFor(models, conversationId, { transaction = null } = {}) {
  return models.Message.findOne({
    where: { conversationId },
    order: [[models.sequelize.col('Message.id'), 'DESC']],
    transaction,
  });
}

async function unreadCountFor(models, conversationId, userId, role, agencyId = null) {
  const senderFilter = { [Op.ne]: Number(userId) };
  if (role === 'admin') {
    return models.Message.count({ where: { conversationId, readAt: null } });
  }
  void agencyId;
  return models.Message.count({
    where: { conversationId, readAt: null, senderUserId: senderFilter },
  });
}

/* ------------------------------------------------------------------ */
/* Conversation management                                             */
/* ------------------------------------------------------------------ */

export async function createConversation(userId, role, input) {
  if (role === 'admin') {
    throw forbidden('Administrators cannot open conversations.');
  }
  const models = initModels();

  const outcome = await withTransaction(async (t) => {
    const request = await models.TravelRequest.findByPk(input.travelRequestId, { transaction: t });
    if (!request) {
      throw notFound('Travel request not found.');
    }

    let travellerId;
    let agencyId;
    if (role === 'traveller') {
      if (request.travellerId !== Number(userId)) {
        throw notFound('Travel request not found.');
      }
      if (!['submitted', 'matching', 'quoted', 'accepted'].includes(request.status)) {
        throw new ValidationError('Conversations require a submitted travel request.', {
          code: MESSAGE_ERROR_CODES.VALIDATION_ERROR,
        });
      }
      if (!input.agencyId) {
        throw new ValidationError('agencyId is required to open a conversation.', {
          code: MESSAGE_ERROR_CODES.VALIDATION_ERROR,
        });
      }
      // No arbitrary conversations: the agency must have a submitted
      // (or later) quotation on this request.
      const quotation = await models.Quotation.findOne({
        where: {
          travelRequestId: request.id,
          agencyId: input.agencyId,
          status: ['submitted', 'accepted', 'rejected'],
        },
        transaction: t,
      });
      if (!quotation) {
        throw new ValidationError('You can only message agencies that quoted this request.', {
          code: MESSAGE_ERROR_CODES.VALIDATION_ERROR,
        });
      }
      travellerId = Number(userId);
      agencyId = input.agencyId;
    } else if (role === 'agency') {
      const agency = await resolveAgencyId(models, userId, { transaction: t });
      if (input.agencyId && input.agencyId !== agency.id) {
        throw forbidden('You can only open conversations as your own agency.');
      }
      const match = await models.TravelRequestAgency.findOne({
        where: { travelRequestId: request.id, agencyId: agency.id },
        transaction: t,
      });
      if (!match) {
        throw notFound('Travel request not found.');
      }
      travellerId = request.travellerId;
      agencyId = agency.id;
    } else {
      throw forbidden('Only travellers and agencies can message.');
    }

    const existing = await models.Conversation.findOne({
      where: { travelRequestId: request.id, travellerId, agencyId },
      transaction: t,
    });
    if (existing) {
      return { conversation: existing, created: false };
    }
    const conversation = await models.Conversation.create(
      { travelRequestId: request.id, travellerId, agencyId, status: 'active' },
      { transaction: t },
    );
    return { conversation, created: true };
  });

  const { conversation, created } = outcome;
  const snippets = await buildSnippets(models, conversation);
  const lastMessage = await lastMessageFor(models, conversation.id);
  return {
    conversation: toPublicConversation(conversation, { ...snippets, lastMessage }),
    created,
  };
}

async function resolveOtherUserId(models, conversation, currentUserId, role) {
  if (role === 'traveller') {
    const agency = await models.AgencyProfile.findByPk(conversation.agencyId);
    return agency ? agency.userId : null;
  }
  return conversation.travellerId;
}

export async function listConversations(userId, role, { page, pageSize }) {
  const models = initModels();
  const where = {};
  if (role === 'traveller') {
    where.travellerId = Number(userId);
  } else if (role === 'agency') {
    const agency = await resolveAgencyId(models, userId);
    where.agencyId = agency.id;
  } else if (role !== 'admin') {
    throw forbidden('Only participants can list conversations.');
  }

  const totalItems = await models.Conversation.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(page, totalPages);
  const rows = await models.Conversation.findAll({
    where,
    order: [[models.sequelize.col('Conversation.updated_at'), 'DESC']],
    offset: (current - 1) * pageSize,
    limit: pageSize,
  });

  let agencyId = null;
  if (role === 'agency') {
    agencyId = (await resolveAgencyId(models, userId)).id;
  }
  const conversations = [];
  for (const row of rows) {
    const snippets = await buildSnippets(models, row);
    const lastMessage = await lastMessageFor(models, row.id);
    const unreadCount = await unreadCountFor(models, row.id, userId, role, agencyId);
    const otherUserId = await resolveOtherUserId(models, row, userId, role);
    const presence = getUserPresence(otherUserId);
    conversations.push({
      ...toPublicConversation(row, { ...snippets, lastMessage, presence }),
      unreadCount,
    });
  }
  return { conversations, pagination: { page: current, pageSize, totalItems, totalPages } };
}

export async function getConversation(userId, role, conversationId) {
  const { conversation, models } = await assertConversationMember(conversationId, userId, role);
  const snippets = await buildSnippets(models, conversation);
  const lastMessage = await lastMessageFor(models, conversation.id);
  const otherUserId = await resolveOtherUserId(models, conversation, userId, role);
  const presence = getUserPresence(otherUserId);
  return toPublicConversation(conversation, { ...snippets, lastMessage, presence });
}

/* ------------------------------------------------------------------ */
/* Messages                                                            */
/* ------------------------------------------------------------------ */

export async function listMessages(
  userId,
  role,
  conversationId,
  { page = 1, pageSize = 30, limit = 30, before = null } = {},
) {
  const { conversation, models } = await assertConversationMember(conversationId, userId, role);
  const revealed = await isContactRevealedForRequest(conversation.travelRequestId, {
    registry: models,
  });

  const effectiveLimit = Math.min(Math.max(limit || pageSize, 1), 100);

  const where = { conversationId: conversation.id };
  if (before !== null && before !== undefined) {
    where.id = { [Op.lt]: Number(before) };
  }

  const totalItems = await models.Message.count({ where: { conversationId: conversation.id } });

  let rows;
  if (before !== null && before !== undefined) {
    const fetched = await models.Message.findAll({
      where,
      order: [['id', 'DESC']],
      limit: effectiveLimit + 1,
    });
    const hasMore = fetched.length > effectiveLimit;
    const items = hasMore ? fetched.slice(0, effectiveLimit) : fetched;
    items.reverse();
    rows = items;

    const nextCursor = items.length > 0 ? items[0].id : null;
    const mapped = rows
      .filter((m) => {
        const delFor = Array.isArray(m.deletedForUsers) ? m.deletedForUsers : [];
        return !delFor.includes(Number(userId));
      })
      .map((m) => toPublicMessage(m, { revealed, currentUserId: userId }));

    return {
      messages: mapped,
      pagination: {
        limit: effectiveLimit,
        before,
        nextCursor,
        hasMore,
        totalItems,
      },
    };
  }

  if (page === 1) {
    const fetched = await models.Message.findAll({
      where: { conversationId: conversation.id },
      order: [['id', 'DESC']],
      limit: effectiveLimit + 1,
    });
    const hasMore = fetched.length > effectiveLimit;
    const items = hasMore ? fetched.slice(0, effectiveLimit) : fetched;
    items.reverse();
    rows = items;

    const nextCursor = items.length > 0 ? items[0].id : null;
    const mapped = rows
      .filter((m) => {
        const delFor = Array.isArray(m.deletedForUsers) ? m.deletedForUsers : [];
        return !delFor.includes(Number(userId));
      })
      .map((m) => toPublicMessage(m, { revealed, currentUserId: userId }));

    return {
      messages: mapped,
      pagination: {
        limit: effectiveLimit,
        page: 1,
        pageSize: effectiveLimit,
        nextCursor,
        hasMore,
        totalItems,
        totalPages: Math.max(1, Math.ceil(totalItems / effectiveLimit)),
      },
    };
  }

  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const current = Math.min(page, totalPages);
  rows = await models.Message.findAll({
    where: { conversationId: conversation.id },
    order: [['id', 'ASC']],
    offset: (current - 1) * pageSize,
    limit: pageSize,
  });

  const mapped = rows
    .filter((m) => {
      const delFor = Array.isArray(m.deletedForUsers) ? m.deletedForUsers : [];
      return !delFor.includes(Number(userId));
    })
    .map((m) => toPublicMessage(m, { revealed, currentUserId: userId }));

  return {
    messages: mapped,
    pagination: { page: current, pageSize, totalItems, totalPages },
  };
}

export async function deleteMessage(
  userId,
  role,
  conversationId,
  messageId,
  { mode = 'me' } = {},
) {
  const models = initModels();
  const message = await models.Message.findByPk(messageId);
  if (!message) {
    throw notFound('Message not found.');
  }

  const targetConvId = conversationId && Number(conversationId) > 0 ? Number(conversationId) : message.conversationId;
  const { conversation } = await assertConversationMember(targetConvId, userId, role);

  if (Number(message.conversationId) !== Number(conversation.id)) {
    throw notFound('Message does not belong to this conversation.');
  }

  if (mode === 'everyone') {
    if (role === 'admin' || message.senderUserId !== Number(userId)) {
      throw forbidden('You can only delete your own messages for everyone.');
    }
    await message.update({
      deletedForEveryoneAt: new Date(),
      deletedByUserId: Number(userId),
    });

    const revealed = await isContactRevealedForRequest(conversation.travelRequestId, {
      registry: models,
    });
    const publicMessage = toPublicMessage(message, { revealed, currentUserId: userId });

    emitToConversation(conversation.id, SOCKET_EVENTS.DELETED, {
      conversationId: conversation.id,
      messageId: message.id,
      mode: 'everyone',
      message: publicMessage,
    });

    return publicMessage;
  }

  const currentDeleted = Array.isArray(message.deletedForUsers) ? [...message.deletedForUsers] : [];
  if (!currentDeleted.includes(Number(userId))) {
    currentDeleted.push(Number(userId));
    await message.update({ deletedForUsers: currentDeleted });
  }

  const revealed = await isContactRevealedForRequest(conversation.travelRequestId, {
    registry: models,
  });
  return toPublicMessage(message, { revealed, currentUserId: userId });
}

export async function sendMessage(userId, role, conversationId, input) {
  if (role === 'admin') {
    throw forbidden('Administrators cannot send messages.');
  }
  const { conversation, models } = await assertConversationMember(conversationId, userId, role);
  if (conversation.status !== 'active') {
    throw new ValidationError('This conversation is closed.', {
      code: MESSAGE_ERROR_CODES.VALIDATION_ERROR,
    });
  }

  let expiresAt = null;
  if (conversation.disappearingTtl > 0) {
    expiresAt = new Date(Date.now() + conversation.disappearingTtl * 1000);
  }

  const message = await models.Message.create({
    conversationId: conversation.id,
    senderUserId: Number(userId),
    messageType: 'text',
    body: input.body,
    expiresAt,
  });
  await conversation.update({ updatedAt: new Date() });

  const revealed = await isContactRevealedForRequest(conversation.travelRequestId, {
    registry: models,
  });
  const publicMessage = toPublicMessage(message, { revealed });

  emitNotificationEvent(NOTIFICATION_EVENTS.MESSAGE_RECEIVED, {
    conversationId: conversation.id,
    messageId: message.id,
    senderUserId: Number(userId),
  });
  emitToConversation(conversation.id, SOCKET_EVENTS.MESSAGE, { message: publicMessage });
  emitToConversation(conversation.id, SOCKET_EVENTS.UPDATED, {
    conversationId: conversation.id,
    lastMessage: publicMessage,
  });
  return publicMessage;
}

export async function updateConversationTtl(userId, role, conversationId, ttlSeconds) {
  const { conversation, models } = await assertConversationMember(conversationId, userId, role);
  const ttl = Math.max(0, Number(ttlSeconds) || 0);
  await conversation.update({ disappearingTtl: ttl });

  const ttlLabels = {
    0: 'Off',
    86400: '24 hours',
    604800: '7 days',
    2592000: '30 days',
  };
  const label = ttlLabels[ttl] || `${ttl} seconds`;
  const bodyText = `Disappearing messages set to ${label}`;

  const sysMsg = await models.Message.create({
    conversationId: conversation.id,
    senderUserId: null,
    messageType: 'system',
    body: bodyText,
  });
  await conversation.update({ updatedAt: new Date() });

  const publicSysMsg = toPublicMessage(sysMsg, { revealed: true });
  emitToConversation(conversation.id, SOCKET_EVENTS.MESSAGE, { message: publicSysMsg });
  emitToConversation(conversation.id, 'conversation:ttl', {
    conversationId: conversation.id,
    disappearingTtl: ttl,
    systemMessage: publicSysMsg,
  });

  return { conversationId: conversation.id, disappearingTtl: ttl, systemMessage: publicSysMsg };
}

export async function markConversationRead(userId, role, conversationId) {
  if (role === 'admin') {
    throw forbidden('Administrators cannot mark messages as read.');
  }
  const { conversation, models } = await assertConversationMember(conversationId, userId, role);
  const [marked] = await models.Message.update(
    { readAt: new Date() },
    {
      where: {
        conversationId: conversation.id,
        readAt: null,
        senderUserId: { [Op.ne]: Number(userId) },
      },
    },
  );
  emitToConversation(conversation.id, SOCKET_EVENTS.READ, {
    conversationId: conversation.id,
    marked,
    readByUserId: Number(userId),
  });
  return { marked };
}
