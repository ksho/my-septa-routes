/**
 * API Route: Regional Rail Vehicle Positions
 *
 * Fetches real-time train positions from SEPTA's TrainView API
 * and filters by the requested rail line.
 *
 * @endpoint GET /api/rail?route={lineName}
 * @param route - Rail line name to filter (e.g., "Airport", "Norristown")
 * @returns Normalized vehicle data for trains on the specified line
 *
 * @example
 * GET /api/rail?route=Airport
 * Returns all trains currently operating on the Airport Line
 */

import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/api/apiResponse';
import { transformTrainResponse } from '@/lib/transformers/trainDataTransformer';
import { SEPTA_API_ENDPOINTS } from '@/config/api.config';
import type { SeptaTrainViewResponse } from '@/types/septa-api.types';

export async function GET(request: Request) {
  // Extract and validate route parameter
  const { searchParams } = new URL(request.url);
  const route = searchParams.get('route');

  if (!route) {
    return createErrorResponse('Route parameter is required', 400);
  }

  try {
    // Fetch real-time train data from SEPTA TrainView API
    const response = await fetch(SEPTA_API_ENDPOINTS.TRAIN_VIEW);

    if (!response.ok) {
      throw new Error(`SEPTA TrainView API responded with status: ${response.status}`);
    }

    // Parse the raw train data
    const trains: SeptaTrainViewResponse = await response.json();

    // Transform and filter trains for the requested line
    const vehicleData = transformTrainResponse(trains, route);

    return createSuccessResponse(vehicleData);
  } catch (error) {
    return handleApiError('fetch Regional Rail data', error);
  }
}
