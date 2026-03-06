// =============================================================================
// Accounts Module — Controller
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { connectAccountSchema, accountsQuerySchema } from './schema.js';
import * as accountsService from './service.js';
import { sendSuccess } from '../../utils/response.js';

/** POST /api/accounts/connect */
export async function connect(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = connectAccountSchema.parse(request.body);
    const account = await accountsService.connectAccount(input, request.user.wsId);
    sendSuccess(reply, account, 201);
}

/** GET /api/accounts/list */
export async function list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = accountsQuerySchema.parse(request.query);
    const { items, meta } = await accountsService.listAccounts(query, request.user.wsId);
    sendSuccess(reply, items, 200, meta);
}

/** DELETE /api/accounts/:id */
export async function disconnect(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply): Promise<void> {
    await accountsService.disconnectAccount(request.params.id, request.user.wsId);
    sendSuccess(reply, { message: 'Account disconnected' });
}
