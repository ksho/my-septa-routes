import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = vi.fn();

describe('SEPTA API Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (route?: string) => {
    const url = route
      ? `http://localhost:3000/api/septa?route=${route}`
      : 'http://localhost:3000/api/septa';
    return new NextRequest(url);
  };

  describe('Parameter Validation', () => {
    it('should return 400 error when route parameter is missing', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toMatchObject({ error: 'Route parameter is required' });
    });

    it('should accept valid route parameter', async () => {
      const mockData = { bus: [] };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const request = createMockRequest('17');
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe('SEPTA API Integration', () => {
    it('should call SEPTA API with correct URL and headers', async () => {
      const mockData = { bus: [] };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const request = createMockRequest('17');
      await GET(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www3.septa.org/api/TransitView/index.php?route=17',
        {
          headers: {
            'User-Agent': 'SEPTA-Transit-App/1.0',
          },
        }
      );
    });

    it('should handle successful SEPTA API response', async () => {
      const mockData = {
        bus: [
          {
            lat: '39.952',
            lng: '-75.164',
            VehicleID: '1234',
            Direction: 'NorthBound',
            destination: 'Market Street',
          },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const request = createMockRequest('17');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockData);
    });

    it('should return 500 when SEPTA API responds with error status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const request = createMockRequest('17');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({ error: 'Failed to fetch transit data' });
      expect(console.error).toHaveBeenCalled();
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const request = createMockRequest('17');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({ error: 'Failed to fetch transit data' });
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in successful response', async () => {
      const mockData = { bus: [] };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const request = createMockRequest('17');
      const response = await GET(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });
  });

  describe('Route Parameter Handling', () => {
    it('should handle numeric route numbers', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bus: [] }),
      });

      const request = createMockRequest('123');
      await GET(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www3.septa.org/api/TransitView/index.php?route=123',
        expect.any(Object)
      );
    });

    it('should handle trolley routes with T prefix', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bus: [] }),
      });

      const request = createMockRequest('T101');
      await GET(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www3.septa.org/api/TransitView/index.php?route=T101',
        expect.any(Object)
      );
    });

    it('should handle URL-encoded route parameters', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ bus: [] }),
      });

      const request = createMockRequest('Airport%20Line');
      await GET(request);

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(fetchCall).toContain('TransitView/index.php');
      // The route parameter gets decoded by NextRequest, so it will be a space in the URL
      expect(fetchCall).toContain('route=Airport Line');
    });
  });
});
