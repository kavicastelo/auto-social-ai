// =============================================================================
// Analytics Module — Controller
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { analyticsQuerySchema } from './schema.js';
import * as analyticsService from './service.js';
import { sendSuccess } from '../../utils/response.js';

/** GET /api/analytics/overview */
export async function overview(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = analyticsQuerySchema.parse(request.query);
    const data = await analyticsService.getOverview(query, request.user.wsId);
    sendSuccess(reply, data);
}
