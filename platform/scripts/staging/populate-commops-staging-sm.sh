#!/usr/bin/env bash
# CommOps — populate shared communications provider secrets in AWS SM (staging).
# Class A: operator supplies real SendGrid / Africa's Talking / Twilio keys via env — never commit values.
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
DRY_RUN=1
if [[ "${1:-}" == "--apply" ]]; then
  DRY_RUN=0
fi

SENDGRID_SECRET_ID="gtcx/shared/staging/commops/sendgrid"
AT_SECRET_ID="gtcx/shared/staging/commops/africas-talking"
TWILIO_SECRET_ID="gtcx/shared/staging/commops/twilio"

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

SENDGRID_JSON="$(jq -nc \
  --arg key "${SENDGRID_API_KEY:-SG.REPLACE_ME}" \
  --arg from "${SENDGRID_FROM_EMAIL:-noreply@staging.gtcx.trade}" \
  '{
    SENDGRID_API_KEY: $key,
    sendgrid_api_key: $key,
    SENDGRID_FROM_EMAIL: $from,
    sendgrid_from_email: $from
  }')"

AT_JSON="$(jq -nc \
  --arg user "${AFRICASTALKING_USERNAME:-sandbox}" \
  --arg key "${AFRICASTALKING_API_KEY:-AT_REPLACE_ME}" \
  --arg legacy "${AT_API_KEY:-${AFRICASTALKING_API_KEY:-AT_REPLACE_ME}}" \
  --arg sender "${AFRICASTALKING_SENDER_ID:-TerraOS}" \
  '{
    AFRICASTALKING_USERNAME: $user,
    africastalking_username: $user,
    AFRICASTALKING_API_KEY: $key,
    africastalking_api_key: $key,
    at_api_key: $legacy,
    AFRICASTALKING_SENDER_ID: $sender,
    africastalking_sender_id: $sender
  }')"

TWILIO_JSON="$(jq -nc \
  --arg sid "${TWILIO_ACCOUNT_SID:-AC_REPLACE_ME}" \
  --arg token "${TWILIO_AUTH_TOKEN:-REPLACE_ME}" \
  --arg wa "${TWILIO_WHATSAPP_FROM:-whatsapp:+14155238886}" \
  '{
    TWILIO_ACCOUNT_SID: $sid,
    TWILIO_AUTH_TOKEN: $token,
    TWILIO_WHATSAPP_FROM: $wa
  }')"

put_secret "${SENDGRID_SECRET_ID}" "${SENDGRID_JSON}"
put_secret "${AT_SECRET_ID}" "${AT_JSON}"
put_secret "${TWILIO_SECRET_ID}" "${TWILIO_JSON}"

echo "==> CommOps staging SM paths:"
echo "    ${SENDGRID_SECRET_ID}"
echo "    ${AT_SECRET_ID}"
echo "    ${TWILIO_SECRET_ID}"
if [[ "${DRY_RUN}" -eq 1 ]]; then
  echo "==> Re-run with --apply after exporting real provider keys (Class A)."
fi
