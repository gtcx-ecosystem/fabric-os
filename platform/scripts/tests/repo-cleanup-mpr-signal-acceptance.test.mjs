import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(SCRIPTS, '../..');

describe('repository assurance acceptance CLI', () => {
  it('emits the required acceptance witness shape in JSON mode', () => {
    const res = spawnSync(process.execPath, [
      join(SCRIPTS, 'repo-cleanup-mpr-signal-acceptance.mjs'),
      '--json',
    ], { cwd: REPO, encoding: 'utf8' });

    assert.ok(res.status === 0 || res.status === 1, `unexpected exit ${res.status}: ${res.stderr}`);
    const witness = JSON.parse(res.stdout);
    assert.equal(witness.schema, 'gtcx://fabric-os/repo-cleanup-mpr-signal-acceptance/v1');
    assert.ok(['complete', 'incomplete'].includes(witness.decision));
    assert.equal(witness.loop.target.mprComposite100, 100);
    assert.equal(witness.loop.target.signalLevel, 'L5');
    assert.equal(witness.loop.target.signalScore100, 100);

    for (const key of [
      'documentationTaxonomyLifecycle',
      'featureSpecRegistryPrd',
      'roadmapGoalsMilestonesWorkstream',
      'operationalLaneIsolation',
      'foundationalMicroAudits',
      'transformationalMicroAudits',
    ]) {
      assert.ok(witness.phaseResults[key], `missing phase result: ${key}`);
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
  });
});
