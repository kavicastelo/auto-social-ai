// =============================================================================
// Publish Post Worker
// =============================================================================
// Processes scheduled posts — publishes to the target social platform.
// =============================================================================

import { Worker, Job } from 'bullmq';
import { redisConnection } from '../services/redis.js';
import { prisma } from '../database/index.js';
import { logger } from '../utils/logger.js';

interface PublishJobData {
    scheduledPostId: string;
}

export const publishWorker = new Worker<PublishJobData>(
    'publish-post',
    async (job: Job<PublishJobData>) => {
        const { scheduledPostId } = job.data;
        const log = logger.child({ worker: 'publish-post', jobId: job.id, scheduledPostId });

        log.info('Processing publish job');

        const post = await prisma.scheduledPost.findUnique({
            where: { id: scheduledPostId },
            include: { content: true, account: true },
        });

        if (!post) {
            log.warn('Scheduled post not found, skipping');
            return;
        }

        if (post.status === 'cancelled' || post.status === 'published') {
            log.info({ status: post.status }, 'Post already handled, skipping');
            return;
        }

        try {
            // Mark as publishing
            await prisma.scheduledPost.update({
                where: { id: scheduledPostId },
                data: { status: 'publishing' },
            });

            // TODO: Replace with actual platform API integration
            // For now, simulate a publish action
            log.info(
                { platform: post.account.platform, username: post.account.platformUsername },
                'Publishing content to platform',
            );

            // Simulate network delay
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // Mark as published
            await prisma.scheduledPost.update({
                where: { id: scheduledPostId },
                data: { status: 'published', publishedAt: new Date() },
            });

            // Update content status
            await prisma.content.update({
                where: { id: post.contentId },
                data: { status: 'published' },
            });

            // Log analytics event
            await prisma.analyticsEvent.create({
                data: {
                    event: 'post_published',
                    platform: post.account.platform,
                    workspaceId: post.workspaceId,
                    data: { contentId: post.contentId, accountId: post.accountId },
                },
            });

            log.info('Post published successfully');
        } catch (error) {
            log.error({ err: error }, 'Failed to publish post');

            await prisma.scheduledPost.update({
                where: { id: scheduledPostId },
                data: {
                    status: 'failed',
                    failureReason: error instanceof Error ? error.message : 'Unknown error',
                },
            });

            throw error; // Re-throw so BullMQ retries
        }
    },
    {
        connection: redisConnection as any,
        concurrency: 5,
    },
);

publishWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Publish job completed');
});

publishWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Publish job failed');
});
