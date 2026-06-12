# Protocol Verifier Staging Secret Contract

The staging `gtcx-os/protocols` deployment requires a Kubernetes Secret named
`gtcx-manifest-verifier-staging` in the rendered `gtcx-staging` namespace.
Fabric OS defines the reference contract but does not commit or generate secret
values.

| Secret key             | Required value                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `signer-registry-json` | Non-empty JSON array of authorized manifest signer records conforming to the canonical `ProtocolManifestAuthorizedSigner` schema                 |
| `revocation-json`      | Non-empty JSON object containing the current `manifests`, `signers`, and `evidence` revocation arrays; use explicit empty arrays when none exist |
| `receipt-signing-key`  | 64-character lowercase hexadecimal Ed25519 private-key seed used only for signing manifest verification receipts                                 |

The deployment also pins:

- verifier authority: `gtcx-os/protocols`;
- receipt key ID: `manifest-receipt-staging-v1`;
- receipt TTL: 24 hours; and
- distributed replay dependency: staging Redis.

## Population And Rotation

Populate the Secret through an adopted, audited secret manager before applying
the overlay. Do not make any required key optional and do not place secret
values in Git.

Rotate the receipt signer by provisioning the new seed, changing the receipt
key ID, distributing the corresponding public verification key to consumers,
and retaining the prior public key for receipts that remain within their
validity window.

Refresh the signer registry and revocation object whenever signer authority or
evidence status changes. The current `gtcx-os/protocols` PNV-2 runtime loads
these values at process start, so an authorized rollout is required after
refresh.

## Promotion Gate

```text
pnpm check:protocol-verifier-staging-contract
```

The gate fails when a required verifier input is missing, optional, literal, or
bound to the wrong Secret key. It validates configuration structure, not live
secret existence, secret contents, deployed runtime readiness, or authority
connectivity.
