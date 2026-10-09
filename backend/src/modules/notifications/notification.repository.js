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
      where: { userId, platform, isActive: true },
    });
  }

  async findActivePushTokens(userId) {
    return await PushToken.findAll({
      where: { userId, isActive: true },
    });
  }

  async upsertPushToken(userId, tokenData, platform = 'web') {
    const token = typeof tokenData === 'string' ? tokenData : tokenData.token;
    const fid = typeof tokenData === 'object' ? tokenData.fid : null;
    const browser = typeof tokenData === 'object' ? tokenData.browser : null;
    const deviceLabel = typeof tokenData === 'object' ? tokenData.deviceLabel : null;
    const permissionStatus = typeof tokenData === 'object' ? tokenData.permissionStatus || 'granted' : 'granted';
    const plat = (typeof tokenData === 'object' ? tokenData.platform : platform) || 'web';

    const existing = await PushToken.findOne({ where: { token } });
    if (existing) {
      if (existing.userId !== userId) {
        existing.userId = userId;
      }
      existing.platform = plat;
      if (fid) existing.fid = fid;
      if (browser) existing.browser = browser;
      if (deviceLabel) existing.deviceLabel = deviceLabel;
      existing.permissionStatus = permissionStatus;
      existing.isActive = true;
      existing.lastUsedAt = new Date();
      await existing.save();
      return existing;
    }

    return await PushToken.create({
      userId,
      token,
      fid,
      platform: plat,
      browser,
      deviceLabel,
      permissionStatus,
      isActive: true,
      lastUsedAt: new Date(),
    });
  }

  async deactivatePushTokens(tokens) {
    if (!tokens || tokens.length === 0) return 0;
    const [count] = await PushToken.update(
      { isActive: false },
      { where: { token: tokens } },
    );
    return count;
  }

  async removePushToken(userId, token) {
    return await PushToken.destroy({
      where: { userId, token },
    });
  }
}

export const notificationRepository = new NotificationRepository();
