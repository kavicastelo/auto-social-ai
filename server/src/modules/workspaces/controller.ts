import type { FastifyRequest, FastifyReply } from 'fastify';
import { createWorkspaceSchema, updateWorkspaceSchema, addMemberSchema } from './schema.js';
import * as workspaceService from './service.js';
import { sendSuccess } from '../../utils/response.js';

export async function create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = createWorkspaceSchema.parse(request.body);
    const workspace = await workspaceService.createWorkspace(input, request.user.sub);
    sendSuccess(reply, workspace, 201);
}

export async function list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const workspaces = await workspaceService.listWorkspaces(request.user.sub);
    sendSuccess(reply, workspaces);
}

export async function getById(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const workspace = await workspaceService.getWorkspaceById(request.params.id, request.user.sub);
    sendSuccess(reply, workspace);
}

export async function update(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const input = updateWorkspaceSchema.parse(request.body);
    const workspace = await workspaceService.updateWorkspace(request.params.id, input, request.user.sub);
    sendSuccess(reply, workspace);
}

export async function addMember(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    const input = addMemberSchema.parse(request.body);
    await workspaceService.addMember(request.params.id, input, request.user.sub);
    sendSuccess(reply, null);
}

export async function agencyOverview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const data = await workspaceService.getAgencyOverview(request.user.sub);
    sendSuccess(reply, data);
}
