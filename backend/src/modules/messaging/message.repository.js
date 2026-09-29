/**
 * Messaging repository (Phase 5 pattern: queries only).
 */
import { initModels } from '../../db/models/index.js';

export async function findConversationById(conversationId, { transaction = null } = {}) {
  const models = initModels();
  return models.Conversation.findByPk(conversationId, { transaction });
}

export async function findConversationTriple(travelRequestId, travellerId, agencyId) {
  const models = initModels();
  return models.Conversation.findOne({ where: { travelRequestId, travellerId, agencyId } });
}
