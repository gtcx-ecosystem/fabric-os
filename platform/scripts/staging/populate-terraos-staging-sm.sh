#!/usr/bin/env bash
# INF-TERRA-02/03 — populate AWS SM values for terra-os staging ESO (no values in git).
set -euo pipefail

AWS_REGION="${AWS_REGION:-af-south-1}"
PREFIX="terraos/staging"
GH_USER="${GH_USER:-$(gh api user -q .login 2>/dev/null || true)}"

if [[ -z "${GH_USER}" ]]; then
  echo "ERROR: gh CLI login required for GHCR token"
  exit 1
fi

put_json() {
  local name="$1"
  local json="$2"
  if aws secretsmanager describe-secret --secret-id "${name}" --region "${AWS_REGION}" &>/dev/null; then
    aws secretsmanager put-secret-value \
      --secret-id "${name}" \
      --region "${AWS_REGION}" \
      --secret-string "${json}" >/dev/null
    echo "OK put-secret-value ${name}"
  else
    aws secretsmanager create-secret \
      --name "${name}" \
      --region "${AWS_REGION}" \
      --secret-string "${json}" >/dev/null
    echo "OK create-secret ${name}"
  fi
}

echo "==> GHCR pull token"
TOKEN="$(gh auth token)"
AUTH="$(printf '%s:%s' "${GH_USER}" "${TOKEN}" | base64 | tr -d '\n')"
DOCKER_CFG="$(jq -nc --arg auth "${AUTH}" '{"auths":{"ghcr.io":{"auth":$auth}}}')"
GHCR_JSON="$(jq -nc --argjson cfg "${DOCKER_CFG}" '{dockerconfigjson: $cfg}')"
put_json "${PREFIX}/ghcr-pull-token" "${GHCR_JSON}"

RDS_HOST="${TERRAOS_RDS_HOST:-staging-terraos-postgres}"
RDS_PASS="${TERRAOS_RDS_PASSWORD:-staging-change-me}"
REDIS_HOST="${TERRAOS_REDIS_HOST:-staging-terraos-redis}"
REDIS_PASS="${TERRAOS_REDIS_PASSWORD:-staging-change-me}"

echo "==> RDS bundle (override via TERRAOS_RDS_HOST / TERRAOS_RDS_PASSWORD)"
put_json "${PREFIX}/rds" "$(jq -nc \
  --arg url "postgresql://terraos:${RDS_PASS}@${RDS_HOST}:5432/terraos" \
  --arg password "${RDS_PASS}" \
  '{url: $url, password: $password}')"

echo "==> Redis bundle (override via TERRAOS_REDIS_HOST / TERRAOS_REDIS_PASSWORD)"
put_json "${PREFIX}/redis" "$(jq -nc \
  --arg url "redis://:${REDIS_PASS}@${REDIS_HOST}:6379/0" \
  --arg password "${REDIS_PASS}" \
  '{url: $url, password: $password}')"

echo "Done. Apply ESO manifests: kubectl apply -f deploy/infra/k8s/external-secrets/ (terra-os repo)"
