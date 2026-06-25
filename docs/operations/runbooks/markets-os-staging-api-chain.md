---
title: 'markets-os staging API credential chain'
status: current
date: 2026-06-25
owner: fabric-os
document_type: runbook
tier: operating
tags: ['operations', 'markets-os', 'staging', 'secrets', 'PROD-READY-005']
review_cycle: on-change
---

# markets-os staging API credential chain (PROD-READY-005 / FB-001)

Fabric-os owns the staging substrate and credential chain that unblocks markets-os `IR-006` / `PROD-READY-005`.

## Architecture

```
Operator env vars
        │
        ▼
bash deploy/03-platform/scripts/staging/populate-markets-os-staging-sm.sh
        │
        ▼
AWS Secrets Manager: gtcx/markets-os/staging/api-keys
        │
        ▼
ESO ExternalSecret (markets-os-staging / markets-os-secrets)
        │
        ▼
markets-os populate-env-from-sm.mjs --write
        │
        ▼
deploy/docker/.env.staging
        │
        ▼
docker compose up → advisory-api :4100, brokerage-api :4200, fund-api :4500
```

## Operator steps

### 1. Export required secrets

```bash
export POSTGRES_PASSWORD="<staging-postgres-password>"
export AUTH_JWT_SECRET="<min-32-chars-staging-jwt-secret>"
export INTERNAL_SERVICE_TOKEN="<staging-internal-service-token>"
```

### 2. Populate AWS Secrets Manager

```bash
bash deploy/03-platform/scripts/staging/populate-markets-os-staging-sm.sh
```

### 3. Verify fabric-os side

```bash
pnpm markets:staging:verify
```

Expected output when populated:

```text
OK aws-secret-shell
OK aws-secret-values
OK eso-secretstore
OK eso-externalsecret
OK k8s-secret
OK markets-integration-script
PASS — markets-os staging chain
```

### 4. Hand off to markets-os

```bash
cd ../markets-os
node platform/scripts/staging/populate-env-from-sm.mjs --write
docker compose --env-file deploy/docker/.env.staging -f deploy/docker/docker-compose.yml up -d
curl -sS http://localhost:4100/health
curl -sS http://localhost:4200/health
curl -sS http://localhost:4500/health
```

### 5. Run markets-os dry-run witness

```bash
GTX_DRY_RUN_TIMEOUT_MS=100 node platform/scripts/run-first-deal-dry-run.mjs prepare \
  --config platform/scripts/fixtures/first-deal-staging-sample.json \
  --state-folder /tmp/markets-os-ttr-preflight-check
```

## Class A boundary

- **Fabric-os delivers:** IaC, ESO resources, population script, verification script.
- **Operator executes:** live secret population in AWS SM.
- **Markets-os executes:** local compose stack and dry-run.

## Verification artifact

- `audit/evidence/markets-os-staging-chain-verify-latest.json` (when `--write` is used)

## Related

- Fleet unblock register: `docs/operations/coordination/fabric-os-fleet-unblock-register-2026-06-25.md`
- Inbound handoff: `docs/operations/coordination/inbound/from-markets-os-s120-05-staging-api-preflight-response-2026-06-25.md`
- markets-os handoff: `../markets-os/docs/operations/coordination/to-fabric-os-s120-05-staging-api-preflight-2026-06-18.md`
