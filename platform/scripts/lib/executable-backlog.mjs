/**
 * Executable backlog — single SoR semantics for machine/backlog.json (P57 + P22).
 * Spec: machine/spec/executable-backlog-protocol.json
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const TERMINAL_STATUSES = new Set([
  'done',
  'cancelled',
  'canceled',
  'closed',
  'complete',
  'completed',
  'deferred',
]);

const ACTIVE_INIT_STATUSES = new Set(['open', 'in_progress', 'active', 'in-progress']);

export function isStoryOpen(status) {
  return !TERMINAL_STATUSES.has(String(status ?? 'open').toLowerCase());
}

export function parseStoryPriority(p) {
  const n = Number.parseInt(String(p ?? 'P9').replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 9;
}

/**
 * @param {Array<{ id: string, status?: string, priority?: string, title?: string, owner?: string }>} stories
 */
export function computeBacklogExecutionState(stories) {
  const list = Array.isArray(stories) ? stories : [];
  const open = list.filter((s) => isStoryOpen(s.status));
  const backlogClear = open.length === 0;
  const inProgress = open.find((s) => String(s.status).toLowerCase() === 'in_progress');
  const sorted = [...open].sort(
    (a, b) => parseStoryPriority(a.priority) - parseStoryPriority(b.priority) || String(a.id).localeCompare(String(b.id)),
  );
  const head = inProgress ?? sorted[0] ?? null;

  let active = null;
  if (head) {
    active = {
      storyId: head.id,
      title: head.title ?? head.id,
      status: head.status ?? 'pending',
      owner: head.owner ?? null,
      priority: head.priority ?? null,
      tier: inProgress ? 'in_progress' : 'compiled-backlog',
    };
  }

  return {
    backlogClear,
    active,
    openCount: open.length,
    totalCount: list.length,
    doneCount: list.length - open.length,
    openIds: open.map((s) => s.id),
  };
}

function hasOpenEpicWork(init) {
  const epics = init.epics ?? [];
  for (const epic of epics) {
    const cur = epic.currentScore100 ?? 0;
    const tgt = epic.targetScore100 ?? 100;
    if (cur < tgt) return true;
    for (const f of epic.features ?? []) {
      if (isStoryOpen(f.status)) return true;
    }
  }
  return false;
}

function isInitiativeComplete(init) {
  if (String(init.status).toLowerCase() === 'done') return true;
  if (init.dodMet || init.completionPercent === 100) return true;
  if (init.deployReadinessPercent === 100 && init.currentComposite100 >= (init.targetComposite100 ?? 85)) {
    return true;
  }
  return false;
}

/**
 * @param {Array<{ id: string, status?: string, title?: string, epics?: unknown[] }>} initiatives
 * @param {Array<{ id: string, status?: string, initiativeId?: string }>} stories
 */
export function findExecutableGaps(initiatives, stories) {
  const gaps = [];
  const inits = Array.isArray(initiatives) ? initiatives : [];
  const sts = Array.isArray(stories) ? stories : [];

  for (const init of inits) {
    const status = String(init.status ?? '').toLowerCase();
    if (!ACTIVE_INIT_STATUSES.has(status)) continue;
    if (hasOpenEpicWork(init)) continue;
    if (isInitiativeComplete(init)) continue;
    const id = init.id;
    const children = sts.filter(
      (s) =>
        s.initiativeId === id ||
        s.initiative === id ||
        s.parentInitiative === id ||
        s.programId === id,
    );
    const openChildren = children.filter((s) => isStoryOpen(s.status));
    if (children.length === 0) {
      gaps.push({
        initiativeId: id,
        title: init.title ?? id,
        reason: 'no_stories',
        fix: `Add docs/product/roadmap/stories/STORY-*.md with initiativeId: ${id} → pnpm product:compile --write`,
      });
    } else if (openChildren.length === 0) {
      gaps.push({
        initiativeId: id,
        title: init.title ?? id,
        reason: 'no_open_stories',
        fix: `Open or add a pending story under initiative ${id} → product:compile --write`,
      });
    }
  }
  return gaps;
}

/**
 * @param {string} repoRoot
 */
export function readCompiledBacklog(repoRoot) {
  const path = join(repoRoot, 'machine/backlog.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

/**
 * @param {string} repoRoot
 */
export function hasCompileWitness(repoRoot) {
  const witness = join(repoRoot, 'machine/ci/product-compile-latest.json');
  if (!existsSync(witness)) return false;
  try {
    const doc = JSON.parse(readFileSync(witness, 'utf8'));
    return doc.pass !== false;
  } catch {
    return existsSync(witness);
  }
}

/**
 * Compiled backlog is authoritative when product:compile witness exists or syncSource says so.
 * @param {string} repoRoot
 */
export function isCompiledBacklogAuthoritative(repoRoot) {
  const backlog = readCompiledBacklog(repoRoot);
  if (!backlog) return false;
  const sync = String(backlog.syncSource ?? '');
  if (/product:compile/.test(sync)) return true;
  if (backlog._generated?.by === 'product-compile.mjs') return true;
  return hasCompileWitness(repoRoot);
}

/**
 * Mirror operations/machine/backlog.json from machine/backlog.json (shim — not a second SoR).
 * @param {string} repoRoot
 * @param {object} backlogDoc
 */
export function writeOperationsBacklogMirror(repoRoot, backlogDoc) {
  const target = join(repoRoot, 'operations/machine/backlog.json');
  mkdirSync(join(repoRoot, 'operations/machine'), { recursive: true });
  const mirror = {
    ...backlogDoc,
    _mirror: {
      of: 'machine/backlog.json',
      at: new Date().toISOString(),
      note: 'Shim only — P22 and gates read machine/backlog.json',
    },
  };
  writeFileSync(target, `${JSON.stringify(mirror, null, 2)}\n`);
}
