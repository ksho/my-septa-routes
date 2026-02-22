/**
 * Geographic utility functions for location-based calculations
 */

interface LatLng {
  lat: number;
  lng: number;
}

/**
 * Calculate the great-circle distance between two points using the Haversine formula
 *
 * @param a - First point {lat, lng}
 * @param b - Second point {lat, lng}
 * @returns Distance in miles
 *
 * @example
 * ```ts
 * const distance = distanceMiles(
 *   { lat: 39.9526, lng: -75.1652 },
 *   { lat: 39.9500, lng: -75.1600 }
 * );
 * console.log(`Distance: ${distance.toFixed(2)} miles`);
 * ```
 */
export function distanceMiles(a: LatLng, b: LatLng): number {
  const R = 3958.8; // Earth's radius in miles
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.asin(Math.sqrt(h));

  return R * c;
}
