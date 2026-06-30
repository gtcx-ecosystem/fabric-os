#!/usr/bin/env node
/**
 * AaaS framework design — validation suite.
 *
 * Proves the MPR + SIGNAL dual-lens design is fully DOCUMENTED (the contract
 * carries the four-artifact model, both lenses, the lifecycle, the maturity
 * ceiling), ENFORCEABLE (audit/handoff is a required folder), and VERIFIABLE
 * (conformance scores a repo below benchmark when it is missing it). The contract is the single
 * machine-readable source the checker AND the provisioner both read, so these
 * assertions guard against design/enforcement drift.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluateConformance, summarizeRepoAudit } from '../lib/aaas-audit-registry.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const SPEC = join(HERE, '../../../machine/spec');
const contract = JSON.parse(readFileSync(join(SPEC, 'aaas-audit-contract.json'), 'utf8'));

const FOUR_ARTIFACTS = ['audit', 'handoff', 'report', 'evidence'];
const SIGNAL_DIMS = [
  'Systems Architecture', 'Tooling', 'Process', 'Safeguards', 'Monitoring', 'Team & Ownership',
];
const MPR_PILLARS = [
  'compliance', 'technicalExcellence', 'craft', 'worldClass', 'trustAndSafety',
  'creativityInnovation', 'commercialValue', 'defensiveMoat', 'agenticEmpowerment',
  'productEcosystemIntegration', 'ipMagic',
];

describe('design is DOCUMENTED — contract carries the model', () => {
  it('declares contract version >= 1.1.0 and points at the design doc', () => {
    const [maj, min] = contract.version.split('.').map(Number);
    assert.ok(maj > 1 || (maj === 1 && min >= 1), `version ${contract.version} < 1.1.0`);
    assert.match(contract.designDoc, /aaas-framework-design.*\.md$/);
  });

  it('defines all FOUR artifact concepts (audit, handoff, report, evidence)', () => {
    for (const concept of FOUR_ARTIFACTS) {
      assert.ok(contract.vocabulary[concept], `vocabulary missing "${concept}"`);
      assert.ok(contract.vocabulary[concept].is, `"${concept}" has no definition`);
      assert.ok(contract.vocabulary[concept].folder, `"${concept}" has no folder`);
    }
  });

  it('handoff vocabulary is the directive ("what to do next"), distinct from report', () => {
    assert.match(contract.vocabulary.handoff.is, /directive|work-order/i);
    assert.match(contract.vocabulary.report.is, /remediation|did/i);
    assert.notEqual(contract.vocabulary.handoff.folder, contract.vocabulary.report.folder);
  });

  it('declares BOTH lenses with owners and a complete cross-map', () => {
    assert.equal(contract.lenses.mpr.owner, 'bridge-os');
    assert.equal(contract.lenses.signal.owner, 'baseline-os');
    assert.deepEqual(contract.lenses.signal.dimensions, SIGNAL_DIMS);
    // every SIGNAL dimension maps to >=1 MPR pillar
    for (const dim of SIGNAL_DIMS) {
      const mapped = contract.lenses.crossMap[dim];
      assert.ok(Array.isArray(mapped) && mapped.length >= 1, `crossMap missing ${dim}`);
      for (const pillar of mapped) {
        assert.ok(MPR_PILLARS.includes(pillar), `crossMap ${dim} -> unknown pillar ${pillar}`);
      }
    }
  });

  it('encodes the full 6-step lifecycle loop in order', () => {
    const names = contract.lifecycle.steps.map((s) => s.name);
    assert.deepEqual(names, ['audit', 'handoff', 'remediate', 'report', 're-verify', 'cadence']);
    contract.lifecycle.steps.forEach((s, i) => {
      assert.equal(s.step, i + 1, `step ${s.name} out of order`);
      assert.ok(s.owner, `step ${s.name} has no owner`);
    });
  });

  it('declares the L5 / 95 ceiling and the four L5-enabling additions', () => {
    assert.match(contract.maturityModel.ceiling, /L5.*95|95.*L5/);
    assert.equal(contract.maturityModel.signalOverall, 'weakest-link (lowest dimension)');
    assert.equal(contract.maturityModel.mprThresholds.unlock, 85);
    assert.equal(contract.maturityModel.mprThresholds.worldClass, 95);
    assert.equal(contract.maturityModel.l5Additions.length, 4);
  });

  it('publishes naming conventions for each artifact type', () => {
    const n = contract.namingConventions;
    assert.match(n.handoffDirective, /audit\/handoff\/handoff-/);
    assert.match(n.auditAssessment, /audit\/reports\//);
    assert.match(n.remediationReport, /^audit\/reports\/remediation\//);
    assert.match(n.evidenceWitness, /audit\/evidence\/.*-latest\.json$/);
  });
});

describe('design is ENFORCEABLE — handoff is a required folder', () => {
  const required = contract.obligations.repo.requiredFolders;

    it('requires the four audit artifact folders without a conflicting root reports folder', () => {
    for (const f of ['audit/evidence', 'audit/reports', 'audit/handoff', 'audit/archive']) {
      assert.ok(required.includes(f), `requiredFolders missing ${f}`);
    }
    assert.equal(required.includes('reports'), false, 'P35 forbids a top-level reports folder');
  });

  it('carries a handoff obligation', () => {
    assert.match(contract.obligations.repo.handoffDirective, /audit\/handoff\//);
  });
});

describe('design is VERIFIABLE — conformance reacts to the model', () => {
  const binding = { repo: 'demo', auditProfile: 'platform' };
  const repoState = summarizeRepoAudit({
    repo: 'demo',
    witnesses: [
      { file: 'mpr-repo-latest.json', json: { schema: 'x', checkedAt: '2026-06-28T00:00:00Z', composite100: 90 } },
      { file: 'aaas-honesty-gate-latest.json', json: { schema: 'y', checkedAt: '2026-06-28T00:00:00Z' } },
    ],
    nowMs: Date.parse('2026-06-28T00:00:00Z'),
    cadenceDays: 7,
  });
  const allFolders = contract.obligations.repo.requiredFolders;

    it('scores a repo missing audit/handoff below benchmark (the enforcement bites)', () => {
    const without = allFolders.filter((f) => f !== 'audit/handoff');
    const r = evaluateConformance({ binding, contract, presentFolders: without, repoState, hasPin: true });
    assert.equal(r.ok, false);
    assert.ok(r.missingFolders.includes('audit/handoff'));
  });

    it('scores a repo with all folders + pin + fresh required witnesses at benchmark', () => {
    const r = evaluateConformance({ binding, contract, presentFolders: allFolders, repoState, hasPin: true });
    assert.equal(r.ok, true, `expected conformant, got: ${JSON.stringify(r)}`);
    assert.equal(r.missingFolders.length, 0);
  });

    it('scores below benchmark when the contract pin is absent', () => {
    const r = evaluateConformance({ binding, contract, presentFolders: allFolders, repoState, hasPin: false });
    assert.equal(r.ok, false);
    assert.equal(r.hasPin, false);
  });
});
