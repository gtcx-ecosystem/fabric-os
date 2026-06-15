#!/usr/bin/env bash
# PayOps — populate shared billing provider secrets in AWS SM (staging).
# Class A: operator supplies real Stripe/Flutterwave keys via env — never commit values.
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
DRY_RUN=1
if [[ "${1:-}" == "--apply" ]]; then
  DRY_RUN=0
fi

STRIPE_SECRET_ID="gtcx/shared/staging/payops/stripe"
FLUTTERWAVE_SECRET_ID="gtcx/shared/staging/payops/flutterwave"

put_secret() {
  local secret_id="$1"
  local json="$2"
  if [[ "${DRY_RUN}" -eq 1 ]]; then
    echo "DRY-RUN would upsert ${secret_id} (keys: $(echo "${json}" | jq -r 'keys | join(", ")'))"
    return 0
  fi
  if aws secretsmanager describe-secret --secret-id "${secret_id}" --region "${AWS_REGION}" &>/dev/null; then
    aws secretsmanager put-secret-value \
      --secret-id "${secret_id}" \
      --region "${AWS_REGION}" \
      --secret-string "${json}" >/dev/null
    echo "OK put-secret-value ${secret_id}"
  else
    aws secretsmanager create-secret \
      --name "${secret_id}" \
      --region "${AWS_REGION}" \
      --secret-string "${json}" >/dev/null
    echo "OK create-secret ${secret_id}"
  fi
}

# Placeholders when env unset — replace before --apply in staging.
STRIPE_JSON="$(jq -nc \
  --arg sk "${STRIPE_SECRET_KEY:-sk_test_REPLACE_ME}" \
  --arg wh "${STRIPE_WEBHOOK_SECRET:-whsec_REPLACE_ME}" \
  --arg pk "${STRIPE_PUBLISHABLE_KEY:-pk_test_REPLACE_ME}" \
  '{
    STRIPE_SECRET_KEY: $sk,
    STRIPE_WEBHOOK_SECRET: $wh,
    STRIPE_PUBLISHABLE_KEY: $pk
  }')"

FLUTTERWAVE_JSON="$(jq -nc \
  --arg sk "${FLUTTERWAVE_SECRET_KEY:-FLWSECK_TEST_REPLACE_ME}" \
  --arg pk "${FLUTTERWAVE_PUBLIC_KEY:-FLWPUBK_TEST_REPLACE_ME}" \
  --arg hash "${FLUTTERWAVE_WEBHOOK_HASH:-REPLACE_ME}" \
  '{
    FLUTTERWAVE_SECRET_KEY: $sk,
    FLUTTERWAVE_PUBLIC_KEY: $pk,
    FLUTTERWAVE_WEBHOOK_HASH: $hash
  }')"

put_secret "${STRIPE_SECRET_ID}" "${STRIPE_JSON}"
put_secret "${FLUTTERWAVE_SECRET_ID}" "${FLUTTERWAVE_JSON}"

echo "==> PayOps staging SM paths:"
echo "    ${STRIPE_SECRET_ID}"
echo "    ${FLUTTERWAVE_SECRET_ID}"
if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "==> Re-run with --apply after exporting real provider keys (Class A)."
fi
