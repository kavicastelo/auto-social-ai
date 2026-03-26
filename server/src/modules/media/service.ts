// =============================================================================
// Media Module — Service
// =============================================================================

import { prisma, type MediaAsset, type MediaType, type MediaSource } from '../../database/index.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import type { MediaQueryInput, GetUploadUrlInput, CommitUploadInput } from './schema.js';
import type { MediaAssetDTO, PaginationMeta } from '@auto-social-ai/shared';
import { mediaGenerationQueue } from '../../queues/index.js';
import type { GenerateMediaInput } from './schema.js';
import { generateUploadUrl, getPublicUrl } from '../../services/storage.service.js';
import { randomUUID } from 'crypto';

/** Determine media type from MIME type */
function getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'image/gif') return 'gif';
    return 'image';
}

/** Generate presigned URL for direct S3 upload */
export async function getUploadUrl(
    input: GetUploadUrlInput,
    workspaceId: string,
): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    // Basic validation
    const mediaType = getMediaType(input.contentType);
    if (!mediaType) throw new BadRequestError('Unsupported content type');

    const extension = input.fileName.split('.').pop() || 'bin';
    const key = `workspaces/${workspaceId}/${randomUUID()}-${Date.now()}.${extension}`;
    
    const uploadUrl = await generateUploadUrl(key, input.contentType);
    const publicUrl = getPublicUrl(key);

    return { uploadUrl, key, publicUrl };
}

/** Create a media asset record after upload */
export async function commitUpload(
    input: CommitUploadInput,
    workspaceId: string,
): Promise<MediaAssetDTO> {
    const mediaType = getMediaType(input.mimeType);

    const asset = await prisma.mediaAsset.create({
        data: {
            filename: input.key.split('/').pop() || input.key,
            originalName: input.originalName,
            mimeType: input.mimeType,
            size: input.size,
            url: getPublicUrl(input.key),
            type: mediaType,
            source: 'user_upload',
            tags: input.tags || [],
            metadata: input.metadata || {},
            workspaceId,
        },
    });

    return toMediaDTO(asset);
}

/** Generate a simple quote image and enqueue it to be processed async */
export async function generateMedia(
    input: GenerateMediaInput,
    workspaceId: string,
): Promise<MediaAssetDTO> {
    // Create an empty dummy asset to return its ID immediately
    const asset = await prisma.mediaAsset.create({
        data: {
            filename: 'generating...',
            originalName: 'quote.png',
            mimeType: 'image/png',
            size: 0,
            url: 'generating...',
            type: 'image',
            workspaceId,
        },
    });

    await mediaGenerationQueue.add('generate-media', {
        mediaAssetId: asset.id,
        quote: input.quote,
        author: input.author,
        theme: input.theme,
        style: input.style,
        size: input.size,
    });

    return toMediaDTO(asset);
}

/** List media assets with pagination */
export async function listMedia(
    query: MediaQueryInput,
    workspaceId: string,
): Promise<{ items: MediaAssetDTO[]; meta: PaginationMeta }> {
    const where = {
        workspaceId,
        ...(query.type && { type: query.type as MediaType }),
    };

    const [items, total] = await prisma.$transaction([
        prisma.mediaAsset.findMany({
            where,
            skip: (query.page - 1) * query.limit,
            take: query.limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.mediaAsset.count({ where }),
    ]);

    return {
        items: items.map(toMediaDTO),
        meta: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

/** Delete a media asset */
export async function deleteMedia(id: string, workspaceId: string): Promise<void> {
    const asset = await prisma.mediaAsset.findFirst({
        where: { id, workspaceId },
    });

    if (!asset) throw new NotFoundError('Media Asset');

    // TODO: Delete the actual file from storage (S3, local, etc.)
    await prisma.mediaAsset.delete({ where: { id } });
}

/** Map Prisma MediaAsset to DTO */
function toMediaDTO(asset: MediaAsset): MediaAssetDTO {
    return {
        id: asset.id,
        filename: asset.filename,
        originalName: asset.originalName,
        mimeType: asset.mimeType,
        size: asset.size,
        url: asset.url,
        type: asset.type as MediaAssetDTO['type'],
        source: asset.source as MediaAssetDTO['source'],
        hash: asset.hash,
        tags: asset.tags,
        metadata: asset.metadata as Record<string, any>,
        workspaceId: asset.workspaceId,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
    };
}
