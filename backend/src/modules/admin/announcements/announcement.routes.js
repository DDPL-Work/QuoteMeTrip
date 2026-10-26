/**
 * Announcement Admin Routes (Workstream 3).
 *
 * Exposes endpoints for managing and publishing announcements.
 * Strictly restricted to authenticated system administrators.
 */
import { Router } from 'express';
import { authenticate } from '../../../middleware/authenticate.js';
import { authorize } from '../../../middleware/authorize.js';
import { announcementService } from './announcement.service.js';

const router = Router();

// Strictly enforce administrator access
router.use(authenticate, authorize('admin'));

/**
 * GET /api/v1/admin/announcements
 */
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, status, targetAudience, search } = req.query;
    const result = await announcementService.list({
      page,
      pageSize,
      status,
      targetAudience,
      search,
    });
    res.json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/announcements
 */
router.post('/', async (req, res, next) => {
  try {
    const announcement = await announcementService.create(req.body, req.user.id);
    res.status(201).json({
      success: true,
      data: announcement,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/announcements/:id
 */
router.get('/:id', async (req, res, next) => {
  try {
    const announcement = await announcementService.getById(req.params.id);
    res.json({
      success: true,
      data: announcement,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/admin/announcements/:id
 */
router.patch('/:id', async (req, res, next) => {
  try {
    const updated = await announcementService.update(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/announcements/:id/publish
 */
router.post('/:id/publish', async (req, res, next) => {
  try {
    const result = await announcementService.publish(req.params.id, req.user.id);
    res.json({
      success: true,
      message: `Announcement published successfully to ${result.recipientCount} recipient(s).`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/announcements/:id/withdraw
 */
router.post('/:id/withdraw', async (req, res, next) => {
  try {
    const result = await announcementService.withdraw(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Announcement withdrawn successfully.',
      data: result,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/admin/announcements/:id
 */
router.delete('/:id', async (req, res, next) => {
  try {
    await announcementService.delete(req.params.id, req.user.id);
    res.json({
      success: true,
      message: 'Announcement deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/announcements/:id/stats
 */
router.get('/:id/stats', async (req, res, next) => {
  try {
    const stats = await announcementService.getStats(req.params.id);
    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
