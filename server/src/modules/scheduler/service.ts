// =============================================================================
// Scheduler Module — Service
// =============================================================================

import { prisma } from '../../database/index.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { publishQueue } from '../../queues/index.js';
import type { CreateScheduledPostInput, UpdateScheduledPostInput, SchedulerQueryInput } from './schema.js';
import type { ScheduledPostDTO, PaginationMeta } from '@auto-social-ai/shared';
import type { ScheduledPost } from '@prisma/client';

/** Create a new scheduled post and enqueue it for publishing */
export async function createScheduledPost(
    input: CreateScheduledPostInput,
    workspaceId: string,
): Promise<ScheduledPostDTO> {
    // Validate that content and account exist in this workspace
    const [content, account] = await Promise.all([
        prisma.content.findFirst({ where: { id: input.contentId, workspaceId } }),
        prisma.socialAccount.findFirst({ where: { id: input.accountId, workspaceId } }),
    ]);

    if (!content) throw new NotFoundError('Content');
    if (!account) throw new NotFoundError('Social Account');

    const scheduledAt = new Date(input.scheduledAt);
    if (scheduledAt <= new Date()) {
        throw new BadRequestError('Scheduled time must be in the future');
    }

    const post = await prisma.scheduledPost.create({
        data: {
            contentId: input.contentId,
            accountId: input.accountId,
            workspaceId,
            scheduledAt,
            status: 'pending',
        },
        include: { account: true },
    });

    // Enqueue the publish job with a delay
    const delay = scheduledAt.getTime() - Date.now();
    await publishQueue.add(
        'publish',
        { scheduledPostId: post.id },
        { delay, jobId: `publish-${post.id}` },
    );

    // Update status to queued
    const updated = await prisma.scheduledPost.update({
        where: { id: post.id },
        data: { status: 'queued' },
        include: { account: true },
    });

    return toScheduledPostDTO(updated);
}

/** Update a scheduled post */
export async function updateScheduledPost(
    id: string,
    input: UpdateScheduledPostInput,
    workspaceId: string,
): Promise<ScheduledPostDTO> {
    const existing = await prisma.scheduledPost.findFirst({
        where: { id, workspaceId },
    });

    if (!existing) throw new NotFoundError('Scheduled Post');

    const post = await prisma.scheduledPost.update({
        where: { id },
        data: {
            ...(input.scheduledAt && { scheduledAt: new Date(input.scheduledAt) }),
            ...(input.status && { status: input.status }),
        },
        include: { account: true },
    });

    return toScheduledPostDTO(post);
}

/** List scheduled posts with pagination */
export async function listScheduledPosts(
    query: SchedulerQueryInput,
    workspaceId: string,
): Promise<{ items: ScheduledPostDTO[]; meta: PaginationMeta }> {
    const where = {
        workspaceId,
        ...(query.status && { status: query.status }),
    };

    const [items, total] = await prisma.$transaction([
        prisma.scheduledPost.findMany({
            where,
            include: { account: true },
            skip: (query.page - 1) * query.limit,
            take: query.limit,
            orderBy: { scheduledAt: 'asc' },
        }),
        prisma.scheduledPost.count({ where }),
    ]);

    return {
        items: items.map(toScheduledPostDTO),
        meta: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

/** Map Prisma ScheduledPost to DTO */
function toScheduledPostDTO(post: ScheduledPost & { account?: { platform: string } }): ScheduledPostDTO {
    return {
        id: post.id,
        contentId: post.contentId,
        accountId: post.accountId,
        platform: (post.account?.platform ?? 'twitter') as ScheduledPostDTO['platform'],
        scheduledAt: post.scheduledAt.toISOString(),
        publishedAt: post.publishedAt?.toISOString() ?? null,
        status: post.status as ScheduledPostDTO['status'],
        failureReason: post.failureReason,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
    };
}
