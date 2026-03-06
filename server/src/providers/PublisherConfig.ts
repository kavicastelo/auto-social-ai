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
}

export interface SocialPublisher {
    platform: string;
    validateContent(content: string): boolean;
    formatContent(content: string): string | string[];
    publishPost(config: PublisherConfig, content: string | string[], mediaUrls?: string[]): Promise<PublishResult>;
}
