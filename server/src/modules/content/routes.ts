// =============================================================================
// Content Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard, rbacGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function contentRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.post('/generate', controller.generate);
    app.post('/refine', controller.refine);
    app.get('/', controller.list);
    app.get('/:id', controller.getById);

    // Modification routes restricted to admins/owners
    app.patch<{ Params: { id: string } }>('/:id', { preHandler: [rbacGuard(['owner', 'admin'])] }, controller.edit);
    app.delete<{ Params: { id: string } }>('/:id', { preHandler: [rbacGuard(['owner', 'admin'])] }, controller.remove);
}
