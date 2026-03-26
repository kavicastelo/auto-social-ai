import { Worker, Job } from 'bullmq';
import { redisConnection } from '../services/redis.js';
import { prisma } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { autoSocialFlowProducer } from '../queues/index.js';
import Parser from 'rss-parser';

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
            const nodes = config.nodes || [];

            let topic = config.topic || 'CreatorGene daily updates';
            const tone = config.tone || 'Professional';
            const contentType = config.contentType || 'Social Media Post';

            // 1. Resolve RSS inputs 
            const rssNode = nodes.find((n: any) => n.type === 'rss');
            if (rssNode && rssNode.config?.url) {
                try {
                    const parser = new (Parser as any)();
                    const feed = await parser.parseURL(rssNode.config.url);
                    const entry = feed.items[0];
                    if (entry) {
                        log.info({ rssTitle: entry.title }, 'RSS item resolved');
                        topic = `News Title: ${entry.title}. Summary: ${entry.snippet || entry.contentSnippet || ''}. User Intent: ${topic}`;
                    }
                } catch (rssError) {
                    log.error({ err: rssError }, 'RSS fetch failed, continuing with default topic');
                }
            }

            // 2. Resolve Format inputs (Suffix)
            const formatNode = nodes.find((n: any) => n.type === 'format');
            const suffix = formatNode?.config?.suffix || '';

            // Initial states based on DAG presence
            const generateAiMedia = nodes.some((n: any) => n.type === 'image');
            const useLibraryMedia = nodes.some((n: any) => n.type === 'rss'); // rss also acts as library hint if user media is needed
            const generateAiText = nodes.some((n: any) => n.type === 'ai');
            const requireApproval = nodes.some((n: any) => n.type === 'approval');

            log.info({ generateAiMedia, useLibraryMedia, generateAiText, requireApproval, hasSuffix: !!suffix }, 'Pipeline configuration resolved');

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
                        body: generateAiText ? 'AI is generating...' : (config.manualBody || 'Check out our latest update!'),
                        platform: platform,
                        status: 'draft',
                        tags: [],
                        authorId,
                        workspaceId: pipeline.workspaceId,
                    }
                });

                // 2. Media Asset Resolution
                let mediaAssetId: string | undefined;
                let activeGenerateAiMedia = generateAiMedia;

                if (useLibraryMedia) {
                    const candidateMedia = await prisma.mediaAsset.findFirst({
                        where: {
                            workspaceId: pipeline.workspaceId,
                            source: 'user_upload',
                        },
                        orderBy: { updatedAt: 'asc' },
                    });

                    if (candidateMedia) {
                        mediaAssetId = candidateMedia.id;
                        await prisma.mediaAsset.update({
                            where: { id: mediaAssetId },
                            data: { updatedAt: new Date() }
                        });
                        log.info({ mediaAssetId }, 'Selected user media from library');
                    } else if (config.fallbackToAiMedia) {
                        activeGenerateAiMedia = true;
                    }
                }

                if (activeGenerateAiMedia && !mediaAssetId) {
                    const media = await prisma.mediaAsset.create({
                        data: {
                            filename: `temp-${Date.now()}.png`,
                            originalName: 'Automation Graphic',
                            mimeType: 'image/png',
                            size: 0,
                            url: '',
                            type: 'image',
                            source: 'ai_generated',
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
                        status: requireApproval ? 'pending_approval' : 'queued',
                        mediaAssetId,
                    }
                });

                // 4. Orchestrate the Flow: Generate Content + (Optional Media) -> Publish
                const children: any[] = [];

                if (generateAiText) {
                    children.push({
                        name: 'generate-content',
                        queueName: 'content-generation',
                        data: {
                            contentId: content.id,
                            topic,
                            platform,
                            tone,
                            contentType,
                            action: 'regenerate',
                            referenceMediaId: mediaAssetId,
                            suffix
                        }
                    });
                }

                if (activeGenerateAiMedia && mediaAssetId) {
                    children.push({
                        name: 'media-generation',
                        queueName: 'media-generation',
                        data: {
                            mediaAssetId,
                            quote: config.quote || topic,
                            theme: config.mediaTheme || 'light',
                            author: pipeline.name,
                            style: config.mediaStyle || 'vivid',
                            size: config.mediaSize || '1024x1024'
                        }
                    });
                }

                const parentJobName = requireApproval ? 'finalize-approval' : 'publish-post';

                await autoSocialFlowProducer.add({
                    name: parentJobName,
                    queueName: 'publish-post',
                    data: { scheduledPostId: scheduledPost.id },
                    opts: {
                        delay: requireApproval ? 0 : Math.max(publishTime.getTime() - Date.now(), 0),
                        removeOnComplete: true
                    },
                    children
                });

                log.info({ platform, contentId: content.id, hasMedia: !!mediaAssetId }, 'Flow enqueued successfully');
            }

            log.info('Pipeline execution initiated successfully');
        } catch (error) {
            log.error({ err: error }, 'Failed to execute pipeline');

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
