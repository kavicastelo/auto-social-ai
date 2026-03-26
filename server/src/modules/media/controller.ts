// =============================================================================
// Media Module — Controller
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { mediaQuerySchema, generateMediaSchema, getUploadUrlSchema, commitUploadSchema } from './schema.js';
import * as mediaService from './service.js';
import { sendSuccess } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';
import { randomUUID } from 'crypto';

/** POST /api/media/upload-url */
export async function getUploadUrl(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = getUploadUrlSchema.parse(request.body);
    const result = await mediaService.getUploadUrl(input, request.user.wsId);
    sendSuccess(reply, result, 200);
}

/** POST /api/media/commit */
export async function commitUpload(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = commitUploadSchema.parse(request.body);
    const asset = await mediaService.commitUpload(input, request.user.wsId);
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
