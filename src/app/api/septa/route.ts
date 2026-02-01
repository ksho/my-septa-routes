/**
 * API Route: Bus and Trolley Vehicle Positions
 *
 * Fetches real-time vehicle positions from SEPTA's TransitView API
 * for a specific bus or trolley route.
 *
 * @endpoint GET /api/septa?route={routeNumber}
 * @param route - Route number (e.g., "17", "42", "T101")
 * @returns Real-time vehicle position data for the specified route
 *
 * @example
 * GET /api/septa?route=17
 * Returns all buses currently operating on Route 17
 *
 * @example
 * GET /api/septa?route=T101
 * Returns all trolleys on the T101 line
 */

import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/api/apiResponse';
import { SEPTA_API_ENDPOINTS, SEPTA_API_HEADERS } from '@/config/api.config';
import type { SeptaTransitViewResponse } from '@/types/septa-api.types';

export async function GET(request: NextRequest) {
  // Extract and validate route parameter
  const { searchParams } = new URL(request.url);
  const route = searchParams.get('route');

  if (!route) {
    return createErrorResponse('Route parameter is required', 400);
  }

  try {
    // Fetch real-time vehicle data from SEPTA TransitView API
    const response = await fetch(
      `${SEPTA_API_ENDPOINTS.TRANSIT_VIEW}?route=${route}`,
      {
        headers: SEPTA_API_HEADERS,
      }
    );

    if (!response.ok) {
      throw new Error(`SEPTA API responded with status: ${response.status}`);
    }

    const data: SeptaTransitViewResponse = await response.json();

    return createSuccessResponse(data);
  } catch (error) {
    return handleApiError('fetch transit data', error);
  }
}
