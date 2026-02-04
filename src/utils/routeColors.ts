/**
 * Route color utilities for SEPTA transit visualization.
 *
 * Provides color mappings and generation for bus routes, trolley lines,
 * and regional rail lines on the map.
 */

import { REGIONAL_RAIL_LINES, isRegionalRailRoute } from '@/constants/routes';

/**
 * Predefined color mappings for SEPTA routes.
 *
 * - Bus routes: Colorful, distinctive colors for easy identification
 * - Trolley routes: T-prefix routes with unique colors
 * - Regional Rail: Various shades of gray to distinguish from bus/trolley
 */
export const ROUTE_COLORS: { [key: string]: string } = {
  // Bus routes (colorful)
  '2': '#FF5722', '3': '#E91E63', '4': '#9C27B0', '5': '#673AB7',
  '6': '#3F51B5', '7': '#2196F3', '9': '#FF6B6B', '12': '#4ECDC4',
  '14': '#009688', '16': '#4CAF50', '17': '#8BC34A', '18': '#CDDC39',
  '20': '#FFEB3B', '21': '#45B7D1', '22': '#FF9800', '23': '#FF5722',
  '24': '#795548', '25': '#607D8B', '26': '#F44336', '27': '#E91E63',
  '28': '#9C27B0', '29': '#FF8C42', '32': '#3F51B5', '33': '#2196F3',
  '37': '#00BCD4', '38': '#009688', '39': '#4CAF50', '40': '#8BC34A',
  '41': '#CDDC39', '42': '#96CEB4', '43': '#FF9800', '44': '#FF5722',
  '45': '#795548', '46': '#607D8B', '47': '#FFEAA7', '48': '#E91E63',
  '49': '#9C27B0', '51': '#673AB7', '52': '#3F51B5', '53': '#2196F3',
  '54': '#00BCD4', '55': '#009688', '56': '#4CAF50', '57': '#DDA0DD',
  '58': '#CDDC39', '59': '#FFEB3B', '60': '#FF9800', '61': '#FF5722',
  '63': '#607D8B', '64': '#F44336', '65': '#E91E63', '66': '#9C27B0',
  '67': '#673AB7', '68': '#3F51B5', '70': '#2196F3', '71': '#00BCD4',
  '75': '#009688', '77': '#4CAF50', '79': '#8BC34A', '81': '#CDDC39',
  '82': '#FFEB3B', '84': '#FF9800', '93': '#FF5722', '94': '#795548',
  '96': '#607D8B', '97': '#F44336', '98': '#E91E63', '99': '#9C27B0',
  'K': '#FF6B35',

  // Trolley routes (distinctive colors)
  'T1': '#00BCD4', 'T2': '#FF9800', 'T3': '#4CAF50', 'T4': '#9C27B0', 'T5': '#F44336',
  'T101': '#795548', 'T102': '#607D8B',

  // Regional Rail lines (various shades of gray)
  [REGIONAL_RAIL_LINES.AIRPORT_LINE]: '#909090',
  [REGIONAL_RAIL_LINES.CHESTNUT_HILL_EAST]: '#696969',
  [REGIONAL_RAIL_LINES.CHESTNUT_HILL_WEST]: '#555555',
  [REGIONAL_RAIL_LINES.CYNWYD]: '#A9A9A9',
  [REGIONAL_RAIL_LINES.FOX_CHASE]: '#778899',
  [REGIONAL_RAIL_LINES.LANSDALE_DOYLESTOWN]: '#708090',
  [REGIONAL_RAIL_LINES.MEDIA_WAWA]: '#2F4F4F',
  [REGIONAL_RAIL_LINES.NORRISTOWN]: '#7A7A7A',
  [REGIONAL_RAIL_LINES.PAOLI_THORNDALE]: '#808080',
  [REGIONAL_RAIL_LINES.TRENTON]: '#6B6B6B',
  [REGIONAL_RAIL_LINES.WARMINSTER]: '#4F4F4F',
  [REGIONAL_RAIL_LINES.WEST_TRENTON]: '#5A5A5A',
  [REGIONAL_RAIL_LINES.WILMINGTON_NEWARK]: '#737373'
};

/**
 * Generates a simple hash from a string.
 * Used to consistently assign colors to routes not in the predefined map.
 *
 * @param str - String to hash (route number/name)
 * @returns Numeric hash value
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return hash;
}

/**
 * Generates a color for routes not in the predefined ROUTE_COLORS map.
 *
 * Color selection logic:
 * - Regional Rail: Gray shades (to distinguish from colorful bus routes)
 * - Trolley (T-prefix): Distinctive color palette
 * - Bus routes: Colorful HSL colors generated from route number
 *
 * @param route - Route number or name (e.g., "17", "T101", "Airport Line")
 * @returns CSS color string (hex or HSL)
 *
 * @example
 * ```ts
 * generateRouteColor("17")         // Returns predefined color or generated HSL
 * generateRouteColor("Airport Line") // Returns gray shade
 * generateRouteColor("T101")       // Returns predefined trolley color
 * ```
 */
export function generateRouteColor(route: string): string {
  // Return predefined color if it exists
  if (ROUTE_COLORS[route]) {
    return ROUTE_COLORS[route];
  }

  // Regional Rail routes - various shades of gray
  if (isRegionalRailRoute(route)) {
    const grayShades = [
      '#808080', '#696969', '#555555', '#A9A9A9',
      '#778899', '#708090', '#2F4F4F'
    ];
    const hash = simpleHash(route);
    return grayShades[Math.abs(hash) % grayShades.length];
  }

  // Trolley routes (T prefix) - distinctive colors
  if (route.startsWith('T')) {
    const trolleyColors = [
      '#00BCD4', '#FF9800', '#4CAF50', '#9C27B0',
      '#F44336', '#795548', '#607D8B'
    ];
    const hash = simpleHash(route);
    return trolleyColors[Math.abs(hash) % trolleyColors.length];
  }

  // Bus routes - generate colorful hues using HSL
  // This ensures consistent colors for the same route across sessions
  const hash = simpleHash(route);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 50%)`;
}
