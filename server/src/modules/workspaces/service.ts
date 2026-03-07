import { prisma, type Workspace } from '../../database/index.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import type { CreateWorkspaceInput, UpdateWorkspaceInput, AddMemberInput } from './schema.js';

export async function createWorkspace(input: CreateWorkspaceInput, userId: string): Promise<Workspace> {
    const existing = await prisma.workspace.findUnique({
        where: { slug: input.slug },
    });

    if (existing) {
        throw new BadRequestError('Workspace slug already exists');
    }

    const workspace = await prisma.workspace.create({
        data: {
            name: input.name,
            description: input.description,
            slug: input.slug,
            members: {
                create: {
                    userId,
                    role: 'owner',
                },
            },
        },
    });

    return workspace;
}

export async function listWorkspaces(userId: string): Promise<Workspace[]> {
    return prisma.workspace.findMany({
        where: {
            members: {
                some: { userId },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function getWorkspaceById(id: string, userId: string): Promise<Workspace> {
    const workspace = await prisma.workspace.findFirst({
        where: {
            id,
            members: {
                some: { userId },
            },
        },
    });

    if (!workspace) {
        throw new NotFoundError('Workspace');
    }

    return workspace;
}

export async function updateWorkspace(id: string, input: UpdateWorkspaceInput, userId: string): Promise<Workspace> {
    const workspace = await getWorkspaceById(id, userId);

    return prisma.workspace.update({
        where: { id: workspace.id },
        data: input,
    });
}

export async function addMember(workspaceId: string, input: AddMemberInput, currentUserId: string): Promise<void> {
    // 1. Verify current user is admin or owner
    const member = await prisma.workspaceMember.findUnique({
        where: {
            userId_workspaceId: {
                userId: currentUserId,
                workspaceId,
            },
        },
    });

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
        throw new BadRequestError('Insufficient permissions to add members');
    }

    // 2. Find target user
    const userToAdd = await prisma.user.findUnique({
        where: { email: input.email },
    });

    if (!userToAdd) {
        throw new NotFoundError('User not found');
    }

    // 3. Add to workspace
    await prisma.workspaceMember.upsert({
        where: {
            userId_workspaceId: {
                userId: userToAdd.id,
                workspaceId,
            },
        },
        update: {
            role: input.role,
        },
        create: {
            userId: userToAdd.id,
            workspaceId,
            role: input.role,
        },
    });
}
