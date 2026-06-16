/**
 * Resolve canon-os repo root from any script under platform/scripts/.
 */
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function isDocsHubRoot(dir) {
  return (
    existsSync(join(dir, 'package.json')) &&
    (existsSync(join(dir, 'docs')) || existsSync(join(dir, '01-docs'))) &&
    existsSync(join(dir, '.vitepress/config.mjs'))
  );
}

export function findRepoRoot(start = dirname(fileURLToPath(import.meta.url))) {
  let dir = start;
  while (true) {
    if (isDocsHubRoot(dir)) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** @deprecated Prefer repoRootFromImportMeta in fleet repos without VitePress. */
export const REPO_ROOT = findRepoRoot() ?? null;

/** Repo root for scripts in platform/scripts/*.mjs (two levels up). */
export function repoRootFromImportMeta(metaUrl) {
  const scriptDir = dirname(fileURLToPath(metaUrl));
  let dir = join(scriptDir, '..');
  while (true) {
    if (existsSync(join(dir, 'package.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return join(scriptDir, '../..');
}
