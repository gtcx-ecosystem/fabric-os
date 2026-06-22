# config/ — toolchain, ops manifest, runtime + standards consumption pins

**AI runtime (fixture):** [baseline-os](../baseline-os) — run CLI; copy PHASE-\* shapes; not spec authority.  
**Standards SoR:** [canon-os](../canon-os/config/ecosystem-central-sor.json) — `writes: false`; resolve, never fork.

## Session spine (`config/agent-consumption-contract.json`)

| Command                        | Purpose                                                   |
| ------------------------------ | --------------------------------------------------------- |
| `pnpm session`                 | Full agent open (INST-003 + `agent:start` + gates)        |
| `pnpm next`                    | P22 next story + Proceed Brief (baseline `work-next.mjs`) |
| `pnpm gates`                   | Human-gate register (Class S blockers)                    |
| `pnpm hub`                     | Sync execution-roadmap hub                                |
| `pnpm mcp` / `pnpm serve`      | MCP + API (port 3141)                                     |
| `pnpm agent:next-work`         | Local P22 (repo-native)                                   |
| `pnpm agent:consumption:check` | Drift vs contract + legacy path scan                      |

Before relying on baseline CLI: confirm `../baseline-os/platform/packages/baselineos/dist/cli/bin.js` exists (rebuild: `cd ../baseline-os && pnpm --filter baselineos build`).

## Canon standards pins (`config/canon-os-consumption.json`)

| Pin             | Path                                                               | Gate                                       |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------ |
| Docs IA         | `docs-ia-contract.json` → `bridge-os/config/docs-ia-contract.json` | `pnpm docs:ia:check`                       |
| Product canon   | `product-canon-contract.json` → `canon-os`                         | `pnpm canon:synthesize:check`              |
| Folder identity | `folders.json` + `folder-rename-policy.json`                       | `platform/scripts/lib/folder-registry.mjs` |

Fleet contract registry pin: `machine/spec/canon-os-fleet-contracts.json` → canon-os SoR. Gate: `pnpm canon:contracts:check`.

Run `pnpm config:stubs:sync` after editing `config/toolchain/`.
