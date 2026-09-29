# Notifications

Implemented in Phase 8.

## Architecture

The notification system listens for business events and dispatches them to different providers asynchronously to avoid blocking the main transaction.

## Models

- `Notification`: Stores the notification payload, channel, event type, status, and read state.
- `PushToken`: Stores Firebase Web Push tokens per user/platform.

## Delivery Channels

- `IN_APP`: Available via the notifications API.
- `EMAIL`: Mocked for Phase 8. Will send emails via `integrations/email`.
- `SMS`: Mocked for Phase 8. Will send critical alerts.
- `WEB_PUSH`: Mocked for Phase 8. Can use Firebase Cloud Messaging.

## Events

Supports events like `AGENCY_APPROVED`, `TRAVEL_REQUEST_SUBMITTED`, etc.
