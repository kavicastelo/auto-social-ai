// =============================================================================
// Media Types — Request / Response DTOs
// =============================================================================

import type { BaseEntity } from './common.js';

/** Supported media file types */
export type MediaType = 'image' | 'video' | 'gif';

/** Media upload response */
export interface MediaAssetDTO extends BaseEntity {
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
    url: string;
    type: MediaType;
    workspaceId: string;
}
