/**
 * Parses GTFS-RT service alert data from SEPTA's human-readable print.php feed.
 * Follows the same conventions as gtfsRtTransformer.ts (vehicle feed).
 * @see http://www3.septa.org/gtfsrt/septa-pa-us/Alert/print.php
 */

import type { GtfsRtAlertEntity, ParsedRouteAlert } from '@/types/septa-api.types';

/**
 * Extracts the first English translation text from a named field block.
 * Handles one level of nesting: fieldName { translation { text: "..." } }
 */
function extractTranslatedText(content: string, fieldName: string): string | undefined {
  const idx = content.indexOf(`${fieldName} {`);
  if (idx === -1) return undefined;
  // Scan up to 600 chars ahead — enough for a typical alert text block
  const section = content.substring(idx, idx + 600);
  return section.match(/\btext:\s*"([^"]+)"/)?.[1];
}

/**
 * Parses the human-readable GTFS-RT print.php alert feed into structured alert entities.
 *
 * @param htmlText - Raw HTML text from Alert/print.php endpoint
 * @returns Array of parsed alert entities
 */
export function parseGtfsRtAlertFeed(htmlText: string): GtfsRtAlertEntity[] {
  const alerts: GtfsRtAlertEntity[] = [];

  // Strip HTML tags; the feed wraps content in <pre> with <br> line breaks
  const content = htmlText
    .replace(/<br>/g, '\n')
    .replace(/<[^>]*>/g, '');

  // Each top-level alert is an "entity { ... }" block
  const entityBlocks = content.split(/entity\s*\{/).slice(1);

  for (const block of entityBlocks) {
    const entityId = block.match(/id:\s*"([^"]+)"/)?.[1] ?? '';

    // Only process blocks that contain an alert sub-message
    const alertBlockMatch = block.match(/alert\s*\{([\s\S]*)/);
    if (!alertBlockMatch) continue;

    const alertContent = alertBlockMatch[1];

    // --- informed_entity blocks (one per affected route/agency) ---
    const informedEntities: GtfsRtAlertEntity['alert']['informedEntities'] = [];
    const ieRegex = /informed_entity\s*\{([^}]*)\}/g;
    let ieMatch;
    while ((ieMatch = ieRegex.exec(alertContent)) !== null) {
      const routeId = ieMatch[1].match(/route_id:\s*"([^"]+)"/)?.[1];
      const agencyId = ieMatch[1].match(/agency_id:\s*"([^"]+)"/)?.[1];
      informedEntities.push({ routeId, agencyId });
    }

    // --- cause / effect enum values ---
    const cause = alertContent.match(/\bcause:\s*(\w+)/)?.[1];
    const effect = alertContent.match(/\beffect:\s*(\w+)/)?.[1];

    // --- translated text fields ---
    const headerText = extractTranslatedText(alertContent, 'header_text');
    const descriptionText = extractTranslatedText(alertContent, 'description_text');

    // --- active_period (first one wins) ---
    const apMatch = alertContent.match(/active_period\s*\{([^}]*)\}/);
    const activePeriod = apMatch
      ? {
          start: apMatch[1].match(/start:\s*(\d+)/)?.[1]
            ? parseInt(apMatch[1].match(/start:\s*(\d+)/)![1])
            : undefined,
          end: apMatch[1].match(/end:\s*(\d+)/)?.[1]
            ? parseInt(apMatch[1].match(/end:\s*(\d+)/)![1])
            : undefined,
        }
      : undefined;

    // Skip entities with no route info and no header (agency-wide noise)
    if (informedEntities.length === 0 && !headerText) continue;

    alerts.push({
      id: entityId,
      alert: {
        informedEntities,
        cause,
        effect,
        headerText,
        descriptionText,
        activePeriod,
      },
    });
  }

  return alerts;
}

/**
 * Filters a parsed alert list to only those affecting the given routes,
 * skipping expired alerts, and groups them by route number.
 *
 * @param alerts - All parsed alert entities from the feed
 * @param routes - Route numbers as used in the app (e.g. "44", "T101", "Airport Line")
 * @returns Map of route number → alerts affecting that route
 */
export function filterAlertsByRoutes(
  alerts: GtfsRtAlertEntity[],
  routes: string[]
): Record<string, ParsedRouteAlert[]> {
  const result: Record<string, ParsedRouteAlert[]> = {};
  const nowSec = Date.now() / 1000;

  for (const entity of alerts) {
    const { informedEntities, cause, effect, headerText, descriptionText, activePeriod } = entity.alert;

    // Must have a header to be useful
    if (!headerText) continue;

    // Skip if the active period has already ended
    if (activePeriod?.end && activePeriod.end < nowSec) continue;

    for (const informed of informedEntities) {
      if (!informed.routeId) continue;

      // Match app route labels to GTFS route_ids.
      // Trolley routes are stored as "T101" in the app but "101" in GTFS.
      const matchingRoutes = routes.filter((r) => {
        const normalized = r.startsWith('T') ? r.substring(1) : r;
        return normalized === informed.routeId;
      });

      for (const route of matchingRoutes) {
        if (!result[route]) result[route] = [];
        // Deduplicate by entity id in case multiple informed_entity blocks match
        if (!result[route].some((a) => a.id === entity.id)) {
          result[route].push({
            id: entity.id,
            cause,
            effect,
            header: headerText,
            description: descriptionText,
          });
        }
      }
    }
  }

  return result;
}
