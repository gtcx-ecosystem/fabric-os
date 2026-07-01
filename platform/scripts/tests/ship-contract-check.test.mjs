import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');

describe('GTCX SHIP contract enforcement', () => {
  it('keeps the protocol contract and command surface at benchmark', () => {
    const result = spawnSync(process.execPath, ['platform/scripts/ship-contract-check.mjs'], {
      cwd: ROOT,
      encoding: 'utf8',
    });

    assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
    assert.match(result.stdout, /GTCX SHIP contract score: 100\/100/);
    assert.match(result.stdout, /controls at benchmark: 10\/10/);
  });
});
