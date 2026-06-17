/**
 * SECAS pen-test internal engineering closure — vendor track is post-launch only (blocksIR: false).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const CLOSURE_PREFIX = 'secas-s4-04-internal-closure-';

export function findInternalClosurePath(evidenceDir) {
  if (!existsSync(evidenceDir)) return null;
  const matches = readdirSync(evidenceDir)
    .filter((f) => f.startsWith(CLOSURE_PREFIX) && f.endsWith('.json'))
    .sort();
  return matches.length ? join(evidenceDir, matches.at(-1)) : null;
}

export function loadInternalClosure(repoRoot) {
  const path = findInternalClosurePath(join(repoRoot, 'audit/evidence'));
  if (!path) return { path: null, closure: null };
  try {
    return { path: path.slice(repoRoot.length + 1), closure: JSON.parse(readFileSync(path, 'utf8')) };
  } catch {
    return { path: null, closure: null };
  }
}

/** Engineering lanes complete; vendor calendar does not block any repo. */
export function isPenTestEngineeringComplete(closure) {
  return (
    closure?.storyComplete === true &&
    closure?.blocksAnyRepo !== true &&
    closure?.blocksIR !== true
  );
}
