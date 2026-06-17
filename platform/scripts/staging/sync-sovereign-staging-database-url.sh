#!/usr/bin/env bash
# DAAS-S1-03 — sync sovereign staging DATABASE_URL from AGX RDS sync (same operational DB).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NAMESPACE="${NAMESPACE:-gtcx-staging}"
AGX_SECRET="${AGX_SECRET:-gtcx-agx-database-staging}"
SOVEREIGN_SECRET="${SOVEREIGN_SECRET:-gtcx-sovereign-secrets-staging}"

bash "${ROOT}/platform/scripts/staging/sync-agx-staging-database-url.sh"

DB_B64="$(kubectl get secret "$AGX_SECRET" -n "$NAMESPACE" -o jsonpath='{.data.DATABASE_URL}')"
if [[ -z "$DB_B64" ]]; then
  echo "FAIL — missing DATABASE_URL on $AGX_SECRET" >&2
  exit 1
fi

kubectl patch secret "$SOVEREIGN_SECRET" -n "$NAMESPACE" -p "{\"data\":{\"DATABASE_URL\":\"$DB_B64\"}}"
kubectl rollout restart "deploy/sovereign-staging" -n "$NAMESPACE" >/dev/null 2>&1 || true

echo "synced $SOVEREIGN_SECRET DATABASE_URL from $AGX_SECRET in $NAMESPACE"
