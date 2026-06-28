#!/usr/bin/env node
/**
 * AaaS handoff synthesizer — validation suite.
 *
 * Guards the keystone priority contract: SIGNAL weakest-link first, then MPR
 * threshold gaps (foundational tier first, smallest gap first), then world-class
 * lifts — and that the synthesizer NEVER fabricates when a lens is absent.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseLevel, extractPillars, extractSignal, synthesizeHandoff, renderHandoff,
} from '../lib/aaas-handoff.mjs';

const mprWitness = {
  quadrants: {
    compliance: { score100: 69, unlockThreshold100: 85, categories: { a: { label: 'Layout', score100: 45 }, b: { label: 'Other', score100: 90 } } },
    technicalExcellence: { score100: 70, unlockThreshold100: 85, categories: {} },
    craft: { score100: 84, unlockThreshold100: 85, categories: {} },
    worldClass: { score100: 93, unlockThreshold100: 85, categories: {} },
    trustAndSafety: { score100: 77, unlockThreshold100: 85, categories: {} },
  },
};

describe('parseLevel', () => {
  it('parses L-notation, plain ints, and half-levels', () => {
    assert.equal(parseLevel('L2'), 2);
    assert.equal(parseLevel('L3 high'), 3.5);
    assert.equal(parseLevel(4), 4);
    assert.equal(parseLevel('nope'), null);
  });
});

describe('extractPillars', () => {
  it('reads scores, thresholds, tier, and weakest category', () => {
    const p = extractPillars(mprWitness);
    const compliance = p.find((x) => x.pillar === 'compliance');
    assert.equal(compliance.score, 69);
    assert.equal(compliance.tier, 'foundational');
    assert.equal(compliance.weakestCategory, 'Layout');
    assert.equal(extractPillars(null).length, 0);
  });
});

describe('extractSignal', () => {
  it('handles object- and array-shaped witnesses, returns null when absent', () => {
    assert.equal(extractSignal(null), null);
    const obj = extractSignal({ dimensions: { Tooling: { level: 'L1' }, Process: 'L2' } });
    assert.deepEqual(obj.find((d) => d.dimension === 'Tooling'), { dimension: 'Tooling', level: 1 });
    const arr = extractSignal({ dimensions: [{ dimension: 'Monitoring', level: 'L2' }] });
    assert.equal(arr[0].level, 2);
  });
});

describe('synthesizeHandoff — priority contract', () => {
  it('puts SIGNAL weakest-link before any MPR action', () => {
    const pillars = extractPillars(mprWitness);
    const signal = [
      { dimension: 'Tooling', level: 1 },
      { dimension: 'Process', level: 2 },
      { dimension: 'Monitoring', level: 3 },
    ];
    const { actions } = synthesizeHandoff({ repo: 'demo', pillars, signal });
    assert.equal(actions[0].lens, 'SIGNAL');
    assert.match(actions[0].action, /Tooling from L1 to L2/);
    assert.match(actions[0].closes, /weakest-link/);
    // first MPR action comes only after all SIGNAL weakest-link items
    const firstMpr = actions.findIndex((a) => a.lens === 'MPR');
    assert.ok(actions.slice(0, firstMpr).every((a) => a.lens === 'SIGNAL'));
  });

  it('emits one SIGNAL action per tied weakest dimension', () => {
    const signal = [
      { dimension: 'Tooling', level: 1 },
      { dimension: 'Team & Ownership', level: 1 },
      { dimension: 'Process', level: 3 },
    ];
    const { actions } = synthesizeHandoff({ repo: 'demo', pillars: [], signal });
    const sig = actions.filter((a) => a.lens === 'SIGNAL');
    assert.equal(sig.length, 2);
  });

  it('orders MPR gaps foundational-first, then smallest gap first', () => {
    const pillars = extractPillars(mprWitness);
    const { actions } = synthesizeHandoff({ repo: 'demo', pillars, signal: null });
    const below = actions.filter((a) => a.gate === '>= 85');
    // gaps: craft 1, trustAndSafety 8, technicalExcellence 15, compliance 16
    const order = below.map((a) => a.closes.split(' ')[1]);
    assert.deepEqual(order, ['craft', 'trustAndSafety', 'technicalExcellence', 'compliance']);
  });

  it('includes the weakest category as the concrete starting point', () => {
    const pillars = extractPillars(mprWitness);
    const { actions } = synthesizeHandoff({ repo: 'demo', pillars, signal: null });
    const compliance = actions.find((a) => a.closes.startsWith('MPR compliance'));
    assert.match(compliance.action, /start with: Layout/);
  });

  it('adds world-class lifts AFTER all unlock gaps, lowest priority', () => {
    const pillars = extractPillars(mprWitness);
    const { actions } = synthesizeHandoff({ repo: 'demo', pillars, signal: null });
    const wc = actions.filter((a) => a.gate === '>= 95');
    const lastUnlock = actions.map((a) => a.gate).lastIndexOf('>= 85');
    const firstWc = actions.findIndex((a) => a.gate === '>= 95');
    assert.ok(firstWc > lastUnlock);
    // worldClass(93) and craft would be here only if >= threshold; worldClass qualifies
    assert.ok(wc.some((a) => a.closes.startsWith('MPR worldClass')));
  });
});

describe('synthesizeHandoff — honesty (no fabrication)', () => {
  it('reports both lenses absent and emits zero actions', () => {
    const s = synthesizeHandoff({ repo: 'demo', pillars: [], signal: null });
    assert.equal(s.actions.length, 0);
    assert.equal(s.mprPresent, false);
    assert.equal(s.signalPresent, false);
  });

  it('renders a BLOCKED handoff when no witnesses exist', () => {
    const md = renderHandoff({ repo: 'demo', date: '2026-06-28', synth: synthesizeHandoff({ repo: 'demo', pillars: [], signal: null }) });
    assert.match(md, /Blocked/);
    assert.match(md, /MPR ✗/);
    assert.match(md, /SIGNAL ✗/);
  });

  it('renders MPR-only when SIGNAL is absent (degrades, does not fake it)', () => {
    const md = renderHandoff({ repo: 'demo', date: '2026-06-28', synth: synthesizeHandoff({ repo: 'demo', pillars: extractPillars(mprWitness), signal: null }) });
    assert.match(md, /MPR ✓/);
    assert.match(md, /SIGNAL ✗.*baseline-os/);
  });
});

describe('renderHandoff — work-order shape', () => {
  it('emits numbered actions with closes/gate/owner/evidence', () => {
    const md = renderHandoff({ repo: 'demo', date: '2026-06-28', synth: synthesizeHandoff({ repo: 'demo', pillars: extractPillars(mprWitness), signal: [{ dimension: 'Tooling', level: 1 }] }) });
    assert.match(md, /# Handoff — demo — 2026-06-28/);
    assert.match(md, /1\. \*\*Advance Tooling/);
    assert.match(md, /- gate: .* · owner: demo · evidence: /);
  });
});
