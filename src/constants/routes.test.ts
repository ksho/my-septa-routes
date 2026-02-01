import { describe, it, expect } from 'vitest';
import {
  REGIONAL_RAIL_LINES,
  ALL_REGIONAL_RAIL_LINES,
  isRegionalRailRoute,
  SEPTA_LINE_NAME_MAPPING,
  SEPTA_TO_OUR_LINE_NAME_MAPPING,
  DEFAULT_REGIONAL_RAIL_LINE,
} from './routes';

describe('Regional Rail Constants', () => {
  describe('REGIONAL_RAIL_LINES', () => {
    it('should contain all expected rail lines', () => {
      expect(REGIONAL_RAIL_LINES).toHaveProperty('AIRPORT_LINE');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('CHESTNUT_HILL_EAST');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('CHESTNUT_HILL_WEST');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('CYNWYD');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('FOX_CHASE');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('LANSDALE_DOYLESTOWN');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('MEDIA_WAWA');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('NORRISTOWN');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('PAOLI_THORNDALE');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('TRENTON');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('WARMINSTER');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('WEST_TRENTON');
      expect(REGIONAL_RAIL_LINES).toHaveProperty('WILMINGTON_NEWARK');
    });

    it('should have correct line names', () => {
      expect(REGIONAL_RAIL_LINES.AIRPORT_LINE).toBe('Airport Line');
      expect(REGIONAL_RAIL_LINES.NORRISTOWN).toBe('Norristown');
      expect(REGIONAL_RAIL_LINES.PAOLI_THORNDALE).toBe('Paoli/Thorndale');
    });
  });

  describe('ALL_REGIONAL_RAIL_LINES', () => {
    it('should contain exactly 13 rail lines', () => {
      expect(ALL_REGIONAL_RAIL_LINES).toHaveLength(13);
    });

    it('should contain all rail line values', () => {
      expect(ALL_REGIONAL_RAIL_LINES).toContain('Airport Line');
      expect(ALL_REGIONAL_RAIL_LINES).toContain('Norristown');
      expect(ALL_REGIONAL_RAIL_LINES).toContain('Wilmington/Newark');
    });

    it('should not contain duplicates', () => {
      const uniqueLines = new Set(ALL_REGIONAL_RAIL_LINES);
      expect(uniqueLines.size).toBe(ALL_REGIONAL_RAIL_LINES.length);
    });
  });

  describe('isRegionalRailRoute', () => {
    it('should return true for valid regional rail routes', () => {
      expect(isRegionalRailRoute('Airport Line')).toBe(true);
      expect(isRegionalRailRoute('Norristown')).toBe(true);
      expect(isRegionalRailRoute('Paoli/Thorndale')).toBe(true);
    });

    it('should return false for non-rail routes', () => {
      expect(isRegionalRailRoute('17')).toBe(false);
      expect(isRegionalRailRoute('T101')).toBe(false);
      expect(isRegionalRailRoute('Bus Route')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isRegionalRailRoute('')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(isRegionalRailRoute('airport line')).toBe(false);
      expect(isRegionalRailRoute('NORRISTOWN')).toBe(false);
    });
  });

  describe('SEPTA_LINE_NAME_MAPPING', () => {
    it('should map our route names to SEPTA API names', () => {
      expect(SEPTA_LINE_NAME_MAPPING['Airport Line']).toBe('Airport');
      expect(SEPTA_LINE_NAME_MAPPING['Norristown']).toBe('Manayunk/Norristown');
      expect(SEPTA_LINE_NAME_MAPPING['Cynwyd']).toBe('Cynwyd');
    });

    it('should have mappings for all regional rail lines', () => {
      ALL_REGIONAL_RAIL_LINES.forEach(line => {
        expect(SEPTA_LINE_NAME_MAPPING).toHaveProperty(line);
        expect(SEPTA_LINE_NAME_MAPPING[line]).toBeTruthy();
      });
    });

    it('should handle special case for Norristown (Manayunk/Norristown)', () => {
      expect(SEPTA_LINE_NAME_MAPPING['Norristown']).toBe('Manayunk/Norristown');
    });

    it('should have exactly 13 mappings', () => {
      expect(Object.keys(SEPTA_LINE_NAME_MAPPING)).toHaveLength(13);
    });
  });

  describe('SEPTA_TO_OUR_LINE_NAME_MAPPING', () => {
    it('should map SEPTA API names back to our route names', () => {
      expect(SEPTA_TO_OUR_LINE_NAME_MAPPING['Airport']).toBe('Airport Line');
      expect(SEPTA_TO_OUR_LINE_NAME_MAPPING['Manayunk/Norristown']).toBe('Norristown');
      expect(SEPTA_TO_OUR_LINE_NAME_MAPPING['Cynwyd']).toBe('Cynwyd');
    });

    it('should be the reverse of SEPTA_LINE_NAME_MAPPING', () => {
      Object.entries(SEPTA_LINE_NAME_MAPPING).forEach(([ourName, septaName]) => {
        expect(SEPTA_TO_OUR_LINE_NAME_MAPPING[septaName]).toBe(ourName);
      });
    });

    it('should have exactly 13 mappings', () => {
      expect(Object.keys(SEPTA_TO_OUR_LINE_NAME_MAPPING)).toHaveLength(13);
    });
  });

  describe('Bidirectional Mapping Consistency', () => {
    it('should maintain consistency between forward and reverse mappings', () => {
      Object.entries(SEPTA_LINE_NAME_MAPPING).forEach(([ourName, septaName]) => {
        const mappedBack = SEPTA_TO_OUR_LINE_NAME_MAPPING[septaName];
        expect(mappedBack).toBe(ourName);
      });
    });

    it('should have no orphaned reverse mappings', () => {
      Object.keys(SEPTA_TO_OUR_LINE_NAME_MAPPING).forEach(septaName => {
        const ourName = SEPTA_TO_OUR_LINE_NAME_MAPPING[septaName];
        expect(SEPTA_LINE_NAME_MAPPING[ourName]).toBe(septaName);
      });
    });
  });

  describe('DEFAULT_REGIONAL_RAIL_LINE', () => {
    it('should be set to Norristown', () => {
      expect(DEFAULT_REGIONAL_RAIL_LINE).toBe('Norristown');
    });

    it('should be a valid regional rail line', () => {
      expect(ALL_REGIONAL_RAIL_LINES).toContain(DEFAULT_REGIONAL_RAIL_LINE);
    });

    it('should have a SEPTA mapping', () => {
      expect(SEPTA_LINE_NAME_MAPPING[DEFAULT_REGIONAL_RAIL_LINE]).toBeTruthy();
    });
  });
});
