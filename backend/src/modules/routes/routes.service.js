/**
 * Route service (Phase 4).
 *
 * Owns route calculation (via the map abstraction), persistence,
 * and ownership enforcement. Controllers stay thin.
 */
import { initModels } from '../../db/models/index.js';
import { NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { getMapService } from '../../integrations/maps/map.service.js';
import {
  calculateRecommendedDays,
  RECOMMENDED_DAYS_VERSION,
} from '../../integrations/maps/recommended-days.service.js';
import { validateRouteStops } from './routes.validation.js';

function assertTraveller(role) {
  if (role && role !== 'traveller') {
    throw new ForbiddenError('Only travellers can manage routes.', { code: 'AUTH_FORBIDDEN' });
  }
}

async function findOwnedRoute(routeId, travellerId, { registry = null } = {}) {
  const models = registry || initModels();
  const route = await models.Route.findByPk(routeId, {
    include: [{ model: models.RouteStop, as: 'stops' }],
  });
  if (!route || route.travellerId !== Number(travellerId)) {
    throw new NotFoundError('Route not found.', { code: 'ROUTE_NOT_FOUND' });
  }
  if (route.stops) {
    route.stops.sort((a, b) => a.sequence - b.sequence);
  }
  return route;
}

export async function calculateRouteForTraveller({ stops }, { provider = null } = {}) {
  const normalized = validateRouteStops(stops);
  const service = provider
    ? { calculateRoute: (args) => provider.calculateRoute(args) }
    : getMapService();
  const result = await service.calculateRoute({ stops: normalized });

  const intermediateCount = normalized.filter((s) => s.type === 'intermediate').length;
  const recommendedDays = calculateRecommendedDays({
    distanceKm: result.distanceKm,
    intermediateStops: intermediateCount,
  });

  return {
    stops: normalized,
    startLocation: normalized[0].name,
    finalDestination: normalized[normalized.length - 1].name,
    distanceKm: result.distanceKm,
    durationMinutes: result.durationMinutes,
    geometry: result.geometry,
    recommendedDays,
    calculationProvider: result.provider,
    calculationVersion: RECOMMENDED_DAYS_VERSION,
    rawResponse: result.rawResponse,
  };
}

export function toPublicRoute(route) {
  return {
    id: route.id,
    travellerId: route.travellerId,
    startLocation: route.startLocation,
    finalDestination: route.finalDestination,
    totalDistanceKm: Number(route.totalDistanceKm),
    estimatedDurationMinutes: route.estimatedDurationMinutes,
    recommendedDays: route.recommendedDays,
    calculationProvider: route.calculationProvider,
    calculationVersion: route.calculationVersion,
    rawRouteData: route.rawRouteData ?? null,
    stops: (route.stops || []).map((s) => ({
      id: s.id,
      sequence: s.sequence,
      stopType: s.stopType,
      locationName: s.locationName,
      latitude: Number(s.latitude),
      longitude: Number(s.longitude),
      placeId: s.placeId ?? null,
    })),
    createdAt: route.createdAt,
    updatedAt: route.updatedAt,
  };
}

export async function saveCalculatedRoute(travellerId, calculated, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const route = await models.Route.create({
    travellerId,
    startLocation: calculated.startLocation,
    finalDestination: calculated.finalDestination,
    totalDistanceKm: calculated.distanceKm,
    estimatedDurationMinutes: calculated.durationMinutes,
    recommendedDays: calculated.recommendedDays,
    calculationProvider: calculated.calculationProvider,
    calculationVersion: calculated.calculationVersion,
    rawRouteData: calculated.rawResponse ?? null,
  });
  const stopRows = calculated.stops.map((s, index) => ({
    routeId: route.id,
    sequence: index,
    stopType: s.type,
    locationName: s.name,
    latitude: s.latitude,
    longitude: s.longitude,
    placeId: s.placeId ?? null,
  }));
  await models.RouteStop.bulkCreate(stopRows);
  return toPublicRoute(await findOwnedRoute(route.id, travellerId, { registry: models }));
}

export async function getRoute(travellerId, routeId, { role = null } = {}) {
  assertTraveller(role);
  return toPublicRoute(await findOwnedRoute(routeId, travellerId));
}

export async function patchRoute(travellerId, routeId, patch, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const route = await findOwnedRoute(routeId, travellerId, { registry: models });

  const updatable = {};
  if (patch.startLocation !== undefined) updatable.startLocation = patch.startLocation;
  if (patch.finalDestination !== undefined) updatable.finalDestination = patch.finalDestination;
  if (patch.totalDistanceKm !== undefined) updatable.totalDistanceKm = patch.totalDistanceKm;
  if (patch.estimatedDurationMinutes !== undefined) {
    updatable.estimatedDurationMinutes = patch.estimatedDurationMinutes;
  }
  if (patch.recommendedDays !== undefined) updatable.recommendedDays = patch.recommendedDays;
  if (Object.keys(updatable).length > 0) {
    await route.update(updatable);
  }

  if (patch.stops) {
    await models.RouteStop.destroy({ where: { routeId: route.id } });
    await models.RouteStop.bulkCreate(
      patch.stops.map((s, index) => ({
        routeId: route.id,
        sequence: index,
        stopType: s.type,
        locationName: s.name,
        latitude: s.latitude,
        longitude: s.longitude,
        placeId: s.placeId ?? null,
      })),
    );
    const refreshed = await findOwnedRoute(routeId, travellerId, { registry: models });
    if (patch.startLocation === undefined) {
      await refreshed.update({
        startLocation: refreshed.stops[0]?.locationName ?? refreshed.startLocation,
        finalDestination:
          refreshed.stops[refreshed.stops.length - 1]?.locationName ?? refreshed.finalDestination,
      });
    }
    return toPublicRoute(await findOwnedRoute(routeId, travellerId, { registry: models }));
  }

  return toPublicRoute(await findOwnedRoute(routeId, travellerId, { registry: models }));
}

export async function deleteRoute(travellerId, routeId, { role = null } = {}) {
  assertTraveller(role);
  const models = initModels();
  const route = await findOwnedRoute(routeId, travellerId, { registry: models });
  const referencing = await models.TravelRequest.count({ where: { routeId: route.id } });
  if (referencing > 0) {
    const { ValidationError } = await import('../../utils/errors.js');
    throw new ValidationError('This route is used by a travel request and cannot be deleted.', {
      code: 'ROUTE_IN_USE',
    });
  }
  await route.destroy();
  return { deleted: true };
}

export { findOwnedRoute };
