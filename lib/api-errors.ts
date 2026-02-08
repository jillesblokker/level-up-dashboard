/**
 * API Error Handling Utilities
 * 
 * Standardized error handling for API routes with consistent response formats,
 * error logging, and user-friendly messages.
 */

import { NextResponse } from 'next/server';
import { apiLogger } from './logger';

// Error codes for common scenarios
export enum ApiErrorCode {
    // Authentication
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',

    // Validation
    INVALID_REQUEST = 'INVALID_REQUEST',
    MISSING_FIELD = 'MISSING_FIELD',
    INVALID_FORMAT = 'INVALID_FORMAT',

    // Database
    NOT_FOUND = 'NOT_FOUND',
    DUPLICATE = 'DUPLICATE',
    DB_ERROR = 'DB_ERROR',

    // Rate limiting
    RATE_LIMITED = 'RATE_LIMITED',
    TIMEOUT = 'TIMEOUT',

    // General
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
}

// HTTP status codes
const STATUS_CODES: Record<ApiErrorCode, number> = {
    [ApiErrorCode.UNAUTHORIZED]: 401,
    [ApiErrorCode.FORBIDDEN]: 403,
    [ApiErrorCode.INVALID_REQUEST]: 400,
    [ApiErrorCode.MISSING_FIELD]: 400,
    [ApiErrorCode.INVALID_FORMAT]: 400,
    [ApiErrorCode.NOT_FOUND]: 404,
    [ApiErrorCode.DUPLICATE]: 409,
    [ApiErrorCode.DB_ERROR]: 500,
    [ApiErrorCode.RATE_LIMITED]: 429,
    [ApiErrorCode.TIMEOUT]: 408,
    [ApiErrorCode.INTERNAL_ERROR]: 500,
    [ApiErrorCode.SERVICE_UNAVAILABLE]: 503,
};

// User-friendly error messages
const ERROR_MESSAGES: Record<ApiErrorCode, string> = {
    [ApiErrorCode.UNAUTHORIZED]: 'Authentication required. Please sign in.',
    [ApiErrorCode.FORBIDDEN]: 'You do not have permission to perform this action.',
    [ApiErrorCode.INVALID_REQUEST]: 'The request was invalid. Please check your input.',
    [ApiErrorCode.MISSING_FIELD]: 'Required fields are missing.',
    [ApiErrorCode.INVALID_FORMAT]: 'Invalid data format.',
    [ApiErrorCode.NOT_FOUND]: 'The requested resource was not found.',
    [ApiErrorCode.DUPLICATE]: 'This resource already exists.',
    [ApiErrorCode.DB_ERROR]: 'A database error occurred. Please try again.',
    [ApiErrorCode.RATE_LIMITED]: 'Too many requests. Please wait before trying again.',
    [ApiErrorCode.TIMEOUT]: 'The request timed out. Please try again.',
    [ApiErrorCode.INTERNAL_ERROR]: 'An internal error occurred. Please try again.',
    [ApiErrorCode.SERVICE_UNAVAILABLE]: 'The service is temporarily unavailable.',
};

interface ApiErrorResponse {
    error: string;
    code: ApiErrorCode;
    details?: string;
    timestamp: string;
}

/**
 * Create a standardized error response
 */
export function apiError(
    code: ApiErrorCode,
    details?: string,
    context?: string
): NextResponse<ApiErrorResponse> {
    const status = STATUS_CODES[code];
    const message = ERROR_MESSAGES[code];

    // Log the error
    const logContext = context || 'API';
    if (status >= 500) {
        apiLogger.error(`[${logContext}] ${code}: ${details || message}`);
    } else if (status >= 400) {
        apiLogger.warn(`[${logContext}] ${code}: ${details || message}`);
    }

    const responseBody: ApiErrorResponse = {
        error: message,
        code,
        timestamp: new Date().toISOString(),
    };

    if (details) {
        responseBody.details = details;
    }

    return NextResponse.json(responseBody, { status });
}

/**
 * Wrap an async handler with error catching
 */
export function withErrorHandler<T>(
    handler: () => Promise<T>,
    context?: string
): Promise<T | NextResponse<ApiErrorResponse>> {
    return handler().catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Check for specific error types
        if (errorMessage.includes('timeout') || errorMessage.includes('Timeout')) {
            return apiError(ApiErrorCode.TIMEOUT, errorMessage, context);
        }

        if (errorMessage.includes('duplicate') || errorMessage.includes('unique constraint')) {
            return apiError(ApiErrorCode.DUPLICATE, errorMessage, context);
        }

        if (errorMessage.includes('not found') || errorMessage.includes('PGRST116')) {
            return apiError(ApiErrorCode.NOT_FOUND, errorMessage, context);
        }

        // Default to internal error
        return apiError(ApiErrorCode.INTERNAL_ERROR, errorMessage, context);
    });
}

/**
 * Helper for common validation errors
 */
export function validationError(
    field: string,
    message?: string
): NextResponse<ApiErrorResponse> {
    return apiError(
        ApiErrorCode.MISSING_FIELD,
        message || `Missing or invalid field: ${field}`,
        'Validation'
    );
}

/**
 * Helper for unauthorized errors
 */
export function unauthorizedError(
    message?: string
): NextResponse<ApiErrorResponse> {
    return apiError(
        ApiErrorCode.UNAUTHORIZED,
        message,
        'Auth'
    );
}

/**
 * Helper for not found errors
 */
export function notFoundError(
    resource: string
): NextResponse<ApiErrorResponse> {
    return apiError(
        ApiErrorCode.NOT_FOUND,
        `${resource} not found`,
        'Resource'
    );
}

/**
 * Success response helper for consistency
 */
export function apiSuccess<T>(
    data: T,
    options?: {
        status?: number;
        headers?: Record<string, string>;
    }
): NextResponse<T> {
    const { status = 200, headers = {} } = options || {};

    return NextResponse.json(data, {
        status,
        headers: {
            // Prevent caching by default for API responses
            'Cache-Control': 'no-store',
            ...headers,
        },
    });
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
    data: T[],
    options: {
        page: number;
        pageSize: number;
        total: number;
    }
): NextResponse<{
    data: T[];
    pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
        hasMore: boolean;
    };
}> {
    const { page, pageSize, total } = options;
    const totalPages = Math.ceil(total / pageSize);
    const hasMore = page < totalPages;

    return apiSuccess({
        data,
        pagination: {
            page,
            pageSize,
            total,
            totalPages,
            hasMore,
        },
    });
}

/**
 * Check if user is authorized (returns early if not)
 */
export function requireAuth(
    userId: string | null | undefined
): NextResponse<ApiErrorResponse> | null {
    if (!userId) {
        return unauthorizedError();
    }
    return null; // User is authorized, continue
}

/**
 * Validate required fields in request body
 */
export function requireFields<T extends Record<string, unknown>>(
    body: T,
    fields: (keyof T)[]
): NextResponse<ApiErrorResponse> | null {
    for (const field of fields) {
        if (body[field] === undefined || body[field] === null || body[field] === '') {
            return validationError(String(field));
        }
    }
    return null; // All fields present
}
