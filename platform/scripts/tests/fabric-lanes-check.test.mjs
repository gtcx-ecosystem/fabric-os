import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), '../fabric-lanes-check.mjs');

test('fabric:lanes:check passes on current registry and matrix', () => {
  const result = spawnSync(process.execPath, [SCRIPT, '--json'], {
    encoding: 'utf8',
    cwd: join(dirname(fileURLToPath(import.meta.url)), '../..'),
  });
  assert.equal(result.status, 0, result.stdout || result.stderr);
  const doc = JSON.parse(result.stdout);
  assert.equal(doc.ok, true);
  assert.ok(doc.matrixRowCount >= 15);
});
