import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scoreJson } from '../qasc-repo.mjs';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(SCRIPTS, '../..');

describe('GTCX QASC repository scorer', () => {
  it('scores nested gate groups from explicit boolean leaves only', () => {
    assert.equal(scoreJson({
      gates: {
        index: { ok: true },
        cards: {
          terminal: { ok: true },
          compliance: { ok: true },
          markets: { ok: true },
        },
        aggregate: { ok: true },
      },
    }), 100);
  });

  it('emits the required acceptance witness shape in JSON mode', () => {
    const res = spawnSync(process.execPath, [
      join(SCRIPTS, 'qasc-repo.mjs'),
      '--json',
    ], { cwd: REPO, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

    assert.ok(res.status === 0 || res.status === 1, `unexpected exit ${res.status}: ${res.stderr}`);
    const witness = JSON.parse(res.stdout);
    assert.equal(witness.schema, 'gtcx://fabric-os/qasc-repo-score/v1');
    assert.ok(['complete', 'incomplete'].includes(witness.decision));
    assert.equal(witness.loop.target.mprComposite100, 100);
    assert.equal(witness.loop.target.signalLevel, 'L5');
    assert.equal(witness.loop.target.signalScore100, 100);
    assert.equal(typeof witness.acceptance.score100, 'number');
    assert.equal(typeof witness.acceptance.benchmarkCount, 'number');
    assert.equal(typeof witness.acceptance.passCount, 'undefined');
    assert.equal(typeof witness.acceptance.areaCount, 'number');

    for (const key of [
      'documentationTaxonomyLifecycle',
      'featureSpecRegistryPrd',
      'roadmapGoalsMilestonesWorkstream',
      'operationalLaneIsolation',
      'mprComposite',
      'signalMaturity',
      'foundationalMicroAudits',
      'transformationalMicroAudits',
    ]) {
      assert.ok(witness.phaseResults[key], `missing phase result: ${key}`);
    }

    assert.ok(Array.isArray(witness.phaseLoop), 'missing phaseLoop');
    assert.ok(witness.phaseLoop.length >= 1, 'phaseLoop should contain entries');
    witness.phaseLoop.forEach((row, idx) => {
      assert.equal(typeof row.phaseIndex, 'number', `phaseLoop row ${idx} missing phaseIndex`);
      assert.equal(typeof row.score100, 'number', `phaseLoop row ${idx} missing score100`);
      assert.equal(typeof row.benchmark100, 'number', `phaseLoop row ${idx} missing benchmark100`);
      assert.equal(typeof row.loopUntil, 'string', `phaseLoop row ${idx} missing loopUntil`);
      assert.equal(typeof row.applicable, 'boolean', `phaseLoop row ${idx} missing applicable`);
    });

    const areas = witness.acceptanceTable.map((row) => row.area);
    for (const area of [
      'Feature/spec registry',
      'Roadmap/goals/milestones',
      'Operational lane isolation',
      'Security implementation controls',
      'Compliance implementation controls',
      'MPR composite',
      'SIGNAL maturity',
      'Foundational micro-audits',
      'Transformational micro-audits',
      'Archive recoverability',
    ]) {
      assert.ok(areas.includes(area), `missing acceptance area: ${area}`);
      const row = witness.acceptanceTable.find((r) => r.area === area);
      assert.ok(row);
      assert.equal(typeof row.result, 'undefined', `row should not include a binary result field: ${area}`);
      assert.equal(typeof row.score100, 'number');
    }
  });
});
