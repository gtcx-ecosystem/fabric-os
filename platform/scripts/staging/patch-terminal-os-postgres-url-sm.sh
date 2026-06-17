#!/usr/bin/env bash
# W2-OPS-002 — ensure POSTGRES_URL alias exists in terminal-os staging SM bundle.
# Locker-18 proof and runtime task-store accept POSTGRES_URL or DATABASE_URL.
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
SECRET_ID="gtcx/terminal-os/staging/api-keys"

CURRENT="$(aws secretsmanager get-secret-value \
  --secret-id "${SECRET_ID}" \
  --region "${AWS_REGION}" \
  --query SecretString \
  --output text)"

DB_URL="$(echo "${CURRENT}" | jq -r '.DATABASE_URL // empty')"
if [[ -z "${DB_URL}" ]]; then
  echo "ERROR: DATABASE_URL missing in ${SECRET_ID} — populate staging Postgres first" >&2
  exit 1
fi

NEXT="$(echo "${CURRENT}" | jq --arg url "${DB_URL}" '.POSTGRES_URL = $url')"

aws secretsmanager put-secret-value \
  --secret-id "${SECRET_ID}" \
  --region "${AWS_REGION}" \
  --secret-string "${NEXT}" >/dev/null

echo "OK put-secret-value ${SECRET_ID} — POSTGRES_URL alias set from DATABASE_URL"
echo "==> Reconcile ESO: kubectl annotate externalsecret terminal-os-secrets -n terminal-os-staging force-sync=$(date +%s)"
