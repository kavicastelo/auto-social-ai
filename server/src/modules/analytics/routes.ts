// =============================================================================
// Analytics Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.get('/overview', controller.overview);
}
