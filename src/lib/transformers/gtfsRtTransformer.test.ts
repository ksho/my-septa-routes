/**
 * Tests for GTFS-RT transformer utilities
 */

import { describe, it, expect } from 'vitest';
import {
  parseGtfsRtPrintFormat,
  transformGtfsRtVehicle,
  filterGtfsRtByRoute,
  transformGtfsRtResponse,
} from './gtfsRtTransformer';
import type { GtfsRtVehicleEntity, GtfsRtFeedResponse } from '@/types/septa-api.types';

describe('gtfsRtTransformer', () => {
  const mockHtmlResponse = `<html><head><title>Pretty Print - Trip Updates</title></head><body>
<pre>
header {<br>
  gtfs_realtime_version: "2.0"<br>
  incrementality: FULL_DATASET<br>
  timestamp: 1770475343<br>
}<br>
entity {<br>
  id: "1001"<br>
  vehicle {<br>
    trip {<br>
      trip_id: "BSL_123"<br>
      route_id: "BSL"<br>
      direction_id: 0<br>
    }<br>
    vehicle {<br>
      id: "1001"<br>
      label: "1001"<br>
    }<br>
    position {<br>
      latitude: 39.9526<br>
      longitude: -75.1652<br>
      bearing: 180.0<br>
    }<br>
    current_stop_sequence: 15<br>
    stop_id: "BSL_CITY_HALL"<br>
    timestamp: 1770475343<br>
    occupancy_status: MANY_SEATS_AVAILABLE<br>
  }<br>
}<br>
entity {<br>
  id: "2002"<br>
  vehicle {<br>
    trip {<br>
      trip_id: "MFL_456"<br>
      route_id: "MFL"<br>
      direction_id: 1<br>
    }<br>
    vehicle {<br>
      id: "2002"<br>
      label: "2002"<br>
    }<br>
    position {<br>
      latitude: 39.9550<br>
      longitude: -75.1700<br>
      bearing: 90.5<br>
    }<br>
    stop_id: "MFL_15TH_ST"<br>
    timestamp: 1770475350<br>
  }<br>
}<br>
</pre></body></html>`;

  describe('parseGtfsRtPrintFormat', () => {
    it('should parse HTML format into structured data', () => {
      const result = parseGtfsRtPrintFormat(mockHtmlResponse);

      expect(result.header).toBeDefined();
      expect(result.entity).toHaveLength(2);
    });

    it('should extract entity IDs correctly', () => {
      const result = parseGtfsRtPrintFormat(mockHtmlResponse);

      expect(result.entity[0].id).toBe('1001');
      expect(result.entity[1].id).toBe('2002');
    });

    it('should extract trip data correctly', () => {
      const result = parseGtfsRtPrintFormat(mockHtmlResponse);

      expect(result.entity[0].vehicle.trip).toEqual({
        trip_id: 'BSL_123',
        route_id: 'BSL',
        direction_id: 0,
      });

      expect(result.entity[1].vehicle.trip).toEqual({
        trip_id: 'MFL_456',
        route_id: 'MFL',
        direction_id: 1,
      });
    });

    it('should extract vehicle info correctly', () => {
      const result = parseGtfsRtPrintFormat(mockHtmlResponse);

      expect(result.entity[0].vehicle.vehicle).toEqual({
        id: '1001',
        label: '1001',
      });
    });

    it('should extract position data correctly', () => {
      const result = parseGtfsRtPrintFormat(mockHtmlResponse);

      expect(result.entity[0].vehicle.position).toEqual({
        latitude: 39.9526,
        longitude: -75.1652,
        bearing: 180.0,
      });
    });

    it('should extract stop and timestamp data', () => {
      const result = parseGtfsRtPrintFormat(mockHtmlResponse);

      expect(result.entity[0].vehicle.stop_id).toBe('BSL_CITY_HALL');
      expect(result.entity[0].vehicle.timestamp).toBe(1770475343);
    });

    it('should handle empty HTML', () => {
      const result = parseGtfsRtPrintFormat('<html></html>');

      expect(result.entity).toHaveLength(0);
    });

    it('should handle malformed HTML gracefully', () => {
      const result = parseGtfsRtPrintFormat('invalid html');

      expect(result.entity).toHaveLength(0);
    });
  });

  describe('transformGtfsRtVehicle', () => {
    const mockEntity: GtfsRtVehicleEntity = {
      id: '1001',
      vehicle: {
        trip: {
          trip_id: 'BSL_123',
          route_id: 'BSL',
          direction_id: 0,
        },
        vehicle: {
          id: '1001',
          label: '1001',
        },
        position: {
          latitude: 39.9526,
          longitude: -75.1652,
          bearing: 180.0,
        },
        stop_id: 'BSL_CITY_HALL',
        timestamp: 1770475343,
      },
    };

    it('should transform entity to normalized vehicle format', () => {
      const result = transformGtfsRtVehicle(mockEntity, 'BSL');

      expect(result).toEqual({
        lat: 39.9526,
        lng: -75.1652,
        label: 'BSL',
        VehicleID: '1001',
        Direction: 'Northbound',
        destination: 'BSL_CITY_HALL',
        late: 0,
        service: 'Subway',
      });
    });

    it('should use direction_id to determine direction', () => {
      const northbound = transformGtfsRtVehicle(mockEntity, 'BSL');
      expect(northbound?.Direction).toBe('Northbound');

      const southboundEntity = {
        ...mockEntity,
        vehicle: {
          ...mockEntity.vehicle,
          trip: { ...mockEntity.vehicle.trip, direction_id: 1 },
        },
      };
      const southbound = transformGtfsRtVehicle(southboundEntity, 'BSL');
      expect(southbound?.Direction).toBe('Southbound');
    });

    it('should return null if position is missing', () => {
      const entityWithoutPosition: GtfsRtVehicleEntity = {
        id: '1001',
        vehicle: {
          trip: { route_id: 'BSL' },
        },
      };

      const result = transformGtfsRtVehicle(entityWithoutPosition, 'BSL');
      expect(result).toBeNull();
    });

    it('should return null if vehicle ID is missing', () => {
      const entityWithoutId: GtfsRtVehicleEntity = {
        id: '',
        vehicle: {
          position: {
            latitude: 39.9526,
            longitude: -75.1652,
          },
        },
      };

      const result = transformGtfsRtVehicle(entityWithoutId, 'BSL');
      expect(result).toBeNull();
    });

    it('should use entity ID as fallback for vehicle ID', () => {
      const entity: GtfsRtVehicleEntity = {
        id: '1001',
        vehicle: {
          position: {
            latitude: 39.9526,
            longitude: -75.1652,
          },
        },
      };

      const result = transformGtfsRtVehicle(entity, 'BSL');
      expect(result?.VehicleID).toBe('1001');
    });

    it('should handle missing stop_id', () => {
      const entityWithoutStop = {
        ...mockEntity,
        vehicle: {
          ...mockEntity.vehicle,
          stop_id: undefined,
        },
      };

      const result = transformGtfsRtVehicle(entityWithoutStop, 'BSL');
      expect(result?.destination).toBe('Unknown');
    });
  });

  describe('filterGtfsRtByRoute', () => {
    const mockEntities: GtfsRtVehicleEntity[] = [
      {
        id: '1001',
        vehicle: {
          trip: { route_id: 'BSL' },
          position: { latitude: 39.95, longitude: -75.16 },
        },
      },
      {
        id: '2002',
        vehicle: {
          trip: { route_id: 'MFL' },
          position: { latitude: 39.96, longitude: -75.17 },
        },
      },
      {
        id: '1003',
        vehicle: {
          trip: { route_id: 'BSL' },
          position: { latitude: 39.94, longitude: -75.15 },
        },
      },
    ];

    it('should filter entities by route ID', () => {
      const bslVehicles = filterGtfsRtByRoute(mockEntities, 'BSL');
      expect(bslVehicles).toHaveLength(2);
      expect(bslVehicles[0].id).toBe('1001');
      expect(bslVehicles[1].id).toBe('1003');
    });

    it('should return empty array if no matches', () => {
      const result = filterGtfsRtByRoute(mockEntities, 'NONEXISTENT');
      expect(result).toHaveLength(0);
    });

    it('should return all entities if route matches all', () => {
      const allBsl: GtfsRtVehicleEntity[] = [
        {
          id: '1',
          vehicle: { trip: { route_id: 'BSL' }, position: { latitude: 1, longitude: 1 } },
        },
        {
          id: '2',
          vehicle: { trip: { route_id: 'BSL' }, position: { latitude: 2, longitude: 2 } },
        },
      ];

      const result = filterGtfsRtByRoute(allBsl, 'BSL');
      expect(result).toHaveLength(2);
    });
  });

  describe('transformGtfsRtResponse', () => {
    const mockFeedData: GtfsRtFeedResponse = {
      header: {
        gtfs_realtime_version: '2.0',
        incrementality: 'FULL_DATASET',
        timestamp: 1770475343,
      },
      entity: [
        {
          id: '1001',
          vehicle: {
            trip: { route_id: 'BSL', direction_id: 0 },
            vehicle: { id: '1001' },
            position: { latitude: 39.9526, longitude: -75.1652 },
            stop_id: 'BSL_CITY_HALL',
          },
        },
        {
          id: '2002',
          vehicle: {
            trip: { route_id: 'MFL', direction_id: 1 },
            vehicle: { id: '2002' },
            position: { latitude: 39.9550, longitude: -75.1700 },
            stop_id: 'MFL_15TH_ST',
          },
        },
      ],
    };

    it('should transform feed data with route filter', () => {
      const result = transformGtfsRtResponse(mockFeedData, 'BSL');

      expect(result.bus).toHaveLength(1);
      expect(result.bus[0].label).toBe('BSL');
      expect(result.bus[0].VehicleID).toBe('1001');
    });

    it('should transform all vehicles if no route specified', () => {
      const result = transformGtfsRtResponse(mockFeedData);

      expect(result.bus).toHaveLength(2);
    });

    it('should filter out vehicles with missing data', () => {
      const feedWithInvalid: GtfsRtFeedResponse = {
        ...mockFeedData,
        entity: [
          ...mockFeedData.entity,
          {
            id: '3003',
            vehicle: {
              trip: { route_id: 'BSL' },
              // Missing position
            },
          },
        ],
      };

      const result = transformGtfsRtResponse(feedWithInvalid, 'BSL');
      expect(result.bus).toHaveLength(1); // Only the valid BSL vehicle
    });

    it('should handle empty feed', () => {
      const emptyFeed: GtfsRtFeedResponse = {
        header: mockFeedData.header,
        entity: [],
      };

      const result = transformGtfsRtResponse(emptyFeed, 'BSL');
      expect(result.bus).toHaveLength(0);
    });

    it('should use route ID as label for all vehicles', () => {
      const result = transformGtfsRtResponse(mockFeedData, 'BSL');

      expect(result.bus.every((v) => v.label === 'BSL')).toBe(true);
    });
  });

  describe('Integration tests', () => {
    it('should parse HTML and transform to vehicles in one flow', () => {
      const parsed = parseGtfsRtPrintFormat(mockHtmlResponse);
      const transformed = transformGtfsRtResponse(parsed, 'BSL');

      expect(transformed.bus).toHaveLength(1);
      expect(transformed.bus[0]).toMatchObject({
        label: 'BSL',
        VehicleID: '1001',
        service: 'Subway',
      });
    });

    it('should handle full workflow with multiple routes', () => {
      const parsed = parseGtfsRtPrintFormat(mockHtmlResponse);

      const bslVehicles = transformGtfsRtResponse(parsed, 'BSL');
      const mflVehicles = transformGtfsRtResponse(parsed, 'MFL');

      expect(bslVehicles.bus).toHaveLength(1);
      expect(mflVehicles.bus).toHaveLength(1);
      expect(bslVehicles.bus[0].label).toBe('BSL');
      expect(mflVehicles.bus[0].label).toBe('MFL');
    });
  });
});
