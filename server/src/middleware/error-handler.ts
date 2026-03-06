// =============================================================================
// Global Error Handler
// =============================================================================
// Catches all errors and returns a structured API response.
// Maps Zod validation errors to field-level details.
// =============================================================================

import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export function errorHandler(error: FastifyError, request: FastifyRequest, reply: FastifyReply): void {
    // ── Zod validation errors ────────────────────────────────────────────────
    if (error instanceof ZodError) {
        const details: Record<string, string[]> = {};
        for (const issue of error.issues) {
            const path = issue.path.join('.');
            details[path] = details[path] ?? [];
            details[path].push(issue.message);
        }
        sendError(reply, 400, {
            code: 'VALIDATION_ERROR',
            message: 'Request validation failed',
            details,
        });
        return;
    }

    // ── Application errors ───────────────────────────────────────────────────
    if (error instanceof AppError) {
        sendError(reply, error.statusCode, {
            code: error.code,
            message: error.message,
            details: error.details,
        });
        return;
    }

    // ── Fastify built-in errors (rate limit, payload too large, etc.) ───────
    if (error.statusCode && error.statusCode < 500) {
        sendError(reply, error.statusCode, {
            code: error.code ?? 'REQUEST_ERROR',
            message: error.message,
        });
        return;
    }

    // ── Unexpected / server errors ───────────────────────────────────────────
    logger.error({ err: error, url: request.url, method: request.method }, 'Unhandled server error');

    sendError(reply, 500, {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
    });
}
