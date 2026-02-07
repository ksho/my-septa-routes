/**
 * Custom Leaflet icon creation for SEPTA routes.
 *
 * Creates colored, labeled markers that distinguish between different
 * route types (bus, trolley, regional rail) with appropriate styling.
 */

import L from 'leaflet';
import { isRegionalRailRoute, isSubwayRoute } from '@/constants/routes';
import { generateRouteColor } from './routeColors';

/**
 * Icon sizing configuration for different route types
 */
const ICON_SIZES = {
  /** Standard size for bus and trolley circular markers */
  BUS_TROLLEY: {
    width: 24,
    height: 24,
    fontSize: '11px',
  },
  /** Variable size for regional rail rectangular markers */
  RAIL: {
    minWidth: 60,
    height: 20,
    fontSize: '9px',
    /** Approximate pixels per character for width calculation */
    charWidth: 7,
    /** Padding added to text width */
    padding: 16,
  },
  /** Size for subway rectangular markers (similar to rail) */
  SUBWAY: {
    minWidth: 50,
    height: 20,
    fontSize: '10px',
    charWidth: 8,
    padding: 12,
  },
} as const;

/**
 * Creates a custom Leaflet DivIcon for a route marker.
 *
 * Visual characteristics by route type:
 * - **Bus/Trolley**: Circular markers (24x24px) with route number
 * - **Regional Rail**: Rectangular markers with variable width based on name length
 * - **Subway**: Rectangular markers (similar to rail) with blue colors
 * - All markers have colored backgrounds, white text, and drop shadows
 *
 * @param route - Route number or name (e.g., "17", "T101", "BSL", "Airport Line")
 * @returns Leaflet DivIcon with custom HTML styling
 *
 * @example
 * ```ts
 * const icon = createRouteIcon("17");
 * L.marker([lat, lng], { icon }).addTo(map);
 * ```
 */
export function createRouteIcon(route: string): L.DivIcon {
  const color = generateRouteColor(route);
  const isRail = isRegionalRailRoute(route);
  const isSubway = isSubwayRoute(route);

  // Determine display text - truncate long names
  let displayText = route;
  if ((isRail || isSubway) && displayText.length > 12) {
    displayText = displayText.substring(0, 10) + '...';
  }

  // Calculate dimensions based on route type
  let width: number;
  let height: number;
  let iconSize: [number, number];
  let iconAnchor: [number, number];
  let fontSize: string;
  let borderRadius: string;
  let popupAnchor: [number, number];

  if (isRail) {
    // Regional Rail: Rectangular markers with variable width
    width = Math.max(
      ICON_SIZES.RAIL.minWidth,
      displayText.length * ICON_SIZES.RAIL.charWidth + ICON_SIZES.RAIL.padding
    );
    height = ICON_SIZES.RAIL.height;
    fontSize = ICON_SIZES.RAIL.fontSize;
    borderRadius = '10px';
    iconSize = [width, height];
    iconAnchor = [width / 2, height / 2];
    popupAnchor = [0, -10];
  } else if (isSubway) {
    // Subway: Rectangular markers (similar to rail)
    width = Math.max(
      ICON_SIZES.SUBWAY.minWidth,
      displayText.length * ICON_SIZES.SUBWAY.charWidth + ICON_SIZES.SUBWAY.padding
    );
    height = ICON_SIZES.SUBWAY.height;
    fontSize = ICON_SIZES.SUBWAY.fontSize;
    borderRadius = '10px';
    iconSize = [width, height];
    iconAnchor = [width / 2, height / 2];
    popupAnchor = [0, -10];
  } else {
    // Bus/Trolley: Circular markers with fixed size
    width = ICON_SIZES.BUS_TROLLEY.width;
    height = ICON_SIZES.BUS_TROLLEY.height;
    fontSize = ICON_SIZES.BUS_TROLLEY.fontSize;
    borderRadius = '50%';
    iconSize = [width, height];
    iconAnchor = [width / 2, height / 2];
    popupAnchor = [0, -12];
  }

  return L.divIcon({
    html: `
      <div class="route-marker" style="
        background-color: ${color};
        width: ${width}px;
        height: ${height}px;
        border-radius: ${borderRadius};
        border: 2px solid rgba(255,255,255,0.8);
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
        opacity: 0.85;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: Arial, sans-serif;
        font-size: ${fontSize};
        font-weight: bold;
        color: white;
        text-align: center;
        line-height: 1;
        white-space: nowrap;
        text-shadow: 1px 1px 1px rgba(0,0,0,0.6);
      ">${displayText}</div>
    `,
    className: '',
    iconSize,
    iconAnchor,
    popupAnchor,
  });
}
