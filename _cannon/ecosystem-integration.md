# Ecosystem Integration Report

**Date:** 2026-03-09
**Scope:** GTCX Ecosystem — cross-repo integration architecture
**Method:** package.json dependency analysis, source directory inspection, CI pipeline review

---

## Current Integration Reality

What's actually connected (confirmed from code, not documentation):

```
ai-2-ledger (design system)
    ↓ @gtcx/ui, @gtcx/theme, @gtcx/tokens
    ↓
ai-3-fiftyfour ──────────────── compliance-os
(13 surfaces)                   (platform + mobile)
    ↓ HTTP only                     ↓ @gtcx/audit-trail
    ↓ no typed contract             ↓ @gtcx/agent-runtime
    [backend undefined]             [WORKING]

2-core (@gtcx/crypto, @gtcx/types, @gtcx/schemas, @gtcx/domain)
    ↓
3-protocols (TradePass, GeoTag, GCI, VaultMark, PvP, PANX)
    ↓ only 3 of 6 consumed downstream
6-platforms/operations (VaultKit→VaultMark, TapKit→GeoTag, TradeCV→TradePass)
    AGX, CRX, SGX, Pathways: ZERO protocol imports

5-intelligence (ANISA, Cortex, PANX analytics)
    → [CONNECTED TO NOTHING]

7-mobile → @gtcx/api-client → [sync implementation unconfirmed]
```

---

## Confirmed Integration Map

### What's Actually Wired

| Consumer             | Imports From | What It Gets                                                                         |
| -------------------- | ------------ | ------------------------------------------------------------------------------------ |
| 3-protocols          | 2-core       | @gtcx/crypto, @gtcx/domain, @gtcx/schemas, @gtcx/audit, @gtcx/auth, @gtcx/validators |
| ai-3-fiftyfour       | ai-2-ledger  | @gtcx/ui, @gtcx/theme, @gtcx/tokens                                                  |
| compliance-os        | 2-core       | @gtcx/audit-trail, @gtcx/types, @gtcx/feature-gate, @gtcx/agent-runtime              |
| 6-platforms/VaultKit | 3-protocols  | @gtcx/protocol-vaultmark, @gtcx/types                                                |
| 6-platforms/TapKit   | 3-protocols  | @gtcx/protocol-geotag, @gtcx/types                                                   |
| 6-platforms/TradeCV  | 3-protocols  | @gtcx/protocol-tradepass, @gtcx/types                                                |
| 7-mobile             | 2-core       | @gtcx/crypto, @gtcx/types, @gtcx/schemas, @gtcx/api-client                           |

### What's NOT Wired (Documented Intent vs. Reality)

| Connection                       | Intent                               | Reality                                         |
| -------------------------------- | ------------------------------------ | ----------------------------------------------- |
| Protocols → AGX/CRX/SGX/Pathways | Protocol-driven trade execution      | Zero imports                                    |
| Intelligence → Platforms         | AI-native risk scoring in trade flow | Zero imports                                    |
| Intelligence → Frontend          | Cortex insights surfaced to users    | Zero imports                                    |
| Frontend → Backend               | Full product surfaces                | HTTP calls to undefined routes; no OpenAPI spec |
| PANX Oracle → Price Discovery    | Market consensus feeds trading       | Not wired                                       |
| Compliance → Intelligence        | Audit signals feed risk models       | No event bus                                    |
| Hardware → Platforms             | Device attestation chain             | Integration point undefined                     |

---

## Protocol Adoption Status

| Protocol  | Confirmed Consumers                 | Status              |
| --------- | ----------------------------------- | ------------------- |
| TradePass | TradeCV (direct), TapKit (indirect) | In use              |
| GeoTag    | TapKit (direct)                     | In use              |
| VaultMark | VaultKit (direct)                   | In use              |
| PANX      | Intelligence layer (disconnected)   | Built, not consumed |
| GCI       | None confirmed                      | Built, not consumed |
| PvP       | None confirmed                      | Built, not consumed |

**3 of 6 protocols have confirmed consumers. AGX, CRX, SGX, Pathways have zero protocol imports.**

---

## Infrastructure Maturity

### Kubernetes — Production-Ready

- Base configs: namespace, ConfigMaps, service discovery
- Overlays for dev, staging, production with distinct ingress, pod security, and network policies
- Network policy defaults to deny-all with explicit allow rules
- **Mature enough for stateless services today**

### Terraform — Partial

- Modules: VPC (AWS), PostgreSQL database
- Missing: load balancer, CDN, secret management, autoscaling
- Multi-environment structure present but not fully populated

### Docker — Strong for Dev

- Compose files: dev (services), infra (observability: Prometheus/Grafana/Loki), test (integration)
- Production deployment path unclear

### Database Strategy — Incomplete

- PostgreSQL only (TypeORM)
- No caching layer, read replicas, or sharding strategy documented
- No event streaming infrastructure (Kafka, NATS, RabbitMQ)

---

## The Architecture Vision vs. The Architecture Reality

### Intended Layer Model (correct and will scale)

