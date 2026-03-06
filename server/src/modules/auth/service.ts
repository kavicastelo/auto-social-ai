// =============================================================================
// Auth Module — Service
// =============================================================================
// Handles user registration, login, and token management.
// =============================================================================

import bcrypt from 'bcrypt';
import { prisma } from '../../database/index.js';
import { ConflictError, UnauthorizedError } from '../../utils/errors.js';
import type { RegisterInput, LoginInput } from './schema.js';
import type { UserDTO, AuthTokens } from '@auto-social-ai/shared';

const SALT_ROUNDS = 12;

/** Register a new user and create their default workspace */
export async function registerUser(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
        throw new ConflictError('An account with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user + default workspace in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
        const user = await tx.user.create({
            data: {
                email: input.email,
                password: hashedPassword,
                name: input.name,
            },
        });

        const workspace = await tx.workspace.create({
            data: {
                name: `${input.name}'s Workspace`,
                slug: `ws-${user.id.slice(0, 8)}`,
            },
        });

        await tx.workspaceMember.create({
            data: {
                userId: user.id,
                workspaceId: workspace.id,
                role: 'owner',
            },
        });

        return { user, workspaceId: workspace.id };
    });

    return {
        user: toUserDTO(result.user),
        workspaceId: result.workspaceId,
    };
}

/** Authenticate a user by email and password */
export async function loginUser(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) {
        throw new UnauthorizedError('Invalid email or password');
    }

    const valid = await bcrypt.compare(input.password, user.password);
    if (!valid) {
        throw new UnauthorizedError('Invalid email or password');
    }

    // Get user's primary workspace
    const membership = await prisma.workspaceMember.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' },
    });

    return {
        user: toUserDTO(user),
        workspaceId: membership?.workspaceId ?? '',
    };
}

/** Map Prisma User to public DTO (strips password) */
function toUserDTO(user: { id: string; email: string; name: string; avatarUrl: string | null; createdAt: Date; updatedAt: Date }): UserDTO {
    return {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    };
}
