#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const REPO = 'fabric-os';
const KIND = process.argv.includes('--kind') ? process.argv[process.argv.indexOf('--kind') + 1] : null;
const WRITE = process.argv.includes('--write');

const CONFIGS = {
  mcp: {
    path: 'config/baseline/mcp.config.json',
    schema: 'gtcx://ecosystem-os/mcp-config/v1',
    evidence: 'audit/evidence/mcp-config-latest.json',
    required: ['repo', 'mode', 'server', 'tools', 'permissions', 'humanApprovalRequired'],
  },
  graph: {
    path: 'config/baseline/graph.config.json',
    schema: 'gtcx://ecosystem-os/graph-config/v1',
    evidence: 'audit/evidence/graph-projection-latest.json',
    required: ['repo', 'entities', 'relations', 'evidencePaths', 'exclude'],
  },
  eval: {
    path: 'config/baseline/eval.config.json',
    schema: 'gtcx://ecosystem-os/eval-config/v1',
    evidence: 'audit/evidence/eval-config-latest.json',
    required: ['repo', 'goldenSets', 'qualityGates', 'releaseGates'],
  },
};

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function isMissing(value) {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function validate(kind) {
  const spec = CONFIGS[kind];
  if (!spec) return { ok: false, issues: [`unknown kind: ${kind ?? '(missing)'}`] };

  const fullPath = join(ROOT, spec.path);
  const issues = [];
  let config = null;

  if (!existsSync(fullPath)) {
    issues.push(`missing ${spec.path}`);
  } else {
    try {
      config = readJson(fullPath);
    } catch (err) {
      issues.push(`parse ${spec.path}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (config) {
    if (config.$schema !== spec.schema) issues.push(`${spec.path}: schema mismatch`);
    if (config.repo !== REPO) issues.push(`${spec.path}: repo must be ${REPO}`);
    for (const key of spec.required) {
      if (isMissing(config[key])) issues.push(`${spec.path}: missing ${key}`);
    }
  }

  if (kind === 'mcp' && config) {
    for (const tool of config.tools ?? []) {
      if (!tool.id || !tool.permissionClass) issues.push(`${spec.path}: tool missing id/permissionClass`);
    }
  }

  if (kind === 'eval' && config) {
    for (const golden of config.goldenSets ?? []) {
      if (!existsSync(join(ROOT, golden))) issues.push(`${spec.path}: missing golden set ${golden}`);
    }
  }

  const result = {
    schema: `gtcx://${REPO}/${kind}-config-check/v1`,
    generatedAt: new Date().toISOString(),
    repo: REPO,
    kind,
    ok: issues.length === 0,
    config: spec.path,
    issues,
  };

  if (kind === 'graph') {
    result.nodeCount = config?.entities?.length ?? 0;
    result.edgeTypeCount = config?.relations?.length ?? 0;
  }

  if (WRITE && spec.evidence) {
    const evidence = join(ROOT, spec.evidence);
    mkdirSync(dirname(evidence), { recursive: true });
    writeFileSync(evidence, `${JSON.stringify(result, null, 2)}\n`);
  }

  return result;
}

if (!KIND) {
  console.error('Usage: node platform/scripts/validate-split-ai-config.mjs --kind <mcp|graph|eval> [--write]');
  process.exit(2);
}

const result = validate(KIND);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
