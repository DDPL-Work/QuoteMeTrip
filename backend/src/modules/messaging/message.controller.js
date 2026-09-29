/**
 * Messaging controller (Phase 6).
 */
import * as service from './message.service.js';
import {
  validateCreateConversationInput,
  validateSendMessageInput,
  validatePagination,
} from './message.validation.js';
import { successResponse } from '../../utils/apiResponse.js';

function asyncHandler(handler) {
  return (req, res, next) => {
    Promise.resolve(handler(req, res)).catch(next);
  };
}

export const list = asyncHandler(async (req, res) => {
  const paging = validatePagination(req.query);
  const { conversations, pagination } = await service.listConversations(
    req.user.id,
    req.user.role,
    paging,
  );
  return successResponse(res, { data: { conversations }, pagination });
});

export const create = asyncHandler(async (req, res) => {
  const input = validateCreateConversationInput(req.body);
  const { conversation, created } = await service.createConversation(
    req.user.id,
    req.user.role,
    input,
  );
  return successResponse(
    res,
    { data: { conversation }, message: created ? 'Conversation opened.' : 'Conversation exists.' },
    created ? 201 : 200,
  );
});

export const getById = asyncHandler(async (req, res) => {
  const conversation = await service.getConversation(req.user.id, req.user.role, req.params.id);
  return successResponse(res, { data: { conversation } });
});

export const listMessages = asyncHandler(async (req, res) => {
  const paging = validatePagination(req.query);
  const { messages, pagination } = await service.listMessages(
    req.user.id,
    req.user.role,
    req.params.id,
    paging,
  );
  return successResponse(res, { data: { messages }, pagination });
});

export const send = asyncHandler(async (req, res) => {
  const input = validateSendMessageInput(req.body);
  const message = await service.sendMessage(req.user.id, req.user.role, req.params.id, input);
  return successResponse(res, { data: { message }, message: 'Message sent.' }, 201);
});

export const markRead = asyncHandler(async (req, res) => {
  const result = await service.markConversationRead(req.user.id, req.user.role, req.params.id);
  return successResponse(res, { data: result, message: 'Conversation marked as read.' });
});
