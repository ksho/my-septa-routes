/**
 * API Route: SEPTA Service Alerts
 *
 * Fetches the GTFS-RT service alert feed and returns only the alerts
 * that affect the requested routes.
 *
 * @endpoint GET /api/alerts?routes={route1,route2}
 * @param routes - Comma-separated list of route numbers
 * @returns { alerts: Record<string, ParsedRouteAlert[]> }
 *
 * @example
 * GET /api/alerts?routes=44,17,T101
 * Returns alerts keyed by route number for any of those routes that have active alerts.
 */

import { NextRequest } from 'next/server';
import { createSuccessResponse, handleApiError } from '@/lib/api/apiResponse';
import { SEPTA_API_ENDPOINTS } from '@/config/api.config';
import { parseGtfsRtAlertFeed, filterAlertsByRoutes } from '@/lib/transformers/gtfsRtAlertTransformer';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const routesParam = searchParams.get('routes');

  if (!routesParam) {
    return createSuccessResponse({ alerts: {} });
  }

  const routes = routesParam
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  try {
    const response = await fetch(SEPTA_API_ENDPOINTS.GTFS_RT_ALERTS, {
      headers: { 'User-Agent': 'SEPTA-Transit-App/1.0' },
    });

    if (!response.ok) {
      console.warn(`GTFS-RT Alerts feed failed: ${response.status}`);
      return createSuccessResponse({ alerts: {} });
    }

    const text = await response.text();
    const allAlerts = parseGtfsRtAlertFeed(text);
    const alerts = filterAlertsByRoutes(allAlerts, routes);

    return createSuccessResponse({ alerts });
  } catch (error) {
    return handleApiError('fetch service alerts', error);
  }
}
