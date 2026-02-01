/**
 * Utilities for creating standardized API responses
 * with consistent error handling and CORS headers.
 */

import { NextResponse } from 'next/server';
import { getCorsHeaders } from './corsHeaders';

/**
 * Standard error response structure
 */
export interface ApiErrorResponse {
  error: string;
  details?: string;
  statusCode?: number;
}

/**
 * Creates a successful JSON response with CORS headers
 *
 * @param data - The data to return in the response
 * @param status - HTTP status code (default: 200)
 * @returns NextResponse with JSON data and CORS headers
 *
 * @example
 * ```ts
 * return createSuccessResponse({ routes: [] });
 * ```
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, {
    status,
    headers: getCorsHeaders(),
  });
}

/**
 * Creates an error response with CORS headers
 *
 * @param message - Error message to return to client
 * @param status - HTTP status code (default: 500)
 * @param details - Optional additional error details
 * @returns NextResponse with error structure and CORS headers
 *
 * @example
 * ```ts
 * return createErrorResponse('Route parameter is required', 400);
 * ```
 */
export function createErrorResponse(
  message: string,
  status: number = 500,
  details?: string
): NextResponse<ApiErrorResponse> {
  const errorResponse: ApiErrorResponse = {
    error: message,
    statusCode: status,
  };

  if (details) {
    errorResponse.details = details;
  }

  return NextResponse.json(errorResponse, {
    status,
    headers: getCorsHeaders(),
  });
}

/**
 * Logs an error and creates an error response
 *
 * @param context - Context string for the error (e.g., 'fetching SEPTA data')
 * @param error - The error that occurred
 * @param status - HTTP status code (default: 500)
 * @returns NextResponse with error structure
 *
 * @example
 * ```ts
 * catch (error) {
 *   return handleApiError('fetching transit data', error);
 * }
 * ```
 */
export function handleApiError(
  context: string,
  error: unknown,
  status: number = 500
): NextResponse<ApiErrorResponse> {
  console.error(`Error ${context}:`, error);

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';

  return createErrorResponse(
    `Failed to ${context}`,
    status,
    message
  );
}
