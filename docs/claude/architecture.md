# Architecture Notes

## API Layer Pattern
All API routes live in `src/app/api/*/route.ts` and follow this pattern:
```ts
import { createSuccessResponse, handleApiError } from '@/lib/api/apiResponse';
export async function GET(request: NextRequest) {
  // fetch from SEPTA or ArcGIS
  return createSuccessResponse({ ... });
  // on error:
  return handleApiError('context string', error);
}
```
CORS headers are added automatically by `createSuccessResponse`.

## SEPTA Data Sources
| Data | Endpoint | Notes |
|---|---|---|
| Bus/trolley positions | `https://www3.septa.org/hackathon/TransitViewAll/` | All routes in one call |
| Rail positions | `https://www3.septa.org/api/TrainView/index.php` | All trains, filter client-side |
| Subway positions (BSL/MFL) | `http://www3.septa.org/gtfsrt/septa-pa-us/Vehicle/print.php` | GTFS-RT print format |
| Service alerts | `http://www3.septa.org/gtfsrt/septa-pa-us/Alert/print.php` | GTFS-RT print format |
| Bus/trolley geometry | ArcGIS FeatureServer (Spring 2025 schedule) | See `api.config.ts` |
| Rail geometry | ArcGIS FeatureServer (Regional Rail Lines) | See `api.config.ts` |
| All routes list | ArcGIS FeatureServer | Cached; used for search |

## GTFS-RT Print Format
SEPTA serves GTFS-RT protobuf data as human-readable HTML via `print.php` endpoints.
The format is protobuf text notation wrapped in `<pre>` with `<br>` line breaks.

Example vehicle entity:
```
entity {
  id: "1234"
  vehicle {
    trip { route_id: "BSL" direction_id: 0 }
    position { latitude: 39.95 longitude: -75.16 }
  }
}
```

Example alert entity:
```
entity {
  id: "alert-1"
  alert {
    active_period { start: 1709250000 end: 1709337600 }
    informed_entity { route_id: "44" }
    cause: CONSTRUCTION
    effect: DETOUR
    header_text { translation { text: "Route 44 Detour" language: "en" } }
    description_text { translation { text: "Due to construction..." language: "en" } }
  }
}
```

Parsers:
- `src/lib/transformers/gtfsRtTransformer.ts` - vehicle feed
- `src/lib/transformers/gtfsRtAlertTransformer.ts` - alert feed

## Service Alerts Feature (commit fd83fe0)
**Flow:** Map.tsx → `/api/alerts?routes=17,44` → GTFS-RT Alert feed → parse → filter by route → return

**Key files:**
- `src/app/api/alerts/route.ts` - endpoint
- `src/lib/transformers/gtfsRtAlertTransformer.ts` - `parseGtfsRtAlertFeed()` + `filterAlertsByRoutes()`
- `src/types/septa-api.types.ts` - `GtfsRtAlertEntity`, `ParsedRouteAlert`

**UI:** Amber `!` button in route drawer, left of vehicle count. Clicking opens a popover panel at `bottom-4 left-[280px]` (right of the 256px drawer). Backdrop div at z-[999] dismisses on outside click.

**Polling:** Fetched on route change + every 60s (alerts rarely change).

**Trolley route normalization:** App uses "T101" prefix; GTFS uses "101". The transformer strips the T when matching.

**Active period:** Alerts with `active_period.end` in the past are filtered out server-side.

## Polling Intervals (from api.config.ts)
- Vehicle positions: 5s
- Service alerts: 60s
- Nearby routes: re-queried after 0.1mi movement or 10s minimum

## Route Type Helpers (src/constants/routes.ts)
- `isRegionalRailRoute(route)` - true for named rail lines (Airport Line, etc.)
- `isSubwayRoute(route)` - true for BSL, MFL
- Trolley routes: string starts with "T" (e.g. "T101")

## Map.tsx State Summary
| State | Type | Purpose |
|---|---|---|
| `selectedRoutes` | `string[]` | Active route numbers |
| `vehicles` | `Vehicle[]` | Live vehicle positions |
| `routeGeometry` | `RouteFeature[]` | Route polyline data |
| `routeAlerts` | `Record<string, RouteAlert[]>` | Active alerts per route |
| `openAlertRoute` | `string \| null` | Which route's alert popover is open |
| `nearbyRouteFeatures` | `RouteFeature[]` | Routes near user location |
| `locationEnabled` | `boolean` | GPS tracking on/off |
| `userLocation` | `{lat,lng} \| null` | Current GPS position |
| `isManuallyDragged` | `boolean` | Whether user panned away from GPS |
