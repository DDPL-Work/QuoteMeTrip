import { notificationRepository } from './notification.repository.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUS } from './notification.constants.js';
import { toNotificationDto } from './notification.mapper.js';
import { sendMulticastPushNotification } from '../../integrations/firebase/firebase-admin.js';
import { emitToUser } from '../../realtime/socket.js';

class NotificationService {
  /**
   * Unified notification dispatcher supporting both object syntax and legacy positional args.
   *
   * Object signature:
   * notify({
   *   recipientUserId | userId,
   *   eventType,
   *   title,
   *   body,
   *   channel,
   *   entityType,
   *   entityId,
   *   requestId,
   *   quotationId,
   *   conversationId,
   *   jobId,
   *   deepLink,
   *   data,
   *   idempotencyKey,
   *   transaction
   * })
   */
  async notify(
    userIdOrOptions,
    argEventType,
    argChannel,
    argTitle,
    argBody,
    argData = null,
    argTransaction = null,
  ) {
    let userId;
    let eventType;
    let channel;
    let title;
    let body;
    let data;
    let transaction;
    let idempotencyKey;

    if (typeof userIdOrOptions === 'object' && userIdOrOptions !== null) {
      const opts = userIdOrOptions;
      userId = opts.recipientUserId || opts.userId;
      eventType = opts.eventType;
      channel = opts.channel || NOTIFICATION_CHANNELS.IN_APP;
      title = opts.title;
      body = opts.body;
      transaction = opts.transaction || null;
      idempotencyKey = opts.idempotencyKey || null;

      const mergedData = { ...(opts.data || {}) };
      if (opts.entityType) mergedData.entityType = opts.entityType;
      if (opts.entityId) mergedData.entityId = opts.entityId;
      if (opts.requestId) mergedData.requestId = opts.requestId;
      if (opts.travelRequestId) mergedData.requestId = opts.travelRequestId;
      if (opts.quotationId) mergedData.quotationId = opts.quotationId;
      if (opts.conversationId) mergedData.conversationId = opts.conversationId;
      if (opts.jobId) mergedData.jobId = opts.jobId;
      if (opts.deepLink) mergedData.deepLink = opts.deepLink;
      if (idempotencyKey) mergedData.idempotencyKey = idempotencyKey;

      data = Object.keys(mergedData).length > 0 ? mergedData : null;
    } else {
      userId = userIdOrOptions;
      eventType = argEventType;
      channel = argChannel || NOTIFICATION_CHANNELS.IN_APP;
      title = argTitle;
      body = argBody;
      data = argData;
      transaction = argTransaction;
      if (data && typeof data === 'object' && data.idempotencyKey) {
        idempotencyKey = data.idempotencyKey;
      }
    }

    if (!userId || !eventType || !title) {
      console.warn('[NotificationService] Missing required notification fields:', {
        userId,
        eventType,
        title,
      });
      return null;
    }

    // 1. Deterministic Idempotency / Deduplication check
    // If idempotencyKey is present or deterministic event fields exist, prevent duplicate records
    const dedupeKey =
      idempotencyKey ||
      (data?.messageId ? `msg-${data.messageId}-${userId}` : null) ||
      (data?.quotationId && eventType === 'QUOTATION_SUBMITTED'
        ? `quote-sub-${data.quotationId}-${userId}`
        : null);

    if (dedupeKey) {
      try {
        const recentNotifications = await notificationRepository.findAllByUserId(userId, 20, 0);
        const existing = recentNotifications.find((n) => {
          const d = typeof n.data === 'string' ? JSON.parse(n.data || '{}') : n.data;
          return d && (d.idempotencyKey === dedupeKey || d.dedupeKey === dedupeKey);
        });
        if (existing) {
          return existing;
        }
      } catch {
        // Fall through to standard creation on query error
      }
      if (data && typeof data === 'object') {
        data.dedupeKey = dedupeKey;
      }
    }

    // 2. Persist Notification DB record (Authoritative source of truth)
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

    // 3. Dispatch delivery asynchronously (Socket.IO + FCM Push)
    // Non-blocking fire-and-forget: notification delivery failure must never break business flows
    const dispatch = async () => {
      try {
        await this.dispatchToProvider(notification);
      } catch (error) {
        console.error(
          `[NotificationService] Delivery failed for notification ${notification.id}:`,
          error.message,
        );
      }
    };

    setImmediate(dispatch);

    return notification;
  }

  /**
   * Dispatches the created notification to foreground sockets and FCM push tokens
   */
  async dispatchToProvider(notification) {
    let success = true;
    const dto = toNotificationDto(notification);

    try {
      // A. Realtime Socket.IO foreground notification
      emitToUser(notification.userId, 'notification:new', dto);
      const unreadCount = await notificationRepository.countUnreadByUserId(notification.userId);
      emitToUser(notification.userId, 'notification:unread_count', { count: unreadCount });

      // B. FCM Web Push delivery to all active registered devices for this user
      const devices = await notificationRepository.findActivePushTokens(notification.userId);

      if (devices && devices.length > 0) {
        const tokens = devices.map((d) => d.token).filter(Boolean);

        if (tokens.length > 0) {
          const pushResult = await sendMulticastPushNotification({
            tokens,
            title: notification.title,
            body: notification.body,
            data: {
              notificationId: notification.id,
              eventType: notification.eventType,
              ...(notification.data || {}),
            },
            deepLink: notification.data?.deepLink || '/',
          });

          // Clean up dead/unregistered tokens automatically
          if (pushResult.invalidTokens && pushResult.invalidTokens.length > 0) {
            await notificationRepository.deactivatePushTokens(pushResult.invalidTokens);
            console.log(
              `[NotificationService] Deactivated ${pushResult.invalidTokens.length} dead FCM token(s)`,
            );
          }
        }
      }

      notification.status = NOTIFICATION_STATUS.SENT;
      notification.sentAt = new Date();
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

  async countNotifications(userId, options = {}) {
    return await notificationRepository.countByUserId(userId, options);
  }

  async getNotifications(userId, limit, offset, options = {}) {
    return await notificationRepository.findAllByUserId(userId, limit, offset, options);
  }

  async markAsRead(notificationId, userId) {
    const success = await notificationRepository.markAsRead(notificationId, userId);
    if (success) {
      const count = await this.getUnreadCount(userId);
      emitToUser(userId, 'notification:unread_count', { count });
    }
    return success;
  }

  async markAllAsRead(userId) {
    const updatedCount = await notificationRepository.markAllAsRead(userId);
    emitToUser(userId, 'notification:unread_count', { count: 0 });
    return updatedCount;
  }

  async registerPushToken(userId, tokenOrPayload, platform = 'web') {
    return await notificationRepository.upsertPushToken(userId, tokenOrPayload, platform);
  }

  async unregisterPushToken(userId, token) {
    return await notificationRepository.removePushToken(userId, token);
  }
}

export const notificationService = new NotificationService();
