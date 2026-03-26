// =============================================================================
// Scheduler Module — Zod Validation Schemas
// =============================================================================

import { z } from 'zod';

const scheduleStatusEnum = z.enum(['pending', 'queued', 'publishing', 'published', 'failed', 'cancelled']);

export const createScheduledPostSchema = z.object({
    contentId: z.string().min(1, 'Content ID is required'),
    platform: z.string().optional(),
    accountId: z.string().min(1, 'Account ID is required'),
    publishTime: z.string().datetime('Invalid datetime format'),
    mediaAssetId: z.string().optional(),
});

export const updateScheduledPostSchema = z.object({
    publishTime: z.string().datetime().optional(),
    status: scheduleStatusEnum.optional(),
});

export const schedulerQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: scheduleStatusEnum.optional(),
});

export type CreateScheduledPostInput = z.infer<typeof createScheduledPostSchema>;
export type UpdateScheduledPostInput = z.infer<typeof updateScheduledPostSchema>;
export type SchedulerQueryInput = z.infer<typeof schedulerQuerySchema>;
