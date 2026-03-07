import type { FastifyInstance } from 'fastify';
import { authGuard } from '../../middleware/index.js';
import * as controller from './controller.js';

export async function workspacesRoutes(app: FastifyInstance): Promise<void> {
    app.addHook('preHandler', authGuard);

    app.post('/', controller.create);
    app.get('/', controller.list);
    app.get('/:id', controller.getById);
    app.put('/:id', controller.update);
    app.post('/:id/members', controller.addMember);
}
