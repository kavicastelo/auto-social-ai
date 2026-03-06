// =============================================================================
// BullMQ Queue Definitions
// =============================================================================
// Central registry of all background job queues.
// =============================================================================

import { Queue } from 'bullmq';
import { redisConnection } from '../services/redis.js';

/** Queue for publishing scheduled posts */
export const publishQueue = new Queue('publish-post', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
    },
});

/** Queue for content generation tasks */
export const contentGenerationQueue = new Queue('content-generation', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 2,
        backoff: { type: 'fixed', delay: 3000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
    },
});

/** Queue for analytics aggregation */
export const analyticsQueue = new Queue('analytics-aggregation', {
    connection: redisConnection as any,
    defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 10000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 1000 },
    },
});
