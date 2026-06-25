#!/usr/bin/env node
/**
 * Sync fabric-os fleet-unblock register markdown table from JSON state.
 *
 * Usage:
 *   node platform/scripts/sync-fleet-blocker-state.mjs [--check]
 *
 * Without --check: rewrites the markdown register table from JSON.
 * With --check: exits non-zero if markdown table is out of sync.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const JSON_PATH = join(ROOT, 'operations/coordination/fleet-blocker-state.json');
const MD_PATH = join(ROOT, 'docs/operations/coordination/fabric-os-fleet-unblock-register-2026-06-25.md');
const CHECK = process.argv.includes('--check');

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function readMd(path) {
  return readFileSync(path, 'utf8');
}

function blockerRow(b) {
  return `| ${b.id} | ${b.blockedRepo} | ${b.blockedStory} | ${b.title} | ${b.type} | ${b.class} | ${b.priority} | ${b.status} |`;
}

function renderTable(blockers) {
  const header = `| ID | Blocked repo | Blocked work | Fabric-os deliverable | Type | Class | Priority | Status |
| -- | ------------ | ------------ | --------------------- | ---- | ----- | -------- | ------ |`;
  const rows = blockers.map(blockerRow).join('\n');
  return `${header}\n${rows}`;
}

function replaceTable(md, table) {
  const startMarker = '## Active fabric-os-owned blockers\n\n';
  const endMarker = '\n\n## Sequenced execution plan';
  const start = md.indexOf(startMarker);
  const end = md.indexOf(endMarker);
  if (start === -1 || end === -1) {
    throw new Error('Could not find table markers in markdown register');
  }
  return md.slice(0, start + startMarker.length) + table + md.slice(end);
}

function main() {
  const state = readJson(JSON_PATH);
  const md = readMd(MD_PATH);
  const table = renderTable(state.blockers);

  if (CHECK) {
    const startMarker = '## Active fabric-os-owned blockers\n\n';
    const endMarker = '\n\n## Sequenced execution plan';
    const currentTableStart = md.indexOf(startMarker) + startMarker.length;
    const currentTableEnd = md.indexOf(endMarker);
    const currentTable = md.slice(currentTableStart, currentTableEnd);
    if (currentTable.trim() !== table.trim()) {
      console.error('FAIL — markdown register table is out of sync with fleet-blocker-state.json');
      process.exit(1);
    }
    console.log('OK — markdown register table is in sync');
    return;
  }

  const updated = replaceTable(md, table);
  writeFileSync(MD_PATH, updated);
  console.log(`Synced ${MD_PATH} from ${JSON_PATH}`);
}

main();
