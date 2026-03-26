// =============================================================================
// Analytics Aggregation Worker
// =============================================================================
// Periodically fetches real-time engagement metrics from social platforms.
// =============================================================================

import { Worker, Job } from 'bullmq';
import { redisConnection } from '../services/redis.js';
import { prisma } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { decryptToken } from '../utils/crypto.js';
import { publishers } from '../providers/index.js';
import { analyticsQueue } from '../queues/index.js';

interface AnalyticsJobData {
    workspaceId?: string;
}

export const analyticsWorker = new Worker<AnalyticsJobData>(
    'analytics-aggregation',
    async (job: Job<AnalyticsJobData>) => {
        const { workspaceId } = job.data;
        const log = logger.child({ worker: 'analytics-aggregation', jobId: job.id, workspaceId });
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 0. Master Dispatcher Job (no specific workspaceId)
        if (!workspaceId) {
            log.info('Running master analytics dispatcher');
            
            // Find distinct workspaces with active posts to sync
            const workspacesToSync = await prisma.scheduledPost.findMany({
                where: {
                    status: 'published',
                    externalId: { not: null },
                    publishedAt: { gte: thirtyDaysAgo }
                },
                select: { workspaceId: true },
                distinct: ['workspaceId']
            });

            for (const { workspaceId: wsId } of workspacesToSync) {
                await analyticsQueue.add('aggregate-workspace', { workspaceId: wsId });
            }

            log.info(`Dispatched analytics jobs for ${workspacesToSync.length} workspaces`);
            return;
        }

        log.info('Processing analytics aggregation job for workspace');

        // 1. Fetch published posts with an externalId in the last 30 days
        const publishedPosts = await prisma.scheduledPost.findMany({
            where: {
                workspaceId,
                status: 'published',
                externalId: { not: null },
                publishedAt: { gte: thirtyDaysAgo }
            },
            include: { account: true }
        });

        if (publishedPosts.length === 0) {
            log.info('No recently published posts to aggregate');
            return;
        }

        let updatedEvents = 0;

        // 2. Group by account for efficiency
        for (const post of publishedPosts) {
            try {
                const publisher = publishers[post.account.platform];
                if (!publisher || !publisher.fetchAnalytics) continue;

                const accessToken = decryptToken(post.account.accessToken);
                const refreshToken = post.account.refreshToken ? decryptToken(post.account.refreshToken) : undefined;
                
                const config = {
                    accessToken,
                    refreshToken,
                    platformUserId: post.account.platformUserId,
                    platformUsername: post.account.platformUsername
                };

                // Fetch real-time analytics
                const metrics = await publisher.fetchAnalytics(config, post.externalId!);

                // 3. Upsert or update an AnalyticsEvent representing this post's current engagement
                // Since `post_published` event was created when published, let's update it or create a new `post_engagement_update`
                // Actually, updating the existing 'post_published' data payload is easiest.
                const existingEvent = await prisma.analyticsEvent.findFirst({
                    where: {
                        event: 'post_published',
                        workspaceId,
                        platform: post.account.platform,
                        data: { path: ['externalId'], equals: post.externalId as string }
                    }
                });

                if (existingEvent) {
                    const currentData = existingEvent.data as any;
                    await prisma.analyticsEvent.update({
                        where: { id: existingEvent.id },
                        data: {
                            data: {
                                ...currentData,
                                reach: metrics.reach,
                                engagement: metrics.engagement,
                                clicks: metrics.clicks,
                                lastAggregatedAt: new Date().toISOString()
                            }
                        }
                    });
                    updatedEvents++;
                }
            } catch (error) {
                log.error({ err: error, postId: post.id }, 'Failed to fetch analytics for post');
            }
        }

        log.info({ updatedEvents }, 'Completed analytics aggregation job');
    },
    {
        connection: redisConnection as any,
        concurrency: 2,
    }
);

analyticsWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Analytics job completed');
});

analyticsWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Analytics job failed');
});
