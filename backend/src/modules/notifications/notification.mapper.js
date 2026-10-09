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

  const d = parsedData && typeof parsedData === 'object' ? parsedData : {};
  const isRead = Boolean(notification.readAt || notification.status === 'read');

  return {
    id: notification.id,
    userId: notification.userId,
    recipientUserId: notification.userId,
    eventType: notification.eventType,
    channel: notification.channel,
    title: notification.title,
    body: notification.body,
    entityType: d.entityType || null,
    entityId: d.entityId || null,
    requestId: d.requestId || d.travelRequestId || null,
    quotationId: d.quotationId || null,
    conversationId: d.conversationId || null,
    jobId: d.jobId || null,
    deepLink: d.deepLink || null,
    data: parsedData,
    status: notification.status,
    isRead,
    readAt: toIsoStringSafe(notification.readAt),
    createdAt: toIsoStringSafe(notification.createdAt),
  };
}

export function toNotificationListDto(notifications) {
  if (!Array.isArray(notifications)) return [];
  return notifications.map(toNotificationDto);
}
