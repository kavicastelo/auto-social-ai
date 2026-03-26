// =============================================================================
// Scheduler Module — Controller
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { createScheduledPostSchema, updateScheduledPostSchema, schedulerQuerySchema } from './schema.js';
import * as schedulerService from './service.js';
import { sendSuccess } from '../../utils/response.js';

/** POST /api/scheduler/create */
export async function create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = createScheduledPostSchema.parse(request.body);
    const post = await schedulerService.createScheduledPost(input, request.user.wsId);
    sendSuccess(reply, post, 201);
}

/** PUT /api/scheduler/:id */
export async function update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const input = updateScheduledPostSchema.parse(request.body);
    const post = await schedulerService.updateScheduledPost(request.params.id, input, request.user.wsId);
    sendSuccess(reply, post);
}

/** GET /api/scheduler */
export async function list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = schedulerQuerySchema.parse(request.query);
    const { items, meta } = await schedulerService.listScheduledPosts(query, request.user.wsId);
    sendSuccess(reply, items, 200, meta);
}
/** GET /api/scheduler/:id */
export async function getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const post = await schedulerService.getScheduledPostById(request.params.id, request.user.wsId);
    sendSuccess(reply, post);
}

/** DELETE /api/scheduler/:id */
export async function remove(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    await schedulerService.cancelScheduledPost(request.params.id, request.user.wsId);
    sendSuccess(reply, null);
}

/** POST /api/scheduler/:id/approve */
export async function approve(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const post = await schedulerService.approveScheduledPost(request.params.id, request.user.wsId);
    sendSuccess(reply, post);
}
