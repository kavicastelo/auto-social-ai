// =============================================================================
// Scheduler Module — Service
// =============================================================================

import { prisma, type ScheduledPost } from '../../database/index.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { publishQueue } from '../../queues/index.js';
import type { CreateScheduledPostInput, UpdateScheduledPostInput, SchedulerQueryInput } from './schema.js';
import type { ScheduledPostDTO, PaginationMeta } from '@auto-social-ai/shared';

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

    const scheduledAt = new Date(input.publishTime);
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
            mediaAssetId: input.mediaAssetId || content.mediaAssetId, // Use explicit mediaId or fallback to content's paired media
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
            ...(input.publishTime && { scheduledAt: new Date(input.publishTime) }),
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
            include: { 
                account: true,
                content: {
                    select: {
                        body: true
                    }
                }
            },
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

/** Get a scheduled post by ID */
export async function getScheduledPostById(id: string, workspaceId: string): Promise<ScheduledPostDTO> {
    const post = await prisma.scheduledPost.findFirst({
        where: { id, workspaceId },
        include: { 
            account: true,
            content: {
                select: {
                    body: true
                }
            }
        },
    });

    if (!post) throw new NotFoundError('Scheduled Post');

    return toScheduledPostDTO(post);
}

/** Cancel a scheduled post (effectively deletes or sets status to cancelled) */
export async function cancelScheduledPost(id: string, workspaceId: string): Promise<void> {
    const existing = await prisma.scheduledPost.findFirst({
        where: { id, workspaceId },
    });

    if (!existing) throw new NotFoundError('Scheduled Post');

    // Opting to physically delete it or mark as cancelled based on the plan 
    // "DELETE /scheduler/:id to cancel a queued post"
    await prisma.scheduledPost.update({
        where: { id },
        data: { status: 'cancelled' },
    });

    // Attempt to remove from queue if possible, otherwise worker skips it if status is 'cancelled'
    try {
        await publishQueue.remove(`publish-${id}`);
    } catch {
        // Ignored
    }
}

/** Approve a post that is pending_approval */
export async function approveScheduledPost(id: string, workspaceId: string): Promise<ScheduledPostDTO> {
    const post = await prisma.scheduledPost.findFirst({
        where: { id, workspaceId },
        include: { account: true, content: true },
    });

    if (!post) throw new NotFoundError('Scheduled Post');
    if (post.status !== 'pending_approval') {
        throw new BadRequestError(`Cannot approve post with status: ${post.status}`);
    }

    // If scheduledAt is in the past, move it to 2 minutes from now to ensure it fires correctly
    let publishTime = post.scheduledAt;
    if (publishTime <= new Date()) {
        publishTime = new Date();
        publishTime.setMinutes(publishTime.getMinutes() + 2);
    }

    const updated = await prisma.scheduledPost.update({
        where: { id },
        data: { 
            status: 'queued',
            scheduledAt: publishTime
        },
        include: { account: true },
    });

    // Enqueue for publishing
    const delay = Math.max(0, publishTime.getTime() - Date.now());
    await publishQueue.add(
        'publish-post',
        { scheduledPostId: post.id },
        { delay, jobId: `publish-${post.id}` }
    );

    return toScheduledPostDTO(updated as any);
}

/** Map Prisma ScheduledPost to DTO */
function toScheduledPostDTO(post: ScheduledPost & { account?: { platform: string }; content?: { body: string } }): ScheduledPostDTO {
    return {
        id: post.id,
        contentId: post.contentId,
        accountId: post.accountId,
        platform: (post.account?.platform ?? 'twitter') as ScheduledPostDTO['platform'],
        content: post.content?.body ?? '', // Added body text to DTO
        mediaAssetId: post.mediaAssetId ?? null,
        scheduledAt: post.scheduledAt.toISOString(),
        publishedAt: post.publishedAt?.toISOString() ?? null,
        status: post.status as ScheduledPostDTO['status'],
        failureReason: post.failureReason,
        createdAt: post.createdAt.toISOString(),
        updatedAt: post.updatedAt.toISOString(),
    };
}
