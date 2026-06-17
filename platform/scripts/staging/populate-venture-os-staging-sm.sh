#!/usr/bin/env bash
# DEPLOY-02 — populate AWS SM values for venture-os staging ESO (no values in git).
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
SECRET_ID="gtcx/venture-os/staging/api-keys"

VENTURE_WEBHOOK_SECRET="$(openssl rand -base64 32)"

JSON="$(jq -nc \
  --arg webhook "${VENTURE_WEBHOOK_SECRET}" \
  '{
    VENTURE_WEBHOOK_SECRET: $webhook
  }')"

if aws secretsmanager describe-secret --secret-id "${SECRET_ID}" --region "${AWS_REGION}" &>/dev/null; then
  aws secretsmanager put-secret-value \
    --secret-id "${SECRET_ID}" \
    --region "${AWS_REGION}" \
    --secret-string "${JSON}" >/dev/null
  echo "OK put-secret-value ${SECRET_ID}"
else
  aws secretsmanager create-secret \
    --name "${SECRET_ID}" \
    --region "${AWS_REGION}" \
    --secret-string "${JSON}" >/dev/null
  echo "OK create-secret ${SECRET_ID}"
fi

echo "==> Done. Reconcile ESO: kubectl annotate externalsecret venture-os-secrets -n venture-os-staging force-sync=$(date +%s)"
