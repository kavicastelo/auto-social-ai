export * from './PublisherConfig.js';
export { twitterPublisher } from './twitterPublisher.js';
export { linkedinPublisher } from './linkedinPublisher.js';
export { instagramPublisher } from './instagramPublisher.js';

import { twitterPublisher } from './twitterPublisher.js';
import { linkedinPublisher } from './linkedinPublisher.js';
import { instagramPublisher } from './instagramPublisher.js';
import type { SocialPublisher } from './PublisherConfig.js';

export const publishers: Record<string, SocialPublisher> = {
    twitter: twitterPublisher,
    linkedin: linkedinPublisher,
    instagram: instagramPublisher,
};
