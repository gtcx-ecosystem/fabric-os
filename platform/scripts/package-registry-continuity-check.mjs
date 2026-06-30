#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const WRITE = process.argv.includes('--write');
const OUT = join(ROOT, 'audit/evidence/package-registry-continuity-latest.json');

const paths = {
  spec: 'machine/spec/package-registry-continuity.json',
  runbook: 'docs/operations/runbooks/package-registry-continuity.md',
  moduleMain: 'deploy/terraform/modules/codeartifact-npm-registry/main.tf',
  moduleVars: 'deploy/terraform/modules/codeartifact-npm-registry/variables.tf',
  moduleOutputs: 'deploy/terraform/modules/codeartifact-npm-registry/outputs.tf',
  moduleTest: 'deploy/terraform/modules/codeartifact-npm-registry/codeartifact-npm-registry.tftest.hcl',
  codebuildModule: 'deploy/terraform/modules/codebuild-deploy-executor/main.tf',
  npmReadiness: 'platform/scripts/ci-npm-token-readiness.mjs',
  liveValidation: 'audit/evidence/package-registry-live-validation-latest.json',
  ledgerUiPublisher: 'deploy/codebuild/package-registry-publish-ledger-ui.sh',
  ledgerUiConsumption: 'audit/evidence/ledger-ui-codeartifact-consumption-latest.json',
};

function text(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

const gates = {};
for (const [name, rel] of Object.entries(paths)) {
  gates[`file:${name}`] = { ok: existsSync(join(ROOT, rel)), path: rel };
}

const spec = gates['file:spec'].ok ? JSON.parse(text(paths.spec)) : {};
const moduleMain = gates['file:moduleMain'].ok ? text(paths.moduleMain) : '';
const codebuildModule = gates['file:codebuildModule'].ok ? text(paths.codebuildModule) : '';
const runbook = gates['file:runbook'].ok ? text(paths.runbook) : '';
const liveValidation = gates['file:liveValidation'].ok ? JSON.parse(text(paths.liveValidation)) : {};
const ledgerUiConsumption = gates['file:ledgerUiConsumption'].ok
  ? JSON.parse(text(paths.ledgerUiConsumption))
  : {};

gates['spec:two-lanes'] = {
  ok: spec.lanes?.internalRegistry?.provider === 'aws-codeartifact' && spec.lanes?.publicNpm?.provider === 'npmjs',
};
gates['spec:codeartifact-no-npm-token'] = {
  ok: /no long-lived NPM_TOKEN required/.test(spec.lanes?.internalRegistry?.credentialModel || ''),
};
gates['spec:codeartifact-supported-region'] = {
  ok: spec.lanes?.internalRegistry?.region === 'eu-west-1' && /eu-west-1/.test(runbook),
};
gates['terraform:domain'] = { ok: /resource "aws_codeartifact_domain" "this"/.test(moduleMain) };
gates['terraform:repository'] = {
  ok: /resource "aws_codeartifact_repository" "npm_internal"/.test(moduleMain),
};
gates['terraform:npmjs-upstream'] = { ok: /public:npmjs/.test(moduleMain) };
gates['terraform:runner-codeartifact-auth'] = {
  ok:
    /CodeArtifactNpmAuth/.test(codebuildModule) &&
    /codeartifact:GetAuthorizationToken/.test(codebuildModule) &&
    /codeartifact:PublishPackageVersion/.test(codebuildModule) &&
    /sts:GetServiceBearerToken/.test(codebuildModule),
};
gates['runbook:both-lanes'] = { ok: /CodeArtifact internal registry/.test(runbook) && /New npm account/.test(runbook) };
gates['runbook:ledger-ui-consumption'] = {
  ok:
    /ledger-ui consumption/.test(runbook) &&
    /gtcx-staging-deploy-executor:9bf69523-617a-438d-a066-95f24af0c603/.test(runbook),
};
gates['runbook:vault-sor'] = { ok: /Baseline vault/.test(runbook) && /NPM_TOKEN/.test(runbook) };
gates['runbook:npm-account-checklist'] = {
  ok: /Operator Checklist/.test(runbook) && /npm login/.test(runbook) && /npm whoami/.test(runbook),
};
gates['runbook:npm-acceptance'] = {
  ok: /Acceptance Criteria/.test(runbook) && /publish:enterprise:check:quick/.test(runbook),
};
gates['live:runner-npm-ping'] = {
  ok:
    liveValidation.runner?.buildStatus === 'SUCCEEDED' &&
    liveValidation.validation?.codeartifactLogin === 'SUCCEEDED' &&
    liveValidation.validation?.npmPing === 'PONG',
};
gates['ledger-ui:publish-proof'] = {
  ok:
    ledgerUiConsumption.publishProof?.buildStatus === 'SUCCEEDED' &&
    ledgerUiConsumption.publishProof?.buildId ===
      'gtcx-staging-deploy-executor:2f805ac3-3c0e-4aca-8a18-267a1f5ea5cf',
};
gates['ledger-ui:clean-install-proof'] = {
  ok:
    ledgerUiConsumption.consumptionProof?.buildStatus === 'SUCCEEDED' &&
    ledgerUiConsumption.consumptionProof?.installed?.['@gtcx/ui'] === '0.4.2' &&
    ledgerUiConsumption.consumptionProof?.installed?.['@gtcx/desk-shell'] === '0.1.0' &&
    ledgerUiConsumption.consumptionProof?.installed?.['@gtcx/pages'] === '0.1.8',
};
gates['ledger-ui:publisher-script'] = {
  ok:
    gates['file:ledgerUiPublisher'].ok &&
    /describe-package-version/.test(text(paths.ledgerUiPublisher)) &&
    /exists in externally connected repository/.test(text(paths.ledgerUiPublisher)),
};

const ok = Object.values(gates).every((gate) => gate.ok);
const witness = {
  schema: 'gtcx://fabric-os/package-registry-continuity-check/v1',
  checkedAt: new Date().toISOString(),
  ok,
  gates,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
}

for (const [name, gate] of Object.entries(gates)) {
  console.log(`${gate.ok ? 'OK' : 'FAIL'} ${name}${gate.path ? ` — ${gate.path}` : ''}`);
}
console.log(`\n${ok ? 'PASS' : 'FAIL'} — package registry continuity`);
if (WRITE) console.log(`witness: ${OUT}`);
process.exit(ok ? 0 : 1);
