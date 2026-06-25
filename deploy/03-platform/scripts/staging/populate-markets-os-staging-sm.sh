#!/usr/bin/env bash
# PROD-READY-005 — populate markets-os staging API secrets in AWS SM.
# Values are sourced from the operator environment; this script never embeds secrets.
set -euo pipefail

REGION="${AWS_REGION:-af-south-1}"
SECRET_ID="${MARKETS_OS_SM_ID:-gtcx/markets-os/staging/api-keys}"

required_envs=(
  "POSTGRES_PASSWORD"
  "AUTH_JWT_SECRET"
  "INTERNAL_SERVICE_TOKEN"
)

for var in "${required_envs[@]}"; do
  if [[ -z "${!var:-}" ]]; then
    echo "error: $var must be set in environment" >&2
    exit 1
  fi
done

payload=$(jq -n \
  --arg postgres_password "$POSTGRES_PASSWORD" \
  --arg auth_jwt_secret "$AUTH_JWT_SECRET" \
  --arg internal_service_token "$INTERNAL_SERVICE_TOKEN" \
  --arg anthropic_api_key "${ANTHROPIC_API_KEY:-}" \
  --arg gtx_markets_api_token "${GTX_MARKETS_API_TOKEN:-}" \
  '{
    POSTGRES_PASSWORD: $postgres_password,
    AUTH_JWT_SECRET: $auth_jwt_secret,
    INTERNAL_SERVICE_TOKEN: $internal_service_token,
    ANTHROPIC_API_KEY: $anthropic_api_key,
    GTX_MARKETS_API_TOKEN: $gtx_markets_api_token
  }')

if aws secretsmanager describe-secret --secret-id "$SECRET_ID" --region "$REGION" >/dev/null 2>&1; then
  aws secretsmanager put-secret-value \
    --secret-id "$SECRET_ID" \
    --region "$REGION" \
    --secret-string "$payload" >/dev/null
  echo "updated $SECRET_ID"
else
  aws secretsmanager create-secret \
    --name "$SECRET_ID" \
    --region "$REGION" \
    --description "markets-os staging API keys bundle" \
    --secret-string "$payload" >/dev/null
  echo "created $SECRET_ID"
fi
