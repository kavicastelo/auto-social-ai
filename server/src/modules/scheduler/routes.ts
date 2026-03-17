// =============================================================================
// Scheduler Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function schedulerRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.post('/create', controller.create);
    app.patch('/:id', controller.update);
    app.get('/', controller.list);
    app.get('/:id', controller.getById);
    app.delete('/:id', controller.remove);
}
