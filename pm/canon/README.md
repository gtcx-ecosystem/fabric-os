# Product canon — engineering entry

**Authoritative registry:** [`registry.json`](./registry.json)

This folder is the **versioned implementation spec** for this product. Engineering, QA, and agents implement against **`pm/canon/`**, not narrative under `docs/`.

| Need                       | Path                               |
| -------------------------- | ---------------------------------- |
| What are we building?      | `registry.json` → `bundles[]`      |
| Feature spec (full bundle) | `bundles/FEAT-*/manifest.json`     |
| Requirements + acceptance  | `bundles/FEAT-*/requirements.json` |
| UAT + verify commands      | `bundles/FEAT-*/uat.json`          |
| DoD checklist              | `bundles/FEAT-*/dod.json`          |
| Service / infra contracts  | `services/`, `infra/`              |

**Narrative context** (why, journey stories): `docs/` — always links here via `canonRef`.

```bash
pnpm canon:bundle:check    # validate canon before sprint promotion
```

Protocol: canon-os `pm/spec/product-canon-protocol.json`
