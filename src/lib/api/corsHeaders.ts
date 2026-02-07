/**
 * CORS (Cross-Origin Resource Sharing) headers configuration
 * for API routes.
 *
 * These headers allow the API to be accessed from different origins,
 * which is necessary for the Next.js application to communicate with
 * the API routes.
 */

/**
 * Standard CORS headers applied to all API responses
 */
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

/**
 * Creates a Headers object with CORS configuration
 *
 * @returns Headers object with CORS settings
 * @example
 * ```ts
 * return NextResponse.json(data, {
 *   headers: createCorsHeaders()
 * });
 * ```
 */
export function createCorsHeaders(): Headers {
  const headers = new Headers();

  Object.entries(CORS_HEADERS).forEach(([key, value]) => {
    headers.set(key, value);
  });

  return headers;
}

/**
 * Gets CORS headers as a plain object for use with NextResponse
 *
 * @returns Plain object with CORS headers
 * @example
 * ```ts
 * return NextResponse.json(data, {
 *   headers: getCorsHeaders()
 * });
 * ```
 */
export function getCorsHeaders(): Record<string, string> {
  return { ...CORS_HEADERS };
}
