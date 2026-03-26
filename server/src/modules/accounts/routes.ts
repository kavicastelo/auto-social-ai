// =============================================================================
// Accounts Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard, rbacGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function accountsRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.post('/connect', { preHandler: [rbacGuard(['owner', 'admin'])] }, controller.connect);
    app.get('/', controller.list);
    app.delete<{ Params: { id: string } }>('/:id', { preHandler: [rbacGuard(['owner', 'admin'])] }, controller.disconnect);
}
