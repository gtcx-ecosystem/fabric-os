import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { describe, it } from 'node:test';

const cwd = new URL('../../..', import.meta.url);

function runNode(script, args = []) {
  return spawnSync('node', [script, ...args], {
    cwd,
    encoding: 'utf8',
  });
}

function parseJson(stdout) {
  assert.ok(stdout.trim().startsWith('{'), stdout);
  return JSON.parse(stdout);
}

describe('deployment ops CLI guardrails', () => {
  it('codebuild deploy runner emits a dry-run plan witness', () => {
    const result = runNode('platform/scripts/codebuild-deploy-runner.mjs', [
      '--environment=staging',
      '--mode=plan',
      '--json',
    ]);

    assert.equal(result.status, 0, result.stderr);
    const witness = parseJson(result.stdout);
    assert.equal(witness.dryRun, true);
    assert.equal(witness.authorityClass, 'R');
    assert.equal(witness.githubActionsCriticalPath, false);
    assert.equal(witness.environment, 'staging');
    assert.equal(witness.mode, 'plan');
    assert.ok(witness.commands.some((command) => command.step === 'terraform-plan'));
    assert.ok(witness.commands.every((command) => command.skipped === true));
  });

  it('codebuild deploy runner rejects terraform apply without Class A reference', () => {
    const result = runNode('platform/scripts/codebuild-deploy-runner.mjs', [
      '--environment=staging',
      '--mode=terraform-apply',
      '--json',
    ]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Class A reference required/);
  });

  it('codebuild start wrapper emits a dry-run start-build payload', () => {
    const result = runNode('platform/scripts/codebuild-deploy-start.mjs', [
      '--environment=staging',
      '--mode=plan',
      '--json',
    ]);

    assert.equal(result.status, 0, result.stderr);
    const witness = parseJson(result.stdout);
    assert.equal(witness.dryRun, true);
    assert.equal(witness.authorityClass, 'R');
    assert.equal(witness.projectName, 'gtcx-staging-deploy-executor');
    assert.deepEqual(witness.command.slice(0, 3), ['aws', 'codebuild', 'start-build']);
    assert.ok(witness.payload.environmentVariablesOverride.some((item) => item.name === 'GITHUB_ACTIONS_CRITICAL_PATH' && item.value === 'false'));
  });

  it('codebuild start wrapper supports Secrets Manager environment overrides', () => {
    const result = runNode('platform/scripts/codebuild-deploy-start.mjs', [
      '--environment=staging',
      '--mode=plan',
      '--secret-env=CLOUDFLARE_API_TOKEN=gtcx/staging/cloudflare-dns-api-token',
      '--json',
    ]);

    assert.equal(result.status, 0, result.stderr);
    const witness = parseJson(result.stdout);
    assert.ok(
      witness.payload.environmentVariablesOverride.some(
        (item) =>
          item.name === 'CLOUDFLARE_API_TOKEN' &&
          item.value === 'gtcx/staging/cloudflare-dns-api-token' &&
          item.type === 'SECRETS_MANAGER',
      ),
    );
  });

  it('codebuild start wrapper rejects sensitive plaintext environment overrides', () => {
    const result = runNode('platform/scripts/codebuild-deploy-start.mjs', [
      '--environment=staging',
      '--mode=plan',
      '--env=CLOUDFLARE_API_TOKEN=not-a-real-token',
      '--json',
    ]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Use --secret-env/);
  });

  it('codebuild start wrapper rejects terraform apply without Class A reference', () => {
    const result = runNode('platform/scripts/codebuild-deploy-start.mjs', [
      '--environment=staging',
      '--mode=terraform-apply',
      '--json',
    ]);

    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Class A reference required/);
  });

  it('aws cost optimization export emits dry-run commands without AWS calls', () => {
    const result = runNode('platform/scripts/cost/aws-cost-optimization-export.mjs', [
      '--region=af-south-1',
      '--hub-region=us-east-1',
      '--json',
    ]);

    assert.equal(result.status, 0, result.stderr);
    const witness = parseJson(result.stdout);
    assert.equal(witness.dryRun, true);
    assert.equal(witness.ok, true);
    assert.ok(witness.commands.some((command) => command.id === 'cost-optimization-hub-recommendations'));
    assert.ok(witness.commands.some((command) => command.id === 'compute-optimizer-ec2'));
    assert.ok(witness.commands.every((command) => command.skipped === true));
  });
});
