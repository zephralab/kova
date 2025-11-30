import { NextResponse } from 'next/server';
import type { ApiErrorResponse } from '@/lib/types/api';

/**
 * Create a successful JSON response
 */
export function jsonResponse<T>(data: T, status = 200): NextResponse {
    return NextResponse.json(data, { status });
}

/**
 * Create an error JSON response
 */
export function errorResponse(
    message: string,
    status = 500,
    details?: string
): NextResponse<ApiErrorResponse> {
    return NextResponse.json(
        {
            error: message,
            ...(details && { details }),
        },
        { status }
    );
}

// Common error messages
export const ErrorMessages = {
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    NOT_FOUND: 'Resource not found',
    BAD_REQUEST: 'Invalid request',
    VALIDATION_ERROR: 'Validation failed',
    INTERNAL_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database operation failed',
} as const;
