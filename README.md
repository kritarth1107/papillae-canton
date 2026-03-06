# Papillae — Canton Network Integration

> **Money should move like messages.**

Papillae is an intent-based payment orchestration layer for cross-border stablecoin-to-fiat transfers, with native support for AI agent payment delegation.

This repository contains the Canton Network / DAML implementation of Papillae's core payment contracts — the on-chain layer that makes cross-border payments auditable, non-custodial, and agent-native.

---

## What This Is

The Canton layer handles three things:

1. **PaymentIntent** — the canonical on-chain record of a cross-border transfer, from intent to settled fiat
2. **RouteRegistry** — live corridor health data maintained by the orchestrator, with automatic circuit breakers
3. **AgentSession** — scoped, time-limited payment keys for AI agents, with enforced spending limits

The off-chain layer (TypeScript) handles intent parsing, route computation, compliance screening, and bridge execution. The Canton contracts provide the audit trail, privacy guarantees, and agent delegation model that can't be replicated off-chain.

---

## Architecture

```
User / AI Agent
      │
      ▼
Intent Parser (TypeScript)
"Send $500 to Manila" → structured PaymentIntent object
      │
      ▼
Compliance Engine
AML + sanctions + Travel Rule + risk score → ComplianceProof
      │
      ▼
Route Engine
Dynamic graph across chains/bridges/off-ramps → RouteDetails
      │
      ▼
Canton Network (DAML)
PaymentIntent contract created → SelectRoute → BeginExecution
      │
      ▼
Off-Ramp Partner (Coins.ph / Yellow Card / Bitso)
USDC received on-chain → fiat delivered to recipient
      │
      ▼
ConfirmSettlement (on Canton)
Telemetry written → RouteRegistry updated
```

---

## DAML Contracts

### `PaymentIntent`
The core contract. Tracks a payment from `Pending` through `Routed → Executing → Settled` (or `Failed`). Stores the compliance proof bundle and route details on-chain. Non-custodial — Papillae never holds funds.

**Key choices:**
- `SelectRoute` — orchestrator locks in route + compliance proof
- `BeginExecution` — marks funds moving on-chain
- `ConfirmSettlement` — off-ramp partner confirms fiat delivery
- `MarkFailed` — terminal failure with reason
- `Cancel` — sender cancels before routing

### `RouteRegistry`
On-chain registry of corridor health. Updated after every batch of transfers. Automatic circuit breaker deactivates any corridor below 85% success rate.

### `AgentSession`
Session key contract for AI agent delegation. Enforces per-transfer, daily, and lifetime spending limits. Supports corridor and currency allowlists. `InitiatePayment` atomically creates a `PaymentIntent` and updates the spend tracker.

---

## Project Structure

```
papillae-canton/
├── daml.yaml                        # DAML package config
├── daml/
│   └── Papillae/
│       ├── Core/
│       │   └── RoleManager.daml     # Decentralized identity & permissions
│       ├── Compliance/
│       │   └── Attestation.daml    # KYC/AML proof integration
│       ├── Payment/
│       │   ├── PaymentIntent.daml   # Production-grade lifecycle management
│       │   └── AgentSession.daml    # Secure AI agent delegation
│       ├── Routing/
│       │   └── RouteRegistry.daml   # Corridor health & telemetry
│       ├── Test/
│       │   └── MainTest.daml        # E2E verification script
│       └── Common.daml              # Shared types & constants
└── README.md
```

## Production Contracts

### `Core.RoleManager`
Moves away from hardcoded parties to a decentralized governance model. Manages multiple `OffRampPartners` and `Orchestrators` through a capability-based architecture.

### `Compliance.Attestation`
A critical layer for industry-grade payments. Separates the compliance check from the payment intent, allowing licensed providers to issue short-lived, on-chain attestations that are required for any transfer to proceed.

### `Payment.PaymentIntent`
A comprehensive state machine tracking payments through 8 distinct stages. Includes integrated failure/refund logic, error tracking, and immutable links to compliance proofs and routing details.

### `Payment.AgentSession`
The industry's first agent-native delegation model for Canton. Enforces atomic spending limits, rolling 24-hour volume caps, and corridor allowlists to ensure AI agents operate within strict safety rails.

### `Routing.RouteRegistry`
Provides dynamic corridor health tracking and telemetry. Orchestrators use this to select the optimal path based on success rates, latency, and liquidity metrics written on-chain after every transfer.

Canton's privacy model is uniquely suited to cross-border payments:

- **Sub-transaction privacy** — sender and recipient details are not visible to all network participants, only the relevant parties (sender, orchestrator, off-ramp partner)
- **DAML's explicit authorization model** — every state transition requires the correct signatories, making compliance enforcement programmable and auditable
- **Interoperability** — Canton's synchronizer model lets Papillae operate across multiple app domains without sacrificing privacy or auditability
- **Finality guarantees** — critical for payments where partial settlement is not acceptable

---

## Status

🟡 **In Development** — Core contracts drafted, integration with off-chain routing engine in progress.

**Q2 2026:** Beta launch.

---

## Contact

- **Website:** [papillae.tech](https://papillae.tech)
- **Email:** [kritarth@papillae.tech](mailto:kritarth@papillae.tech)
- **GitHub:** [github.com/PapillaeTech](https://github.com/PapillaeTech)
