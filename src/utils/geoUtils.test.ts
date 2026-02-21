import { describe, it, expect } from 'vitest';
import { distanceMiles } from './geoUtils';

describe('distanceMiles', () => {
  it('calculates distance between Philadelphia City Hall and Liberty Bell (known ~0.8 miles)', () => {
    const cityHall = { lat: 39.9526, lng: -75.1652 };
    const libertyBell = { lat: 39.9496, lng: -75.1503 };
    const distance = distanceMiles(cityHall, libertyBell);

    // Should be approximately 0.7-0.9 miles
    expect(distance).toBeGreaterThan(0.7);
    expect(distance).toBeLessThan(0.9);
  });

  it('returns 0 for identical points', () => {
    const point = { lat: 39.9526, lng: -75.1652 };
    const distance = distanceMiles(point, point);

    expect(distance).toBe(0);
  });

  it('calculates distance between Philadelphia and New York (known ~80 miles)', () => {
    const philadelphia = { lat: 39.9526, lng: -75.1652 };
    const newYork = { lat: 40.7128, lng: -74.006 };
    const distance = distanceMiles(philadelphia, newYork);

    // Should be approximately 80-90 miles
    expect(distance).toBeGreaterThan(75);
    expect(distance).toBeLessThan(95);
  });

  it('calculates small distances accurately (within 0.1 miles threshold)', () => {
    const start = { lat: 39.9526, lng: -75.1652 };
    // Point approximately 0.06 miles east
    const nearby = { lat: 39.9526, lng: -75.1640 };
    const distance = distanceMiles(start, nearby);

    expect(distance).toBeGreaterThan(0.05);
    expect(distance).toBeLessThan(0.07);
  });

  it('handles negative longitude correctly', () => {
    const point1 = { lat: 39.9526, lng: -75.1652 };
    const point2 = { lat: 39.9500, lng: -75.1600 };
    const distance = distanceMiles(point1, point2);

    expect(distance).toBeGreaterThan(0);
    expect(distance).toBeLessThan(1);
  });

  it('is commutative (distance A to B equals B to A)', () => {
    const pointA = { lat: 39.9526, lng: -75.1652 };
    const pointB = { lat: 39.9496, lng: -75.1503 };

    const distanceAB = distanceMiles(pointA, pointB);
    const distanceBA = distanceMiles(pointB, pointA);

    expect(distanceAB).toBeCloseTo(distanceBA, 10);
  });

  it('handles equator crossing (if needed for future expansion)', () => {
    const northHemisphere = { lat: 1, lng: 0 };
    const southHemisphere = { lat: -1, lng: 0 };
    const distance = distanceMiles(northHemisphere, southHemisphere);

    // Should be approximately 138 miles (2 degrees of latitude)
    expect(distance).toBeGreaterThan(130);
    expect(distance).toBeLessThan(145);
  });
});
