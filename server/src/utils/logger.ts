// =============================================================================
// Logger — Pino
// =============================================================================
// Structured JSON logger with pretty-printing in development.
// =============================================================================

import pino from 'pino';
import { env } from '../config/index.js';

export const logger = pino({
    level: env.LOG_LEVEL,
    transport:
        env.NODE_ENV === 'development'
            ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'HH:MM:ss' } }
            : undefined,
    serializers: {
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
        err: pino.stdSerializers.err,
    },
});
