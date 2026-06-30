import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(SCRIPTS, '../..');

function run(...args) {
  return spawnSync(process.execPath, [join(SCRIPTS, 'qasc-fleet.mjs'), ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  });
}

describe('GTCX QASC fleet scoring', () => {
  it('scores a selected canonical repository without binary result fields', () => {
    const result = run('--repos', 'fabric-os', '--json');
    assert.equal(result.status, 0, result.stderr);
    const witness = JSON.parse(result.stdout);

    assert.equal(witness.schema, 'gtcx://fabric-os/qasc-fleet-score/v1');
    assert.equal(witness.protocolId, 'GTCX-QASC-001');
    assert.equal(witness.repoCount, 1);
    assert.equal(witness.repos[0].repo, 'fabric-os');
    assert.equal(typeof witness.repos[0].score100, 'number');
    assert.equal(witness.repos[0].contractScore100, 100);
    assert.deepEqual(witness.repos[0].missingControls, []);
    assert.equal(typeof witness.repos[0].atBenchmark, 'boolean');
    assert.equal(typeof witness.repos[0].result, 'undefined');
  });

  it('rejects repositories outside the versioned QASC denominator', () => {
    const result = run('--repos', 'gtcx-markets', '--json');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /outside QASC denominator/);
  });

  it('uses strict mode only for benchmark enforcement', () => {
    const advisory = run('--repos', 'fabric-os', '--json');
    const strict = run('--repos', 'fabric-os', '--json', '--strict');
    const witness = JSON.parse(advisory.stdout);

    assert.equal(advisory.status, 0);
    assert.equal(strict.status, witness.atBenchmark ? 0 : 1);
  });
});
