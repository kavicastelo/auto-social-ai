// =============================================================================
// Instagram Publisher (Business)
// =============================================================================
import type { SocialPublisher, PublisherConfig, PublishResult } from './PublisherConfig.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

export const instagramPublisher: SocialPublisher = {
    platform: 'instagram',

    validateContent(content: string): boolean {
        // Instagram captions are up to 2200 chars, max 30 hashtags
        return content.length > 0 && content.length <= 2200;
    },

    formatContent(content: string): string {
        return content;
    },

    async publishPost(config: PublisherConfig, content: string | string[], mediaUrls?: string[]): Promise<PublishResult> {
        try {
            logger.info({ username: config.platformUsername }, 'Publishing to Instagram (Business)...');

            if (!mediaUrls || mediaUrls.length === 0) {
                throw new Error('Instagram publishing requires at least one image or video URL');
            }

            const textContent = Array.isArray(content) ? content.join('\n') : content;
            const igUserId = config.platformUserId;

            // 1. Create Media Container (IG Graph API v18)
            logProgress('Creating Instagram media container...');
            const containerResponse = await axios.post(`https://graph.facebook.com/v18.0/${igUserId}/media`, null, {
                params: {
                    image_url: mediaUrls[0],
                    caption: textContent,
                    access_token: config.accessToken
                }
            });

            const creationId = containerResponse.data.id;
            if (!creationId) throw new Error('Failed to get Instagram creation_id');

            // 2. Publish the Container
            logProgress(`Publishing container ${creationId} to Instagram...`);
            const publishResponse = await axios.post(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, null, {
                params: {
                    creation_id: creationId,
                    access_token: config.accessToken
                }
            });

            return {
                success: true,
                platformId: publishResponse.data.id
            };
        } catch (error: any) {
            const igError = error.response?.data?.error;
            logger.error({ err: igError || error }, 'Instagram business publish failed');
            
            // Handle common IG issues (rate limit, aspect ratio, etc.)
            if (igError?.code === 10 || igError?.error_subcode === 2207008) {
                return {
                    success: false,
                    error: `IG_RULE: ${igError.message || 'Media not valid for Instagram'}`
                };
            }

            return {
                success: false,
                error: igError?.message || error.message || 'Unknown Instagram API error'
            };
        }
    },

    async fetchAnalytics(config: PublisherConfig, platformId: string) {
        try {
            // Stats endpoint: /{media-id}/insights/impressions,engagement,reach,saved,video_views
            const response = await axios.get(`https://graph.facebook.com/v18.0/${platformId}/insights`, {
                params: {
                    metric: 'impressions,engagement,reach,saved',
                    access_token: config.accessToken
                }
            });

            const insights = response.data.data || [];
            const results = insights.reduce((acc: any, item: any) => {
                const value = item.values?.[0]?.value || 0;
                if (item.name === 'reach') acc.reach = value;
                if (item.name === 'engagement') acc.engagement = value;
                if (item.name === 'impressions') acc.reach = Math.max(acc.reach, value); // Fallback for reach if needed
                if (item.name === 'saved') acc.clicks = (acc.clicks || 0) + value; // We count "saves" if clicks are not available
                return acc;
            }, { reach: 0, engagement: 0, clicks: 0 });

            return results;
        } catch (error) {
            logger.error({ err: error, platformId }, 'Failed to fetch Instagram analytics');
            return { engagement: 0, reach: 0, clicks: 0 };
        }
    }
};

function logProgress(msg: string) {
    logger.info({ provider: 'instagram' }, msg);
}
