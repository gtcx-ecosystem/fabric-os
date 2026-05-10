#!/usr/bin/env bash
# =============================================================================
# GTCX Infrastructure Validation
# =============================================================================
# Real validation entrypoint for local use and CI smoke coverage.
#
# Modes:
#   quick  - policy checks, shell checks, and script smoke tests
#   full   - quick plus terraform validate/test, kustomize, compose, and deploy dry-run validation
#
# Usage:
#   ./infra/scripts/validate.sh
#   ./infra/scripts/validate.sh quick
#   ./infra/scripts/validate.sh full
# =============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() { echo -e "${CYAN}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[OK]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
MODE="${1:-quick}"

usage() {
    cat <<'EOF'
Usage:
  validate.sh [quick|full]

Modes:
  quick  Run policy checks, shell syntax checks, shellcheck, and script smoke tests
  full   Run quick plus terraform fmt/validate/test, kustomize builds, compose config validation, and deploy dry-run smoke
EOF
}

require_command() {
    if ! command -v "$1" >/dev/null 2>&1; then
        log_error "Required command not found: $1"
        exit 1
    fi
}

run_shell_checks() {
    require_command shellcheck

    log_info "Checking shell script syntax..."
    bash -n "${PROJECT_ROOT}"/infra/scripts/*.sh

    log_info "Running shellcheck..."
    shellcheck "${PROJECT_ROOT}"/infra/scripts/*.sh
}

run_policy_checks() {
    require_command pnpm

    log_info "Running workflow policy checks..."
    (cd "${PROJECT_ROOT}" && pnpm check:fine-tune-workflow-policy)
    (cd "${PROJECT_ROOT}" && pnpm check:workflow-image-contract)
    (cd "${PROJECT_ROOT}" && pnpm check:security-control-boundaries)
}

run_replay_protection_tests() {
    log_info "Running replay-protection tests..."
    (cd "${PROJECT_ROOT}/tools/replay-protection" && node --test tests/verifier.test.mjs tests/integration.test.mjs)
}

run_replay_production_policy_tests() {
    log_info "Running replay-protection production policy tests..."
    (
        cd "${PROJECT_ROOT}" && \
        node --test \
            tools/replay-protection/tests/failure-modes.test.mjs \
            tools/replay-protection/tests/runtime-policy.test.mjs
    )
}

run_compliance_gateway_tests() {
    log_info "Running compliance-gateway tests..."
    (cd "${PROJECT_ROOT}" && node --test tools/compliance-gateway/tests/*.test.mjs)
}

run_deployment_guard_tests() {
    log_info "Running deployment-guard tests..."
    (cd "${PROJECT_ROOT}/tools/deployment-guard" && node --test tests/**/*.test.mjs)
    log_info "Running deployment-guard typecheck..."
    (cd "${PROJECT_ROOT}/tools/deployment-guard" && npx tsc --noEmit)
}

run_script_smoke_tests() {
    log_info "Running operator script smoke tests..."
    (cd "${PROJECT_ROOT}" && bash infra/scripts/build-push.sh --list >/dev/null)
    (cd "${PROJECT_ROOT}" && bash infra/scripts/deploy.sh staging --dry-run --version=sha-smoke-test >/dev/null)
    (cd "${PROJECT_ROOT}" && bash infra/scripts/fine-tune-workflow.sh --help >/dev/null)
    (cd "${PROJECT_ROOT}" && bash infra/scripts/capture-rollback-evidence.sh --help >/dev/null)
    (cd "${PROJECT_ROOT}" && bash infra/scripts/prepare-intelligence-evidence-env.sh --help >/dev/null)
}

run_docs_standard_validation() {
    log_info "Running docs-standard validation..."
    (cd "${PROJECT_ROOT}" && node tools/scripts/docs-standard-validator.mjs --baseline=.docs-exceptions.json)
}

run_score_ledger_validation() {
    log_info "Running score-evidence ledger validation..."
    (cd "${PROJECT_ROOT}" && node tools/scripts/validate-score-ledger.mjs)
}

