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
        const { contentId, topic, platform, tone, contentType, action } = job.data as any;
        const log = logger.child({ worker: 'content-generation', jobId: job.id, contentId });

        const platformLimits: Record<string, number> = {
            twitter: 280,
            linkedin: 3000,
            instagram: 2200,
            facebook: 5000,
            tiktok: 2200,
            google: 5000
        };

        const maxCharLimit = platformLimits[platform.toLowerCase()] || 2000;

        log.info({ action: job.name }, 'Processing content generation/refinement job');

        try {
            // 1. Caching Mechanism: Skip AI if similar content was generated recently
            const cacheKey = `ai_cache:${Buffer.from(`${topic}:${platform}:${tone}:${contentType}:${action}`).toString('base64')}`;
            const cachedResult = await redisConnection.get(cacheKey);

            if (cachedResult && job.name !== 'refine-content') {
                log.info('Using cached AI response');
                const result = JSON.parse(cachedResult);
                await prisma.content.update({
                    where: { id: contentId },
                    data: {
                        body: result.body,
                        tags: result.tags,
                        status: 'generated',
                    },
                });
                return;
            }

            let prompt = '';
            
            const jsonInstruction = `\n\nRespond ONLY with a valid JSON object. 
Format: { "body": "your content here", "tags": ["tag1", "tag2"] }
Do not include any other text or markdown formatting. Use relevant hashtags as tags.
STRICT LIMIT: The body must be under ${maxCharLimit} characters.`;

            if (job.name === 'refine-content') {
                const existing = await prisma.content.findUnique({ where: { id: contentId } });
                const currentBody = existing?.body || '';
                
                switch (action) {
                    case 'improve':
                        prompt = `Improve this ${platform} post to be more engaging and professional. ${jsonInstruction}\n\nContent: ${currentBody}`;
                        break;
                    case 'shorten':
                        prompt = `Shorten this ${platform} post while keeping the main message. ${jsonInstruction}\n\nContent: ${currentBody}`;
                        break;
                    case 'expand':
                        prompt = `Expand this ${platform} post with more details and insights. ${jsonInstruction}\n\nContent: ${currentBody}`;
                        break;
                    case 'regenerate':
                        prompt = `Write a completely new ${tone || 'Professional'} ${contentType || 'post'} for ${platform} about: ${topic}. ${jsonInstruction}`;
                        break;
                    default:
                        prompt = `Refine this post: ${currentBody}. ${jsonInstruction}`;
                }
            } else {
                prompt = `Write a ${tone || 'Professional'} ${contentType || 'post'} for ${platform} about the following topic:\n\n${topic}\n\n${jsonInstruction}`;
            }

            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a social media expert. You MUST output ONLY valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: 'json_object' },
                max_tokens: Math.ceil(maxCharLimit / 2), // Efficient token usage
                temperature: 0.7,
            });

            const rawContent = completion.choices[0]?.message?.content || '{}';
            let result;
            try {
                result = JSON.parse(rawContent);
            } catch (e) {
                log.error({ rawContent }, 'Failed to parse AI JSON response');
                throw new Error('AI returned invalid JSON');
            }

            const generatedBody = result.body || result.content || 'Failed to generate content.';
            const generatedTags = Array.isArray(result.tags) ? result.tags : [];

            // 2. Store in cache for 24 hours to avoid duplicate costs
            if (job.name !== 'refine-content') {
                await redisConnection.set(cacheKey, JSON.stringify({ body: generatedBody, tags: generatedTags }), 'EX', 86400);
            }

            await prisma.content.update({
                where: { id: contentId },
                data: {
                    body: generatedBody,
                    tags: generatedTags,
                    status: 'generated',
                },
            });

            // Log analytics event
            const content = await prisma.content.findUnique({ where: { id: contentId } });
            if (content) {
                await prisma.analyticsEvent.create({
                    data: {
                        event: job.name === 'refine-content' ? 'content_refined' : 'content_generated',
                        platform: content.platform,
                        workspaceId: content.workspaceId,
                        data: { contentId: content.id, platform, action, tagsCount: generatedTags.length },
                    },
                });
            }

            log.info('Content processed successfully');
        } catch (error) {
            log.error({ err: error }, 'Failed to generate content');

            await prisma.content.update({
                where: { id: contentId },
                data: {
                    status: 'failed' as any,
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
