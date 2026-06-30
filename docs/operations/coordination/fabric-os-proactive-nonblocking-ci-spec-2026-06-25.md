---
title: 'fabric-os proactive non-blocking CI spec'
status: draft
date: 2026-06-25
owner: fabric-os
document_type: spec
tier: critical
tags: ['ci', 'compliance', 'p35', 'non-blocking', 'spec']
document_id: FABRIC-NONBLOCK-CI-001
review_cycle: on-change
---

# fabric-os proactive non-blocking CI spec

Goal: ensure fabric-os never becomes the silent blocker for sibling-repo engineering or GTM progress. All gates that fabric-os owns for the fleet must be greenable by Class R automation; live credentials remain Class A/S.

## 1. Fleet substrate contract

fabric-os owns the fleet substrate contract. Every sibling repo declares its dependency on fabric-os substrate via:

- `docs/operations/coordination/to-fabric-os-<work>-<date>.md` handoff
- `pm/spec/fabric-substrate-dependencies.json` in the consumer repo
- bridge-os fleet dependency graph

fabric-os must acknowledge within 1 business day and commit a target date or named prerequisite.

## 2. Proactive P35 + ops health CI

Run a fabric-os-coordinated fleet health check every 4 hours in CI:

```bash
pnpm fabric:fleet:health:check
```

Required probes:

| Probe                                   | Owner     | Green threshold              | Action on red                                                |
| --------------------------------------- | --------- | ---------------------------- | ------------------------------------------------------------ |
| `p35-layout-check --strict`             | fabric-os | score 100, 0 violations      | File P24 handoff to offending repo with exact violation list |
| `pnpm operations:check`                 | each repo | exit 0                       | Consumer repo fixes; fabric-os provides template             |
| `agentic/manifest.json` present + valid | each repo | parse OK                     | fabric-os provides `agentic/manifest.json` template          |
| `agent:work-selection:check`            | each repo | exit 0                       | fabric-os assists with manifest wiring                       |
| docs broken links                       | each repo | 0 broken                     | Automated delink PR opened by fabric-os bot                  |
| dated witness siblings                  | each repo | 0 dated `-latest` duplicates | fabric-os bot opens archival PR                              |

## 3. Staging API / credential SLO

For any repo depending on a fabric-os-hosted staging API:

- fabric-os publishes a `staging-health-latest.json` witness daily.
- Credential rotation is announced 7 days in advance via handoff.
- Breakage must be fixed or downgraded to a named prerequisite within 4 hours during business hours.

## 4. SECAS / vendor assurance isolation

Security/legal/audit gates (SECAS-S2-01, BG-10-10/11/12, SOC2, EXT-INF-\*) remain parallel lanes with `blocksIR: false`. They must never appear as engineering next-work blockers.

## 5. Escalation taxonomy

| Class | Example                                        | fabric-os action                              |
| ----- | ---------------------------------------------- | --------------------------------------------- |
| R     | P35 layout, ops check, docs links              | Fix in-session or open PR                     |
| A     | Staging credentials, ACM cert, DNS             | Execute after operator authorization artifact |
| S     | Legal sign-off, vendor report, auditor opinion | Register only; do not execute                 |

## 6. Implementation checklist

- [ ] Add `pnpm fabric:fleet:health:check` to fabric-os CI
- [ ] Add fleet health witness writer
- [ ] Create bot script to open automated delink/archival PRs
- [ ] Add daily `staging-health-latest.json` generation
- [ ] Update AGENTS.md with this spec
- [ ] Add cross-repo-agent-log template for proactive health red → green
