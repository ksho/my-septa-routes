import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { REGIONAL_RAIL_LINES } from '../../../constants/routes';

// Mock fetch globally
global.fetch = vi.fn();

describe('All Routes API Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ArcGIS API Integration', () => {
    it('should call ArcGIS API to fetch bus routes', async () => {
      const mockBusData = {
        features: [
          { attributes: { LineAbbr: '17', LineName: 'Route 17' } },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      await GET();

      const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      const decodedUrl = decodeURIComponent(fetchCall);

      expect(fetchCall).toContain('services2.arcgis.com');
      expect(fetchCall).toContain('Transit_Routes_(Spring_2025)');
      expect(fetchCall).toContain('FeatureServer/0/query');
      expect(decodedUrl).toContain('where=1=1');
      expect(decodedUrl).toContain('outFields=LineAbbr,LineName');
      expect(fetchCall).toContain('returnGeometry=false');
      expect(fetchCall).toContain('f=json');
    });

    it('should handle successful bus route fetch', async () => {
      const mockBusData = {
        features: [
          { attributes: { LineAbbr: '17', LineName: 'Route 17' } },
          { attributes: { LineAbbr: '23', LineName: 'Route 23' } },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.routes).toBeDefined();
      expect(Array.isArray(data.routes)).toBe(true);
    });

    it('should handle ArcGIS API failure gracefully', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const response = await GET();
      const data = await response.json();

      // Should still include regional rail lines even if bus API fails
      expect(response.status).toBe(200);
      expect(data.routes.some((r: { type: string }) => r.type === 'rail')).toBe(true);
    });
  });

  describe('Bus Route Processing', () => {
    it('should map bus routes correctly', async () => {
      const mockBusData = {
        features: [
          { attributes: { LineAbbr: '17', LineName: 'Route 17' } },
          { attributes: { LineAbbr: '42', LineName: 'Route 42' } },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      const busRoutes = data.routes.filter((r: { type: string }) => r.type === 'bus');
      expect(busRoutes.length).toBeGreaterThan(0);
      expect(busRoutes[0]).toHaveProperty('number');
      expect(busRoutes[0]).toHaveProperty('name');
      expect(busRoutes[0]).toHaveProperty('type');
      expect(busRoutes[0].type).toBe('bus');
    });

    it('should identify trolley routes by T prefix', async () => {
      const mockBusData = {
        features: [
          { attributes: { LineAbbr: 'T101', LineName: 'Media/102nd Street Line' } },
          { attributes: { LineAbbr: '17', LineName: 'Route 17' } },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      const trolleyRoute = data.routes.find((r: { number: string }) => r.number === 'T101');
      const busRoute = data.routes.find((r: { number: string }) => r.number === '17');

      expect(trolleyRoute?.type).toBe('trolley');
      expect(busRoute?.type).toBe('bus');
    });
  });

  describe('Regional Rail Routes', () => {
    it('should include all regional rail lines', async () => {
      const mockBusData = { features: [] };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      const railRoutes = data.routes.filter((r: { type: string }) => r.type === 'rail');
      expect(railRoutes).toHaveLength(13);

      // Check for specific rail lines
      expect(railRoutes.some((r: { number: string }) => r.number === REGIONAL_RAIL_LINES.AIRPORT_LINE)).toBe(true);
      expect(railRoutes.some((r: { number: string }) => r.number === REGIONAL_RAIL_LINES.NORRISTOWN)).toBe(true);
      expect(railRoutes.some((r: { number: string }) => r.number === REGIONAL_RAIL_LINES.TRENTON)).toBe(true);
    });

    it('should format rail line names correctly', async () => {
      const mockBusData = { features: [] };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      const airportLine = data.routes.find(
        (r: { number: string }) => r.number === REGIONAL_RAIL_LINES.AIRPORT_LINE
      );
      const cynwydLine = data.routes.find(
        (r: { number: string }) => r.number === REGIONAL_RAIL_LINES.CYNWYD
      );

      // Some lines should have their own name (e.g., "Airport Line")
      expect(airportLine?.name).toBe('Airport Line');
      // Others should have " Line" appended (e.g., "Cynwyd Line")
      expect(cynwydLine?.name).toBe('Cynwyd Line');
    });

    it('should mark all rail routes with type "rail"', async () => {
      const mockBusData = { features: [] };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      const railRoutes = data.routes.filter((r: { type: string }) => r.type === 'rail');
      expect(railRoutes.every((r: { type: string }) => r.type === 'rail')).toBe(true);
    });
  });

  describe('Trolley Routes', () => {
    it('should include hardcoded trolley lines', async () => {
      const mockBusData = { features: [] };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      const trolleyRoutes = data.routes.filter((r: { type: string }) => r.type === 'trolley');
      expect(trolleyRoutes.length).toBeGreaterThanOrEqual(2);

      const t101 = trolleyRoutes.find((r: { number: string }) => r.number === 'T101');
      const t102 = trolleyRoutes.find((r: { number: string }) => r.number === 'T102');

      expect(t101).toBeDefined();
      expect(t101?.name).toBe('Media/102nd Street Line');
      expect(t102).toBeDefined();
      expect(t102?.name).toBe('Sharon Hill/102nd Street Line');
    });
  });

  describe('Route Sorting', () => {
    it('should sort routes by type: bus, trolley, then rail', async () => {
      const mockBusData = {
        features: [
          { attributes: { LineAbbr: '17', LineName: 'Route 17' } },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      const types = data.routes.map((r: { type: string }) => r.type);
      const busIndex = types.indexOf('bus');
      const trolleyIndex = types.indexOf('trolley');
      const railIndex = types.indexOf('rail');

      if (busIndex !== -1 && trolleyIndex !== -1) {
        expect(busIndex).toBeLessThan(trolleyIndex);
      }
      if (trolleyIndex !== -1 && railIndex !== -1) {
        expect(trolleyIndex).toBeLessThan(railIndex);
      }
    });

    it('should sort bus routes numerically', async () => {
      const mockBusData = {
        features: [
          { attributes: { LineAbbr: '42', LineName: 'Route 42' } },
          { attributes: { LineAbbr: '17', LineName: 'Route 17' } },
          { attributes: { LineAbbr: '9', LineName: 'Route 9' } },
          { attributes: { LineAbbr: '100', LineName: 'Route 100' } },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      const busRoutes = data.routes.filter((r: { type: string }) => r.type === 'bus');
      const busNumbers = busRoutes.map((r: { number: string }) => parseInt(r.number));

      // Check if sorted numerically
      for (let i = 1; i < busNumbers.length; i++) {
        if (!isNaN(busNumbers[i]) && !isNaN(busNumbers[i - 1])) {
          expect(busNumbers[i]).toBeGreaterThanOrEqual(busNumbers[i - 1]);
        }
      }
    });
  });

  describe('Duplicate Removal', () => {
    it('should remove duplicate routes based on route number', async () => {
      const mockBusData = {
        features: [
          { attributes: { LineAbbr: '17', LineName: 'Route 17' } },
          { attributes: { LineAbbr: '17', LineName: 'Route 17 Duplicate' } },
          { attributes: { LineAbbr: '23', LineName: 'Route 23' } },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      const route17s = data.routes.filter((r: { number: string }) => r.number === '17');
      expect(route17s).toHaveLength(1);
    });

    it('should not have duplicate trolley routes', async () => {
      const mockBusData = {
        features: [
          { attributes: { LineAbbr: 'T101', LineName: 'Media Line from API' } },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      const t101Routes = data.routes.filter((r: { number: string }) => r.number === 'T101');
      expect(t101Routes).toHaveLength(1);
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in response', async () => {
      const mockBusData = { features: [] };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });
  });

  describe('Error Handling', () => {
    it('should gracefully handle bus route fetch failure and still return rail/trolley', async () => {
      // Mock fetch failure for bus routes
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Unexpected error')
      );

      const response = await GET();
      const data = await response.json();

      // Should still succeed with 200 (graceful degradation)
      expect(response.status).toBe(200);
      expect(data).toHaveProperty('routes');

      // Should still include rail and trolley routes
      const hasRailRoutes = data.routes.some((r: { type: string }) => r.type === 'rail');
      const hasTrolleyRoutes = data.routes.some((r: { type: string }) => r.type === 'trolley');

      expect(hasRailRoutes).toBe(true);
      expect(hasTrolleyRoutes).toBe(true);
    });

    it('should log warnings when bus route fetch fails', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Test error')
      );

      await GET();

      // fetchBusRoutes logs warnings on failure
      expect(console.warn).toHaveBeenCalled();
    });
  });

  describe('Response Structure', () => {
    it('should return routes in correct structure', async () => {
      const mockBusData = {
        features: [
          { attributes: { LineAbbr: '17', LineName: 'Route 17' } },
        ],
      };
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockBusData,
      });

      const response = await GET();
      const data = await response.json();

      expect(data).toHaveProperty('routes');
      expect(Array.isArray(data.routes)).toBe(true);

      if (data.routes.length > 0) {
        const route = data.routes[0];
        expect(route).toHaveProperty('number');
        expect(route).toHaveProperty('name');
        expect(route).toHaveProperty('type');
      }
    });
  });
});
