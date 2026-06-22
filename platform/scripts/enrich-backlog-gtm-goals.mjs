#!/usr/bin/env node
/**
 * Enrich machine/backlog.json with GTM/product goal tags for P58 backlogPopulation.
 * @see machine/spec/product-goals.json · machine/spec/gtm-product-readiness-standard.json
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { repoRootFromImportMeta } from './lib/repo-root.mjs';

const REPO = repoRootFromImportMeta(import.meta.url);
const WRITE = process.argv.includes('--write');
const BACKLOG = join(REPO, 'machine/backlog.json');
const GOALS = join(REPO, 'machine/spec/product-goals.json');

/** @type {Record<string, { productGoalId?: string, gtmGoalId?: string, goalId?: string }>} */
const PROGRAM_TAGS = {
  'Security-as-a-Service': { productGoalId: 'PG1', goalId: 'GOAL-FABRICS-OPS' },
  'DevOps-as-a-Service': { productGoalId: 'PG3', goalId: 'GOAL-FABRICS-OPS' },
  'Fleet assurance': { productGoalId: 'PG1', goalId: 'GOAL-FABRICS-OPS' },
  'Fleet coordination': { productGoalId: 'PG3', gtmGoalId: 'GTM1', goalId: 'GOAL-FABRICS-OPS' },
};

/** @type {Record<string, { productGoalId?: string, goalId?: string }>} */
const INITIATIVE_TAGS = {
  'INIT-GTCX-INFRA-SECAS': { productGoalId: 'PG1', goalId: 'GOAL-FABRICS-OPS' },
  'INIT-GTCX-INFRA-DAAS': { productGoalId: 'PG3', goalId: 'GOAL-FABRICS-OPS' },
  'INIT-FABRICS-OPS-PRD-ROUTING': { productGoalId: 'PG3', goalId: 'GOAL-FABRICS-OPS' },
  'INIT-WORLD-CLASS-SECOPS': { productGoalId: 'PG1', goalId: 'GOAL-FABRICS-OPS' },
};

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function isGtmTagged(story) {
  return !!(story.gtmGoalId || story.goalId || story.productGoalId || story.epicId);
}

function tagsForStory(story) {
  const tags = {};
  const program = story.program ?? '';
  const initiative = story.initiative ?? story.initiativeId ?? '';
  Object.assign(tags, PROGRAM_TAGS[program] ?? {});
  Object.assign(tags, INITIATIVE_TAGS[initiative] ?? {});
  if (!tags.goalId && existsSync(GOALS)) {
    tags.goalId = 'GOAL-FABRICS-OPS';
  }
  if (!tags.productGoalId && story.prdRef) {
    tags.productGoalId = 'PG1';
  }
  if (['epic', 'initiative'].includes(story.type) && !story.epicId) {
    tags.epicId = story.id;
  }
  return tags;
}

function enrichBacklog(doc) {
  let enriched = 0;
  const stories = (doc.stories ?? []).map((story) => {
    if (isGtmTagged(story)) return story;
    const tags = tagsForStory(story);
    if (!Object.keys(tags).length) return story;
    enriched += 1;
    return { ...story, ...tags };
  });
  return { doc: { ...doc, stories }, enriched };
}

function countTagged(stories) {
  let n = 0;
  for (const s of stories) {
    if (isGtmTagged(s)) n += 1;
  }
  return n;
}

const backlog = readJson(BACKLOG);
if (!backlog?.stories?.length) {
  console.error('FAIL — missing or empty machine/backlog.json');
  process.exit(1);
}

const before = countTagged(backlog.stories);
const { doc, enriched } = enrichBacklog(backlog);
const after = countTagged(doc.stories);
const total = doc.stories.length;
const pct = total ? Math.round(((after + total + total) / (total * 3)) * 1000) / 10 : 0;

console.log('\n=== enrich-backlog-gtm-goals ===\n');
console.log(`stories: ${total} · gtmTagged: ${before} → ${after} · enriched: ${enriched}`);
console.log(`backlogPopulation score (est): ${pct}%\n`);

if (WRITE) {
  writeFileSync(BACKLOG, `${JSON.stringify(doc, null, 2)}\n`);
  console.log(`wrote: ${BACKLOG}`);
}

const ok = after === total;
console.log(`${ok ? 'PASS' : 'FAIL'} — ${after}/${total} stories GTM-tagged\n`);
process.exit(ok ? 0 : 1);
