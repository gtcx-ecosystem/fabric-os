#!/usr/bin/env bash
# DAAS-S3-01 / F2 — attach ESO-synced GHCR pull secret to all compliance-os staging apps.
set -euo pipefail

NS="${NAMESPACE:-compliance-os-staging}"
SECRET="${GHCR_PULL_SECRET:-compliance-os-ghcr-pull}"

DEPLOYMENTS=(
  staging-web-app
  staging-compliance-api-app
  staging-caas-app
  staging-core12-app
  staging-via-api
  staging-via-ml
  staging-vxa-api
  staging-vxa-ml
)

PATCH=$(cat <<EOF
{"spec":{"template":{"spec":{"imagePullSecrets":[{"name":"${SECRET}"}]}}}}
EOF
)

echo "==> Patch imagePullSecrets (${SECRET}) in ${NS}"
for dep in "${DEPLOYMENTS[@]}"; do
  if kubectl get deployment "$dep" -n "$NS" >/dev/null 2>&1; then
    kubectl patch deployment "$dep" -n "$NS" --type=strategic -p "$PATCH"
    echo "  patched ${dep}"
  else
    echo "  skip missing ${dep}"
  fi
done

echo "==> Verify"
kubectl get deployments -n "$NS" -o custom-columns='NAME:.metadata.name,PULL:.spec.template.spec.imagePullSecrets'
