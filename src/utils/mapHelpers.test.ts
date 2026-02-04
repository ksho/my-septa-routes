/**
 * Tests for map helper utilities
 */

import { describe, it, expect } from 'vitest';
import {
  convertGeoJSONToLeaflet,
  isValidCoordinate,
  formatRouteForURL,
  parseRoutesFromURL,
  type RouteGeometry,
} from './mapHelpers';

describe('mapHelpers', () => {
  describe('convertGeoJSONToLeaflet', () => {
    it('should convert LineString coordinates from [lng, lat] to [lat, lng]', () => {
      const geometry: RouteGeometry = {
        type: 'LineString',
        coordinates: [
          [-75.1652, 39.9526], // Philadelphia center
          [-75.1700, 39.9550],
          [-75.1800, 39.9600],
        ],
      };

      const result = convertGeoJSONToLeaflet(geometry);

      expect(result).toEqual([
        [39.9526, -75.1652],
        [39.9550, -75.1700],
        [39.9600, -75.1800],
      ]);
    });

    it('should convert MultiLineString coordinates and flatten them', () => {
      const geometry: RouteGeometry = {
        type: 'MultiLineString',
        coordinates: [
          [
            [-75.1652, 39.9526],
            [-75.1700, 39.9550],
          ],
          [
            [-75.1800, 39.9600],
            [-75.1850, 39.9650],
          ],
        ],
      };

      const result = convertGeoJSONToLeaflet(geometry);

      expect(result).toEqual([
        [39.9526, -75.1652],
        [39.9550, -75.1700],
        [39.9600, -75.1800],
        [39.9650, -75.1850],
      ]);
    });

    it('should handle empty LineString', () => {
      const geometry: RouteGeometry = {
        type: 'LineString',
        coordinates: [],
      };

      const result = convertGeoJSONToLeaflet(geometry);
      expect(result).toEqual([]);
    });

    it('should handle empty MultiLineString', () => {
      const geometry: RouteGeometry = {
        type: 'MultiLineString',
        coordinates: [],
      };

      const result = convertGeoJSONToLeaflet(geometry);
      expect(result).toEqual([]);
    });

    it('should handle single point in LineString', () => {
      const geometry: RouteGeometry = {
        type: 'LineString',
        coordinates: [[-75.1652, 39.9526]],
      };

      const result = convertGeoJSONToLeaflet(geometry);
      expect(result).toEqual([[39.9526, -75.1652]]);
    });
  });

  describe('isValidCoordinate', () => {
    it('should return true for valid coordinates', () => {
      expect(isValidCoordinate(39.9526, -75.1652)).toBe(true);
      expect(isValidCoordinate(0.1, 0.1)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
      expect(isValidCoordinate(90, 180)).toBe(true);
    });

    it('should return false for null island (0, 0)', () => {
      expect(isValidCoordinate(0, 0)).toBe(false);
    });

    it('should return false for NaN values', () => {
      expect(isValidCoordinate(NaN, -75.1652)).toBe(false);
      expect(isValidCoordinate(39.9526, NaN)).toBe(false);
      expect(isValidCoordinate(NaN, NaN)).toBe(false);
    });

    it('should return false for latitude out of bounds', () => {
      expect(isValidCoordinate(91, -75.1652)).toBe(false);
      expect(isValidCoordinate(-91, -75.1652)).toBe(false);
      expect(isValidCoordinate(100, -75.1652)).toBe(false);
    });

    it('should return false for longitude out of bounds', () => {
      expect(isValidCoordinate(39.9526, 181)).toBe(false);
      expect(isValidCoordinate(39.9526, -181)).toBe(false);
      expect(isValidCoordinate(39.9526, 200)).toBe(false);
    });

    it('should handle edge cases at boundaries', () => {
      expect(isValidCoordinate(90, 180)).toBe(true);
      expect(isValidCoordinate(-90, -180)).toBe(true);
      expect(isValidCoordinate(89.9999, 179.9999)).toBe(true);
    });
  });

  describe('formatRouteForURL', () => {
    it('should encode simple route numbers', () => {
      expect(formatRouteForURL('57')).toBe('57');
      expect(formatRouteForURL('T1')).toBe('T1');
    });

    it('should encode route names with spaces', () => {
      expect(formatRouteForURL('Airport Line')).toBe('Airport%20Line');
      expect(formatRouteForURL('Paoli Thorndale')).toBe('Paoli%20Thorndale');
    });

    it('should encode special characters', () => {
      expect(formatRouteForURL('Route & Stop')).toBe('Route%20%26%20Stop');
      expect(formatRouteForURL('Route+123')).toBe('Route%2B123');
    });

    it('should handle empty string', () => {
      expect(formatRouteForURL('')).toBe('');
    });

    it('should handle already encoded strings', () => {
      const encoded = formatRouteForURL('Airport Line');
      const doubleEncoded = formatRouteForURL(encoded);
      expect(doubleEncoded).toBe('Airport%2520Line');
    });
  });

  describe('parseRoutesFromURL', () => {
    it('should parse single route', () => {
      expect(parseRoutesFromURL('57')).toEqual(['57']);
    });

    it('should parse multiple routes', () => {
      expect(parseRoutesFromURL('57,47,42')).toEqual(['57', '47', '42']);
    });

    it('should decode encoded route names', () => {
      expect(parseRoutesFromURL('Airport%20Line')).toEqual(['Airport Line']);
      expect(parseRoutesFromURL('57,Airport%20Line,T1')).toEqual([
        '57',
        'Airport Line',
        'T1',
      ]);
    });

    it('should handle null parameter', () => {
      expect(parseRoutesFromURL(null)).toEqual([]);
    });

    it('should handle empty string', () => {
      expect(parseRoutesFromURL('')).toEqual([]);
    });

    it('should trim whitespace', () => {
      expect(parseRoutesFromURL('57, 47 , 42')).toEqual(['57', '47', '42']);
    });

    it('should filter out empty entries', () => {
      expect(parseRoutesFromURL('57,,42')).toEqual(['57', '42']);
      expect(parseRoutesFromURL(',57,47,')).toEqual(['57', '47']);
    });

    it('should handle complex route names', () => {
      expect(
        parseRoutesFromURL('Paoli%20Thorndale,Norristown,Airport%20Line')
      ).toEqual(['Paoli Thorndale', 'Norristown', 'Airport Line']);
    });

    it('should handle special characters', () => {
      expect(parseRoutesFromURL('Route%26Stop,Route%2B123')).toEqual([
        'Route&Stop',
        'Route+123',
      ]);
    });

    it('should handle single route with trailing comma', () => {
      expect(parseRoutesFromURL('57,')).toEqual(['57']);
    });
  });

  describe('RouteGeometry type', () => {
    it('should allow LineString type', () => {
      const geometry: RouteGeometry = {
        type: 'LineString',
        coordinates: [[-75.1652, 39.9526]],
      };
      expect(geometry.type).toBe('LineString');
    });

    it('should allow MultiLineString type', () => {
      const geometry: RouteGeometry = {
        type: 'MultiLineString',
        coordinates: [[[-75.1652, 39.9526]]],
      };
      expect(geometry.type).toBe('MultiLineString');
    });
  });
});
