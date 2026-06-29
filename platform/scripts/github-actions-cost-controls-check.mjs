import fs from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();
const workflowDir = path.join(repoRoot, '.github', 'workflows');
const policyPath = path.join(repoRoot, 'machine', 'spec', 'github-actions-cost-controls.json');
const policy = JSON.parse(fs.readFileSync(policyPath, 'utf8'));

const workflowFiles = fs
  .readdirSync(workflowDir)
  .filter((file) => file.endsWith('.yml') || file.endsWith('.yaml'))
  .sort();

const violations = [];

function addViolation(file, message) {
  violations.push(`${file}: ${message}`);
}

function hasSchedule(text) {
  return /^\s{2}schedule:\s*$/m.test(text);
}

function hasCancelInProgress(text) {
  return /^\s*cancel-in-progress:\s*true\s*$/m.test(text);
}

function hasTopLevelConcurrency(text) {
  return /^concurrency:\s*$/m.test(text);
}

function scheduledJobsMissingTimeouts(text) {
  const lines = text.split(/\r?\n/);
  const missing = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const runsOn = line.match(/^(\s{4})runs-on:\s*(.+)\s*$/);
    if (!runsOn) continue;

    const jobName = findJobName(lines, index);
    let foundTimeout = false;

    for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
      if (/^\s{2}[A-Za-z0-9_-]+:\s*$/.test(lines[cursor])) break;
      if (/^\s{4}timeout-minutes:\s*\d+\s*$/.test(lines[cursor])) {
        foundTimeout = true;
        break;
      }
    }

    if (!foundTimeout) missing.push(jobName ?? `job near line ${index + 1}`);
  }

  return missing;
}

function findJobName(lines, runsOnIndex) {
  for (let cursor = runsOnIndex; cursor >= 0; cursor -= 1) {
    const match = lines[cursor].match(/^\s{2}([A-Za-z0-9_-]+):\s*$/);
    if (match) return match[1];
  }
  return null;
}

for (const file of workflowFiles) {
  const relativePath = path.join('.github', 'workflows', file);
  const absolutePath = path.join(workflowDir, file);
  const text = fs.readFileSync(absolutePath, 'utf8');
  const lower = text.toLowerCase();

  for (const runner of policy.scope.disallowedRunners) {
    if (lower.includes(runner.toLowerCase())) {
      addViolation(relativePath, `disallowed runner ${runner}`);
    }
  }

  for (const providerRef of policy.scope.disallowedDeploymentProviderRefs) {
    if (lower.includes(providerRef.toLowerCase())) {
      addViolation(relativePath, `retired deployment provider reference ${providerRef}`);
    }
  }

  if (hasSchedule(text)) {
    if (!hasTopLevelConcurrency(text)) {
      addViolation(relativePath, 'scheduled workflow missing top-level concurrency');
    }

    if (!hasCancelInProgress(text)) {
      addViolation(relativePath, 'scheduled workflow must use cancel-in-progress: true');
    }

    const missingTimeouts = scheduledJobsMissingTimeouts(text);
    for (const job of missingTimeouts) {
      addViolation(relativePath, `scheduled job missing timeout-minutes (${job})`);
    }
  }
}

if (violations.length > 0) {
  console.error('GitHub Actions cost-control check failed:');
  for (const violation of violations) console.error(`- ${violation}`);
  process.exit(1);
}

console.log(`GitHub Actions cost-control check passed (${workflowFiles.length} workflows).`);
