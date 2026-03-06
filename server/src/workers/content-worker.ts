import { Worker, Job } from 'bullmq';
import { redisConnection } from '../services/redis.js';
import { prisma } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/index.js';
import OpenAI from 'openai';

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

interface ContentJobData {
    contentId: string;
    topic: string;
    platform: string;
    tone?: string;
    contentType: string;
}

export const contentWorker = new Worker<ContentJobData>(
    'content-generation',
    async (job: Job<ContentJobData>) => {
        const { contentId, topic, platform, tone, contentType } = job.data;
        const log = logger.child({ worker: 'content-generation', jobId: job.id, contentId });

        log.info('Processing content generation job');

        try {
            const prompt = `Write a ${tone ? tone + ' ' : ''}${contentType} for ${platform} about the following topic:\n\n${topic}\n\nPlease generate highly engaging, professional text.`;

            const completion = await openai.chat.completions.create({
                model: 'gpt-3.5-turbo',
                messages: [{ role: 'user', content: prompt }],
            });

            const generatedBody = completion.choices[0]?.message?.content || 'Failed to generate content.';

            await prisma.content.update({
                where: { id: contentId },
                data: {
                    body: generatedBody,
                    status: 'generated',
                },
            });

            // Log analytics event
            const content = await prisma.content.findUnique({ where: { id: contentId } });
            if (content) {
                await prisma.analyticsEvent.create({
                    data: {
                        event: 'content_generated',
                        platform: content.platform,
                        workspaceId: content.workspaceId,
                        data: { contentId: content.id, platform },
                    },
                });
            }

            log.info('Content generated successfully');
        } catch (error) {
            log.error({ err: error }, 'Failed to generate content');

            await prisma.content.update({
                where: { id: contentId },
                data: {
                    status: 'error' as any,
                },
            });
            throw error;
        }
    },
    {
        connection: redisConnection as any,
        concurrency: 2,
    },
);

contentWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Content generation job completed');
});

contentWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Content generation job failed');
});
