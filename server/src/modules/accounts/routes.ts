// =============================================================================
// Accounts Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function accountsRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.post('/connect', controller.connect);
    app.get('/list', controller.list);
    app.delete('/:id', controller.disconnect);
}