run_build_evidence_generation() {
    log_info "Running build evidence generation..."
    (cd "${PROJECT_ROOT}" && node tools/control-plane/generate-release-evidence.mjs \
        --environment=ci \
        --version=ci-smoke \
        --commit=smoke-test \
        --build-only \
        --image=replay-guard=gtcx/replay-guard:ci-smoke \
        --output-dir=/tmp/gtcx-build-evidence-smoke)
}

run_terraform_validation() {
    require_command terraform
    require_command zip

    log_info "Running terraform format check..."
    (cd "${PROJECT_ROOT}" && terraform fmt -check -recursive infra/terraform/)

    local modules=(
        vpc
        database
        eks
        ecr
        workflow-orchestration
        secrets
        alb
        backup
        detective
        compliance
        event-bus
        kyc-documents
    )

    for module in "${modules[@]}"; do
        log_info "Terraform validate: ${module}"
        (
            cd "${PROJECT_ROOT}/infra/terraform/modules/${module}"
            if [[ "${module}" == "secrets" ]]; then
                echo '{}' | zip -q lambda/rotation.zip -
            fi
            terraform init -backend=false >/dev/null
            terraform validate >/dev/null
        )
    done
}

run_terraform_tests() {
    require_command terraform
    require_command zip

    local modules=(
        vpc
        database
        eks
        ecr
        workflow-orchestration
        secrets
        alb
        backup
        detective
        compliance
        event-bus
        kyc-documents
        compliance-db
        ml-pipeline
        trace-pipeline
        vault
    )

    for module in "${modules[@]}"; do
        log_info "Terraform test: ${module}"
        (
            cd "${PROJECT_ROOT}/infra/terraform/modules/${module}"
            if [[ "${module}" == "secrets" ]]; then
                echo '{}' | zip -q lambda/rotation.zip -
            fi
            terraform init -backend=false >/dev/null
            terraform test >/dev/null
        )
    done
}

run_kustomize_validation() {
    require_command kubectl

    log_info "Running kustomize builds..."
    (cd "${PROJECT_ROOT}" && kubectl kustomize infra/kubernetes/base/ > /dev/null)
    (cd "${PROJECT_ROOT}" && kubectl kustomize infra/kubernetes/overlays/development/ > /dev/null)
    (cd "${PROJECT_ROOT}" && kubectl kustomize infra/kubernetes/overlays/staging/ > /dev/null)
    (cd "${PROJECT_ROOT}" && kubectl kustomize infra/kubernetes/overlays/production/ > /dev/null)
    (cd "${PROJECT_ROOT}" && kubectl kustomize infra/kubernetes/overlays/testnet/ > /dev/null)
}

run_compose_validation() {
    require_command docker

    log_info "Running docker compose config validation..."
    (cd "${PROJECT_ROOT}" && docker compose -f infra/docker/docker-compose.dev.yml config --quiet)
    (cd "${PROJECT_ROOT}" && docker compose -f infra/docker/docker-compose.test.yml config --quiet)
    (cd "${PROJECT_ROOT}" && docker compose -f infra/docker/docker-compose.infra.yml config --quiet)
}

run_audit_immutability_fixture() {
    require_command docker
    require_command psql

    log_info "Running audit immutability fixture..."
    (cd "${PROJECT_ROOT}" && bash infra/scripts/test-audit-immutability.sh)
}

case "${MODE}" in
    quick)
        run_policy_checks
        run_shell_checks
        run_replay_protection_tests
        run_replay_production_policy_tests
        run_compliance_gateway_tests
        run_deployment_guard_tests
        run_docs_standard_validation
        run_score_ledger_validation
        run_build_evidence_generation
        run_script_smoke_tests
        ;;
    full)
        run_policy_checks
        run_shell_checks
        run_replay_protection_tests
        run_replay_production_policy_tests
        run_compliance_gateway_tests
        run_deployment_guard_tests
        run_docs_standard_validation
        run_score_ledger_validation
        run_build_evidence_generation
        run_script_smoke_tests
        run_audit_immutability_fixture
        run_terraform_validation
        run_terraform_tests
        run_kustomize_validation
        run_compose_validation
        ;;
    --help|-h|help)
        usage
        exit 0
        ;;
    *)
        log_error "Unknown mode: ${MODE}"
        usage
        exit 1
        ;;
esac

log_success "Infrastructure validation (${MODE}) passed"
