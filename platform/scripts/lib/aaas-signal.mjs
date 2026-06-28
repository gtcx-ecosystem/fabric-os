/**
 * SIGNAL agentic-maturity lens — pure scoring (no fs).
 *
 * The second AaaS lens (parallel to MPR). Six dimensions — Systems Architecture,
 * Tooling, Process, Safeguards, Monitoring, Team & Ownership — each scored L0-L5
 * from ordered evidence checks. Scoring is PRODUCTION-ONLY (only evidence that
 * actually exists counts; "building toward it" scores as the current level) and the
 * overall maturity is the WEAKEST LINK (the lowest dimension), because an agentic
 * system is only as mature as its least-mature dimension.
 *
 * The CLI supplies, per dimension, an ordered list of L1..L5 checks with a boolean
 * pass; this module turns that into a level (with half-levels), evidence, gaps, and
 * the primary blocker (the next check to clear).
 */

export const DIMENSIONS = [
  'Systems Architecture', 'Tooling', 'Process', 'Safeguards', 'Monitoring', 'Team & Ownership',
];

/**
 * Score one dimension from ordered checks [{ level:1..5, label, pass }].
 * level = highest CONTIGUOUS passed level, +0.5 ("high") when there is non-contiguous
 * higher evidence (real but not yet enough to advance a full level).
 */
export function scoreDimension(name, checks) {
  const sorted = [...(checks ?? [])].sort((a, b) => a.level - b.level);
  let contiguous = 0;
  for (const c of sorted) {
    if (c.level === contiguous + 1 && c.pass) contiguous = c.level;
    else if (c.level <= contiguous) continue;
    else break;
  }
  const higher = sorted.some((c) => c.level > contiguous && c.pass);
  const level = contiguous < 5 && higher ? contiguous + 0.5 : contiguous;
  const evidence = sorted.filter((c) => c.pass).map((c) => `L${c.level}: ${c.label}`);
  const gaps = sorted.filter((c) => !c.pass).map((c) => `L${c.level}: ${c.label}`);
  const next = sorted.find((c) => c.level === contiguous + 1 && !c.pass);
  return {
    dimension: name,
    level,
    label: `L${Math.floor(level)}${level % 1 ? ' high' : ''}`,
    evidence,
    gaps,
    primaryBlocker: next ? `L${next.level}: ${next.label}` : null,
    gapToNext: level < 5 ? `advance to L${Math.floor(level) + 1}` : 'at ceiling',
  };
}

/**
 * Evaluate all six dimensions. dimChecks: { [dimension]: checks[] }.
 * overall = weakest-link (lowest dimension level).
 */
export function evaluateSignal({ repo, dimChecks, nowIso }) {
  const dimensions = DIMENSIONS.map((d) => scoreDimension(d, dimChecks?.[d] ?? []));
  const weakest = dimensions.reduce((min, d) => (d.level < min.level ? d : min), dimensions[0]);
  const overall = weakest.level;
  return {
    schema: 'gtcx://baseline-os/signal-maturity/v1',
    lens: 'SIGNAL',
    repo: repo ?? 'fabric-os',
    checkedAt: nowIso ?? null,
    overall,
    overallLabel: `L${Math.floor(overall)}${overall % 1 ? ' high' : ''}`,
    weakestLink: weakest.dimension,
    rule: 'weakest-link · production-only',
    // emitted in the shape the handoff synthesizer consumes (dimensions[].level)
    dimensions,
    primaryBlocker: weakest.primaryBlocker,
  };
}
