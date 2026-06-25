---
title: 'Inbound from markets-os: S120-05 staging API preflight response'
status: open
date: 2026-06-25
owner: fabric-os
document_type: coordination
tier: operating
tags: ['coordination', 'markets-os', 'staging', 'PROD-READY-005']
review_cycle: on-change
from: markets-os
to: fabric-os
authority_class: A
blocks_ir: true
owner_repo: fabric-os
requesting_repo: markets-os
story: S120-05
maps_to: PROD-READY-005
---

# Inbound from markets-os: S120-05 staging API preflight response

## Acknowledgement

Fabric-os acknowledges the escalation in
`markets-os/docs/operations/coordination/to-fabric-os-s120-05-staging-api-preflight-2026-06-18.md`.

## Delivered

1. **AWS Secrets Manager infrastructure** for markets-os staging API keys:
   - `deploy/terraform/modules/secrets/markets-os.tf`
   - Secret path: `gtcx/markets-os/staging/api-keys`
   - IRSA role: `gtcx-staging-markets-os-secrets-role`
   - Service account: `markets-os-sa` (namespace `markets-os-staging`)

2. **ESO SecretStore + ExternalSecret**:
   - `deploy/kubernetes/overlays/staging/markets-os/secret-store.yaml`
   - `deploy/kubernetes/overlays/staging/markets-os/external-secret.yaml`
   - `deploy/kubernetes/overlays/staging/markets-os/kustomization.yaml`

3. **Secret population script** (operator-facing):
   - `deploy/03-platform/scripts/staging/populate-markets-os-staging-sm.sh`

4. **markets-os integration script**:
   - `markets-os/platform/scripts/staging/populate-env-from-sm.mjs --write`

## Class A operator steps remaining

1. Export required secrets in operator shell:
   - `POSTGRES_PASSWORD`
   - `AUTH_JWT_SECRET`
   - `INTERNAL_SERVICE_TOKEN`
2. Run `populate-markets-os-staging-sm.sh` to write AWS SM.
3. In markets-os, run `populate-env-from-sm.mjs --write` to create `.env.staging`.
4. Start markets-os staging compose stack.
5. Re-run dry-run and archive passing witness.

## Verification

```bash
# fabric-os
bash deploy/03-platform/scripts/staging/populate-markets-os-staging-sm.sh

# markets-os
node platform/scripts/staging/populate-env-from-sm.mjs --write
docker compose --env-file deploy/docker/.env.staging -f deploy/docker/docker-compose.yml up -d
curl -sS http://localhost:4100/health && curl -sS http://localhost:4200/health && curl -sS http://localhost:4500/health
GTX_DRY_RUN_TIMEOUT_MS=100 node platform/scripts/run-first-deal-dry-run.mjs prepare \
  --config platform/scripts/fixtures/first-deal-staging-sample.json \
  --state-folder /tmp/markets-os-ttr-preflight-check
```
