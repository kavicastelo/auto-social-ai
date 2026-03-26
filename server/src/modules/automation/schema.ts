// =============================================================================
// Automation Module — Zod Validation Schemas
// =============================================================================

import { z } from 'zod';

const platformEnum = z.enum(['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok']);
const pipelineStatusEnum = z.enum(['active', 'paused', 'draft', 'error']);
const triggerTypeEnum = z.enum(['schedule', 'webhook', 'event', 'manual']);
const statusEnum = z.enum(['draft', 'generated', 'edited', 'approved', 'published', 'archived', 'failed']);

export const createPipelineSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    description: z.string().max(500).optional(),
    triggerType: triggerTypeEnum,
    platforms: z.array(platformEnum).min(1, 'At least one platform is required'),
    config: z.object({
        nodes: z.array(z.any()).optional(),
        edges: z.array(z.any()).optional(),
        topic: z.string().optional(),
        tone: z.string().optional(),
        contentType: z.string().optional(),
        generateMedia: z.boolean().optional(),
        mediaTheme: z.string().optional(),
        quote: z.string().optional(),
        publishDelayHours: z.number().optional(),
        cron: z.string().optional(),
        useLibraryMedia: z.boolean().optional(),
        libraryTags: z.array(z.string()).optional(),
        fallbackToAiMedia: z.boolean().optional(),
    }).default({}),
});

export const updatePipelineSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    status: pipelineStatusEnum.optional(),
    triggerType: triggerTypeEnum.optional(),
    platforms: z.array(platformEnum).min(1).optional(),
    config: z.record(z.any()).optional(),
});

export const automationQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: pipelineStatusEnum.optional(),
});

export type CreatePipelineInput = z.infer<typeof createPipelineSchema>;
export type UpdatePipelineInput = z.infer<typeof updatePipelineSchema>;
export type AutomationQueryInput = z.infer<typeof automationQuerySchema>;
