/**
 * Transforms GTFS-RT vehicle data into normalized vehicle format.
 * Used for subway lines (BSL, MFL) which are not available in TransitViewAll API.
 */

import type {
  GtfsRtFeedResponse,
  GtfsRtVehicleEntity,
  NormalizedVehicle,
  VehicleResponse,
} from '@/types/septa-api.types';

/**
 * Parses the human-readable GTFS-RT print.php format into structured data.
 * The format uses HTML with <br> tags and colons for key-value pairs.
 *
 * @param htmlText - Raw HTML text from print.php endpoint
 * @returns Parsed GTFS-RT feed response
 */
export function parseGtfsRtPrintFormat(htmlText: string): GtfsRtFeedResponse {
  const entities: GtfsRtVehicleEntity[] = [];

  // Extract the content between <pre> tags
  const preMatch = htmlText.match(/<pre>([\s\S]*?)<\/pre>/);
  if (!preMatch) {
    return {
      header: {
        gtfs_realtime_version: '2.0',
        incrementality: 'FULL_DATASET',
        timestamp: Date.now() / 1000,
      },
      entity: [],
    };
  }

  // Remove <br> tags for easier parsing
  const content = preMatch[1].replace(/<br>/g, '\n');

  // Split by entity blocks
  const entityBlocks = content.split(/entity\s*\{/).slice(1);

  for (let block of entityBlocks) {
    // Remove closing braces at the end
    block = block.replace(/\}\s*$/, '');

    const entity: GtfsRtVehicleEntity = {
      id: '',
      vehicle: {},
    };

    // Extract id
    const idMatch = block.match(/id:\s*"([^"]+)"/);
    if (idMatch) entity.id = idMatch[1];

    // Extract vehicle data (everything after "vehicle {")
    const vehicleMatch = block.match(/vehicle\s*\{([\s\S]*)/);
    if (vehicleMatch) {
      const vehicleData = vehicleMatch[1];

      // Extract trip data
      const tripMatch = vehicleData.match(/trip\s*\{([^}]*)\}/);
      if (tripMatch) {
        const tripData = tripMatch[1];
        const tripId = tripData.match(/trip_id:\s*"([^"]+)"/)?.[1];
        const routeId = tripData.match(/route_id:\s*"([^"]+)"/)?.[1];
        const directionId = tripData.match(/direction_id:\s*(\d+)/)?.[1];

        entity.vehicle.trip = {
          trip_id: tripId,
          route_id: routeId,
          direction_id: directionId ? parseInt(directionId) : undefined,
        };
      }

      // Extract vehicle info - need to match the second "vehicle {" block
      const vehicleInfoMatch = vehicleData.match(/vehicle\s*\{([^}]*)\}/);
      if (vehicleInfoMatch) {
        const vehicleInfo = vehicleInfoMatch[1];
        const vehicleId = vehicleInfo.match(/id:\s*"([^"]+)"/)?.[1];
        const label = vehicleInfo.match(/label:\s*"([^"]+)"/)?.[1];

        entity.vehicle.vehicle = {
          id: vehicleId,
          label: label,
        };
      }

      // Extract position
      const positionMatch = vehicleData.match(/position\s*\{([^}]*)\}/);
      if (positionMatch) {
        const positionData = positionMatch[1];
        const lat = positionData.match(/latitude:\s*([-\d.]+)/)?.[1];
        const lng = positionData.match(/longitude:\s*([-\d.]+)/)?.[1];
        const bearing = positionData.match(/bearing:\s*([-\d.]+)/)?.[1];

        entity.vehicle.position = {
          latitude: lat ? parseFloat(lat) : undefined,
          longitude: lng ? parseFloat(lng) : undefined,
          bearing: bearing ? parseFloat(bearing) : undefined,
        };
      }

      // Extract other fields (outside of nested blocks)
      const stopIdMatch = vehicleData.match(/\n\s*stop_id:\s*"([^"]+)"/);
      const timestampMatch = vehicleData.match(/\n\s*timestamp:\s*(\d+)/);
      const occupancyMatch = vehicleData.match(/\n\s*occupancy_status:\s*(\w+)/);

      if (stopIdMatch) entity.vehicle.stop_id = stopIdMatch[1];
      if (timestampMatch) entity.vehicle.timestamp = parseInt(timestampMatch[1]);
      if (occupancyMatch) entity.vehicle.occupancy_status = occupancyMatch[1];
    }

    entities.push(entity);
  }

  return {
    header: {
      gtfs_realtime_version: '2.0',
      incrementality: 'FULL_DATASET',
      timestamp: Date.now() / 1000,
    },
    entity: entities,
  };
}

/**
 * Transforms a GTFS-RT vehicle entity into normalized vehicle format.
 *
 * @param entity - GTFS-RT vehicle entity
 * @param routeLabel - Route label to use (e.g., "BSL", "MFL")
 * @returns Normalized vehicle data
 */
export function transformGtfsRtVehicle(
  entity: GtfsRtVehicleEntity,
  routeLabel: string
): NormalizedVehicle | null {
  const { vehicle } = entity;

  // Must have position data
  if (!vehicle.position?.latitude || !vehicle.position?.longitude) {
    return null;
  }

  // Must have vehicle identification
  const vehicleId = vehicle.vehicle?.id || vehicle.vehicle?.label || entity.id;
  if (!vehicleId) {
    return null;
  }

  return {
    lat: vehicle.position.latitude,
    lng: vehicle.position.longitude,
    label: routeLabel,
    VehicleID: vehicleId,
    Direction: vehicle.trip?.direction_id === 0 ? 'Northbound' : 'Southbound',
    destination: vehicle.stop_id || 'Unknown',
    late: 0, // GTFS-RT doesn't provide lateness info
    service: 'Subway',
  };
}

/**
 * Filters GTFS-RT entities by route ID.
 *
 * @param entities - Array of GTFS-RT vehicle entities
 * @param routeId - Route ID to filter by (e.g., "BSL", "MFL")
 * @returns Filtered array of entities
 */
export function filterGtfsRtByRoute(
  entities: GtfsRtVehicleEntity[],
  routeId: string
): GtfsRtVehicleEntity[] {
  return entities.filter(
    (entity) => entity.vehicle.trip?.route_id === routeId
  );
}

/**
 * Transforms GTFS-RT feed response into normalized vehicle format.
 *
 * @param feedData - GTFS-RT feed response
 * @param routeId - Optional route ID to filter by
 * @returns Vehicle response in standardized format
 */
export function transformGtfsRtResponse(
  feedData: GtfsRtFeedResponse,
  routeId?: string
): VehicleResponse {
  // Filter by route if specified
  const entities = routeId
    ? filterGtfsRtByRoute(feedData.entity, routeId)
    : feedData.entity;

  // Transform to normalized format, using route ID as label
  const normalizedVehicles = entities
    .map((entity) => transformGtfsRtVehicle(entity, routeId || 'Unknown'))
    .filter((vehicle): vehicle is NormalizedVehicle => vehicle !== null);

  return {
    bus: normalizedVehicles,
  };
}
