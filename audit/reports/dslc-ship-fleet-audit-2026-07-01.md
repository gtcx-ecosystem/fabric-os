---
title: 'GTCX fleet DSLC + SHIP audit'
status: current
date: 2026-07-01
owner: fabric-os
authority: GTCX-DSLC-001 + GTCX-SHIP-001
release: REL-GOLDEN-V1
mode: read-only fleet audit; fabric-os report/proof-pack filing only
---

# GTCX Fleet DSLC + SHIP Audit — 2026-07-01

## Executive result

This audit inspected 21 local GTCX repositories from `/Users/amanianai/Sites/gtcx-ecosystem`.
Sibling repositories were treated as read-only. `fabric-os` received the audit report and the
`REL-GOLDEN-V1` proof-pack scaffold.

Current fleet state:

- **DSLC + SHIP ready today:** 2/21 repos.
- **Ready repos:** `baseline-os`, `fabric-os`.
- **Release class proven today:** internal only.
- **Pilot/customer-contract SHIP ready today:** 0/21 repos.
- **QASC 100/100 + SIGNAL L5 already present:** 10/21 repos.
- **MPR 100/100 already present:** 11/21 repos.
- **SIGNAL L5 already present:** 13/21 repos.

Bottom line: the protocol architecture is correct, but the fleet is not yet v1-shipped under
pilot/customer-contract standards. `REL-GOLDEN-V1` is now the canonical pilot-class proof pack
for driving the chain to true `100/100` and SIGNAL `L5`.

Protocol-package status after this continuation:

- DSLC protocol package MPR: `100/100`.
- DSLC protocol package SIGNAL: `L5`.
- SHIP protocol package MPR: `100/100`.
- SHIP protocol package SIGNAL: `L5`.

This is a protocol-package claim only. It does not make `REL-GOLDEN-V1` release-ready.

## Method

Read-only checks used existing local artifacts:

- `audit/evidence/qasc-repo-latest.json`
- `audit/evidence/mpr-repo-latest.json`
- `audit/evidence/signal-maturity-latest.json`
- `machine/dslc/releases/**/manifest.json`
- `audit/evidence/dslc-release-*-latest.json`
- `machine/ship/releases/**/manifest.json`
- `audit/evidence/ship-release-*-latest.json`
- `package.json` DSLC/SHIP command surfaces

No sibling repository files were changed.

## Fleet readiness matrix

| Repo           |    QASC | MPR | SIGNAL  | DSLC      | SHIP      | Current verdict                                                             |
| -------------- | ------: | --: | ------- | --------- | --------- | --------------------------------------------------------------------------- |
| agile-os       | missing |  49 | missing | missing   | missing   | Not ready — baseline assurance missing and no DSLC/SHIP manifest or witness |
| baseline-os    |  100/L5 | 100 | L5      | ready 100 | ready 100 | Ready for internal release class only                                       |
| bridge-os      | missing |  59 | missing | missing   | missing   | Not ready — baseline assurance missing and no DSLC/SHIP manifest or witness |
| canon-os       | missing | 100 | L5      | missing   | missing   | Not ready — QASC and DSLC/SHIP release evidence missing                     |
| compliance-os  |  100/L5 | 100 | L5      | missing   | missing   | QASC-ready; needs DSLC/SHIP release manifest and witness                    |
| document-os    | missing |  34 | L2      | missing   | missing   | Not ready — MPR/SIGNAL/QASC below gate and no DSLC/SHIP evidence            |
| ecosystem-os   | missing |  99 | L5      | missing   | missing   | Near MPR gate; QASC and DSLC/SHIP evidence missing                          |
| exploration-os |  100/L5 | 100 | L5      | missing   | missing   | QASC-ready; needs DSLC/SHIP release manifest and witness                    |
| fabric-os      |  100/L5 | 100 | L5      | ready 100 | ready 100 | Ready for internal release class only                                       |
| griot-ai       |  100/L5 | 100 | L5      | missing   | missing   | QASC-ready; needs DSLC/SHIP release manifest and witness                    |
| gtcx-os        | missing |  91 | missing | missing   | missing   | Not ready — QASC/SIGNAL/DSLC/SHIP evidence missing                          |
| inspection-os  |   84/L5 |  59 | L5      | missing   | missing   | Not ready — QASC and MPR below gate; DSLC/SHIP missing                      |
| ledger-os      | missing |  36 | missing | missing   | missing   | Not ready — baseline assurance missing and no DSLC/SHIP evidence            |
| ledger-ui      |  100/L5 | 100 | L5      | missing   | missing   | QASC-ready; needs DSLC/SHIP release manifest and witness                    |
| markets-os     |  100/L5 | 100 | L5      | missing   | missing   | Best candidate for `REL-GOLDEN-V1`; needs pilot-class DSLC/SHIP evidence    |
| nyota-ai       | missing |  59 | missing | missing   | missing   | Not ready — baseline assurance missing and no DSLC/SHIP evidence            |
| sensei-os      |  100/L5 | 100 | L5      | missing   | missing   | QASC-ready; needs DSLC/SHIP release manifest and witness                    |
| terminal-os    |  100/L5 | 100 | L5      | missing   | missing   | QASC-ready; needs DSLC/SHIP release manifest and witness                    |
| terra-os       |  100/L5 | 100 | L5      | missing   | missing   | QASC-ready; needs DSLC/SHIP release manifest and witness                    |
| venture-os     | missing |  59 | missing | missing   | missing   | Not ready — baseline assurance missing and no DSLC/SHIP evidence            |
| veritas-ai     | missing |  59 | missing | missing   | missing   | Not ready — baseline assurance missing and no DSLC/SHIP evidence            |

