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
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
    console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
    process.exit(1);
}

export const env = parsed.data;
export type Env = z.infer<typeof envSchema>;
