// =============================================================================
// Authentication Middleware
// =============================================================================
// Verifies JWT tokens and attaches the user to the request.
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { UnauthorizedError } from '../utils/errors.js';

/** JWT payload shape */
export interface JwtPayload {
    sub: string;     // userId
    wsId: string;    // workspaceId
    type?: 'access' | 'refresh';
    iat?: number;
    exp?: number;
}

/**
 * Fastify preHandler hook — verifies the access token.
 * After verification, `request.user` contains the decoded JWT payload.
 */
export async function authGuard(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
    try {
        const decoded = await request.jwtVerify<JwtPayload>();
        request.user = decoded;
    } catch {
        throw new UnauthorizedError('Invalid or expired token');
    }
}

// Augment Fastify types so `request.user` is typed
declare module '@fastify/jwt' {
    interface FastifyJWT {
        payload: JwtPayload;
        user: JwtPayload;
    }
}
