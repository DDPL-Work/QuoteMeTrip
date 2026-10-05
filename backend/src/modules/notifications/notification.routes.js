import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { notificationService } from './notification.service.js';
import { toNotificationListDto } from './notification.mapper.js';

export const notificationRoutes = Router();

// All notification routes require authentication
notificationRoutes.use(authenticate);

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

notificationRoutes.patch('/read-all', async (req, res, next) => {
  try {
    const count = await notificationService.markAllAsRead(req.user.id);
    res.json({
      status: 'success',
      message: `${count} notifications marked as read`,
    });
  } catch (err) {
    next(err);
  }
});

notificationRoutes.post('/push-token', async (req, res, next) => {
  try {
    const { token, platform } = req.body;
    if (!token) {
      return res.status(400).json({ status: 'error', message: 'Token is required' });
    }
    await notificationService.registerPushToken(req.user.id, token, platform);
    res.json({
      status: 'success',
      message: 'Push token registered',
    });
  } catch (err) {
    next(err);
  }
});
