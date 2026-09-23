/**
 * PLACEHOLDER — Map provider abstraction.
 *
 * Defines the conceptual contract a concrete map provider adapter
 * (e.g. Google Maps, Mapbox, OSRM) must implement. No provider is
 * selected or implemented in Phase 1.
 *
 * Expected future shape of a route result:
 * {
 *   origin,
 *   stops,
 *   destination,
 *   distance,
 *   duration,
 *   geometry,
 * }
 */

export class MapProvider {
  async getRoute(/* { origin, stops, destination } */) {
    throw new Error(
      'MapProvider.getRoute() is not implemented. Select a provider in a later phase.',
    );
  }
}
