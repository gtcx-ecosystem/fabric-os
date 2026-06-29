#!/usr/bin/env node
/**
 * AaaS adversarial honesty — validation suite.
 * Guards the L5 Safeguards behavior: refute inflated/fabricated/unprovenanced
 * verdicts, sign survivors with a content-addressed digest, quarantine the rest.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  provenanceDigest, evidenceStrength, redTeamChallenges, redTeamVerdict,
  extractVerdicts, evaluateAdversarial,
} from '../lib/aaas-adversarial-honesty.mjs';

const src = { gitHead: 'abc123', evaluatedAt: '2026-06-28T00:00:00Z' };

describe('provenanceDigest', () => {
  it('is deterministic and changes when the claim changes (tamper-evident)', () => {
    const a = provenanceDigest({ id: 'compliance', score: 90, threshold: 85, items: [], source: src });
    const b = provenanceDigest({ id: 'compliance', score: 90, threshold: 85, items: [], source: src });
    const c = provenanceDigest({ id: 'compliance', score: 91, threshold: 85, items: [], source: src });
    assert.equal(a, b);
    assert.notEqual(a, c);
    assert.match(a, /^sha256:[0-9a-f]{16}$/);
  });
});

describe('evidenceStrength', () => {
  it('is the supported fraction, null when there is no evidence', () => {
    assert.equal(evidenceStrength([{ pass: true }, { pass: false }, { score100: 0 }, { score100: 80 }]), 0.5);
    assert.equal(evidenceStrength([]), null);
  });
});

describe('redTeamChallenges', () => {
  it('refutes an INFLATED verdict (high score, weak evidence)', () => {
    const r = redTeamChallenges({
      id: 'craft', score: 90, threshold: 85, source: src,
      items: [{ score100: 0 }, { score100: 0 }, { score100: 100 }], // 33% support
    });
    assert.ok(r.some((c) => c.challenge === 'inflated'));
  });

  it('refutes a FABRICATED verdict (score, zero evidence AND no provenance)', () => {
    const r = redTeamChallenges({ id: 'x', score: 88, threshold: 85, items: [], source: null });
    assert.ok(r.some((c) => c.challenge === 'fabricated'));
  });

  it('does NOT call a SOURCED pillar-level aggregate fabricated (the false-positive fix)', () => {
    // score with no leaf items but WITH provenance = legitimate MPR aggregate, not fabricated
    const r = redTeamChallenges({ id: 'trustAndSafety', score: 77, threshold: 85, items: [], source: src });
    assert.ok(!r.some((c) => c.challenge === 'fabricated'));
    assert.deepEqual(r, []); // upheld
  });

  it('does NOT fabricate-refute a disclosed provisional verdict', () => {
    const r = redTeamChallenges({ id: 'x', score: 88, threshold: 85, items: [], source: src, provisional: true });
    assert.ok(!r.some((c) => c.challenge === 'fabricated'));
  });

  it('refutes a verdict with NO provenance', () => {
    const r = redTeamChallenges({ id: 'x', score: 90, threshold: 85, items: [{ pass: true }], source: null });
    assert.ok(r.some((c) => c.challenge === 'no-provenance'));
  });

  it('refutes a self-contradicted verdict', () => {
    const r = redTeamChallenges({ id: 'x', score: 90, threshold: 85, items: [{ pass: true }], source: src, contradictedBy: 'probe-y' });
    assert.ok(r.some((c) => c.challenge === 'self-contradiction'));
  });

  it('upholds a well-evidenced, provenanced verdict', () => {
    const r = redTeamChallenges({
      id: 'trustAndSafety', score: 90, threshold: 85, source: src,
      items: [{ pass: true }, { pass: true }, { score100: 80 }],
    });
    assert.deepEqual(r, []);
  });
});

describe('redTeamVerdict', () => {
  it('quarantines a refuted verdict and still stamps provenance', () => {
    const v = redTeamVerdict({ id: 'craft', score: 95, threshold: 85, items: [{ score100: 0 }], source: src });
    assert.equal(v.survives, false);
    assert.equal(v.quarantined, true);
    assert.match(v.provenance, /^sha256:/);
  });
});

describe('extractVerdicts', () => {
  it('pulls pillars + leaf items + provenance from an MPR witness', () => {
    const mpr = {
      gitHead: 'deadbeef', evaluatedAt: '2026-06-28T00:00:00Z',
      quadrants: {
        compliance: {
          score100: 69, unlockThreshold100: 85, provisional: true,
          categories: { a: { items: [{ pass: false, score100: 0 }, { pass: true, score100: 100 }] } },
        },
      },
    };
    const v = extractVerdicts(mpr);
    assert.equal(v.length, 1);
    assert.equal(v[0].id, 'compliance');
    assert.equal(v[0].items.length, 2);
    assert.equal(v[0].source.gitHead, 'deadbeef');
    assert.equal(extractVerdicts(null).length, 0);
  });
});

describe('evaluateAdversarial', () => {
  it('partitions upheld vs quarantined and fails when any is quarantined', () => {
    const verdicts = [
      { id: 'ok', score: 88, threshold: 85, source: src, items: [{ pass: true }, { pass: true }] },
      { id: 'inflated', score: 95, threshold: 85, source: src, items: [{ score100: 0 }, { score100: 0 }] },
    ];
    const w = evaluateAdversarial({ verdicts });
    assert.equal(w.total, 2);
    assert.equal(w.upheldCount, 1);
    assert.equal(w.quarantinedCount, 1);
    assert.equal(w.quarantined[0].id, 'inflated');
    assert.equal(w.ok, false);
  });

  it('passes clean when every verdict survives', () => {
    const w = evaluateAdversarial({ verdicts: [{ id: 'a', score: 90, threshold: 85, source: src, items: [{ pass: true }] }] });
    assert.equal(w.ok, true);
    assert.equal(w.upheld[0].provenance.startsWith('sha256:'), true);
  });

  it('classifies sourced aggregates as UNASSESSABLE, not verified (coverage honesty, E3)', () => {
    // mirrors real MPR pillars: sourced, scored, no leaf decomposition
    const w = evaluateAdversarial({ verdicts: [
      { id: 'trustAndSafety', score: 77, threshold: 85, source: src, items: [] },
      { id: 'craft', score: 70, threshold: 85, source: src, items: [] },
      { id: 'verified-one', score: 90, threshold: 85, source: src, items: [{ pass: true }] },
    ] });
    assert.equal(w.ok, true); // nothing refuted
    assert.equal(w.quarantinedCount, 0);
    assert.equal(w.verifiedCount, 1); // only the one with real evidence is actively verified
    assert.equal(w.unassessableCount, 2); // aggregates are not counted as verified
    assert.deepEqual(w.depthUnverified.sort(), ['craft', 'trustAndSafety']);
  });
});
