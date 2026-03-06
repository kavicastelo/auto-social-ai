// =============================================================================
// Auth Module — Controller
// =============================================================================
// Request handlers for authentication endpoints.
// =============================================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerSchema, loginSchema, refreshSchema } from './schema.js';
import * as authService from './service.js';
import { sendSuccess } from '../../utils/response.js';
import { UnauthorizedError } from '../../utils/errors.js';
import type { JwtPayload } from '../../middleware/auth-guard.js';

/** POST /api/auth/register */
export async function register(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = registerSchema.parse(request.body);
    const { user, workspaceId } = await authService.registerUser(input);

    const accessToken = await reply.jwtSign(
        { sub: user.id, wsId: workspaceId },
        { expiresIn: '15m' },
    );
    const refreshToken = await reply.jwtSign(
        { sub: user.id, wsId: workspaceId, type: 'refresh' },
        { expiresIn: '7d' },
    );

    sendSuccess(reply, {
        user,
        tokens: { accessToken, refreshToken, expiresIn: 900 },
    }, 201);
}

/** POST /api/auth/login */
export async function login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = loginSchema.parse(request.body);
    const { user, workspaceId } = await authService.loginUser(input);

    const accessToken = await reply.jwtSign(
        { sub: user.id, wsId: workspaceId },
        { expiresIn: '15m' },
    );
    const refreshToken = await reply.jwtSign(
        { sub: user.id, wsId: workspaceId, type: 'refresh' },
        { expiresIn: '7d' },
    );

    sendSuccess(reply, {
        user,
        tokens: { accessToken, refreshToken, expiresIn: 900 },
    });
}

/** POST /api/auth/refresh */
export async function refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { refreshToken: token } = refreshSchema.parse(request.body);

    try {
        // Manually verify the refresh token
        const app = request.server as FastifyInstance;
        const decoded = app.jwt.verify<JwtPayload & { type?: string }>(token);

        if ((decoded as any).type !== 'refresh') {
            throw new UnauthorizedError('Invalid token type');
        }

        const accessToken = await reply.jwtSign(
            { sub: decoded.sub, wsId: decoded.wsId },
            { expiresIn: '15m' },
        );
        const newRefreshToken = await reply.jwtSign(
            { sub: decoded.sub, wsId: decoded.wsId, type: 'refresh' },
            { expiresIn: '7d' },
        );

        sendSuccess(reply, {
            tokens: { accessToken, refreshToken: newRefreshToken, expiresIn: 900 },
        });
    } catch {
        throw new UnauthorizedError('Invalid or expired refresh token');
    }
}
