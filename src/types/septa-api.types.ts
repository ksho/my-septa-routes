/**
 * Type definitions for SEPTA API responses and data structures.
 * These types ensure type safety when working with SEPTA's TransitView,
 * TrainView, and ArcGIS services.
 */

/**
 * Raw bus/trolley data from SEPTA TransitView API
 * @see https://www3.septa.org/api/TransitView/
 * @see https://www3.septa.org/hackathon/TransitViewAll/
 */
export interface SeptaTransitViewBus {
  lat?: string;
  lng?: string;
  VehicleID?: string;
  Direction?: string;
  destination?: string;
  late?: string | number;
  heading?: number;
  BlockID?: string;
  Offset?: string;
  Offset_sec?: string;
  trip?: string;
  route_id?: string;
  next_stop_id?: string;
  next_stop_name?: string;
  [key: string]: unknown;
}

/**
 * Response structure from SEPTA TransitView API (single route)
 */
export interface SeptaTransitViewResponse {
  bus?: SeptaTransitViewBus[];
  [key: string]: unknown;
}

/**
 * Response structure from SEPTA TransitViewAll API
 * Returns all buses/trolleys grouped by route number
 * @see https://www3.septa.org/hackathon/TransitViewAll/
 */
export interface SeptaTransitViewAllResponse {
  routes: Array<{
    [routeNumber: string]: SeptaTransitViewBus[];
  }>;
}

/**
 * Raw train data from SEPTA TrainView API
 * @see https://www3.septa.org/api/TrainView/
 */
export interface SeptaTrainViewTrain {
  lat?: string;
  lon?: string;
  line?: string;
  trainno?: string;
  consist?: string;
  direction?: string;
  heading?: string;
  dest?: string;
  nextstop?: string;
  late?: string;
  service?: string;
  track?: string;
  [key: string]: unknown;
}

/**
 * Response structure from SEPTA TrainView API
 * Returns an array of trains (not wrapped in an object)
 */
export type SeptaTrainViewResponse = SeptaTrainViewTrain[];

/**
 * Normalized vehicle data used throughout the application
 * Works for both buses and trains after transformation
 */
export interface NormalizedVehicle {
  lat: number;
  lng: number;
  label: string;
  VehicleID: string;
  Direction: string;
  destination: string;
  late?: number;
  service?: string;
  track?: string | null;
}

/**
 * Response wrapper for normalized vehicles
 * Maintains compatibility with existing code structure
 */
export interface VehicleResponse {
  bus: NormalizedVehicle[];
}

/**
 * ArcGIS Feature Server attribute structure for transit routes
 */
export interface ArcGISRouteAttributes {
  LineAbbr: string;
  LineName: string;
  tpField020?: string;
  tpField021?: string;
  [key: string]: unknown;
}

/**
 * ArcGIS Feature Server attribute structure for regional rail
 */
export interface ArcGISRailAttributes {
  Route_Name: string;
  Miles: number;
  [key: string]: unknown;
}

/**
 * GeoJSON geometry structure used by ArcGIS
 */
export interface GeoJSONGeometry {
  type: 'LineString' | 'MultiLineString' | 'Point' | 'Polygon';
  coordinates: number[][] | number[][][];
}

/**
 * ArcGIS Feature structure (generic)
 */
export interface ArcGISFeature<T = Record<string, unknown>> {
  type: 'Feature';
  properties?: T;
  attributes?: T;
  geometry: GeoJSONGeometry;
}

/**
 * ArcGIS FeatureCollection response
 */
export interface ArcGISFeatureCollection<T = Record<string, unknown>> {
  type?: 'FeatureCollection';
  features: ArcGISFeature<T>[];
  [key: string]: unknown;
}

/**
 * Route information used in the all-routes API
 */
export interface RouteInfo {
  number: string;
  name: string;
  type: 'bus' | 'trolley' | 'rail';
}

/**
 * Response structure from all-routes API
 */
export interface AllRoutesResponse {
  routes: RouteInfo[];
}

/**
 * GTFS-RT Vehicle entity from SEPTA's protobuf feed (parsed format)
 * @see http://www3.septa.org/gtfsrt/septa-pa-us/Vehicle/print.php
 */
export interface GtfsRtVehicleEntity {
  id: string;
  vehicle: {
    trip?: {
      trip_id?: string;
      route_id?: string;
      direction_id?: number;
    };
    vehicle?: {
      id?: string;
      label?: string;
    };
    position?: {
      latitude?: number;
      longitude?: number;
      bearing?: number;
    };
    current_stop_sequence?: number;
    stop_id?: string;
    timestamp?: number;
    occupancy_status?: string;
  };
}

/**
 * GTFS-RT feed response structure
 */
export interface GtfsRtFeedResponse {
  header: {
    gtfs_realtime_version: string;
    incrementality: string;
    timestamp: number;
  };
  entity: GtfsRtVehicleEntity[];
}
