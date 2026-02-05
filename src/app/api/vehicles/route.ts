/**
 * API Route: Bulk Vehicle Positions
 *
 * Optimized endpoint that fetches real-time positions for multiple routes
 * in a single API call, significantly reducing Vercel function invocations.
 *
 * @endpoint GET /api/vehicles?routes={route1,route2,route3}
 * @param routes - Comma-separated list of route numbers/names
 * @returns Combined vehicle data for all requested routes
 *
 * @example
 * GET /api/vehicles?routes=17,42,T101,Airport Line,Norristown
 * Returns vehicles for Route 17, Route 42, Trolley 101, Airport Line, and Norristown Line
 *
 * @optimization
 * Before: N separate API calls (1 per route) = N Vercel function invocations
 * After: 1 API call for all routes = 1 Vercel function invocation
 * Reduction: ~85% fewer function invocations for typical use (7 routes)
 */

import { NextRequest } from 'next/server';
import { createErrorResponse, createSuccessResponse, handleApiError } from '@/lib/api/apiResponse';
import { SEPTA_API_ENDPOINTS } from '@/config/api.config';
import { isRegionalRailRoute } from '@/constants/routes';
import { transformTrainResponse } from '@/lib/transformers/trainDataTransformer';
import type {
  SeptaTransitViewAllResponse,
  SeptaTrainViewResponse,
  SeptaTransitViewBus,
  NormalizedVehicle,
} from '@/types/septa-api.types';

export async function GET(request: NextRequest) {
  // Extract and validate routes parameter
  const { searchParams } = new URL(request.url);
  const routesParam = searchParams.get('routes');

  if (!routesParam) {
    return createErrorResponse('Routes parameter is required', 400);
  }

  // Parse comma-separated routes
  const routes = routesParam
    .split(',')
    .map((r) => r.trim())
    .filter((r) => r.length > 0);

  if (routes.length === 0) {
    return createErrorResponse('At least one route must be specified', 400);
  }

  try {
    const allVehicles: NormalizedVehicle[] = [];

    // Separate routes by type for optimized fetching
    const busAndTrolleyRoutes = routes.filter((route) => !isRegionalRailRoute(route));
    const railRoutes = routes.filter((route) => isRegionalRailRoute(route));

    // Fetch bus and trolley data in bulk (if any)
    if (busAndTrolleyRoutes.length > 0) {
      try {
        // Use TransitViewAll to get all buses and trolleys at once
        // Endpoint: https://www3.septa.org/hackathon/TransitViewAll/
        const transitViewAllUrl = 'https://www3.septa.org/hackathon/TransitViewAll/';
        const response = await fetch(transitViewAllUrl, {
          headers: {
            'User-Agent': 'SEPTA-Transit-App/1.0',
          },
        });

        if (response.ok) {
          const allTransitData: SeptaTransitViewAllResponse = await response.json();

          // The response has format: { routes: [{ "1": [...buses], "13": [...buses] }] }
          if (allTransitData.routes && allTransitData.routes.length > 0) {
            const routesObject = allTransitData.routes[0];

            for (const route of busAndTrolleyRoutes) {
              // Handle trolley routes (remove T prefix for API)
              const apiRoute = route.startsWith('T') ? route.substring(1) : route;

              // Get buses for this route
              const buses = routesObject[apiRoute];
              if (buses && Array.isArray(buses)) {
                // Transform bus data to normalized format
                const normalizedBuses = buses
                  .filter((bus: SeptaTransitViewBus) => bus.lat && bus.lng)
                  .map((bus: SeptaTransitViewBus) => ({
                    lat: parseFloat(bus.lat || '0'),
                    lng: parseFloat(bus.lng || '0'),
                    label: route, // Use route number for marker label
                    VehicleID: bus.VehicleID || '',
                    Direction: bus.Direction || '',
                    destination: bus.destination || '',
                    late: parseInt(bus.late as string, 10) || 0,
                  }));

                allVehicles.push(...normalizedBuses);
              }
            }
          }
        } else {
          console.warn(`TransitViewAll API failed: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching bus/trolley data:', error);
        // Continue with rail data even if bus/trolley fails
      }
    }

    // Fetch regional rail data in bulk (if any)
    if (railRoutes.length > 0) {
      try {
        // TrainView returns all trains - we filter on our side
        const response = await fetch(SEPTA_API_ENDPOINTS.TRAIN_VIEW);

        if (response.ok) {
          const allTrains: SeptaTrainViewResponse = await response.json();

          // Transform and filter for each requested rail line
          for (const route of railRoutes) {
            const vehicleData = transformTrainResponse(allTrains, route);
            if (vehicleData.bus && Array.isArray(vehicleData.bus)) {
              allVehicles.push(...vehicleData.bus);
            }
          }
        } else {
          console.warn(`TrainView API failed: ${response.status}`);
        }
      } catch (error) {
        console.error('Error fetching rail data:', error);
        // Continue even if rail data fails
      }
    }

    // Return combined results in same format as individual endpoints
    return createSuccessResponse({ bus: allVehicles });
  } catch (error) {
    return handleApiError('fetch bulk vehicle data', error);
  }
}
