import { LedgerService } from '../services/ledger';
import { config } from '../services/config';
import { StableCoin, FiatCurrency } from '../types/ledger';
import pino from 'pino';

const logger = pino({ level: config.LOG_LEVEL });

async function simulateDeepAgentPayment() {
    logger.info('Starting High-Fidelity Agent Payment Simulation...');

    const ledger = new LedgerService(config.ORCHESTRATOR_TOKEN);

    try {
        const sessionId = 'ALICE_TRAVEL_AGENT_SESSION_v1';

        logger.info({ sessionId }, 'Initiating cross-border payment request');

        // Exercise RequestPayment on the AgentSession
        // This atomically creates a PaymentIntent on the ledger
        await ledger.exerciseTyped(
            'Papillae.Payment.AgentSession:AgentSession',
            sessionId,
            'RequestPayment',
            {
                paymentId: `INT-PAY-${Date.now()}`,
                amount: 750.0,
                stableCoin: StableCoin.USDC,
                targetFiat: FiatCurrency.PHP,
                recipient: 'RECP-ALICE-123',
                priority: 'Speed',
                now: new Date().toISOString(),
            }
        );

        logger.info('--- Simulation Status: SUCCESS ---');
        logger.info('PaymentIntent created. The Orchestrator loop will now pick it up for screening and routing.');
    } catch (err) {
        logger.error({ err }, 'Deep simulation failed');
        process.exit(1);
    }
}

simulateDeepAgentPayment();
