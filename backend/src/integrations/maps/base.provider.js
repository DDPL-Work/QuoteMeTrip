/**
 * Base MapProvider and error codes.
 */
export const MAP_ERROR_CODES = {
  NOT_CONFIGURED: 'MAP_PROVIDER_NOT_CONFIGURED',
  CALCULATION_FAILED: 'MAP_CALCULATION_FAILED',
};

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees) {
  return (Number(degrees) * Math.PI) / 180;
}

export function haversineKm(a, b) {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export class MapProvider {
  get name() {
    return 'base';
  }

  // eslint-disable-next-line no-unused-vars
  async calculateRoute({ stops } = {}) {
    throw new Error('MapProvider.calculateRoute() is not implemented.');
  }

  async getRoute(input) {
    return this.calculateRoute(input);
  }
}
