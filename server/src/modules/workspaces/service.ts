import { prisma, type Workspace } from '../../database/index.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { getLimits, SubscriptionTier } from '../../config/plans.js';
import type { CreateWorkspaceInput, UpdateWorkspaceInput, AddMemberInput } from './schema.js';

export async function createWorkspace(input: CreateWorkspaceInput, userId: string): Promise<Workspace> {
    // 1. Check user subscription limits
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundError('User');

    const limits = getLimits(user.subscriptionTier as SubscriptionTier);
    const workspaceCount = await prisma.workspace.count({
        where: { members: { some: { userId, role: 'owner' } } }
    });

    if (workspaceCount >= limits.maxWorkspaces) {
        throw new BadRequestError(`Subscription limit reached: Your current tier allows a maximum of ${limits.maxWorkspaces} workspaces.`);
    }

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

export async function getAgencyOverview(userId: string) {
    const workspaces = await prisma.workspace.findMany({
        where: { members: { some: { userId } } },
        include: {
            _count: {
                select: {
                    pipelines: { where: { status: 'active' } },
                    media: true,
                    contents: true
                }
            }
        }
    });

    const workspaceIds = workspaces.map(w => w.id);

    // Fetch analytics events across all workspaces
    const analyticsEvents = await prisma.analyticsEvent.findMany({
        where: { workspaceId: { in: workspaceIds } }
    });

    let totalReach = 0;
    let totalEngagement = 0;
    let totalClicks = 0;
    let totalPosts = 0;

    for (const event of analyticsEvents) {
        if (event.event === 'post_published') totalPosts++;
        const data = event.data as Record<string, number>;
        totalReach += data.reach ?? 0;
        totalEngagement += data.engagement ?? 0;
        totalClicks += data.clicks ?? 0;
    }

    // Prepare workspaces summary
    const workspaceBreakdown = workspaces.map(w => ({
        id: w.id,
        name: w.name,
        slug: w.slug,
        activePipelines: w._count.pipelines,
        totalMedia: w._count.media,
        totalContent: w._count.contents
    }));

    return {
        aggregateMetrics: {
            totalWorkspaces: workspaces.length,
            totalReach,
            totalEngagement,
            totalClicks,
            totalPosts
        },
        workspaces: workspaceBreakdown
    };
}
