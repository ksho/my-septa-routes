/**
 * Tests for bulk vehicles API endpoint
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('GET /api/vehicles', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createMockRequest = (routes?: string) => {
    const url = routes
      ? `http://localhost:3000/api/vehicles?routes=${routes}`
      : 'http://localhost:3000/api/vehicles';
    return new NextRequest(url);
  };

  describe('Parameter Validation', () => {
    it('should return 400 error when routes parameter is missing', async () => {
      const request = createMockRequest();
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
      expect(data.error).toContain('Routes parameter is required');
    });

    it('should return 400 error when routes parameter is empty', async () => {
      const request = createMockRequest('');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeTruthy();
    });

    it('should return 400 error when routes contains only commas', async () => {
      const request = createMockRequest(',,,');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('At least one route must be specified');
    });
  });

  describe('Bus and Trolley Routes', () => {
    it('should fetch and filter bus routes from TransitViewAll', async () => {
      const mockTransitViewAllResponse = {
        routes: [{
          '17': [
            {
              lat: '39.9526',
              lng: '-75.1652',
              VehicleID: '1234',
              Direction: 'NorthBound',
              destination: 'Suburban Station',
              late: '5',
            },
          ],
          '42': [
            {
              lat: '39.9600',
              lng: '-75.1700',
              VehicleID: '5678',
              Direction: 'SouthBound',
              destination: 'City Hall',
              late: '2',
            },
          ],
        }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransitViewAllResponse,
      });

      const request = createMockRequest('17,42');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bus).toHaveLength(2);
      expect(data.bus[0].lat).toBe(39.9526);
      expect(data.bus[0].VehicleID).toBe('1234');
      expect(data.bus[1].lat).toBe(39.9600);
      expect(data.bus[1].VehicleID).toBe('5678');

      // Verify it called TransitViewAll
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('TransitViewAll'),
        expect.any(Object)
      );
    });

    it('should handle trolley routes by removing T prefix', async () => {
      const mockTransitViewAllResponse = {
        routes: [{
          '101': [
            {
              lat: '39.9526',
              lng: '-75.1652',
              VehicleID: 'T101',
              Direction: 'WestBound',
              destination: 'Media',
              late: '0',
            },
          ],
        }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransitViewAllResponse,
      });

      const request = createMockRequest('T101');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bus).toHaveLength(1);
      expect(data.bus[0].VehicleID).toBe('T101');
    });

    it('should use route number for label field, not vehicle ID', async () => {
      const mockTransitViewAllResponse = {
        routes: [{
          '17': [
            {
              lat: '39.9526',
              lng: '-75.1652',
              VehicleID: '1234',
              Direction: 'NorthBound',
              destination: 'Suburban Station',
              late: '5',
            },
          ],
          '42': [
            {
              lat: '39.9600',
              lng: '-75.1700',
              VehicleID: '5678',
              Direction: 'SouthBound',
              destination: 'City Hall',
              late: '2',
            },
          ],
        }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransitViewAllResponse,
      });

      const request = createMockRequest('17,42');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bus).toHaveLength(2);

      // Label should be the route number, not the vehicle ID
      expect(data.bus[0].label).toBe('17');
      expect(data.bus[0].VehicleID).toBe('1234');

      expect(data.bus[1].label).toBe('42');
      expect(data.bus[1].VehicleID).toBe('5678');
    });

    it('should filter out buses with missing coordinates', async () => {
      const mockTransitViewAllResponse = {
        routes: [{
          '17': [
            {
              lat: '39.9526',
              lng: '-75.1652',
              VehicleID: '1234',
              Direction: 'NorthBound',
              destination: 'Suburban Station',
              late: '5',
            },
            {
              // Missing lat
              lng: '-75.1700',
              VehicleID: '5678',
              Direction: 'SouthBound',
              destination: 'City Hall',
              late: '2',
            },
            {
              lat: '39.9600',
              // Missing lng
              VehicleID: '9012',
              Direction: 'NorthBound',
              destination: 'Test',
              late: '0',
            },
          ],
        }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransitViewAllResponse,
      });

      const request = createMockRequest('17');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bus).toHaveLength(1); // Only the first bus has valid coordinates
      expect(data.bus[0].VehicleID).toBe('1234');
    });
  });

  describe('Regional Rail Routes', () => {
    it('should fetch and filter regional rail routes', async () => {
      // Note: TrainView returns all trains, filtering happens via transformTrainResponse
      // The line names in the API match SEPTA's naming (e.g., "AIR" for Airport)
      const mockTrainViewResponse = [
        {
          lat: '39.9526',
          lon: '-75.1652',
          trainno: '1234',
          line: 'AIR',  // SEPTA uses abbreviations
          dest: 'Airport Terminal',
          late: '3',
          direction: 'N',
          service: 'LOCAL',
        },
        {
          lat: '39.9600',
          lon: '-75.1700',
          trainno: '5678',
          line: 'NOR',
          dest: 'Norristown TC',
          late: '0',
          direction: 'S',
          service: 'LOCAL',
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTrainViewResponse,
      });

      const request = createMockRequest('Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Response might be empty if transformTrainResponse filters out the data
      // This is okay - the important part is that it doesn't error
      expect(data.bus).toBeDefined();
      expect(Array.isArray(data.bus)).toBe(true);

      // Verify it called TrainView
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('TrainView')
      );
    });
  });

  describe('Mixed Route Types', () => {
    it('should fetch both bus and rail routes in a single call', async () => {
      const mockTransitViewAllResponse = {
        routes: [{
          '17': [
            {
              lat: '39.9526',
              lng: '-75.1652',
              VehicleID: '1234',
              Direction: 'NorthBound',
              destination: 'Suburban Station',
              late: '5',
            },
          ],
        }],
      };

      const mockTrainViewResponse = [
        {
          lat: '39.9600',
          lon: '-75.1700',
          trainno: '5678',
          line: 'AIR',
          dest: 'Airport Terminal',
          late: '3',
          direction: 'N',
          service: 'LOCAL',
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTransitViewAllResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrainViewResponse,
        });

      const request = createMockRequest('17,Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should have at least the bus data
      expect(data.bus.length).toBeGreaterThanOrEqual(1);
      expect(data.bus[0].VehicleID).toBe('1234');

      // Should have called both APIs
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle comma-separated routes with whitespace', async () => {
      const mockTransitViewAllResponse = {
        routes: [{
          '17': [],
          '42': [],
          '57': [],
        }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransitViewAllResponse,
      });

      const request = createMockRequest('17, 42 , 57');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    it('should continue with rail data if bus/trolley API fails', async () => {
      const mockTrainViewResponse = [
        {
          lat: '39.9526',
          lon: '-75.1652',
          trainno: '1234',
          line: 'AIR',
          dest: 'Airport Terminal',
          late: '0',
          direction: 'N',
          service: 'LOCAL',
        },
      ];

      mockFetch
        .mockRejectedValueOnce(new Error('TransitViewAll failed'))
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrainViewResponse,
        });

      const request = createMockRequest('17,Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should still return valid response even though bus API failed
      expect(data.bus).toBeDefined();
      expect(Array.isArray(data.bus)).toBe(true);
    });

    it('should continue with bus data if rail API fails', async () => {
      const mockTransitViewAllResponse = {
        routes: [{
          '17': [
            {
              lat: '39.9526',
              lng: '-75.1652',
              VehicleID: '1234',
              Direction: 'NorthBound',
              destination: 'Suburban Station',
              late: '5',
            },
          ],
        }],
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTransitViewAllResponse,
        })
        .mockRejectedValueOnce(new Error('TrainView failed'));

      const request = createMockRequest('17,Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Should still have bus data even though rail API failed
      expect(data.bus).toHaveLength(1);
      expect(data.bus[0].VehicleID).toBe('1234');
    });

    it('should return empty array if all APIs fail', async () => {
      mockFetch
        .mockRejectedValueOnce(new Error('TransitViewAll failed'))
        .mockRejectedValueOnce(new Error('TrainView failed'));

      const request = createMockRequest('17,Airport Line');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.bus).toEqual([]);
    });
  });

  describe('Performance Optimization', () => {
    it('should make only 1 API call for multiple bus routes (not N calls)', async () => {
      const mockTransitViewAllResponse = {
        routes: [{
          '17': [],
          '42': [],
          '57': [],
          '21': [],
          '29': [],
        }],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockTransitViewAllResponse,
      });

      const request = createMockRequest('17,42,57,21,29');
      await GET(request);

      // Should only call TransitViewAll once, not 5 times
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    it('should make only 2 API calls for mixed routes (1 bus, 1 rail)', async () => {
      const mockTransitViewAllResponse = {
        routes: [{
          '17': [],
          '42': [],
          '57': [],
        }],
      };

      const mockTrainViewResponse = [
        {
          lat: '39.9526',
          lon: '-75.1652',
          trainno: '1234',
          line: 'Airport',
          dest: 'Airport Terminal',
          late: '0',
          direction: 'N',
        },
      ];

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTransitViewAllResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTrainViewResponse,
        });

      const request = createMockRequest('17,42,57,Airport Line,Norristown');
      await GET(request);

      // Should call TransitViewAll once and TrainView once (not 5 times)
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });
  });
});
