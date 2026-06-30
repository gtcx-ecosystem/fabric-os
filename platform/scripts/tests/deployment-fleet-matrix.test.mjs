import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

const cwd = new URL('../../..', import.meta.url);

function runMatrix(args = []) {
  return spawnSync('node', ['platform/scripts/deployment-fleet-matrix.mjs', ...args], {
    cwd,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

describe('deployment fleet matrix scoring', () => {
  it('emits a scored fleet witness without binary result fields', () => {
    const result = runMatrix(['--json']);
    assert.equal(result.status, 0, result.stderr);

    const witness = JSON.parse(result.stdout);
    assert.equal(witness.schema, 'gtcx://fabric-os/deployment-fleet-matrix-score/v1');
    assert.equal(witness.benchmarkScore100, 100);
    assert.equal(typeof witness.score100, 'number');
    assert.equal(typeof witness.globalScore100, 'number');
    assert.equal(typeof witness.repoAverageScore100, 'number');
    assert.equal(witness.githubActionsCriticalPath, false);
    assert.equal(typeof witness.result, 'undefined');
    assert.equal(typeof witness.pass, 'undefined');
    assert.ok(Array.isArray(witness.repos));
    assert.ok(witness.repos.length >= 20);

    for (const repo of witness.repos) {
      assert.equal(typeof repo.score100, 'number');
      assert.equal(typeof repo.result, 'undefined');
      assert.ok(Array.isArray(repo.controls));
      for (const control of repo.controls) {
        assert.equal(typeof control.score100, 'number');
        assert.equal(typeof control.result, 'undefined');
      }
    }
  });

  it('uses strict mode only for benchmark enforcement', () => {
    const jsonResult = runMatrix(['--json']);
    assert.equal(jsonResult.status, 0, jsonResult.stderr);
    const witness = JSON.parse(jsonResult.stdout);

    const strictResult = runMatrix(['--strict']);
    assert.equal(
      strictResult.status,
      witness.score100 >= witness.benchmarkScore100 ? 0 : 1,
      strictResult.stderr,
    );
  });
});
