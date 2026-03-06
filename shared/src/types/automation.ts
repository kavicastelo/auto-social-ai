// =============================================================================
// Automation Types — Request / Response DTOs
// =============================================================================

import type { BaseEntity } from './common.js';
import type { Platform } from './content.js';

/** Pipeline execution status */
export type PipelineStatus = 'active' | 'paused' | 'draft' | 'error';

/** Trigger type for automation */
export type TriggerType = 'schedule' | 'webhook' | 'event' | 'manual';

/** Create automation pipeline request */
export interface CreatePipelineRequest {
    name: string;
    description?: string;
    triggerType: TriggerType;
    platforms: Platform[];
    config: Record<string, unknown>;
}

/** Update automation pipeline request */
export interface UpdatePipelineRequest {
    name?: string;
    description?: string;
    status?: PipelineStatus;
    triggerType?: TriggerType;
    platforms?: Platform[];
    config?: Record<string, unknown>;
}

/** Automation pipeline DTO */
export interface AutomationPipelineDTO extends BaseEntity {
    name: string;
    description: string | null;
    status: PipelineStatus;
    triggerType: TriggerType;
    platforms: Platform[];
    config: Record<string, unknown>;
    workspaceId: string;
    lastRunAt: string | null;
    runCount: number;
}
