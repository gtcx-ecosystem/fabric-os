/**
 * @fileoverview Asserts the published catalog matches its signature.
 *
 * Runs as part of `pnpm test`. If a contributor edits
 * jurisdictions.json without re-signing, this test goes red — the
 * sidecar can never silently drift out of sync with the catalog.
 *
 * The verifier itself is a separate executable (scripts/verify-catalog.mjs)
 * so downstream consumers can run it independently of node:test.
 */

import assert from 'node:assert';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const VERIFIER = join(HERE, '..', 'scripts', 'verify-catalog.mjs');

describe('compliance-data — signature', () => {
  it('verify-catalog.mjs returns exit 0 against the committed sidecar', () => {
    const result = spawnSync('node', [VERIFIER], { encoding: 'utf8' });
    assert.strictEqual(
      result.status,
      0,
      `verify-catalog must exit 0; got ${result.status}\nstderr:\n${result.stderr}`
    );
    assert.match(result.stdout, /\[verify-catalog\] OK/);
  });
});
