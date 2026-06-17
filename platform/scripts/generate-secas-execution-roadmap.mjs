#!/usr/bin/env node
/**
 * Generate audit/product-management/secas-execution-roadmap.md from SECaaS SoR JSON.
 * Sources: pm/secas-roadmap.json, pm/security-friction-register.json, pm/secas-stories.json
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/product-management/secas-execution-roadmap.md');
const ROADMAP_JSON = join(ROOT, 'pm/secas-roadmap.json');
const FRICTION_JSON = join(ROOT, 'pm/security-friction-register.json');
const STORIES_JSON = join(ROOT, 'pm/secas-stories.json');
const SOVEREIGN_JSON = join(ROOT, 'pm/sovereign-approval-register.json');
const FRICTION_EVIDENCE = join(ROOT, 'audit/evidence/secas-friction-check-latest.json');
const APPROVAL_EVIDENCE = join(ROOT, 'audit/evidence/secas-approval-check-latest.json');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function checkbox(done) {
  return done ? 'x' : ' ';
}

function renderStory(story) {
  const lines = [];
  lines.push(`### ${story.id}: ${story.title}`);
  lines.push('');
  if (story.files?.length) {
    lines.push(`**Files:** ${story.files.join(story.files.length > 1 ? ', ' : '')}`);
    lines.push('');
  }
  lines.push('**Acceptance**');
  lines.push('');
  lines.push('```bash');
  for (const cmd of story.acceptance ?? []) lines.push(cmd);
  lines.push('```');
  lines.push('');
  if (story.uat?.length) {
    lines.push('**UAT / QA**');
    lines.push('');
    for (const item of story.uat) {
      const note = item.note ? ` (${item.note})` : '';
      lines.push(`- [${checkbox(item.done)}] ${item.text}${note}`);
    }
    lines.push('');
  }
  lines.push(`**Blockers:** ${story.blockers ?? 'none'}`);
  lines.push('');
  return lines.join('\n');
}

function frictionRoadmapStatus(item, stories) {
  const linked = stories.find((s) => s.frictionIds?.includes(item.id));
  if (linked) return linked.status;
  if (item.executionStatus) return item.executionStatus;
  return item.status === 'open' ? 'pending' : item.status;
}

function main() {
  for (const path of [ROADMAP_JSON, FRICTION_JSON, STORIES_JSON]) {
    if (!existsSync(path)) {
      console.error(`missing SoR: ${path}`);
      process.exit(1);
    }
  }

  const roadmap = readJson(ROADMAP_JSON);
  const friction = readJson(FRICTION_JSON);
  const storiesDoc = readJson(STORIES_JSON);
  const sovereign = existsSync(SOVEREIGN_JSON) ? readJson(SOVEREIGN_JSON) : { items: [] };
  const stories = storiesDoc.stories ?? [];
  const openSprint = roadmap.sprints.find((s) => s.status !== 'complete');
  const activeSprint = openSprint ?? null;
  const activeStories = activeSprint
    ? stories.filter((s) => s.sprint === activeSprint.id)
    : [];
  const futureSprints = activeSprint
    ? roadmap.sprints.filter((s) => s.id !== activeSprint.id)
    : roadmap.sprints;

  const now = new Date().toISOString();
  const lines = [];
  lines.push('---');
  lines.push('title: Execution roadmap — SecOps');
  lines.push('status: current');
  lines.push(`date: ${now.slice(0, 10)}`);
  lines.push(`last_reconciled: ${now}`);
  lines.push('owner: fabric-os');
  lines.push(`program: ${roadmap.initiative}`);
  lines.push('generated: true');
  lines.push('generated_by: platform/scripts/generate-secas-execution-roadmap.mjs');
  lines.push('sources:');
  lines.push('  - pm/secas-roadmap.json');
  lines.push('  - pm/security-friction-register.json');
  lines.push('  - pm/secas-stories.json');
  lines.push('  - pm/sovereign-approval-register.json');
  if (existsSync(FRICTION_EVIDENCE)) lines.push('  - audit/evidence/secas-friction-check-latest.json');
  if (existsSync(APPROVAL_EVIDENCE)) lines.push('  - audit/evidence/secas-approval-check-latest.json');
  lines.push('---');
  lines.push('');
  lines.push('# fabric-os SecOps execution roadmap');
  lines.push('');
  lines.push('> **Generated file.** Edit `pm/secas-stories.json`, `pm/security-friction-register.json`, or');
  lines.push('> `pm/secas-roadmap.json`, then run `pnpm generate:secas-roadmap`.');
  lines.push('');
  lines.push('**Ops lane:** SecOps · **Functional product:** SECaaS — parallel to DevOps/InfraOps (DaaS), not product PM.');
  lines.push('');
  lines.push(`## Active Phase: ${activeSprint ? `${activeSprint.id} — ${activeSprint.name}` : 'PROGRAM-SPRINTS-COMPLETE — all SECaaS program sprints sealed'}`);
  lines.push('');
  lines.push(`**Status:** \`${activeSprint?.status ?? 'complete'}\``);
  lines.push('');
  if (activeStories.length > 0) {
    lines.push('| Story | Title | Priority | Status | Owner |');
    lines.push('| --- | --- | --- | --- | --- |');
    for (const story of activeStories) {
      lines.push(
        `| ${story.id} | ${story.title} | ${story.priority} | ${story.status} | ${story.owner} |`,
      );
    }
    lines.push('');
    for (const story of activeStories) lines.push(renderStory(story));
  } else {
    lines.push('_All SECaaS program sprints (S1–S5) sealed. Vendor calendar gates run in parallel — see below._');
    lines.push('');
  }

  lines.push('## Post-launch external (NOT internal roadmap)');
  lines.push('');
  lines.push('> Vendor/auditor calendar artifacts — **excluded from P22 and agent work.**');
  lines.push('> SoR: [`ops/coordination/post-launch-external-gates.json`](../../ops/coordination/post-launch-external-gates.json)');
  lines.push('');
  lines.push('| ID | Actor | Window / earliest | blocksIR |');
  lines.push('| --- | --- | --- | --- |');
  lines.push('| BG-10-10 | External pen-test vendor | 2026-06-17..21 | false |');
  lines.push('| BG-10-10-REPORT | External pen-test vendor | post 2026-06-21 | false |');
  lines.push('| BG-10-11 | External auditor (SOC 2 opinion) | parallel track | false |');
  lines.push('');
  lines.push('## Internal human (GTCX — NOT agent P22)');
  lines.push('');
  lines.push('> SoR: [`ops/coordination/internal-human-gates.json`](../../ops/coordination/internal-human-gates.json)');
  lines.push('');
  lines.push('_Open: EXT-INF-014, EXT-INF-015, H-03 · Closed: EXT-INF-002, EXT-INF-013, BL-SOC2-01 engagement_');
  lines.push('');

  lines.push('## Future Phases');
  lines.push('');
  lines.push('| Sprint | Goal | Status | Owner | Stories / Friction |');
  lines.push('| --- | --- | --- | --- | --- |');
  for (const sprint of futureSprints) {
    lines.push(
      `| ${sprint.id} | ${sprint.name} | ${sprint.status} | fabric-os | ${(sprint.items ?? []).map((id) => `\`${id}\``).join(', ')} |`,
    );
  }
  lines.push('');
  lines.push('## Issue Reconciliation');
  lines.push('');
  lines.push('| Issue | Source | Roadmap Mapping | Status |');
  lines.push('| --- | --- | --- | --- |');
  for (const item of friction.items ?? []) {
    const mapping =
      stories.find((s) => s.frictionIds?.includes(item.id))?.id ??
      roadmap.sprints.find((s) => s.items?.includes(item.id))?.id ??
      '—';
    lines.push(
      `| \`${item.id}\` | \`pm/security-friction-register.json\` | ${mapping} | ${frictionRoadmapStatus(item, stories)} |`,
    );
  }
  lines.push('| P42 hub protocol publication | `pm/_tasks` | gtcx-docs | done |');
  lines.push('');
  lines.push('## Unblock Order');
  lines.push('');
  const openFriction = (friction.items ?? []).filter((i) => i.status === 'open');
  if (openFriction.length === 0) {
    lines.push('_No open security friction items — program clear for current sprint._');
  } else {
    openFriction.forEach((item, idx) => {
      lines.push(
        `${idx + 1}. **\`${item.id}\`** (${item.repo}) — ${item.title}${item.dependsOn ? ` — after ${item.dependsOn}` : ''}`,
      );
    });
  }
  lines.push('');

  writeFileSync(OUT, `${lines.join('\n')}\n`);
  console.log(`Wrote ${OUT}`);
  console.log(`Stories: ${activeStories.length} · Friction items: ${friction.items?.length ?? 0}`);
}

main();
