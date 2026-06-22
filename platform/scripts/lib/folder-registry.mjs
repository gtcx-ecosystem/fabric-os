/**
 * folder-registry.mjs — resolve top-level repo folder identity from config/folders.json.
 *
 * The ONE place tools read folder names/paths. Never hardcode "agile/" or "machine/" —
 * call folderPath('agile') / folderLabel('agile'). Change a name in config/folders.json
 * and it flows through every consumer of this resolver.
 *
 *   import { folderPath, folderLabel, folder, allFolders, foldersByGroup } from './lib/folder-registry.mjs';
 *   folderPath('pm')        // -> 'pm'        (physical folder)
 *   folderLabel('pm')       // -> 'Build'     (display name — the one-place rename knob)
 *   folderPath('ops')       // -> 'operations' (alias resolves to current id)
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REGISTRY_PATH = resolve(HERE, '../../../config/folders.json');

let _registry = null;
function load() {
  if (_registry) return _registry;
  const raw = JSON.parse(readFileSync(REGISTRY_PATH, 'utf8'));
  const byId = raw.folders;
  const aliasIndex = {};
  for (const [id, f] of Object.entries(byId)) {
    aliasIndex[id] = id;
    for (const a of f.aliases ?? []) aliasIndex[a] = id;
  }
  _registry = { raw, byId, aliasIndex, groups: raw.groups ?? {} };
  return _registry;
}

/** Resolve an id or legacy alias (e.g. 'ops') to the canonical folder record. Throws on unknown. */
export function folder(idOrAlias) {
  const r = load();
  const id = r.aliasIndex[idOrAlias];
  if (!id) throw new Error(`folder-registry: unknown folder "${idOrAlias}" (not an id or alias in config/folders.json)`);
  return r.byId[id];
}

export const folderPath = (idOrAlias) => folder(idOrAlias).path;
export const folderLabel = (idOrAlias) => folder(idOrAlias).label;

/** Absolute path to a top-level folder under a repo root. */
export const folderAbs = (repoRoot, idOrAlias) => join(repoRoot, folderPath(idOrAlias));

/** All folder records (array). */
export const allFolders = () => Object.values(load().byId);

/** Folders grouped by their `group` field — the organized-root view, no physical nesting. */
export function foldersByGroup() {
  const out = {};
  for (const f of allFolders()) (out[f.group ??= 'system'] ||= []).push(f);
  return out;
}

export const registryGroups = () => load().groups;
