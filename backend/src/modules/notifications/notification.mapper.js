function toIsoStringSafe(val) {
  if (!val) return null;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? null : val.toISOString();
  }
  const d = new Date(val);
  return isNaN(d.getTime()) ? String(val) : d.toISOString();
}

export function toNotificationDto(notification) {
  if (!notification) return null;

  let parsedData = notification.data || null;
  if (typeof parsedData === 'string') {
    try {
      parsedData = JSON.parse(parsedData);
    } catch {
      // keep original string
    }
  }

  return {
    id: notification.id,
    userId: notification.userId,
    eventType: notification.eventType,
    channel: notification.channel,
    title: notification.title,
    body: notification.body,
    data: parsedData,
    status: notification.status,
    readAt: toIsoStringSafe(notification.readAt),
    createdAt: toIsoStringSafe(notification.createdAt),
  };
}

export function toNotificationListDto(notifications) {
  if (!Array.isArray(notifications)) return [];
  return notifications.map(toNotificationDto);
}
