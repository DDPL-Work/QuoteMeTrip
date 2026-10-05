import { Notification, PushToken } from '../../db/models/index.js';
import { NOTIFICATION_STATUS } from './notification.constants.js';

export class NotificationRepository {
  async create(notificationData, transaction) {
    return await Notification.create(notificationData, { transaction });
  }

  async findUnreadByUserId(userId, limit = 50) {
    return await Notification.findAll({
      where: {
        userId,
        status: NOTIFICATION_STATUS.PENDING,
        readAt: null,
      },
      order: [['created_at', 'DESC']],
      limit,
    });
  }

  async findAllByUserId(userId, limit = 50, offset = 0, { unreadOnly = false } = {}) {
    const where = { userId };
    if (unreadOnly) {
      where.readAt = null;
      where.status = [NOTIFICATION_STATUS.PENDING, NOTIFICATION_STATUS.SENT];
    }
    return await Notification.findAll({
      where,
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
  }

  async countByUserId(userId, { unreadOnly = false } = {}) {
    const where = { userId };
    if (unreadOnly) {
      where.readAt = null;
      where.status = [NOTIFICATION_STATUS.PENDING, NOTIFICATION_STATUS.SENT];
    }
    return await Notification.count({ where });
  }

  async countUnreadByUserId(userId) {
    return await Notification.count({
      where: {
        userId,
        status: [NOTIFICATION_STATUS.PENDING, NOTIFICATION_STATUS.SENT],
        readAt: null,
      },
    });
  }

  async markAsRead(notificationId, userId) {
    const [updatedRows] = await Notification.update(
      { readAt: new Date(), status: NOTIFICATION_STATUS.READ },
      { where: { id: notificationId, userId, readAt: null } },
    );
    return updatedRows > 0;
  }

  async markAllAsRead(userId) {
    const [updatedRows] = await Notification.update(
      { readAt: new Date(), status: NOTIFICATION_STATUS.READ },
      { where: { userId, readAt: null } },
    );
    return updatedRows;
  }

  async findPushToken(userId, platform) {
    return await PushToken.findOne({
      where: { userId, platform },
    });
  }

  async upsertPushToken(userId, token, platform) {
    const existing = await PushToken.findOne({ where: { token } });
    if (existing) {
      if (existing.userId !== userId) {
        existing.userId = userId;
      }
      existing.platform = platform;
      existing.lastUsedAt = new Date();
      await existing.save();
      return existing;
    }
    return await PushToken.create({ userId, token, platform, lastUsedAt: new Date() });
  }
}

export const notificationRepository = new NotificationRepository();
