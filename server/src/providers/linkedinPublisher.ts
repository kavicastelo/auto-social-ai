// =============================================================================
// LinkedIn Publisher
// =============================================================================
import type { SocialPublisher, PublisherConfig, PublishResult } from './PublisherConfig.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';

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

            // For LinkedIn, content must be a string
            const textContent = Array.isArray(content) ? content.join('\n') : content;

            // Simplified Text UGC Post Body
            const body = {
                author: `urn:li:person:${config.platformUserId}`,
                lifecycleState: 'PUBLISHED',
                specificContent: {
                    'com.linkedin.ugc.ShareContent': {
                        shareCommentary: {
                            text: textContent
                        },
                        shareMediaCategory: 'NONE' // Basic text integration for now
                    }
                },
                visibility: {
                    'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
                }
            };

            const response = await axios.post('https://api.linkedin.com/v2/ugcPosts', body, {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0',
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                platformId: response.data.id || `li-${Date.now()}`
            };
        } catch (error: any) {
            logger.error({ err: error.response?.data || error }, 'LinkedIn publish failed');
            return {
                success: false,
                error: error.response?.data?.message || error.message || 'Unknown LinkedIn API error'
            };
        }
    },

    async fetchAnalytics(config: PublisherConfig, platformId: string) {
        try {
            // Mock LinkedIn engagement for dev
            if (platformId.startsWith('li-')) {
                return {
                    engagement: Math.floor(Math.random() * 30) + 2,
                    reach: Math.floor(Math.random() * 300) + 50,
                    clicks: Math.floor(Math.random() * 5),
                };
            }

            // Real LinkedIn fetch (SocialActions API)
            const response = await axios.get(`https://api.linkedin.com/v2/socialActions/${encodeURIComponent(platformId)}`, {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'X-Restli-Protocol-Version': '2.0.0'
                }
            });

            // Note: v2/socialActions provides likes/comments. Reach requires a separate OrganizationalStats API call usually.
            const stats = response.data;
            const engagement = (stats.totalLikes ?? 0) + (stats.totalComments ?? 0);

            return {
                engagement,
                reach: engagement * 15, // Estimate
                clicks: stats.totalShares ?? 0,
            };
        } catch (error) {
            logger.error({ err: error, platformId }, 'Failed to fetch LinkedIn analytics');
            return { engagement: 0, reach: 0, clicks: 0 };
        }
    }
};
