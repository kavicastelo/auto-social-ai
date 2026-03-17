// =============================================================================
// Content Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function contentRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.post('/generate', controller.generate);
    app.post('/refine', controller.refine);
    app.get('/', controller.list);
    app.get('/:id', controller.getById);
    app.patch('/:id', controller.edit);
    app.delete('/:id', controller.remove);
}
