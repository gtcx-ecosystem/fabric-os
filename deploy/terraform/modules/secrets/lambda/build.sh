#!/usr/bin/env bash
# Build the rotation Lambda deployment package.
# Installs psycopg2-binary into a temp directory and zips with handler.
# Output: ../rotation.zip (referenced by Terraform)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BUILD_DIR="$(mktemp -d)"
OUTPUT="${SCRIPT_DIR}/rotation.zip"

echo "Building rotation Lambda package..."

# Install dependency
PIP_SPEC="${PIP:-pip}"
if ! command -v "pip" >/dev/null 2>&1 && command -v "python3" >/dev/null 2>&1; then
  PIP_CMD=(python3 -m pip)
elif [ "${PIP_SPEC}" = "python3 -m pip" ]; then
  PIP_CMD=(python3 -m pip)
else
  read -r -a PIP_CMD <<< "${PIP_SPEC}"
fi

"${PIP_CMD[@]}" install --target "${BUILD_DIR}" psycopg2-binary --quiet --platform manylinux2014_x86_64 --only-binary=:all: 2>/dev/null || \
  "${PIP_CMD[@]}" install --target "${BUILD_DIR}" psycopg2-binary --quiet

# Copy handler
cp "${SCRIPT_DIR}/src/index.py" "${BUILD_DIR}/index.py"

# Package
cd "${BUILD_DIR}"
zip -r9 "${OUTPUT}" . -x '*.pyc' '__pycache__/*' '*.dist-info/*' > /dev/null

# Cleanup
rm -rf "${BUILD_DIR}"

echo "Built: ${OUTPUT} ($(du -h "${OUTPUT}" | cut -f1))"
