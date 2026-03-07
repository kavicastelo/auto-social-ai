// =============================================================================
// Content Module — Controller
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { generateContentSchema, editContentSchema, contentQuerySchema } from './schema.js';
import * as contentService from './service.js';
import { sendSuccess } from '../../utils/response.js';

/** POST /api/content/generate */
export async function generate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = generateContentSchema.parse(request.body);
    const content = await contentService.generateContent(input, request.user.sub, request.user.wsId);
    sendSuccess(reply, content, 201);
}

/** PUT /api/content/:id */
export async function edit(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const input = editContentSchema.parse(request.body);
    const content = await contentService.editContent(request.params.id, input, request.user.wsId);
    sendSuccess(reply, content);
}

/** GET /api/content */
export async function list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = contentQuerySchema.parse(request.query);
    const { items, meta } = await contentService.listContent(query, request.user.wsId);
    sendSuccess(reply, items, 200, meta);
}

/** GET /api/content/:id */
export async function getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const content = await contentService.getContentById(request.params.id, request.user.wsId);
    sendSuccess(reply, content);
}

/** DELETE /api/content/:id */
export async function remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    await contentService.removeContent(request.params.id, request.user.wsId);
    sendSuccess(reply, null);
}
