// =============================================================================
// Prisma Client — Singleton
// =============================================================================
// Re-uses a single PrismaClient instance across the application to avoid
// exhausting database connections during development hot-reloads.
// =============================================================================

import { PrismaClient, Prisma } from '@prisma/client';
import { env } from '../config/index.js';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        log: env.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['error'],
    });

if (env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export { Prisma };
