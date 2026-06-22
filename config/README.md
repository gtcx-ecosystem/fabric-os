# config/ — toolchain, ops manifest, canon-os consumption pins

**Standards SoR:** [canon-os](../canon-os/config/ecosystem-central-sor.json) — `writes: false`; resolve, never fork.

| Pin                  | Path                                                                          | Gate                                       |
| -------------------- | ----------------------------------------------------------------------------- | ------------------------------------------ |
| Consumption contract | `canon-os-consumption.json`                                                   | `pnpm canon:contracts:check`               |
| Docs IA              | `docs-ia-contract.json` → `bridge-os/config/docs-ia-contract.json`            | `pnpm docs:ia:check`                       |
| Product canon        | `product-canon-contract.json` → `canon-os/config/product-canon-contract.json` | `pnpm canon:synthesize:check`              |
| Folder identity      | `folders.json` + `folder-rename-policy.json`                                  | `platform/scripts/lib/folder-registry.mjs` |

Fleet contract registry pin: `machine/spec/canon-os-fleet-contracts.json` → canon-os SoR.

Run `pnpm config:stubs:sync` after editing `config/toolchain/`.
