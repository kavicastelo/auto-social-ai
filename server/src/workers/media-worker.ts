import { Worker, Job } from 'bullmq';
import { redisConnection } from '../services/redis.js';
import { prisma } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { env } from '../config/index.js';
import OpenAI from 'openai';
import axios from 'axios';
import { uploadBuffer } from '../services/storage.service.js';

interface MediaJobData {
    mediaAssetId: string;
    quote: string;
    author?: string;
    theme?: string;
    style?: 'vivid' | 'natural';
    size?: '1024x1024' | '1024x1792' | '1792x1024';
}

const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
});

export const mediaWorker = new Worker<MediaJobData>(
    'media-generation',
    async (job: Job<MediaJobData>) => {
        const { mediaAssetId, quote, author, theme, style, size } = job.data;
        const log = logger.child({ worker: 'media-generation', jobId: job.id, mediaAssetId });

        log.info('Processing media generation job');

        try {
            log.info({ quote, style, size }, 'Generating DALL-E 3 image');

            const response = await openai.images.generate({
                model: 'dall-e-3',
                prompt: `A high-quality, professional social media graphic for the following quote: "${quote}". ${author ? `By ${author}.` : ''} Style: ${style || 'vivid'}. Focus on visual storytelling suitable for ${theme || 'modern'} aesthetic. No text unless it is the quote itself and looks professional.`,
                n: 1,
                size: (size as any) || '1024x1024',
                quality: 'standard',
                style: style || 'vivid',
            });

            const imageUrl = response?.data?.[0]?.url;
            if (!imageUrl) {
                throw new Error('DALL-E 3 returned no image URL');
            }

            // Permanent Storage: Download from OpenAI and upload to S3/R2
            log.info('Downloading image from OpenAI for permanent storage');
            const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
            const buffer = Buffer.from(imageResponse.data);
            const filename = `ai-${Date.now()}.png`;
            const storageKey = `generated/${mediaAssetId}/${filename}`;

            log.info({ storageKey }, 'Uploading to permanent storage');
            const permanentUrl = await uploadBuffer(storageKey, buffer, 'image/png');
            
            await prisma.mediaAsset.update({
                where: { id: mediaAssetId },
                data: {
                    url: permanentUrl,
                    mimeType: 'image/png',
                    size: buffer.length,
                    filename: filename,
                    source: 'ai_generated',
                    tags: ['ai_generated', style || 'vivid', 'dalle3'],
                },
            });

            log.info({ permanentUrl }, 'DALL-E 3 image generated and stored successfully');
        } catch (error) {
            log.error({ err: error }, 'Failed to generate media');

            await prisma.mediaAsset.update({
                where: { id: mediaAssetId },
                data: {
                    filename: 'error.png',
                    url: '',
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

mediaWorker.on('completed', (job) => {
    logger.info({ jobId: job.id }, 'Media generation job completed');
});

mediaWorker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, err }, 'Media generation job failed');
});
