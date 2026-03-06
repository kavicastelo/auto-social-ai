// =============================================================================
// API Response Helpers
// =============================================================================
// Standardizes all API responses into the { success, data, error } envelope.
// =============================================================================

import type { FastifyReply } from 'fastify';
import type { ApiResponse, ApiError, PaginationMeta } from '@auto-social-ai/shared';

/** Send a success response */
export function sendSuccess<T>(reply: FastifyReply, data: T, statusCode = 200, meta?: PaginationMeta): void {
    const response: ApiResponse<T> = { success: true, data, error: null, meta };
    reply.status(statusCode).send(response);
}

/** Send an error response */
export function sendError(reply: FastifyReply, statusCode: number, error: ApiError): void {
    const response: ApiResponse = { success: false, data: null, error };
    reply.status(statusCode).send(response);
}
