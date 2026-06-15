#!/usr/bin/env node
/**
 * session:handoff:write — durable hand-off for the next agent (fabric-os).
 *
 * Protocol: canon-os/docs/governance/protocols/49-session-handoff-archive/protocol.md
 * Canonical sessions home: workstream/sessions/ (P35 v5)
 *
 * Usage:
 *   node platform/scripts/ecosystem/session-handoff-write.mjs [--write]
 *   pnpm session:handoff:write
 */
import { execSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const REPO_ID = 'fabric-os';
const WRITE = process.argv.includes('--write');
const SESSIONS_DIR = join(ROOT, 'workstream/sessions');
const HANDOFF_DIR = join(SESSIONS_DIR, 'handoffs');
const CI_DIR = join(SESSIONS_DIR, 'ci');
const WITNESS_PATH = join(CI_DIR, 'session-handoff-latest.json');

function isoDate() {
  return new Date().toISOString().slice(0, 10);
}

function readJson(p) {
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function run(cmd, cwd = ROOT) {
  try {
    const out = execSync(cmd, { cwd, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    return { ok: true, out: out.trim() };
  } catch (e) {
    return { ok: false, out: `${e.stdout ?? ''}${e.stderr ?? e.message ?? ''}`.trim() };
  }
}

function runNextWork() {
  const r = spawnSync('pnpm', ['agent:next-work', '--json'], {
    cwd: ROOT,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
  if (r.status !== 0 || !r.stdout) return null;
  const start = r.stdout.indexOf('{');
  if (start < 0) return null;
  try {
    return JSON.parse(r.stdout.slice(start));
  } catch {
    return null;
  }
}

function gitSummary() {
  const branch = run('git rev-parse --abbrev-ref HEAD');
  const recent = run('git log --oneline -8');
  const ahead = run('git rev-list --count origin/main..HEAD');
  const dirty = run('git status --short');
  return {
    branch: branch.ok ? branch.out : 'unknown',
    recent: recent.ok ? recent.out.split('\n') : [],
    ahead: ahead.ok ? Number(ahead.out) || 0 : null,
    dirty: dirty.ok ? dirty.out.split('\n').filter(Boolean) : [],
  };
}

function sanitizeFilename(s) {
  return s.replace(/[^a-z0-9-]/gi, '-').replace(/-+/g, '-').toLowerCase();
}

function ensureSessionsTree() {
  const dirs = ['archive', 'handoffs', 'transcripts', 'ci', 'retrospectives', 'ledger'];
  for (const d of dirs) {
    mkdirSync(join(SESSIONS_DIR, d), { recursive: true });
  }
}

function renderHandoff({ bind, openItems, closureBar, nextWork, git }) {
  const story = bind?.storyId ?? nextWork?.next?.storyId ?? nextWork?.nextWorkItem?.id ?? 'UNKNOWN';
  const date = isoDate();
  const title = `Hand-off — ${story} — ${date}`;
  const closureResults = (closureBar?.results ?? [])
    .map((r) => `- ${r.ok ? '✓' : '✗'} ${r.id}${r.required ? '' : ' (optional)'} — ${r.detail}`)
    .join('\n');

  const accomplished = (openItems?.completed ?? [])
    .slice(0, 20)
    .map((c) => `- ${c.kind}: ${c.detail}`)
    .join('\n');

  const items = (openItems?.openItems ?? [])
    .map((i) => {
      const blocked = i.blockedUntil ? ` (blocked until ${i.blockedUntil})` : '';
      const blocks = i.blocksIR === false ? ' — parallel, does **not** block IR' : '';
      return `- **${i.type?.toUpperCase() ?? 'ITEM'}** \`${i.id ?? '—'}\` — ${i.title} — owner: ${i.owner ?? '—'} — status: ${i.status ?? 'open'}${blocked}${blocks}`;
    })
    .join('\n');

  const transcript = (openItems?.transcript?.userQueries ?? [])
    .slice(-10)
    .map((q) => `> ${q.replace(/\n+/g, ' ').slice(0, 200)}`)
    .join('\n\n');

  const evidence = [
    '- `workstream/sessions/ci/session-closure-bar-latest.json`',
    '- `pm/ci/session-open-items-latest.json`',
    '- `workstream/sessions/ci/session-handoff-latest.json`',
    '- `.baseline/session/story-persona-bind-latest.json`',
  ].join('\n');

  const next = nextWork?.nextWorkItem ?? nextWork?.next ?? null;
  const nextId = next?.id ?? next?.storyId ?? '—';
  const nextTitle = next?.title ?? '—';

  return `---
title: '${title}'
status: current
date: '${date}'
repo: '${REPO_ID}'
story: '${story}'
persona: '${bind?.productTeam?.primary ?? 'platform-architect'}'
frame: '${bind?.productTeam?.frame ?? 'development'}'
handoffSchema: 'gtcx://fabric-os/session-handoff/v1'
sessionComplete: ${closureBar?.sessionComplete === true}
---

# ${title}

## Session identity

| Field | Value |
| --- | --- |
| Story | \`${story}\` |
| Owner | ${bind?.owner ?? next?.owner ?? REPO_ID} |
| Persona | ${bind?.productTeam?.primary ?? 'platform-architect'} — ${bind?.productTeam?.frame ?? 'development'} frame |
| Bound at | ${bind?.boundAt ?? '—'} |
| Closure bar | **${closureBar?.sessionComplete ? 'COMPLETE' : 'INCOMPLETE'}** — ${closureBar?.requiredPass ?? 0}/${closureBar?.requiredTotal ?? 0} required |

${closureResults || '_Closure bar not run._'}

## Git state

- **Branch:** ${git.branch}
- **Ahead of origin/main:** ${git.ahead ?? 'unknown'}
- **Dirty files:** ${git.dirty.length} (witness churn may be ignored by closure bar)

### Recent commits

${git.recent.map((c) => `- ${c}`).join('\n')}

## Accomplished (from session transcript)

${accomplished || '_No completed items recorded._'}

## Current P22 head

${next ? `\`${nextId}\` — ${nextTitle} (${next.state ?? next.status ?? '—'}, ${next.priority ?? '—'})` : '_P22 not available._'}

## Open items / blockers

${items || '_No open items recorded._'}

## Transcript excerpts (last 10 operator turns)

${transcript || '_No transcript excerpts available._'}

## Evidence index

${evidence}

## Next actions for the receiving agent

1. Run \`pnpm agent:next-work\` to confirm P22 head.
2. Read this hand-off and the bound persona doc.
3. Review the open items above; mark the selected story \`in_progress\` in the authoritative SoR before coding.
4. Treat Class S / external gates as **parallel** unless the artifact explicitly says \`blocksIR: true\`.
`;
}

function main() {
  const bind = readJson(join(ROOT, '.baseline/session/story-persona-bind-latest.json'));
  const openItems = readJson(join(ROOT, 'pm/ci/session-open-items-latest.json'));
  const closureBar =
    openItems?.closureBar ?? readJson(join(ROOT, 'pm/ci/session-closure-bar-latest.json'));
  const nextWork = runNextWork();
  const git = gitSummary();

  const story = bind?.storyId ?? nextWork?.next?.storyId ?? nextWork?.nextWorkItem?.id ?? 'session';
  const date = isoDate();
  const filename = `handoff-${sanitizeFilename(story)}-${date}.md`;
  const handoffPath = join(HANDOFF_DIR, filename);

  const payload = {
    schema: 'gtcx://fabric-os/session-handoff/v1',
    at: new Date().toISOString(),
    repo: REPO_ID,
    story,
    persona: bind?.productTeam?.primary ?? 'platform-architect',
    frame: bind?.productTeam?.frame ?? 'development',
    handoffPath: handoffPath.replace(`${ROOT}/`, ''),
    sessionComplete: closureBar?.sessionComplete === true,
    closureBar,
    nextWorkItem: nextWork?.nextWorkItem ?? nextWork?.next ?? null,
    git,
  };

  const markdown = renderHandoff({ bind, openItems, closureBar, nextWork, git });

  if (WRITE) {
    ensureSessionsTree();
    writeFileSync(handoffPath, `${markdown}\n`);
    writeFileSync(WITNESS_PATH, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(`wrote ${handoffPath.replace(`${ROOT}/`, '')}`);
    console.log(`witness ${WITNESS_PATH.replace(`${ROOT}/`, '')}`);
  } else {
    console.log(markdown);
    console.log('\n---\n');
    console.log('Dry run. Use --write to persist.');
  }
}

main();
