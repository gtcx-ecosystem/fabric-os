import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '../shared-root-concurrency-check.mjs');

test('shared-root:concurrency:check emits valid witness', () => {
  const result = spawnSync(process.execPath, [SCRIPT, '--json'], {
    encoding: 'utf8',
    cwd: join(dirname(fileURLToPath(import.meta.url)), '../..'),
  });
  // The check may pass or fail depending on current worktree state; we only
  // verify the witness shape is valid and deterministic.
  assert.equal(result.stderr, '');
  const doc = JSON.parse(result.stdout);
  assert.equal(doc.schema, 'gtcx://fabric-os/shared-root-concurrency-check/v1');
  assert.equal(doc.owner, 'fabric-os');
  assert.equal(doc.protocol, 'P62');
  assert.ok(Array.isArray(doc.drift));
  assert.ok(typeof doc.ok === 'boolean');
  assert.ok(doc.gates.ecosystemRootExists.ok);
  assert.ok(typeof doc.gates.noSharedRootWrites.count === 'number');
});
