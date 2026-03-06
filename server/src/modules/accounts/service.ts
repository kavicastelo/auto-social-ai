// =============================================================================
// Accounts Module — Service
// =============================================================================

import { prisma, type SocialAccount, type Platform } from '../../database/index.js';
import { encryptToken } from '../../utils/crypto.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';
import type { ConnectAccountInput, AccountsQueryInput } from './schema.js';
import type { SocialAccountDTO, PaginationMeta } from '@auto-social-ai/shared';

/** Connect a social account to the workspace */
export async function connectAccount(
    input: ConnectAccountInput,
    workspaceId: string,
): Promise<SocialAccountDTO> {
    // Check for duplicate connection
    const existing = await prisma.socialAccount.findFirst({
        where: {
            platform: input.platform as Platform,
            platformUserId: input.platformUserId,
            workspaceId,
        },
    });

    if (existing) {
        throw new ConflictError('This account is already connected to the workspace');
    }

    const account = await prisma.socialAccount.create({
        data: {
            platform: input.platform as Platform,
            platformUserId: input.platformUserId,
            platformUsername: input.platformUsername,
            accessToken: encryptToken(input.accessToken),
            refreshToken: input.refreshToken ? encryptToken(input.refreshToken) : null,
            workspaceId,
        },
    });

    return toAccountDTO(account);
}

/** List social accounts with pagination */
export async function listAccounts(
    query: AccountsQueryInput,
    workspaceId: string,
): Promise<{ items: SocialAccountDTO[]; meta: PaginationMeta }> {
    const where = {
        workspaceId,
        ...(query.platform && { platform: query.platform as Platform }),
    };

    const [items, total] = await prisma.$transaction([
        prisma.socialAccount.findMany({
            where,
            skip: (query.page - 1) * query.limit,
            take: query.limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.socialAccount.count({ where }),
    ]);

    return {
        items: items.map(toAccountDTO),
        meta: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

/** Disconnect a social account */
export async function disconnectAccount(id: string, workspaceId: string): Promise<void> {
    const account = await prisma.socialAccount.findFirst({
        where: { id, workspaceId },
    });

    if (!account) throw new NotFoundError('Social Account');

    await prisma.socialAccount.update({
        where: { id },
        data: { status: 'disconnected' },
    });
}

/** Map Prisma SocialAccount to DTO (strips tokens) */
function toAccountDTO(account: SocialAccount): SocialAccountDTO {
    return {
        id: account.id,
        platform: account.platform as SocialAccountDTO['platform'],
        platformUsername: account.platformUsername,
        platformUserId: account.platformUserId,
        status: account.status as SocialAccountDTO['status'],
        avatarUrl: account.avatarUrl,
        workspaceId: account.workspaceId,
        createdAt: account.createdAt.toISOString(),
        updatedAt: account.updatedAt.toISOString(),
    };
}
