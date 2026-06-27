#!/usr/bin/env node
/**
 * AAAS — Audit-as-a-Service honesty gate.
 *
 * Forces every audit to earn its score against the canon capability registry,
 * rejecting the "scored the map, not the territory" failure mode. Consumes the
 * canon registry (coverage denominator) + five-core composite witness; it owns
 * no scoring engine of its own.
 *
 * Usage: node aaas-honesty-gate.mjs [--write] [--json] [--strict-registry]
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERACITY = new Set(['real', 'fixture', 'fabricated']);

function flattenCapabilities(registry) {
  const c = registry?.composition ?? {};
  const kinds = ['features', 'services', 'infra', 'experience', 'commercial'];
  return kinds.flatMap((kind) =>
    (c[kind] ?? []).map((item) => ({ id: item.id, kind, status: item.status ?? null })),
  );
}

/**
 * Pure honesty evaluation — no filesystem. Inputs are plain objects so the gate
 * is fully testable.
 */
export function evaluateHonesty({ registry, coverage, composite = {}, opts = {} }) {
  const contradictionCeil = opts.contradictionCeil ?? 85;
  const floor = opts.floor ?? 60;

  const capabilities = flattenCapabilities(registry);
  const entries = coverage?.entries ?? [];
  const covered = new Set(entries.map((e) => e.capabilityId));

  const uncovered = capabilities.map((c) => c.id).filter((id) => !covered.has(id));
  const coverageComplete = {
    ok: capabilities.length > 0 && uncovered.length === 0,
    required: capabilities.length,
    claimed: entries.length,
    uncovered,
  };

  const landingOnly = entries
    .filter((e) => !e.deepestRouteChecked || e.deepestRouteChecked === e.entryRoute)
    .map((e) => e.capabilityId);
  const depthVerified = { ok: landingOnly.length === 0, landingOnly };

  const undisclosed = entries
    .filter((e) => e.veracity !== 'real' && e.disclosed !== true)
    .map((e) => e.capabilityId);
  const badVeracity = entries
    .filter((e) => e.veracity && !VERACITY.has(e.veracity))
    .map((e) => e.capabilityId);
  const veracityDisclosed = {
    ok: undisclosed.length === 0 && badVeracity.length === 0,
    undisclosed,
    invalidVeracity: badVeracity,
  };

  const composite100 = composite?.composite100 ?? null;
  const capsFired = composite?.capsFired ?? [];
  const brokenBelowFloor = entries
    .filter((e) => typeof e.score === 'number' && e.score < floor)
    .map((e) => e.capabilityId);
  const contradiction =
    composite100 != null &&
    composite100 >= contradictionCeil &&
    brokenBelowFloor.length > 0 &&
    capsFired.length === 0;
  const contradictionReconciled = {
    ok: !contradiction,
    composite100,
    contradictionCeil,
    floor,
    brokenBelowFloor,
    capsFired: capsFired.length,
  };

  // A high-scoring core whose own metrics are zero/missing/low-confidence is a
  // laundered ("hollow") composite — the score the gate was built to reject.
  // Reads composite.cores[].metrics, which contradictionReconciled cannot see.
  const hollowCeil = opts.hollowCeil ?? 85;
  const cores = composite?.cores ?? {};
  const hollowCores = Object.entries(cores)
    .filter(([, core]) => {
      const metrics = Object.values(core?.metrics ?? {});
      if (!metrics.length) return false;
      const hasHollowMetric = metrics.some(
        (m) => m.score100 === 0 || m.confidence === 'D' || m.source === 'missing',
      );
      return (core?.score100 ?? 0) >= hollowCeil && hasHollowMetric;
    })
    .map(([id]) => id);
  const noHollowCores = { ok: hollowCores.length === 0, hollowCeil, hollowCores };

  const registryNonEmpty = { ok: capabilities.length > 0, capabilityCount: capabilities.length };

  const authoritative = registry?.status !== 'draft';
  // Claiming full coverage of an admittedly-draft registry is itself "scoring the
  // map" — fail it only under --strict-registry; otherwise report and continue.
  const registryAuthoritative = {
    ok: authoritative || !(opts.strictRegistry && coverageComplete.ok),
    authoritative,
    status: registry?.status ?? null,
  };

  const gates = {
    coverageComplete,
    depthVerified,
    veracityDisclosed,
    contradictionReconciled,
    noHollowCores,
    registryNonEmpty,
    registryAuthoritative,
  };

  const scored = entries.filter((e) => typeof e.score === 'number');
  const worst = [...scored].sort((a, b) => a.score - b.score)[0];
  const worstVerifiedFinding = worst?.worstFinding ?? null;

  const failures = Object.entries(gates)
    .filter(([, g]) => g.ok === false)
    .map(([k]) => k);
  const ok = failures.length === 0;

  const witness = {
    schema: 'gtcx://fabric-os/aaas-honesty-gate/v1',
    worstVerifiedFinding,
    repo: registry?.productId ?? 'fabric-os',
    owner: 'fabric-os',
    checkedAt: opts.now ?? new Date().toISOString(),
    registry: {
      status: registry?.status ?? null,
      capabilityCount: capabilities.length,
      authoritative,
    },
    coverage: {
      required: capabilities.length,
      claimed: entries.length,
      coveragePct: capabilities.length
        ? Math.round(((capabilities.length - uncovered.length) / capabilities.length) * 100)
        : 0,
    },
    gates,
    failures,
    ok,
  };

  return { witness, ok };
}

function loadJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

function resolveFirst(root, rels) {
  for (const rel of rels) {
    const path = join(root, rel);
    if (existsSync(path)) return path;
  }
  return join(root, rels[0]);
}

function main() {
  const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
  const WRITE = process.argv.includes('--write');
  const JSON_OUT = process.argv.includes('--json');
  const strictRegistry = process.argv.includes('--strict-registry');

  const registryPath = resolveFirst(ROOT, ['machine/canon/registry.json', 'pm/canon/registry.json']);
  const coveragePath = join(ROOT, 'audit/evidence/aaas-honesty-coverage.json');
  const compositePath = join(ROOT, 'audit/evidence/composite-audit-latest.json');
  const OUT = join(ROOT, 'audit/evidence/aaas-honesty-gate-latest.json');

  const registry = loadJson(registryPath) ?? { status: 'missing', composition: {} };
  const coverage = loadJson(coveragePath) ?? { entries: [] };
  const composite = loadJson(compositePath) ?? {};

  const { witness, ok } = evaluateHonesty({
    registry,
    coverage,
    composite,
    opts: { strictRegistry },
  });

  if (WRITE) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }

  if (JSON_OUT) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    if (!existsSync(coveragePath)) {
      console.log(`MISSING audit/evidence/aaas-honesty-coverage.json — no coverage claimed`);
    }
    console.log(
      `worst verified: ${witness.worstVerifiedFinding ?? 'n/a'}  ·  coverage ${witness.coverage.coveragePct}% (${witness.coverage.claimed}/${witness.coverage.required})`,
    );
    for (const [k, g] of Object.entries(witness.gates)) {
      console.log(`${g.ok ? 'OK  ' : 'FAIL'} ${k}`);
    }
    console.log(`\n${ok ? 'PASS' : 'FAIL'} — AAAS honesty gate`);
    if (WRITE) console.log(`witness: ${OUT}`);
  }

  process.exit(ok ? 0 : 1);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
