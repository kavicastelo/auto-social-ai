// =============================================================================
// Automation Module — Service
// =============================================================================

import { prisma, type AutomationPipeline, type Platform, type PipelineStatus, type TriggerType } from '../../database/index.js';
import { NotFoundError } from '../../utils/errors.js';
import { automationQueue } from '../../queues/index.js';
import type { CreatePipelineInput, UpdatePipelineInput, AutomationQueryInput } from './schema.js';
import type { AutomationPipelineDTO, PaginationMeta } from '@auto-social-ai/shared';

/** Create a new automation pipeline */
export async function createPipeline(
    input: CreatePipelineInput,
    workspaceId: string,
): Promise<AutomationPipelineDTO> {
    const pipeline = await prisma.automationPipeline.create({
        data: {
            name: input.name,
            description: input.description,
            triggerType: input.triggerType as TriggerType,
            platforms: input.platforms as Platform[],
            config: input.config as any,
            workspaceId,
            status: 'draft',
        },
    });

    return toPipelineDTO(pipeline);
}

/** Update an existing pipeline */
export async function updatePipeline(
    id: string,
    input: UpdatePipelineInput,
    workspaceId: string,
): Promise<AutomationPipelineDTO> {
    const existing = await prisma.automationPipeline.findFirst({
        where: { id, workspaceId },
    });

    if (!existing) throw new NotFoundError('Automation Pipeline');

    const updated = await prisma.automationPipeline.update({
        where: { id },
        data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.description !== undefined && { description: input.description }),
            ...(input.status !== undefined && { status: input.status as PipelineStatus }),
            ...(input.triggerType !== undefined && { triggerType: input.triggerType as TriggerType }),
            ...(input.platforms !== undefined && { platforms: input.platforms as Platform[] }),
            ...(input.config !== undefined && { config: input.config as any }),
        },
    });

    // Handle Schedule synchronization with BullMQ
    await syncPipelineSchedule(updated);

    return toPipelineDTO(updated);
}

/** Helper to sync BullMQ repeatable jobs */
async function syncPipelineSchedule(pipeline: any) {
    const jobId = `pipeline-${pipeline.id}`;
    
    // Always remove existing repeatable job first to avoid duplicates or stale crons
    const repeatableJobs = await automationQueue.getRepeatableJobs();
    const existingJob = repeatableJobs.find(j => j.id === jobId);
    
    if (existingJob) {
        await automationQueue.removeRepeatableByKey(existingJob.key);
    }

    // Add new job if active and scheduled
    if (pipeline.status === 'active' && pipeline.triggerType === 'schedule') {
        const config = pipeline.config as any;
        const cron = config.cron;

        if (cron) {
            await automationQueue.add(
                'automation-pipeline',
                { pipelineId: pipeline.id },
                {
                    repeat: { pattern: cron },
                    jobId: jobId,
                    removeOnComplete: true,
                    removeOnFail: true,
                }
            );
        }
    }
}

/** List pipelines with pagination */
export async function listPipelines(
    query: AutomationQueryInput,
    workspaceId: string,
): Promise<{ items: AutomationPipelineDTO[]; meta: PaginationMeta }> {
    const where = {
        workspaceId,
        ...(query.status && { status: query.status as PipelineStatus }),
    };

    const [items, total] = await prisma.$transaction([
        prisma.automationPipeline.findMany({
            where,
            skip: (query.page - 1) * query.limit,
            take: query.limit,
            orderBy: { createdAt: 'desc' },
        }),
        prisma.automationPipeline.count({ where }),
    ]);

    return {
        items: items.map(toPipelineDTO),
        meta: {
            page: query.page,
            limit: query.limit,
            total,
            totalPages: Math.ceil(total / query.limit),
        },
    };
}

/** Get a single pipeline */
export async function getPipelineById(id: string, workspaceId: string): Promise<AutomationPipelineDTO> {
    const pipeline = await prisma.automationPipeline.findFirst({
        where: { id, workspaceId },
    });

    if (!pipeline) throw new NotFoundError('Automation Pipeline');

    return toPipelineDTO(pipeline);
}

/** Trigger a pipeline manually */
export async function triggerPipeline(id: string, workspaceId: string): Promise<{ success: boolean; jobId: string }> {
    const pipeline = await prisma.automationPipeline.findFirst({
        where: { id, workspaceId },
    });

    if (!pipeline) throw new NotFoundError('Active Automation Pipeline');

    const job = await automationQueue.add('automation-pipeline', {
        pipelineId: pipeline.id,
    });

    return { success: true, jobId: job.id as string };
}

/** Delete a pipeline */
export async function removePipeline(id: string, workspaceId: string): Promise<void> {
    const existing = await prisma.automationPipeline.findFirst({
        where: { id, workspaceId },
    });

    if (!existing) throw new NotFoundError('Automation Pipeline');

    // Cleanup background schedule
    const repeatableJobs = await automationQueue.getRepeatableJobs();
    const existingJob = repeatableJobs.find(j => j.id === `pipeline-${id}`);
    if (existingJob) {
        await automationQueue.removeRepeatableByKey(existingJob.key);
    }

    await prisma.automationPipeline.delete({
        where: { id },
    });
}

/** Map Prisma AutomationPipeline to DTO */
function toPipelineDTO(pipeline: AutomationPipeline): AutomationPipelineDTO {
    return {
        id: pipeline.id,
        name: pipeline.name,
        description: pipeline.description,
        status: pipeline.status as AutomationPipelineDTO['status'],
        triggerType: pipeline.triggerType as AutomationPipelineDTO['triggerType'],
        platforms: pipeline.platforms as AutomationPipelineDTO['platforms'],
        config: pipeline.config as Record<string, unknown>,
        workspaceId: pipeline.workspaceId,
        lastRunAt: pipeline.lastRunAt?.toISOString() ?? null,
        runCount: pipeline.runCount,
        createdAt: pipeline.createdAt.toISOString(),
        updatedAt: pipeline.updatedAt.toISOString(),
    };
}
