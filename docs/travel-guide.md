# Travel Guide CMS

Implemented in Phase 8.

## Architecture

Provides a CMS for creating Regions, Destinations, and Articles. Contains both an Admin interface for content management and a Public API for consuming published content.

## Models

- `TravelGuideRegion`: Broad regions (e.g., Europe, Asia).
- `TravelGuideDestination`: Specific locations inside a region.
- `TravelGuideArticle`: The actual blog/guide content.

## Workflow

Articles start as `draft`, and can be transitioned to `published` by an admin. The public API only serves `published` content.
