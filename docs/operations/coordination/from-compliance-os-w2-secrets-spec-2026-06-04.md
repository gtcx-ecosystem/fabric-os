---
title: 'Inbound — W2 hub #17 secrets spec (from compliance-os)'
status: received
date: 2026-06-05
owner: gtcx-infrastructure
from: compliance-os
to: gtcx-infrastructure
priority: P1
hub_blocker: 17
responds_to_commit: 77dfa9b
---

# Inbound received — W2 prod secrets

**Full specification (canonical):**  
`compliance-os/docs/operations/coordination/to-gtcx-infrastructure-w2-secrets-inbound-2026-06-04.md`

**Hub copy:** `baseline-os/workstream/coordination/inbound/from-compliance-os-w2-secrets-spec-2026-06-04.md`

## Ping `77dfa9b` — answered

| Field       | Answer                                                                                                                                                       |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Env names   | `COMPLIANCE_OS_INTAKE_API_KEY`, `COMPLIANCE_OS_TERMINAL_API_KEY` confirmed; internal → **`COMPLIANCE_API_INTERNAL_TOKEN`** (+ org id, terminal URL, API URL) |
| Values      | Infra generates (`openssl rand -base64 32`); org id `org_prod_diligence`                                                                                     |
| Environment | Staging (`gtcx-staging`) then production                                                                                                                     |
| Pod scope   | **apps/web** + **compliance-api** — not sovereign; not gateway-only                                                                                          |

## Infra action (proceed — matches ping § Infra action on receipt)

1. Seal in AWS SM (`af-south-1`) → ESO → `gtcx-staging` then prod.
2. Patch **web** Deployment `env.valueFrom.secretKeyRef`; align compliance-api internal token.
3. Rolling restart → post evidence (secret names, pod names, env verify — no values).
4. Unblocks: exploration `w2:prod:retest` → compliance PATCH proof → hub #17 close.

**Responds to:** [ping-gtcx-infrastructure-w2-secrets-2026-06-04.md](./ping-gtcx-infrastructure-w2-secrets-2026-06-04.md) (`77dfa9b`)
