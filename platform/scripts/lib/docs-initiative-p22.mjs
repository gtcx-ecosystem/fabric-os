/**
 * INIT-DOCS-CORE-IA-V1 — P22 work selection for documentation initiative.
 * Imported by canon-os hub agent-next-work and bridge finalize-owner-p22.
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

export function resolveCanonRoot(fromRepoRoot) {
  const sibling = join(fromRepoRoot, '..', 'canon-os');
  if (existsSync(join(sibling, 'pm/spec/docs-ia-initiative.json'))) return sibling;
  const local = join(fromRepoRoot);
  if (existsSync(join(local, 'pm/spec/docs-ia-initiative.json'))) return local;
  return sibling;
}

function loadJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function gitDirtyCount(repoRoot) {
  const r = spawnSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  if (r.status !== 0) return 0;
  return (r.stdout ?? '').split('\n').filter(Boolean).length;
}

function fleetDirtyTotal(canonRoot, fleetRepos) {
  const eco = join(canonRoot, '..');
  let total = 0;
  let repos = 0;
  for (const name of fleetRepos) {
    const root = join(eco, name);
    if (!existsSync(join(root, 'package.json'))) continue;
    const n = gitDirtyCount(root);
    if (n > 0) {
      total += n;
      repos += 1;
    }
  }
  return { total, repos };
}

function iaCompositeOk(repoRoot) {
  const witness = join(repoRoot, 'audit/evidence/fleet-docs-ia-latest.json');
  const local = join(repoRoot, 'audit/evidence/docs-ia-latest.json');
  for (const path of [local, witness]) {
    const doc = loadJson(path);
    if (doc && typeof doc.ok === 'boolean') return doc.ok;
  }
  return null;
}

function isHubRepo(repoId) {
  return ['canon-os', 'gtcx-docs', 'bridge-os', 'agile-os'].includes(repoId);
}

/**
 * @param {string} repoId
 * @param {string} repoRoot
 */
export function selectDocsInitiativeWork(repoId, repoRoot) {
  const canonRoot = resolveCanonRoot(repoRoot);
  const initiative = loadJson(join(canonRoot, 'pm/spec/docs-ia-initiative.json'));
  const queue = loadJson(join(canonRoot, 'pm/spec/docs-initiative-p22-queue.json'));

  if (!initiative || !queue) return null;
  if (initiative.status === 'complete' || queue.status === 'complete') return null;

  const fleetRepos = queue.fleetRepos ?? [];
  const dirty = gitDirtyCount(repoRoot);
  const fleetDirty = fleetDirtyTotal(canonRoot, fleetRepos);

  /** @type {Array<{item: Record<string, unknown>, reason: string}>} */
  const candidates = [];

  for (const item of queue.workItems ?? []) {
    if (item.status === 'done' || item.status === 'deferred') continue;

    if (item.id === 'DOCS-REPO-WITNESS' && item.scope === 'per-repo') {
      const threshold = item.dirtyThreshold ?? 1;
      if (dirty >= threshold) {
        candidates.push({
          item,
          reason: `${dirty} uncommitted path(s) — bootstrap witness not sealed in git`,
        });
      }
      continue;
    }

    if (item.id === 'DOCS-HUB-FLEET-WITNESS' && isHubRepo(repoId)) {
      const threshold = item.dirtyThreshold ?? 50;
      if (fleetDirty.total >= threshold) {
        candidates.push({
          item,
          reason: `${fleetDirty.repos} fleet repo(s) · ${fleetDirty.total} dirty paths — fleet witness commits`,
        });
      }
      continue;
    }

    if (item.id === 'DOCS-P4-IA-COMPOSITE' && item.scope === 'per-repo') {
      const ok = iaCompositeOk(repoRoot);
      if (ok === false) {
        candidates.push({
          item,
          reason: 'docs:ia composite not green — fractal MPR / layer rollup pending',
        });
      }
    }
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => parsePriority(a.item.priority) - parsePriority(b.item.priority));
  const { item, reason } = candidates[0];

  return buildDocsInitiativePayload(repoId, repoRoot, canonRoot, initiative, queue, item, reason, {
    dirty,
    fleetDirty,
  });
}

function parsePriority(p) {
  const n = Number.parseInt(String(p ?? 'P9').replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : 9;
}

function buildDocsInitiativePayload(repoId, repoRoot, canonRoot, initiative, queue, item, reason, metrics) {
  const storyId = String(item.id);
  const title = String(item.title);
  const phase = String(item.phase ?? queue.activePhase ?? 'P3');

  return {
    ok: true,
    backlogClear: false,
    repo: repoId,
    protocol: '22-agent-work-selection',
    initiative: initiative.initiative,
    activePhase: phase,
    frame: queue.frame ?? initiative.frame ?? 'development',
    message: `Documentation initiative ${storyId} — ${reason}`,
    next: {
      storyId,
      title,
      priority: item.priority ?? 'P0',
      status: 'pending',
      implementationClass: 'ops-docs',
      feature: initiative.initiative,
      initiative: initiative.initiative,
    },
    nextWorkItem: {
      type: item.type ?? 'Task',
      typeLabel: item.type ?? 'Task',
      id: storyId,
      storyId,
      title,
      owner: repoId,
      ownerRepo: repoId,
      switchWorkspace: false,
      because: `${initiative.initiative} · ${reason}`,
    },
    selection: {
      tier: 'docs-initiative',
      reason: `INIT-DOCS-CORE-IA-V1 ${phase} — ${reason}`,
      phase,
    },
    docsInitiative: {
      active: true,
      initiative: initiative.initiative,
      phase,
      workItemId: storyId,
      spec: 'pm/spec/docs-ia-initiative.json',
      queue: 'pm/spec/docs-initiative-p22-queue.json',
      blocksHubRedirect: true,
      blocksEngineeringRedirect: true,
      persona: queue.persona ?? initiative.persona ?? 'documentation-architect',
      commands: item.commands ?? [],
      metrics,
    },
    agentInstructions: [
      `Documentation initiative **${storyId}** — execute in **${repoId}** cwd; do not switch to product engineering until witness sealed.`,
      `Read ${initiative.machineSpecs?.initiative ?? 'pm/spec/docs-ia-initiative.json'} before edits.`,
      ...(item.commands ?? []).map((c) => `Run: \`${c}\``),
      'Micro-commit per slice (≤25 files); refresh audit/evidence witnesses after gates.',
      'Do not ask the operator which story to pick.',
    ],
    statusUpdate: {
      done: `Documentation initiative queue active — ${storyId}`,
      nextWorkItem: `- **Type:** ${item.type ?? 'Task'}\n- **ID:** \`${storyId}\`\n- **Title:** ${title}\n- **Owner:** ${repoId}\n- **Because:** ${initiative.initiative} · ${reason}`,
    },
    canonRoot: canonRoot.replace(repoRoot, '.').startsWith('..') ? '../canon-os' : '.',
  };
}
