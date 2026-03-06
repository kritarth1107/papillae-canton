/**
 * @file types/ledger.ts
 * TypeScript mirrors of Papillae DAML contracts for type-safe orchestration.
 */

export enum StableCoin {
    USDC = 'USDC',
    USDT = 'USDT',
    PYUSD = 'PYUSD',
    EURC = 'EURC'
}

export enum FiatCurrency {
    PHP = 'PHP',
    NGN = 'NGN',
    MXN = 'MXN',
    KES = 'KES',
    GHS = 'GHS',
    BRL = 'BRL'
}

export enum IntentStatus {
    Created = 'Created',
    Compliant = 'Compliant',
    Routed = 'Routed',
    Executing = 'Executing',
    AwaitingSettlement = 'AwaitingSettlement',
    Settled = 'Settled',
    Refunded = 'Refunded',
    Cancelled = 'Cancelled'
}

export interface RouteInfo {
    partner: string;
    corridorId: string;
    bridgeProtocol: string;
    estimatedFeeBps: number;
    estimatedSlippage: number;
}

export interface ErrorDetail {
    code: string;
    message: string;
    timestamp: string;
}

export interface PaymentIntentPayload {
    sender: string;
    orchestrator: string;
    paymentId: string;
    amount: number;
    stableCoin: StableCoin;
    targetCurrency: FiatCurrency;
    recipientRef: string;
    priority: 'Cost' | 'Speed' | 'Balanced';
    status: IntentStatus;
    route?: RouteInfo;
    attestationCid?: string;
    errors: ErrorDetail[];
    createdAt: string;
    lastUpdatedAt: string;
}

export interface SessionLimits {
    maxPerTransfer: number;
    maxDailyVolume: number;
    allowedCorridors: string[];
}

export interface UsageTracker {
    dailyVolumeSpent: number;
    lastResetTime: string;
}

export interface AgentSessionPayload {
    delegator: string;
    agent: string;
    orchestrator: string;
    sessionId: string;
    limits: SessionLimits;
    tracker: UsageTracker;
    expiresAt: string;
    isActive: boolean;
}
