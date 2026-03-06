// =============================================================================
// Accounts Types — Request / Response DTOs
// =============================================================================

import type { BaseEntity } from './common.js';
import type { Platform } from './content.js';

/** Social account connection status */
export type AccountStatus = 'connected' | 'disconnected' | 'expired' | 'error';

/** Connect social account request */
export interface ConnectAccountRequest {
    platform: Platform;
    accessToken: string;
    refreshToken?: string;
    platformUserId: string;
    platformUsername: string;
}

/** Social account DTO */
export interface SocialAccountDTO extends BaseEntity {
    platform: Platform;
    platformUsername: string;
    platformUserId: string;
    status: AccountStatus;
    avatarUrl: string | null;
    workspaceId: string;
}
