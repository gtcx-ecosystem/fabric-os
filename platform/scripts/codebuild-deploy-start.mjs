#!/usr/bin/env node
/**
 * Starts, or dry-runs, the AWS CodeBuild deploy executor.
 *
 * Default is dry-run. Use --execute only after the corresponding Class A
 * approval artifact exists for production apply/sync operations.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const CONTRACT_PATH = 'machine/spec/deployment-ops-contract.json';
const OUT = join(ROOT, 'audit/evidence/codebuild-deploy-start-latest.json');

function parseArgs(argv) {
  const args = {
    environment: 'staging',
    mode: 'plan',
    execute: false,
    write: false,
    json: false,
    env: {},
    secretEnv: {},
  };

  for (const arg of argv) {
    if (arg === '--') continue;
    if (arg === '--execute') args.execute = true;
    else if (arg === '--write') args.write = true;
    else if (arg === '--json') args.json = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else if (arg.startsWith('--environment=')) args.environment = arg.slice('--environment='.length);
    else if (arg.startsWith('--mode=')) args.mode = arg.slice('--mode='.length);
    else if (arg.startsWith('--project-name=')) args.projectName = arg.slice('--project-name='.length);
    else if (arg.startsWith('--source-version=')) args.sourceVersion = arg.slice('--source-version='.length);
    else if (arg.startsWith('--commit=')) args.commit = arg.slice('--commit='.length);
    else if (arg.startsWith('--image-digest=')) args.imageDigest = arg.slice('--image-digest='.length);
    else if (arg.startsWith('--class-a-ref=')) args.classARef = arg.slice('--class-a-ref='.length);
    else if (arg.startsWith('--region=')) args.region = arg.slice('--region='.length);
    else if (arg.startsWith('--env=')) {
      const pair = arg.slice('--env='.length);
      const idx = pair.indexOf('=');
      if (idx === -1) throw new Error('--env must be NAME=VALUE');
      args.env[pair.slice(0, idx)] = pair.slice(idx + 1);
    } else if (arg.startsWith('--secret-env=')) {
      const pair = arg.slice('--secret-env='.length);
      const idx = pair.indexOf('=');
      if (idx === -1) throw new Error('--secret-env must be NAME=SECRETS_MANAGER_REFERENCE');
      args.secretEnv[pair.slice(0, idx)] = pair.slice(idx + 1);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function usage() {
  return `Usage:
  pnpm deployment:codebuild:start -- --environment=staging --mode=plan --write
  pnpm deployment:codebuild:start -- --environment=production --mode=terraform-apply --class-a-ref=XR-123 --execute

Modes:
  plan | terraform-apply | argocd-sync | smoke

Notes:
  - Default is dry-run; no AWS call is made without --execute.
  - Production terraform-apply and argocd-sync require --class-a-ref.
  - Use --secret-env=NAME=SECRET_ID for CodeBuild SECRETS_MANAGER variables.
  - GitHub Actions is not used as the production deploy executor.`;
}

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function codebuildEnv(name, value, type = 'PLAINTEXT') {
  return {
    name,
    value: String(value),
    type,
  };
}

function assertSafePlaintextEnv(env, secretEnv) {
  const secretNames = new Set(Object.keys(secretEnv));
  const sensitiveName = /(TOKEN|SECRET|PASSWORD|API_KEY|ACCESS_KEY|PRIVATE_KEY)/i;

  for (const name of Object.keys(env)) {
    if (secretNames.has(name)) {
      throw new Error(`Environment variable ${name} cannot be set by both --env and --secret-env`);
    }
    if (sensitiveName.test(name)) {
      throw new Error(`Use --secret-env for sensitive environment variable ${name}`);
    }
  }
}

function buildPayload(args, contract) {
  const environment = args.environment;
  const projectName = args.projectName ?? `gtcx-${environment}-deploy-executor`;
  const region = args.region ?? contract.runtimeCloud?.region ?? 'af-south-1';
  const mode = args.mode;

  const env = {
    DEPLOY_MODE: mode,
    DEPLOY_ENVIRONMENT: environment,
    DEPLOYMENT_OPS_CONTRACT: CONTRACT_PATH,
    GITHUB_ACTIONS_CRITICAL_PATH: 'false',
    CLASS_A_REF: args.classARef ?? '',
    GIT_COMMIT: args.commit ?? '',
    IMAGE_DIGEST: args.imageDigest ?? '',
    ...args.env,
  };

  assertSafePlaintextEnv(env, args.secretEnv);

  const payload = {
    projectName,
    region,
    environmentVariablesOverride: [
      ...Object.entries(env).map(([name, value]) => codebuildEnv(name, value)),
      ...Object.entries(args.secretEnv).map(([name, value]) => codebuildEnv(name, value, 'SECRETS_MANAGER')),
    ],
  };

  if (args.sourceVersion) payload.sourceVersion = args.sourceVersion;
  return payload;
}

function toAwsArgs(payload) {
  const args = [
    'codebuild',
    'start-build',
    '--region',
    payload.region,
    '--project-name',
    payload.projectName,
  ];

  if (payload.sourceVersion) args.push('--source-version', payload.sourceVersion);
  args.push('--environment-variables-override', JSON.stringify(payload.environmentVariablesOverride));
  return args;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return 0;
  }

  const validEnvironments = new Set(['staging', 'production']);
  const validModes = new Set(['plan', 'terraform-apply', 'argocd-sync', 'smoke']);

  if (!validEnvironments.has(args.environment)) throw new Error('--environment must be staging or production');
  if (!validModes.has(args.mode)) throw new Error('--mode must be plan, terraform-apply, argocd-sync, or smoke');
  if (!existsSync(join(ROOT, CONTRACT_PATH))) throw new Error(`Missing ${CONTRACT_PATH}`);

  const classARequired = args.mode === 'terraform-apply' || (args.environment === 'production' && args.mode === 'argocd-sync');
  if (classARequired && !args.classARef) {
    throw new Error('Class A reference required for terraform-apply and production argocd-sync');
  }

  const contract = readJson(CONTRACT_PATH);
  const payload = buildPayload(args, contract);
  const awsArgs = toAwsArgs(payload);
  const command = ['aws', ...awsArgs];

  const witness = {
    $schema: 'gtcx://fabric-os/codebuild-deploy-start/v1',
    repo: 'fabric-os',
    generatedAt: new Date().toISOString(),
    dryRun: !args.execute,
    authorityClass: classARequired ? 'A' : 'R',
    contract: CONTRACT_PATH,
    mode: args.mode,
    environment: args.environment,
    githubActionsCriticalPath: false,
    projectName: payload.projectName,
    region: payload.region,
    payload,
    command,
    result: null,
  };

  if (args.execute) {
    const result = spawnSync('aws', awsArgs, { cwd: ROOT, encoding: 'utf8' });
    witness.result = {
      status: result.status,
      signal: result.signal,
      stdout: result.stdout,
      stderr: result.stderr,
    };
    if (result.error) {
      witness.result.error = result.error.message;
    }
  }

  if (args.write) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, JSON.stringify(witness, null, 2) + '\n');
  }

  if (args.json || args.write) {
    console.log(JSON.stringify(witness, null, 2));
  } else {
    console.log(`CodeBuild deploy ${args.execute ? 'start' : 'dry-run'} prepared`);
    console.log(`project: ${payload.projectName}`);
    console.log(`mode: ${args.mode}`);
    console.log(`environment: ${args.environment}`);
    console.log(`command: ${command.join(' ')}`);
  }

  if (args.execute && witness.result?.status !== 0) return witness.result?.status ?? 1;
  return 0;
}

try {
  process.exit(main());
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
