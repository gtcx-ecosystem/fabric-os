---
title: 'SECaaS card — fabric-os self'
status: current
date: 2026-06-14
owner: fabric-os
tier: operating
tags: ['runbook', 'documentation']
review_cycle: on-change
document_type: runbook
---

# SECaaS card — fabric-os self

**Lane:** **platform** · **Ops lane:** SecOps + DevOps/InfraOps co-primary  
**Friction:** `SEC-SUPPLY-01`, `SEC-VULN-01`, `SEC-CSIRT-01` (closed)

## Stack security actions (self)

1. SLSA Build L3 provenance + npm publish with attestations
2. Trivy container scan and CodeQL SARIF upload in CI
3. Dependency-audit gate and dependabot tier policy in validate-all
4. Replay-protection, empty-catch, runbook-commands, and pin-actions-sha static gates
5. Cross-repo health probe witnesses fleet posture weekly
6. CSIRT/SOC operating model and incident-response runbook SoR

## Product handoff

Infra control drift or CI gate failure → `ops/coordination/outbound/to-gtcx-agentic-*.md` or `workstream/coordination/outbound/`

## Re-probe

```bash
node platform/tools/scripts/validate-all.mjs
```
