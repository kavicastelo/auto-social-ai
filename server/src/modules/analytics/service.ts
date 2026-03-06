// =============================================================================
// Analytics Module — Service
// =============================================================================

import { prisma, type Platform } from '../../database/index.js';
import type { AnalyticsQueryInput } from './schema.js';
import type { AnalyticsOverviewDTO, PlatformMetrics, DailyMetric } from '@auto-social-ai/shared';

/** Get analytics overview for a workspace */
export async function getOverview(
    query: AnalyticsQueryInput,
    workspaceId: string,
): Promise<AnalyticsOverviewDTO> {
    const where: Record<string, unknown> = { workspaceId };

    if (query.startDate || query.endDate) {
        where.createdAt = {
            ...(query.startDate && { gte: new Date(query.startDate) }),
            ...(query.endDate && { lte: new Date(query.endDate) }),
        };
    }

    if (query.platform) {
        where.platform = query.platform as Platform;
    }

    // Fetch all analytics events for the workspace
    const events = await prisma.analyticsEvent.findMany({
        where: where as any,
        orderBy: { createdAt: 'asc' },
    });

    // Aggregate totals
    let totalPosts = 0;
    let totalEngagement = 0;
    let totalReach = 0;
    let totalClicks = 0;

    const platformMap = new Map<string, PlatformMetrics>();
    const dailyMap = new Map<string, DailyMetric>();

    for (const event of events) {
        const data = event.data as Record<string, number>;

        if (event.event === 'post_published') totalPosts++;
        totalEngagement += data.engagement ?? 0;
        totalReach += data.reach ?? 0;
        totalClicks += data.clicks ?? 0;

        // Platform breakdown
        const existing = platformMap.get(event.platform) ?? {
            platform: event.platform as PlatformMetrics['platform'],
            posts: 0,
            engagement: 0,
            reach: 0,
            clicks: 0,
        };
        if (event.event === 'post_published') existing.posts++;
        existing.engagement += data.engagement ?? 0;
        existing.reach += data.reach ?? 0;
        existing.clicks += data.clicks ?? 0;
        platformMap.set(event.platform, existing);

        // Daily metrics
        const dateKey = event.createdAt.toISOString().split('T')[0];
        const daily = dailyMap.get(dateKey) ?? {
            date: dateKey,
            posts: 0,
            engagement: 0,
            reach: 0,
        };
        if (event.event === 'post_published') daily.posts++;
        daily.engagement += data.engagement ?? 0;
        daily.reach += data.reach ?? 0;
        dailyMap.set(dateKey, daily);
    }

    return {
        totalPosts,
        totalEngagement,
        totalReach,
        totalClicks,
        platformBreakdown: Array.from(platformMap.values()),
        dailyMetrics: Array.from(dailyMap.values()),
    };
}
