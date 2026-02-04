/**
 * Tests for route color utilities
 */

import { describe, it, expect } from 'vitest';
import { ROUTE_COLORS, generateRouteColor } from './routeColors';
import { REGIONAL_RAIL_LINES } from '@/constants/routes';

describe('routeColors', () => {
  describe('ROUTE_COLORS', () => {
    it('should have predefined colors for common bus routes', () => {
      expect(ROUTE_COLORS['9']).toBe('#FF6B6B');
      expect(ROUTE_COLORS['12']).toBe('#4ECDC4');
      expect(ROUTE_COLORS['21']).toBe('#45B7D1');
      expect(ROUTE_COLORS['42']).toBe('#96CEB4');
      expect(ROUTE_COLORS['47']).toBe('#FFEAA7');
      expect(ROUTE_COLORS['57']).toBe('#DDA0DD');
    });

    it('should have predefined colors for trolley routes', () => {
      expect(ROUTE_COLORS['T1']).toBe('#00BCD4');
      expect(ROUTE_COLORS['T2']).toBe('#FF9800');
      expect(ROUTE_COLORS['T101']).toBe('#795548');
    });

    it('should have gray shades for regional rail lines', () => {
      expect(ROUTE_COLORS[REGIONAL_RAIL_LINES.AIRPORT_LINE]).toBe('#909090');
      expect(ROUTE_COLORS[REGIONAL_RAIL_LINES.NORRISTOWN]).toBe('#7A7A7A');
      expect(ROUTE_COLORS[REGIONAL_RAIL_LINES.PAOLI_THORNDALE]).toBe('#808080');
    });
  });

  describe('generateRouteColor', () => {
    it('should return predefined color for known bus routes', () => {
      expect(generateRouteColor('9')).toBe('#FF6B6B');
      expect(generateRouteColor('57')).toBe('#DDA0DD');
      expect(generateRouteColor('42')).toBe('#96CEB4');
    });

    it('should return predefined color for known trolley routes', () => {
      expect(generateRouteColor('T1')).toBe('#00BCD4');
      expect(generateRouteColor('T2')).toBe('#FF9800');
    });

    it('should return predefined color for known regional rail lines', () => {
      expect(generateRouteColor(REGIONAL_RAIL_LINES.AIRPORT_LINE)).toBe('#909090');
      expect(generateRouteColor(REGIONAL_RAIL_LINES.NORRISTOWN)).toBe('#7A7A7A');
    });

    it('should generate HSL colors for unknown bus-like routes', () => {
      const color = generateRouteColor('999');
      expect(color).toMatch(/^hsl\(\d+,\s*70%,\s*50%\)$/);
    });

    it('should generate consistent colors for same unknown route', () => {
      const color1 = generateRouteColor('888');
      const color2 = generateRouteColor('888');
      expect(color1).toBe(color2);
    });

    it('should generate trolley colors for unknown T-prefix routes', () => {
      const color = generateRouteColor('T999');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
      // Should be one of the trolley colors
      const trolleyColors = ['#00BCD4', '#FF9800', '#4CAF50', '#9C27B0', '#F44336', '#795548', '#607D8B'];
      expect(trolleyColors).toContain(color);
    });

    it('should generate consistent colors for same unknown trolley route', () => {
      const color1 = generateRouteColor('T555');
      const color2 = generateRouteColor('T555');
      expect(color1).toBe(color2);
    });

    it('should generate HSL colors for unknown bus routes', () => {
      const color = generateRouteColor('999');
      expect(color).toMatch(/^hsl\(\d+,\s*70%,\s*50%\)$/);
    });

    it('should generate consistent HSL colors for same unknown bus route', () => {
      const color1 = generateRouteColor('888');
      const color2 = generateRouteColor('888');
      expect(color1).toBe(color2);
    });

    it('should generate different colors for different unknown bus routes', () => {
      const color1 = generateRouteColor('777');
      const color2 = generateRouteColor('888');
      // Different routes should (usually) get different hues
      expect(color1).not.toBe(color2);
    });

    it('should handle edge cases', () => {
      expect(generateRouteColor('')).toMatch(/^hsl\(\d+,\s*70%,\s*50%\)$/);
      expect(generateRouteColor('1')).toBeDefined();
      expect(generateRouteColor('ABCD')).toBeDefined();
    });
  });
});
