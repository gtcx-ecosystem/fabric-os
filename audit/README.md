# audit/ — evidence register (fabric-os)

Five-core audit reports + scored witnesses. **Methodology SoR:** bridge-os · **Save-format SoR:** [canon-os L1-audit.json](../canon-os/machine/spec/repo-provisioning/L1-audit.json) · **Rubric:** [UNIVERSAL_RUBRIC.md](../canon-os/platform/tools/audit/audit-framework/UNIVERSAL_RUBRIC.md).

| Resource          | Path                                                                         |
| ----------------- | ---------------------------------------------------------------------------- |
| Agent start       | [`AGENT-START.md`](./AGENT-START.md)                                         |
| Evidence sink     | `audit/evidence/*-latest.json`                                               |
| Canon consumption | [`../config/canon-os-consumption.json`](../config/canon-os-consumption.json) |

Run layout gates before claiming audit complete: `pnpm operations:check`.
