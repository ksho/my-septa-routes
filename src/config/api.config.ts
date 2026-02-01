/**
 * Configuration constants for SEPTA API endpoints and settings
 */

/**
 * SEPTA API base URLs and endpoints
 */
export const SEPTA_API_ENDPOINTS = {
  /** Real-time bus and trolley vehicle positions */
  TRANSIT_VIEW: 'https://www3.septa.org/api/TransitView/index.php',

  /** Real-time regional rail train positions */
  TRAIN_VIEW: 'https://www3.septa.org/api/TrainView/index.php',
} as const;

/**
 * ArcGIS Feature Server endpoints for SEPTA route geometry
 */
export const ARCGIS_ENDPOINTS = {
  /** Bus and trolley route paths (Spring 2025 schedule) */
  TRANSIT_ROUTES:
    'https://services2.arcgis.com/9U43PSoL47wawX5S/ArcGIS/rest/services/Transit_Routes_(Spring_2025)/FeatureServer/0/query',

  /** Regional rail route paths */
  RAIL_ROUTES:
    'https://services2.arcgis.com/9U43PSoL47wawX5S/ArcGIS/rest/services/Regional_Rail_Lines/FeatureServer/0/query',
} as const;

/**
 * Default headers sent with SEPTA API requests
 */
export const SEPTA_API_HEADERS = {
  'User-Agent': 'SEPTA-Transit-App/1.0',
} as const;

/**
 * Request timeout settings (in milliseconds)
 */
export const API_TIMEOUTS = {
  /** Default timeout for API requests */
  DEFAULT: 10000, // 10 seconds

  /** Timeout for geometry requests (can be larger) */
  GEOMETRY: 15000, // 15 seconds
} as const;

/**
 * Polling intervals for real-time data (in milliseconds)
 */
export const POLLING_INTERVALS = {
  /** How often to refresh vehicle positions */
  VEHICLE_UPDATES: 5000, // 5 seconds

  /** How often to check location (if enabled) */
  LOCATION_UPDATES: 1000, // 1 second
} as const;
