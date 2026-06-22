#!/usr/bin/env node
/**
 * Hub reconcile — refresh execution roadmap + P29 machine sync (baseline hub-sync hook).
 */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

for (const [cmd, args] of [
  ['pnpm', ['generate:roadmap']],
  ['pnpm', ['machine:sync']],
]) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', cwd: root, shell: cmd === 'pnpm' });
  if ((r.status ?? 1) !== 0) process.exit(r.status ?? 1);
}

console.log('hub-reconcile: OK — execution-roadmap + machine sync');
