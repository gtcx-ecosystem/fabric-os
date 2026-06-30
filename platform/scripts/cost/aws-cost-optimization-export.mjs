#!/usr/bin/env node
/**
 * AWS Cost Optimization Hub / Compute Optimizer export witness.
 *
 * Default is dry-run. Use --execute only in a credentialed AWS session.
 */
import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../..');
const OUT = join(ROOT, 'audit/evidence/aws-cost-optimization-export-latest.json');

function parseArgs(argv) {
  const args = {
    execute: false,
    write: false,
    json: false,
    region: process.env.AWS_REGION ?? process.env.AWS_DEFAULT_REGION ?? 'af-south-1',
    hubRegion: process.env.AWS_COST_HUB_REGION ?? 'us-east-1',
  };

  for (const arg of argv) {
    if (arg === '--') continue;
    if (arg === '--execute') args.execute = true;
    else if (arg === '--write') args.write = true;
    else if (arg === '--json') args.json = true;
    else if (arg.startsWith('--region=')) args.region = arg.slice('--region='.length);
    else if (arg.startsWith('--hub-region=')) args.hubRegion = arg.slice('--hub-region='.length);
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return args;
}

function usage() {
  return `Usage:
  pnpm finops:aws-optimization:export -- --write
  pnpm finops:aws-optimization:export -- --write --execute

Options:
  --region=<aws-region>      Workload region, default af-south-1
  --hub-region=<aws-region>  Cost Optimization Hub region, default us-east-1`;
}

function truncate(value, max = 8000) {
  const text = String(value ?? '');
  return text.length > max ? text.slice(0, max) + '\n[truncated]' : text;
}

function safeParseJson(text) {
  if (!text || !text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function runCommand(item, execute) {
  const record = {
    id: item.id,
    purpose: item.purpose,
    command: ['aws', ...item.args],
    skipped: !execute,
    status: null,
    stdoutJson: null,
    stdout: '',
    stderr: '',
  };

  if (!execute) return record;

  const result = spawnSync('aws', item.args, {
    cwd: ROOT,
    encoding: 'utf8',
    timeout: 120_000,
  });

  record.status = result.status;
  record.signal = result.signal;
  record.stdoutJson = safeParseJson(result.stdout);
  record.stdout = record.stdoutJson ? '' : truncate(result.stdout);
  record.stderr = truncate(result.stderr);
  if (result.error) record.error = result.error.message;
  return record;
}

function commands({ region, hubRegion }) {
  return [
    {
      id: 'cost-optimization-hub-recommendations',
      purpose: 'Fleet-level savings recommendations across supported AWS services.',
      args: ['cost-optimization-hub', 'list-recommendations', '--region', hubRegion, '--max-results', '100'],
    },
    {
      id: 'compute-optimizer-ec2',
      purpose: 'EC2 right-sizing recommendations for workload compute.',
      args: ['compute-optimizer', 'get-ec2-instance-recommendations', '--region', region],
    },
    {
      id: 'compute-optimizer-asg',
      purpose: 'Auto Scaling group right-sizing recommendations for node groups.',
      args: ['compute-optimizer', 'get-auto-scaling-group-recommendations', '--region', region],
    },
    {
      id: 'compute-optimizer-ebs',
      purpose: 'EBS volume right-sizing recommendations.',
      args: ['compute-optimizer', 'get-ebs-volume-recommendations', '--region', region],
    },
    {
      id: 'compute-optimizer-lambda',
      purpose: 'Lambda memory and architecture recommendations.',
      args: ['compute-optimizer', 'get-lambda-function-recommendations', '--region', region],
    },
  ];
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return 0;
  }

  const planned = commands(args);
  const results = planned.map((item) => runCommand(item, args.execute));
  const ok = args.execute ? results.every((item) => item.status === 0) : true;

  const witness = {
    $schema: 'gtcx://fabric-os/aws-cost-optimization-export/v1',
    repo: 'fabric-os',
    generatedAt: new Date().toISOString(),
    dryRun: !args.execute,
    ok,
    region: args.region,
    hubRegion: args.hubRegion,
    deploymentOpsContract: 'machine/spec/deployment-ops-contract.json',
    finopsContract: 'machine/spec/finops-as-a-service.json',
    commands: results,
  };

  if (args.write) {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, JSON.stringify(witness, null, 2) + '\n');
  }

  if (args.json || args.write) console.log(JSON.stringify(witness, null, 2));
  else {
    console.log(`AWS cost optimization export ${args.execute ? 'executed' : 'dry-run'}: ${ok ? 'PASS' : 'FAIL'}`);
    console.log(`region: ${args.region}`);
    console.log(`hubRegion: ${args.hubRegion}`);
  }

  return ok ? 0 : 1;
}

try {
  process.exit(main());
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
