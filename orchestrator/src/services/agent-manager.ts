import { LedgerService } from './ledger';
import { AgentSessionPayload } from '../types/ledger';
import pino from 'pino';
import { config } from './config';

const logger = pino({ level: config.LOG_LEVEL });

export class AgentManager {
    constructor(private ledger: LedgerService) { }

    /**
     * Monitor an active session and alert if limits are near exhaustion.
     */
    public async checkSessionHealth(sessionId: string): Promise<void> {
        const session = await this.ledger.getAgentSession(sessionId);
        if (!session) {
            logger.warn({ sessionId }, 'Session not found for health check');
            return;
        }

        const { payload } = session;
        const dailyUsageRatio = payload.tracker.dailyVolumeSpent / payload.limits.maxDailyVolume;

        if (dailyUsageRatio > 0.9) {
            logger.error({ sessionId, usage: dailyUsageRatio }, 'CRITICAL: Agent session daily limit almost exhausted');
            // In a real system, trigger a notification to the delegator
        } else if (dailyUsageRatio > 0.7) {
            logger.warn({ sessionId, usage: dailyUsageRatio }, 'Warning: Agent session usage is high');
        }
    }

    /**
     * Proactively revoke a session if suspicious activity is detected.
     */
    public async emergencyRevoke(contractId: string, reason: string): Promise<void> {
        logger.info({ contractId, reason }, 'Emergency revocation triggered');
        const templateId = 'Papillae.Payment.AgentSession:AgentSession';
        await this.ledger.exerciseTyped(templateId, contractId, 'RevokeSession', {});
    }
}
