---
title: 'PROG-DIGITAL-RAIL-WAVE-0 — cross-repo execution plan'
status: current
date: 2026-06-12
owner: fabric-os
canonical_repo: fabric-os
program: PROG-DIGITAL-RAIL-WAVE-0
ticket: XR-FABRIC-RAIL-003
initiative: INIT-DIGITAL-RAIL-WAVE-0
protocol: P24
priority: P0
blocksIR: false
---

# PROG-DIGITAL-RAIL-WAVE-0 — Continental digital-rail runtime

> **North star:** Staging-ready multi-rail runtime (tradfi-register default + evm-erc3643 stub path)
> with deploy witnesses, reconciled to gtcx-os adapter registry and markets-os policy SoR.
>
> **Fabric role:** Runtime orchestration, keys, DR, staging deploy — **not** adapter interface SoR
> (gtcx-os) or capital-markets transaction kernel (markets-os).

**Ack:** [`from-bridge-os-digital-rail-runtime-2026-06-12.md`](./from-bridge-os-digital-rail-runtime-2026-06-12.md)  
**Originating handoff:** bridge-os `to-fabric-os-digital-rail-runtime-2026-06-12.md`

---

## 1. Phase map

```
W0 scaffold ──► W1 staging smoke ──► W2 sovereign-approved EVM ──► W3 corridor (Stellar) optional
     │                  │                        │                              │
  programme +       per-rail witness         Besu/permissioned              profile-gated
  staging patch     + gtcx-os wire           live keys + DR                 anchor template
```

| Wave   | Label                        | Exit witness                                           |
| ------ | ---------------------------- | ------------------------------------------------------ |
| **W0** | Programme + staging scaffold | Ack + `pm/digital-rail-programme.json` + staging patch |
| **W1** | Staging smoke per rail id    | `digital-rail-staging-witness-latest.json` gates green |
| **W2** | Permissioned EVM live path   | Besu node + `evm-erc3643` adapter remote mode (DR-004) |
| **W3** | Stellar corridor (optional)  | Anchor ops template + Class S partner thread           |

---

## 2. Dependency graph

```mermaid
flowchart TB
  subgraph fabric["fabric-os"]
    RUN[Multi-rail runtime + DR + staging deploy]
  end
  subgraph protocols["gtcx-os"]
    DR[@gtcx/digital-rail registry]
    PVP[PvP close path XR-GTCX-PVP-RAIL-002]
  end
  subgraph markets["markets-os"]
    POL[digital-rail-policy.json]
    PROJ[Capital markets projection]
  end
  subgraph tokenization["PROG-TOKENIZATION-001"]
    TKN[Shared reconciliation discipline]
  end

  POL --> DR
  DR --> PVP
  RUN --> DR
  RUN --> TKN
  PROJ --> PVP
```

| Concern                       | Owner                        | Fabric touch                           |
| ----------------------------- | ---------------------------- | -------------------------------------- |
| Rail policy + ADR-0007        | markets-os / canon-os        | Link only — **proposed** until Class A |
| Adapter interface + PvP close | gtcx-os                      | Coordinate before prod apply           |
| Besu / permissioned EVM nodes | fabric-os                    | FR-002 staging path                    |
| Stellar anchor ops            | fabric-os + operator Class S | FR-003 template only in W0             |
| Key custody + DR              | fabric-os SECaaS             | FR-004                                 |
| Transaction kernel state      | markets-os                   | Not fabric SoR                         |

---

## 3. Parallel workstreams

| Track | Repo                  | Wave 0 item                                            |
| ----- | --------------------- | ------------------------------------------------------ |
| **A** | fabric-os             | Programme row, staging env, witness JSON               |
| **B** | gtcx-os               | `@gtcx/digital-rail` + PvP close (**done** `643a342f`) |
| **C** | markets-os            | Policy SoR frozen; ghana-vasp-chain → DR-004 refactor  |
| **D** | PROG-TOKENIZATION-001 | Shared reconciliation + assurance triggers at seal     |

---

## 4. Staging rails (Wave 0)

| Rail ID              | Staging default | Fabric action                         |
| -------------------- | --------------- | ------------------------------------- |
| `tradfi-register`    | **yes**         | Witness only — legal register primacy |
| `evm-erc3643`        | enabled stub    | Env patch + future Besu overlay       |
| `stellar-settlement` | **disabled**    | Ops template doc — profile gate       |
| `canton-hub`         | **disabled**    | future                                |

---

## 5. Human / Class gates

| Gate                        | Class | Owner                |
| --------------------------- | ----- | -------------------- |
| ADR-0007 accept             | A     | canon-os             |
| Stellar SDF partner         | S     | operator             |
| Production rail credentials | S     | operator + sovereign |

---

## 6. Hub mirror

> XR-FABRIC-RAIL-003 acknowledged; PROG-DIGITAL-RAIL-WAVE-0 execution plan published.
