## Cross-repo coordination (Protocol 24)

**Canonical policy:** [Protocol 24 — Cross-Repo Coordination](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/protocols/24-cross-repo-coordination/protocol.md)  
**Complements:** [Protocol 22 — Agent Work Selection](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/governance/protocols/22-agent-work-selection/protocol.md) (what to work on next).

When a story is **blocked on a sibling repo** or you **hand off** cross-repo work, follow these five steps in order:

| Step                | Action                                                                                                                                                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Ack**          | Read open handoffs: `baseline-os/workstream/coordination/coordination-report-latest.md` (if present) and any `from-*` / `to-*` tickets naming this repo. Reply with `outbound-ack` template when you receive a durable inbound.                                                |
| **2. Roadmap**      | Record ticket IDs and blocker repo in `docs/audit/auto-dev-state.md`, `.baseline/memory/dependencies.md`, and/or `docs/audit/agent-work-pointer.md` (if used). Do not leave blockers chat-only.                                                                                |
| **3. Inbound doc**  | File a durable handoff: `docs/gtm/inbound-tickets/from-<this-repo>-<topic>-YYYY-MM-DD.md` or `docs/coordination/<initiative>-coordination.md` ([template](https://github.com/gtcx-ecosystem/gtcx-docs/blob/main/docs/reference/templates/agents/3-structure/coordination.md)). |
| **4. Hub if P0**    | Ecosystem-critical path: from `baseline-os`, `pnpm ecosystem:repo:report-work --repo=<repo> --item="..." --status=blocked`. Use `gtcx-docs/docs/gtm/inbound-tickets/` only when the **docs hub** is the coordination witness (releases, standards).                            |
| **5. No duplicate** | Link [deployment-proof-index](https://github.com/gtcx-ecosystem/gtcx-protocols/blob/main/docs/audit/evidence/deployment-proof-index.md) and protocol contracts — **do not** copy harness YAML, evidence indexes, or normative protocol text into product repos.                |

**Not in this repo:** inbound archive SoR for ecosystem-wide weekly reports — that stays **`baseline-os`** (`workstream/coordination/`).

**Evidence paths (link only):** production smoke and EAP issuance artifacts live in owning repos per deployment-proof-index (e.g. `gtcx-intelligence/docs/audit/evidence/`).
