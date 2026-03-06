// =============================================================================
// Media Module — Service
// =============================================================================

import { prisma } from '../../database/index.js';
import { NotFoundError } from '../../utils/errors.js';
import type { MediaQueryInput } from './schema.js';
import type { MediaAssetDTO, PaginationMeta } from '@auto-social-ai/shared';
import type { MediaAsset, MediaType } from '@prisma/client';

/** Determine media type from MIME type */
function getMediaType(mimeType: string): MediaType {
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType === 'image/gif') return 'gif';
    return 'image';
}

/** Create a media asset record after upload */
export async function createMediaAsset(
    file: { filename: string; originalName: string; mimeType: string; size: number; url: string },
    workspaceId: string,
): Promise<MediaAssetDTO> {
    const mediaType = getMediaType(file.mimeType);

    const asset = await prisma.mediaAsset.create({
        data: {
            filename: file.filename,
            originalName: file.originalName,
            mimeType: file.mimeType,
            size: file.size,
            url: file.url,
            type: mediaType,
            workspaceId,
        },
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
        workspaceId: asset.workspaceId,
        createdAt: asset.createdAt.toISOString(),
        updatedAt: asset.updatedAt.toISOString(),
    };
}
