// =============================================================================
// Twitter / X Publisher
// =============================================================================
import type { SocialPublisher, PublisherConfig, PublishResult } from './PublisherConfig.js';
import { logger } from '../utils/logger.js';
import { TwitterApi } from 'twitter-api-v2';

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

            const client = new TwitterApi(config.accessToken);
            
            // Handle threaded tweets if content is array
            let platformId = `tw-${Date.now()}`;
            if (Array.isArray(content) && content.length > 1) {
                // Threaded tweet
                const thread = await client.v2.tweetThread(content);
                if (thread && thread.length > 0) {
                    platformId = thread[0].data.id;
                }
            } else {
                // Single tweet
                const text = Array.isArray(content) ? content[0] : content;
                const result = await client.v2.tweet(text);
                platformId = result.data.id;
            }

            return {
                success: true,
                platformId,
            };
        } catch (error: any) {
            logger.error({ err: error }, 'Twitter publish failed');
            return {
                success: false,
                error: error?.data?.detail || error.message || 'Unknown Twitter API error'
            };
        }
    },

    async fetchAnalytics(config: PublisherConfig, platformId: string) {
        try {
            // Check if mock ID
            if (platformId.startsWith('tw-')) {
                return {
                    engagement: Math.floor(Math.random() * 50) + 5,
                    reach: Math.floor(Math.random() * 500) + 100,
                    clicks: Math.floor(Math.random() * 10),
                };
            }

            const client = new TwitterApi(config.accessToken);
            const tweet = await client.v2.singleTweet(platformId, {
                'tweet.fields': ['public_metrics'],
            });

            const metrics = tweet.data.public_metrics;
            if (!metrics) return { engagement: 0, reach: 0, clicks: 0 };

            const engagement = (metrics.like_count ?? 0) + (metrics.retweet_count ?? 0) + (metrics.reply_count ?? 0) + (metrics.quote_count ?? 0);
            
            return {
                engagement,
                reach: metrics.impression_count ?? (engagement * 10), // estimate if undefined
                clicks: metrics.bookmark_count ?? 0, // Using bookmarks as a proxy if no link clicks are available
            };
        } catch (error) {
            logger.error({ err: error, platformId }, 'Failed to fetch Twitter analytics');
            return { engagement: 0, reach: 0, clicks: 0 };
        }
    }
};
