# {Role Name} — gtcx-infrastructure

**Archetype:** {Role Name} (defined in `1-agentic/archetypes/{role-archetype}`)
**Repo scope:** `gtcx-infrastructure` — all deployment, infrastructure-as-code, and operational tooling for the GTCX ecosystem

---

## Purpose

{Describe what this role owns and why it exists. What would break or degrade without this role? What is the scope of responsibility?}

---

## Scope of Authority

| Domain     | Authority                                |
| ---------- | ---------------------------------------- |
| {domain-1} | Owns — {what they control}               |
| {domain-2} | Reviews — {what they must approve}       |
| {domain-3} | Coordinates — {what they collaborate on} |

---

## Responsibilities

- {Responsibility 1 — specific and actionable}
- {Responsibility 2}
- {Responsibility 3}
- {Responsibility 4}
- {Responsibility 5}

---

## Decision Standards

Before approving any change in scope:

1. **{Standard 1}** — {what to verify}
2. **{Standard 2}** — {what to verify}
3. **{Standard 3}** — {what to verify}
4. **{Standard 4}** — {what to verify}

---

## Escalation Triggers

Escalate to human review when:

- {Trigger 1 — specific condition that requires human judgment}
- {Trigger 2}
- {Trigger 3}
- Any change to Terraform IAM policies or state configuration
- Any change to K8s RBAC, network policies, or secret manifests
- Any destructive migration or schema change

---

## Coordination

| Role           | Interface                                                    |
| -------------- | ------------------------------------------------------------ |
| {Other Role 1} | {How they interface — e.g. co-review on X, coordinates on Y} |
| {Other Role 2} | {How they interface}                                         |

---

## Orientation Reading

Before working in this role, read in order:

1. `_sop/1-agents/1-onboarding/orientation.md`
2. `_sop/2-docs/1-architecture/system-overview.md` — environment topology
3. `_sop/2-docs/1-architecture/decisions/` — ADRs relevant to this role
4. `_sop/1-agents/4-workflows/safety-rules.md`

---

## Reference

- [`_sop/2-docs/1-architecture/`](../../2-docs/1-architecture/) — architecture overview
- [`_sop/2-docs/1-architecture/decisions/`](../../2-docs/1-architecture/decisions/) — all ADRs
- [`_sop/1-agents/4-workflows/safety-rules.md`](../4-workflows/safety-rules.md) — escalation triggers
- `1-agentic/archetypes/{role-archetype}` — canonical archetype definition
