import { notificationRepository } from './notification.repository.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUS } from './notification.constants.js';

class NotificationService {
  /**
   * Core internal method to queue and send a notification
   */
  async notify(userId, eventType, channel, title, body, data = null, transaction = null) {
    // 1. Create database record
    const notification = await notificationRepository.create(
      {
        userId,
        eventType,
        channel,
        title,
        body,
        data,
        status: NOTIFICATION_STATUS.PENDING,
      },
      transaction,
    );

    // 2. Dispatch to provider (fire and forget, do not block transaction)
    // We run this asynchronously after transaction completes if possible,
    // or just asynchronously here.
    const dispatch = async () => {
      try {
        await this.dispatchToProvider(notification);
      } catch (error) {
        console.error(
          `[NotificationService] Delivery failed for notification ${notification.id}:`,
          error,
        );
      }
    };

    // Using setImmediate avoids blocking the main thread/current transaction execution
    setImmediate(dispatch);

    return notification;
  }

  async dispatchToProvider(notification) {
    let success = false;
    try {
      if (notification.channel === NOTIFICATION_CHANNELS.IN_APP) {
        // In-app is just stored in DB, nothing to external provider
        success = true;
      } else if (notification.channel === NOTIFICATION_CHANNELS.EMAIL) {
        // Mock email provider integration
        console.log(`[Email] Sending to user ${notification.userId}: ${notification.title}`);
        success = true;
      } else if (notification.channel === NOTIFICATION_CHANNELS.SMS) {
        // Mock SMS provider
        console.log(`[SMS] Sending to user ${notification.userId}: ${notification.title}`);
        success = true;
      } else if (notification.channel === NOTIFICATION_CHANNELS.WEB_PUSH) {
        // Mock Web Push provider
        console.log(`[WebPush] Sending to user ${notification.userId}: ${notification.title}`);
        success = true;
      }

      if (success) {
        notification.status = NOTIFICATION_STATUS.SENT;
        notification.sentAt = new Date();
      } else {
        notification.status = NOTIFICATION_STATUS.FAILED;
        notification.failureReason = 'Provider rejected or failed';
        notification.failedAt = new Date();
      }
      await notification.save();
    } catch (error) {
      notification.status = NOTIFICATION_STATUS.FAILED;
      notification.failureReason = error.message;
      notification.failedAt = new Date();
      await notification.save();
      throw error;
    }
  }

  async getUnreadCount(userId) {
    return await notificationRepository.countUnreadByUserId(userId);
  }

  async getNotifications(userId, limit, offset) {
    return await notificationRepository.findAllByUserId(userId, limit, offset);
  }

  async markAsRead(notificationId, userId) {
    return await notificationRepository.markAsRead(notificationId, userId);
  }

  async markAllAsRead(userId) {
    return await notificationRepository.markAllAsRead(userId);
  }

  async registerPushToken(userId, token, platform = 'web') {
    return await notificationRepository.upsertPushToken(userId, token, platform);
  }
}

export const notificationService = new NotificationService();
