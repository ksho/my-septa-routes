/**
 * Tests for train data transformer utilities
 */

import { describe, it, expect } from 'vitest';
import {
  transformTrainToVehicle,
  transformTrainResponse,
  filterTrainsByLine,
} from './trainDataTransformer';
import { isRegionalRailRoute } from '@/constants/routes';
import type { SeptaTrainViewTrain } from '@/types/septa-api.types';

describe('trainDataTransformer', () => {
  const mockTrain: SeptaTrainViewTrain = {
    lat: '39.9526',
    lon: '-75.1652',
    trainno: '1234',
    service: 'LOCAL',
    dest: 'Suburban Station',
    currentstop: 'City Hall',
    nextstop: 'Suburban Station',
    line: 'Airport',
    consist: '1234',
    heading: 'N',
    late: '5',
    SOURCE: '10/15/2024 10:30:00 AM',
    TRACK: '1',
    TRACKCHANGE: '',
    direction: 'NorthBound',
    track: '1',
  };

  describe('transformTrainToVehicle', () => {
    it('should transform train data to normalized vehicle format', () => {
      const result = transformTrainToVehicle(mockTrain);

      expect(result).toEqual({
        lat: 39.9526,
        lng: -75.1652,
        label: 'Airport',
        VehicleID: '1234',
        Direction: 'NorthBound',
        destination: 'Suburban Station',
        late: 5,
        service: 'LOCAL',
        track: '1',
      });
    });

    it('should use provided routeLabel instead of train.line', () => {
      const result = transformTrainToVehicle(mockTrain, 'Airport Line');

      expect(result.label).toBe('Airport Line');
    });

    it('should use routeLabel that is recognized as regional rail', () => {
      const result = transformTrainToVehicle(mockTrain, 'Airport Line');

      // The label should be recognized as a regional rail route
      expect(isRegionalRailRoute(result.label)).toBe(true);
    });

    it('should handle missing optional fields', () => {
      const minimalTrain: SeptaTrainViewTrain = {
        lat: '39.9526',
        lon: '-75.1652',
        trainno: '1234',
      };

      const result = transformTrainToVehicle(minimalTrain);

      expect(result.label).toBe('Unknown');
      expect(result.Direction).toBe('Unknown');
      expect(result.destination).toBe('Unknown');
      expect(result.late).toBe(0);
      expect(result.service).toBe('Regional Rail');
      expect(result.track).toBe(null);
    });

    it('should parse coordinates correctly', () => {
      const result = transformTrainToVehicle(mockTrain);

      expect(result.lat).toBe(39.9526);
      expect(result.lng).toBe(-75.1652);
      expect(typeof result.lat).toBe('number');
      expect(typeof result.lng).toBe('number');
    });

    it('should parse late minutes correctly', () => {
      const onTimeTrain = { ...mockTrain, late: '0' };
      const lateTrain = { ...mockTrain, late: '15' };

      expect(transformTrainToVehicle(onTimeTrain).late).toBe(0);
      expect(transformTrainToVehicle(lateTrain).late).toBe(15);
    });

    it('should prefer trainno over consist for VehicleID', () => {
      const withTrainno = { ...mockTrain, trainno: 'T1234', consist: 'C5678' };
      const withoutTrainno = { ...mockTrain, trainno: undefined, consist: 'C5678' };

      expect(transformTrainToVehicle(withTrainno).VehicleID).toBe('T1234');
      expect(transformTrainToVehicle(withoutTrainno).VehicleID).toBe('C5678');
    });

    it('should prefer direction over heading for Direction', () => {
      const withDirection = { ...mockTrain, direction: 'Northbound', heading: 'N' };
      const withoutDirection = { ...mockTrain, direction: undefined, heading: 'N' };

      expect(transformTrainToVehicle(withDirection).Direction).toBe('Northbound');
      expect(transformTrainToVehicle(withoutDirection).Direction).toBe('N');
    });

    it('should prefer dest over nextstop for destination', () => {
      const withDest = { ...mockTrain, dest: 'Airport', nextstop: 'Temple U' };
      const withoutDest = { ...mockTrain, dest: undefined, nextstop: 'Temple U' };

      expect(transformTrainToVehicle(withDest).destination).toBe('Airport');
      expect(transformTrainToVehicle(withoutDest).destination).toBe('Temple U');
    });
  });

  describe('filterTrainsByLine', () => {
    const trains: SeptaTrainViewTrain[] = [
      { ...mockTrain, line: 'Airport' },
      { ...mockTrain, line: 'Manayunk/Norristown' },
      { ...mockTrain, line: 'Airport' },
      { ...mockTrain, line: 'Paoli/Thorndale' },
    ];

    it('should filter trains by exact line name', () => {
      const result = filterTrainsByLine(trains, 'Airport');
      expect(result).toHaveLength(2);
      expect(result.every(t => t.line === 'Airport')).toBe(true);
    });

    it('should filter trains by partial line name (case-insensitive)', () => {
      const result = filterTrainsByLine(trains, 'norristown');
      expect(result).toHaveLength(1);
      expect(result[0].line).toBe('Manayunk/Norristown');
    });

    it('should be case-insensitive', () => {
      const result = filterTrainsByLine(trains, 'AIRPORT');
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no matches', () => {
      const result = filterTrainsByLine(trains, 'Nonexistent');
      expect(result).toHaveLength(0);
    });

    it('should handle trains without line property', () => {
      const trainsWithoutLine: SeptaTrainViewTrain[] = [
        { ...mockTrain, line: undefined },
        { ...mockTrain, line: 'Airport' },
      ];

      const result = filterTrainsByLine(trainsWithoutLine, 'Airport');
      expect(result).toHaveLength(1);
    });
  });

  describe('transformTrainResponse', () => {
    const trains: SeptaTrainViewTrain[] = [
      { ...mockTrain, trainno: '1', line: 'Airport' },
      { ...mockTrain, trainno: '2', line: 'Manayunk/Norristown' },
      { ...mockTrain, trainno: '3', line: 'Airport' },
    ];

    it('should transform and filter trains by line name', () => {
      const result = transformTrainResponse(trains, 'Airport');

      expect(result.bus).toHaveLength(2);
      expect(result.bus[0].VehicleID).toBe('1');
      expect(result.bus[1].VehicleID).toBe('3');
    });

    it('should use lineName as label for all filtered trains', () => {
      const result = transformTrainResponse(trains, 'Airport');

      expect(result.bus).toHaveLength(2);
      expect(result.bus[0].label).toBe('Airport');
      expect(result.bus[1].label).toBe('Airport');
    });

    it('should produce labels recognized as regional rail routes when using standardized names', () => {
      // Create trains with SEPTA API names that would match our filter
      const railTrains: SeptaTrainViewTrain[] = [
        { ...mockTrain, trainno: '1', line: 'Manayunk/Norristown' },
        { ...mockTrain, trainno: '2', line: 'Manayunk/Norristown' },
      ];

      // Filter using our standardized name (will match since "Manayunk/Norristown" contains "Norristown")
      const result = transformTrainResponse(railTrains, 'Norristown');

      // Should match trains
      expect(result.bus.length).toBe(2);

      // All labels should be our standardized name and recognized as regional rail
      expect(result.bus.every(v => v.label === 'Norristown')).toBe(true);
      expect(result.bus.every(v => isRegionalRailRoute(v.label))).toBe(true);
    });

    it('should transform all trains if no lineName provided', () => {
      const result = transformTrainResponse(trains);

      expect(result.bus).toHaveLength(3);
    });

    it('should return empty array if no trains match filter', () => {
      const result = transformTrainResponse(trains, 'Nonexistent Line');

      expect(result.bus).toHaveLength(0);
    });

    it('should handle empty train array', () => {
      const result = transformTrainResponse([]);

      expect(result.bus).toHaveLength(0);
    });
  });

  describe('Regional Rail marker requirements', () => {
    it('should create labels that work with rectangular rail markers', () => {
      const train: SeptaTrainViewTrain = {
        ...mockTrain,
        line: 'Manayunk/Norristown', // SEPTA API name
      };

      // Transform with our standardized name
      const vehicle = transformTrainToVehicle(train, 'Norristown');

      // The label should be our standardized name
      expect(vehicle.label).toBe('Norristown');

      // It should be recognized as regional rail (for rectangular markers)
      expect(isRegionalRailRoute(vehicle.label)).toBe(true);
    });

    it('should work for all common regional rail lines', () => {
      const regionalRailLines = [
        'Airport Line',
        'Norristown',
        'Paoli/Thorndale',
        'Wilmington/Newark',
        'Trenton',
      ];

      regionalRailLines.forEach(lineName => {
        const train: SeptaTrainViewTrain = {
          ...mockTrain,
          line: 'SomeAPIName',
        };

        const vehicle = transformTrainToVehicle(train, lineName);

        expect(vehicle.label).toBe(lineName);
        expect(isRegionalRailRoute(vehicle.label)).toBe(true);
      });
    });
  });
});
