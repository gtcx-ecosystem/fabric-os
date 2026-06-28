/**
 * AaaS adversarial honesty — pure functions (no fs).
 *
 * The L5 Safeguards addition (§4c.3). The structural honesty gate asks "is the
 * audit well-formed?"; this asks the harder question: "can each verdict survive a
 * hostile attempt to refute it?". For every scored verdict it runs refutation
 * challenges (inflation, fabrication, missing provenance, self-contradiction),
 * attaches a content-addressed provenance digest (tamper-evident "signature"), and
 * QUARANTINES any verdict that cannot survive — quarantined verdicts are not
 * published as passing. Default stance is skeptical: uncertain ⇒ refuted.
 */
import { createHash } from 'node:crypto';

/** Deterministic content-addressed provenance digest over a verdict's claim + evidence. */
export function provenanceDigest(verdict) {
  const canonical = JSON.stringify({
    id: verdict.id,
    score: verdict.score,
    threshold: verdict.threshold,
    items: (verdict.items ?? []).map((i) => [i.pass === true ? 1 : 0, i.score100 ?? null]),
    source: verdict.source ?? null,
  });
  return `sha256:${createHash('sha256').update(canonical).digest('hex').slice(0, 16)}`;
}

/** Fraction of leaf items that actually pass or carry a non-zero score (0..1). */
export function evidenceStrength(items) {
  const leaves = items ?? [];
  if (!leaves.length) return null;
  const supported = leaves.filter((i) => i.pass === true || (typeof i.score100 === 'number' && i.score100 > 0));
  return supported.length / leaves.length;
}

/**
 * Run refutation challenges against one verdict. Returns the list of challenges
 * that FIRED (i.e. refutations that stuck). Empty ⇒ the verdict survived.
 */
export function redTeamChallenges(verdict, opts = {}) {
  const inflationCeil = opts.inflationCeil ?? 85;
  const minEvidence = opts.minEvidence ?? 0.5;
  const floor = opts.floor ?? 60;
  const refuted = [];

  const strength = evidenceStrength(verdict.items);

  // Missing provenance — a verdict with no source chain cannot be trusted.
  if (!verdict.source) {
    refuted.push({ challenge: 'no-provenance', detail: 'verdict carries no source (gitHead/evaluatedAt)' });
  }

  // Fabrication — a non-trivial score with zero supporting evidence, not disclosed provisional.
  if (typeof verdict.score === 'number' && verdict.score > floor && strength === null && !verdict.provisional) {
    refuted.push({ challenge: 'fabricated', detail: `score ${verdict.score} with no leaf evidence` });
  }

  // Inflation — a high score whose own evidence is mostly failing/zero.
  if (typeof verdict.score === 'number' && verdict.score >= inflationCeil && strength !== null && strength < minEvidence) {
    refuted.push({
      challenge: 'inflated',
      detail: `score ${verdict.score} >= ${inflationCeil} but only ${Math.round(strength * 100)}% of evidence supports it`,
    });
  }

  // Self-contradiction — claims to clear its threshold while a probe says otherwise.
  if (verdict.contradictedBy) {
    refuted.push({ challenge: 'self-contradiction', detail: `contradicted by ${verdict.contradictedBy}` });
  }

  return refuted;
}

/** Red-team a single verdict → { id, score, survives, quarantined, refutedBy, provenance }. */
export function redTeamVerdict(verdict, opts = {}) {
  const refutedBy = redTeamChallenges(verdict, opts);
  const survives = refutedBy.length === 0;
  return {
    id: verdict.id,
    score: verdict.score ?? null,
    threshold: verdict.threshold ?? null,
    provisional: !!verdict.provisional,
    survives,
    quarantined: !survives,
    refutedBy,
    provenance: provenanceDigest(verdict),
  };
}

/** Extract per-pillar verdicts (with leaf evidence + provenance source) from an MPR witness. */
export function extractVerdicts(mprWitness) {
  const q = mprWitness?.quadrants ?? mprWitness?.multiPillar?.quadrants;
  if (!q || typeof q !== 'object') return [];
  const source = mprWitness?.gitHead || mprWitness?.evaluatedAt
    ? { gitHead: mprWitness.gitHead ?? null, evaluatedAt: mprWitness.evaluatedAt ?? null }
    : null;
  return Object.entries(q).map(([id, v]) => {
    const items = Object.values(v?.categories ?? {}).flatMap((c) => c?.items ?? []);
    return {
      id,
      score: typeof v?.score100 === 'number' ? v.score100 : null,
      threshold: v?.unlockThreshold100 ?? 85,
      provisional: !!v?.provisional,
      items,
      source,
    };
  });
}

/** Evaluate all verdicts adversarially → witness partitioning upheld vs quarantined. */
export function evaluateAdversarial({ verdicts, opts = {} }) {
  const judged = (verdicts ?? []).map((v) => redTeamVerdict(v, opts));
  const quarantined = judged.filter((j) => j.quarantined);
  const upheld = judged.filter((j) => j.survives);
  return {
    schema: 'gtcx://fabric-os/aaas-adversarial-honesty/v1',
    total: judged.length,
    upheldCount: upheld.length,
    quarantinedCount: quarantined.length,
    quarantined,
    upheld,
    // The gate FAILS if any verdict had to be quarantined — an inflated/fabricated
    // verdict in the set means the published audit cannot be trusted as-is.
    ok: quarantined.length === 0,
  };
}
