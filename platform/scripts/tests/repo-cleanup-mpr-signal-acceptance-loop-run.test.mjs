import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(SCRIPTS, '../..');

describe('repo cleanup acceptance loop runner', () => {
  it('emits JSON loop summary with scored iterations', () => {
    const res = spawnSync(process.execPath, [
      join(SCRIPTS, 'repo-cleanup-mpr-signal-acceptance-loop-run.mjs'),
      '--max',
      '3',
      '--stagnant-limit',
      '1',
      '--json',
    ], { cwd: REPO, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

    assert.equal(typeof res.stdout, 'string');
    const witness = JSON.parse(res.stdout);
    assert.equal(witness.schema, 'gtcx://fabric-os/repo-cleanup-mpr-signal-loop-run/v2');
    assert.equal(typeof witness.iterations, 'number');
    assert.equal(Array.isArray(witness.history), true);
    assert.equal(witness.history.length >= 1, true);
    assert.equal(typeof witness.final?.score100, 'number');
    assert.ok(['benchmark-reached', 'stagnant', 'max-iterations', 'unreadable-witness'].includes(witness.stopReason));
    assert.equal(typeof witness.final?.benchmarkCount, 'number');
    assert.equal(typeof witness.final?.passCount, 'undefined');
    assert.equal(Array.isArray(witness.final?.phases), true);
  });
});
