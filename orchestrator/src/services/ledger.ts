import { Ledger } from '@daml/ledger';
import { Template } from '@daml/types';
import { config } from './config';
import { PaymentIntentPayload, AgentSessionPayload } from '../types/ledger';
import pino from 'pino';

const logger = pino({ level: config.LOG_LEVEL });

/**
 * Helper to create a Template shim for a given ID and payload type.
 * This satisfies @daml/ledger's requirement for a Template object when full codegen isn't used.
 */
function createTemplateShim<T extends object>(templateId: string): Template<T, any, string> {
    const template: any = {
        templateId,
        templateIdWithPackageId: templateId,
        sdkVersion: '3.4.11',
        keyDecoder: { decode: (v: any) => v },
        keyEncode: (k: any) => k,
        decoder: { decode: (v: any) => v },
        encode: (val: T) => val as any,
    };
    template.Archive = {
        template: () => template,
        choiceName: 'Archive',
        argumentEncode: (arg: any) => arg,
        argumentDecoder: { decode: (v: any) => v },
        resultDecoder: { decode: (v: any) => v },
    };
    return template as Template<T, any, string>;
}

/**
 * Helper to create a Choice shim for a given template and choice name.
 */
function createChoiceShim<T extends object, Arg, Res>(template: Template<T, any, any>, choiceName: string) {
    return {
        template,
        choiceName,
        argumentEncode: (arg: Arg) => arg as any,
        argumentDecoder: () => ({}) as any,
        resultDecoder: () => ({}) as any,
    } as any;
}

export class LedgerService {
    private ledger: Ledger;

    constructor(token: string) {
        this.ledger = new Ledger({
            httpBaseUrl: config.CANTON_JSON_API_URL,
            token,
        });
    }

    /**
     * Typed watcher for payment intents in a specific status.
     */
    public watchIntents(
        onNewIntent: (contractId: string, payload: PaymentIntentPayload) => Promise<void>
    ) {
        logger.info('Starting Typed PaymentIntent watcher...');
        const template = createTemplateShim<PaymentIntentPayload>('Papillae.Payment.PaymentIntent:PaymentIntent');

        const stream = this.ledger.streamQuery(template as any, {});
        stream.on('change', async (_contracts, events) => {
            for (const event of events) {
                if ('created' in event) {
                    const contract = event.created;
                    await onNewIntent(contract.contractId, contract.payload as any);
                }
            }
        });

        (stream as any).on('error', (err: any) => logger.error({ err }, 'PaymentIntent stream error'));
    }

    /**
     * Generic typed exercise choice.
     */
    public async exerciseTyped<T, R>(
        templateId: string,
        contractId: string,
        choice: string,
        argument: T
    ): Promise<R> {
        const template = createTemplateShim<any>(templateId);
        const choiceShim = createChoiceShim<any, T, R>(template, choice);
        try {
            const result = await this.ledger.exercise(choiceShim, contractId as any, argument);
            return result as R;
        } catch (err) {
            logger.error({ err, choice, contractId }, 'Exercise choice failed');
            throw err;
        }
    }

    /**
     * Shim for backward compatibility with string-based exercise in older parts of the code.
     */
    public async exercise(templateId: string, contractId: string, choice: string, argument: any): Promise<any> {
        return this.exerciseTyped<any, any>(templateId, contractId, choice, argument);
    }

    /**
     * Query for a specific agent session.
     */
    public async getAgentSession(sessionId: string): Promise<{ contractId: string, payload: AgentSessionPayload } | null> {
        const template = createTemplateShim<AgentSessionPayload>('Papillae.Payment.AgentSession:AgentSession');
        const results = await this.ledger.query(template as any, { sessionId } as any);
        if (results.length === 0) return null;
        return {
            contractId: results[0].contractId,
            payload: results[0].payload as AgentSessionPayload
        };
    }
}
