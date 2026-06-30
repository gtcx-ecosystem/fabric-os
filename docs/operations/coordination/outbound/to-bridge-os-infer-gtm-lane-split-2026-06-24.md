---
title: 'Outbound — joint inferGtmReadiness lane split (bridge-os)'
status: sent
date: 2026-06-24
from: fabric-os
to: bridge-os
initiative: INIT-XR-FLEET-MATURITY-LANES
ticket: XR-FLEET-MATURITY-LANES-001
related: MATURITY-LANE-BRG-001, GS-GTM-STAGE-002
authorityClass: R
protocol: P24
blocksIR: false
owner: fabric-os
document_type: runbook
tier: operating
tags: [fabric-os, coordination]
review_cycle: on-change
---

# To bridge-os — inferGtmReadiness must split lanes (joint closure #5)

**One-line read:** Until `build-fleet-diagnostic-snapshot.mjs` splits `productStage` from `procurementAssurance`, fleet dashboards will show **gtm.stage not_ready** on engineering-green repos — regardless of fabric-os witness work.

## Defect signature

Compare per repo in `pm/ci/fleet-diagnostic-dashboard-latest.json`:

- `diagnostics.engineering.score100` or `multiPillar.composite100` ≥ 85
- `diagnostics.gtm.gaps` includes `S4:soc2Path` or `S3:privacyPolicy` while engineering is shippable

## Required (already specced)

`MATURITY-LANE-BRG-001` — see `bridge-os/docs/product/roadmap/stories/MATURITY-LANE-BRG-001.json`

## fabric-os position

- Assurance witnesses will carry `blocksGtmStage: false`
- fabric-os cannot close handoff criterion #5 alone

## Ack template

```markdown
## outbound-ack — inferGtmReadiness lane split

- **Status:** ack | in-progress | done
- **Owner:** bridge-os
- **Evidence:** commit SHA · fleet-diagnostic-dashboard shows integratorPilotGtm separate from enterpriseProcurementGtm
```
