// =============================================================================
// Automation Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard, rbacGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function automationRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.get('/', controller.list);
    app.get('/:id', controller.getById);

    // Restricted management routes
    app.post('/create', { preHandler: [rbacGuard(['owner', 'admin'])] }, controller.create);
    app.put<{ Params: { id: string } }>('/:id', { preHandler: [rbacGuard(['owner', 'admin'])] }, controller.update);
    app.delete<{ Params: { id: string } }>('/:id', { preHandler: [rbacGuard(['owner', 'admin'])] }, controller.remove);
    app.post<{ Params: { id: string } }>('/:id/trigger', { preHandler: [rbacGuard(['owner', 'admin'])] }, controller.trigger);
}
