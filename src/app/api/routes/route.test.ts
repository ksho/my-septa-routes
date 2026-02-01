import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = vi.fn();

describe('Routes API (Bus/Trolley Geometry) Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (routes?: string) => {
    const url = routes
      ? `http://localhost:3000/api/routes?routes=${routes}`
      : 'http://localhost:3000/api/routes';
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

      const request = createMockRequest('17');
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

      const request = createMockRequest('17,23,42');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('ArcGIS API Integration', () => {
    it('should call ArcGIS API with correct URL for single route', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('17');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const decodedUrl = decodeURIComponent(fetchCall);

      expect(fetchCall).toContain('services2.arcgis.com');
      expect(fetchCall).toContain('Transit_Routes_(Spring_2025)');
      expect(fetchCall).toContain('FeatureServer/0/query');
      expect(decodedUrl).toContain("LineAbbr='17'");
      expect(decodedUrl).toContain('outFields=LineAbbr,LineName,tpField020,tpField021');
      expect(fetchCall).toContain('returnGeometry=true');
      expect(fetchCall).toContain('f=geojson');
    });

    it('should build correct WHERE clause for multiple routes', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('17,23,42');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const decodedUrl = decodeURIComponent(fetchCall);

      // URL uses + for spaces in query strings
      expect(decodedUrl).toContain("LineAbbr='17'+OR+LineAbbr='23'+OR+LineAbbr='42'");
    });

    it('should handle routes with spaces', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('17, 23, 42');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const decodedUrl = decodeURIComponent(fetchCall);

      // URL uses + for spaces in query strings
      expect(decodedUrl).toContain("LineAbbr='17'+OR+LineAbbr='23'+OR+LineAbbr='42'");
    });

    it('should return 500 when ArcGIS API responds with error status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const request = createMockRequest('17');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({ error: 'Failed to fetch route geometry data' });
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const request = createMockRequest('17');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({ error: 'Failed to fetch route geometry data' });
    });
  });

  describe('GeoJSON Response', () => {
    it('should return GeoJSON data from ArcGIS API', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {
              LineAbbr: '17',
              LineName: 'Route 17',
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

      const request = createMockRequest('17');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual(mockGeoJSON);
      expect(data.type).toBe('FeatureCollection');
      expect(data.features).toHaveLength(1);
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

      const request = createMockRequest('999');
      const response = await GET(request);
      const data = await response.json();

      expect(data.features).toHaveLength(0);
    });

    it('should handle multiple features for multiple routes', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: { LineAbbr: '17', LineName: 'Route 17' },
            geometry: { type: 'LineString', coordinates: [] },
          },
          {
            type: 'Feature',
            properties: { LineAbbr: '23', LineName: 'Route 23' },
            geometry: { type: 'LineString', coordinates: [] },
          },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('17,23');
      const response = await GET(request);
      const data = await response.json();

      expect(data.features).toHaveLength(2);
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

      const request = createMockRequest('17');
      const response = await GET(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });
  });

  describe('Special Route Types', () => {
    it('should handle trolley routes (T prefix)', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('T101,T102');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const decodedUrl = decodeURIComponent(fetchCall);

      // URL uses + for spaces in query strings
      expect(decodedUrl).toContain("LineAbbr='T101'+OR+LineAbbr='T102'");
    });

    it('should handle mixed bus and trolley routes', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('17,T101,42');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const decodedUrl = decodeURIComponent(fetchCall);

      // URL uses + for spaces in query strings
      expect(decodedUrl).toContain("LineAbbr='17'+OR+LineAbbr='T101'+OR+LineAbbr='42'");
    });
  });

  describe('URL Encoding', () => {
    it('should properly URL encode the WHERE clause', async () => {
      const mockGeoJSON = {
        type: 'FeatureCollection',
        features: [],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGeoJSON,
      });

      const request = createMockRequest('17');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const decodedUrl = decodeURIComponent(fetchCall);

      // The WHERE clause should be URL encoded
      expect(fetchCall).toContain('where=');
      // Decoded URL should contain the expected WHERE clause
      expect(decodedUrl).toContain("LineAbbr='17'");
    });
  });
});
