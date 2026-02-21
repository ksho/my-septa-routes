const ROUTES_STORAGE_KEY = 'savedRoutes';

export function saveRoutesToLocalStorage(routes: string[]) {
  try {
    localStorage.setItem(ROUTES_STORAGE_KEY, JSON.stringify(routes));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function getRoutesFromLocalStorage(): string[] | null {
  try {
    const stored = localStorage.getItem(ROUTES_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(String);
      }
    }
  } catch {
    // Silently fail if localStorage is unavailable or data is corrupt
  }
  return null;
}

/**
 * Resolves which routes to use, in priority order:
 * 1. URL query params (routesParam)
 * 2. localStorage
 * 3. defaults
 *
 * Side-effect: when URL params are present, they are saved to localStorage.
 */
export function resolveRoutes(
  routesParam: string | null,
  defaults: string[],
): string[] {
  if (routesParam) {
    const routes = routesParam
      .split(',')
      .map((r) => r.trim())
      .filter((r) => r);
    saveRoutesToLocalStorage(routes);
    return routes;
  }
  const storedRoutes = getRoutesFromLocalStorage();
  if (storedRoutes) {
    return storedRoutes;
  }
  return defaults;
}
