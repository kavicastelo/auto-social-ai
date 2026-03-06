// =============================================================================
// Automation Module — Controller
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { createPipelineSchema, updatePipelineSchema, automationQuerySchema } from './schema.js';
import * as automationService from './service.js';
import { sendSuccess } from '../../utils/response.js';

/** POST /api/automation/create */
export async function create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = createPipelineSchema.parse(request.body);
    const pipeline = await automationService.createPipeline(input, request.user.wsId);
    sendSuccess(reply, pipeline, 201);
}

/** PUT /api/automation/:id */
export async function update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const input = updatePipelineSchema.parse(request.body);
    const pipeline = await automationService.updatePipeline(request.params.id, input, request.user.wsId);
    sendSuccess(reply, pipeline);
}

/** GET /api/automation */
export async function list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = automationQuerySchema.parse(request.query);
    const { items, meta } = await automationService.listPipelines(query, request.user.wsId);
    sendSuccess(reply, items, 200, meta);
}

/** GET /api/automation/:id */
export async function getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const pipeline = await automationService.getPipelineById(request.params.id, request.user.wsId);
    sendSuccess(reply, pipeline);
}
