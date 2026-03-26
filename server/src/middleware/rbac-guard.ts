// =============================================================================
// RBAC Middleware
// =============================================================================
// Enforces role-based access control within a workspace.
// =============================================================================

import type { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../database/index.js';
import { ForbiddenError } from '../utils/errors.js';

export type WorkspaceRole = 'owner' | 'admin' | 'member';

/**
 * Creates a preHandler hook that ensures the user has one of the required roles
 * in the current workspace.
 */
export function rbacGuard(allowedRoles: WorkspaceRole[]) {
    return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
        const user = request.user;
        
        if (!user || !user.wsId) {
            throw new ForbiddenError('Workspace context missing');
        }

        const member = await prisma.workspaceMember.findUnique({
            where: {
                userId_workspaceId: {
                    userId: user.sub,
                    workspaceId: user.wsId,
                },
            },
        });

        if (!member) {
            throw new ForbiddenError('You are not a member of this workspace');
        }

        if (!allowedRoles.includes(member.role as WorkspaceRole)) {
            throw new ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`);
        }
    };
}
