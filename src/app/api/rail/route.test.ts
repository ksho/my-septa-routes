import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = vi.fn();

describe('Rail API Route Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (route?: string) => {
    const url = route
      ? `http://localhost:3000/api/rail?route=${route}`
      : 'http://localhost:3000/api/rail';
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
  });

  describe('TrainView API Integration', () => {
    it('should call SEPTA TrainView API endpoint', async () => {
      const mockTrains = [];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      await GET(request);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://www3.septa.org/api/TrainView/index.php'
      );
    });

    it('should return 500 when TrainView API responds with error status', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 503,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({ error: 'Failed to fetch Regional Rail data' });
    });

    it('should handle network errors', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toMatchObject({ error: 'Failed to fetch Regional Rail data' });
    });
  });

  describe('Train Data Filtering', () => {
    it('should filter trains by line name (case-insensitive)', async () => {
      const mockTrains = [
        { line: 'Airport Line', lat: '39.952', lon: '-75.164', trainno: '123' },
        { line: 'Trenton Line', lat: '40.000', lon: '-75.000', trainno: '456' },
        { line: 'Airport Line', lat: '39.953', lon: '-75.165', trainno: '789' },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(data.bus).toHaveLength(2);
      expect(data.bus[0].label).toContain('Airport');
      expect(data.bus[1].label).toContain('Airport');
    });

    it('should handle partial line name matches', async () => {
      const mockTrains = [
        { line: 'Manayunk/Norristown Line', lat: '39.952', lon: '-75.164', trainno: '123' },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Norristown');
      const response = await GET(request);
      const data = await response.json();

      expect(data.bus).toHaveLength(1);
      expect(data.bus[0].label).toBe('Manayunk/Norristown Line');
    });

    it('should return empty array when no trains match', async () => {
      const mockTrains = [
        { line: 'Airport Line', lat: '39.952', lon: '-75.164', trainno: '123' },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Trenton');
      const response = await GET(request);
      const data = await response.json();

      expect(data.bus).toHaveLength(0);
    });

    it('should handle trains without line property', async () => {
      const mockTrains = [
        { lat: '39.952', lon: '-75.164', trainno: '123' },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(data.bus).toHaveLength(0);
    });
  });

  describe('Train Data Transformation', () => {
    it('should transform train data to expected format', async () => {
      const mockTrains = [
        {
          line: 'Airport Line',
          lat: '39.952',
          lon: '-75.164',
          trainno: '123',
          direction: 'Inbound',
          dest: 'Center City',
          late: '5',
          service: 'Regional Rail',
          track: '3',
        },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(data.bus[0]).toEqual({
        lat: 39.952,
        lng: -75.164,
        label: 'Airport Line',
        VehicleID: '123',
        Direction: 'Inbound',
        destination: 'Center City',
        late: 5,
        service: 'Regional Rail',
        track: '3',
      });
    });

    it('should parse coordinate strings to numbers', async () => {
      const mockTrains = [
        {
          line: 'Airport Line',
          lat: '39.952123',
          lon: '-75.164456',
          trainno: '123',
        },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(typeof data.bus[0].lat).toBe('number');
      expect(typeof data.bus[0].lng).toBe('number');
      expect(data.bus[0].lat).toBeCloseTo(39.952123);
      expect(data.bus[0].lng).toBeCloseTo(-75.164456);
    });

    it('should handle missing or invalid coordinates with defaults', async () => {
      const mockTrains = [
        { line: 'Airport Line', trainno: '123' },
        { line: 'Airport Line', lat: 'invalid', lon: 'invalid', trainno: '456' },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(data.bus[0].lat).toBe(0);
      expect(data.bus[0].lng).toBe(0);
      expect(data.bus[1].lat).toBe(0);
      expect(data.bus[1].lng).toBe(0);
    });

    it('should use consist as fallback for VehicleID', async () => {
      const mockTrains = [
        { line: 'Airport Line', lat: '39.952', lon: '-75.164', consist: 'ABC123' },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(data.bus[0].VehicleID).toBe('ABC123');
    });

    it('should use heading as fallback for Direction', async () => {
      const mockTrains = [
        { line: 'Airport Line', lat: '39.952', lon: '-75.164', heading: '90', trainno: '123' },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(data.bus[0].Direction).toBe('90');
    });

    it('should use nextstop as fallback for destination', async () => {
      const mockTrains = [
        { line: 'Airport Line', lat: '39.952', lon: '-75.164', nextstop: '30th Street', trainno: '123' },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(data.bus[0].destination).toBe('30th Street');
    });

    it('should use "Unknown" for missing required fields', async () => {
      const mockTrains = [
        { lat: '39.952', lon: '-75.164' },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(data.bus).toHaveLength(0); // Filtered out because no line
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in successful response', async () => {
      const mockTrains = [];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('GET');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe('Content-Type');
    });
  });

  describe('Response Structure', () => {
    it('should return data in {bus: []} structure for compatibility', async () => {
      const mockTrains = [
        { line: 'Airport Line', lat: '39.952', lon: '-75.164', trainno: '123' },
      ];
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrains,
      });

      const request = createMockRequest('Airport');
      const response = await GET(request);
      const data = await response.json();

      expect(data).toHaveProperty('bus');
      expect(Array.isArray(data.bus)).toBe(true);
    });
  });
});
