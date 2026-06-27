#!/usr/bin/env node
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateHonesty } from '../aaas-honesty-gate.mjs';

const registry = (features) => ({
  status: 'in_progress',
  composition: { features, services: [], infra: [], experience: [], commercial: [] },
});

const cap = (id) => ({ id, title: id, status: 'in_progress' });

const entry = (over = {}) => ({
  capabilityId: 'FEAT-A',
  entryRoute: 'app/a/page.tsx',
  deepestRouteChecked: 'app/a/[id]/page.tsx',
  veracity: 'real',
  disclosed: true,
  score: 80,
  worstFinding: 'none',
  ...over,
});

const clean = {
  registry: registry([cap('FEAT-A')]),
  coverage: { entries: [entry()] },
  composite: { composite100: 80, capsFired: [] },
};

describe('aaas-honesty-gate', () => {
  it('passes a clean, fully-covered audit', () => {
    const { witness, ok } = evaluateHonesty(clean);
    assert.equal(ok, true);
    assert.equal(witness.gates.coverageComplete.ok, true);
    assert.equal(witness.gates.depthVerified.ok, true);
    assert.equal(witness.gates.veracityDisclosed.ok, true);
    assert.equal(witness.gates.contradictionReconciled.ok, true);
    assert.equal(witness.gates.registryNonEmpty.ok, true);
  });

  it('fails coverageComplete when a registry capability is uncovered', () => {
    const { witness, ok } = evaluateHonesty({
      ...clean,
      registry: registry([cap('FEAT-A'), cap('FEAT-B')]),
    });
    assert.equal(ok, false);
    assert.equal(witness.gates.coverageComplete.ok, false);
    assert.deepEqual(witness.gates.coverageComplete.uncovered, ['FEAT-B']);
  });

  it('fails depthVerified when deepestRouteChecked equals entryRoute', () => {
    const { witness, ok } = evaluateHonesty({
      ...clean,
      coverage: { entries: [entry({ deepestRouteChecked: 'app/a/page.tsx' })] },
    });
    assert.equal(ok, false);
    assert.equal(witness.gates.depthVerified.ok, false);
  });

  it('fails depthVerified when deepestRouteChecked is missing', () => {
    const { witness, ok } = evaluateHonesty({
      ...clean,
      coverage: { entries: [entry({ deepestRouteChecked: '' })] },
    });
    assert.equal(ok, false);
    assert.equal(witness.gates.depthVerified.ok, false);
  });

  it('fails veracityDisclosed for an undisclosed non-real surface', () => {
    const { witness, ok } = evaluateHonesty({
      ...clean,
      coverage: { entries: [entry({ veracity: 'fabricated', disclosed: false })] },
    });
    assert.equal(ok, false);
    assert.equal(witness.gates.veracityDisclosed.ok, false);
  });

  it('passes veracityDisclosed for a disclosed fixture', () => {
    const { ok } = evaluateHonesty({
      ...clean,
      coverage: { entries: [entry({ veracity: 'fixture', disclosed: true })] },
    });
    assert.equal(ok, true);
  });

  it('fails contradictionReconciled when composite is high but a capability is broken', () => {
    const { witness, ok } = evaluateHonesty({
      ...clean,
      coverage: { entries: [entry({ score: 40 })] },
      composite: { composite100: 100, capsFired: [] },
    });
    assert.equal(ok, false);
    assert.equal(witness.gates.contradictionReconciled.ok, false);
  });

  it('does not flag contradiction when a cap was already fired', () => {
    const { witness } = evaluateHonesty({
      ...clean,
      coverage: { entries: [entry({ score: 40 })] },
      composite: { composite100: 100, capsFired: [{ id: 'gate-x' }] },
    });
    assert.equal(witness.gates.contradictionReconciled.ok, true);
  });

  it('fails registryNonEmpty for an empty registry', () => {
    const { witness, ok } = evaluateHonesty({
      ...clean,
      registry: registry([]),
      coverage: { entries: [] },
    });
    assert.equal(ok, false);
    assert.equal(witness.gates.registryNonEmpty.ok, false);
  });

  it('leads with the worst verified finding (lowest score)', () => {
    const { witness } = evaluateHonesty({
      registry: registry([cap('FEAT-A'), cap('FEAT-B')]),
      coverage: {
        entries: [
          entry({ capabilityId: 'FEAT-A', score: 90, worstFinding: 'minor' }),
          entry({
            capabilityId: 'FEAT-B',
            entryRoute: 'app/b/page.tsx',
            deepestRouteChecked: 'app/b/[id]/page.tsx',
            score: 30,
            worstFinding: 'fabricated report body served undisclosed',
          }),
        ],
      },
      composite: { composite100: 70, capsFired: [] },
    });
    assert.equal(witness.worstVerifiedFinding, 'fabricated report body served undisclosed');
    assert.equal(Object.keys(witness)[1], 'worstVerifiedFinding');
  });

  it('reports registry authority without failing a non-strict draft', () => {
    const { witness, ok } = evaluateHonesty({
      ...clean,
      registry: { ...registry([cap('FEAT-A')]), status: 'draft' },
    });
    assert.equal(ok, true);
    assert.equal(witness.registry.authoritative, false);
  });

  it('fails a draft registry claimed fully covered under strict-registry', () => {
    const { ok, witness } = evaluateHonesty({
      ...clean,
      registry: { ...registry([cap('FEAT-A')]), status: 'draft' },
      opts: { strictRegistry: true },
    });
    assert.equal(ok, false);
    assert.equal(witness.gates.registryAuthoritative.ok, false);
  });
});
