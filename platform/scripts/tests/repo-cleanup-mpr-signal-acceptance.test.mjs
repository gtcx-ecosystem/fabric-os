import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(SCRIPTS, '../..');

describe('GTCX QAP repository acceptance CLI', () => {
  it('emits the required acceptance witness shape in JSON mode', () => {
    const res = spawnSync(process.execPath, [
      join(SCRIPTS, 'repo-cleanup-mpr-signal-acceptance.mjs'),
      '--json',
    ], { cwd: REPO, encoding: 'utf8' });

    assert.ok(res.status === 0 || res.status === 1, `unexpected exit ${res.status}: ${res.stderr}`);
    const witness = JSON.parse(res.stdout);
    assert.equal(witness.schema, 'gtcx://fabric-os/gtcx-qap-repository-acceptance/v1');
    assert.equal(witness.protocolId, 'GTCX-QAP-001');
    assert.equal(witness.protocolName, 'GTCX Quality Assurance Protocol');
    assert.equal(witness.compatibilitySchema, 'gtcx://fabric-os/repo-cleanup-mpr-signal-acceptance/v1');
    assert.ok(['complete', 'incomplete'].includes(witness.decision));
    assert.equal(witness.loop.target.mprComposite100, 100);
    assert.equal(witness.loop.target.signalLevel, 'L5');
    assert.equal(witness.loop.target.signalScore100, 100);
    assert.ok(Array.isArray(witness.phaseLoop), 'missing phase-level loop scorecard');

    for (const key of [
      'documentationTaxonomyLifecycle',
      'featureSpecRegistryPrd',
      'roadmapGoalsMilestonesWorkstream',
      'operationalLaneIsolation',
      'foundationalMicroAudits',
      'transformationalMicroAudits',
    ]) {
      assert.ok(witness.phaseResults[key], `missing phase result: ${key}`);
      assert.equal(typeof witness.phaseResults[key].score100, 'number', `missing phase score: ${key}`);
      assert.equal(witness.phaseResults[key].benchmark100, 100, `missing phase benchmark: ${key}`);
      assert.equal(witness.phaseResults[key].loopUntil, 'score100 >= benchmark100', `missing phase loop rule: ${key}`);
    }

    const areas = witness.acceptanceTable.map((row) => row.area);
    for (const area of [
      'Feature/spec registry',
      'Roadmap/goals/milestones',
      'Operational lane isolation',
      'Foundational micro-audits',
      'Transformational micro-audits',
      'Archive recoverability',
    ]) {
      assert.ok(areas.includes(area), `missing acceptance area: ${area}`);
    }

    for (const row of witness.acceptanceTable) {
      assert.equal(Object.hasOwn(row, 'result'), false, `binary result leaked into row: ${row.area}`);
      assert.equal(typeof row.score100, 'number', `missing score100: ${row.area}`);
      assert.equal(row.benchmark100, 100, `missing benchmark100: ${row.area}`);
      assert.equal(typeof row.applicable, 'boolean', `missing applicability: ${row.area}`);
    }

    for (const phase of witness.phaseLoop) {
      assert.equal(typeof phase.score100, 'number', `missing phase loop score: ${phase.area}`);
      assert.equal(phase.benchmark100, 100, `missing phase loop benchmark: ${phase.area}`);
      assert.equal(phase.loopUntil, 'score100 >= benchmark100', `missing phase loop rule: ${phase.area}`);
    }
  });
});
