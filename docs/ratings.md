# Ratings

Implemented in Phase 8.

## Architecture

Travellers can rate an Agency after a `Job` is marked as `completed`. Only one rating (1-5) is allowed per completed job. No written review is included in standard scope.

## Models

- `Rating`: Links a job, travel request, traveller, and agency with a 1-5 score.

## API

- `POST /api/v1/jobs/:jobId/rating`: Submits a rating for a completed job.
- `GET /api/v1/agencies/:id/rating-summary`: Retrieves average rating and count for an agency.
- `GET /api/v1/admin/ratings`: Full list of ratings for administrators.
