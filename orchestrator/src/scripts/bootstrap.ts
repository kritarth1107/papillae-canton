import { LedgerService } from '../services/ledger';
import { config } from '../services/config';
import pino from 'pino';

const logger = pino({ level: config.LOG_LEVEL });

async function bootstrap() {
    logger.info('Starting ecosystem bootstrap...');

    const ledger = new LedgerService(config.ORCHESTRATOR_TOKEN);

    try {
        // 1. Create RoleManager
        logger.info('Creating RoleManager...');
        const roleManagerCid = await ledger.exercise(
            'Papillae.Core.RoleManager:RoleManager',
            'INITIAL_CREATE', // Simplified for demonstration
            'create',
            {
                governance: config.ORCHESTRATOR_PARTY,
                orchestrator: config.ORCHESTRATOR_PARTY,
                offRampPartners: [],
            }
        );

        // 2. Setup RoutingRegistry
        logger.info('Initializing RoutingRegistry...');
        await ledger.exercise(
            'Papillae.Routing.RouteRegistry:RoutingRegistry',
            'INITIAL_CREATE',
            'create',
            {
                orchestrator: config.ORCHESTRATOR_PARTY,
                partners: [],
                updatedAt: new Date().toISOString(),
            }
        );

        logger.info('Ecosystem bootstrap complete.');
    } catch (err) {
        logger.error({ err }, 'Bootstrap failed');
        process.exit(1);
    }
}

bootstrap();
