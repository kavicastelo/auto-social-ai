// =============================================================================
// Application Error Classes
// =============================================================================
// Custom error hierarchy for structured error handling.
// =============================================================================

export class AppError extends Error {
    constructor(
        public readonly statusCode: number,
        public readonly code: string,
        message: string,
        public readonly details?: Record<string, string[]>,
    ) {
        super(message);
        this.name = 'AppError';
    }
}

export class BadRequestError extends AppError {
    constructor(message: string, details?: Record<string, string[]>) {
        super(400, 'BAD_REQUEST', message, details);
        this.name = 'BadRequestError';
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = 'Authentication required') {
        super(401, 'UNAUTHORIZED', message);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends AppError {
    constructor(message = 'Insufficient permissions') {
        super(403, 'FORBIDDEN', message);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends AppError {
    constructor(resource: string) {
        super(404, 'NOT_FOUND', `${resource} not found`);
        this.name = 'NotFoundError';
    }
}

export class ConflictError extends AppError {
    constructor(message: string) {
        super(409, 'CONFLICT', message);
        this.name = 'ConflictError';
    }
}
