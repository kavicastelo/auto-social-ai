// =============================================================================
// Accounts Module — Zod Validation Schemas
// =============================================================================

import { z } from 'zod';

const platformEnum = z.enum(['twitter', 'instagram', 'facebook', 'linkedin', 'tiktok']);

export const connectAccountSchema = z.object({
    platform: platformEnum,
    accessToken: z.string().min(1, 'Access token is required'),
    refreshToken: z.string().optional(),
    platformUserId: z.string().min(1, 'Platform user ID is required'),
    platformUsername: z.string().min(1, 'Platform username is required'),
});

export const accountsQuerySchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    platform: platformEnum.optional(),
});

export type ConnectAccountInput = z.infer<typeof connectAccountSchema>;
export type AccountsQueryInput = z.infer<typeof accountsQuerySchema>;
