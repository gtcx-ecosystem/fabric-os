#!/usr/bin/env node
/**
 * SECAS-S2-02 — fleet ingest automation witness (fabric owner → bridge fleet copy).
 * Derives automationReady from live secas:pentest:ingest:check + calendar window.
 *
 * Usage: node platform/scripts/secas-ingest-automation-witness.mjs [--write]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const BRIDGE = join(ROOT, '..', 'bridge-os');
const INGEST_READY = join(ROOT, 'audit/evidence/pen-test-report-ingest-ready-2026-06-12.json');
const INGEST_CHECK = join(ROOT, 'audit/evidence/secas-pentest-ingest-check-latest.json');
const REMEDIATION_CHECK = join(ROOT, 'audit/evidence/secas-pentest-remediation-check-latest.json');
const FABRIC_OUT = join(ROOT, 'audit/evidence/secas-ingest-automation-latest.json');
const BRIDGE_OUT = join(BRIDGE, 'machine/ci/secas-ingest-automation-latest.json');
const WRITE = process.argv.includes('--write');

function readJson(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

function runIngestCheckWrite() {
  const r = spawnSync('node', ['platform/scripts/secas-pentest-ingest-check.mjs', '--write'], {
    cwd: ROOT,
    encoding: 'utf8',
  });
  return r.status === 0;
}

const ingestReady = readJson(INGEST_READY);
const window = ingestReady?.window ?? { start: '2026-06-17', end: '2026-06-21' };
const windowEnd = new Date(`${window.end}T23:59:59.999Z`);
const now = new Date();

if (WRITE) runIngestCheckWrite();

const ingestCheck = readJson(INGEST_CHECK);
const remediation = readJson(REMEDIATION_CHECK);
const phase = ingestCheck?.phase ?? 'unknown';
const storyComplete = ingestCheck?.storyComplete === true;
const engineeringComplete = phase === 'internal_closure_complete' || storyComplete;
const preWindowOk = ingestCheck?.ok === true && phase === 'awaiting_vendor_report';
const postWindow = now >= windowEnd;
const reportIngested = phase === 'report_ingested' || engineeringComplete;

let automationReady = false;
let blockedReason = null;
let milestoneUnblock = { ready: false, phase: remediation?.phase ?? phase };

if (engineeringComplete) {
  automationReady = true;
  blockedReason = null;
  milestoneUnblock = {
    ready: true,
    phase: 'internal_closure_complete',
    note: 'Internal SECAS engineering complete; vendor calendar deferred-post-launch only (blocksAnyRepo: false)',
    unblocks: ['SECAS-S4-04', 'SECAS-S2-01', 'PROG-SECAS-PENTEST'],
  };
} else if (preWindowOk) {
  automationReady = true;
  blockedReason = null;
  milestoneUnblock = {
    ready: false,
    phase: 'awaiting_vendor_report',
    note: 'Pre-window Class R automation wired; vendor report delivery Class S until window closes',
  };
} else if (reportIngested) {
  automationReady = true;
  milestoneUnblock = {
    ready: true,
    phase: remediation?.phase ?? 'report_ingested_pending_mapping',
    unblocks: ['SECAS-S4-04', 'PROG-SECAS-PENTEST'],
    command: 'pnpm secas:pentest:remediation:check:write',
  };
} else if (postWindow && !reportIngested) {
  automationReady = true;
  blockedReason = 'post_window_awaiting_vendor_report_class_s';
  milestoneUnblock = {
    ready: false,
    phase: 'post_window_hold',
    note: 'Window closed — vendor report delivery Class S; engineering lanes continue (blocksIR:false)',
  };
} else {
  blockedReason = ingestCheck?.ok ? null : 'ingest_check_not_ready';
}

const witness = {
  schema: 'gtcx://bridge-os/secas-ingest-automation/v1',
  generatedAt: new Date().toISOString(),
  storyId: 'SECAS-S2-01',
  intakeStoryId: 'SECAS-S2-02',
  owner: 'fabric-os',
  window,
  automationReady,
  preWindowClassR: {
    ingestScript: 'fabric-os/platform/scripts/secas-pentest-report-ingest.mjs',
    checkScript: 'fabric-os/platform/scripts/secas-pentest-ingest-check.mjs',
    witnessPath: 'audit/evidence/secas-ingest-automation-latest.json',
    status: preWindowOk || reportIngested ? 'PASS' : 'PENDING',
    phase,
  },
  postWindowAutomation: {
    trigger: `calendar >= ${window.end}T23:59:59Z OR report ingested`,
    command: 'pnpm secas:pentest:report:ingest -- --input=<vendor-report.json>',
    onSuccess: 'milestoneUnblock → SECAS-S4-04 remediation track + fleet P0 redirect',
    onMissingReport: postWindow && !reportIngested ? 'Class S hold — human vendor delivery only' : null,
    chain: [
      'secas:pentest:report:ingest',
      'secas:pentest:ingest:check:write',
      'secas:pentest:remediation:check:write',
      'secas:ingest:automation:check:write',
    ],
  },
  milestoneUnblock,
  parallelLane: {
    blocksIR: false,
    blocksAnyRepo: false,
    productRepoRule: 'Vendor/pen-test calendar is post-launch external only — never blocks P22 on any repo',
    routingSpec: 'bridge-os/pm/spec/vendor-assurance-status-update-routing.json',
  },
  blockedReason,
  sources: {
    ingestCheck: existsSync(INGEST_CHECK) ? INGEST_CHECK.slice(ROOT.length + 1) : null,
    remediationCheck: existsSync(REMEDIATION_CHECK)
      ? REMEDIATION_CHECK.slice(ROOT.length + 1)
      : null,
  },
};

const ok = automationReady === true;

if (WRITE) {
  mkdirSync(dirname(FABRIC_OUT), { recursive: true });
  writeFileSync(FABRIC_OUT, `${JSON.stringify(witness, null, 2)}\n`);
  if (existsSync(dirname(BRIDGE_OUT))) {
    mkdirSync(dirname(BRIDGE_OUT), { recursive: true });
    writeFileSync(BRIDGE_OUT, `${JSON.stringify(witness, null, 2)}\n`);
  }
}

console.log('=== secas:ingest:automation:check ===\n');
console.log(`phase: ${phase}`);
console.log(`automationReady: ${automationReady}`);
console.log(`milestoneUnblock.ready: ${milestoneUnblock.ready}`);
if (blockedReason) console.log(`blockedReason: ${blockedReason}`);
console.log(`\n${ok ? 'PASS' : 'FAIL'}`);
if (WRITE) {
  console.log(`witness: ${FABRIC_OUT.slice(ROOT.length + 1)}`);
  if (existsSync(BRIDGE_OUT)) console.log(`fleet copy: bridge-os/pm/ci/secas-ingest-automation-latest.json`);
}
process.exit(ok ? 0 : 1);
