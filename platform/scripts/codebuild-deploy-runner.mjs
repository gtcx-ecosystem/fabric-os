#!/usr/bin/env node
/**
 * Standard CodeBuild deployment runner.
 *
 * Runs cheap gates, Terraform plan/apply, Kubernetes auth smoke, and Argo CD
 * sync/smoke according to DEPLOY_MODE. Evidence is always redacted and written
 * to audit/evidence when --write is passed.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const DEFAULT_OUT = 'audit/evidence/codebuild-deploy-runner-latest.json';
const CONTRACT_PATH = 'machine/spec/deployment-ops-contract.json';

function parseArgs(argv) {
  const args = {
    execute: false,
    write: false,
    json: false,
  };

  for (const arg of argv) {
    if (arg === '--') continue;
    if (arg === '--execute') args.execute = true;
    else if (arg === '--write') args.write = true;
    else if (arg === '--json') args.json = true;
    else if (arg === '--dry-run') args.execute = false;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg.startsWith('--mode=')) args.mode = arg.slice('--mode='.length);
    else if (arg.startsWith('--environment='))
      args.environment = arg.slice('--environment='.length);
    else if (arg.startsWith('--class-a-ref=')) args.classARef = arg.slice('--class-a-ref='.length);
    else throw new Error(`Unknown argument: ${arg}`);
  }

  return args;
}

function usage() {
  return `Usage:
  node platform/scripts/codebuild-deploy-runner.mjs --write
  node platform/scripts/codebuild-deploy-runner.mjs --write --execute

Modes via --mode or DEPLOY_MODE:
  plan | terraform-apply | argocd-sync | smoke`;
}

function truncate(value, max = 4000) {
  const text = String(value ?? '');
  return text.length > max ? text.slice(0, max) + '\n[truncated]' : text;
}

function redact(value) {
  return String(value ?? '')
    .replace(/(AWS_ACCESS_KEY_ID=)[^\s]+/g, '$1[redacted]')
    .replace(/(AWS_SECRET_ACCESS_KEY=)[^\s]+/g, '$1[redacted]')
    .replace(/(AWS_SESSION_TOKEN=)[^\s]+/g, '$1[redacted]')
    .replace(/(token|password|secret|apikey|api_key)["'=:\s]+[^"',\s]+/gi, '$1=[redacted]');
}

function runCommand(step, command, args, execute) {
  const commandPath = command;
  const toolPath = [process.env.PATH, '/usr/local/bin', '/usr/bin']
    .filter(Boolean)
    .map((entry) => entry.split(':'))
    .flat()
    .filter(Boolean);
  const path = Array.from(new Set(toolPath)).join(':');

  const record = {
    step,
    command: [commandPath, ...args],
    skipped: !execute,
    status: null,
    stdout: '',
    stderr: '',
  };

  if (!execute) return record;

  const result = spawnSync(commandPath, args, {
    cwd: ROOT,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: path,
    },
  });

  record.status = result.status;
  record.signal = result.signal;
  record.stdout = truncate(redact(result.stdout));
  record.stderr = truncate(redact(result.stderr));
  if (result.error) record.error = result.error.message;
  return record;
}

function add(commands, step, command, args) {
  commands.push({ step, command, args });
}

function buildCommands({ environment, mode, region, clusterName, appName, planPath }) {
  const envDir = `deploy/terraform/environments/${environment}`;
  const terraformCommand = process.env.TERRAFORM_BINARY ?? 'terraform';
  const kubectlCommand = process.env.KUBECTL_BINARY ?? 'kubectl';
  const argocdCommand = process.env.ARGOCD_BINARY ?? 'argocd';
  const commands = [];

  add(commands, 'operations-check', 'pnpm', ['operations:check']);
  add(commands, 'github-actions-cost-controls', 'pnpm', ['gha:cost-controls:check']);
  add(commands, 'deployment-contract', 'pnpm', ['deployment:ops:contract:check']);

  if (['plan', 'terraform-apply'].includes(mode)) {
    add(commands, 'rotation-lambda-build', 'bash', [
      'deploy/terraform/modules/secrets/lambda/build.sh',
    ]);
    add(commands, 'terraform-init', terraformCommand, ['-chdir=' + envDir, 'init', '-input=false']);
    add(commands, 'terraform-plan', terraformCommand, [
      '-chdir=' + envDir,
      'plan',
      '-input=false',
      '-out=' + planPath,
    ]);
  }

  if (mode === 'terraform-apply') {
    add(commands, 'terraform-apply', terraformCommand, [
      '-chdir=' + envDir,
      'apply',
      '-input=false',
      '-auto-approve',
      planPath,
    ]);
  }

  if (['plan', 'smoke', 'argocd-sync'].includes(mode)) {
    add(commands, 'eks-kubeconfig', 'aws', [
      'eks',
      'update-kubeconfig',
      '--region',
      region,
      '--name',
      clusterName,
      '--alias',
      `gtcx-${environment}`,
    ]);
    add(commands, 'kubectl-auth-can-i', kubectlCommand, [
      '--request-timeout=25s',
      'auth',
      'can-i',
      'get',
      'pods',
      '--all-namespaces',
    ]);
    add(commands, 'argocd-application-get', kubectlCommand, [
      '--request-timeout=25s',
      '-n',
      'argocd',
      'get',
      'application/' + appName,
      '-o',
      'json',
    ]);
  }

  if (mode === 'argocd-sync') {
    add(commands, 'argocd-sync', argocdCommand, [
      '--core',
      'app',
      'sync',
      appName,
      '--prune=false',
    ]);
    add(commands, 'argocd-wait', argocdCommand, [
      '--core',
      'app',
      'wait',
      appName,
      '--health',
      '--sync',
      '--timeout',
      '300',
    ]);
  }

  return commands;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return 0;
  }

  const environment =
    args.environment ?? process.env.DEPLOY_ENVIRONMENT ?? process.env.ENVIRONMENT ?? 'staging';
  const mode = args.mode ?? process.env.DEPLOY_MODE ?? 'plan';
  const classARef = args.classARef ?? process.env.CLASS_A_REF ?? '';
  const region = process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'af-south-1';
  const clusterName = process.env.EKS_CLUSTER_NAME ?? `gtcx-${environment}`;
  const appName =
    process.env.ARGOCD_APP ??
    (environment === 'production' ? 'fabric-production-root' : 'fabric-staging-root');
  const planPath = process.env.TF_PLAN_PATH ?? 'tfplan';
  const outRel = process.env.DEPLOY_EVIDENCE_PATH ?? DEFAULT_OUT;
  const out = join(ROOT, outRel);

  const validEnvironments = new Set(['staging', 'production']);
  const validModes = new Set(['plan', 'terraform-apply', 'argocd-sync', 'smoke']);
  if (!validEnvironments.has(environment))
    throw new Error('DEPLOY_ENVIRONMENT must be staging or production');
  if (!validModes.has(mode))
    throw new Error('DEPLOY_MODE must be plan, terraform-apply, argocd-sync, or smoke');
  if (!existsSync(join(ROOT, CONTRACT_PATH))) throw new Error(`Missing ${CONTRACT_PATH}`);

  const classARequired =
    mode === 'terraform-apply' || (environment === 'production' && mode === 'argocd-sync');
  if (classARequired && !classARef) {
    throw new Error('Class A reference required for terraform-apply and production argocd-sync');
  }

  const planned = buildCommands({ environment, mode, region, clusterName, appName, planPath });
  const results = planned.map((item) =>
    runCommand(item.step, item.command, item.args, args.execute)
  );
  const ok = results.every((item) => item.skipped || item.status === 0);

  const witness = {
    $schema: 'gtcx://fabric-os/codebuild-deploy-runner/v1',
    repo: 'fabric-os',
    generatedAt: new Date().toISOString(),
    dryRun: !args.execute,
    ok,
    authorityClass: classARequired ? 'A' : 'R',
    classARef,
    contract: CONTRACT_PATH,
    environment,
    mode,
    region,
    clusterName,
    appName,
    githubActionsCriticalPath: false,
    commands: results,
  };

  if (args.write) {
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify(witness, null, 2) + '\n');
  }

  if (args.json || args.write) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(
      `CodeBuild deploy runner ${args.execute ? 'executed' : 'dry-run'}: ${ok ? 'PASS' : 'FAIL'}`
    );
    console.log(`environment: ${environment}`);
    console.log(`mode: ${mode}`);
  }

  return ok ? 0 : 1;
}

try {
  process.exit(main());
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
