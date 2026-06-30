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

node <<'NODE'
const { readFileSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');

const packages = [
  'platform/packages/utils',
  'platform/packages/tokens',
  'platform/packages/ui',
  'platform/packages/accessibility',
  'platform/packages/i18n',
  'platform/packages/ui-mobile',
  'platform/packages/layouts-mobile',
  'platform/packages/screens-mobile',
  'platform/packages/layouts',
  'platform/packages/desk-shell',
  'platform/packages/app-foundation',
  'platform/packages/governance-sdk',
  'platform/packages/mcp-server',
  'platform/packages/pages',
  'platform/packages/blocks',
];

const versions = new Map();
for (const packageDir of packages) {
  const packagePath = join(packageDir, 'package.json');
  const manifest = JSON.parse(readFileSync(packagePath, 'utf8'));
  versions.set(manifest.name, manifest.version);
}

for (const packageDir of packages) {
  const packagePath = join(packageDir, 'package.json');
  const manifest = JSON.parse(readFileSync(packagePath, 'utf8'));
  for (const section of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) {
    if (!manifest[section]) continue;
    for (const [name, range] of Object.entries(manifest[section])) {
      if (typeof range === 'string' && range.startsWith('workspace:')) {
        const version = versions.get(name);
        if (!version) throw new Error(`No workspace version found for ${name}`);
        manifest[section][name] = version;
      }
    }
  }
  writeFileSync(packagePath, `${JSON.stringify(manifest, null, 2)}\n`);
}
NODE

published=()
skipped=()
external=()

for package_dir in "${packages[@]}"; do
  name="$(node -p "require('./${package_dir}/package.json').name")"
  version="$(node -p "require('./${package_dir}/package.json').version")"

  package_name="${name#@gtcx/}"
  if aws codeartifact describe-package-version \
    --domain gtcx-packages \
    --repository npm-internal \
    --region eu-west-1 \
    --format npm \
    --namespace gtcx \
    --package "${package_name}" \
    --package-version "${version}" \
    --query 'packageVersion.origin.originType' \
    --output text 2>/dev/null | grep -qx 'INTERNAL'; then
    echo "SKIP ${name}@${version} already exists in CodeArtifact"
    skipped+=("${name}@${version}")
    continue
  fi

  echo "PUBLISH ${name}@${version}"
  publish_log="$(mktemp)"
  if (cd "${package_dir}" && npm publish --access public --ignore-scripts) >"${publish_log}" 2>&1; then
    cat "${publish_log}"
    published+=("${name}@${version}")
  elif grep -q "exists in externally connected repository" "${publish_log}"; then
    cat "${publish_log}"
    echo "EXTERNAL ${name}@${version} available through CodeArtifact external connection"
    external+=("${name}@${version}")
  else
    cat "${publish_log}"
    exit 1
  fi
done

echo "Published packages:"
printf '  %s\n' "${published[@]:-none}"

echo "Skipped packages:"
printf '  %s\n' "${skipped[@]:-none}"

echo "External packages:"
printf '  %s\n' "${external[@]:-none}"

echo "Verifying core consumer packages:"
npm view @gtcx/tokens@0.3.0 version
npm view @gtcx/utils@0.2.0 version
npm view @gtcx/ui@0.4.2 version
npm view @gtcx/layouts@0.2.10 version
npm view @gtcx/desk-shell@0.1.0 version