## REL-GOLDEN-V1 proof-pack decision

`REL-GOLDEN-V1` is filed as a **pilot-class** proof pack for `markets-os`.
Pilot class is the shortest credible route because it exercises all DSLC lanes:

- Deployment
- Sales
- Legal
- Communications

It also exercises all SHIP pillars:

- Sealed
- Hardened
- Institutionalized
- Provisioned

### DSLC result

Command:

```bash
pnpm dslc:release:write -- --manifest machine/dslc/releases/REL-GOLDEN-V1/manifest.json --json
```

Result: expected non-zero because legal/signature controls are blocked.

| Lane              |   Score | Reason                                                                                                                                                            |
| ----------------- | ------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QASC prerequisite | 100/100 | `markets-os` has QASC 100/100 + SIGNAL L5                                                                                                                         |
| Deployment        |  50/100 | Scope/QASC/provenance and operator runbook are present; environment, rollout, SLO, and post-deploy evidence still pending despite read-only `markets-os` evidence |
| Sales             |  50/100 | Renewal/exit plan and onboarding/support owner roster are drafted; offer/SKU approval and CRM account/opportunity remain pending                                  |
| Legal             |  25/100 | Applicability matrix is drafted; NDA/MOU/pilot agreement and signatory authority are Class S blocked                                                              |
| Communications    |  80/100 | Claims register, sales script/battlecard, one-pager outline, and distribution calendar are drafted; legal/privacy/IP claims review remains pending                |

Decision: **blocked**. Score: **61/100**.

Evidence:

- `machine/dslc/releases/REL-GOLDEN-V1/manifest.json`
- `audit/evidence/dslc-release-REL-GOLDEN-V1-latest.json`
- `audit/reports/dslc-decision-REL-GOLDEN-V1-2026-07-01.md`

### SHIP result

Command:

```bash
pnpm ship:release:write -- --manifest machine/ship/releases/REL-GOLDEN-V1/manifest.json --json
```

Result: expected non-zero because DSLC is blocked and pilot-class SHIP pillars are not satisfied.

| Pillar            |  Score | Reason                                                                                                                                   |
| ----------------- | -----: | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Sealed            | 50/100 | Proof pack and evidence chain exist; DSLC ready and release-manager attestation missing                                                  |
| Hardened          | 25/100 | Security evidence present; legal ops, ops readiness, and approved exceptions register remain pending despite mapped operational evidence |
| Institutionalized | 75/100 | Producer experience, onboarding/support draft, and docs architecture exist; billing/RevOps approval remains pending                      |
| Provisioned       | 50/100 | Spec manifests and surface inventory exist; GitBook docs and changelog/release notes approvals missing                                   |

Decision: **blocked**. Score: **40/100**.

Evidence:

- `machine/ship/releases/REL-GOLDEN-V1/manifest.json`
- `audit/evidence/ship-release-REL-GOLDEN-V1-latest.json`
- `audit/reports/ship-decision-REL-GOLDEN-V1-2026-07-01.md`

## Critical blockers to 100/100 + L5

### Class S — sovereign human gates

These cannot be completed by an agent:

1. Execute or approve the pilot NDA/MOU/pilot agreement.
2. Confirm signatory authority and execution evidence.
3. Approve legal/privacy/data/IP critical controls for the pilot activation.

### Class A — authorized owner gates

These require named owner approval and evidence:

1. Pilot offer/SKU/pricing approval.
2. Rollout/rollback approval.
3. Code-of-conduct/policy incorporation.
4. Legal/privacy/IP claims review.
5. Billing/payment/RevOps scope approval or explicit out-of-scope determination.
6. Exceptions/risk acceptance register.
7. GitBook/public docs issuance.
8. Public changelog/release notes issuance.
9. Final release-manager attestation.

### Class R — agent-executable work

These can be completed in-session once source artifacts exist:

1. Bind live pilot environment values, tenant config, secrets, migration state, and target surfaces.
2. Attach live trace/alert export, dashboard evidence, and post-deploy probe outputs.
3. Create CRM/account/opportunity ownership record.
4. Re-run DSLC and SHIP write gates until both are ready/100.

## Recommended execution order

1. **markets-os:** bind the exact pilot release scope and environment.
2. **commercial owner:** file offer/SKU/pricing, CRM owner, onboarding/support, renewal/exit plan.
3. **legal owner / sovereign human:** complete applicability matrix, pilot agreement, signatory authority, and legal/privacy/IP review.
4. **communications owner:** issue claims register, sales scripts, battlecard, one-pager, tear sheet, public/business overview, and distribution calendar.
5. **fabric-os:** re-run:

```bash
pnpm dslc:release:write -- --manifest machine/dslc/releases/REL-GOLDEN-V1/manifest.json --json
pnpm ship:release:write -- --manifest machine/ship/releases/REL-GOLDEN-V1/manifest.json --json
```

6. **independent assurance:** verify the same release with canon-os governance/docs, agile-os workflow/legal-commercial handoff, bridge-os metadata integrity, and fabric-os runtime/evidence checks.

## Completion rule

`REL-GOLDEN-V1` may be called true `100/100` and SIGNAL `L5` only when:

- `markets-os` QASC remains 100/100 + SIGNAL L5.
- DSLC `REL-GOLDEN-V1` is `ready` at 100/100.
- SHIP `REL-GOLDEN-V1` is `ready` at 100/100.
- All Class S legal/signature artifacts are real human-approved artifacts.
- All Class A approvals have named approvers and evidence.
- All Class R evidence is machine-readable or linked to durable docs.
- Independent assurance reproduces the result without self-scoring inflation.
