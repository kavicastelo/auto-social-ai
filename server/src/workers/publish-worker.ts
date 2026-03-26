// =============================================================================
// Publish Post Worker
// =============================================================================
// Processes scheduled posts — publishes to the target social platform.
// =============================================================================

import { Worker, Job } from 'bullmq';
import { redisConnection } from '../services/redis.js';
import { prisma } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { decryptToken } from '../utils/crypto.js';
import { publishers } from '../providers/index.js';

interface PublishJobData {
    scheduledPostId: string;
}

export const publishWorker = new Worker<PublishJobData>(
    'publish-post',
    async (job: Job<PublishJobData>) => {
        const { scheduledPostId } = job.data;
        const log = logger.child({ worker: 'publish-post', jobId: job.id, scheduledPostId });

        if (job.name === 'finalize-approval') {
            log.info('Finalizing generation for approval-required post. Waiting for human intervention.');
            return;
        }

        log.info('Processing publish job');

        const post = await prisma.scheduledPost.findUnique({
            where: { id: scheduledPostId },
            include: { content: true, account: true, media: true },
        });

        if (!post) {
            log.warn('Scheduled post not found, skipping');
            return;
        }

        if (post.status === 'cancelled' || post.status === 'published') {
            log.info({ status: post.status }, 'Post already handled, skipping');
            return;
        }

        // Safety check: Don't publish if content is still "Generating..." or in error state
        const contentStatus = post.content.status as string;
        if (contentStatus === 'draft' || post.content.body === 'AI is generating...') {
            log.warn({ contentStatus }, 'Content is not ready for publishing, skipping');
            throw new Error('Content is still in draft or generating status');
        }

        if (contentStatus === 'failed') {
            log.error('Content has failed status, cannot publish');
            throw new Error('Associated content has a failed status');
        }

        try {
            // Mark as publishing
            await prisma.scheduledPost.update({
                where: { id: scheduledPostId },
                data: { status: 'publishing' },
            });

            // Use real platform API integration
            log.info(
                { platform: post.account.platform, username: post.account.platformUsername },
                'Publishing content to platform',
            );

            const publisher = publishers[post.account.platform];
            if (!publisher) {
                throw new Error(`No publisher found for platform: ${post.account.platform}`);
            }

            let finalContent = post.content.body;
            if (publisher.validateContent) {
                const isValid = publisher.validateContent(finalContent);
                if (!isValid) throw new Error(`Content validation failed for ${post.account.platform}`);
            }

            const formattedContent = publisher.formatContent(finalContent);
            const accessToken = decryptToken(post.account.accessToken);
            const refreshToken = post.account.refreshToken ? decryptToken(post.account.refreshToken) : undefined;

            const config = {
                accessToken,
                refreshToken,
                platformUserId: post.account.platformUserId,
                platformUsername: post.account.platformUsername
            };

            const publishResult = await publisher.publishPost(config, formattedContent, post.media?.url ? [post.media.url] : undefined);

            if (!publishResult.success) {
                const errorMessage = publishResult.error || 'Unknown publishing error';
                
                // Handle specific rate limit retry-after hints
                if (publishResult.retryAfter) {
                    log.warn({ retryAfter: publishResult.retryAfter }, 'Rate limit hit, delaying job');
                    const delayMs = publishResult.retryAfter * 1000;
                    
                    // Update post status to signal it's backing off
                    await prisma.scheduledPost.update({
                        where: { id: scheduledPostId },
                        data: { failureReason: `Rate limited. Retrying in ${publishResult.retryAfter}s.` },
                    });

                    // BullMQ 3+ method to delay current job
                    await job.moveToDelayed(Date.now() + delayMs, job.token);
                    return;
                }

                throw new Error(errorMessage);
            }

            // Mark as published
            await prisma.scheduledPost.update({
                where: { id: scheduledPostId },
                data: { 
                    status: 'published', 
                    publishedAt: new Date(),
                    externalId: publishResult.platformId 
                },
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
                    data: { 
                        contentId: post.contentId, 
                        accountId: post.accountId,
                        externalId: publishResult.platformId 
                    },
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
