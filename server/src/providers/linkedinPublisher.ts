// =============================================================================
// LinkedIn Publisher
// =============================================================================
import type { SocialPublisher, PublisherConfig, PublishResult } from './PublisherConfig.js';
import { logger } from '../utils/logger.js';

export const linkedinPublisher: SocialPublisher = {
    platform: 'linkedin',

    validateContent(content: string): boolean {
        // LinkedIn allows up to 3000 chars, no special requirement
        return content.length > 0 && content.length <= 3000;
    },

    formatContent(content: string): string {
        // Just return as single string for LinkedIn
        return content;
    },

    async publishPost(config: PublisherConfig, content: string | string[], mediaUrls?: string[]): Promise<PublishResult> {
        try {
            logger.info({ username: config.platformUsername }, 'Publishing to LinkedIn...');

            // TODO: replace with linkedinrestClient
            await new Promise(res => setTimeout(res, 600));

            return {
                success: true,
                platformId: `li-${Date.now()}`
            };
        } catch (error: any) {
            return {
                success: false,
                error: error.message
            };
        }
    }
};
