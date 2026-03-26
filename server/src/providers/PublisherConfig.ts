// =============================================================================
// Settings for Social Publishers
// =============================================================================

export interface PublisherConfig {
    accessToken: string;
    refreshToken?: string;
    platformUserId: string;
    platformUsername: string;
}

export interface PublishResult {
    success: boolean;
    platformId?: string; // ID of the published post on the platform
    error?: string;
    retryAfter?: number;
}

export interface SocialPublisher {
    platform: string;
    validateContent(content: string): boolean;
    formatContent(content: string): string | string[];
    publishPost(config: PublisherConfig, content: string | string[], mediaUrls?: string[]): Promise<PublishResult>;
    fetchAnalytics?(config: PublisherConfig, platformId: string): Promise<{ engagement: number; reach: number; clicks: number }>;
}
