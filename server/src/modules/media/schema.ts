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
    style: z.enum(['vivid', 'natural']).default('vivid'),
    size: z.enum(['1024x1024', '1024x1792', '1792x1024']).default('1024x1024'),
});

export const getUploadUrlSchema = z.object({
    fileName: z.string().min(1, 'File name is required'),
    contentType: z.string().min(1, 'Content type is required'),
});

export const commitUploadSchema = z.object({
    key: z.string().min(1, 'S3 Key is required'),
    originalName: z.string().min(1, 'Original name is required'),
    mimeType: z.string().min(1, 'MIME type is required'),
    size: z.number().int().min(1, 'Size must be greater than 0'),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.any()).optional(),
});

export type MediaQueryInput = z.infer<typeof mediaQuerySchema>;
export type GenerateMediaInput = z.infer<typeof generateMediaSchema>;
export type GetUploadUrlInput = z.infer<typeof getUploadUrlSchema>;
export type CommitUploadInput = z.infer<typeof commitUploadSchema>;
