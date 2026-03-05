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

/**
 * Smooths a polyline using Chaikin's corner-cutting algorithm.
 *
 * Each iteration replaces every segment with two shorter segments whose
 * endpoints sit at the 25% and 75% positions of the original segment.
 * The first and last points are kept fixed so the line endpoints don't move.
 *
 * Cutting at 25%/75% (rather than 50%/50%) preserves sharper corners, making
 * it well-suited for transit routes where turns matter but minor bumps should
 * be ironed out.
 *
 * @param coords     - Coordinate array in [lat, lng] format
 * @param iterations - Number of subdivision passes (default 2)
 */
export function chaikinSmooth(
  coords: [number, number][],
  iterations = 3,
): [number, number][] {
  if (coords.length < 3) return coords;

  let pts = coords;
  for (let iter = 0; iter < iterations; iter++) {
    const next: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [lat0, lng0] = pts[i];
      const [lat1, lng1] = pts[i + 1];
      next.push([0.75 * lat0 + 0.25 * lat1, 0.75 * lng0 + 0.25 * lng1]);
      next.push([0.25 * lat0 + 0.75 * lat1, 0.25 * lng0 + 0.75 * lng1]);
    }
    next.push(pts[pts.length - 1]);
    pts = next;
  }
  return pts;
}
