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

  // Fabrication — a non-trivial score with NO leaf evidence AND no provenance source:
  // genuinely from nowhere. A pillar-level aggregate that has a source but no leaf
  // decomposition is LEGITIMATE (the engine is the authority for the score) — that is a
  // depth note (see redTeamVerdict), never a quarantine. Requiring !source here is the
  // fix for the prior false positive that wrongly quarantined every sourced aggregate.
  if (typeof verdict.score === 'number' && verdict.score > floor && strength === null
      && !verdict.provisional && !verdict.source) {
    refuted.push({ challenge: 'fabricated', detail: `score ${verdict.score} with no evidence and no provenance` });
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

/** Non-refuting observations about a verdict (do NOT quarantine). */
export function depthNotes(verdict) {
  const notes = [];
  const strength = evidenceStrength(verdict.items);
  if (strength === null && verdict.source && typeof verdict.score === 'number' && verdict.score > 0) {
    notes.push({ note: 'depth-unverified', detail: 'pillar-level aggregate (no leaf decomposition) — sourced, lower confidence' });
  }
  return notes;
}

/** Red-team a single verdict → { id, score, survives, quarantined, refutedBy, notes, provenance }. */
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
    notes: depthNotes(verdict),
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
  const survived = judged.filter((j) => j.survives);
  // Honesty (audit finding E3): a verdict that survived but had NO leaf evidence was
  // not actively VERIFIED — there was simply nothing to challenge. Reporting it as
  // "upheld" overstates assurance. Split the survivors: actively-verified (had evidence
  // to attack and withstood it) vs unassessable (aggregate-only — gate has no signal).
  const isUnassessable = (j) => j.notes?.some((n) => n.note === 'depth-unverified');
  const upheld = survived.filter((j) => !isUnassessable(j));
  const unassessable = survived.filter(isUnassessable);
  return {
    schema: 'gtcx://fabric-os/aaas-adversarial-honesty/v1',
    total: judged.length,
    verifiedCount: upheld.length, // actively verified (had evidence, withstood attack)
    unassessableCount: unassessable.length, // aggregate-only, gate has no signal
    quarantinedCount: quarantined.length, // refuted
    upheldCount: upheld.length, // back-compat alias for verifiedCount
    depthUnverified: unassessable.map((j) => j.id),
    quarantined,
    upheld,
    unassessable,
    // FAILS only on a genuine quarantine. Coverage honesty: when unassessableCount is
    // high, "ok" means "nothing refuted", NOT "everything verified" — read both numbers.
    ok: quarantined.length === 0,
  };
}
