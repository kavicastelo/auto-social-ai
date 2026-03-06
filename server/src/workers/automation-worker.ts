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
            // Update last run
            await prisma.automationPipeline.update({
                where: { id: pipelineId },
                data: {
                    lastRunAt: new Date(),
                    runCount: { increment: 1 }
                }
            });

            // Extract config settings
            const config = pipeline.config as any || {};
            const topic = config.topic || 'Auto Social AI daily updates';
            const tone = config.tone || 'professional';
            const contentType = config.contentType || 'short post';
            const mediaTheme = config.mediaTheme || 'light';
            const quote = config.quote || 'Automation changes everything';

            // Build the flow for each platform
            for (const platform of pipeline.platforms) {
                // Find account
                const account = await prisma.socialAccount.findFirst({
                    where: { platform, workspaceId: pipeline.workspaceId }
                });

                if (!account) {
                    log.warn({ platform }, 'No connected account for platform, skipping flow');
                    continue;
                }

                // First, create the empty Content model that the flow will update
                const content = await prisma.content.create({
                    data: {
                        title: `Auto Pipeline: ${pipeline.name}`,
                        body: 'Generating...',
                        platform: platform,
                        status: 'draft',
                        tags: [],
                        authorId: 'system', // or the workspace owner, we can leave it empty if relations permit but author is required. Wait, we need a user ID. Let's find first user.
                        workspaceId: pipeline.workspaceId,
                    }
                }).catch(async (e) => {
                    // find a workspace member
                    const member = await prisma.workspaceMember.findFirst({ where: { workspaceId: pipeline.workspaceId } });
                    if (!member) throw e;

                    return prisma.content.create({
                        data: {
                            title: `Auto Pipeline: ${pipeline.name}`,
                            body: 'Generating...',
                            platform: platform,
                            status: 'draft',
                            tags: [],
                            authorId: member.userId,
                            workspaceId: pipeline.workspaceId,
                        }
                    });
                });

                // Schedule post right away
                // The schedule job waits until publishTime, but for automation we can assume immediate (delay 0)
                // If config has publishDelay in hours
                const publishTime = new Date();
                const delayMs = config.publishDelayHours ? (config.publishDelayHours * 3600000) : 0;
                publishTime.setTime(publishTime.getTime() + delayMs);

                const scheduledPost = await prisma.scheduledPost.create({
                    data: {
                        contentId: content.id,
                        accountId: account.id,
                        workspaceId: pipeline.workspaceId,
                        scheduledAt: publishTime,
                        status: 'queued',
                    }
                });

                const mediaId = `media-${Date.now()}`; // Just a placeholder, as we don't know the DB ID yet for real flow dependency injection

                // Using BullMQ Flows to orchestrate dependencies.
                // Publish relies on Content Generation (and potentially Media Generation)

                await autoSocialFlowProducer.add({
                    name: 'publish',
                    queueName: 'publish-post',
                    data: { scheduledPostId: scheduledPost.id },
                    opts: {
                        delay: Math.max(publishTime.getTime() - Date.now(), 0)
                    },
                    children: [
                        {
                            name: 'generate-content',
                            queueName: 'content-generation',
                            data: {
                                contentId: content.id,
                                topic,
                                platform,
                                tone,
                                contentType
                            }
                        },
                        // We could add media generation here as well if configured
                    ]
                });
            }

            log.info('Pipeline execution initiated successfully');
        } catch (error) {
            log.error({ err: error }, 'Failed to execute pipeline');
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
