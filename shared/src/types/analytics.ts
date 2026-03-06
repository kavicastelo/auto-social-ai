// =============================================================================
// Analytics Types — Request / Response DTOs
// =============================================================================

import type { ISODateString } from './common.js';
import type { Platform } from './content.js';

/** Analytics overview response */
export interface AnalyticsOverviewDTO {
    totalPosts: number;
    totalEngagement: number;
    totalReach: number;
    totalClicks: number;
    platformBreakdown: PlatformMetrics[];
    dailyMetrics: DailyMetric[];
}

/** Per-platform aggregated metrics */
export interface PlatformMetrics {
    platform: Platform;
    posts: number;
    engagement: number;
    reach: number;
    clicks: number;
}

/** Daily aggregated metric */
export interface DailyMetric {
    date: ISODateString;
    posts: number;
    engagement: number;
    reach: number;
}

/** Analytics query filters */
export interface AnalyticsQuery {
    startDate?: ISODateString;
    endDate?: ISODateString;
    platform?: Platform;
}
