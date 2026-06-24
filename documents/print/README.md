# Print lane (fabric-os)

**Fleet spec:** [canon-os FLEET-PRINT-PUBLISHING](https://github.com/gtcx-ecosystem/canon-os/blob/main/docs/governance/docs-ia/FLEET-PRINT-PUBLISHING.md)

Branded PDF/DOCX for this repo — **not** GitBook web publish.

| Layer            | Path                                         |
| ---------------- | -------------------------------------------- |
| Instances (JSON) | `docs/reference/templates/formal/instances/` |
| Output (PDF)     | `documents/print/output/deals/`              |

**Do not** fork Word masters from canon-os — render via fleet engine:

```bash
GTCX_PRINT_OWNER_ROOT=$PWD pnpm --dir ../bridge-os ecosystem:print:publish catalog
GTCX_PRINT_OWNER_ROOT=$PWD pnpm --dir ../bridge-os ecosystem:print:publish render \
  --type tear-sheet \
  --instance docs/reference/templates/formal/instances/fabric-os-tear-sheet.sample.json
```

Copy the sample instance pattern from [baseline-os](https://github.com/gtcx-ecosystem/baseline-os/tree/main/docs/reference/templates/formal/instances).
