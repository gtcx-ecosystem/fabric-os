---
title: 'Security Policy'
status: current
date: 2026-06-06
owner: 'gtcx-infrastructure'
role: security-engineer
tier: controlled
tags: ['security', 'disclosure']
review_cycle: quarterly
---

# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| main    | Yes       |
| other   | No        |

## Reporting a vulnerability

**Do not** open a public GitHub issue for security vulnerabilities.

1. Email **security@gtcx.trade** (do not open public issues for security reports).
2. Include reproduction steps, impact, and affected paths.
3. Allow reasonable time for remediation before disclosure.

We acknowledge receipt within **5 business days** and aim for initial assessment within **10 business days**.

## Scope

In-scope: this repository's code, configs, and deploy artifacts under `03-platform/` and `04-deploy/`.

Out-of-scope: third-party services unless explicitly integrated in this repo's deploy path.

## Safe harbor

Good-faith security research conducted per this policy will not be pursued as a violation of applicable laws.
