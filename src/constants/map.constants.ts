/**
 * Map configuration constants for the SEPTA Live application.
 */

import { DEFAULT_REGIONAL_RAIL_LINE } from './routes';

/**
 * Center City Philadelphia coordinates [latitude, longitude]
 * Used as the default map center when no location is available
 */
export const PHILADELPHIA_CENTER: [number, number] = [39.9526, -75.1652];

/**
 * Default SEPTA routes displayed when the app first loads
 * (when no routes are specified in the URL)
 *
 * Mix of popular bus routes and one regional rail line for variety
 */
export const DEFAULT_ROUTES = [
  '57',    // Bus
  '47',    // Bus
  '42',    // Bus
  '9',     // Bus
  '12',    // Bus
  '21',    // Bus
  '29',    // Bus
  DEFAULT_REGIONAL_RAIL_LINE,  // Regional Rail (Norristown)
];

/**
 * Default zoom level for the map
 */
export const DEFAULT_ZOOM = 13;

/**
 * Zoom level when centering on user's location
 */
export const LOCATION_ZOOM = 15;
