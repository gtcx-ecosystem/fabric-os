#!/usr/bin/env node
/**
 * @fileoverview Docs Link Checker
 *
 * Scans all markdown files in docs/ and validates that internal relative
 * links resolve to existing files.
 *
 * Usage:
 *   node platform/tools/scripts/docs-link-checker.mjs
 *   node platform/tools/scripts/docs-link-checker.mjs --baseline=.docs-exceptions.json
 *
 * Exit codes:
 *   0 = all links valid (or only baseline-excepted breaks)
 *   1 = one or more broken links found
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..', '..', '..');
const args = process.argv.slice(2);
const baselineArg = args.find((a) => a.startsWith('--baseline='));
const baselinePath = baselineArg ? baselineArg.slice(11) : null;

const DOCS_HUB = ['docs', '01-docs'].find((hub) => existsSync(resolve(REPO_ROOT, hub)));
if (!DOCS_HUB) {
  console.error('docs-link-checker: docs/ or 01-docs/ not found');
  process.exit(1);
}
const DOCS_ROOT = resolve(REPO_ROOT, DOCS_HUB);

/** Legacy P35 path aliases when resolving link targets. */
const LEGACY_LINK_ALIASES = [
  { from: /^\.\.\/ops\//, to: '../operations/' },
  { from: /^ops\//, to: 'operations/' },
  { from: /^\.\.\/pm\//, to: '../machine/' },
  { from: /^\.\.\/\.\.\/pm\//, to: '../../machine/' },
  { from: /^pm\//, to: 'machine/' },
  { from: /^\.\.\/audit\//, to: '../../../audit/' },
  { from: /^audit\//, to: '../../../audit/' },
  { from: /^\.\.\/security\//, to: '../governance/security/' },
  { from: /^security\//, to: 'governance/security/' },
  { from: /^\.\.\/compliance\//, to: '../governance/compliance/' },
  { from: /^compliance\//, to: 'governance/compliance/' },
  { from: /^\.\.\/\.\.\/\.\.\/02-ops\//, to: '../../operations/' },
  { from: /^\.\.\/04-deploy\//, to: '../../deploy/' },
  { from: /^\.\.\/\.\.\/04-deploy\//, to: '../../../deploy/' },
];

const SIBLING_REPO_LINK_RE = /^(?:\.\.\/)+(baseline-os|bridge-os|canon-os|compliance-os|agile-os|fabric-os|gtcx-os|markets-os|terminal-os|terra-os|sensei-os|griot-ai|nyota-ai|ledger-ui|ledger-os|inspection-os)\//;

function makeKey(file) {
  return `broken-link|${file}`;
}

function loadBaseline(path) {
  try {
    const data = JSON.parse(readFileSync(path, 'utf8'));
    return new Set((data.exceptions || []).filter((e) => e.type === 'broken-link').map((e) => makeKey(e.file)));
  } catch {
    return new Set();
  }
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      const rel = relative(DOCS_ROOT, fullPath);
      if (rel === 'reference/legacy-top-level' || rel.startsWith('reference/legacy-top-level/')) continue;
      walk(fullPath, files);
    } else if (entry.endsWith('.md')) {
      files.push(relative(DOCS_ROOT, fullPath));
    }
  }
  return files;
}

function resolveWithAliases(fileDir, linkTarget) {
  const candidates = [linkTarget];
  if (/^(docs|operations|machine|platform|deploy|audit|workstream|agents|archive)\//.test(linkTarget)) {
    candidates.push(resolve(REPO_ROOT, linkTarget));
  }
  if (/^(?:\.\.\/)+(deploy|operations|machine|platform|audit|workstream|agents|archive)\//.test(linkTarget)) {
    candidates.push(resolve(REPO_ROOT, linkTarget.replace(/^(?:\.\.\/)+/, '')));
  }
  if (/^(?:\.\.\/)+pm\//.test(linkTarget)) {
    candidates.push(resolve(REPO_ROOT, linkTarget.replace(/^(?:\.\.\/)+pm\//, 'machine/')));
  }
  if (SIBLING_REPO_LINK_RE.test(linkTarget)) {
    const stripped = linkTarget.replace(/^(?:\.\.\/)+/, '');
    candidates.push(resolve(REPO_ROOT, '..', stripped));
    candidates.push(resolve(REPO_ROOT, '..', stripped.replace(/\/pm\//, '/machine/')));
  }
  for (const { from, to } of LEGACY_LINK_ALIASES) {
    if (from.test(linkTarget)) {
      candidates.push(linkTarget.replace(from, to));
    }
  }
  for (const target of candidates) {
    const resolved = target.startsWith('/') ? target : resolve(fileDir, target);
    if (existsSync(resolved)) return resolved;
    if (/^(docs|operations|machine|platform|deploy|audit|workstream|agents|archive)\//.test(target)) {
      const rootResolved = resolve(REPO_ROOT, target);
      if (existsSync(rootResolved)) return rootResolved;
    }
    if (target.endsWith('.md') && existsSync(`${resolved}`)) return resolved;
  }
  return resolve(fileDir, linkTarget);
}

const baseline = baselinePath ? loadBaseline(resolve(REPO_ROOT, baselinePath)) : new Set();
const markdownFiles = walk(DOCS_ROOT);
let broken = 0;
let excepted = 0;
let total = 0;

for (const file of markdownFiles) {
  const docsRelative = `${DOCS_HUB}/${file}`;
  const fileExcepted = baseline.has(makeKey(docsRelative));

  const content = readFileSync(join(DOCS_ROOT, file), 'utf8');
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let match;

  while ((match = linkRegex.exec(content)) !== null) {
    const linkText = match[1];
    const linkTarget = match[2];
    total++;

    if (/^(https?:|mailto:|#)/.test(linkTarget)) {
      continue;
    }

    const fileDir = dirname(join(DOCS_ROOT, file));
    // Strip URL fragments and query strings before resolving the file path.
    const targetPath = linkTarget.split('#')[0].split('?')[0];
    const resolved = resolveWithAliases(fileDir, targetPath);

    if (!existsSync(resolved)) {
      if (fileExcepted) {
        excepted++;
        continue;
      }
      console.error(`BROKEN: ${file} → "${linkText}" → ${linkTarget}`);
      broken++;
    }
  }
}

console.log(`Checked ${total} links across ${markdownFiles.length} markdown files.`);
if (excepted > 0) {
  console.log(`Baseline excepted ${excepted} broken link(s) in waived files.`);
}

if (broken > 0) {
  console.error(`\n${broken} broken link(s) found.`);
  process.exit(1);
}

console.log('All internal links resolve correctly.');
process.exit(0);
