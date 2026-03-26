// =============================================================================
// Facebook Publisher
// =============================================================================
import type { SocialPublisher, PublisherConfig, PublishResult } from './PublisherConfig.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

export const facebookPublisher: SocialPublisher = {
    platform: 'facebook',

    validateContent(content: string): boolean {
        // Facebook limit is extremely high (~63000 chars), normally not an issue
        return content.length > 0 && content.length < 50000;
    },

    formatContent(content: string): string {
        return content;
    },

    async publishPost(config: PublisherConfig, content: string | string[], mediaUrls?: string[]): Promise<PublishResult> {
        try {
            logger.info({ username: config.platformUsername }, 'Publishing to Facebook Page...');

            const textContent = Array.isArray(content) ? content.join('\n') : content;
            const pageId = config.platformUserId; // Assuming platformUserId stores the Page ID

            // If there's media, we handle it differently (publishing images/videos)
            // For now, simplified version: posting a message + first media as a link or just message
            
            const params: any = {
                message: textContent,
                access_token: config.accessToken
            };

            if (mediaUrls && mediaUrls.length > 0) {
                // To post an image to a page: /{page-id}/photos
                // To post a post with multiple images, we'd use attached_media. 
                // For MVP: post first image if exists
                params.url = mediaUrls[0];
            }

            const endpoint = (mediaUrls && mediaUrls.length > 0) ? `/${pageId}/photos` : `/${pageId}/feed`;
            
            const response = await axios.post(`https://graph.facebook.com/v18.0${endpoint}`, null, {
                params
            });

            // Handle rate limits (checking headers for "x-app-usage" or "x-page-usage")
            const usage = response.headers['x-page-usage'] || response.headers['x-app-usage'];
            if (usage) {
                const parsed = JSON.parse(usage);
                if (parsed.call_count > 80 || parsed.total_time > 80) {
                    logger.warn({ usage: parsed, pageId }, 'Facebook rate limit approaching threshold');
                }
            }

            return {
                success: true,
                platformId: response.data.id || response.data.post_id
            };
        } catch (error: any) {
            const fbError = error.response?.data?.error;
            logger.error({ err: fbError || error }, 'Facebook publish failed');
            
            // Rate limit specific error handling
            if (fbError?.code === 17 || fbError?.code === 32 || fbError?.code === 341) {
                return {
                    success: false,
                    error: `RATE_LIMIT: ${fbError.message || 'Facebook rate limit reached'}`,
                    retryAfter: 3600 // Suggest 1 hour for FB rate limits
                };
            }

            return {
                success: false,
                error: fbError?.message || error.message || 'Unknown Facebook API error'
            };
        }
    },

    async fetchAnalytics(config: PublisherConfig, platformId: string) {
        try {
            // Stats endpoint: /{object-id}/insights/post_impressions_unique,post_engaged_users,post_clicks_unique
            const response = await axios.get(`https://graph.facebook.com/v18.0/${platformId}/insights`, {
                params: {
                    metric: 'post_impressions_unique,post_engaged_users,post_clicks_unique',
                    access_token: config.accessToken
                }
            });

            const insights = response.data.data || [];
            const results = insights.reduce((acc: any, item: any) => {
                const value = item.values?.[0]?.value || 0;
                if (item.name === 'post_impressions_unique') acc.reach = value;
                if (item.name === 'post_engaged_users') acc.engagement = value;
                if (item.name === 'post_clicks_unique') acc.clicks = value;
                return acc;
            }, { reach: 0, engagement: 0, clicks: 0 });

            return results;
        } catch (error) {
            logger.error({ err: error, platformId }, 'Failed to fetch Facebook analytics');
            return { engagement: 0, reach: 0, clicks: 0 };
        }
    }
};
