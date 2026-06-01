#!/usr/bin/env node
/**
 * Canonical audit score calculator — single source for latest.json headline scores.
 *
 * Usage:
 *   node tools/scripts/compute-audit-scores.mjs
 *   node tools/scripts/compute-audit-scores.mjs --write
 *   node tools/scripts/compute-audit-scores.mjs --markdown
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const RUBRIC = path.join(ROOT, 'docs/audit/scoring-rubric.json');
const LEDGER = path.join(ROOT, 'docs/audit/score-evidence-ledger.json');
const CI_SNAPSHOT = path.join(ROOT, 'docs/audit/ci-snapshot.json');
const LATEST = path.join(ROOT, 'docs/audit/latest.json');

function round1(n) {
  return Math.round(n * 10) / 10;
}

function loadJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function gitHead() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function compute() {
  const rubric = loadJson(RUBRIC);
  const ledger = loadJson(LEDGER);
  const ci = loadJson(CI_SNAPSHOT);

  const ledgerById = new Map(ledger.dimensions.map((d) => [d.id, d]));

  /** @type {Record<string, { base: number, adjusted: number, ledgerId: string, weight: number }>} */
  const dimensions = {};

  for (const dim of rubric.dimensions) {
    const entry = ledgerById.get(dim.ledgerId);
    if (!entry) {
      throw new Error(`Ledger missing dimension ${dim.ledgerId} for ${dim.id}`);
    }
    let score = entry.currentScore;
    for (const pen of rubric.ciPenalties) {
      if (pen.when === 'mainCiFormatFail' && ci.mainCiFormatFail) {
        if (pen.dimension === dim.id) score += pen.delta;
      }
      if (pen.when === 'mainCiJobFail' && ci.mainCiJobFail) {
        if (pen.dimension === dim.id) score += pen.delta;
      }
    }
    score = Math.max(0, Math.min(10, score));
    dimensions[dim.id] = {
      base: entry.currentScore,
      adjusted: round1(score),
      ledgerId: dim.ledgerId,
      weight: dim.weight,
    };
  }

  let internalReadiness = 0;
  for (const dim of rubric.dimensions) {
    internalReadiness += dimensions[dim.id].adjusted * dim.weight;
  }
  internalReadiness = round1(internalReadiness);

  let externalGap = 0;
  const openExternal = [];
  for (const ext of rubric.externalAssurancePenalties) {
    if (ext.status === 'open') {
      externalGap += ext.penalty;
      openExternal.push(ext.id);
    }
  }
  externalGap = Math.min(2.0, round1(externalGap));
  const certifiedReadiness = round1(Math.max(0, internalReadiness - externalGap));

  return {
    rubricId: rubric.rubricId,
    computedAt: new Date().toISOString(),
    head: gitHead() ?? ci.head,
    internalReadiness,
    certifiedReadiness,
    externalAssuranceGap: externalGap,
    openExternalAssurance: openExternal,
    dimensions,
    ciSnapshot: {
      mainCiFormatFail: ci.mainCiFormatFail,
      mainCiJobFail: ci.mainCiJobFail,
      localValidateAllPass: ci.localValidateAllPass,
      localValidateAllGateCount: ci.localValidateAllGateCount,
    },
  };
}

function scorecardMarkdown(result) {
  const lines = [
    '## Canonical Scorecard (do not cite other X/10 figures)',
    '',
    `| Metric | Score | How computed |`,
    `|--------|-------|----------------|`,
    `| **Internal Readiness (IR)** | **${result.internalReadiness}/10** | Weighted sum of 7 dimensions (see \`docs/audit/scoring-rubric.json\`) |`,
    `| **Certified Readiness (CR)** | **${result.certifiedReadiness}/10** | IR − ${result.externalAssuranceGap} external gap (${result.openExternalAssurance.join(', ') || 'none'}) |`,
    '',
    '### Dimension breakdown',
    '',
    '| Dimension | Weight | Ledger base | After CI penalty |',
    '|-----------|--------|-------------|------------------|',
  ];
  for (const [id, d] of Object.entries(result.dimensions)) {
    lines.push(
      `| ${id} | ${(d.weight * 100).toFixed(0)}% | ${d.base} | **${d.adjusted}** |`
    );
  }
  lines.push(
    '',
    `Recompute: \`node tools/scripts/compute-audit-scores.mjs --markdown\``,
    ''
  );
  return lines.join('\n');
}

function main() {
  const write = process.argv.includes('--write');
  const markdown = process.argv.includes('--markdown');
  const result = compute();

  if (markdown) {
    console.log(scorecardMarkdown(result));
    return;
  }

  console.log(JSON.stringify(result, null, 2));

  if (write) {
    const prev = loadJson(LATEST);
    const next = {
      ...prev,
      auditDate: result.computedAt.slice(0, 10),
      verifiedAt: result.computedAt,
      head: result.head?.slice(0, 7) ?? prev.head,
      rubricId: result.rubricId,
      scores: {
        internalReadiness: result.internalReadiness,
        certifiedReadiness: result.certifiedReadiness,
        composite: result.certifiedReadiness,
        externalAssuranceGap: result.externalAssuranceGap,
        codeQuality: result.dimensions.codeQuality.adjusted,
        repoHygiene: result.dimensions.repoHygiene.adjusted,
        security: result.dimensions.security.adjusted,
        globalSouthResilience: result.dimensions.globalSouthResilience.adjusted,
        ecosystemIntegration: result.dimensions.ecosystemIntegration.adjusted,
        agenticMaturity: result.dimensions.agenticMaturity.adjusted,
        enterpriseReadiness: result.dimensions.enterpriseReadiness.adjusted,
      },
      scoreReconciliation:
        'Canonical IR/CR from tools/scripts/compute-audit-scores.mjs + docs/audit/scoring-rubric.json. Do not cite retired scores (9.0 core-weighted, 8.8 partnership, self-claim 8.5/7.5). See docs/audit/AUDIT-RECONCILIATION.md.',
      openExternalAssurance: result.openExternalAssurance,
      ciSnapshot: result.ciSnapshot,
    };
    writeFileSync(LATEST, `${JSON.stringify(next, null, 2)}\n`);
    console.error(`Wrote ${LATEST}`);
  }
}

main();
