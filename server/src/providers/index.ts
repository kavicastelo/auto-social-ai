export * from './PublisherConfig.js';
export { twitterPublisher } from './twitterPublisher.js';
export { linkedinPublisher } from './linkedinPublisher.js';
export { instagramPublisher } from './instagramPublisher.js';
export { facebookPublisher } from './facebookPublisher.js';
export { tiktokPublisher } from './tiktokPublisher.js';
export { googlePublisher } from './googlePublisher.js';

import { twitterPublisher } from './twitterPublisher.js';
import { linkedinPublisher } from './linkedinPublisher.js';
import { instagramPublisher } from './instagramPublisher.js';
import { facebookPublisher } from './facebookPublisher.js';
import { tiktokPublisher } from './tiktokPublisher.js';
import { googlePublisher } from './googlePublisher.js';
import type { SocialPublisher } from './PublisherConfig.js';

export const publishers: Record<string, SocialPublisher> = {
    twitter: twitterPublisher,
    linkedin: linkedinPublisher,
    instagram: instagramPublisher,
    facebook: facebookPublisher,
    tiktok: tiktokPublisher,
    google: googlePublisher,
    youtube: googlePublisher, // Mapping youtube to google publisher
};
