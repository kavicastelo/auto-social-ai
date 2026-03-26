// =============================================================================
// Media Types — Request / Response DTOs
// =============================================================================

import type { BaseEntity } from './common.js';

/** Supported media file types */
export type MediaType = 'image' | 'video' | 'gif';

export type MediaSource = 'user_upload' | 'ai_generated';

/** Media upload response */
export interface MediaAssetDTO extends BaseEntity {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    type: MediaType;
    source: MediaSource;
    hash: string | null;
    tags: string[];
    metadata: Record<string, any>;
    workspaceId: string;
}
