/**
 * Messaging routes (Phase 6).
 *
 *   GET   /conversations             Own conversations (traveller/agency; admin read-all)
 *   POST  /conversations             Open (traveller/agency, request-bound, idempotent)
 *   GET   /conversations/:id         Detail (members + admin)
 *   GET   /conversations/:id/messages  Thread history (members + admin)
 *   POST  /conversations/:id/messages  Send (members only)
 *   PATCH /conversations/:id/read    Mark other's messages read (members only)
 */
import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as controller from './message.controller.js';

const router = Router();

router.use(authenticate, authorize('traveller', 'agency', 'admin'));

router.get('/', controller.list);
router.post('/', controller.create);
router.get('/:id', controller.getById);
router.get('/:id/messages', controller.listMessages);
router.post('/:id/messages', controller.send);
router.delete('/:id/messages/:messageId', controller.deleteMessage);
router.post('/:id/messages/:messageId/delete', controller.deleteMessage);
router.delete('/:id', controller.deleteMessage);
router.post('/:id/delete', controller.deleteMessage);
router.patch('/:id/read', controller.markRead);
router.patch('/:id/ttl', controller.updateTtl);
router.post('/:id/ttl', controller.updateTtl);

export default router;
