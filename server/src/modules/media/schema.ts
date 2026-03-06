// =============================================================================
// Media Module — Zod Validation Schemas
// =============================================================================

import { z } from 'zod';

const mediaTypeEnum = z.enum(['image', 'video', 'gif']);

export const mediaQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    type: mediaTypeEnum.optional(),
});

export const generateMediaSchema = z.object({
    quote: z.string().min(1, 'Quote is required'),
    author: z.string().optional(),
    theme: z.string().optional(),
});

export type MediaQueryInput = z.infer<typeof mediaQuerySchema>;
export type GenerateMediaInput = z.infer<typeof generateMediaSchema>;
