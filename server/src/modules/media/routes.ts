// =============================================================================
// Media Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.post('/upload', controller.upload);
    app.get('/', controller.list);
    app.delete('/:id', controller.remove);
}
