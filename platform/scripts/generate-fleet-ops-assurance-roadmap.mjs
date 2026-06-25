#!/usr/bin/env node
/**
 * Generate audit/product-management/fleet-ops-assurance-execution-roadmap.md
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/product-management/fleet-ops-assurance-execution-roadmap.md');
const ROADMAP = join(ROOT, 'machine/fleet-ops-assurance-roadmap.json');
const STORIES = join(ROOT, 'machine/fleet-ops-assurance-stories.json');
const FRICTION = join(ROOT, 'machine/fleet-ops-friction-register.json');

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function renderStory(story) {
  const lines = [];
  lines.push(`### ${story.id}: ${story.title}`);
  lines.push('');
  if (story.lane) lines.push(`**Lane:** \`${story.lane}\` · **blocksGtmStage:** ${story.blocksGtmStage ?? false}`);
  lines.push('');
  lines.push('**Acceptance**');
  lines.push('');
  lines.push('```bash');
  for (const cmd of story.acceptance ?? []) lines.push(cmd);
  lines.push('```');
  lines.push('');
  if (story.uat?.length) {
    lines.push('**UAT / QA**');
    lines.push('');
    for (const u of story.uat) {
      lines.push(`- [${u.done ? 'x' : ' '}] ${u.text}${u.note ? ` (${u.note})` : ''}`);
    }
    lines.push('');
  }
  lines.push(`**Blockers:** ${story.blockers ?? 'none'}`);
  lines.push('');
  return lines.join('\n');
}

function main() {
  const roadmap = readJson(ROADMAP);
  const storiesDoc = readJson(STORIES);
  const friction = readJson(FRICTION);
  const stories = storiesDoc.stories ?? [];
  const activeSprint = roadmap.sprints.find((s) => s.status === 'in_progress') ?? null;
  const activeStories = activeSprint
    ? stories.filter((s) => s.sprint === activeSprint.id && s.status !== 'done')
    : [];
  const now = new Date().toISOString();

  const lines = [];
  lines.push('---');
  lines.push('title: Execution roadmap — Fleet Ops Assurance');
  lines.push('status: current');
  lines.push(`date: ${now.slice(0, 10)}`);
  lines.push(`last_reconciled: ${now}`);
  lines.push('owner: fabric-os');
  lines.push(`program: ${roadmap.initiative}`);
  lines.push('generated: true');
  lines.push('generated_by: platform/scripts/generate-fleet-ops-assurance-roadmap.mjs');
  lines.push('sources:');
  lines.push('  - machine/fleet-ops-assurance-roadmap.json');
  lines.push('  - machine/fleet-ops-assurance-stories.json');
  lines.push('  - machine/fleet-ops-friction-register.json');
  lines.push('  - pm/spec/fleet-ops-assurance-program.json');
  lines.push('---');
  lines.push('');
  lines.push('# Fleet Ops Assurance Program — execution roadmap');
  lines.push('');
  lines.push('> **Generated file.** Edit machine JSON SoR, then `pnpm generate:fleet-ops-assurance-roadmap`.');
  lines.push('');
  lines.push('**Coordinator:** bridge-os (`ecosystem:ops-lanes-100`) · **Owner:** fabric-os');
  lines.push('');
  lines.push(`## Active Phase: ${activeSprint ? `${activeSprint.id} — ${activeSprint.name}` : 'FOAP complete'}`);
  lines.push('');
  lines.push(`**Status:** \`${activeSprint?.status ?? 'complete'}\``);
  lines.push('');
  if (activeStories.length) {
    lines.push('| Story | Title | Priority | Status | Owner |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const s of activeStories) {
      lines.push(`| ${s.id} | ${s.title} | ${s.priority} | ${s.status} | ${s.owner} |`);
    }
    lines.push('');
    for (const s of activeStories) lines.push(renderStory(s));
  }

  lines.push('## Parallel assurance friction (blocksIR: false)');
  lines.push('');
  lines.push('| ID | Lane | Class | Status | Programme |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const item of friction.items ?? []) {
    if (item.status === 'open') {
      lines.push(
        `| ${item.id} | ${item.opsLane ?? '—'} | ${item.class ?? '—'} | open | ${item.programme ?? '—'} |`,
      );
    }
  }
  lines.push('');

  lines.push('## All sprints');
  lines.push('');
  lines.push('| Sprint | Goal | Status |');
  lines.push('| --- | --- | --- |');
  for (const sprint of roadmap.sprints) {
    lines.push(`| ${sprint.id} | ${sprint.name} | ${sprint.status} |`);
  }
  lines.push('');

  lines.push('## Verification');
  lines.push('');
  lines.push('```bash');
  lines.push('pnpm fleet-ops-assurance:check:write');
  lines.push('pnpm --dir ../bridge-os ecosystem:ops-lanes-100:check:write');
  lines.push('pnpm --dir ../bridge-os ecosystem:ops-lanes-sprints:seal:write');
  lines.push('```');
  lines.push('');

  writeFileSync(OUT, `${lines.join('\n')}\n`);
  console.log(`Wrote ${OUT}`);
}

main();
