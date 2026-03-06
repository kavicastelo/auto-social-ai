// =============================================================================
// Content Types — Request / Response DTOs
// =============================================================================

import type { BaseEntity, ISODateString } from './common.js';

/** Content status lifecycle */
export type ContentStatus = 'draft' | 'generated' | 'edited' | 'approved' | 'published' | 'archived';

/** Content platform target */
export type Platform = 'twitter' | 'instagram' | 'facebook' | 'linkedin' | 'tiktok';

/** Content generation request */
export interface GenerateContentRequest {
    prompt: string;
    platform: Platform;
    tone?: string;
    maxLength?: number;
}

/** Content edit request */
export interface EditContentRequest {
    title?: string;
    body?: string;
    status?: ContentStatus;
    platform?: Platform;
    tags?: string[];
}

/** Content DTO */
export interface ContentDTO extends BaseEntity {
    title: string;
    body: string;
    platform: Platform;
    status: ContentStatus;
    tags: string[];
    workspaceId: string;
    authorId: string;
    scheduledAt: ISODateString | null;
}
