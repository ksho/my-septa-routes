/**
 * Helper utilities for map operations and coordinate transformations.
 */

/**
 * Route geometry can be either LineString or MultiLineString
 */
export interface RouteGeometry {
  type: 'LineString' | 'MultiLineString';
  coordinates: [number, number][] | [number, number][][];
}

/**
 * Converts GeoJSON coordinates to Leaflet coordinates.
 *
 * GeoJSON uses [longitude, latitude] format, while Leaflet uses [latitude, longitude].
 * This function handles both LineString and MultiLineString geometries.
 *
 * @param geometry - GeoJSON geometry object
 * @returns Array of Leaflet coordinate arrays [lat, lng][]
 *
 * @example
 * ```ts
 * // LineString
 * const coords = convertGeoJSONToLeaflet({
 *   type: 'LineString',
 *   coordinates: [[-75.164, 39.952], [-75.165, 39.953]]
 * });
 * // Returns: [[39.952, -75.164], [39.953, -75.165]]
 *
 * // MultiLineString
 * const coords = convertGeoJSONToLeaflet({
 *   type: 'MultiLineString',
 *   coordinates: [[[-75.164, 39.952]], [[-75.165, 39.953]]]
 * });
 * // Returns: [[39.952, -75.164], [39.953, -75.165]]
 * ```
 */
export function convertGeoJSONToLeaflet(
  geometry: RouteGeometry
): [number, number][] {
  if (geometry.type === 'MultiLineString') {
    // Flatten MultiLineString coordinates
    return (geometry.coordinates as [number, number][][])
      .flat()
      .map(([lng, lat]) => [lat, lng] as [number, number]);
  } else {
    // LineString coordinates
    return (geometry.coordinates as [number, number][]).map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );
  }
}

/**
 * Formats a route number for display in the URL
 *
 * @param route - Route number or name
 * @returns URL-safe route string
 */
export function formatRouteForURL(route: string): string {
  return encodeURIComponent(route);
}
