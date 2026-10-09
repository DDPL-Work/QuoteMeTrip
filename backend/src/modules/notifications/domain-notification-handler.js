/**
 * Domain Notification Handler (QuoteMyTrip Phase 8 FCM).
 *
 * Translates domain events into rich, context-aware, persistent in-app
 * and Web Push FCM notifications.
 *
 * Implements:
 * - Recipient resolution and role isolation
 * - Sender exclusion (senders NEVER receive notifications for their own actions)
 * - Contact protection (phone/email/WhatsApp masked via maskContactDetails)
 * - Exact deep linking to business context
 * - Fail-safe execution (failures never break domain transactions)
 */
import { initModels } from '../../db/models/index.js';
import { notificationService } from './notification.service.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_EVENTS } from './notification.constants.js';
import { maskContactDetails } from '../contact/contact-visibility.js';

export async function handleDomainNotificationEvent(event, payload = {}) {
  try {
    const models = initModels();

    switch (event) {
      case NOTIFICATION_EVENTS.MESSAGE_RECEIVED: {
        const { conversationId, messageId, senderUserId } = payload;
        if (!conversationId || !messageId) return;

        const conversation = await models.Conversation.findByPk(conversationId);
        if (!conversation) return;

        const message = await models.Message.findByPk(messageId);
        if (!message || message.deletedForEveryoneAt) return;

        // Resolve participants
        const agencyProfile = await models.AgencyProfile.findByPk(conversation.agencyId);
        if (!agencyProfile) return;

        const isSenderTraveller = Number(senderUserId) === Number(conversation.travellerId);
        const recipientUserId = isSenderTraveller
          ? Number(agencyProfile.userId)
          : Number(conversation.travellerId);

        // Never notify sender
        if (Number(recipientUserId) === Number(senderUserId)) return;

        // Request context
        let reqTitle = `Request #${conversation.travelRequestId}`;
        if (conversation.travelRequestId) {
          const req = await models.TravelRequest.findByPk(conversation.travelRequestId, {
            include: [{ model: models.Route, as: 'route' }],
          });
          if (req) {
            const dest = req.destination || req.route?.finalDestination || req.title;
            if (dest) reqTitle = `${dest} · Request #${req.id}`;
          }
        }

        // Check if there is a quotation associated with this request and agency
        let quotation = null;
        if (models.Quotation) {
          quotation = await models.Quotation.findOne({
            where: {
              travelRequestId: conversation.travelRequestId,
              agencyId: conversation.agencyId,
            },
            order: [['id', 'DESC']],
          });
        }
        if (quotation) {
          reqTitle += ` · Quote #${quotation.id}`;
        }

        // Sender display name
        let senderName = 'New Message';
        if (isSenderTraveller) {
          const traveller = await models.User.findByPk(conversation.travellerId);
          senderName = traveller?.name || traveller?.firstName || 'Traveller';
        } else {
          senderName = agencyProfile.agencyName || agencyProfile.companyName || 'Agency';
        }

        // Mask contact info from preview (Requirement 15 / 23)
        const maskedBody = maskContactDetails(message.body || '');
        const preview = maskedBody.length > 90 ? `${maskedBody.slice(0, 90)}...` : maskedBody;

        const deepLink = isSenderTraveller
          ? `/messages?requestId=${conversation.travelRequestId}&conversationId=${conversation.id}`
          : `/messages?conversationId=${conversation.id}&requestId=${conversation.travelRequestId}`;

        await notificationService.notify({
          recipientUserId,
          eventType: NOTIFICATION_EVENTS.MESSAGE_RECEIVED,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          title: `New message from ${senderName}`,
          body: `${reqTitle}: "${preview}"`,
          entityType: 'MESSAGE',
          entityId: message.id,
          requestId: conversation.travelRequestId,
          conversationId: conversation.id,
          quotationId: quotation?.id || null,
          deepLink,
          data: {
            conversationId: conversation.id,
            messageId: message.id,
            requestId: conversation.travelRequestId,
            quotationId: quotation?.id || null,
            senderUserId,
            senderName,
          },
        });
        break;
      }

      case NOTIFICATION_EVENTS.QUOTATION_SUBMITTED: {
        const { quotationId, travelRequestId, agencyId } = payload;
        if (!quotationId || !travelRequestId) return;

        const [quotation, request, agency] = await Promise.all([
          models.Quotation.findByPk(quotationId),
          models.TravelRequest.findByPk(travelRequestId, {
            include: [{ model: models.Route, as: 'route' }],
          }),
          models.AgencyProfile.findByPk(agencyId),
        ]);

        if (!quotation || !request || !agency) return;

        const recipientUserId = request.travellerId;
        const agencyName = agency.agencyName || agency.companyName || 'Agency';
        const dest = request.destination || request.route?.finalDestination || `Trip #${request.id}`;

        const isRevision = (quotation.version && quotation.version > 1) || Boolean(quotation.parentQuotationId);
        const title = isRevision ? 'Quotation revised' : 'New quotation received';
        const eventType = isRevision ? NOTIFICATION_EVENTS.QUOTATION_REVISED : NOTIFICATION_EVENTS.QUOTATION_SUBMITTED;
        const body = isRevision
          ? `${agencyName} revised quotation for ${dest} (Quote #${quotation.id}).`
          : `${agencyName} submitted a new quotation for ${dest}.`;

        const deepLink = `/travel-requests/${travelRequestId}?tab=quotes`;

        await notificationService.notify({
          recipientUserId,
          eventType,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          title,
          body,
          entityType: 'QUOTATION',
          entityId: quotation.id,
          requestId: travelRequestId,
          quotationId: quotation.id,
          deepLink,
          data: {
            quotationId: quotation.id,
            version: quotation.version || 1,
            agencyId: agency.id,
            agencyName,
          },
        });
        break;
      }

      case NOTIFICATION_EVENTS.QUOTATION_ACCEPTED: {
        const { quotationId, travelRequestId, agencyId } = payload;
        if (!quotationId || !travelRequestId) return;

        const [quotation, request, agency] = await Promise.all([
          models.Quotation.findByPk(quotationId),
          models.TravelRequest.findByPk(travelRequestId, {
            include: [{ model: models.Route, as: 'route' }],
          }),
          models.AgencyProfile.findByPk(agencyId),
        ]);

        if (!agency) return;

        const recipientUserId = agency.userId;
        const dest = request?.destination || request?.route?.finalDestination || `Trip #${travelRequestId}`;

        await notificationService.notify({
          recipientUserId,
          eventType: NOTIFICATION_EVENTS.QUOTATION_ACCEPTED,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          title: 'Quotation accepted',
          body: `Your quotation for ${dest} (Quote #${quotationId}) was accepted!`,
          entityType: 'QUOTATION',
          entityId: quotationId,
          requestId: travelRequestId,
          quotationId,
          deepLink: `/jobs`,
          data: {
            quotationId,
            travelRequestId,
          },
        });
        break;
      }

      case NOTIFICATION_EVENTS.REQUEST_MATCHED: {
        const { travelRequestId, agencyId } = payload;
        if (!travelRequestId || !agencyId) return;

        const [request, agency] = await Promise.all([
          models.TravelRequest.findByPk(travelRequestId, {
            include: [{ model: models.Route, as: 'route' }],
          }),
          models.AgencyProfile.findByPk(agencyId),
        ]);

        if (!request || !agency) return;

        const recipientUserId = agency.userId;
        const dest = request.destination || request.route?.finalDestination || request.title || 'Custom Trip';
        const num = request.numberOfTravellers || 1;

        await notificationService.notify({
          recipientUserId,
          eventType: NOTIFICATION_EVENTS.REQUEST_MATCHED,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          title: 'New travel request',
          body: `${dest} · ${num} Traveller${num > 1 ? 's' : ''} (Request #${request.id})`,
          entityType: 'TRAVEL_REQUEST',
          entityId: request.id,
          requestId: request.id,
          deepLink: `/requests/${request.id}`,
          data: {
            travelRequestId: request.id,
            destination: dest,
          },
        });
        break;
      }

      case NOTIFICATION_EVENTS.JOB_CREATED: {
        const { jobId, quotationId, travelRequestId } = payload;
        if (!jobId || !travelRequestId) return;

        const [job, request] = await Promise.all([
          models.Job.findByPk(jobId),
          models.TravelRequest.findByPk(travelRequestId, {
            include: [{ model: models.Route, as: 'route' }],
          }),
        ]);

        if (!job || !request) return;

        const dest = request.destination || request.route?.finalDestination || `Trip #${request.id}`;

        // Notify Traveller
        await notificationService.notify({
          recipientUserId: request.travellerId,
          eventType: NOTIFICATION_EVENTS.JOB_CREATED,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          title: 'Trip confirmed',
          body: `Your trip to ${dest} is confirmed (Job #${job.id}).`,
          entityType: 'JOB',
          entityId: job.id,
          requestId: request.id,
          jobId: job.id,
          deepLink: `/travel-requests/${request.id}`,
          data: { jobId: job.id, travelRequestId: request.id },
        });
        break;
      }

      case NOTIFICATION_EVENTS.JOB_STATUS_CHANGED: {
        const { jobId, status } = payload;
        if (!jobId) return;

        const job = await models.Job.findByPk(jobId, {
          include: [{ model: models.TravelRequest, as: 'travelRequest' }],
        });
        if (!job || !job.travelRequest) return;

        const req = job.travelRequest;
        const dest = req.destination || req.title || `Trip #${req.id}`;

        let title = 'Trip update';
        let body = `Your trip status changed to ${status}.`;
        if (status === 'in_progress') {
          title = 'Trip started';
          body = `Your ${dest} trip is now in progress.`;
        } else if (status === 'completed') {
          title = 'Trip completed';
          body = `Your ${dest} trip is completed. Please rate your experience!`;
        } else if (status === 'cancelled') {
          title = 'Trip cancelled';
          body = `Your ${dest} trip has been cancelled.`;
        }

        await notificationService.notify({
          recipientUserId: req.travellerId,
          eventType: NOTIFICATION_EVENTS.JOB_STATUS_CHANGED,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          title,
          body,
          entityType: 'JOB',
          entityId: job.id,
          requestId: req.id,
          jobId: job.id,
          deepLink: `/travel-requests/${req.id}`,
          data: { jobId: job.id, status },
        });
        break;
      }

      case NOTIFICATION_EVENTS.AGENCY_APPROVED: {
        const { agencyId } = payload;
        const agency = await models.AgencyProfile.findByPk(agencyId);
        if (!agency) return;

        await notificationService.notify({
          recipientUserId: agency.userId,
          eventType: NOTIFICATION_EVENTS.AGENCY_APPROVED,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          title: 'Agency approved',
          body: 'Congratulations! Your agency profile has been approved.',
          entityType: 'AGENCY_PROFILE',
          entityId: agency.id,
          deepLink: '/profile',
          data: { agencyId: agency.id },
        });
        break;
      }

      case NOTIFICATION_EVENTS.DOCUMENT_REJECTED: {
        const { agencyId, documentId, note } = payload;
        const agency = await models.AgencyProfile.findByPk(agencyId);
        if (!agency) return;

        await notificationService.notify({
          recipientUserId: agency.userId,
          eventType: NOTIFICATION_EVENTS.DOCUMENT_REJECTED,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          title: 'Document rejected',
          body: `Your uploaded document was rejected: ${note || 'Please re-upload a valid document.'}`,
          entityType: 'AGENCY_DOCUMENT',
          entityId: documentId,
          deepLink: '/profile',
          data: { agencyId: agency.id, documentId, note },
        });
        break;
      }

      case NOTIFICATION_EVENTS.DOCUMENT_VERIFIED: {
        const { agencyId, documentId } = payload;
        const agency = await models.AgencyProfile.findByPk(agencyId);
        if (!agency) return;

        await notificationService.notify({
          recipientUserId: agency.userId,
          eventType: NOTIFICATION_EVENTS.DOCUMENT_VERIFIED,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          title: 'Document verified',
          body: 'Your business document has been verified by administrators.',
          entityType: 'AGENCY_DOCUMENT',
          entityId: documentId,
          deepLink: '/profile',
          data: { agencyId: agency.id, documentId },
        });
        break;
      }

      case NOTIFICATION_EVENTS.MEMBERSHIP_ACTIVATED: {
        const { agencyId } = payload;
        const agency = await models.AgencyProfile.findByPk(agencyId);
        if (!agency) return;

        await notificationService.notify({
          recipientUserId: agency.userId,
          eventType: NOTIFICATION_EVENTS.MEMBERSHIP_ACTIVATED,
          channel: NOTIFICATION_CHANNELS.IN_APP,
          title: 'Membership activated',
          body: 'Your agency membership subscription is now active.',
          entityType: 'MEMBERSHIP',
          entityId: agency.id,
          deepLink: '/profile',
          data: { agencyId: agency.id },
        });
        break;
      }

      default:
        break;
    }
  } catch (err) {
    console.error(`[DomainNotificationHandler] Error handling event ${event}:`, err.message);
  }
}
