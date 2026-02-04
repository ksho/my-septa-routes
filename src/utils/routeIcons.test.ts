/**
 * Tests for route icon creation
 */

import { describe, it, expect } from 'vitest';
import { createRouteIcon } from './routeIcons';
import { REGIONAL_RAIL_LINES } from '@/constants/routes';

describe('routeIcons', () => {
  describe('createRouteIcon', () => {
    it('should create a circular icon for bus routes', () => {
      const icon = createRouteIcon('57');

      expect(icon).toBeDefined();
      expect(icon.options.iconSize).toEqual([24, 24]);
      expect(icon.options.iconAnchor).toEqual([12, 12]);
      expect(icon.options.popupAnchor).toEqual([0, -12]);

      // Check HTML contains route number and circular styling
      const html = icon.options.html as string;
      expect(html).toContain('57');
      expect(html).toContain('border-radius: 50%');
      expect(html).toContain('width: 24px');
      expect(html).toContain('height: 24px');
    });

    it('should create a circular icon for trolley routes', () => {
      const icon = createRouteIcon('T1');

      expect(icon.options.iconSize).toEqual([24, 24]);
      expect(icon.options.iconAnchor).toEqual([12, 12]);

      const html = icon.options.html as string;
      expect(html).toContain('T1');
      expect(html).toContain('border-radius: 50%');
    });

    it('should create a rectangular icon for regional rail routes', () => {
      const icon = createRouteIcon(REGIONAL_RAIL_LINES.NORRISTOWN);

      // Regional rail icons have variable width
      expect(icon.options.iconSize?.[1]).toBe(20); // Height is fixed at 20
      expect(icon.options.iconSize?.[0]).toBeGreaterThanOrEqual(60); // Width >= 60

      // Icon anchor should be center of the icon
      const width = icon.options.iconSize?.[0] || 0;
      expect(icon.options.iconAnchor).toEqual([width / 2, 10]);
      expect(icon.options.popupAnchor).toEqual([0, -10]);

      const html = icon.options.html as string;
      expect(html).toContain('Norristown');
      expect(html).toContain('border-radius: 10px');
      expect(html).toContain('height: 20px');
    });

    it('should truncate long regional rail names', () => {
      // "Lansdale/Doylestown" is 19 chars - should be truncated to 10 + "..."
      const longName = REGIONAL_RAIL_LINES.LANSDALE_DOYLESTOWN;
      const icon = createRouteIcon(longName);

      const html = icon.options.html as string;
      // Should truncate to 10 chars + "..."
      expect(html).toContain('...');
      expect(html).toContain('Lansdale/D');
    });

    it('should not truncate short regional rail names', () => {
      const shortName = REGIONAL_RAIL_LINES.FOX_CHASE; // "Fox Chase"
      const icon = createRouteIcon(shortName);

      const html = icon.options.html as string;
      expect(html).toContain('Fox Chase');
      expect(html).not.toContain('...');
    });

    it('should calculate width based on text length for regional rail', () => {
      const shortRail = createRouteIcon('Fox Chase');
      const longRail = createRouteIcon(REGIONAL_RAIL_LINES.LANSDALE_DOYLESTOWN);

      const shortWidth = shortRail.options.iconSize?.[0] || 0;
      const longWidth = longRail.options.iconSize?.[0] || 0;

      // Longer name should have wider icon
      expect(longWidth).toBeGreaterThan(shortWidth);
    });

    it('should have minimum width for regional rail icons', () => {
      const icon = createRouteIcon(REGIONAL_RAIL_LINES.CYNWYD); // "Cynwyd" - 6 chars

      // Even short names should have minimum width of 60
      const width = icon.options.iconSize?.[0] || 0;
      expect(width).toBeGreaterThanOrEqual(60);
    });

    it('should include proper styling for all route types', () => {
      const busIcon = createRouteIcon('42');
      const trolleyIcon = createRouteIcon('T2');
      const railIcon = createRouteIcon(REGIONAL_RAIL_LINES.AIRPORT_LINE);

      for (const icon of [busIcon, trolleyIcon, railIcon]) {
        const html = icon.options.html as string;

        // Common styling elements
        expect(html).toContain('background-color:');
        expect(html).toContain('border: 2px solid rgba(255,255,255,0.8)');
        expect(html).toContain('box-shadow: 0 2px 6px rgba(0,0,0,0.4)');
        expect(html).toContain('opacity: 0.85');
        expect(html).toContain('font-weight: bold');
        expect(html).toContain('color: white');
        expect(html).toContain('text-shadow: 1px 1px 1px rgba(0,0,0,0.6)');
      }
    });

    it('should use correct font sizes', () => {
      const busIcon = createRouteIcon('42');
      const railIcon = createRouteIcon(REGIONAL_RAIL_LINES.AIRPORT_LINE);

      const busHtml = busIcon.options.html as string;
      const railHtml = railIcon.options.html as string;

      expect(busHtml).toContain('font-size: 11px');
      expect(railHtml).toContain('font-size: 9px');
    });

    it('should have empty className', () => {
      const icon = createRouteIcon('57');
      expect(icon.options.className).toBe('');
    });

    it('should handle edge cases', () => {
      expect(() => createRouteIcon('')).not.toThrow();
      expect(() => createRouteIcon('1')).not.toThrow();
      expect(() => createRouteIcon('Very Long Text That Exceeds Normal Limits')).not.toThrow();
    });
  });
});
