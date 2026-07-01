import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('GTCX DSLC contract enforcement', () => {
  it('keeps the protocol contract and command surface at benchmark', () => {
    const result = spawnSync(process.execPath, ['platform/scripts/dslc-contract-check.mjs'], {
      cwd: ROOT,
      encoding: 'utf8',
    });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /GTCX DSLC contract score: 100\/100/);
    assert.match(result.stdout, /controls at benchmark: 9\/9/);
  });
});
