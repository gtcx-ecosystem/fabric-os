#!/usr/bin/env node
/**
 * AaaS CLI integration suite.
 *
 * The pure-lib unit tests don't exercise the executable surface — fs reads, witness
 * shaping, --json emission. This suite SPAWNS each of the five AaaS commands against
 * the real repo and asserts they exit cleanly and emit a well-formed witness. Closes
 * the "0 CLI integration tests" gap the session self-audit surfaced.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(SCRIPTS, '../..');
const contract = JSON.parse(readFileSync(join(REPO, 'machine/spec/aaas-audit-contract.json'), 'utf8'));

function run(script, args) {
  const r = spawnSync(process.execPath, [join(SCRIPTS, script), ...args], { encoding: 'utf8', cwd: REPO });
  return { status: r.status, out: r.stdout ?? '', err: r.stderr ?? '' };
}
function runJson(script, args) {
  const r = run(script, [...args, '--json']);
  let json = null;
  try { json = JSON.parse(r.out); } catch { /* leave null */ }
  return { ...r, json };
}
// a sibling repo carrying an MPR witness (for lenses that read scores); skip if absent
const mprRepo = ['agile-os', 'ledger-os', 'inspection-os']
  .find((r) => existsSync(join(REPO, '..', r, 'audit/evidence/mpr-repo-latest.json')));

describe('aaas:signal CLI', () => {
  it('emits a well-formed SIGNAL witness (6 dims, weakest-link overall)', () => {
    const { status, json } = runJson('aaas-signal-eval.mjs', []);
    assert.equal(status, 0);
    assert.ok(json, 'stdout was not valid JSON');
    assert.equal(json.dimensions.length, 6);
    assert.equal(typeof json.overall, 'number');
    assert.match(json.overallLabel, /^L[0-5]/);
  });
});

describe('aaas:cadence CLI', () => {
  it('emits freshness + predictive forecast', () => {
    const { status, json } = runJson('aaas-cadence.mjs', []);
    assert.equal(status === 0 || status === 1, true); // WARN exit allowed when stale
    assert.ok(json?.freshness, 'no freshness block');
    assert.ok('forecast' in json, 'no forecast block');
  });
});

describe('aaas:honesty:ownership CLI', () => {
  it('emits an ownership witness over the required artifact types', () => {
    const { status, json } = runJson('aaas-ownership-check.mjs', []);
    assert.equal(status, 0);
    assert.equal(json.requiredTypes, contract.obligations.repo.requiredFolders.length);
    assert.equal(typeof json.ok, 'boolean');
    assert.ok(Array.isArray(json.violations));
  });
});

describe('aaas:honesty:adversarial CLI', () => {
  it('emits upheld/quarantined partition and never quarantines a sourced aggregate', { skip: !mprRepo }, () => {
    const { status, json } = runJson('aaas-adversarial-honesty.mjs', ['--repo', mprRepo]);
    assert.equal(status, 0); // non-strict: reports without failing
    assert.ok(json.total >= 1);
    assert.ok(Array.isArray(json.quarantined));
    assert.ok('depthUnverified' in json, 'depthUnverified signal missing');
    // the false-positive fix: legit MPR aggregates must not be quarantined as fabricated
    assert.equal(json.quarantined.filter((q) => q.refutedBy.some((r) => r.challenge === 'fabricated')).length, 0);
  });
});

describe('aaas:handoff CLI', () => {
  it('synthesizes a handoff and labels lens presence honestly', { skip: !mprRepo }, () => {
    const { status, json } = runJson('aaas-handoff.mjs', ['--repo', mprRepo]);
    assert.equal(status, 0);
    const entry = json.results?.[0];
    assert.ok(entry, 'no handoff result');
    assert.equal(typeof entry.mprPresent, 'boolean');
    assert.equal(typeof entry.actions, 'number');
  });
});
