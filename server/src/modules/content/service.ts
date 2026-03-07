// =============================================================================
// Content Module — Service
// =============================================================================

import { prisma, type Content, type Platform } from '../../database/index.js';
import { NotFoundError } from '../../utils/errors.js';
import type { GenerateContentInput, EditContentInput, ContentQueryInput } from './schema.js';
import type { ContentDTO, PaginationMeta } from '@auto-social-ai/shared';

import { contentGenerationQueue } from '../../queues/index.js';

/** Generate content (async queue) */
export async function generateContent(
    input: GenerateContentInput,
    userId: string,
    workspaceId: string,
): Promise<ContentDTO> {
    const generatedTitle = input.topic.slice(0, 100);

    const content = await prisma.content.create({
        data: {
            title: generatedTitle,
            body: 'Generating...', // placeholder
            platform: input.platform as Platform,
            status: 'draft',
            tags: [],
            authorId: userId,
            workspaceId,
        },
    });

    // Enqueue generation job
    await contentGenerationQueue.add('generate-content', {
        contentId: content.id,
        topic: input.topic,
        platform: input.platform,
        tone: input.tone,
        contentType: input.contentType
    });

    return toContentDTO(content);
}

/** Update content by ID */
export async function editContent(
    id: string,
    input: EditContentInput,
    workspaceId: string,
): Promise<ContentDTO> {
    const existing = await prisma.content.findFirst({
        where: { id, workspaceId },
    });

    if (!existing) {
        throw new NotFoundError('Content');
    }

    const content = await prisma.content.update({
        where: { id },
        data: {
            ...(input.title !== undefined && { title: input.title }),
            ...(input.body !== undefined && { body: input.body }),
            ...(input.status !== undefined && { status: input.status }),
            ...(input.platform !== undefined && { platform: input.platform as Platform }),
            ...(input.tags !== undefined && { tags: input.tags }),
        },
    });

    return toContentDTO(content);
}

/** List content with pagination and filters */
export async function listContent(
    query: ContentQueryInput,
    workspaceId: string,
): Promise<{ items: ContentDTO[]; meta: PaginationMeta }> {
    const where = {
        workspaceId,
        ...(query.status && { status: query.status }),
        ...(query.platform && { platform: query.platform as Platform }),
    };

    const [items, total] = await prisma.$transaction([
        prisma.content.findMany({
            where,
            skip: (query.page - 1) * query.limit,
            take: query.limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.content.count({ where }),
    ]);

    return {
        items: items.map(toContentDTO),
        meta: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

/** Get single content by ID */
export async function getContentById(id: string, workspaceId: string): Promise<ContentDTO> {
    const content = await prisma.content.findFirst({
        where: { id, workspaceId },
    });

    if (!content) {
        throw new NotFoundError('Content');
    }

    return toContentDTO(content);
}

/** Delete content by ID */
export async function removeContent(id: string, workspaceId: string): Promise<void> {
    const existing = await prisma.content.findFirst({
        where: { id, workspaceId },
    });

    if (!existing) {
        throw new NotFoundError('Content');
    }

    await prisma.content.delete({
        where: { id },
    });
}

/** Map Prisma Content to DTO */
function toContentDTO(content: Content): ContentDTO {
    return {
        id: content.id,
        title: content.title,
        body: content.body,
        platform: content.platform as ContentDTO['platform'],
        status: content.status as ContentDTO['status'],
        tags: content.tags,
        workspaceId: content.workspaceId,
        authorId: content.authorId,
        scheduledAt: null,
        createdAt: content.createdAt.toISOString(),
        updatedAt: content.updatedAt.toISOString(),
    };
}
