// =============================================================================
// Media Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import { authGuard, rbacGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function mediaRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.post('/upload-url', controller.getUploadUrl);
    app.post('/commit', controller.commitUpload);
    app.post('/generate', { preHandler: [rbacGuard(['owner', 'admin'])] }, controller.generate);
    app.get('/', controller.list);
    app.delete<{ Params: { id: string } }>('/:id', { preHandler: [rbacGuard(['owner', 'admin'])] }, controller.remove);
}
