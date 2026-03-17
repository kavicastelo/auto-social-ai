// =============================================================================
// Server Entry Point — Fastify Bootstrap
// =============================================================================
// Registers plugins, middleware, routes, and starts the server.
// =============================================================================

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';

import { env } from './config/index.js';
import { prisma } from './database/index.js';
import { logger } from './utils/index.js';
import { errorHandler } from './middleware/index.js';

// Module routes
import { authRoutes } from './modules/auth/routes.js';
import { contentRoutes } from './modules/content/routes.js';
import { schedulerRoutes } from './modules/scheduler/routes.js';
import { accountsRoutes } from './modules/accounts/routes.js';
import { analyticsRoutes } from './modules/analytics/routes.js';
import { mediaRoutes } from './modules/media/routes.js';
import { automationRoutes } from './modules/automation/routes.js';
import { systemRoutes } from './modules/system/routes.js';
import { workspacesRoutes } from './modules/workspaces/routes.js';

// Workers (imported for side-effect — starts processing)
import './workers/index.js';

// =============================================================================
// Build Application
// =============================================================================

async function buildApp() {
    const app = Fastify({
        logger: {
            level: env.LOG_LEVEL,
            transport:
                env.NODE_ENV === 'development'
                    ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
                    : undefined,
        },
        trustProxy: true,
    });

    // ── Plugins ────────────────────────────────────────────────────────────────
    await app.register(cors, {
        origin: [
            env.CLIENT_URL,
            'http://localhost:5173',
            'http://127.0.0.1:5173',
            'http://localhost:4173', // Vite preview
            'http://127.0.0.1:4173',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });

    await app.register(cookie);

    await app.register(helmet, {
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                imgSrc: ["'self'", 'data:', 'https:'],
                connectSrc: ["'self'", env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
            },
        },
        xssFilter: true, // X-XSS-Protection header
        noSniff: true,   // X-Content-Type-Options: nosniff
        referrerPolicy: { policy: 'same-origin' },
        hidePoweredBy: true,
    });

    await app.register(jwt, {
        secret: env.JWT_SECRET,
    });

    await app.register(multipart, {
        limits: {
            fileSize: 50 * 1024 * 1024, // 50 MB
            files: 5,
        },
    });

    await app.register(rateLimit, {
        max: 100,
        timeWindow: '1 minute',
    });

    // ── Global Error Handler ───────────────────────────────────────────────────
    app.setErrorHandler(errorHandler);

    // ── Health Check ───────────────────────────────────────────────────────────
    app.get('/api/health', async () => ({
        success: true,
        data: {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        },
        error: null,
    }));

    // ── API Routes ─────────────────────────────────────────────────────────────
    await app.register(authRoutes, { prefix: '/api/auth' });
    await app.register(contentRoutes, { prefix: '/api/content' });
    await app.register(schedulerRoutes, { prefix: '/api/scheduler' });
    await app.register(accountsRoutes, { prefix: '/api/accounts' });
    await app.register(analyticsRoutes, { prefix: '/api/analytics' });
    await app.register(mediaRoutes, { prefix: '/api/media' });
    await app.register(automationRoutes, { prefix: '/api/automation' });
    await app.register(systemRoutes, { prefix: '/api/system' });
    await app.register(workspacesRoutes, { prefix: '/api/workspaces' });

    return app;
}

// =============================================================================
// Start Server
// =============================================================================

async function start() {
    try {
        // Verify database connection
        await prisma.$connect();
        logger.info('✅ Database connected');

        const app = await buildApp();

        await app.listen({
            host: env.SERVER_HOST,
            port: env.SERVER_PORT,
        });

        logger.info(`🚀 Server running at http://${env.SERVER_HOST}:${env.SERVER_PORT}`);

        // Graceful shutdown
        const shutdown = async (signal: string) => {
            logger.info(`${signal} received — shutting down gracefully`);
            await app.close();
            await prisma.$disconnect();
            process.exit(0);
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    } catch (error) {
        logger.fatal({ err: error }, 'Failed to start server');
        await prisma.$disconnect();
        process.exit(1);
    }
}

start();
