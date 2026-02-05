/**
 * API Route: All Available Routes
 *
 * Aggregates and returns a complete list of all SEPTA routes available
 * in the application, including:
 * - Bus routes (from ArcGIS Feature Server)
 * - Trolley routes (both from API and hardcoded)
 * - Regional Rail lines (hardcoded)
 *
 * The routes are sorted by type (bus, trolley, rail) and then by route number.
 *
 * @endpoint GET /api/all-routes
 * @returns Sorted, deduplicated list of all available routes
 *
 * @example
 * GET /api/all-routes
 * Returns: { routes: [{ number: "9", name: "Route 9", type: "bus" }, ...] }
 */

import { createSuccessResponse, handleApiError } from '@/lib/api/apiResponse';
import { ARCGIS_ENDPOINTS } from '@/config/api.config';
import { REGIONAL_RAIL_LINES } from '@/constants/routes';
import type { RouteInfo, ArcGISFeatureCollection, ArcGISRouteAttributes } from '@/types/septa-api.types';

/**
 * Route type identifier based on route number pattern
 */
const ROUTE_TYPE_ORDER = { bus: 1, trolley: 2, rail: 3 } as const;

/**
 * Determines route type based on the route number/abbreviation
 *
 * @param lineAbbr - Route number/abbreviation (e.g., "17", "T101")
 * @returns Route type: "bus", "trolley", or "rail"
 */
function determineRouteType(lineAbbr: string): 'bus' | 'trolley' | 'rail' {
  return lineAbbr.startsWith('T') ? 'trolley' : 'bus';
}

/**
 * Fetches bus and trolley routes from SEPTA's ArcGIS Feature Server
 *
 * @returns Array of bus/trolley route info, or empty array on failure
 */
async function fetchBusRoutes(): Promise<RouteInfo[]> {
  try {
    const queryUrl = new URL(ARCGIS_ENDPOINTS.TRANSIT_ROUTES);
    queryUrl.searchParams.set('where', '1=1'); // Get all routes
    queryUrl.searchParams.set('outFields', 'LineAbbr,LineName');
    queryUrl.searchParams.set('returnGeometry', 'false');
    queryUrl.searchParams.set('f', 'json');

    const response = await fetch(queryUrl.toString());

    if (!response.ok) {
      console.warn('Failed to fetch bus routes from ArcGIS');
      return [];
    }

    const data: ArcGISFeatureCollection<ArcGISRouteAttributes> = await response.json();

    return (
      data.features
        ?.map((feature) => ({
          number: feature.attributes?.LineAbbr || '',
          name: feature.attributes?.LineName || '',
          type: determineRouteType(feature.attributes?.LineAbbr || ''),
        }))
        // Filter out entries with missing required fields
        .filter((route) => route.number && route.name) || []
    );
  } catch (error) {
    console.warn('Error fetching bus routes:', error);
    return [];
  }
}

/**
 * Gets the hardcoded list of regional rail lines
 *
 * @returns Array of regional rail route info
 */
function getRegionalRailRoutes(): RouteInfo[] {
  return [
    { number: REGIONAL_RAIL_LINES.AIRPORT_LINE, name: REGIONAL_RAIL_LINES.AIRPORT_LINE, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.CHESTNUT_HILL_EAST, name: REGIONAL_RAIL_LINES.CHESTNUT_HILL_EAST, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.CHESTNUT_HILL_WEST, name: REGIONAL_RAIL_LINES.CHESTNUT_HILL_WEST, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.CYNWYD, name: `${REGIONAL_RAIL_LINES.CYNWYD} Line`, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.FOX_CHASE, name: `${REGIONAL_RAIL_LINES.FOX_CHASE} Line`, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.LANSDALE_DOYLESTOWN, name: `${REGIONAL_RAIL_LINES.LANSDALE_DOYLESTOWN} Line`, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.MEDIA_WAWA, name: `${REGIONAL_RAIL_LINES.MEDIA_WAWA} Line`, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.NORRISTOWN, name: `${REGIONAL_RAIL_LINES.NORRISTOWN} Line`, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.PAOLI_THORNDALE, name: `${REGIONAL_RAIL_LINES.PAOLI_THORNDALE} Line`, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.TRENTON, name: `${REGIONAL_RAIL_LINES.TRENTON} Line`, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.WARMINSTER, name: `${REGIONAL_RAIL_LINES.WARMINSTER} Line`, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.WEST_TRENTON, name: `${REGIONAL_RAIL_LINES.WEST_TRENTON} Line`, type: 'rail' },
    { number: REGIONAL_RAIL_LINES.WILMINGTON_NEWARK, name: `${REGIONAL_RAIL_LINES.WILMINGTON_NEWARK} Line`, type: 'rail' },
  ];
}

/**
 * Gets the hardcoded list of trolley lines
 * (These are also in the ArcGIS data, but hardcoded as a fallback)
 *
 * @returns Array of trolley route info
 */
function getTrolleyRoutes(): RouteInfo[] {
  return [
    { number: 'T101', name: 'Media/102nd Street Line', type: 'trolley' },
    { number: 'T102', name: 'Sharon Hill/102nd Street Line', type: 'trolley' },
  ];
}

/**
 * Sorts routes by type (bus → trolley → rail), then numerically within each type
 *
 * @param routes - Unsorted array of routes
 * @returns Sorted array of routes
 */
function sortRoutes(routes: RouteInfo[]): RouteInfo[] {
  return routes.sort((a, b) => {
    // First, sort by type
    if (a.type !== b.type) {
      return ROUTE_TYPE_ORDER[a.type] - ROUTE_TYPE_ORDER[b.type];
    }

    // Within same type, sort bus routes numerically
    if (a.type === 'bus') {
      const aNum = parseInt(a.number, 10);
      const bNum = parseInt(b.number, 10);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return aNum - bNum;
      }
    }

    // For other types or non-numeric routes, sort alphabetically
    return a.number.localeCompare(b.number);
  });
}

/**
 * Removes duplicate routes based on route number
 *
 * @param routes - Array that may contain duplicates
 * @returns Deduplicated array (keeps first occurrence)
 */
function deduplicateRoutes(routes: RouteInfo[]): RouteInfo[] {
  return routes.filter(
    (route, index, self) => index === self.findIndex((r) => r.number === route.number)
  );
}

export async function GET() {
  try {
    const allRoutes: RouteInfo[] = [];

    // Fetch bus and trolley routes from ArcGIS
    const busRoutes = await fetchBusRoutes();
    allRoutes.push(...busRoutes);

    // Add regional rail lines (hardcoded)
    const railRoutes = getRegionalRailRoutes();
    allRoutes.push(...railRoutes);

    // Add trolley lines (hardcoded as fallback)
    const trolleyRoutes = getTrolleyRoutes();
    allRoutes.push(...trolleyRoutes);

    // Sort and deduplicate the combined list
    const sortedRoutes = sortRoutes(allRoutes);
    const uniqueRoutes = deduplicateRoutes(sortedRoutes);

    return createSuccessResponse({ routes: uniqueRoutes });
  } catch (error) {
    return handleApiError('fetch route list', error);
  }
}
