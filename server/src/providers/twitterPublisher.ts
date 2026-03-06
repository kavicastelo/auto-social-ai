// =============================================================================
// Twitter / X Publisher
// =============================================================================
import type { SocialPublisher, PublisherConfig, PublishResult } from './PublisherConfig.js';
import { logger } from '../utils/logger.js';

export const twitterPublisher: SocialPublisher = {
    platform: 'twitter',

    validateContent(content: string): boolean {
        // Twitter allows 280 characters per tweet
        return content.length > 0;
    },

    formatContent(content: string): string[] {
        // Split into threaded tweets if > 280 chars
        const maxLen = 275;
        if (content.length <= maxLen) return [content];

        const words = content.split(' ');
        const threads: string[] = [];
        let currentThread = '';

        for (const word of words) {
            if ((currentThread + ' ' + word).length > maxLen) {
                threads.push(currentThread.trim());
                currentThread = word;
            } else {
                currentThread += (currentThread ? ' ' : '') + word;
            }
        }
        if (currentThread) {
            threads.push(currentThread.trim());
        }

        // Add thread counters
        return threads.map((t, i) => `${t} ${i + 1}/${threads.length}`);
    },

    async publishPost(config: PublisherConfig, content: string | string[], mediaUrls?: string[]): Promise<PublishResult> {
        try {
            logger.info({ username: config.platformUsername }, 'Publishing to Twitter...');

            // TODO: integrate real twitter-api-v2
            await new Promise(res => setTimeout(res, 500));

            return {
                success: true,
                platformId: `tw-${Date.now()}`
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }
};
