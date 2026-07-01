import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const SCRIPT = 'platform/scripts/qasc-dslc-ship-fleet-parity.mjs';

function run(...args) {
  return spawnSync(process.execPath, [SCRIPT, ...args], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
  });
}

describe('QASC/DSLC/SHIP fleet parity', () => {
  it('classifies fabric-os as the Fabric provider', () => {
    const result = run('--repos', 'fabric-os', '--json');
    assert.equal(result.status, 0, result.stderr);
    const witness = JSON.parse(result.stdout);

    assert.equal(witness.ownerRepo, 'fabric-os');
    assert.equal(witness.commandHealth.ok, true);
    assert.equal(witness.strictParity.ok, true);
    assert.equal(witness.strictPass, true);
    assert.equal(witness.results[0].classification, 'fabric-provider');
    assert.equal(witness.results[0].valid, true);
  });

  it('classifies gtcx-os as local-complete reference implementation', () => {
    const result = run('--repos', 'gtcx-os', '--json');
    assert.equal(result.status, 0, result.stderr);
    const witness = JSON.parse(result.stdout);

    assert.equal(witness.commandHealth.ok, true);
    assert.equal(witness.strictParity.ok, true);
    assert.equal(witness.strictPass, true);
    assert.equal(witness.results[0].classification, 'local-complete');
    assert.equal(witness.results[0].valid, true);
    assert.deepEqual(witness.results[0].local.missingLocalScripts, []);
  });

  it('accepts delegated parity only with benchmark decisions', () => {
    const result = run('--repos', 'baseline-os', '--json');
    assert.equal(result.status, 0, result.stderr);
    const witness = JSON.parse(result.stdout);

    assert.equal(witness.strictPass, true);
    assert.equal(witness.results[0].classification, 'delegated');
    assert.deepEqual(witness.results[0].delegated.protocolsComplete, {
      qasc: true,
      dslc: true,
      ship: true,
    });
  });

  it('exposes gaps without failing advisory scans', () => {
    const advisory = run('--repos', 'bridge-os', '--json');
    assert.equal(advisory.status, 0, advisory.stderr);
    const witness = JSON.parse(advisory.stdout);

    assert.equal(witness.commandHealth.ok, true);
    assert.equal(witness.strictParity.ok, false);
    assert.equal(witness.strictPass, false);
    assert.equal(witness.results[0].classification, 'gap');
    assert.equal(witness.results[0].valid, false);

    const strict = run('--repos', 'bridge-os', '--json', '--strict');
    assert.equal(strict.status, 1);
  });

  it('rejects repositories outside the versioned parity denominator', () => {
    const result = run('--repos', 'unknown-os', '--json');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /outside QASC\/DSLC\/SHIP parity denominator/);
  });
});
