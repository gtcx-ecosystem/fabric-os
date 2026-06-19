# Feature registry — fabric-os (forensic bootstrap)

Sharded v2 forensic catalog aligned to **terminal-os** / **compliance-os** reference (P55/P56).

Bootstrap: `node ../canon-os/platform/scripts/bootstrap-forensic-registry.mjs --write` from repo root.

## Shards

| Shard                              | Contents                                  |
| ---------------------------------- | ----------------------------------------- |
| `shard-01-core-capabilities.json`  | Features from `pm/product/prd-index.json` |
| `shard-02-workflows-forensic.json` | Demo workflow step                        |
