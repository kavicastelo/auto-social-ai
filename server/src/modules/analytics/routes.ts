// =============================================================================
// Analytics Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard, cacheMiddleware } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    // Cache overview endpoint for 5 minutes since analytics don't need ms-level real-time constraints
    app.get('/overview', { preHandler: [cacheMiddleware(300)] }, controller.overview);
}
