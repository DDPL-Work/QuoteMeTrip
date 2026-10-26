/**
 * Announcement Service (Workstream 3).
 *
 * Handles creation, validation, targeted publishing, and management of announcements.
 * Dispatches authoritative in-app notifications and FCM push notifications.
 */
import { Op } from 'sequelize';
import {
  initModels,
  Announcement,
  User,
  AgencyProfile,
  Notification,
} from '../../../db/models/index.js';
import { notificationService } from '../../notifications/notification.service.js';
import { logAudit } from '../../audit/audit.service.js';

class AnnouncementService {
  /**
   * List announcements with filtering and pagination
   */
  async list({ page = 1, pageSize = 20, status, targetAudience, search } = {}) {
    const models = initModels();
    const limit = Math.min(100, Math.max(1, parseInt(pageSize, 10)));
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (targetAudience) where.targetAudience = targetAudience;
    if (search) {
      where[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { message: { [Op.like]: `%${search}%` } },
        { titleTr: { [Op.like]: `%${search}%` } },
      ];
    }

    const { count, rows } = await Announcement.findAndCountAll({
      where,
      limit,
      offset,
      order: [[models.sequelize.col('Announcement.created_at'), 'DESC']],
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'role'],
        },
      ],
    });

    return {
      items: rows,
      total: count,
      pagination: {
        page: parseInt(page, 10),
        limit,
        totalItems: count,
        totalPages: Math.ceil(count / limit) || 1,
      },
    };
  }

  /**
   * Get single announcement by ID
   */
  async getById(id) {
    initModels();
    const announcement = await Announcement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'role'],
        },
      ],
    });
    if (!announcement) {
      const error = new Error('Announcement not found');
      error.status = 404;
      throw error;
    }
    return announcement;
  }

  /**
   * Create a new announcement (draft by default)
   */
  async create(data, adminUserId) {
    initModels();
    const {
      title,
      message,
      targetAudience = 'all',
      type = 'general',
      priority = 'normal',
      actionLabel,
      actionUrl,
      titleTr,
      messageTr,
      actionLabelTr,
      expiresAt,
    } = data;

    if (!title || !title.trim()) {
      const err = new Error('Announcement title is required');
      err.status = 400;
      throw err;
    }
    if (!message || !message.trim()) {
      const err = new Error('Announcement message body is required');
      err.status = 400;
      throw err;
    }

    const announcement = await Announcement.create({
      title: title.trim(),
      message: message.trim(),
      targetAudience,
      type,
      priority,
      actionLabel: actionLabel?.trim() || null,
      actionUrl: actionUrl?.trim() || null,
      status: 'draft',
      titleTr: titleTr?.trim() || null,
      messageTr: messageTr?.trim() || null,
      actionLabelTr: actionLabelTr?.trim() || null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      createdBy: adminUserId || null,
    });

    await logAudit({
      actorUserId: adminUserId,
      action: 'ANNOUNCEMENT_CREATED',
      entityType: 'Announcement',
      entityId: announcement.id,
      afterState: announcement.toJSON(),
    });

    return announcement;
  }

  /**
   * Update announcement
   */
  async update(id, data, adminUserId) {
    initModels();
    const announcement = await this.getById(id);

    if (announcement.status === 'published') {
      // If already published, only certain fields like expiry or translations can be edited
      const allowed = ['expiresAt', 'titleTr', 'messageTr', 'actionLabelTr', 'actionUrl'];
      for (const key of allowed) {
        if (data[key] !== undefined) announcement[key] = data[key];
      }
    } else {
      if (data.title !== undefined) announcement.title = data.title.trim();
      if (data.message !== undefined) announcement.message = data.message.trim();
      if (data.targetAudience !== undefined) announcement.targetAudience = data.targetAudience;
      if (data.type !== undefined) announcement.type = data.type;
      if (data.priority !== undefined) announcement.priority = data.priority;
      if (data.actionLabel !== undefined) announcement.actionLabel = data.actionLabel?.trim() || null;
      if (data.actionUrl !== undefined) announcement.actionUrl = data.actionUrl?.trim() || null;
      if (data.titleTr !== undefined) announcement.titleTr = data.titleTr?.trim() || null;
      if (data.messageTr !== undefined) announcement.messageTr = data.messageTr?.trim() || null;
      if (data.actionLabelTr !== undefined) announcement.actionLabelTr = data.actionLabelTr?.trim() || null;
      if (data.expiresAt !== undefined) announcement.expiresAt = data.expiresAt ? new Date(data.expiresAt) : null;
    }

    await announcement.save();

    await logAudit({
      actorUserId: adminUserId,
      action: 'ANNOUNCEMENT_UPDATED',
      entityType: 'Announcement',
      entityId: announcement.id,
      afterState: announcement.toJSON(),
    });

    return announcement;
  }

  /**
   * Authoritatively publish and broadcast announcement to target recipients
   */
  async publish(id, adminUserId) {
    initModels();
    const announcement = await this.getById(id);

    if (announcement.expiresAt && new Date(announcement.expiresAt) < new Date()) {
      const err = new Error('Cannot publish an already expired announcement.');
      err.status = 400;
      throw err;
    }

    // 1. Determine target audience recipients
    const recipients = [];
    const audience = announcement.targetAudience;

    if (audience === 'travellers' || audience === 'all') {
      const travellers = await User.findAll({
        where: {
          role: 'traveller',
          status: 'active',
        },
        attributes: ['id', 'email', 'role'],
      });
      recipients.push(...travellers);
    }

    if (audience === 'agencies' || audience === 'all') {
      const agencies = await User.findAll({
        where: {
          role: 'agency',
          status: 'active',
        },
        include: [
          {
            model: AgencyProfile,
            as: 'agencyProfile',
            where: { status: 'approved' },
            required: true,
          },
        ],
        attributes: ['id', 'email', 'role'],
      });
      recipients.push(...agencies);
    }

    // Deduplicate recipient IDs
    const uniqueMap = new Map();
    for (const r of recipients) {
      uniqueMap.set(r.id, r);
    }
    const targetUsers = Array.from(uniqueMap.values());

    // 2. Broadcast in-app notifications
    // Deduplication idempotencyKey ensures repeated calls never produce duplicate inbox messages
    const notificationPromises = targetUsers.map((user) => {
      return notificationService.notify({
        recipientUserId: user.id,
        eventType: 'ANNOUNCEMENT_BROADCAST',
        channel: 'in_app',
        title: announcement.title,
        body: announcement.message,
        data: {
          announcementId: announcement.id,
          type: announcement.type,
          priority: announcement.priority,
          targetAudience: announcement.targetAudience,
          actionLabel: announcement.actionLabel,
          actionUrl: announcement.actionUrl,
          titleTr: announcement.titleTr,
          messageTr: announcement.messageTr,
          actionLabelTr: announcement.actionLabelTr,
          expiresAt: announcement.expiresAt,
          deepLink: announcement.actionUrl || '/',
        },
        idempotencyKey: `announcement-${announcement.id}-${user.id}`,
      }).catch((err) => {
        console.warn(`[AnnouncementService] Broadcast notice failed for user #${user.id}:`, err.message);
        return null;
      });
    });

    await Promise.all(notificationPromises);

    // 3. Update announcement status
    announcement.status = 'published';
    announcement.publishedAt = new Date();
    announcement.recipientCount = targetUsers.length;
    await announcement.save();

    await logAudit({
      actorUserId: adminUserId,
      action: 'ANNOUNCEMENT_PUBLISHED',
      entityType: 'Announcement',
      entityId: announcement.id,
      afterState: {
        ...announcement.toJSON(),
        dispatchedRecipientCount: targetUsers.length,
      },
    });

    return {
      announcement,
      recipientCount: targetUsers.length,
    };
  }

  /**
   * Withdraw / archive announcement
   */
  async withdraw(id, adminUserId) {
    initModels();
    const announcement = await this.getById(id);
    announcement.status = 'withdrawn';
    await announcement.save();

    await logAudit({
      actorUserId: adminUserId,
      action: 'ANNOUNCEMENT_WITHDRAWN',
      entityType: 'Announcement',
      entityId: announcement.id,
      afterState: announcement.toJSON(),
    });

    return announcement;
  }

  /**
   * Delete an announcement
   */
  async delete(id, adminUserId) {
    initModels();
    const announcement = await this.getById(id);
    const beforeState = announcement.toJSON();
    await announcement.destroy();

    await logAudit({
      actorUserId: adminUserId,
      action: 'ANNOUNCEMENT_DELETED',
      entityType: 'Announcement',
      entityId: id,
      beforeState,
    });

    return { success: true };
  }

  /**
   * Read & Delivery statistics
   */
  async getStats(id) {
    initModels();
    const announcement = await this.getById(id);

    // Count how many recipients have read the notification for this announcement
    const [stats] = await Notification.sequelize.query(
      `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(read_at) as read_count
      FROM notifications
      WHERE event_type = 'ANNOUNCEMENT_BROADCAST'
        AND JSON_UNQUOTE(JSON_EXTRACT(data, '$.announcementId')) = :announcementId
    `,
      {
        replacements: { announcementId: String(id) },
      },
    );

    const stat = stats[0] || {};
    return {
      announcementId: announcement.id,
      status: announcement.status,
      recipientCount: announcement.recipientCount,
      totalDispatched: parseInt(stat.total_notifications || 0, 10),
      readCount: parseInt(stat.read_count || 0, 10),
      publishedAt: announcement.publishedAt,
      expiresAt: announcement.expiresAt,
    };
  }
}

export const announcementService = new AnnouncementService();
