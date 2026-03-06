// =============================================================================
// Redis Connection — Shared IORedis Instance
// =============================================================================

import IORedis from 'ioredis';
import { env } from '../config/index.js';

export const redisConnection = new IORedis(env.REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
});
