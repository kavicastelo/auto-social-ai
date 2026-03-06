import type { FastifyRequest, FastifyReply } from 'fastify';
import {
    publishQueue,
    contentGenerationQueue,
    analyticsQueue,
    mediaGenerationQueue,
    automationQueue
} from '../../queues/index.js';
import { sendSuccess } from '../../utils/response.js';

/** GET /api/system/metrics */
export async function getMetrics(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const queues = {
        publish: publishQueue,
        content: contentGenerationQueue,
        analytics: analyticsQueue,
        media: mediaGenerationQueue,
        automation: automationQueue,
    };

    const metrics: Record<string, any> = {};

    for (const [name, queue] of Object.entries(queues)) {
        const [waiting, active, completed, failed, delayed] = await Promise.all([
            queue.getWaitingCount(),
            queue.getActiveCount(),
            queue.getCompletedCount(),
            queue.getFailedCount(),
            queue.getDelayedCount(),
        ]);

        metrics[name] = {
            waiting,
            active,
            completed,
            failed,
            delayed,
        };
    }

    sendSuccess(reply, {
        uptime: process.uptime(),
        queues: metrics,
        timestamp: new Date().toISOString(),
    }, 200);
}
