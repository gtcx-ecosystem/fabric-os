---
title: 'Contributing Guidelines'
status: current
date: 2026-06-18
owner: fabric-os
role: protocol-architect
tier: standard
tags: ['governance', 'contributing']
review_cycle: on-change
document_type: overview
---

# Contributing to fabric-os

## Quick start

```bash
pnpm install
pnpm ops:check
```

See the root `README.md` and `AGENTS.md` before changing infrastructure, deploy, or governance paths.

## Quality gates

All contributions must pass the relevant repo gates:

1. Layout - `pnpm check:workspace-root-cleanliness:strict`
2. Ops - `pnpm ops:check`
3. Typecheck - `pnpm typecheck` when defined
4. Lint - `pnpm lint` when defined
5. Tests - `pnpm test` or targeted Node tests when behavior changes

## Commit convention

Use Conventional Commits:

```text
feat(scope): subject
fix(scope): subject
docs(scope): subject
chore(scope): subject
```

Keep each commit scoped to one concern.

## Security

See [`SECURITY.md`](./SECURITY.md) for coordinated disclosure. Do not open public issues for vulnerabilities.

## Agents

AI agents must read root `AGENTS.md`, run `pnpm agent:next-work`, and follow Protocol 22 work selection before coding.
