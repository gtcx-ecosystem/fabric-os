# operations/ — P29 machine domains (fabric-os)

Fleet **COO reference implementation** — operational contract verifier of record. Normative layout: [canon-os L1-operations.json](https://github.com/gtcx-ecosystem/canon-os/blob/main/machine/spec/repo-provisioning/L1-operations.json).

## Domains

| Domain       | Path            | Manifest                                                     |
| ------------ | --------------- | ------------------------------------------------------------ |
| Compliance   | `compliance/`   | [`compliance/manifest.json`](./compliance/manifest.json)     |
| Security     | `security/`     | [`security/manifest.json`](./security/manifest.json)         |
| GTM          | `gtm/`          | [`gtm/manifest.json`](./gtm/manifest.json)                   |
| Legal        | `legal/`        | [`legal/manifest.json`](./legal/manifest.json)               |
| Coordination | `coordination/` | [`coordination/manifest.json`](./coordination/manifest.json) |
| Attestation  | `attestation/`  | [`attestation/manifest.json`](./attestation/manifest.json)   |

## Contract + COO

| Artifact                    | Path                                             |
| --------------------------- | ------------------------------------------------ |
| Fabric contract (7 domains) | [`fabric-contract.json`](./fabric-contract.json) |
| COO charter                 | [`coo.md`](./coo.md)                             |
| Workspace verify            | [`verify.json`](./verify.json)                   |
| Domain manifest             | [`manifest.json`](./manifest.json)               |

## Gates

```bash
pnpm fabric:ops-contracts:check
pnpm fabric:ops:check
pnpm operations:check
```

Human runbooks live under `docs/operations/` — not duplicated here (L1 rule).
