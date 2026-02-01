/**
 * API Route: Regional Rail Route Geometry
 *
 * Fetches route path geometry (GeoJSON) from SEPTA's ArcGIS Feature Server
 * for one or more regional rail lines. Handles name mapping between the
 * application's route names and SEPTA's official API naming.
 *
 * @endpoint GET /api/rail-geometry?routes={line1,line2,...}
 * @param routes - Comma-separated rail line names (e.g., "Airport Line,Norristown")
 * @returns GeoJSON FeatureCollection with LineString geometries
 *
 * @example
 * GET /api/rail-geometry?routes=Airport Line,Norristown
 * Returns route geometry for Airport Line and Norristown Line
 *
 * @note Route names are automatically mapped to SEPTA's naming convention
 * (e.g., "Norristown" → "Manayunk/Norristown")
 */

import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/api/apiResponse';
import { ARCGIS_ENDPOINTS } from '@/config/api.config';
import {
  SEPTA_LINE_NAME_MAPPING,
  SEPTA_TO_OUR_LINE_NAME_MAPPING,
} from '@/constants/routes';
import type {
  ArcGISFeatureCollection,
  ArcGISRailAttributes,
  ArcGISFeature,
} from '@/types/septa-api.types';

/**
 * Transforms rail geometry features from SEPTA's naming to our app's naming
 *
 * @param features - Raw features from ArcGIS with SEPTA route names
 * @returns Transformed features with our application's route names
 */
function transformRailFeatures(
  features: ArcGISFeature<ArcGISRailAttributes>[]
): ArcGISFeature<{ LineAbbr: string; LineName: string; Miles: number }>[] {
  return features.map((feature) => {
    const septaRouteName = feature.properties?.Route_Name || '';

    // Map SEPTA's route name back to our expected format
    // (e.g., "Manayunk/Norristown" → "Norristown")
    const ourRouteName =
      SEPTA_TO_OUR_LINE_NAME_MAPPING[septaRouteName] || septaRouteName;

    return {
      type: 'Feature' as const,
      properties: {
        LineAbbr: ourRouteName,
        LineName: ourRouteName,
        Miles: feature.properties?.Miles || 0,
      },
      geometry: feature.geometry,
    };
  });
}

/**
 * Builds an ArcGIS WHERE clause for querying specific rail lines
 * with proper name mapping
 *
 * @param railLines - Array of rail line names (in our app's format)
 * @returns SQL-style WHERE clause with SEPTA's naming
 */
function buildRailWhereClause(railLines: string[]): string {
  return railLines
    .map((line) => {
      // Map our line names to SEPTA's official naming convention
      const mappedLineName = SEPTA_LINE_NAME_MAPPING[line] || line;
      return `Route_Name='${mappedLineName}'`;
    })
    .join(' OR ');
}

export async function GET(request: NextRequest) {
  // Extract and validate routes parameter
  const { searchParams } = new URL(request.url);
  const routes = searchParams.get('routes');

  if (!routes) {
    return createErrorResponse('Routes parameter is required', 400);
  }

  // Parse comma-separated rail line names and trim whitespace
  const railLines = routes.split(',').map((r) => r.trim());

  try {
    // Build the ArcGIS query URL
    const whereClause = buildRailWhereClause(railLines);
    const queryUrl = new URL(ARCGIS_ENDPOINTS.RAIL_ROUTES);

    queryUrl.searchParams.set('where', whereClause);
    queryUrl.searchParams.set('outFields', 'Route_Name,Miles');
    queryUrl.searchParams.set('returnGeometry', 'true');
    queryUrl.searchParams.set('f', 'geojson');

    // Fetch route geometry from ArcGIS
    const response = await fetch(queryUrl.toString());

    if (!response.ok) {
      throw new Error(`SEPTA Regional Rail API responded with status: ${response.status}`);
    }

    const data: ArcGISFeatureCollection<ArcGISRailAttributes> = await response.json();

    // Transform the response to use our route naming convention
    const transformedFeatures = transformRailFeatures(data.features || []);

    const geoJsonResponse = {
      type: 'FeatureCollection' as const,
      features: transformedFeatures,
    };

    return createSuccessResponse(geoJsonResponse);
  } catch (error) {
    return handleApiError('fetch rail geometry data', error);
  }
}
