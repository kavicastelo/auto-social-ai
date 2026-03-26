// =============================================================================
// Environment Configuration
// =============================================================================
// Validates and exports typed environment variables using Zod.
// Fails fast at startup if required variables are missing.
// =============================================================================

import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
    // Database
    DATABASE_URL: z.string().url(),

    // Redis
    REDIS_URL: z.string().url().default('redis://localhost:6379'),

    // JWT
    JWT_SECRET: z.string().min(32),
    JWT_REFRESH_SECRET: z.string().min(32),
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

    // Server
    SERVER_HOST: z.string().default('0.0.0.0'),
    SERVER_PORT: z.coerce.number().default(3001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // Client
    CLIENT_URL: z.string().url().default('http://localhost:5173'),

    // Logging
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    // AI
    OPENAI_API_KEY: z.string().min(1, 'OpenAI API key is required').default('dummy_key'),

    // OAuth - X
    X_CONSUMER_KEY: z.string().optional(),
    X_SECRET_KEY: z.string().optional(),
    X_BEARER_TOKEN: z.string().optional(),

    // OAuth - Twitter
    TWITTER_CLIENT_ID: z.string().optional(),
    TWITTER_CLIENT_SECRET: z.string().optional(),

    // OAuth - LinkedIn
    LINKEDIN_CLIENT_ID: z.string().optional(),
    LINKEDIN_CLIENT_SECRET: z.string().optional(),

    // OAuth - Facebook
    FACEBOOK_CLIENT_ID: z.string().optional(),
    FACEBOOK_CLIENT_SECRET: z.string().optional(),

    // OAuth - Instagram
    INSTAGRAM_CLIENT_ID: z.string().optional(),
    INSTAGRAM_CLIENT_SECRET: z.string().optional(),

    // OAuth - Google
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),

    // OAuth - TikTok
    TIKTOK_CLIENT_ID: z.string().optional(),
    TIKTOK_CLIENT_SECRET: z.string().optional(),

    // Storage (S3/R2)
    S3_ENDPOINT: z.string().optional(),
    S3_REGION: z.string().default('auto'),
    S3_ACCESS_KEY_ID: z.string().optional(),
    S3_SECRET_ACCESS_KEY: z.string().optional(),
    S3_BUCKET_NAME: z.string().default('creatoregene-media'),
    S3_PUBLIC_DOMAIN: z.string().optional(),

    // Server URLs for callbacks
    SERVER_URL: z.string().url().default('http://localhost:3001'),
});

// Use PORT if provided by environment (common in Railway/Render)
const rawEnv = {
    ...process.env,
    SERVER_PORT: process.env.PORT || process.env.SERVER_PORT || 3001,
};

const parsed = envSchema.safeParse(rawEnv);

if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    console.error('❌ CRITICAL: Environment validation failed:');
    Object.entries(errors).forEach(([field, messages]) => {
        console.error(`   - ${field}: ${messages?.join(', ')}`);
    });
    console.error('\nTIP: JWT secrets must be at least 32 characters long.');
    process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
