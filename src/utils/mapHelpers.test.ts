/**
 * Tests for map helper utilities
 */

import { describe, it, expect } from 'vitest';
import {
  convertGeoJSONToLeaflet,
  formatRouteForURL,
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
