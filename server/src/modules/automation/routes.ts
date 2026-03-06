// =============================================================================
// Automation Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function automationRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.post('/create', controller.create);
    app.get('/', controller.list);
    app.get('/:id', controller.getById);
    app.put('/:id', controller.update);
    app.post('/:id/trigger', controller.trigger);
}
