#!/usr/bin/env node
/**
 * SIGNAL lens — validation suite.
 * Guards the scoring contract: contiguous leveling, half-levels for non-contiguous
 * higher evidence, weakest-link overall, production-only.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { scoreDimension, evaluateSignal, DIMENSIONS } from '../lib/aaas-signal.mjs';

const checks = (...passes) => passes.map((pass, i) => ({ level: i + 1, label: `c${i + 1}`, pass }));

describe('scoreDimension', () => {
  it('levels by highest CONTIGUOUS pass', () => {
    const d = scoreDimension('Tooling', checks(true, true, true, false, false));
    assert.equal(d.level, 3);
    assert.equal(d.label, 'L3');
    assert.equal(d.primaryBlocker, 'L4: c4');
  });

  it('awards a half-level for non-contiguous higher evidence', () => {
    // L1,L2 pass, L3 fails, L4 passes -> contiguous 2, higher evidence -> L2 high
    const d = scoreDimension('Process', checks(true, true, false, true, false));
    assert.equal(d.level, 2.5);
    assert.equal(d.label, 'L2 high');
  });

  it('is L0 when nothing passes, L5 at ceiling', () => {
    assert.equal(scoreDimension('x', checks(false, false, false, false, false)).level, 0);
    const top = scoreDimension('x', checks(true, true, true, true, true));
    assert.equal(top.level, 5);
    assert.equal(top.gapToNext, 'at ceiling');
    assert.equal(top.primaryBlocker, null);
  });

  it('reports evidence and gaps', () => {
    const d = scoreDimension('x', checks(true, false, true, false, false));
    assert.deepEqual(d.evidence, ['L1: c1', 'L3: c3']);
    assert.ok(d.gaps.includes('L2: c2'));
  });
});

describe('evaluateSignal', () => {
  it('overall = weakest-link across all six dimensions', () => {
    const dimChecks = {
      'Systems Architecture': checks(true, true, true, true, true), // L5
      Tooling: checks(true, true, true, true, false), // L4
      Process: checks(true, true, false, false, false), // L2
      Safeguards: checks(true, true, true, false, false), // L3
      Monitoring: checks(true, false, false, false, false), // L1  <- weakest
      'Team & Ownership': checks(true, true, true, false, false), // L3
    };
    const w = evaluateSignal({ repo: 'demo', dimChecks });
    assert.equal(w.overall, 1);
    assert.equal(w.overallLabel, 'L1');
    assert.equal(w.weakestLink, 'Monitoring');
    assert.equal(w.dimensions.length, 6);
  });

  it('covers exactly the six SIGNAL dimensions in order', () => {
    const w = evaluateSignal({ repo: 'demo', dimChecks: {} });
    assert.deepEqual(w.dimensions.map((d) => d.dimension), DIMENSIONS);
    assert.equal(w.overall, 0); // production-only: no evidence -> L0
  });

  it('emits dimensions[].level — the shape the handoff synthesizer consumes', () => {
    const w = evaluateSignal({ repo: 'demo', dimChecks: { Tooling: checks(true, true, false, false, false) } });
    const tooling = w.dimensions.find((d) => d.dimension === 'Tooling');
    assert.equal(typeof tooling.level, 'number');
  });
});
