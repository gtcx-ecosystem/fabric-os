#!/usr/bin/env bash
set -euo pipefail

: "${LEDGER_UI_SOURCE_S3_URI:?LEDGER_UI_SOURCE_S3_URI is required}"

WORK_DIR="${CODEBUILD_SRC_DIR:-/tmp}/ledger-ui-codeartifact-publish"
SOURCE_TGZ="${WORK_DIR}/ledger-ui-source.tgz"
LEDGER_UI_DIR="${WORK_DIR}/ledger-ui"

rm -rf "${WORK_DIR}"
mkdir -p "${WORK_DIR}"

aws s3 cp "${LEDGER_UI_SOURCE_S3_URI}" "${SOURCE_TGZ}"
tar -xzf "${SOURCE_TGZ}" -C "${WORK_DIR}"

cd "${LEDGER_UI_DIR}"

corepack enable
corepack prepare pnpm@9.15.0 --activate

aws codeartifact login --tool npm --domain gtcx-packages --repository npm-internal --region eu-west-1
npm ping

packages=(
  "platform/packages/utils"
  "platform/packages/tokens"
  "platform/packages/ui"
  "platform/packages/accessibility"
  "platform/packages/i18n"
  "platform/packages/ui-mobile"
  "platform/packages/layouts-mobile"
  "platform/packages/screens-mobile"
  "platform/packages/layouts"
  "platform/packages/desk-shell"
  "platform/packages/app-foundation"
  "platform/packages/governance-sdk"
  "platform/packages/mcp-server"
  "platform/packages/pages"
  "platform/packages/blocks"
)

published=()
skipped=()

for package_dir in "${packages[@]}"; do
  name="$(node -p "require('./${package_dir}/package.json').name")"
  version="$(node -p "require('./${package_dir}/package.json').version")"

  if npm view "${name}@${version}" version >/dev/null 2>&1; then
    echo "SKIP ${name}@${version} already exists in CodeArtifact"
    skipped+=("${name}@${version}")
    continue
  fi

  echo "PUBLISH ${name}@${version}"
  pnpm --dir "${package_dir}" publish --no-git-checks --access public --ignore-scripts
  published+=("${name}@${version}")
done

echo "Published packages:"
printf '  %s\n' "${published[@]:-none}"

echo "Skipped packages:"
printf '  %s\n' "${skipped[@]:-none}"

echo "Verifying core consumer packages:"
npm view @gtcx/tokens version
npm view @gtcx/utils version
npm view @gtcx/ui version
npm view @gtcx/layouts version
npm view @gtcx/desk-shell version
