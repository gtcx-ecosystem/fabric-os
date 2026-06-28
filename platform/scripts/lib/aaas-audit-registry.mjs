/**
 * AaaS audit-registry core — pure functions (no fs) for the fabric-os
 * centralized audit/report management contract.
 *
 * Three concerns kept distinct: witness metadata extraction, per-repo audit
 * state summary, and contract conformance (obligations vs actual state).
 */

const DAY = 86_400_000;
const DATE_FIELDS = ['checkedAt', 'updated', 'evaluatedAt', 'date', 'generatedAt'];
const SCORE_FIELDS = ['composite100', 'fullComposite100', 'score100', 'coveragePct'];

export function extractDateMs(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const f of DATE_FIELDS) {
    if (obj[f]) {
      const ms = Date.parse(obj[f]);
      if (!Number.isNaN(ms)) return ms;
    }
  }
  return null;
}

export function extractScore(obj) {
  if (!obj || typeof obj !== 'object') return null;
  for (const f of SCORE_FIELDS) {
    if (typeof obj[f] === 'number') return obj[f];
  }
  // common nested shape (multi-pillar witnesses)
  const mp = obj.multiPillar;
  if (mp && typeof mp.fullComposite100 === 'number') return mp.fullComposite100;
  return null;
}

export function witnessTypeFromFile(name) {
  return name.replace(/-latest\.json$/, '').replace(/\.json$/, '');
}

/**
 * Summarize one repo's audit state from its evidence witnesses.
 * witnesses: [{ file, json }]. Returns types present + per-witness freshness.
 */
export function summarizeRepoAudit({ repo, witnesses, nowMs, cadenceDays }) {
  const maxAgeMs = cadenceDays * DAY;
  const entries = (witnesses ?? []).map((w) => {
    const dateMs = extractDateMs(w.json);
    const ageDays = dateMs == null ? null : Math.round((nowMs - dateMs) / DAY);
    return {
      type: witnessTypeFromFile(w.file),
      schema: w.json?.schema ?? null,
      dateMs,
      ageDays,
      score: extractScore(w.json),
      stale: dateMs == null || nowMs - dateMs > maxAgeMs,
    };
  });
  return {
    repo,
    count: entries.length,
    types: entries.map((e) => e.type),
    staleCount: entries.filter((e) => e.stale).length,
    entries,
  };
}

/**
 * Conformance of one repo against its contract obligations.
 * presentFolders: required-folder paths that exist; repoState: summarizeRepoAudit output.
 */
export function evaluateConformance({ binding, contract, presentFolders, repoState, hasPin }) {
  const required = contract?.obligations?.repo?.requiredFolders ?? [];
  const missingFolders = required.filter((f) => !(presentFolders ?? []).includes(f));

  const profile = binding?.auditProfile;
  const requiredAudits = contract?.auditProfiles?.[profile] ?? [];
  const presentTypes = new Set(repoState?.types ?? []);
  const missingAudits = requiredAudits.filter(
    (t) => ![...presentTypes].some((pt) => pt.includes(t)),
  );

  const stale = repoState?.staleCount ?? 0;
  const ok = missingFolders.length === 0 && missingAudits.length === 0 && stale === 0 && !!hasPin;
  return {
    repo: binding?.repo,
    profile,
    ok,
    hasPin: !!hasPin,
    missingFolders,
    missingAudits,
    staleWitnesses: stale,
  };
}
