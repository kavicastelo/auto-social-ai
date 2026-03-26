// =============================================================================
// Subscription & Usage Quotas Configuration
// =============================================================================

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export interface PlanLimits {
    maxWorkspaces: number;
    maxPipelinesPerWorkspace: number;
    maxTeamMembersPerWorkspace: number;
    tokensPerMonth: number;
    aiStorageLimitMB: number;
}

export const PLAN_LIMITS: Record<SubscriptionTier, PlanLimits> = {
    free: {
        maxWorkspaces: 1,
        maxPipelinesPerWorkspace: 2,
        maxTeamMembersPerWorkspace: 1,
        tokensPerMonth: 5,
        aiStorageLimitMB: 100,
    },
    pro: {
        maxWorkspaces: 5,
        maxPipelinesPerWorkspace: 10,
        maxTeamMembersPerWorkspace: 5,
        tokensPerMonth: 100,
        aiStorageLimitMB: 5000,
    },
    enterprise: {
        maxWorkspaces: 50,
        maxPipelinesPerWorkspace: 100,
        maxTeamMembersPerWorkspace: 50,
        tokensPerMonth: 10000,
        aiStorageLimitMB: 50000,
    },
};

/** Get limits for a user based on their current role/tier */
export function getLimits(tier: SubscriptionTier): PlanLimits {
    return PLAN_LIMITS[tier] || PLAN_LIMITS.free;
}
