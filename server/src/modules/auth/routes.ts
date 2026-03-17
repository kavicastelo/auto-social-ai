// =============================================================================
// Auth Module — Routes
// =============================================================================

import type { FastifyInstance } from 'fastify';
import * as controller from './controller.js';
import { setupOAuthProviders } from './oauth.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
    app.post('/register', controller.register);
    app.post('/login', controller.login);
    app.post('/refresh', controller.refresh);

    // Register OAuth routes
    await app.register(setupOAuthProviders);

    // Protected routes
    app.register(async (protectedRoutes) => {
        const { authGuard } = await import('../../middleware/index.js');
        protectedRoutes.addHook('preHandler', authGuard);

        protectedRoutes.get('/me', controller.getMe);
        protectedRoutes.put('/me', controller.updateProfile);
    });
}