```
HARDWARE:       TapKit → GeoTag attestation, VaultKit → VaultMark custody
PROTOCOLS:      TradePass + GeoTag + GCI + VaultMark + PvP + PANX
PLATFORMS:      AGX + CRX + SGX + Veritas + Pathways + Operations
INTELLIGENCE:   ANISA + Cortex + PANX Analytics (cross-cutting)
SURFACES:       fifty-four (13 surfaces) + compliance-os + mobile
```

### Reality Gap

The middle three layers are not connected. The architecture is correct as a diagram. It is not yet correct as a system.

---

## Future-Proofed Architecture: What Must Be Built

### 1. Event Bus (Highest Priority)

Every cross-repo action should emit an event. Every layer subscribes to what it needs.

```
TRADE EVENT (AGX/CRX submit)
    → emit: trade.submitted, trade.verified, trade.settled
    → consumed by: compliance-os (audit), intelligence (risk), PANX (price feed)

PROTOCOL EVENT (3-protocols verify)
    → emit: identity.verified, location.confirmed, quality.certified
    → consumed by: platforms (unlock execution), compliance (evidence), mobile (status)

INTELLIGENCE EVENT (Cortex/ANISA)
    → emit: risk.elevated, anomaly.detected, trend.shifted
    → consumed by: frontends (alert), platforms (pause), compliance (flag)
```

Technology recommendation: NATS for simplicity and low-latency; Kafka if audit durability is the primary concern.

### 2. OpenAPI Contract at the Frontend Boundary

fifty-four calls `/api/tradebook/search`, `/api/tradedesk/workspace` with no typed contract. Before a second developer touches the API:

- Define OpenAPI spec for all frontend-facing routes
- Commit spec to 2-core or a dedicated `contracts` package
- Generate typed clients for TypeScript (frontend) and any Python consumers

### 3. Intelligence as a gRPC Microservice

ANISA and Cortex should not be npm packages imported into platform code. They should be gRPC microservices with defined contracts:

```protobuf
service IntelligenceService {
  rpc AssessRisk(TradeRequest) returns (RiskAssessment);
  rpc DetectAnomaly(EventStream) returns (AnomalyResult);
  rpc GetMarketContext(CommodityQuery) returns (MarketIntelligence);
}
```

Platforms call `IntelligenceService.assessRisk(trade)`. Intelligence upgrades without platform release cycles. This is the architecture that makes AI-native mean something.

### 4. Protocol Middleware for Platforms

AGX, CRX, SGX don't use protocols because there's no activation pattern. The fix:

```typescript
// NestJS declarative protocol enforcement
@RequiresProtocol(TradePass, GCI)
@Post('/trade/submit')
async submitTrade(@Body() trade: TradeRequest) { ... }
```

Protocol verification becomes declarative. Backend developers build business logic without becoming protocol experts. This unlocks all 6 protocols across all 6 platforms.

### 5. Single Domain Model (Cross-Language)

`@gtcx/types` (TypeScript), protocol types, Python services — define the same domain entities independently. Define canonical `.proto` files for `Trade`, `Commodity`, `Identity`, `Location`, `Claim`. Generate TypeScript + Python from them. One source of truth, three languages, zero silent divergence.

---

## The Moat Gap

The research surfaced a hard fact worth naming clearly: **the AI-native claim is currently a design claim, not a product claim.**

ANISA, Cortex, PANX analytics — all defined, none connected to execution. A competitor who builds a simpler but integrated intelligence layer on top of existing commodity platforms could credibly claim the same positioning without the protocol sophistication.

**The moat becomes real when:**

- A trader submitting to AGX gets a Cortex-generated counterparty risk score in the same flow
- PANX oracle consensus feeds live into price discovery on TradeDesk54
- ANISA's cultural context surfaces in Intel54 market analysis
- A compliance flag from compliance-os automatically pauses a trade and notifies relevant parties

**None of that is wired today.**

The 90-day copy test: could a funded team replicate what's currently deployed in 90 days? The honest answer is yes — because what's deployed is UI surfaces and protocol definitions, not the emergent intelligence that compounds across them.

**Activating the intelligence layer is the single highest-leverage technical decision in Q2.**

---

## Priority Integration Sequence

### Phase 1 — Unblock Near-Term (Q2)

1. Define OpenAPI spec for fifty-four → backend boundary; generate typed client
2. Wire PANX oracle outputs into AGX/CRX as a decision feed
3. Deploy event bus POC (NATS or Kafka); emit trade, compliance, and audit events
4. Add `@RequiresProtocol` middleware to platforms (AGX first)

### Phase 2 — Intelligence Activation (Q2-Q3)

1. Deploy Cortex as gRPC microservice with K8s deployment
2. Wire intelligence risk scoring into trade submission flow
3. Build feedback loop: compliance audit results → intelligence fine-tuning
4. Surface anomaly detection in fifty-four dashboard

### Phase 3 — Data Consistency (Q3)

1. Consolidate domain model: protobuf-first type generation
2. Add integration tests between platforms and protocols
3. Implement distributed tracing across all layers (OpenTelemetry hooks already partial)

### Phase 4 — Production Hardening (Q3-Q4)

1. Complete Terraform: load balancing, CDN, secret management, autoscaling
2. Database: replication, read replicas, analytics data warehouse
3. mTLS for inter-service communication
4. Chaos engineering tests
