# SEPTA Live - Claude Context

## Project Overview
Real-time SEPTA bus tracking app built with Next.js 15, TypeScript, Leaflet maps.
- Shows live vehicle positions (5-sec polling), route geometry, nearby routes
- Up to 10 routes selectable; routes saved in localStorage and URL params
- Deployed on Vercel; SEPTA TransitView API + ArcGIS for data

## Key Files
- `src/components/Map.tsx` - Main map component with all route management logic
- `src/app/api/vehicles/` - Bulk vehicle positions proxy (all routes in one call)
- `src/app/api/routes/` - Bus/trolley route geometry proxy (ArcGIS)
- `src/app/api/rail-geometry/` - Regional rail geometry proxy (ArcGIS)
- `src/app/api/all-routes/` - Available routes listing
- `src/app/api/alerts/` - GTFS-RT service alerts proxy (60s polling)
- `src/app/api/nearby-routes/` - Routes near user's location
- `src/lib/routeStorage.ts` - localStorage persistence (20 unit tests)
- `src/config/api.config.ts` - All SEPTA + ArcGIS endpoint URLs, polling intervals
- `src/types/septa-api.types.ts` - Shared TypeScript types for all API responses
- `src/lib/transformers/` - Data transformers (train, GTFS-RT vehicles, GTFS-RT alerts)
- `src/utils/routeColors.ts` - Route color generation
- `src/utils/routeIcons.ts` - Leaflet marker icon factories
- `src/constants/routes.ts` - isRegionalRailRoute(), isSubwayRoute() helpers

## Detailed Docs
- `docs/claude/architecture.md` - API patterns, SEPTA data sources, GTFS-RT format, Map.tsx state
- `docs/claude/monetization.md` - Competitors, pricing model, market size, mobile publishing, feature gaps

## Current Branch: monetize
Features built so far:
- **Service alerts** (`fd83fe0`) - GTFS-RT alert feed parsed, filtered by selected routes.
  Amber `!` button in route drawer; clicking opens a popover to the right. Polls every 60s.

## Planned Features (priority order)
1. Stop-level arrival predictions (biggest gap, SEPTA API ready)
2. Push notifications (premium feature + App Store requirement)
3. Favorite stops
4. Stop markers on map

## Monetization Summary
Freemium subscription ~$1.99/mo or $14.99/yr; mobile via Capacitor; Google Play first, then iOS.
Year 1 estimate: $10K–$41K ARR. See `docs/claude/monetization.md` for full research.
