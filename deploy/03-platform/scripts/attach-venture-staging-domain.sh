#!/usr/bin/env bash
# Point venture-staging.gtcx.trade at staging ALB (DEPLOY-02).
# Token: CLOUDFLARE_DNS_API_TOKEN from Baseline Vault (Zone DNS Edit).
# Usage:
#   set -a && source ~/.baseline/env && set +a
#   export CLOUDFLARE_API_TOKEN="$(baseline vault get CLOUDFLARE_DNS_API_TOKEN --trust-score 100)"
#   export ALB_DNS="k8s-gtcxstagingapi-295a96727a-1533822930.af-south-1.elb.amazonaws.com"
#   ./attach-venture-staging-domain.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
export CLOUDFLARE_COMPLIANCE_HOST="venture-staging"
export CLOUDFLARE_PROXIED="${CLOUDFLARE_PROXIED:-false}"
export ALB_DNS="${ALB_DNS:?Set ALB_DNS}"
exec "${ROOT}/attach-compliance-os-prod-domain.sh"
