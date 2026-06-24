/**
 * FOLDER-SPEC centralization — canon-os SoR; owner repos README-only (P48).
 * Contract: docs/governance/docs-ia/FOLDER-SPEC-CONTRACT.md
 */
import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DEFAULT_EXEMPT_DIR_NAMES = new Set(['_archive', '.git']);

export function findLocalFolderSpecFiles(rootDir, { exemptDirNames = DEFAULT_EXEMPT_DIR_NAMES } = {}) {
  const violations = [];
  if (!rootDir) return violations;

  function walk(dir) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      const abs = join(dir, ent.name);
      if (ent.isDirectory()) {
        if (exemptDirNames.has(ent.name)) continue;
        walk(abs);
        continue;
      }
      if (ent.isFile() && ent.name === 'FOLDER-SPEC.md') {
        violations.push(relative(rootDir, abs));
      }
    }
  }

  walk(rootDir);
  return violations.sort();
}

export function gateNoLocalFolderSpec(gate, docsDir, existsSync, detailPrefix = 'docs/') {
  if (!existsSync(docsDir)) {
    return gate('forbid:local-folder-spec', true, 'no docs/ tree');
  }
  const violations = findLocalFolderSpecFiles(docsDir);
  return gate(
    'forbid:local-folder-spec',
    violations.length === 0,
    violations.length ? violations.join(', ') : `${detailPrefix} — README central spec only`,
  );
}

export {
  gateReadmeCentralSpec,
  localFolderSpecForbidden,
  readmeLinksCentralFolderSpec,
  readmeLinksCentralPack,
} from './readme-central-spec-link.mjs';
