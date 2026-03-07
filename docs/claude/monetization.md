# Monetization Research (Feb 2026)

## Competitors

| App | Notes | Monetization |
|---|---|---|
| Official SEPTA App | Rebuilt Dec 2024, trip planning, SEPTA Key mgmt | Free |
| onTime SEPTA | Native iOS, real-time arrivals, actively maintained | Paid download |
| nextseptabus.com | Near-identical web app concept, live arrivals + occupancy | Free |
| Transit App | Best-in-class, 175+ cities, "GO" nudge alerts | Freemium: $4.99/mo or $24.99/yr "Royale" |
| Citymapper | Multimodal, e-scooters, rideshare | Freemium: $2.99/mo or $19.99/yr "Club" |
| Moovit | 112+ countries, B2B MaaS platform | Free + location-based ads + agency licensing |
| Google/Apple Maps | Ecosystem products, no standalone monetization | Free |

## Recommended Monetization Model

**Freemium subscription: ~$1.99/mo or $14.99/yr**

Free tier (current app):
- Live vehicle map, route selection, nearby routes discovery

Pro tier (to build):
- Push notifications: "Your Route 21 is 4 min from your stop"
- Service disruption alerts
- Favorite stops with next arrival predictions
- Offline mode / cached routes
- No ads

Secondary revenue:
- B2B licensing / anonymized data to neighborhood orgs, universities
- Location-based ads (supplemental, low CPM)

## Market Size

- SEPTA daily trips: ~750,000 (April 2025), +6-14% YoY
- Annual unique riders: estimated 1-2M individuals

Year 1 funnel estimate:
| Stage | Low | High |
|---|---|---|
| Downloads | 5,000 | 20,000 |
| Trial starts (48.7% of downloads) | 2,400 | 9,750 |
| Paid conversions (~40% of trials) | 1,000 | 3,900 |
| Revenue at $14.99/yr (after 30% cut) | $10,500 | $41,000 |

Key benchmark: Travel apps have 48.7% median trial-to-paid conversion (highest of any category) per RevenueCat 2025.

## Mobile Publishing

### Recommended: Capacitor (not React Native rewrite)
Wraps existing Next.js app in native WebView. Single codebase.

Steps:
1. Configure `next.config.ts` with `output: 'export'` + `images: { unoptimized: true }`
2. Keep API routes hosted on Vercel (static export can't run server code)
3. `npx cap init && npx cap add ios && npx cap add android`
4. Add native plugins (required to pass Apple App Store review):
   - `@capacitor/push-notifications` — premium feature + App Store requirement
   - `@capacitor/geolocation` — better GPS accuracy than browser
   - `@capacitor/local-notifications` — stop reminders
   - `@capacitor/haptics` — tap feedback
5. Build via Xcode (iOS) and Android Studio (Android)

Costs:
- Apple Developer Program: $99/yr
- Google Play: $25 one-time

**Publish Google Play first** — easier review, no Mac required.

Apple Guideline 4.2: Plain WebView wrappers get rejected. Push notifications plugin satisfies this requirement and is also the premium feature.

### Alternative: PWA
- Android: Installable + submittable to Google Play via TWA/PWABuilder
- iOS: "Add to Home Screen" only, NOT App Store eligible
- Low effort but misses iOS App Store entirely

## Missing Features (Priority Order)

### High Priority
1. **Stop-level arrival predictions** — "Next bus at Broad & Walnut: 4 min, 12 min." SEPTA API supports this. Biggest functional gap.
2. **Push notifications** — Premium feature anchor; required for App Store approval
3. ~~**Service alerts / GTFS-RT disruptions**~~ — Done (commit fd83fe0)
4. **Favorite stops** — routeStorage.ts saves routes but not stops
5. **Stop markers on map** — Route lines + vehicles shown but no tappable stops

### Medium Priority
6. Vehicle heading arrows (direction of travel)
7. Arrival countdown list view (alongside map)
8. Fare information / SEPTA Key card info
9. Offline mode / cached route geometry
10. Crowding/occupancy indicators (SEPTA provides some data)

### Lower Priority
11. Trip planner (big undertaking — skip initially)
12. iOS/Android home screen widgets
13. Onboarding flow for new users
14. Accessibility info (elevator/escalator outages)

## Recommended Action Sequence

1. ~~Add GTFS-RT service alerts~~ — Done
2. Add stop markers + next arrival predictions (biggest gap, SEPTA API ready)
3. Add Capacitor + push notifications (App Store key + premium feature)
4. Publish to Google Play first
5. Publish to iOS App Store
6. Launch freemium: $1.99/mo or $14.99/yr for Pro
7. Pitch local Philly press: Billy Penn, Philly Inquirer tech — "local dev built a better SEPTA app" story drives organic installs

## Notes
- Popular Science has covered exactly this type of story before (SEPTA tracker)
- Yearly subscriptions retain much better than monthly (60-75% vs ~15%/mo churn)
- Revenue per engaged commuter: $5-$15/yr is achievable (250+ use days/yr)
