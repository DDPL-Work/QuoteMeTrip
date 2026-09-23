// @troublefree/api-client
//
// Phase 1: establishes the shared HTTP client boundary so no
// application talks to the backend with a one-off axios instance.
// Authentication interceptors and REST resource modules (traveller,
// agency, admin, travel-request, quotation, etc.) are added once
// those features exist — not implemented yet.

import axios from 'axios';

export function createApiClient({ baseURL }) {
  const client = axios.create({ baseURL });

  // Future phases: attach request/response interceptors here for
  // auth tokens, refresh flows, and centralized error normalization.

  return client;
}
