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
      acceptable: w.json?.ok !== false && w.json?.pass !== false && w.json?.clean !== false,
      failures: Array.isArray(w.json?.failures) ? w.json.failures : [],
      coverageRequired: w.json?.coverage?.required ?? null,
      coverageClaimed: w.json?.coverage?.claimed ?? null,
      registryCapabilityCount: w.json?.registry?.capabilityCount ?? null,
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
  const entries = repoState?.entries ?? [];
  const matches = (type, req) => type.includes(req);
  const missingAudits = requiredAudits.filter(
    (req) => !entries.some((e) => matches(e.type, req)),
  );

  // Conformance freshness is gated ONLY on the contract's required witnesses —
  // not on every -latest.json in the dir. Legacy/uncanonical witnesses are a
  // scrub/hygiene concern (aaas-scrub), never a conformance signal. Without this
  // the stale count is dominated by drift the contract never asked for.
  const requiredEntries = entries.filter((e) =>
    requiredAudits.some((req) => matches(e.type, req)),
  );
  const stale = requiredEntries.filter((e) => e.stale).length;
  const isProvisioningGap = (entry) => {
    if (!entry.type?.includes('aaas-honesty-gate') || entry.acceptable !== false) return false;
    const failures = entry.failures ?? [];
    const onlyRegistryProvisioning = failures.length > 0
      && failures.every((f) => ['coverageComplete', 'registryNonEmpty'].includes(f));
    return onlyRegistryProvisioning
      && ((entry.coverageRequired ?? 0) === 0 || (entry.registryCapabilityCount ?? 0) === 0);
  };
  const provisioningGaps = requiredEntries.filter(isProvisioningGap).map((entry) => ({
    type: entry.type,
    reason: 'empty capability registry; honesty coverage not assessable',
  }));
  const failedAudits = requiredEntries
    .filter((entry) => entry.acceptable === false && !isProvisioningGap(entry))
    .map((entry) => entry.type);
  const ok =
    missingFolders.length === 0 &&
    missingAudits.length === 0 &&
    stale === 0 &&
    failedAudits.length === 0 &&
    !!hasPin;
  const presentRequiredAudits = requiredAudits.length - missingAudits.length;
  const freshRequiredAudits = Math.max(0, requiredEntries.length - stale);
  const acceptableRequiredAudits = requiredEntries.filter(
    (entry) => entry.acceptable !== false || isProvisioningGap(entry),
  ).length;
  const benchmark =
    required.length +
    requiredAudits.length +
    requiredEntries.length +
    requiredEntries.length +
    1;
  const attained =
    (required.length - missingFolders.length) +
    presentRequiredAudits +
    freshRequiredAudits +
    acceptableRequiredAudits +
    (hasPin ? 1 : 0);
  const score100 = benchmark > 0 ? Math.round((attained / benchmark) * 100) : 100;
  return {
    repo: binding?.repo,
    profile,
    ok,
    score100,
    hasPin: !!hasPin,
    missingFolders,
    missingAudits,
    failedAudits,
    provisioningGaps,
    staleWitnesses: stale,
    legacyStale: repoState?.staleCount ?? 0,
  };
}
