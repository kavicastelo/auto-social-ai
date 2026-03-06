import type { FastifyRequest, FastifyReply } from 'fastify';
import { redisConnection } from '../services/redis.js';
import { logger } from '../utils/logger.js';

export function cacheMiddleware(durationSeconds: number = 60) {
    return async (request: FastifyRequest, reply: FastifyReply) => {
        if (request.method !== 'GET') return;

        // Skip cache for users without auth token to prevent leaking data
        // For authenticated routes, append the user ID to the cache key
        const userPrefix = request.user ? `${request.user.sub}:` : 'anon:';
        const cacheKey = `cache:${userPrefix}${request.url}`;

        try {
            const cachedBody = await redisConnection.get(cacheKey);

            if (cachedBody) {
                logger.debug({ cacheKey }, 'Cache hit');
                reply.header('X-Cache', 'HIT');
                reply.type('application/json').send(cachedBody);
                return reply;
            }

            // Decorate reply with a generic send interceptor
            const originalSend = reply.send;

            reply.send = function (payload: any) {
                try {
                    // Only cache successful JSON responses
                    if (reply.statusCode >= 200 && reply.statusCode < 300) {
                        const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
                        redisConnection.setex(cacheKey, durationSeconds, payloadStr).catch(err => {
                            logger.warn({ err }, 'Failed to write cache');
                        });
                    }
                } catch (err) {
                    logger.warn({ err }, 'Failed to parse payload for cache');
                }

                reply.send = originalSend;
                return reply.send(payload);
            };

            reply.header('X-Cache', 'MISS');
        } catch (error) {
            logger.warn({ err: error }, 'Cache middleware error');
            // Continue execution on Redis failure
        }
    };
}
