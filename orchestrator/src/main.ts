import { LedgerService } from './services/ledger';
import { ComplianceService } from './services/compliance';
import { RoutingService } from './services/routing';
import { AgentManager } from './services/agent-manager';
import { config } from './services/config';
import { IntentStatus } from './types/ledger';
import pino from 'pino';

const logger = pino({ level: config.LOG_LEVEL });

async function main() {
    logger.info('Papillae Deep Orchestrator starting up...');

    const ledger = new LedgerService(config.ORCHESTRATOR_TOKEN);
    const compliance = new ComplianceService();
    const routing = new RoutingService();
    const agentManager = new AgentManager(ledger);

    // Core Reactive Loop
    ledger.watchIntents(async (contractId, payload) => {
        const { paymentId, sender, amount, targetCurrency, status } = payload;

        if (status === IntentStatus.Created) {
            logger.info({ paymentId }, 'Phase 1: Compliance Screening');

            try {
                // 1. Compliance Attestation
                const attestation = await compliance.screenTransaction(paymentId, sender, amount);

                // Note: Real flow would involve creating a ComplianceAttestation contract first
                // For this demo, we proceed to routing directly after screening

                logger.info({ paymentId }, 'Phase 2: Route Selection');
                const route = await routing.findOptimalRoute(amount, targetCurrency);

                // 3. Update Ledger: Attach Route
                await ledger.exerciseTyped(
                    'Papillae.Payment.PaymentIntent:PaymentIntent',
                    contractId,
                    'LockRoute',
                    {
                        routeInfo: route,
                        now: new Date().toISOString()
                    }
                );

                logger.info({ paymentId }, 'Intent successfully processed and routed');
            } catch (err) {
                logger.error({ err, paymentId }, 'Process failed at orchestration layer');
            }
        }
    });

    // Optional: Monitor agent sessions periodically
    setInterval(() => {
        // In a real system, you'd iterate over active sessions
        // logger.debug('Checking agent sessions health...');
    }, 60000);
}

main().catch(err => {
    logger.error({ err }, 'Fatal error in orchestrator');
    process.exit(1);
});
