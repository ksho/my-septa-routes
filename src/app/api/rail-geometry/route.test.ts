import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = vi.fn();

describe('Rail Geometry API Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (routes?: string) => {
    const url = routes
      ? `http://localhost:3000/api/rail-geometry?routes=${routes}`
      : 'http://localhost:3000/api/rail-geometry';
    return new NextRequest(url);
  };

  describe('Parameter Validation', () => {
    it('should return 400 error when routes parameter is missing', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({ error: 'Routes parameter is required' });
    });

    it('should accept single route parameter', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it('should accept multiple comma-separated routes', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line,Trenton,Norristown');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('Line Name Mapping', () => {
    it('should map route names to SEPTA API naming convention', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Norristown');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      // Should map "Norristown" to "Manayunk/Norristown"
      expect(decodeURIComponent(fetchCall)).toContain("Route_Name='Manayunk/Norristown'");
    });

    it('should handle unmapped routes as-is', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('CustomLine');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(decodeURIComponent(fetchCall)).toContain("Route_Name='CustomLine'");
    });

    it('should map multiple routes correctly', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line,Norristown');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const decoded = decodeURIComponent(fetchCall);
      // Airport Line → Airport
      expect(decoded).toContain("Route_Name='Airport'");
      // Norristown → Manayunk/Norristown
      expect(decoded).toContain("Route_Name='Manayunk/Norristown'");
      expect(decoded).toContain('OR');
    });
  });

  describe('ArcGIS API Integration', () => {
    it('should call ArcGIS Regional Rail API with correct URL', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchCall).toContain('services2.arcgis.com');
      expect(fetchCall).toContain('Regional_Rail_Lines');
      expect(fetchCall).toContain('FeatureServer/0/query');
      expect(decodeURIComponent(fetchCall)).toContain('outFields=Route_Name,Miles');
      expect(fetchCall).toContain('returnGeometry=true');
      expect(fetchCall).toContain('f=geojson');
    });

    it('should handle routes with spaces correctly', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line, Trenton, Norristown');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const decoded = decodeURIComponent(fetchCall);
      expect(decoded).toContain("Route_Name='Airport'");
      expect(decoded).toContain("Route_Name='Trenton'");
      expect(decoded).toContain("Route_Name='Manayunk/Norristown'");
    });

    it('should return 500 when ArcGIS API responds with error status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const request = createMockRequest('Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({ error: 'Failed to fetch rail geometry data' });
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const request = createMockRequest('Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({ error: 'Failed to fetch rail geometry data' });
    });
  });

  describe('Data Transformation', () => {
    it('should transform SEPTA route names back to our format', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              Route_Name: 'Manayunk/Norristown',
              Miles: 15.2,
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [-75.164, 39.952],
                [-75.165, 39.953],
              ],
            },
          },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Norristown');
      const response = await GET(request);
      const data = await response.json();

      expect(data.features[0].properties.LineAbbr).toBe('Norristown');
      expect(data.features[0].properties.LineName).toBe('Norristown');
    });

    it('should preserve geometry data', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              Route_Name: 'Airport',
              Miles: 10.5,
            },
            geometry: {
              type: 'LineString',
              coordinates: [
                [-75.164, 39.952],
                [-75.165, 39.953],
                [-75.166, 39.954],
              ],
            },
          },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(data.features[0].geometry).toEqual({
        type: 'LineString',
        coordinates: [
          [-75.164, 39.952],
          [-75.165, 39.953],
          [-75.166, 39.954],
        ],
      });
    });

    it('should include Miles property in transformed data', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              Route_Name: 'Airport',
              Miles: 10.5,
            },
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(data.features[0].properties.Miles).toBe(10.5);
    });

    it('should handle unmapped route names in response', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              Route_Name: 'UnknownLine',
              Miles: 5.0,
            },
            geometry: {
              type: 'LineString',
              coordinates: [],
            },
          },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('UnknownLine');
      const response = await GET(request);
      const data = await response.json();

      // Should fall back to original name if no reverse mapping exists
      expect(data.features[0].properties.LineAbbr).toBe('UnknownLine');
      expect(data.features[0].properties.LineName).toBe('UnknownLine');
    });

    it('should handle empty features array', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Nonexistent Line');
      const response = await GET(request);
      const data = await response.json();

      expect(data.type).toBe('FeatureCollection');
      expect(data.features).toEqual([]);
    });

    it('should handle multiple features with different route names', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { Route_Name: 'Airport', Miles: 10.5 },
            geometry: { type: 'LineString', coordinates: [] },
          },
          {
            type: 'Feature',
            properties: { Route_Name: 'Manayunk/Norristown', Miles: 15.2 },
            geometry: { type: 'LineString', coordinates: [] },
          },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line,Norristown');
      const response = await GET(request);
      const data = await response.json();

      expect(data.features).toHaveLength(2);
      expect(data.features[0].properties.LineAbbr).toBe('Airport Line');
      expect(data.features[1].properties.LineAbbr).toBe('Norristown');
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in successful response', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line');
      const response = await GET(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing features property in response', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(data.features).toEqual([]);
    });

    it('should handle null features property in response', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: null,
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(data.features).toEqual([]);
    });
  });
});
