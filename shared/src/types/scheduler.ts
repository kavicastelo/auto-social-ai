// =============================================================================
// Scheduler Types — Request / Response DTOs
// =============================================================================

import type { BaseEntity, ISODateString } from './common.js';
import type { Platform } from './content.js';

/** Scheduled post status */
export type ScheduleStatus = 'pending' | 'queued' | 'publishing' | 'published' | 'failed' | 'cancelled';

/** Create scheduled post request */
export interface CreateScheduledPostRequest {
    contentId: string;
    platform?: string;
    accountId: string;
    publishTime: ISODateString;
}

/** Update scheduled post request */
export interface UpdateScheduledPostRequest {
    publishTime?: ISODateString;
    status?: ScheduleStatus;
}

/** Scheduled post DTO */
export interface ScheduledPostDTO extends BaseEntity {
    contentId: string;
    accountId: string;
    platform: Platform;
    content: string; // The draft content text
    scheduledAt: ISODateString;
    publishedAt: ISODateString | null;
    status: ScheduleStatus;
    failureReason: string | null;
}
