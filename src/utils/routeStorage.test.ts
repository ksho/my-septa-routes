import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveRoutesToLocalStorage,
  getRoutesFromLocalStorage,
  resolveRoutes,
} from './routeStorage';

describe('routeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('saveRoutesToLocalStorage', () => {
    it('should save routes as a JSON array', () => {
      saveRoutesToLocalStorage(['42', '57']);

      expect(localStorage.getItem('savedRoutes')).toBe('["42","57"]');
    });

    it('should save an empty array', () => {
      saveRoutesToLocalStorage([]);

      expect(localStorage.getItem('savedRoutes')).toBe('[]');
    });

    it('should overwrite previously saved routes', () => {
      saveRoutesToLocalStorage(['42']);
      saveRoutesToLocalStorage(['57', '9']);

      expect(localStorage.getItem('savedRoutes')).toBe('["57","9"]');
    });

    it('should not throw when localStorage is unavailable', () => {
      const setItemSpy = vi
        .spyOn(Storage.prototype, 'setItem')
        .mockImplementation(() => {
          throw new Error('QuotaExceededError');
        });

      expect(() => saveRoutesToLocalStorage(['42'])).not.toThrow();

      setItemSpy.mockRestore();
    });
  });

  describe('getRoutesFromLocalStorage', () => {
    it('should return null when nothing is stored', () => {
      expect(getRoutesFromLocalStorage()).toBeNull();
    });

    it('should return saved routes', () => {
      localStorage.setItem('savedRoutes', '["42","57"]');

      expect(getRoutesFromLocalStorage()).toEqual(['42', '57']);
    });

    it('should coerce non-string elements to strings', () => {
      localStorage.setItem('savedRoutes', '[42, 57]');

      expect(getRoutesFromLocalStorage()).toEqual(['42', '57']);
    });

    it('should return null for an empty array', () => {
      localStorage.setItem('savedRoutes', '[]');

      expect(getRoutesFromLocalStorage()).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      localStorage.setItem('savedRoutes', 'not-json');

      expect(getRoutesFromLocalStorage()).toBeNull();
    });

    it('should return null for non-array JSON values', () => {
      localStorage.setItem('savedRoutes', '"just a string"');
      expect(getRoutesFromLocalStorage()).toBeNull();

      localStorage.setItem('savedRoutes', '{"routes": ["42"]}');
      expect(getRoutesFromLocalStorage()).toBeNull();

      localStorage.setItem('savedRoutes', '42');
      expect(getRoutesFromLocalStorage()).toBeNull();
    });

    it('should not throw when localStorage is unavailable', () => {
      const getItemSpy = vi
        .spyOn(Storage.prototype, 'getItem')
        .mockImplementation(() => {
          throw new Error('SecurityError');
        });

      expect(getRoutesFromLocalStorage()).toBeNull();

      getItemSpy.mockRestore();
    });
  });

  describe('resolveRoutes', () => {
    const defaults = ['1', '2', '3'];

    it('should return parsed URL routes when routesParam is provided', () => {
      const result = resolveRoutes('42,57', defaults);

      expect(result).toEqual(['42', '57']);
    });

    it('should trim whitespace from URL route values', () => {
      const result = resolveRoutes(' 42 , 57 ', defaults);

      expect(result).toEqual(['42', '57']);
    });

    it('should filter out empty segments from URL param', () => {
      const result = resolveRoutes('42,,57,', defaults);

      expect(result).toEqual(['42', '57']);
    });

    it('should save URL routes to localStorage as a side-effect', () => {
      resolveRoutes('42,57', defaults);

      expect(localStorage.getItem('savedRoutes')).toBe('["42","57"]');
    });

    it('should return routes from localStorage when no URL param', () => {
      localStorage.setItem('savedRoutes', '["9","12"]');

      const result = resolveRoutes(null, defaults);

      expect(result).toEqual(['9', '12']);
    });

    it('should return defaults when no URL param and nothing in localStorage', () => {
      const result = resolveRoutes(null, defaults);

      expect(result).toEqual(defaults);
    });

    it('should return defaults when localStorage has an empty array', () => {
      localStorage.setItem('savedRoutes', '[]');

      const result = resolveRoutes(null, defaults);

      expect(result).toEqual(defaults);
    });

    it('should prefer URL param over localStorage', () => {
      localStorage.setItem('savedRoutes', '["9","12"]');

      const result = resolveRoutes('42', defaults);

      expect(result).toEqual(['42']);
      // Also verify localStorage was overwritten with the URL value
      expect(localStorage.getItem('savedRoutes')).toBe('["42"]');
    });

    it('should handle route names with spaces (regional rail)', () => {
      const result = resolveRoutes('Airport Line,Paoli Thorndale', defaults);

      expect(result).toEqual(['Airport Line', 'Paoli Thorndale']);
    });
  });
});
