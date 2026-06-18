---
title: 'Security Policy'
status: current
date: 2026-06-18
owner: fabric-os
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

Do not open a public GitHub issue for security vulnerabilities.

1. Contact the repository maintainers through the private security channel configured for the GTCX ecosystem.
2. Include reproduction steps, impact, affected paths, and any relevant evidence.
3. Allow reasonable time for remediation before disclosure.

We acknowledge receipt within 5 business days and aim for initial assessment within 10 business days.

## Scope

In scope: this repository's code, configs, and deploy artifacts under `platform/`, `deploy/`, `ops/`, and related governance evidence.

Out of scope: third-party services unless explicitly integrated in this repo's deploy path.

## Safe harbor

Good-faith security research conducted per this policy will not be pursued as a violation of applicable laws or project rules.
