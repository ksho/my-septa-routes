/**
 * Returns the base URL for API calls.
 *
 * - Web (dev + Vercel): empty string → relative URLs like `/api/vehicles`
 * - Native Capacitor build: NEXT_PUBLIC_API_BASE_URL → absolute Vercel URL
 *   so that the static export can still reach the server-side API routes.
 *
 * Set NEXT_PUBLIC_API_BASE_URL in `.env.mobile` (e.g. https://septa-live.vercel.app)
 * and pass it when running `npm run build:mobile`.
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

/**
 * Builds a full API path, prefixing with the base URL when needed.
 * Usage: apiPath('/api/vehicles?routes=17')
 */
export function apiPath(path: string): string {
  return `${API_BASE_URL}${path}`;
}
