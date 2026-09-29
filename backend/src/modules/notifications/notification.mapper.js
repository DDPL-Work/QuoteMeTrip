export function toNotificationDto(notification) {
  if (!notification) return null;

  return {
    id: notification.id,
    userId: notification.userId,
    eventType: notification.eventType,
    channel: notification.channel,
    title: notification.title,
    body: notification.body,
    data: notification.data || null,
    status: notification.status,
    readAt: notification.readAt ? notification.readAt.toISOString() : null,
    createdAt: notification.createdAt ? notification.createdAt.toISOString() : null,
  };
}

export function toNotificationListDto(notifications) {
  if (!Array.isArray(notifications)) return [];
  return notifications.map(toNotificationDto);
}
