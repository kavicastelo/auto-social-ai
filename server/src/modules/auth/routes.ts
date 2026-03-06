// =============================================================================
// Auth Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import * as controller from './controller.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
    app.post('/register', controller.register);
    app.post('/login', controller.login);
    app.post('/refresh', controller.refresh);
}
