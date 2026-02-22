/**
 * API Route: Nearby Routes Discovery
 *
 * Fetches SEPTA routes running within a specified distance of a point
 * using ArcGIS spatial queries. Queries both bus/trolley and regional rail
 * route geometries in parallel.
 *
 * @endpoint GET /api/nearby-routes?lat={latitude}&lng={longitude}&distance={miles}
 * @param lat - Latitude of the center point
 * @param lng - Longitude of the center point
 * @param distance - Search radius in miles (default: 0.25)
 * @returns GeoJSON FeatureCollection with LineAbbr and LineName properties
 *
 * @example
 * GET /api/nearby-routes?lat=39.9526&lng=-75.1652&distance=0.25
 * Returns all routes within 0.25 miles of Philadelphia City Hall
 */

import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/api/apiResponse';
import { ARCGIS_ENDPOINTS } from '@/config/api.config';
import { SEPTA_TO_OUR_LINE_NAME_MAPPING } from '@/constants/routes';
import type {
  ArcGISFeatureCollection,
  ArcGISRailAttributes,
  ArcGISRouteAttributes,
  ArcGISFeature,
} from '@/types/septa-api.types';

/**
 * Transforms bus/trolley features to standardized format
 */
function transformTransitFeatures(
  features: ArcGISFeature<ArcGISRouteAttributes>[]
): ArcGISFeature<{ LineAbbr: string; LineName: string }>[] {
  return features.map((feature) => ({
    type: 'Feature' as const,
    properties: {
      LineAbbr: feature.properties?.LineAbbr || '',
      LineName: feature.properties?.LineName || '',
    },
    geometry: feature.geometry,
  }));
}

/**
 * Transforms rail features from SEPTA's naming to our app's naming
 */
function transformRailFeatures(
  features: ArcGISFeature<ArcGISRailAttributes>[]
): ArcGISFeature<{ LineAbbr: string; LineName: string }>[] {
  return features.map((feature) => {
    const septaRouteName = feature.properties?.Route_Name || '';
    const ourRouteName =
      SEPTA_TO_OUR_LINE_NAME_MAPPING[septaRouteName] || septaRouteName;

    return {
      type: 'Feature' as const,
      properties: {
        LineAbbr: ourRouteName,
        LineName: ourRouteName,
      },
      geometry: feature.geometry,
    };
  });
}

/**
 * Queries ArcGIS Feature Server for routes near a point
 */
async function queryNearbyRoutes(
  endpoint: string,
  lat: number,
  lng: number,
  distance: number
): Promise<ArcGISFeatureCollection> {
  const queryUrl = new URL(endpoint);

  // Spatial query parameters for ArcGIS
  queryUrl.searchParams.set('geometry', `${lng},${lat}`);
  queryUrl.searchParams.set('geometryType', 'esriGeometryPoint');
  queryUrl.searchParams.set('spatialRel', 'esriSpatialRelIntersects');
  queryUrl.searchParams.set('distance', distance.toString());
  queryUrl.searchParams.set('units', 'esriSRUnit_StatuteMile');
  queryUrl.searchParams.set('returnGeometry', 'true');
  queryUrl.searchParams.set('outFields', '*');
  queryUrl.searchParams.set('f', 'geojson');

  const response = await fetch(queryUrl.toString());

  if (!response.ok) {
    throw new Error(`ArcGIS API responded with status: ${response.status}`);
  }

  return response.json();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  // Extract and validate parameters
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');
  const distanceParam = searchParams.get('distance');

  if (!latParam || !lngParam) {
    return createErrorResponse('lat and lng parameters are required', 400);
  }

  const lat = parseFloat(latParam);
  const lng = parseFloat(lngParam);
  const distance = distanceParam ? parseFloat(distanceParam) : 0.25;

  // Validate numeric values
  if (isNaN(lat) || isNaN(lng) || isNaN(distance)) {
    return createErrorResponse('Invalid numeric parameters', 400);
  }

  // Validate reasonable bounds
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return createErrorResponse('Coordinates out of valid range', 400);
  }

  if (distance <= 0 || distance > 5) {
    return createErrorResponse('Distance must be between 0 and 5 miles', 400);
  }

  try {
    // Query both bus/trolley and rail routes in parallel
    const [transitData, railData] = await Promise.all([
      queryNearbyRoutes(ARCGIS_ENDPOINTS.TRANSIT_ROUTES, lat, lng, distance),
      queryNearbyRoutes(ARCGIS_ENDPOINTS.RAIL_ROUTES, lat, lng, distance),
    ]);

    // Transform features to standardized format
    const transitFeatures = transformTransitFeatures(
      (transitData.features || []) as ArcGISFeature<ArcGISRouteAttributes>[]
    );
    const railFeatures = transformRailFeatures(
      (railData.features || []) as ArcGISFeature<ArcGISRailAttributes>[]
    );

    // Merge results
    const allFeatures = [...transitFeatures, ...railFeatures];

    const geoJsonResponse = {
      type: 'FeatureCollection' as const,
      features: allFeatures,
    };

    return createSuccessResponse(geoJsonResponse);
  } catch (error) {
    return handleApiError('query nearby routes', error);
  }
}
