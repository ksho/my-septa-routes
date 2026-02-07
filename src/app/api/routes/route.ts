/**
 * API Route: Bus and Trolley Route Geometry
 *
 * Fetches route path geometry (GeoJSON) from SEPTA's ArcGIS Feature Server
 * for one or more bus/trolley routes. Returns the geographic paths that
 * routes follow, used to draw route lines on the map.
 *
 * @endpoint GET /api/routes?routes={route1,route2,...}
 * @param routes - Comma-separated route numbers (e.g., "17,42,T101")
 * @returns GeoJSON FeatureCollection with LineString geometries
 *
 * @example
 * GET /api/routes?routes=17,42
 * Returns route geometry for Routes 17 and 42
 */

import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/api/apiResponse';
import { ARCGIS_ENDPOINTS } from '@/config/api.config';
import type { ArcGISFeatureCollection, ArcGISRouteAttributes } from '@/types/septa-api.types';

/**
 * Builds an ArcGIS WHERE clause for querying specific routes
 *
 * @param routeNumbers - Array of route numbers to query
 * @returns SQL-style WHERE clause (e.g., "LineAbbr='17' OR LineAbbr='42'")
 */
function buildWhereClause(routeNumbers: string[]): string {
  return routeNumbers.map((route) => `LineAbbr='${route}'`).join(' OR ');
}

export async function GET(request: NextRequest) {
  // Extract and validate routes parameter
  const { searchParams } = new URL(request.url);
  const routes = searchParams.get('routes');

  if (!routes) {
    return createErrorResponse('Routes parameter is required', 400);
  }

  // Parse comma-separated route numbers and trim whitespace
  const routeNumbers = routes.split(',').map((r) => r.trim());

  try {
    // Build the ArcGIS query URL
    const whereClause = buildWhereClause(routeNumbers);
    const queryUrl = new URL(ARCGIS_ENDPOINTS.TRANSIT_ROUTES);

    queryUrl.searchParams.set('where', whereClause);
    queryUrl.searchParams.set('outFields', 'LineAbbr,LineName,tpField020,tpField021');
    queryUrl.searchParams.set('returnGeometry', 'true');
    queryUrl.searchParams.set('f', 'geojson');

    // Fetch route geometry from ArcGIS
    const response = await fetch(queryUrl.toString());

    if (!response.ok) {
      throw new Error(`SEPTA ArcGIS API responded with status: ${response.status}`);
    }

    const data: ArcGISFeatureCollection<ArcGISRouteAttributes> = await response.json();

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError('fetch route geometry data', error);
  }
}
