// =============================================================================
// Content Module — Zod Validation Schemas
// =============================================================================

import { z } from 'zod';

const platformEnum = z.enum(['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok']);
const statusEnum = z.enum(['draft', 'generated', 'edited', 'approved', 'published', 'archived']);

export const generateContentSchema = z.object({
    prompt: z.string().min(10, 'Prompt must be at least 10 characters').max(2000),
    platform: platformEnum,
    tone: z.string().max(50).optional(),
    maxLength: z.number().int().min(50).max(5000).optional(),
});

export const editContentSchema = z.object({
    title: z.string().min(1).max(200).optional(),
    body: z.string().min(1).max(10000).optional(),
    status: statusEnum.optional(),
    platform: platformEnum.optional(),
    tags: z.array(z.string().max(50)).max(20).optional(),
});

export const contentQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: statusEnum.optional(),
    platform: platformEnum.optional(),
});

export type GenerateContentInput = z.infer<typeof generateContentSchema>;
export type EditContentInput = z.infer<typeof editContentSchema>;
export type ContentQueryInput = z.infer<typeof contentQuerySchema>;
