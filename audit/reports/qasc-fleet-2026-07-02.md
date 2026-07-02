---
title: 'GTCX QASC fleet scorecard'
status: current
date: 2026-07-02
owner: fabric-os
authority: GTCX-QASC-001
version: 1.0.0
---

# GTCX QASC Fleet Scorecard

Fleet score: **100/100**. Repositories at benchmark:
**18/18**.

Deletion preservation score: **100/100**.
Exact recovery gaps: **0**.
Current bare deletes: **0**.

| Repository     | Fleet score | QASC score | Deletion preservation | Controls at benchmark | MPR | SIGNAL | Next remediation  |
| -------------- | ----------: | ---------: | --------------------: | --------------------: | --: | -----: | ----------------- |
| agile-os       |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| bridge-os      |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| canon-os       |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| compliance-os  |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| ecosystem-os   |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| exploration-os |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| fabric-os      |     100/100 |    100/100 |               100/100 |                 30/30 | 100 |     L5 | benchmark reached |
| griot-ai       |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| inspection-os  |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| ledger-os      |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| ledger-ui      |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| markets-os     |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| nyota-ai       |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| sensei-os      |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| terminal-os    |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| terra-os       |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| venture-os     |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |
| veritas-ai     |     100/100 |    100/100 |               100/100 |                 29/29 | 100 |     L5 | benchmark reached |

## Loop Determination

- Benchmark: 100/100 per repository.
- Coverage denominator: 18 explicitly versioned repositories.
- Below-benchmark repositories remain in the remediation loop; no binary pass/fail
  label substitutes for their scores.
- Fleet enforcement requires both the repository QASC witness and the
  deletion-preservation witness to reach benchmark.
- Fleet enforcement exits nonzero while any repository is below benchmark.

Machine witness: `audit/evidence/qasc-fleet-latest.json`.
