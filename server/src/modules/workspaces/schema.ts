import { z } from 'zod';

export const createWorkspaceSchema = z.object({
    name: z.string().min(2).max(100),
    description: z.string().max(500).optional(),
    slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
});

export const updateWorkspaceSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
});

export const addMemberSchema = z.object({
    email: z.string().email(),
    role: z.enum(['owner', 'admin', 'member']).default('member'),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
