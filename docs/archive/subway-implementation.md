# BSL/MFL Subway Implementation Guide

## Status: Infrastructure Complete, Data Source Pending

This document explains the subway (BSL/MFL) implementation, what we discovered, and how to complete it in the future.

---

## Table of Contents

1. [Current Status](#current-status)
2. [What We Built](#what-we-built)
3. [The Problem](#the-problem)
4. [Investigation Results](#investigation-results)
5. [Future Implementation Options](#future-implementation-options)
6. [Code Reference](#code-reference)
7. [Testing](#testing)

---

## Current Status

### ✅ Completed Infrastructure

- **Subway route constants** (`SUBWAY_LINES.BSL`, `SUBWAY_LINES.MFL`)
- **GTFS-RT transformer** with full parsing and tests (24 tests)
- **Route detection** (`isSubwayRoute()`)
- **Visual styling** (blue rectangular markers, distinct colors)
- **API integration** ready in vehicles endpoint
- **Route discovery** in all-routes endpoint (currently disabled)

### ❌ Blocked: No Real-Time Data Available

**BSL and MFL do NOT have real-time vehicle position data or arrival predictions available through SEPTA's public APIs.**

---

## What We Built

### 1. Subway Constants (`src/constants/routes.ts`)

```typescript
export const SUBWAY_LINES = {
  BSL: 'BSL', // Broad Street Line
  MFL: 'MFL', // Market-Frankford Line
} as const;

export const isSubwayRoute = (route: string): boolean => {
  return ALL_SUBWAY_LINES.includes(route);
};
```

### 2. GTFS-RT Transformer (`src/lib/transformers/gtfsRtTransformer.ts`)

Full parser for SEPTA's GTFS-RT vehicle position feed with:
- HTML format parser (`parseGtfsRtPrintFormat`)
- Vehicle transformer (`transformGtfsRtVehicle`)
- Route filtering (`filterGtfsRtByRoute`)
- **24 comprehensive tests** ✅

**Note:** While the transformer is complete and tested, SEPTA's GTFS-RT feed does NOT include BSL/MFL data.

### 3. API Integration (`src/app/api/vehicles/route.ts`)

The vehicles endpoint separates routes by type:
```typescript
const subwayRoutes = routes.filter((route) => isSubwayRoute(route));
const busAndTrolleyRoutes = routes.filter((route) => !isRegionalRailRoute(route) && !isSubwayRoute(route));
const railRoutes = routes.filter((route) => isRegionalRailRoute(route));
```

Includes complete fetching logic for GTFS-RT subway data (ready when data becomes available).

### 4. Visual Styling

**Colors** (`src/utils/routeColors.ts`):
- BSL: `#4A90E2` (medium blue)
- MFL: `#5DADE2` (lighter blue)

**Markers** (`src/utils/routeIcons.ts`):
- Rectangular markers (similar to regional rail)
- Blue colors to distinguish from buses/rail
- Distinct from circular bus markers

---

## The Problem

### What We Discovered

**SEPTA does NOT provide public real-time APIs for subway lines:**

1. **GTFS-RT Vehicle Positions** (`/gtfsrt/septa-pa-us/Vehicle/print.php`)
   - ❌ Only includes bus routes (1, 103, 104, etc.)
   - ❌ NO subway routes (BSL, MFL)

2. **GTFS-RT Trip Updates** (`/gtfsrt/septa-pa-us/Trip/print.php`)
   - ❌ Only includes bus routes
   - ❌ NO subway arrival predictions

3. **TransitViewAll API** (`/hackathon/TransitViewAll/`)
   - ✅ Buses and trolleys
   - ❌ NO subway data

4. **Arrivals API** (`/hackathon/Arrivals/`)
   - ✅ Regional rail only
   - ❌ Does not work for subway stations

### Official Documentation

From SEPTA's hackathon API docs:

> **"Real-time data is not yet available for the Broad Street Line (Subway), Market Frankford Line (EL), and Norristown High Speed Line (Rt. 100)"**

Source: http://www3.septa.org/hackathon/index.html.codeforamerica

### Vendor Contract

From GitHub issues/discussions:

> "SEPTA is actively working with a vendor who was awarded the contract to publish GTFS realtime for MFL and BSL."

This suggests the data MAY become available in the future.

---

## Investigation Results

### APIs We Checked

| Endpoint | Data Available | Subway Support |
|----------|---------------|----------------|
| `/gtfsrt/septa-pa-us/Vehicle/print.php` | Bus vehicle positions | ❌ No |
| `/gtfsrt/septa-pa-us/Trip/print.php` | Bus arrival predictions | ❌ No |
| `/hackathon/TransitViewAll/` | Bus/trolley positions | ❌ No |
| `/hackathon/Arrivals/{station}` | Regional rail arrivals | ❌ No |
| `/api/TrainView/` | Regional rail positions | ❌ No |

**Result:** Zero real-time subway data available through public APIs.

### How SEPTA App Shows Arrivals

SEPTA's official app and Google Maps show subway arrival times, but they likely use:

1. **Static GTFS schedules** - Calculate "train in X minutes" from fixed schedule
2. **Private API** - Undocumented internal endpoint not available to developers
3. **Schedule + alerts** - Combine static times with delay notifications

Since subways run on fixed schedules (every 5-10 minutes), schedule-based predictions work well enough.

---

## Future Implementation Options

### Option A: Wait for SEPTA's GTFS-RT Feed (Recommended)

**When:** SEPTA completes vendor contract for BSL/MFL real-time data

**What to do:**
1. Monitor SEPTA GitHub releases: https://github.com/septadev/GTFS
2. Check GTFS-RT feeds periodically for BSL/MFL route_ids
3. Once available, un-comment subway routes in `all-routes/route.ts`
4. Test with existing GTFS-RT transformer (already built and tested!)

**Effort:** Minimal - infrastructure already complete

---

### Option B: Implement GTFS Schedule-Based Predictions

**Approach:** Parse static GTFS schedules and calculate next train times

**Data Source:**
- Latest GTFS: https://github.com/septadev/GTFS/releases/latest
- File: `gtfs_public.zip` → `google_bus.zip`

**Route IDs in GTFS:**
- `L1` = Market-Frankford Line (MFL)
- `B1` = Broad Street Line Local
- `B2` = Broad Street Line Express
- `B3` = Broad-Ridge Spur

**Implementation Steps:**

#### 1. Download and Parse GTFS Data

```bash
# Download latest GTFS
curl -L "https://github.com/septadev/GTFS/releases/download/v202602150/gtfs_public.zip" -o gtfs.zip
unzip gtfs.zip
unzip google_bus.zip -d gtfs_data
```

**Key files:**
- `routes.txt` - Route definitions
- `stops.txt` - Station locations (lat/lon)
- `trips.txt` - Trip definitions per route
- `stop_times.txt` - Schedule (234MB! - all arrival/departure times)
- `calendar.txt` - Service days
- `calendar_dates.txt` - Exceptions (holidays, etc.)

#### 2. Create GTFS Parser Service

Create: `src/lib/services/gtfsScheduleService.ts`

```typescript
interface GTFSStop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
}

interface StopTime {
  trip_id: string;
  arrival_time: string; // "HH:MM:SS"
  departure_time: string;
  stop_id: string;
  stop_sequence: number;
}

export class GTFSScheduleService {
  private stops: Map<string, GTFSStop>;
  private stopTimes: Map<string, StopTime[]>; // key: stop_id

  async loadSchedule(routeIds: string[]) {
    // Parse CSV files
    // Build indexes
    // Cache in memory
  }

  getNextArrivals(stopId: string, limit: number = 3) {
    const now = new Date();
    const currentTime = formatTime(now);
    const currentDay = getCurrentServiceDay(now);

    // Find stop_times after currentTime for this stop
    // Filter by active calendar
    // Return next N arrivals with countdown
  }
}
```

#### 3. Create Subway Arrivals API

Create: `src/app/api/subway-arrivals/route.ts`

```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const line = searchParams.get('line'); // 'BSL' or 'MFL'
  const station = searchParams.get('station'); // optional

  // Map BSL/MFL to GTFS route IDs
  const routeId = line === 'BSL' ? 'B1' : 'L1';

  // Get schedule service (singleton)
  const schedule = await getScheduleService();

  if (station) {
    // Return arrivals for specific station
    const arrivals = schedule.getNextArrivals(station, 3);
    return createSuccessResponse({ station, arrivals });
  } else {
    // Return arrivals for all major stations on line
    const stations = getMajorStations(routeId);
    const allArrivals = stations.map(s => ({
      station: s,
      arrivals: schedule.getNextArrivals(s.stop_id, 3)
    }));
    return createSuccessResponse({ stations: allArrivals });
  }
}
```

#### 4. Add Station Markers to Map

Update: `src/components/Map.tsx`

```typescript
// Fetch subway arrivals
const [subwayStations, setSubwayStations] = useState([]);

useEffect(() => {
  if (selectedRoutes.includes('BSL') || selectedRoutes.includes('MFL')) {
    fetch('/api/subway-arrivals?line=BSL')
      .then(res => res.json())
      .then(data => setSubwayStations(data.stations));
  }
}, [selectedRoutes]);

// Render station markers (different from vehicle markers)
{subwayStations.map(station => (
  <Marker
    key={station.stop_id}
    position={[station.lat, station.lng]}
    icon={createStationIcon(station.line)}
  >
    <Popup>
      <h3>{station.name}</h3>
      <div>Next trains:</div>
      <ul>
        {station.arrivals.map(a => (
          <li key={a.trip_id}>{a.minutes_until} min</li>
        ))}
      </ul>
    </Popup>
  </Marker>
))}
```

#### 5. Create Station Icon (Different from Vehicle Icon)

Update: `src/utils/routeIcons.ts`

```typescript
export function createStationIcon(line: string): L.DivIcon {
  const color = generateRouteColor(line);

  return L.divIcon({
    html: `
      <div style="
        background-color: ${color};
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      "></div>
    `,
    className: 'station-marker',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}
```

**Visual distinction:**
- **Vehicles:** Large rectangular markers (buses, trains)
- **Stations:** Small circular markers (subway stations)

#### 6. Major Stations to Include

**BSL (B1) - Broad Street Line Local:**
- Fern Rock Transportation Center
- Olney
- Erie
- Susquehanna-Dauphin
- Girard
- Spring Garden
- City Hall
- Walnut-Locust
- Lombard-South
- Ellsworth-Federal
- Tasker-Morris
- Snyder
- Oregon
- NRG Station

**MFL (L1) - Market-Frankford Line:**
- Frankford Transportation Center
- Margaret-Orthodox
- Allegheny
- Huntingdon
- York-Dauphin
- Somerset
- Spring Garden
- 2nd St
- 5th St
- 8th St
- 11th St
- 13th St
- 15th St/City Hall
- 30th St
- 34th St
- 40th St
- 46th St
- 52nd St
- 56th St
- 63rd St
- 69th St Transportation Center

#### 7. Optimization Considerations

**Challenge:** GTFS data is HUGE
- `stop_times.txt`: 234MB
- Contains all routes, all days, all times

**Solutions:**

**A. Pre-process at Build Time**
```bash
# Extract only BSL/MFL data
npm run extract-subway-schedule

# Creates: public/data/subway-schedule.json (much smaller)
```

**B. Index by Time Blocks**
```typescript
// Instead of loading all times, index by hour
{
  "BSL": {
    "06": [/* 6am-7am arrivals */],
    "07": [/* 7am-8am arrivals */],
    // ...
  }
}
```

**C. Database Option**
- Import GTFS into SQLite/PostgreSQL
- Query at runtime: `SELECT * FROM stop_times WHERE stop_id = ? AND arrival_time > ? LIMIT 3`
- Faster, more flexible

#### 8. Testing

Create: `src/lib/services/gtfsScheduleService.test.ts`

```typescript
describe('GTFSScheduleService', () => {
  it('should parse GTFS data correctly', async () => {
    const service = new GTFSScheduleService();
    await service.loadSchedule(['B1', 'L1']);

    expect(service.getStops('B1').length).toBeGreaterThan(0);
  });

  it('should calculate next arrivals correctly', () => {
    // Mock current time
    const arrivals = service.getNextArrivals('city_hall_bsl', 3);

    expect(arrivals).toHaveLength(3);
    expect(arrivals[0].minutes_until).toBeGreaterThanOrEqual(0);
  });

  it('should handle service exceptions (holidays)', () => {
    // Test calendar_dates.txt handling
  });
});
```

**Effort:** 4-6 hours for basic implementation, 8-12 hours for production-ready

---

### Option C: Display Static Information Only

**What to show:**
- Station markers with names
- Link to SEPTA schedule PDF
- "Check SEPTA app for real-time arrivals"

**Effort:** 1-2 hours (minimal value)

---

## Code Reference

### Files Created/Modified for Subway Support

**New files:**
```
src/lib/transformers/gtfsRtTransformer.ts         - GTFS-RT parser (220 lines)
src/lib/transformers/gtfsRtTransformer.test.ts    - Tests (360 lines, 24 tests)
```

**Modified files:**
```
src/constants/routes.ts                           - Added SUBWAY_LINES, isSubwayRoute()
src/config/api.config.ts                          - Added GTFS_RT_VEHICLES endpoint
src/types/septa-api.types.ts                      - Added GtfsRt types
src/utils/routeColors.ts                          - Added subway colors
src/utils/routeIcons.ts                           - Added subway marker styling
src/app/api/vehicles/route.ts                     - Added subway fetching logic
src/app/api/all-routes/route.ts                   - Added getSubwayRoutes() (disabled)
```

### To Enable in UI

Uncomment in `src/app/api/all-routes/route.ts`:

```typescript
// Add subway lines (hardcoded)
const subwayRoutes = getSubwayRoutes();
allRoutes.push(...subwayRoutes);
```

---

## Testing

### Existing Tests

All subway infrastructure is tested:

```bash
npm test src/lib/transformers/gtfsRtTransformer.test.ts
```

**24 tests covering:**
- HTML parsing
- Vehicle transformation
- Route filtering
- Integration workflows
- Edge cases

**All tests pass** ✅

### Testing When Data Becomes Available

```bash
# Test GTFS-RT feed has subway data
curl "http://www3.septa.org/gtfsrt/septa-pa-us/Vehicle/print.php" | grep -i "bsl\|mfl"

# If found, test transformer
npm test

# Test vehicles endpoint
curl "http://localhost:3000/api/vehicles?routes=BSL,MFL"
```

---

## Resources

### SEPTA APIs
- **Hackathon API docs:** http://www3.septa.org/hackathon/index.html
- **Developer portal:** https://www3.septa.org/developer/
- **GTFS GitHub:** https://github.com/septadev/GTFS
- **Latest GTFS release:** https://github.com/septadev/GTFS/releases/latest

### External Resources
- **OpenDataPhilly SEPTA:** https://opendataphilly.org/organizations/septa/
- **Transitland SEPTA:** https://www.transit.land/operators/o-dr4-septa
- **SEPTA Developer Google Group:** https://groups.google.com/g/septadev

### GTFS Specifications
- **GTFS Reference:** https://gtfs.org/
- **GTFS Realtime:** https://gtfs.org/realtime/

---

## Summary

### What Works
- ✅ Complete GTFS-RT infrastructure (if/when data becomes available)
- ✅ Visual styling (colors, markers)
- ✅ API integration ready
- ✅ Comprehensive tests (24 tests, all passing)

### What Doesn't Work
- ❌ No real-time vehicle positions for BSL/MFL
- ❌ No real-time arrival predictions for BSL/MFL
- ❌ No public API for subway data

### Next Steps
1. **Wait for SEPTA's GTFS-RT feed** to include BSL/MFL (easiest)
2. **Implement GTFS schedule parser** for predictions (4-6 hours)
3. Monitor SEPTA GitHub for updates

### When to Resume
- SEPTA announces BSL/MFL real-time data
- User requests schedule-based implementation
- GTFS-RT feed starts showing `route_id: "BSL"` or `route_id: "L1"`

---

*Last updated: February 7, 2026*
*Implementation by: Claude Sonnet 4.5*
