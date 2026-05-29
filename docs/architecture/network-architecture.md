---
title: "Network Architecture"
status: "current"
date: "2026-05-27"
owner: "gtcx-infrastructure"
role: "protocol-architect"
agent_id: "agent://gtcx-infrastructure/2026-05-27/session-backfill"
trust_score: 60
autonomy_level: "permissioned"
tier: "standard"
tags: ["documentation", "architecture"]
review_cycle: "on-change"
---

---
title: 'Network Architecture'
status: 'current'
date: '2026-05-10'
owner: 'frontier-infra-engineer'
role: 'frontier-infra-engineer'
tier: 'informational'
tags: ['crypto', 'architecture', 'infrastructure', 'frontend', 'database']
review_cycle: 'monthly'
---

# Network Architecture

**Protocol:** GTCX Protocol Layer
**Version:** 3.0.0

---

## 1. Design Principles

The GTCX network is built around five non-negotiable constraints derived from frontier market deployment realities:

1. **Offline-first** — Network partitions are normal operating conditions. Every node runs autonomously when disconnected.
2. **Mesh resilience** — No single point of failure. Regional clusters self-organize without central coordination.
3. **Bandwidth efficiency** — Optimized for 2G/3G frontier markets. Progressive enhancement from SMS to broadband.
4. **Sovereign routing** — Data residency respects jurisdictional requirements. Government nodes have routing priority.
5. **Cryptographic integrity** — All messages signed and verified. Replay protection built-in at the envelope level.

---

## 2. Network Topology

```
GLOBAL TIER (Internet Backbone)
┌─────────────────────────────────────────────────────────────────────────────┐
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Gateway  │◄──▶│ Gateway  │◄──▶│ Gateway  │◄──▶│ Gateway  │              │
│  │  (EU)    │    │ (Africa) │    │  (ME)    │    │  (APAC)  │              │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘              │
└───────│───────────────│───────────────│───────────────│─────────────────────┘
        │               │               │               │
REGIONAL TIER (Country Networks)
┌───────│───────────────│───────────────────────────────────────────────────────┐
│       ▼               ▼                                                        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                                 │
│  │ Regional │    │ Regional │    │ Regional │                                 │
│  │ Hub (GH) │    │ Hub (RW) │    │ Hub (CD) │                                 │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘                                 │
└───────│───────────────│───────────────│───────────────────────────────────────┘
        │               │               │
LOCAL TIER (Field Nodes)
┌───────│───────────────────────────────────────────────────────────────────────┐
│       ▼                                                                        │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐                                 │
│  │ Field    │    │ Field    │    │ Field    │                                 │
│  │ Node     │    │ Node     │    │ Node     │  (TapKit + VIA/VXA devices)     │
│  └──────────┘    └──────────┘    └──────────┘                                 │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Tier Responsibilities

| Tier         | Nodes                     | Connectivity      | Role                                             |
| ------------ | ------------------------- | ----------------- | ------------------------------------------------ |
| **Global**   | 4 gateway nodes (minimum) | Always-on         | Cross-regional routing, AGX, global PANX         |
| **Regional** | 1+ hub per SGX country    | High availability | National exchange, regional PANX, data residency |
| **Local**    | Field Operations Centers  | Intermittent      | Field agent hub, TapKit sync, producer support   |

---

## 3. PANX Message Transport

### 3.1 Message Envelope

Every PANX message uses a signed envelope that provides authenticity, integrity, and replay protection:

```typescript
interface PANXEnvelope {
  messageId: string; // UUID, globally unique
  senderId: string; // Sender DID
  recipientId: string; // Recipient DID or broadcast group
  timestamp: string; // ISO 8601
  nonce: string; // Random nonce for replay prevention
  payload: unknown; // Signed content
  signature: string; // Ed25519 signature over header + payload hash
  ttl: number; // Time-to-live in seconds
}
```

### 3.2 Replay Protection

All nodes maintain a replay cache keyed by `(senderId, nonce)` with configurable TTL windows. A message is rejected if:

- The `(senderId, nonce)` pair has been seen within the TTL window
- The `timestamp` is outside the acceptable clock skew window (±5 minutes)
- The `signature` verification fails

In production, the replay cache must be backed by Redis for multi-instance deployments. See `../../4-operations/runbooks/production-store-integration.md`.

---

## 4. Peer Discovery

Nodes discover peers through a three-mechanism cascade:

1. **Bootstrap seeds** — Hardcoded well-known gateway addresses for initial connectivity
2. **DNS-based discovery** — `_gtcx._tcp.<region>.gtcx.network` SRV records for regional hubs
3. **Gossip protocol** — Active peers share known peer lists; nodes maintain a routing table of verified peers

Regional hubs are announced with their validator category (Government, Buyer, Community) and jurisdiction. This allows PANX consensus to ensure correct validator composition.

---

## 5. Mesh Networking for Offline Clusters

When regional connectivity drops, field nodes form a local mesh:

```
                    [ Regional Hub: OFFLINE ]
                            │
         ┌──────────────────┼──────────────────┐
         ▼                  ▼                  ▼
   ┌──────────┐       ┌──────────┐       ┌──────────┐
   │ Field    │◄─────▶│ Field    │◄─────▶│ Field    │
   │ Node A   │       │ Node B   │       │ Node C   │
   └──────────┘       └──────────┘       └──────────┘
         │                                     │
   ┌──────────┐                         ┌──────────┐
   │TapKit/   │                         │TapKit/   │
   │VIA device│                         │VXA device│
   └──────────┘                         └──────────┘
```

In mesh mode:

- Local custody transfers are recorded and queued
- GCI updates are held pending sync
- PANX consensus requiring >local validators is queued for reconnection
- Field nodes share queues over local mesh (Bluetooth, WiFi-Direct, or local IP)

---

## 6. Consensus Messaging

### 6.1 Consensus Flow

```
Initiator                 PANX Network                  Validator Nodes
   │                           │                              │
   │  1. Broadcast Claim       │                              │
   │──────────────────────────▶│                              │
   │                           │  2. Route to validators      │
   │                           │─────────────────────────────▶│
   │                           │                              │
   │                           │           3. Validate + Sign │
   │                           │◀─────────────────────────────│
   │                           │                              │
   │                           │  4. Aggregate (≥2/3)         │
   │                           │  Check: ≥1 Gov, ≥1 Buyer,    │
   │                           │         ≥1 Community         │
   │                           │                              │
   │  5. Return Finalized Proof│                              │
   │◀──────────────────────────│                              │
```

### 6.2 Consensus Timeouts

| Event Type                 | Timeout    | Behavior on Timeout             |
| -------------------------- | ---------- | ------------------------------- |
| **Standard transfer**      | 30 seconds | Queue for retry                 |
| **High-value transfer**    | 5 minutes  | Escalate to manual review       |
| **Emergency consensus**    | 10 seconds | Reduced validator set permitted |
| **Offline sync consensus** | 4 hours    | Asynchronous post-sync          |

---

## 7. Bandwidth Optimization

All protocol messages use bandwidth-aware encoding:

| Optimization         | Implementation                         | Saving              |
| -------------------- | -------------------------------------- | ------------------- |
| **Binary encoding**  | Protocol Buffers for internal messages | 60–70% vs JSON      |
| **Field pruning**    | Omit null/default fields               | 15–30%              |
| **Compression**      | Gzip for payloads >1KB                 | 40–60%              |
| **Delta sync**       | Only changed fields on update          | 70–90%              |
| **Batch submission** | Group events for single transport call | Reduces round-trips |

---

## Reference

- [system-overview.md](system-overview.md)
- [offline-architecture.md](offline-architecture.md)
