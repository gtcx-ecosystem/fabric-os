/**
 * AaaS handoff synthesis — pure functions (no fs).
 *
 * The keystone of the lifecycle: turn two assessment lenses into ONE prioritized
 * work-order. Priority is fixed by the framework design:
 *   1. SIGNAL weakest-link first — the dimension holding overall maturity down.
 *   2. then MPR threshold gaps by leverage — foundational tier first (it gates
 *      the transformational tier), each sorted by smallest gap to threshold
 *      (closest = quickest unlock).
 *
 * Honesty: if a lens witness is absent the synthesizer says so — it never
 * fabricates a score. SIGNAL is optional until baseline-os ships the evaluator
 * (XR-AGENT-CAPABILITY-OWNERSHIP-001); the handoff is MPR-only until then.
 */

export const FOUNDATIONAL_PILLARS = [
  'compliance', 'technicalExcellence', 'craft', 'worldClass', 'trustAndSafety',
];

/** Parse a SIGNAL level ("L2", "L2 high", 2) to a number; half-levels -> .5. */
export function parseLevel(raw) {
  if (typeof raw === 'number') return raw;
  if (typeof raw !== 'string') return null;
  const m = raw.match(/L?\s*(\d)/i);
  if (!m) return null;
  let n = Number(m[1]);
  if (/high/i.test(raw)) n += 0.5;
  return n;
}

/** Extract per-pillar scores from an MPR repo witness. Returns [] if absent. */
export function extractPillars(mprWitness) {
  const q = mprWitness?.quadrants ?? mprWitness?.multiPillar?.quadrants;
  if (!q || typeof q !== 'object') return [];
  return Object.entries(q).map(([pillar, v]) => {
    const cats = Object.values(v?.categories ?? {})
      .filter((c) => typeof c?.score100 === 'number')
      .sort((a, b) => a.score100 - b.score100);
    return {
      pillar,
      score: typeof v?.score100 === 'number' ? v.score100 : null,
      threshold: v?.unlockThreshold100 ?? 85,
      tier: FOUNDATIONAL_PILLARS.includes(pillar) ? 'foundational' : 'transformational',
      weakestCategory: cats[0]?.label ?? null,
    };
  });
}

/** Extract SIGNAL dimensions. Tolerant of object- or array-shaped witnesses. */
export function extractSignal(signalWitness) {
  if (!signalWitness) return null;
  const dims = signalWitness.dimensions;
  if (!dims) return null;
  const list = Array.isArray(dims)
    ? dims.map((d) => ({ dimension: d.dimension ?? d.name, level: parseLevel(d.level) }))
    : Object.entries(dims).map(([dimension, v]) => ({
        dimension,
        level: parseLevel(typeof v === 'object' ? v.level : v),
      }));
  return list.filter((d) => d.dimension && d.level != null);
}

/**
 * Synthesize the ordered handoff actions from both lenses.
 * Returns { actions, signalPresent, mprPresent }.
 */
export function synthesizeHandoff({ repo, pillars, signal, worldClassThreshold = 95 }) {
  const actions = [];
  const signalPresent = Array.isArray(signal) && signal.length > 0;
  const mprPresent = Array.isArray(pillars) && pillars.length > 0;

  // Phase 1 — SIGNAL weakest-link first (the binding constraint).
  if (signalPresent) {
    const minLevel = Math.min(...signal.map((d) => d.level));
    const weakest = signal.filter((d) => d.level === minLevel);
    for (const d of weakest) {
      const next = Math.floor(d.level) + 1;
      actions.push({
        lens: 'SIGNAL',
        action: `Advance ${d.dimension} from L${d.level} to L${next}`,
        closes: `SIGNAL ${d.dimension} L${d.level} (weakest-link — caps overall maturity)`,
        gate: `L${d.level} -> L${next}`,
        owner: repo,
        evidence: 'audit/evidence/signal-maturity-latest.json',
      });
    }
  }

  // Phase 2 — MPR threshold gaps by leverage.
  if (mprPresent) {
    const scored = pillars.filter((p) => typeof p.score === 'number');
    const belowUnlock = scored.filter((p) => p.score < p.threshold);
    const tierRank = (p) => (p.tier === 'foundational' ? 0 : 1);
    // foundational before transformational; within a tier, smallest gap first.
    belowUnlock.sort((a, b) =>
      tierRank(a) - tierRank(b) || (a.threshold - a.score) - (b.threshold - b.score));
    for (const p of belowUnlock) {
      const fix = p.weakestCategory ? ` (start with: ${p.weakestCategory})` : '';
      actions.push({
        lens: 'MPR',
        action: `Raise ${p.pillar} to >= ${p.threshold}${fix}`,
        closes: `MPR ${p.pillar} ${p.score}/100 (${p.tier}, gap ${p.threshold - p.score})`,
        gate: `>= ${p.threshold}`,
        owner: repo,
        evidence: 'audit/evidence/mpr-repo-latest.json',
      });
    }
    // world-class lifts (unlocked but < 95) — lowest priority.
    const belowWorldClass = scored.filter(
      (p) => p.score >= p.threshold && p.score < worldClassThreshold);
    belowWorldClass.sort((a, b) => b.score - a.score);
    for (const p of belowWorldClass) {
      actions.push({
        lens: 'MPR',
        action: `Lift ${p.pillar} toward world-class (>= ${worldClassThreshold})`,
        closes: `MPR ${p.pillar} ${p.score}/100 (unlocked; world-class gap ${worldClassThreshold - p.score})`,
        gate: `>= ${worldClassThreshold}`,
        owner: repo,
        evidence: 'audit/evidence/mpr-repo-latest.json',
      });
    }
  }

  return { actions, signalPresent, mprPresent };
}

/** Render the handoff as a dated work-order markdown document. */
export function renderHandoff({ repo, date, synth }) {
  const { actions, signalPresent, mprPresent } = synth;
  const lines = [];
  lines.push(`# Handoff — ${repo} — ${date}`);
  lines.push('');
  lines.push('_directive (what to do next). Synthesized by fabric-os AaaS from the MPR + SIGNAL lenses._');
  lines.push('_Priority: SIGNAL weakest-link first, then MPR threshold gaps (foundational tier first, smallest gap first)._');
  lines.push('');
  const lensNote = [
    mprPresent ? 'MPR ✓' : 'MPR ✗ (no mpr-repo-latest.json — run `aaas:audit --lens mpr` first)',
    signalPresent ? 'SIGNAL ✓' : 'SIGNAL ✗ (evaluator pending — baseline-os, XR-AGENT-CAPABILITY-OWNERSHIP-001)',
  ].join(' · ');
  lines.push(`**Lenses:** ${lensNote}`);
  lines.push('');
  if (!actions.length) {
    lines.push(mprPresent || signalPresent
      ? '**No open actions** — all assessed pillars/dimensions clear their gates. Re-verify on next cadence.'
      : '**Blocked** — no lens witnesses present. Run `aaas:audit` to produce an assessment, then re-run `aaas:handoff`.');
    lines.push('');
    return lines.join('\n');
  }
  lines.push('## Work-order');
  lines.push('');
  actions.forEach((a, i) => {
    lines.push(`${i + 1}. **${a.action}**`);
    lines.push(`   - closes: ${a.closes}`);
    lines.push(`   - gate: ${a.gate} · owner: ${a.owner} · evidence: ${a.evidence}`);
  });
  lines.push('');
  lines.push('_An item auto-closes when re-verification (`aaas:audit`) shows its gate cleared._');
  lines.push('');
  return lines.join('\n');
}
