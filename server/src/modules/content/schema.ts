// =============================================================================
// Content Module — Zod Validation Schemas
// =============================================================================

import { z } from 'zod';

const platformEnum = z.enum(['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok']);
const statusEnum = z.enum(['draft', 'generated', 'edited', 'approved', 'published', 'archived']);

export const generateContentSchema = z.object({
    topic: z.string().min(5, 'Topic must be at least 5 characters').max(2000),
    platforms: z.array(platformEnum).min(1, 'Select at least one platform'),
    tone: z.string().max(50).optional(),
    type: z.string().min(2, 'ContentType is required'),
});

export const refineContentSchema = z.object({
    contentId: z.string().min(1),
    action: z.enum(['improve', 'shorten', 'expand', 'regenerate']),
    platforms: z.array(platformEnum),
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
