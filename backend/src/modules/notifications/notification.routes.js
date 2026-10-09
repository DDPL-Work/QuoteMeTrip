import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { notificationService } from './notification.service.js';
import { toNotificationListDto, toNotificationDto } from './notification.mapper.js';

export const notificationRoutes = Router();

// All notification routes require authentication
notificationRoutes.use(authenticate);

/**
 * GET /api/v1/notifications
 * Lists notifications for the authenticated user, ordered by createdAt DESC.
 * Supports pagination (limit/pageSize, page, offset) and filtering (unreadOnly).
 */
notificationRoutes.get('/', async (req, res, next) => {
  try {
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || req.query.pageSize, 10) || 50));
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const offset = req.query.offset !== undefined ? Math.max(0, parseInt(req.query.offset, 10) || 0) : (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true' || req.query.unreadOnly === true || req.query.unreadOnly === '1';

    const [notifications, total, unreadCount] = await Promise.all([
      notificationService.getNotifications(req.user.id, limit, offset, { unreadOnly }),
      notificationService.countNotifications(req.user.id, { unreadOnly }),
      notificationService.getUnreadCount(req.user.id),
    ]);

    const items = toNotificationListDto(notifications);
    items.total = total;
    items.unreadCount = unreadCount;
    items.pagination = {
      page,
      limit,
      totalItems: total,
      totalPages: Math.ceil(total / limit) || 1,
    };

    res.json({
      status: 'success',
      data: items,
      pagination: items.pagination,
      unreadCount,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/notifications/unread-count
 * Lightweight unread badge count for the header bell.
 */
notificationRoutes.get('/unread-count', async (req, res, next) => {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    res.json({
      status: 'success',
      data: { count },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/notifications/:id/read
 * Marks a single notification as read.
 */
notificationRoutes.patch('/:id/read', async (req, res, next) => {
  try {
    const success = await notificationService.markAsRead(req.params.id, req.user.id);
    if (!success) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found or already read',
      });
    }
    res.json({
      status: 'success',
      message: 'Notification marked as read',
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/notifications/read-all
 * POST  /api/v1/notifications/mark-all-read
 * Marks all notifications for the authenticated user as read.
 */
const handleMarkAllRead = async (req, res, next) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);
    res.json({
      status: 'success',
      message: `${count} notifications marked as read`,
      data: { updatedCount: count },
    });
  } catch (err) {
    next(err);
  }
};

notificationRoutes.patch('/read-all', handleMarkAllRead);
notificationRoutes.post('/mark-all-read', handleMarkAllRead);

/**
 * POST /api/v1/notifications/push-token
 * POST /api/v1/notifications/devices
 * Registers or refreshes a browser/device push token / FID installation.
 */
const handleRegisterDevice = async (req, res, next) => {
  try {
    const { token, fid, platform = 'web', browser, deviceLabel, permissionStatus } = req.body;
    if (!token && !fid) {
      return res.status(400).json({ status: 'error', message: 'Token or FID is required' });
    }

    const effectiveToken = token || fid;
    const record = await notificationService.registerPushToken(req.user.id, {
      token: effectiveToken,
      fid: fid || null,
      platform,
      browser: browser || null,
      deviceLabel: deviceLabel || null,
      permissionStatus: permissionStatus || 'granted',
    });

    res.json({
      status: 'success',
      message: 'Device push registration saved',
      data: {
        id: record.id,
        platform: record.platform,
        isActive: record.isActive,
      },
    });
  } catch (err) {
    next(err);
  }
};

notificationRoutes.post('/push-token', handleRegisterDevice);
notificationRoutes.post('/devices', handleRegisterDevice);

/**
 * DELETE /api/v1/notifications/push-token
 * DELETE /api/v1/notifications/devices
 * Unregisters a browser/device push token when user logs out or revokes permission.
 */
const handleUnregisterDevice = async (req, res, next) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Token is required' });
    }

    await notificationService.unregisterPushToken(req.user.id, token);
    res.json({
      status: 'success',
      message: 'Device push registration removed',
    });
  } catch (err) {
    next(err);
  }
};

notificationRoutes.delete('/push-token', handleUnregisterDevice);
notificationRoutes.delete('/devices', handleUnregisterDevice);
