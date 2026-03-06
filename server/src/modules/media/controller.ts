// =============================================================================
// Media Module — Controller
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { mediaQuerySchema, generateMediaSchema } from './schema.js';
import * as mediaService from './service.js';
import { sendSuccess } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import { randomUUID } from 'crypto';

/** POST /api/media/upload */
export async function upload(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const file = await request.file();

    if (!file) {
        throw new BadRequestError('No file uploaded');
    }

    // Consume the file stream
    const chunks: Buffer[] = [];
    for await (const chunk of file.file) {
        chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    // TODO: Upload to cloud storage (S3, GCS, etc.)
    // For now, store metadata with a placeholder URL
    const filename = `${randomUUID()}-${file.filename}`;
    const url = `/uploads/${filename}`;

    const asset = await mediaService.createMediaAsset(
        {
            filename,
            originalName: file.filename,
            mimeType: file.mimetype,
            size: buffer.length,
            url,
        },
        request.user.wsId,
    );

    sendSuccess(reply, asset, 201);
}

/** POST /api/media/generate */
export async function generate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = generateMediaSchema.parse(request.body);
    const asset = await mediaService.generateMedia(input, request.user.wsId);
    sendSuccess(reply, asset, 201);
}

/** GET /api/media */
export async function list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = mediaQuerySchema.parse(request.query);
    const { items, meta } = await mediaService.listMedia(query, request.user.wsId);
    sendSuccess(reply, items, 200, meta);
}

/** DELETE /api/media/:id */
export async function remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    await mediaService.deleteMedia(request.params.id, request.user.wsId);
    sendSuccess(reply, { message: 'Media deleted' });
}
