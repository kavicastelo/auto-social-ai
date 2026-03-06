import type { FastifyInstance } from 'fastify';
import * as controller from './controller.js';

export async function systemRoutes(app: FastifyInstance): Promise<void> {
    // Note: If you want to require admin auth for this, add preHandler here
    app.get('/metrics', controller.getMetrics);
}
