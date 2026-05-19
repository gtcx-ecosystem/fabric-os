#!/usr/bin/env node
/**
 * @fileoverview Master Validation Script
 *
 * Runs all GTCX infrastructure validation gates in sequence.
 * Exits 0 only if ALL gates pass.
 *
 * Usage: node tools/scripts/validate-all.mjs
 */

import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

let totalPassed = 0;
let totalFailed = 0;

function run(name, command, cwd) {
  process.stdout.write(`[VALIDATE] ${name} ... `);
  try {
    execSync(command, {
      cwd: cwd || process.cwd(),
      stdio: 'pipe',
      encoding: 'utf8',
      timeout: 120000,
    });
    console.log(`${GREEN}PASS${RESET}`);
    totalPassed++;
    return true;
  } catch (e) {
    console.log(`${RED}FAIL${RESET}`);
    const stderr = e.stderr || e.message || '';
    const lines = stderr.split('\n').filter((l) => l.trim());
    for (const line of lines.slice(0, 5)) {
      console.log(`  ${RED}>${RESET} ${line}`);
    }
    totalFailed++;
    return false;
  }
}

function section(title) {
  console.log(`\n${YELLOW}=== ${title} ===${RESET}`);
}

// =============================================================================
// 1. Coverage Gates
// =============================================================================
section('Coverage Gates');

const packages = [
  'tools/compliance-gateway',
  'tools/replay-protection',
  'tools/deployment-guard',
  'tools/ussd-handler',
  'tools/low-bandwidth',
  'tools/audit-signer',
];

for (const pkg of packages) {
  if (existsSync(`${pkg}/package.json`)) {
    run(pkg, 'pnpm run test:coverage:gate', pkg);
  }
}

// =============================================================================
// 2. Static Validators
// =============================================================================
section('Static Validators');

run('SIGNAL Scorecard', 'node tools/scripts/validate-signal.mjs');
run('Score Ledger', 'node tools/scripts/validate-score-ledger.mjs');
run('Docs Standard', 'node tools/scripts/docs-standard-validator.mjs');
run('Kyverno Policies', 'node tools/scripts/kyverno-policy-validator.mjs');

// =============================================================================
// 3. Security Validators
// =============================================================================
section('Security Validators');

run('Mesh Injection (prod)', 'node tools/scripts/verify-mesh-injection.mjs --namespace gtcx');
run('Mesh Injection (staging)', 'node tools/scripts/verify-mesh-injection.mjs --namespace gtcx-staging');

// =============================================================================
// 4. Build Validators
// =============================================================================
section('Build Validators');

run('Reproducible Build (dry)', 'node tools/scripts/verify-reproducible-build.mjs');

// =============================================================================
// Summary
// =============================================================================
console.log(`\n${YELLOW}=== Summary ===${RESET}`);
console.log(`Passed: ${GREEN}${totalPassed}${RESET}`);
console.log(`Failed: ${RED}${totalFailed}${RESET}`);

if (totalFailed > 0) {
  console.log(`\n${RED}VALIDATION FAILED${RESET}: ${totalFailed} gate(s) did not pass`);
  process.exit(1);
}

console.log(`\n${GREEN}VALIDATION PASSED${RESET}: all ${totalPassed} gate(s) passed`);
process.exit(0);
