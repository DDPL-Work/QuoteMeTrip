# API

## Base URL

```text
/api/v1
```

## Phase 1 endpoints

### `GET /api/v1/health`

Returns service health status.

```json
{
  "success": true,
  "service": "troublefree-holiday-backend",
  "status": "healthy",
  "timestamp": "2026-09-23T00:00:00.000Z",
  "environment": "development"
}
```

## Error format

All errors return structured JSON, never HTML:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route not found"
  }
}
```

## Future endpoints

Traveller, Agency, Admin, Travel Request, Quotation, Messaging,
Membership, Notification, Weather, Travel Guide, and Rating endpoints
will be documented here as each module is implemented.
