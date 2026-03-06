import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
    CANTON_JSON_API_URL: z.string().url(),
    ORCHESTRATOR_PARTY: z.string(),
    ORCHESTRATOR_TOKEN: z.string(),
    COMPLIANCE_PROVIDER_PARTY: z.string(),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export const config = envSchema.parse({
    CANTON_JSON_API_URL: process.env.CANTON_JSON_API_URL || 'http://localhost:7575',
    ORCHESTRATOR_PARTY: process.env.ORCHESTRATOR_PARTY,
    ORCHESTRATOR_TOKEN: process.env.ORCHESTRATOR_TOKEN,
    COMPLIANCE_PROVIDER_PARTY: process.env.COMPLIANCE_PROVIDER_PARTY,
    LOG_LEVEL: process.env.LOG_LEVEL,
});
