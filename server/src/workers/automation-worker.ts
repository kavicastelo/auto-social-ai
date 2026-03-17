import { Worker, Job } from 'bullmq';
import { redisConnection } from '../services/redis.js';
import { prisma } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { autoSocialFlowProducer } from '../queues/index.js';

interface AutomationJobData {
    pipelineId: string;
}

export const automationWorker = new Worker<AutomationJobData>(
    'automation-pipeline',
    async (job: Job<AutomationJobData>) => {
        const { pipelineId } = job.data;
        const log = logger.child({ worker: 'automation-pipeline', jobId: job.id, pipelineId });

        log.info('Processing automation pipeline');

        const pipeline = await prisma.automationPipeline.findUnique({
            where: { id: pipelineId }
        });

        if (!pipeline) {
            log.warn('Pipeline not found, skipping');
            return;
        }

        if (pipeline.status !== 'active') {
            log.warn({ status: pipeline.status }, 'Pipeline not active, skipping');
            return;
        }

        try {
            // Find a valid author for the automated content (must be a real user)
            const workspaceMember = await prisma.workspaceMember.findFirst({
                where: { workspaceId: pipeline.workspaceId },
                include: { user: true }
            });

            if (!workspaceMember) {
                throw new Error(`No members found in workspace ${pipeline.workspaceId}. Cannot assign author.`);
            }

            const authorId = workspaceMember.userId;

            // Update last run stats
            await prisma.automationPipeline.update({
                where: { id: pipelineId },
                data: {
                    lastRunAt: new Date(),
                    runCount: { increment: 1 }
                }
            });

            const config = pipeline.config as any || {};
            const topic = config.topic || 'Auto Social AI daily updates';
            const tone = config.tone || 'Professional';
            const contentType = config.contentType || 'Social Media Post';

            // Build the flow for each platform
            for (const platform of pipeline.platforms) {
                // Find account for this platform in the workspace
                const account = await prisma.socialAccount.findFirst({
                    where: { platform, workspaceId: pipeline.workspaceId }
                });

                if (!account) {
                    log.warn({ platform }, 'No connected account for platform, skipping flow');
                    continue;
                }

                // 1. Create the content record (Initial state)
                const content = await prisma.content.create({
                    data: {
                        title: `Pipeline: ${pipeline.name}`,
                        body: 'AI is generating...',
                        platform: platform,
                        status: 'draft',
                        tags: [],
                        authorId,
                        workspaceId: pipeline.workspaceId,
                    }
                });

                // 2. Optional Media Asset (if configured)
                let mediaAssetId: string | undefined;
                if (config.generateMedia) {
                    const media = await prisma.mediaAsset.create({
                        data: {
                            filename: `temp-${Date.now()}.svg`,
                            originalName: 'Automation Quote',
                            mimeType: 'image/svg+xml',
                            size: 0,
                            url: '',
                            type: 'image',
                            workspaceId: pipeline.workspaceId,
                        }
                    });
                    mediaAssetId = media.id;
                }

                // 3. Create the scheduled post
                const publishTime = new Date();
                const delayMs = (config.publishDelayHours || 0) * 3600000;
                publishTime.setTime(publishTime.getTime() + delayMs);

                const scheduledPost = await prisma.scheduledPost.create({
                    data: {
                        contentId: content.id,
                        accountId: account.id,
                        workspaceId: pipeline.workspaceId,
                        scheduledAt: publishTime,
                        status: 'queued',
                        mediaAssetId,
                    }
                });

                // 4. Orchestrate the Flow: Generate Content + (Optional Media) -> Publish
                const children = [
                    {
                        name: 'generate-content',
                        queueName: 'content-generation',
                        data: {
                            contentId: content.id,
                            topic,
                            platform,
                            tone,
                            contentType,
                            action: 'regenerate'
                        }
                    }
                ];

                if (mediaAssetId) {
                    children.push({
                        name: 'media-generation',
                        queueName: 'media-generation',
                        data: {
                            mediaAssetId,
                            quote: config.quote || topic,
                            theme: config.mediaTheme || 'light',
                            author: pipeline.name
                        } as any
                    });
                }

                await autoSocialFlowProducer.add({
                    name: 'publish-post',
                    queueName: 'publish-post',
                    data: { scheduledPostId: scheduledPost.id },
                    opts: {
                        delay: Math.max(publishTime.getTime() - Date.now(), 0),
                        removeOnComplete: true
                    },
                    children
                });

                log.info({ platform, contentId: content.id, hasMedia: !!mediaAssetId }, 'Flow enqueued successfully');
            }

            log.info('Pipeline execution initiated successfully');
        } catch (error) {
            log.error({ err: error }, 'Failed to execute pipeline');
            
            // Mark pipeline as errored in the database
            await prisma.automationPipeline.update({
                where: { id: pipelineId },
                data: { status: 'failed' as any }
            });

            throw error;
        }
    },
    {
        connection: redisConnection as any,
        concurrency: 2,
    },
);

automationWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Automation pipeline job completed');
});

automationWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Automation pipeline job failed');
});
