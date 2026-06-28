#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');

function arg(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const goldenPath = arg('--golden', 'config/baseline/rag-eval-golden.json');
const corpusPath = arg('--mock', 'config/baseline/rag-eval-mock-corpus.json');
const outPath = arg('--out', 'audit/evidence/rag-eval-latest.json');

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

const issues = [];
if (!existsSync(join(ROOT, goldenPath))) issues.push(`missing golden ${goldenPath}`);
if (!existsSync(join(ROOT, corpusPath))) issues.push(`missing mock corpus ${corpusPath}`);

const golden = issues.length === 0 ? readJson(goldenPath) : { queries: [] };
const corpus = issues.length === 0 ? readJson(corpusPath) : { documents: [] };
const documents = Array.isArray(corpus) ? corpus : corpus.documents ?? [];
const sources = new Set(documents.map((doc) => doc.source));

const queryResults = (golden.queries ?? []).map((query) => {
  const expectedSources = query.expectedSources ?? [];
  const matchedSources = expectedSources.filter((source) => sources.has(source));
  const recall = expectedSources.length === 0 ? 0 : matchedSources.length / expectedSources.length;
  return { id: query.id, expectedSources, matchedSources, recall, ok: recall > 0 };
});

if (queryResults.length === 0) issues.push('golden set has no queries');

const averageRecall =
  queryResults.length === 0 ? 0 : queryResults.reduce((sum, result) => sum + result.recall, 0) / queryResults.length;
const ok = issues.length === 0 && queryResults.every((result) => result.ok) && averageRecall >= 0.5;

const report = {
  schema: 'gtcx://fabric-os/rag-eval/v1',
  generatedAt: new Date().toISOString(),
  repo: 'fabric-os',
  ok,
  golden: goldenPath,
  mockCorpus: corpusPath,
  queryCount: queryResults.length,
  averageRecall,
  threshold: 0.5,
  issues,
  queryResults,
};

const output = join(ROOT, outPath);
mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
process.exit(ok ? 0 : 1);
