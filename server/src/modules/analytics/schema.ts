// =============================================================================
// Analytics Module — Zod Validation Schemas
// =============================================================================

import { z } from 'zod';

const platformEnum = z.enum(['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok']);

export const analyticsQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    platform: platformEnum.optional(),
});

export type AnalyticsQueryInput = z.infer<typeof analyticsQuerySchema>;
