// =============================================================================
// API Response Envelope
// =============================================================================
// Every API response follows this structure for consistency.
// =============================================================================

/** Standard API response wrapper */
export interface ApiResponse<T = unknown> {
    success: boolean;
    data: T | null;
    error: ApiError | null;
    meta?: PaginationMeta;
}

/** Structured error payload */
export interface ApiError {
    code: string;
    message: string;
    details?: Record<string, string[]>;
}

/** Pagination metadata */
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

/** Pagination query parameters */
export interface PaginationQuery {
    page?: number;
    limit?: number;
}
