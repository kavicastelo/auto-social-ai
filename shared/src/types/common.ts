// =============================================================================
// Common Types
// =============================================================================

/** ISO 8601 date string */
export type ISODateString = string;

/** Base entity with timestamps */
export interface BaseEntity {
    id: string;
    createdAt: ISODateString;
    updatedAt: ISODateString;
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc';
