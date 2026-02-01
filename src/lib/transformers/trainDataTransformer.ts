/**
 * Transforms raw SEPTA TrainView API data into normalized vehicle data
 * used throughout the application.
 */

import type {
  SeptaTrainViewTrain,
  NormalizedVehicle,
  VehicleResponse,
} from '@/types/septa-api.types';

/**
 * Safely parses a coordinate string to a number
 *
 * @param value - String value to parse (e.g., "39.952")
 * @param defaultValue - Value to return if parsing fails (default: 0)
 * @returns Parsed number or default value
 */
function parseCoordinate(value: string | undefined, defaultValue = 0): number {
  if (!value) return defaultValue;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Safely parses a lateness value to a number
 *
 * @param value - String value to parse (e.g., "5" for 5 minutes late)
 * @returns Parsed number or 0 if invalid
 */
function parseLateMinutes(value: string | undefined): number {
  if (!value) return 0;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Transforms a single train data object into normalized vehicle format
 *
 * @param train - Raw train data from SEPTA TrainView API
 * @returns Normalized vehicle data
 */
export function transformTrainToVehicle(
  train: SeptaTrainViewTrain
): NormalizedVehicle {
  return {
    // Coordinates (lat/lon in API, lat/lng in our format)
    lat: parseCoordinate(train.lat),
    lng: parseCoordinate(train.lon),

    // Line/route information
    label: train.line || 'Unknown',

    // Vehicle identification (prefer trainno, fallback to consist)
    VehicleID: train.trainno || train.consist || 'Unknown',

    // Direction (prefer direction, fallback to heading)
    Direction: train.direction || train.heading || 'Unknown',

    // Destination (prefer dest, fallback to nextstop)
    destination: train.dest || train.nextstop || 'Unknown',

    // Additional metadata
    late: parseLateMinutes(train.late),
    service: train.service || 'Regional Rail',
    track: train.track || null,
  };
}

/**
 * Filters trains by line name (case-insensitive partial match)
 *
 * @param trains - Array of raw train data
 * @param lineName - Line name to filter by (e.g., "Airport", "Norristown")
 * @returns Filtered array of trains matching the line name
 *
 * @example
 * ```ts
 * // Matches "Airport Line", "AIRPORT LINE", etc.
 * const airportTrains = filterTrainsByLine(allTrains, "Airport");
 * ```
 */
export function filterTrainsByLine(
  trains: SeptaTrainViewTrain[],
  lineName: string
): SeptaTrainViewTrain[] {
  const searchTerm = lineName.trim().toLowerCase();

  return trains.filter((train) => {
    if (!train.line) return false;
    return train.line.toLowerCase().includes(searchTerm);
  });
}

/**
 * Transforms and filters TrainView API response into normalized vehicle format
 *
 * @param trains - Raw train data array from SEPTA TrainView API
 * @param lineName - Optional line name to filter by
 * @returns Vehicle response in standardized format
 *
 * @example
 * ```ts
 * const response = await fetch('https://www3.septa.org/api/TrainView/');
 * const trains = await response.json();
 * const vehicles = transformTrainResponse(trains, 'Airport');
 * ```
 */
export function transformTrainResponse(
  trains: SeptaTrainViewTrain[],
  lineName?: string
): VehicleResponse {
  // Filter by line if specified
  const filteredTrains = lineName
    ? filterTrainsByLine(trains, lineName)
    : trains;

  // Transform to normalized format
  const normalizedVehicles = filteredTrains.map(transformTrainToVehicle);

  // Return in standardized response structure
  // Note: Uses 'bus' key for compatibility with existing code
  return {
    bus: normalizedVehicles,
  };
}
