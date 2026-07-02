import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { branchDivergence, isGeneratedEvidenceStatusLine, scoreJson } from '../qasc-repo.mjs';

const SCRIPTS = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(SCRIPTS, '../..');

describe('GTCX QASC repository scorer', () => {
  it('ignores canonical generated witnesses but not source changes', () => {
    assert.equal(isGeneratedEvidenceStatusLine(' M audit/evidence/mpr-repo-latest.json'), true);
    assert.equal(isGeneratedEvidenceStatusLine('?? audit/archive/2026-07-01/'), true);
    assert.equal(isGeneratedEvidenceStatusLine(' M .baseline/memory/session.md'), true);
    assert.equal(isGeneratedEvidenceStatusLine(' M platform/scripts/qasc-repo.mjs'), false);
    assert.equal(isGeneratedEvidenceStatusLine(' M package.json'), false);
  });

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

  it('treats unpushed or out-of-date branch state as SCM divergence', () => {
    assert.equal(branchDivergence('## main...origin/main [ahead 20]'), 'branch divergence: ahead 20');
    assert.equal(branchDivergence('## main...origin/main [behind 2]'), 'branch divergence: behind 2');
    assert.equal(branchDivergence('## main...origin/main [ahead 1, behind 1]'), 'branch divergence: ahead 1, behind 1');
    assert.equal(branchDivergence('## main...origin/main'), null);
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
      'Folder/file/product spec alignment',
      'Operational lane isolation',
      'Security implementation controls',
      'Compliance implementation controls',
      'MPR composite',
      'SIGNAL maturity',
      'Foundational micro-audits',
      'Transformational micro-audits',
      'Product-intent source',
      'Machine-readable standardization',
      'Forensic spec',
      'Package MPR',
      'Package SIGNAL',
      'Production spec package',
      'Scrum handoff',
      'Backlog compatibility only',
      'Archive recoverability',
      'Deletion preservation policy',
    ]) {
      assert.ok(areas.includes(area), `missing acceptance area: ${area}`);
      const row = witness.acceptanceTable.find((r) => r.area === area);
      assert.ok(row);
      assert.equal(typeof row.result, 'undefined', `row should not include a binary result field: ${area}`);
      assert.equal(typeof row.score100, 'number');
    }
  });

  it('runs a repo-local link checker directly when package scripts omit docs:check-links', () => {
    const root = mkdtempSync(join(tmpdir(), 'qasc-repo-links-'));
    mkdirSync(join(root, 'platform/scripts'), { recursive: true });
    writeFileSync(join(root, 'package.json'), JSON.stringify({ scripts: {} }, null, 2));
    writeFileSync(join(root, 'platform/scripts/check-doc-links.mjs'), [
      "console.log('Checked 12 links across 3 markdown files.');",
      "console.log('0 broken link(s) found.');",
    ].join('\n'));
    spawnSync('git', ['init'], { cwd: root, encoding: 'utf8' });

    const res = spawnSync(process.execPath, [
      join(SCRIPTS, 'qasc-repo.mjs'),
      '--json',
    ], { cwd: root, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 });

    assert.ok(res.status === 0 || res.status === 1, `unexpected exit ${res.status}: ${res.stderr}`);
    const witness = JSON.parse(res.stdout);
    const linkRow = witness.acceptanceTable.find((row) => row.area === 'Link/reference hygiene');
    assert.ok(linkRow, 'missing link/reference hygiene row');
    assert.equal(linkRow.score100, 100);
    assert.match(linkRow.evidence, /node platform\/scripts\/check-doc-links\.mjs exit 0/);
    assert.equal(witness.phaseResults.documentationTaxonomyLifecycle.evidence[2].command, 'node platform/scripts/check-doc-links.mjs');
  });
});
