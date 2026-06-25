---
title: 'Pen-test assurance program'
status: current
date: 2026-06-25
owner: fabric-os
document_type: runbook
tier: operating
tags: ['assurance', 'pen-test', 'security']
review_cycle: quarterly
---

# Pen-test assurance program

## Scope

Fleet infrastructure layer owned by fabric-os:

- EKS staging substrate (af-south-1)
- External-secrets operator + IRSA secret sync
- Shared service fabric APIs and ingress

Product application-layer scope remains in owner repos.

## Status

Internal prep complete (SECAS-S2-01). Vendor selection and report delivery are Class S external gates.

## Evidence

- `operations/gtm/scope.json` — in/out scope register
- `audit/evidence/secas-pentest-ingest-check-latest.json` — ingest readiness
- `operations/coordination/post-launch-external-gates.json` — vendor calendar

## Authority

Class S — vendor report and remediation sign-off require authorized human action.
