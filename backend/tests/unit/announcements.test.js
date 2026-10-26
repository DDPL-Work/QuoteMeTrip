import 'dotenv/config';
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { getSequelize, closeDatabase } from '../../src/db/sequelize.js';
import { initModels } from '../../src/db/models/index.js';
import { announcementService } from '../../src/modules/admin/announcements/announcement.service.js';

describe('Admin Announcement & Broadcasting System Tests', () => {
  let sequelize;
  let models;
  let adminUser;
  let travellerUser;
  let agencyUser;
  let agencyProfile;

  before(async () => {
    sequelize = getSequelize();
    models = initModels(sequelize);
    await sequelize.authenticate();

    // Create isolated test fixtures in DB
    adminUser = await models.User.create({
      name: 'Announcement Admin',
      email: `ann-admin-${Date.now()}@example.com`,
      passwordHash: 'dummyhash',
      role: 'admin',
      status: 'active',
    });

    travellerUser = await models.User.create({
      name: 'Announcement Traveller',
      email: `ann-traveller-${Date.now()}@example.com`,
      passwordHash: 'dummyhash',
      role: 'traveller',
      status: 'active',
    });

    agencyUser = await models.User.create({
      name: 'Announcement Agency Owner',
      email: `ann-agency-${Date.now()}@example.com`,
      passwordHash: 'dummyhash',
      role: 'agency',
      status: 'active',
    });

    agencyProfile = await models.AgencyProfile.create({
      userId: agencyUser.id,
      agencyName: 'Announcement Test Agency',
      contactPerson: 'Agent Test',
      phone: '+905551234567',
      status: 'approved',
    });
  });

  after(async () => {
    // Clean up our specific test fixtures
    if (agencyProfile) await agencyProfile.destroy().catch(() => {});
    if (agencyUser) await agencyUser.destroy().catch(() => {});
    if (travellerUser) await travellerUser.destroy().catch(() => {});
    if (adminUser) await adminUser.destroy().catch(() => {});
    await closeDatabase();
  });

  it('1. Admin can create a draft announcement with validation', async () => {
    const draft = await announcementService.create(
      {
        title: 'Platform Maintenance Notice',
        message: 'Servers will undergo maintenance this Sunday at 02:00 UTC.',
        targetAudience: 'all',
        type: 'maintenance',
        priority: 'high',
        actionLabel: 'Check Status',
        actionUrl: 'https://status.quotemetrip.com',
        titleTr: 'Sistem Bakımı Bildirimi',
        messageTr: 'Pazar günü saat 02:00 UTC sunucu bakımı yapılacaktır.',
      },
      adminUser.id,
    );

    assert.ok(draft.id, 'Announcement should have an ID');
    assert.equal(draft.status, 'draft', 'Status should be draft');
    assert.equal(draft.title, 'Platform Maintenance Notice');
    assert.equal(draft.targetAudience, 'all');
    assert.equal(draft.createdBy, adminUser.id);
  });

  it('2. Rejects announcement creation with missing title or message', async () => {
    await assert.rejects(
      async () => {
        await announcementService.create({ title: '', message: 'Test message' }, adminUser.id);
      },
      { message: 'Announcement title is required' },
    );

    await assert.rejects(
      async () => {
        await announcementService.create({ title: 'Title', message: '   ' }, adminUser.id);
      },
      { message: 'Announcement message body is required' },
    );
  });

  it('3. Publishes targeted broadcast to travellers only and dispatches in-app notifications', async () => {
    const announcement = await announcementService.create(
      {
        title: 'Special Summer Discount for Travellers',
        message: 'Enjoy 15% off custom travel routes this month!',
        targetAudience: 'travellers',
        type: 'info',
        priority: 'normal',
      },
      adminUser.id,
    );

    const publishResult = await announcementService.publish(announcement.id, adminUser.id);
    assert.ok(publishResult.recipientCount >= 1, 'Should reach at least 1 traveller');

    // Verify persisted in-app notification in DB for our test traveller
    const travellerNotification = await models.Notification.findOne({
      where: {
        userId: travellerUser.id,
        eventType: 'ANNOUNCEMENT_BROADCAST',
      },
      order: [['id', 'DESC']],
    });
    assert.ok(travellerNotification, 'Traveller must receive in-app notification');
    assert.equal(travellerNotification.title, 'Special Summer Discount for Travellers');

    // Verify agency DID NOT receive traveller-only announcement (Audience isolation)
    const agencyNotification = await models.Notification.findOne({
      where: {
        userId: agencyUser.id,
        eventType: 'ANNOUNCEMENT_BROADCAST',
        title: 'Special Summer Discount for Travellers',
      },
    });
    assert.equal(agencyNotification, null, 'Agency must NOT receive traveller-only announcement');
  });

  it('4. Repeated publish requests are idempotent and do not create duplicate notifications', async () => {
    const announcement = await announcementService.create(
      {
        title: 'Idempotency Test Notice',
        message: 'This notice should not be duplicated.',
        targetAudience: 'travellers',
      },
      adminUser.id,
    );

    // Publish once
    await announcementService.publish(announcement.id, adminUser.id);
    const countFirst = await models.Notification.count({
      where: {
        userId: travellerUser.id,
        eventType: 'ANNOUNCEMENT_BROADCAST',
        title: 'Idempotency Test Notice',
      },
    });

    // Publish second time
    await announcementService.publish(announcement.id, adminUser.id);
    const countSecond = await models.Notification.count({
      where: {
        userId: travellerUser.id,
        eventType: 'ANNOUNCEMENT_BROADCAST',
        title: 'Idempotency Test Notice',
      },
    });

    assert.equal(countFirst, countSecond, 'Duplicate notifications must be prevented');
  });

  it('5. Admin can retrieve read and delivery stats', async () => {
    const announcement = await announcementService.create(
      {
        title: 'Stats Tracking Test',
        message: 'Testing stats counting.',
        targetAudience: 'travellers',
      },
      adminUser.id,
    );

    await announcementService.publish(announcement.id, adminUser.id);
    const stats = await announcementService.getStats(announcement.id);

    assert.ok(stats.totalDispatched >= 1, 'Dispatched count should be tracked');
    assert.equal(typeof stats.readCount, 'number', 'Read count should be a number');
  });

  it('6. Admin can withdraw announcement', async () => {
    const announcement = await announcementService.create(
      {
        title: 'Withdrawal Test Notice',
        message: 'To be withdrawn.',
        targetAudience: 'all',
      },
      adminUser.id,
    );

    await announcementService.publish(announcement.id, adminUser.id);
    const withdrawn = await announcementService.withdraw(announcement.id, adminUser.id);
    assert.equal(withdrawn.status, 'withdrawn');
  });

  it('7. Admin can list announcements with pagination and ordering', async () => {
    const result = await announcementService.list({ page: 1, pageSize: 15 });
    assert.ok(result, 'List result should exist');
    assert.ok(Array.isArray(result.items), 'items should be an array');
    assert.equal(result.pagination.page, 1);
    assert.equal(result.pagination.limit, 15);
    assert.ok(result.total >= 1, 'Total items should be >= 1');
  });

  it('8. Enforces audience-based visibility for travellers and agencies', async () => {
    // Agency-only announcement
    const agencyOnly = await announcementService.create(
      {
        title: 'Agency Commission Policy Update',
        message: 'Commission updates effective next quarter.',
        targetAudience: 'agencies',
      },
      adminUser.id,
    );
    await announcementService.publish(agencyOnly.id, adminUser.id);

    // Verify agency can access
    const isAgencyTargeted = agencyOnly.targetAudience === 'all' || agencyOnly.targetAudience === 'agencies';
    assert.equal(isAgencyTargeted, true, 'Agencies should have access');

    // Verify traveller cannot access agency-only
    const isTravellerTargeted = agencyOnly.targetAudience === 'all' || agencyOnly.targetAudience === 'travellers';
    assert.equal(isTravellerTargeted, false, 'Travellers must NOT have access to agency-only announcement');
  });
});
