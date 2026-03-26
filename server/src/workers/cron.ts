// =============================================================================
// Global Cron Scheduler
// =============================================================================
// Initializes repeatable jobs via BullMQ for background system maintenance.
// =============================================================================

import { analyticsQueue } from '../queues/index.js';
import { logger } from '../utils/logger.js';

export async function setupCronJobs() {
    try {
        // Clear old repeatable jobs to avoid duplicates on startup if settings changed
        const repeatableJobs = await analyticsQueue.getRepeatableJobs();
        for (const job of repeatableJobs) {
            if (job.name === 'master-analytics-dispatch') {
                await analyticsQueue.removeRepeatableByKey(job.key);
            }
        }

        // Run the analytics dispatcher every 4 hours
        await analyticsQueue.add(
            'master-analytics-dispatch',
            {}, 
            {
                repeat: { pattern: '0 */4 * * *' }, 
                jobId: 'master-analytics-dispatch',
                removeOnComplete: true,
                removeOnFail: true,
            }
        );

        logger.info('Scheduled global cron jobs successfully');
    } catch (error) {
        logger.error({ err: error }, 'Failed to schedule global cron jobs');
    }
}
