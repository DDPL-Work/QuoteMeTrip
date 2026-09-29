/**
 * Map service (Phase 4).
 *
 * Thin boundary between route-planning business logic and the map
 * provider abstraction. Business code calls
 * `calculateRoute({ stops }, { provider })` — never a vendor SDK.
 * A provider can be injected (tests/mocks) or resolved from
 * `MAP_PROVIDER` via the factory.
 */
import { getMapProvider } from './map.provider.js';

export class MapService {
  constructor(provider = null) {
    this.provider = provider || getMapProvider();
  }

  async calculateRoute({ stops } = {}) {
    return this.provider.calculateRoute({ stops });
  }
}

let defaultService = null;

/** Shared service instance (uses `MAP_PROVIDER` from the environment). */
export function getMapService() {
  if (!defaultService) {
    defaultService = new MapService();
  }
  return defaultService;
}

/** Test hook: reset the shared instance (e.g. after changing env). */
export function resetMapService() {
  defaultService = null;
}
