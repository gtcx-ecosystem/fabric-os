# @gtcx/replay-protection

Backend replay-protection verifier for gtcx-mobile offline queue integrity.

## Principles

- **SECURE (P11)** — nonce uniqueness prevents replay attacks
- **RESILIENT (P12)** — clock-skew tolerance for low-connectivity regions
- **OBSERVABLE (P15)** — all rejections are counted and exportable as Prometheus metrics
- **AUDITABLE (P3)** — every decision emits a structured audit event

## Quick Start

```js
import { ReplayVerifier } from '@gtcx/replay-protection';
import { MemoryNonceStore } from '@gtcx/replay-protection/store/memory';

const verifier = new ReplayVerifier({
  nonceStore: new MemoryNonceStore(),
  verifySignature: async (integrity) => {
    // Your DID/signature verification logic
    return true;
  },
});

const result = await verifier.verify(integrity, {
  region: 'global-south',
  requestId: 'trace-123',
  deviceId: 'device-abc',
});

if (!result.allowed) {
  console.error('Rejected:', result.code, result.reason);
}

// Runtime metrics (Prometheus exposition format)
console.log(verifier.metricsPrometheus());
```

## Architecture

```
┌─────────────────┐
│  Mobile Queue   │──► QueueIntegrity payload
└─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│ ReplayVerifier  │────►│  NonceStore  │  (Memory | Redis)
└─────────────────┘     └──────────────┘
         │
    ┌────┴────┬────────────┬─────────────┐
    ▼         ▼            ▼             ▼
Timestamp  Signature    Metrics      AuditSink
 Window    verify()    (Prometheus)  (console|webhook)
```

## Clock-Skew Policy

| Region Type | Base Window | Extra Buffer | Total |
|-------------|-------------|--------------|-------|
| Standard    | 5 min       | —            | 5 min |
| Low-connectivity (`global-south`, `rural`, `mesh`, `satellite`) | 5 min | +10 min | 15 min |

Future-dated timestamps >2 min ahead are always rejected.

## Rejection Codes

| Code | Meaning |
|------|---------|
| `REPLAY_OK` | Accepted |
| `REPLAY_NONCE` | Nonce already consumed |
| `REPLAY_STALE` | Timestamp outside acceptance window |
| `REPLAY_FUTURE` | Timestamp is too far in the future |
| `REPLAY_SIGNATURE` | Signature verification failed |
| `REPLAY_ENVELOPE` | Envelope / body / header hash mismatch |

## Exit Gate

> *Replay and stale-request rejection is measurable in runtime, not just code.*

```js
// Snapshots
verifier.metricsSnapshot();
// { acceptedTotal: 42, rejectedNonceTotal: 3, rejectedStaleTotal: 1, ... }

// Prometheus exposition
verifier.metricsPrometheus();
// # HELP replay_protection_total Total replay-protection decisions
// replay_protection_total{code="REPLAY_NONCE"} 3
```

## Tests

```bash
pnpm test
```

Runs Node.js built-in test runner across all `.test.mjs` files.
