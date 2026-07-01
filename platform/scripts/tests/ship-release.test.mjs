import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const SCRIPT = join(ROOT, 'platform/scripts/ship-release.mjs');
const CONTRACT = JSON.parse(readFileSync(join(ROOT, 'machine/spec/ship-contract.json'), 'utf8'));

function manifest(status = 'satisfied') {
  const pillars = {};
  for (const [pillar, definition] of Object.entries(CONTRACT.pillars)) {
    pillars[pillar] = {
      owner: `${pillar}-owner`,
      controls: definition.controls.map((control) => ({
        id: control.id,
        status,
        evidence: status === 'satisfied' ? [`evidence/${control.id}.json`] : [],
      })),
    };
  }
  return {
    schema: 'gtcx://fabric-os/ship-release-manifest/v1',
    releaseId: 'REL-TEST-001',
    repo: 'fabric-os',
    releaseClass: 'internal',
    title: 'SHIP evaluator test release',
    owner: 'release-management',
    dslc: {
      releaseId: 'REL-TEST-DSLC-001',
      decision: 'ready',
      score100: 100,
      evidence: 'audit/evidence/dslc-release-REL-TEST-DSLC-001-latest.json',
    },
    pillars,
  };
}

function run(input) {
  const dir = mkdtempSync(join(tmpdir(), 'ship-release-'));
  const path = join(dir, 'manifest.json');
  writeFileSync(path, `${JSON.stringify(input, null, 2)}\n`);
  const result = spawnSync(process.execPath, [SCRIPT, '--manifest', path, '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  rmSync(dir, { recursive: true, force: true });
  return result;
}

describe('GTCX SHIP release evaluator', () => {
  it('marks a fully evidenced internal release ready', () => {
    const result = run(manifest());
    assert.equal(result.status, 0, result.stderr);
    const witness = JSON.parse(result.stdout);
    assert.equal(witness.protocolId, 'GTCX-SHIP-001');
    assert.equal(witness.decision, 'ready');
    assert.equal(witness.score100, 100);
    assert.deepEqual(witness.requiredPillars, ['sealed', 'hardened', 'provisioned']);
  });

  it('refuses SHIP when DSLC did not pass', () => {
    const input = manifest();
    input.dslc.decision = 'incomplete';
    input.dslc.score100 = 90;
    const result = run(input);
    assert.equal(result.status, 1, result.stderr);
    const witness = JSON.parse(result.stdout);
    assert.equal(witness.decision, 'incomplete');
    assert.equal(witness.blockers[0].control, 'dslc-decision-ready');
  });

  it('accepts an evidenced and approved applicability exception', () => {
    const input = manifest();
    input.pillars.provisioned.controls.find(
      (control) => control.id === 'surface-feature-versioning'
    ).status = 'not-applicable';
    const surface = input.pillars.provisioned.controls.find(
      (control) => control.id === 'surface-feature-versioning'
    );
    surface.evidence = ['docs/operations/runbooks/ship-protocol.md'];
    surface.rationale = 'Protocol-only release has no runtime product surface.';
    surface.approver = 'platform-architect';
    const result = run(input);
    assert.equal(result.status, 0, result.stderr);
    const witness = JSON.parse(result.stdout);
    assert.equal(witness.decision, 'ready');
  });

  it('reports a sovereign blocker for public legal controls', () => {
    const input = manifest();
    input.releaseClass = 'public';
    const legal = input.pillars.hardened.controls.find(
      (control) => control.id === 'legal-ops-critical-controls'
    );
    legal.status = 'blocked';
    legal.evidence = [];
    const result = run(input);
    assert.equal(result.status, 1, result.stderr);
    const witness = JSON.parse(result.stdout);
    assert.equal(witness.decision, 'blocked');
    assert.equal(
      witness.blockers.find((blocker) => blocker.control === legal.id).authorityClass,
      'S'
    );
  });
});
