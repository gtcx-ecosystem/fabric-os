#!/usr/bin/env bash
# XR-MKT-PROTOCOL-NATIVE-001 — populate Markets ESO source secrets for protocol verifier.
# Writes verifier URL + token to AWS SM (markets-os ESO consumes).
set -euo pipefail

NAMESPACE="${NAMESPACE:-gtcx-staging}"
PROTOCOLS_SECRET="${PROTOCOLS_SECRET:-gtcx-protocols-api-key-staging}"
REGION="${AWS_REGION:-af-south-1}"
URL_SM_ID="${URL_SM_ID:-gtx-markets/staging/protocols-verifier-url}"
TOKEN_SM_ID="${TOKEN_SM_ID:-gtx-markets/staging/protocols-verifier-token}"
VERIFIER_URL="${VERIFIER_URL:-http://gtcx-protocols-staging.gtcx-staging.svc.cluster.local:8300}"

if [[ "${1:-}" == "--dry-run" ]]; then
  echo "target url:  $URL_SM_ID"
  echo "target token: $TOKEN_SM_ID"
  echo "verifier url: $VERIFIER_URL"
  echo "PASS — dry-run only"
  exit 0
fi

TOKEN="$(kubectl get secret "$PROTOCOLS_SECRET" -n "$NAMESPACE" \
  -o jsonpath='{.data.api-key}' | base64 -d)"

if [[ -z "$TOKEN" ]]; then
  echo "error: empty api-key from $NAMESPACE/$PROTOCOLS_SECRET" >&2
  exit 1
fi

put_secret() {
  local id="$1"
  local value="$2"
  if aws secretsmanager describe-secret --secret-id "$id" --region "$REGION" >/dev/null 2>&1; then
    aws secretsmanager put-secret-value \
      --secret-id "$id" \
      --region "$REGION" \
      --secret-string "$value" >/dev/null
  else
    aws secretsmanager create-secret \
      --name "$id" \
      --region "$REGION" \
      --secret-string "$value" >/dev/null
  fi
  echo "synced $id"
}

put_secret "$URL_SM_ID" "$VERIFIER_URL"
put_secret "$TOKEN_SM_ID" "$TOKEN"
echo "PASS — Markets protocol verifier SM populated"
