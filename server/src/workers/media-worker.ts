import { Worker, Job } from 'bullmq';
import { redisConnection } from '../services/redis.js';
import { prisma } from '../database/index.js';
import { logger } from '../utils/logger.js';
import { Buffer } from 'buffer';

interface MediaJobData {
    mediaAssetId: string;
    quote: string;
    author?: string;
    theme?: string;
}

export const mediaWorker = new Worker<MediaJobData>(
    'media-generation',
    async (job: Job<MediaJobData>) => {
        const { mediaAssetId, quote, author, theme } = job.data;
        const log = logger.child({ worker: 'media-generation', jobId: job.id, mediaAssetId });

        log.info('Processing media generation job');

        try {
            // Very simple SVG generation for the quote
            const bgColor = theme === 'dark' ? '#1a1a1a' : '#ffffff';
            const textColor = theme === 'dark' ? '#ffffff' : '#1a1a1a';
            const authorText = author || 'Anonymous';

            const svg = `
<svg width="1080" height="1080" xmlns="http://www.w3.org/2000/svg">
    <rect width="1080" height="1080" fill="${bgColor}"/>
    <text x="540" y="500" font-family="Arial, sans-serif" font-size="48" fill="${textColor}" text-anchor="middle" font-weight="bold">
        "${quote}"
    </text>
    <text x="540" y="600" font-family="Arial, sans-serif" font-size="32" fill="${textColor}" text-anchor="middle" opacity="0.8">
        - ${authorText}
    </text>
</svg>
`;

            // We generate the raw SVG string and use it directly. 
            // In a real application, we would upload this to S3 and save the URL.
            const base64Svg = Buffer.from(svg).toString('base64');
            const dataUrl = `data:image/svg+xml;base64,${base64Svg}`;

            await prisma.mediaAsset.update({
                where: { id: mediaAssetId },
                data: {
                    url: dataUrl,
                    mimeType: 'image/svg+xml',
                    size: svg.length,
                    filename: `quote-${Date.now()}.svg`,
                },
            });

            log.info('Media generated successfully');
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
