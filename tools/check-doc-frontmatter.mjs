#!/usr/bin/env node
/**
 * @fileoverview Docs YAML Frontmatter Validator
 *
 * Validates that all markdown files in docs/ have valid YAML frontmatter
 * per the docs-standard-machine-readable specification.
 *
 * Usage:
 *   node tools/check-doc-frontmatter.mjs
 *   node tools/check-doc-frontmatter.mjs --json
 *
 * Exit codes:
 *   0 = all docs pass
 *   1 = one or more docs fail validation
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const DOCS_ROOT = path.join(process.cwd(), 'docs');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const REQUIRED_FIELDS = ['title', 'status', 'date', 'owner', 'role', 'tier', 'tags', 'review_cycle'];

const STATUS_ENUM = ['current', 'draft', 'deprecated', 'superseded'];
const OWNER_ENUM = ['protocol-architect', 'crypto-security-engineer', 'frontier-infra-engineer', 'quality-evidence-lead', 'product-lead'];
const TIER_ENUM = ['critical', 'standard', 'informational'];
const REVIEW_CYCLE_ENUM = ['quarterly', 'monthly', 'on-change'];

const EXCLUDED_PATHS = [
  /node_modules/,
  /\.git/,
  /\.baseline/,
  /\.turbo/,
  /dist/,
  /build/,
];

// Files that are exempt from frontmatter (templates, generated reports, etc.)
const EXEMPT_PATTERNS = [
  /_template\.md$/,
  /_draft\.md$/,
  /_example\.md$/,
  /\.report\.md$/,
];

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function isExcluded(filePath) {
  return EXCLUDED_PATHS.some((p) => p.test(filePath));
}

function isExempt(filePath) {
  return EXEMPT_PATTERNS.some((p) => p.test(filePath));
}

function walk(dir, files = []) {
  if (isExcluded(dir)) return files;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (isExcluded(fullPath)) continue;
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function relativeDocs(filePath) {
  return path.relative(process.cwd(), filePath);
}

function parseFrontmatter(content) {
  const lines = content.split('\n');
  if (lines[0]?.trim() !== '---') {
    return { error: 'Missing YAML frontmatter delimiter (---) at line 1' };
  }

  const endIdx = lines.slice(1).findIndex((l) => l.trim() === '---');
  if (endIdx === -1) {
    return { error: 'Missing closing YAML frontmatter delimiter (---)' };
  }

  const fmLines = lines.slice(1, endIdx + 1);
  const fm = {};

  for (const line of fmLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === '---') continue;

    // Match key: value or key: [array]
    const match = trimmed.match(/^([a-z_]+):\s*(.*)$/);
    if (!match) {
      return { error: `Invalid frontmatter line: ${trimmed}` };
    }

    const [, key, rawValue] = match;

    if (rawValue.startsWith('[') && rawValue.endsWith(']')) {
      // Array
      try {
        const items = rawValue
          .slice(1, -1)
          .split(',')
          .map((s) => s.trim().replace(/^"|"$/g, '').replace(/^'|'$/g, ''))
          .filter(Boolean);
        fm[key] = items;
      } catch {
        return { error: `Invalid array value for ${key}: ${rawValue}` };
      }
    } else {
      // String - remove quotes
      fm[key] = rawValue.replace(/^"|"$/g, '').replace(/^'|'$/g, '');
    }
  }

  return { frontmatter: fm, endLine: endIdx + 2 };
}

function validateField(file, key, value, errors) {
  switch (key) {
    case 'title':
      if (!value || typeof value !== 'string') {
        errors.push(`${file}: title must be a non-empty string`);
      }
      break;
    case 'status':
      if (!STATUS_ENUM.includes(value)) {
        errors.push(`${file}: status must be one of ${STATUS_ENUM.join(', ')} (got: ${value})`);
      }
      break;
    case 'date':
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        errors.push(`${file}: date must be YYYY-MM-DD (got: ${value})`);
      }
      break;
    case 'owner':
      if (!OWNER_ENUM.includes(value)) {
        errors.push(`${file}: owner must be one of ${OWNER_ENUM.join(', ')} (got: ${value})`);
      }
      break;
    case 'role':
      if (!OWNER_ENUM.includes(value)) {
        errors.push(`${file}: role must be one of ${OWNER_ENUM.join(', ')} (got: ${value})`);
      }
      break;
    case 'tier':
      if (!TIER_ENUM.includes(value)) {
        errors.push(`${file}: tier must be one of ${TIER_ENUM.join(', ')} (got: ${value})`);
      }
      break;
    case 'tags':
      if (!Array.isArray(value) || value.length < 2 || value.length > 5) {
        errors.push(`${file}: tags must be an array of 2–5 items (got: ${Array.isArray(value) ? value.length : typeof value})`);
      } else {
        for (const tag of value) {
          if (!/^[a-z0-9-]+$/.test(tag)) {
            errors.push(`${file}: tag must be kebab-case (got: ${tag})`);
          }
        }
      }
      break;
    case 'review_cycle':
      if (!REVIEW_CYCLE_ENUM.includes(value)) {
        errors.push(`${file}: review_cycle must be one of ${REVIEW_CYCLE_ENUM.join(', ')} (got: ${value})`);
      }
      break;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const jsonMode = args.includes('--json');

const files = walk(DOCS_ROOT);
const errors = [];
const missing = [];
const passed = [];

for (const filePath of files) {
  if (isExempt(filePath)) continue;

  const content = readFileSync(filePath, 'utf8');
  const result = parseFrontmatter(content);

  if (result.error) {
    missing.push({ file: relativeDocs(filePath), error: result.error });
    continue;
  }

  const fm = result.frontmatter;
  const fileRel = relativeDocs(filePath);

  for (const field of REQUIRED_FIELDS) {
    if (!(field in fm)) {
      errors.push(`${fileRel}: missing required field '${field}'`);
    }
  }

  for (const [key, value] of Object.entries(fm)) {
    validateField(fileRel, key, value, errors);
  }

  // Check for future dates
  if (fm.date) {
    const docDate = new Date(fm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (docDate > today) {
      errors.push(`${fileRel}: date is in the future (${fm.date})`);
    }
  }

  if (!errors.some((e) => e.startsWith(`${fileRel}:`))) {
    passed.push(fileRel);
  }
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

if (jsonMode) {
  console.log(JSON.stringify({ total: files.length, passed: passed.length, missing: missing.length, errors: errors.length, details: { missing, errors } }, null, 2));
  process.exit(missing.length + errors.length > 0 ? 1 : 0);
}

if (missing.length === 0 && errors.length === 0) {
  console.log(`All ${files.length} docs have valid YAML frontmatter`);
  process.exit(0);
}

if (missing.length > 0) {
  console.error(`\nMISSING YAML FRONTMATTER (${missing.length}):`);
  for (const m of missing) {
    console.error(`  ${m.file}`);
    console.error(`    → ${m.error}`);
  }
}

if (errors.length > 0) {
  console.error(`\nFRONTMATTER ERRORS (${errors.length}):`);
  for (const e of errors) {
    console.error(`  ${e}`);
  }
}

console.error(`\n${missing.length + errors.length} frontmatter issue(s) found (${passed.length} passed)`);
process.exit(1);
