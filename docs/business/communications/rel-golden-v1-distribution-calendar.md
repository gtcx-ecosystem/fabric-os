---
title: 'REL-GOLDEN-V1 distribution calendar'
status: current
date: 2026-07-01
owner: fabric-os
document_type: release-evidence
review_cycle: on-change
release: REL-GOLDEN-V1
---

# REL-GOLDEN-V1 Distribution Calendar

This calendar defines the controlled distribution sequence for the
`REL-GOLDEN-V1` pilot proof pack. It does not authorize external claims or
public release.

## Owner and channels

| Channel                          | Owner                       | Status  | Rule                                           |
| -------------------------------- | --------------------------- | ------- | ---------------------------------------------- |
| Internal release-management pack | `gtcx-release-management`   | active  | May circulate inside release/audit team        |
| Customer pilot packet            | `commercial-ops`            | gated   | Requires legal instrument and claims approval  |
| Partner-facing summary           | `authorized-communications` | gated   | Requires legal/privacy/IP claims review        |
| Public website/GitBook           | `authorized-communications` | gated   | Requires Class A public-docs issuance approval |
| Press or external announcement   | `authorized-communications` | blocked | Not in scope until explicit public approval    |

## Distribution sequence

| Phase | Trigger                               | Action                                      | Output                                 |
| ----- | ------------------------------------- | ------------------------------------------- | -------------------------------------- |
| D0    | Internal proof-pack drafted           | Share with release, commercial, legal lanes | Internal-only review packet            |
| D1    | Account/opportunity created           | Attach customer-specific pilot packet       | Customer-management record             |
| D2    | Legal instrument executed             | Enable customer-facing pilot circulation    | NDA/MOU/pilot agreement evidence       |
| D3    | Claims review approved                | Enable controlled sales script and one-page | Approved customer-facing claims packet |
| D4    | Public-docs/changelog approval issued | Publish GitBook/changelog surfaces          | Public docs and changelog references   |

## Activation rule

No external distribution is permitted until the corresponding Class A/S controls
are evidenced in the DSLC and SHIP manifests. This document records owner,
channel, and calendar sequencing only.
