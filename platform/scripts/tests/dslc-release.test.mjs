import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const SCRIPT = join(ROOT, 'platform/scripts/dslc-release.mjs');
const CONTRACT = JSON.parse(readFileSync(join(ROOT, 'machine/spec/dslc-contract.json'), 'utf8'));

function manifest(status = 'satisfied') {
  const lanes = {};
  for (const [lane, definition] of Object.entries(CONTRACT.lanes)) {
    lanes[lane] = {
      owner: `${lane}-owner`,
      controls: definition.controls.map((control) => ({
        id: control.id,
        status,
        evidence: status === 'satisfied' ? [`evidence/${control.id}.json`] : [],
        ...(status === 'satisfied' && ['A', 'S'].includes(control.authorityClass)
          ? { approver: `${control.authorityClass.toLowerCase()}-approver` }
          : {}),
      })),
    };
  }
  return {
    schema: 'gtcx://fabric-os/dslc-release-manifest/v1',
    releaseId: 'REL-TEST-001',
    repo: 'fabric-os',
    releaseClass: 'internal',
    title: 'DSLC evaluator test release',
    owner: 'platform-engineering',
    qasc: {
      score100: 100,
      signalLevel: 'L5',
      evidence: 'audit/evidence/qasc-repo-latest.json',
    },
    lanes,
  };
}

function run(input) {
  const dir = mkdtempSync(join(tmpdir(), 'dslc-release-'));
  const path = join(dir, 'manifest.json');
  writeFileSync(path, `${JSON.stringify(input, null, 2)}\n`);
  const result = spawnSync(process.execPath, [SCRIPT, '--manifest', path, '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  rmSync(dir, { recursive: true, force: true });
  return result;
}

describe('GTCX DSLC release evaluator', () => {
  it('marks a fully evidenced internal release ready', () => {
    const result = run(manifest());
    assert.equal(result.status, 0, result.stderr);
    const witness = JSON.parse(result.stdout);
    assert.equal(witness.protocolId, 'GTCX-DSLC-001');
    assert.equal(witness.decision, 'ready');
    assert.equal(witness.score100, 100);
    assert.deepEqual(witness.requiredLanes, ['deployment']);
  });

  it('keeps a required control incomplete without evidence', () => {
    const input = manifest();
    input.lanes.deployment.controls[0].status = 'not-applicable';
    input.lanes.deployment.controls[0].evidence = [];
    const result = run(input);
    assert.equal(result.status, 1, result.stderr);
    const witness = JSON.parse(result.stdout);
    assert.equal(witness.decision, 'incomplete');
    assert.ok(witness.score100 < 100);
    assert.equal(witness.blockers[0].control, 'release-scope-version');
  });

  it('accepts an evidenced and approved applicability exception', () => {
    const input = manifest();
    input.lanes.deployment.controls[0] = {
      id: 'release-scope-version',
      status: 'not-applicable',
      evidence: ['docs/operations/runbooks/dslc-protocol.md'],
      rationale: 'The protocol-only release has no independently versioned runtime artifact.',
      approver: 'platform-architect',
    };
    const result = run(input);
    assert.equal(result.status, 0, result.stderr);
    const witness = JSON.parse(result.stdout);
    assert.equal(witness.decision, 'ready');
  });

  it('requires an approver for satisfied Class A controls', () => {
    const input = manifest();
    const rollout = input.lanes.deployment.controls.find(
      (control) => control.id === 'deployment-rollout-rollback'
    );
    delete rollout.approver;
    const result = run(input);
    assert.equal(result.status, 1, result.stderr);
    const witness = JSON.parse(result.stdout);
    assert.equal(witness.decision, 'incomplete');
    assert.equal(
      witness.blockers.find((blocker) => blocker.control === rollout.id).reason,
      'status=satisfied; evidence=1; approver=missing'
    );
  });

  it('reports a sovereign legal blocker for a pilot', () => {
    const input = manifest();
    input.releaseClass = 'pilot';
    const signature = input.lanes.legal.controls.find(
      (control) => control.id === 'signatory-authority-execution'
    );
    signature.status = 'blocked';
    signature.evidence = [];
    const result = run(input);
    assert.equal(result.status, 1, result.stderr);
    const witness = JSON.parse(result.stdout);
    assert.equal(witness.decision, 'blocked');
    assert.equal(
      witness.blockers.find((blocker) => blocker.control === signature.id).authorityClass,
      'S'
    );
  });

  it('writes evidence to an explicit repository output root', () => {
    const dir = mkdtempSync(join(tmpdir(), 'dslc-release-output-'));
    const path = join(dir, 'manifest.json');
    writeFileSync(path, `${JSON.stringify(manifest(), null, 2)}\n`);
    const result = spawnSync(
      process.execPath,
      [SCRIPT, '--manifest', path, '--output-root', dir, '--write', '--json'],
      { cwd: ROOT, encoding: 'utf8' }
    );
    assert.equal(result.status, 0, result.stderr);
    assert.ok(existsSync(join(dir, 'audit/evidence/dslc-release-REL-TEST-001-latest.json')));
    rmSync(dir, { recursive: true, force: true });
  });
});
