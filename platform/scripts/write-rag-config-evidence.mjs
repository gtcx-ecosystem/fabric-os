#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const evidence = join(ROOT, 'audit/evidence/rag-config-latest.json');
const check = spawnSync(process.execPath, ['../baseline-os/platform/scripts/validate-rag-config.mjs', '--root', '.'], {
  cwd: ROOT,
  encoding: 'utf8',
});

const result = {
  schema: 'gtcx://fabric-os/rag-config-check/v1',
  generatedAt: new Date().toISOString(),
  repo: 'fabric-os',
  ok: check.status === 0,
  config: 'config/baseline/rag.config.json',
  exit: check.status ?? 1,
  detail: check.status === 0 ? 'validate-rag-config passed' : `${check.stdout ?? ''}${check.stderr ?? ''}`.trim(),
};

mkdirSync(dirname(evidence), { recursive: true });
writeFileSync(evidence, `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
process.exit(result.ok ? 0 : 1);
