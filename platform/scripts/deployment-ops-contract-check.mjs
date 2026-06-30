#!/usr/bin/env node
/**
 * Deployment ops contract checker.
 * Enforces the fabric-os GitHub-billing-independent deploy posture:
 * GitHub source control only, AWS CodeBuild execution, Argo CD delivery.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = join(ROOT, 'audit/evidence/deployment-ops-contract-check-latest.json');
const WRITE = process.argv.includes('--write');
const JSON_OUT = process.argv.includes('--json');

function readJson(rel) {
  return JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
}

function readText(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

function hasAll(value, expected) {
  return expected.every((item) => Array.isArray(value) && value.includes(item));
}

const gates = [];
function gate(id, ok, detail = '') {
  gates.push({ id, ok: Boolean(ok), detail });
}

const requiredFiles = [
  'machine/spec/deployment-ops-contract.json',
  'machine/spec/deployment-fleet-matrix.json',
  'operations/deployment-profile.json',
  'operations/fabric-contract.json',
  'machine/spec/mlops-bridge-contract.json',
  'machine/spec/retained-resource-identifiers.json',
  'machine/spec/finops-as-a-service.json',
  'machine/spec/github-actions-cost-controls.json',
  'docs/operations/deployment/README.md',
  'docs/operations/deployment/agent-deployment-ops-instructions-2026-06-30.md',
  'docs/operations/deployment/infra-ai-cost-strategy-2026-06-30.md',
  'docs/operations/deployment/github-billing-independent-deploy-handoff-2026-06-30.md',
  'docs/operations/deployment/fleet-deployment-matrix-2026-06-30.md',
  'docs/operations/platform-services/devops-as-a-service.md',
  'docs/operations/runbooks/finops-as-a-service.md',
  'platform/scripts/cost/aws-cost-optimization-export.mjs',
  'deploy/codebuild/README.md',
  'deploy/terraform/modules/codebuild-deploy-executor/main.tf',
  'deploy/terraform/modules/codebuild-deploy-executor/variables.tf',
  'deploy/terraform/modules/codebuild-deploy-executor/outputs.tf',
  'deploy/terraform/modules/codebuild-deploy-executor/tests/codebuild-deploy-executor.tftest.hcl',
  'deploy/terraform/modules/argocd/main.tf',
  'deploy/terraform/modules/argocd/variables.tf',
  'deploy/terraform/modules/argocd/outputs.tf',
  'deploy/terraform/modules/argocd/argocd.tftest.hcl',
  'deploy/codebuild/deploy-buildspec.yml',
  'platform/scripts/codebuild-deploy-start.mjs',
  'platform/scripts/codebuild-deploy-runner.mjs',
  'platform/scripts/deployment-fleet-matrix.mjs',
  'platform/scripts/tests/deployment-ops-cli.test.mjs',
  'platform/scripts/tests/deployment-fleet-matrix.test.mjs',
];

for (const rel of requiredFiles) gate('file:' + rel, existsSync(join(ROOT, rel)), rel);

const contract = readJson('machine/spec/deployment-ops-contract.json');
const profile = readJson('operations/deployment-profile.json');
const fabric = readJson('operations/fabric-contract.json');
const mlops = readJson('machine/spec/mlops-bridge-contract.json');
const retainedIdentifiers = readJson('machine/spec/retained-resource-identifiers.json');
const finops = readJson('machine/spec/finops-as-a-service.json');
const gha = readJson('machine/spec/github-actions-cost-controls.json');
const deploymentReadme = readText('docs/operations/deployment/README.md');
const agentInstructions = readText('docs/operations/deployment/agent-deployment-ops-instructions-2026-06-30.md');
const strategyDoc = readText('docs/operations/deployment/infra-ai-cost-strategy-2026-06-30.md');
const handoffDoc = readText('docs/operations/deployment/github-billing-independent-deploy-handoff-2026-06-30.md');
const devopsDoc = readText('docs/operations/platform-services/devops-as-a-service.md');
const finopsDoc = readText('docs/operations/runbooks/finops-as-a-service.md');
const awsOptimizationExportScript = readText('platform/scripts/cost/aws-cost-optimization-export.mjs');
const codebuildReadme = readText('deploy/codebuild/README.md');
const codebuildModule = readText('deploy/terraform/modules/codebuild-deploy-executor/main.tf');
const argocdModule = readText('deploy/terraform/modules/argocd/main.tf');
const stagingTerraform = readText('deploy/terraform/environments/staging/main.tf');
const productionTerraform = readText('deploy/terraform/environments/production/main.tf');
const codebuildStartScript = readText('platform/scripts/codebuild-deploy-start.mjs');
const codebuildRunnerScript = readText('platform/scripts/codebuild-deploy-runner.mjs');
const codebuildBuildspec = readText('deploy/codebuild/deploy-buildspec.yml');
const deploymentOpsCliTest = readText('platform/scripts/tests/deployment-ops-cli.test.mjs');
const packageJson = readJson('package.json');

const requiredOwners = ['fabric-os', 'baseline-os'];
gate('contract:status-current', contract.status === 'current', contract.status);
gate('contract:strategy-owners', hasAll(contract.strategyOwners, requiredOwners), JSON.stringify(contract.strategyOwners));
gate('contract:github-source-only', /GitHub remains source control only/i.test(contract.principle), contract.principle);
gate('contract:runtime-aws-region', contract.runtimeCloud?.primary === 'AWS' && contract.runtimeCloud?.region === 'af-south-1', JSON.stringify(contract.runtimeCloud));
gate('contract:gcp-artifact-bridge-only', /Phase 3 ML artifact bridge only/i.test(contract.runtimeCloud?.gcpScope ?? ''), contract.runtimeCloud?.gcpScope);
gate('contract:ci-codebuild', contract.ci?.primaryExecutor === 'aws-codebuild', contract.ci?.primaryExecutor);
gate('contract:ci-codebuild-module', contract.ci?.terraformModule === 'deploy/terraform/modules/codebuild-deploy-executor', contract.ci?.terraformModule);
gate('contract:ci-env-wires', hasAll(contract.ci?.environmentWires, ['deploy/terraform/environments/staging/main.tf', 'deploy/terraform/environments/production/main.tf']), JSON.stringify(contract.ci?.environmentWires));
gate('contract:orchestration', hasAll(contract.ci?.orchestrator, ['aws-codepipeline', 'eventbridge-triggered-codebuild']), JSON.stringify(contract.ci?.orchestrator));
gate('contract:gha-not-critical', contract.ci?.githubActions?.status === 'not-production-critical-path', contract.ci?.githubActions?.status);
gate('contract:gha-forbidden-production', hasAll(contract.ci?.githubActions?.forbiddenFor, ['production-deploy-execution', 'private-eks-kubectl-apply', 'terraform-apply-production']), JSON.stringify(contract.ci?.githubActions?.forbiddenFor));
gate('contract:cd-argocd', contract.cd?.kubernetesDelivery === 'argocd-in-eks' && contract.cd?.initialSyncMode === 'manual', JSON.stringify(contract.cd));
gate('contract:cd-argocd-module', contract.cd?.terraformModule === 'deploy/terraform/modules/argocd', contract.cd?.terraformModule);
gate('contract:cd-staging-app', contract.cd?.stagingApplication === 'fabric-staging-root', contract.cd?.stagingApplication);
gate('contract:eks-public-forbidden', contract.cd?.productionEksApi?.publicAccess === 'forbidden-as-ci-workaround', JSON.stringify(contract.cd?.productionEksApi));
gate('contract:ai-readiness-rule', /baselineos\/cost-router/i.test(contract.aiMlops?.readinessRule ?? ''), contract.aiMlops?.readinessRule);
gate('contract:retained-identifiers-ref', contract.retainedResourceIdentifiers === 'machine/spec/retained-resource-identifiers.json', contract.retainedResourceIdentifiers);
gate('retained-identifiers:source-owners', retainedIdentifiers.sourceOwnership?.intelligenceBridge === 'bridge-os' && retainedIdentifiers.sourceOwnership?.infrastructure === 'fabric-os', JSON.stringify(retainedIdentifiers.sourceOwnership));
gate('retained-identifiers:gtcx-intelligence-rule', (retainedIdentifiers.rules ?? []).some((rule) => rule.pattern === 'gtcx-intelligence-*' && /not.*standalone gtcx-intelligence repo/i.test(rule.notMeaning ?? '') && rule.sourceOwner === 'bridge-os'), JSON.stringify(retainedIdentifiers.rules ?? []));
gate('retained-identifiers:gtcx-infrastructure-rule', (retainedIdentifiers.rules ?? []).some((rule) => rule.pattern === 'gtcx-infrastructure' && /legacy fabric-os alias/i.test(rule.meaning ?? '') && rule.sourceOwner === 'fabric-os'), JSON.stringify(retainedIdentifiers.rules ?? []));
gate('retained-identifiers:forbidden-active-surfaces', hasAll(retainedIdentifiers.forbiddenActiveSurfaces, ['source repository checkout', 'agent owner routing', 'new roadmap ownership', 'new runbook cwd paths', 'new handoff target repo']), JSON.stringify(retainedIdentifiers.forbiddenActiveSurfaces));

const expectedDocRefs = [
  'docs/operations/deployment/agent-deployment-ops-instructions-2026-06-30.md',
  'docs/operations/deployment/infra-ai-cost-strategy-2026-06-30.md',
  'docs/operations/deployment/github-billing-independent-deploy-handoff-2026-06-30.md',
];
gate('contract:agent-docs', expectedDocRefs.every((rel) => Object.values(contract.agentInstructions ?? {}).includes(rel)), JSON.stringify(contract.agentInstructions));
gate('contract:required-session-commands', hasAll(contract.agentInstructions?.requiredSessionCommands, ['pnpm operations:check', 'pnpm agent:next-work']), JSON.stringify(contract.agentInstructions?.requiredSessionCommands));
gate('contract:docs-check-command', contract.agentInstructions?.deploymentDocsCheck === 'pnpm docs:operations:check', contract.agentInstructions?.deploymentDocsCheck);

// Deployment profile must consume the same strategy.
gate('profile:deploy-mode', profile.deployMode === 'aws-codebuild-vpc-plus-argocd-eks', profile.deployMode);
gate('profile:ci-executor', profile.ciExecutor === 'aws-codebuild', profile.ciExecutor);
gate('profile:ci-orchestrator', hasAll(profile.ciOrchestrator, ['aws-codepipeline', 'eventbridge-triggered-codebuild']), JSON.stringify(profile.ciOrchestrator));
gate('profile:kubernetes-delivery', profile.kubernetesDelivery === 'argocd-in-eks', profile.kubernetesDelivery);
gate('profile:github-actions-role', profile.githubActionsRole === 'source-control-event-source-only-not-production-critical-path', profile.githubActionsRole);
gate('profile:eks-private-access', profile.productionEksAccess === 'private-api-via-in-vpc-executor-or-in-cluster-controller', profile.productionEksAccess);
gate('profile:contract-ref', profile.deploymentOpsContract === 'machine/spec/deployment-ops-contract.json', profile.deploymentOpsContract);
gate('profile:strategy-owners', hasAll(profile.strategyOwners, requiredOwners), JSON.stringify(profile.strategyOwners));

// GitHub Actions cost controls must forbid production-critical use.
gate('gha:contract-ref', gha.deploymentOpsContract === 'machine/spec/deployment-ops-contract.json', gha.deploymentOpsContract);
gate('gha:production-critical-path', gha.scope?.productionCriticalPath === 'aws-codebuild-and-argocd', gha.scope?.productionCriticalPath);
gate('gha:production-critical-path-disallowed', gha.scope?.githubActionsProductionCriticalPathAllowed === false, String(gha.scope?.githubActionsProductionCriticalPathAllowed));
gate('gha:approval-rule', gha.approvalRules?.productionCiCd?.requiredExecutor === 'aws-codebuild-vpc' && gha.approvalRules?.productionCiCd?.requiredDelivery === 'argocd-in-eks', JSON.stringify(gha.approvalRules?.productionCiCd));

// Terraform implementation must include the executable CodeBuild path.
gate('terraform:codebuild-project', /resource "aws_codebuild_project" "deploy"/.test(codebuildModule), 'aws_codebuild_project.deploy');
gate('terraform:codebuild-vpc-config', /vpc_config\s*{[\s\S]*private_subnet_ids|vpc_config\s*{[\s\S]*subnets\s*=\s*var\.private_subnet_ids/.test(codebuildModule), 'vpc_config private subnets');
gate('terraform:codebuild-eks-access', /resource "aws_eks_access_entry" "deploy"/.test(codebuildModule) && /AmazonEKSClusterAdminPolicy/.test(codebuildModule), 'EKS access entry');
gate('terraform:codebuild-source-default', /source_type"[\s\S]*default\s*=\s*"NO_SOURCE"/.test(readText('deploy/terraform/modules/codebuild-deploy-executor/variables.tf')), 'NO_SOURCE default');
gate('terraform:staging-wired', /module "codebuild_deploy_executor"/.test(stagingTerraform) && /module\.vpc\.private_subnet_ids/.test(stagingTerraform), 'staging');
gate('terraform:production-wired', /module "codebuild_deploy_executor"/.test(productionTerraform) && /module\.vpc\.private_subnet_ids/.test(productionTerraform), 'production');
gate('terraform:production-kms-admin', /admin_role_arns\s*=\s*\[module\.ci\.deploy_role_arn,\s*module\.codebuild_deploy_executor\.deploy_role_arn\]/.test(productionTerraform), 'KMS admin role');
gate('terraform:codebuild-source-staging', /source_type\s*=\s*"GITHUB"/.test(stagingTerraform) && /deploy\/codebuild\/deploy-buildspec\.yml/.test(stagingTerraform), 'staging GitHub SCM source');
gate('terraform:codebuild-source-production', /source_type\s*=\s*"GITHUB"/.test(productionTerraform) && /deploy\/codebuild\/deploy-buildspec\.yml/.test(productionTerraform), 'production GitHub SCM source');
gate('terraform:codebuild-evidence-kms', /evidence_kms_key_arns/.test(codebuildModule) && /kms:GenerateDataKey/.test(codebuildModule), 'evidence KMS writes');
gate(
  'terraform:codebuild-scoped-mutations',
  [
    'iam:PutRolePolicy',
    'iam:CreatePolicyVersion',
    'ec2:RevokeSecurityGroupIngress',
    'eks:UpdateNodegroupConfig',
    'rds:ModifyDBParameterGroup',
    'lambda:UpdateFunctionCode',
  ].every((action) => codebuildModule.includes(`"${action}"`)),
  'Terraform mutation actions'
);
gate('codebuild-start:script', /codebuild[\s\S]*start-build/.test(codebuildStartScript) && /--execute/.test(codebuildStartScript), 'start-build wrapper');
gate('codebuild-start:class-a-ref', /Class A reference required for terraform-apply and production argocd-sync/.test(codebuildStartScript), 'Class A guard');
gate('codebuild-start:package-script', packageJson.scripts?.['deployment:codebuild:start'] === 'node platform/scripts/codebuild-deploy-start.mjs', packageJson.scripts?.['deployment:codebuild:start']);
gate('codebuild-runner:script', /DEPLOY_MODE/.test(codebuildRunnerScript) && /codebuild-deploy-runner\/v1/.test(codebuildRunnerScript), 'runner evidence');
gate('codebuild-runner:class-a-ref', /Class A reference required for terraform-apply and production argocd-sync/.test(codebuildRunnerScript), 'runner Class A guard');
gate('codebuild-runner:plan-show', /terraform-plan-show[\s\S]*show[\s\S]*-no-color/.test(codebuildRunnerScript), 'saved-plan evidence');
gate('codebuild-runner:plan-summary', /terraform-plan-summary[\s\S]*show[\s\S]*-json/.test(codebuildRunnerScript) && /resource_changes/.test(codebuildRunnerScript) && /changeCount/.test(codebuildRunnerScript) && /changedPaths/.test(codebuildRunnerScript), 'value-free resource action evidence');
gate('codebuild-runner:plan-summary-buffer', /maxBuffer:\s*64\s*\*\s*1024\s*\*\s*1024/.test(codebuildRunnerScript), 'Terraform plan JSON buffer');
gate('codebuild-runner:head-tail-truncation', /\[truncated middle\]/.test(codebuildRunnerScript) && /text\.slice\(-half\)/.test(codebuildRunnerScript), 'preserve command summary');
gate('codebuild-runner:module-test', /codebuild-module-init/.test(codebuildRunnerScript) && /codebuild-module-test/.test(codebuildRunnerScript), 'CodeBuild module Terraform test');
gate('codebuild-runner:package-script', packageJson.scripts?.['deployment:codebuild:runner'] === 'node platform/scripts/codebuild-deploy-runner.mjs', packageJson.scripts?.['deployment:codebuild:runner']);
gate('codebuild-buildspec:runner', /codebuild-deploy-runner\.mjs --write --execute/.test(codebuildBuildspec), 'buildspec runner');
gate('codebuild-buildspec:evidence-artifact', /audit\/evidence\/codebuild-deploy-runner-latest\.json/.test(codebuildBuildspec), 'buildspec evidence artifact');
gate('codebuild-buildspec:node-runtime', /runtime-versions:\s*\n\s+nodejs:\s+22/.test(codebuildBuildspec), 'Node.js 22');
gate('codebuild-buildspec:package-manager', new RegExp(`corepack prepare ${packageJson.packageManager.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} --activate`).test(codebuildBuildspec), packageJson.packageManager);
gate('codebuild-buildspec:terraform-version', /terraform\/1\.15\.7\/terraform_1\.15\.7_linux_amd64\.zip/.test(codebuildBuildspec), 'Terraform 1.15.7');
gate('codebuild-readme:github-not-executor', /GitHub Actions is not the production deploy\s+executor/i.test(codebuildReadme), 'CodeBuild README');
gate('codebuild-readme:class-a', /--class-a-ref=<artifact>/.test(codebuildReadme), 'CodeBuild README Class A');
gate(
  'deployment-ops:test-script',
  /platform\/scripts\/tests\/deployment-ops-cli\.test\.mjs/.test(packageJson.scripts?.['deployment:ops:test'] ?? '') &&
    /platform\/scripts\/tests\/deployment-fleet-matrix\.test\.mjs/.test(packageJson.scripts?.['deployment:ops:test'] ?? ''),
  packageJson.scripts?.['deployment:ops:test'],
);
gate('deployment-fleet:script', packageJson.scripts?.['deployment:fleet:matrix'] === 'node platform/scripts/deployment-fleet-matrix.mjs', packageJson.scripts?.['deployment:fleet:matrix']);
gate('deployment-fleet:write-script', packageJson.scripts?.['deployment:fleet:matrix:write'] === 'node platform/scripts/deployment-fleet-matrix.mjs --write', packageJson.scripts?.['deployment:fleet:matrix:write']);
gate('deployment-fleet:strict-script', packageJson.scripts?.['deployment:fleet:matrix:strict'] === 'node platform/scripts/deployment-fleet-matrix.mjs --strict', packageJson.scripts?.['deployment:fleet:matrix:strict']);
gate('deployment-ops:test-coverage', /Class A reference required/.test(deploymentOpsCliTest) && /aws cost optimization export/.test(deploymentOpsCliTest), 'CLI guardrail tests');
gate('deployment-ops:fabric-check-runs-test', /pnpm deployment:ops:test/.test(packageJson.scripts?.['fabric:operations:check'] ?? ''), packageJson.scripts?.['fabric:operations:check']);
gate('deployment-ops:fabric-strict-runs-test', /pnpm deployment:ops:test/.test(packageJson.scripts?.['fabric:operations:check:strict'] ?? ''), packageJson.scripts?.['fabric:operations:check:strict']);
gate('terraform:argocd-helm-release', /resource "helm_release" "argocd"/.test(argocdModule) && /chart\s*=\s*"argo-cd"/.test(argocdModule), 'helm_release.argocd');
gate('terraform:argocd-manual-staging-app', /kind: Application/.test(stagingTerraform) && /name: fabric-staging-root/.test(stagingTerraform) && !/automated:/.test(stagingTerraform), 'manual sync application');
gate('terraform:argocd-staging-wired', /module "argocd"/.test(stagingTerraform), 'staging argocd module');

// FinOps and MLOps must consume the same deploy strategy.
gate('finops:contract-ref', finops.deploymentOpsContract === 'machine/spec/deployment-ops-contract.json', finops.deploymentOpsContract);
gate('finops:github-actions-role', finops.ciCostPolicy?.githubActions === 'source-control-event-source-only-not-production-critical-path', finops.ciCostPolicy?.githubActions);
gate('finops:codebuild-on-demand', finops.ciCostPolicy?.primary === 'aws-codebuild-on-demand', finops.ciCostPolicy?.primary);
gate('finops:aws-optimization-harness', finops.harness?.awsOptimizationExport === 'pnpm finops:aws-optimization:export:write', finops.harness?.awsOptimizationExport);
gate('finops:aws-optimization-script', /cost-optimization-hub/.test(awsOptimizationExportScript) && /compute-optimizer/.test(awsOptimizationExportScript), 'AWS optimization export');
gate('mlops:deployment-contract-ref', (mlops.ownerSplit?.fabricOs ?? []).includes('machine/spec/deployment-ops-contract.json'), JSON.stringify(mlops.ownerSplit?.fabricOs));
gate('mlops:github-not-critical', /GitHub Actions is not production critical path/i.test(mlops.fabricArtifacts?.ci ?? ''), mlops.fabricArtifacts?.ci);
gate('mlops:readiness-rule', /baselineos\/cost-router/i.test(mlops.readinessGate?.rule ?? ''), mlops.readinessGate?.rule);
gate('mlops:forbidden-owners', hasAll(mlops.forbiddenStrategyOwners, ['bridge-os', 'gtcx-os', 'archived-intelligence-repo', 'fabric-os']), JSON.stringify(mlops.forbiddenStrategyOwners));

// Fabric contract must expose deployment SoR references.
const deploymentDomain = (fabric.domains ?? []).find((domain) => domain.id === 'deployment');
gate('fabric-contract:deployment-domain', Boolean(deploymentDomain), 'deployment');
gate('fabric-contract:central-ref', deploymentDomain?.centralRef === 'fabric-os/docs/operations/deployment/README.md', deploymentDomain?.centralRef);
gate('fabric-contract:local-refs', expectedDocRefs.concat(['machine/spec/deployment-ops-contract.json', 'operations/deployment-profile.json']).every((rel) => (deploymentDomain?.localRefs ?? []).includes(rel)), JSON.stringify(deploymentDomain?.localRefs));

// Narrative docs must say the same thing.
const docTexts = [
  ['deployment-readme', deploymentReadme],
  ['agent-instructions', agentInstructions],
  ['strategy-doc', strategyDoc],
  ['handoff-doc', handoffDoc],
  ['devops-doc', devopsDoc],
  ['finops-doc', finopsDoc],
];
for (const [id, text] of docTexts) {
  gate('doc:' + id + ':codebuild', /CodeBuild/i.test(text), id);
  gate('doc:' + id + ':argocd', /Argo CD/i.test(text), id);
  gate('doc:' + id + ':github-not-critical', /GitHub Actions[^\n.]*not[^\n.]*production|GitHub Actions[^\n.]*Remove from prod critical path|Do not make GitHub Actions the production|GitHub remains source control|GitHub[^\n.]*source control only|GitHub for source control/i.test(text), id);
}

gate('agent-instructions:no-public-eks-reopen', /Do not reopen the production EKS API publicly/i.test(agentInstructions), 'public EKS guard');
gate('agent-instructions:no-ai-readiness-overclaim', /Do not claim intelligence cost-router readiness/i.test(agentInstructions) || /Do not claim AI cost readiness/i.test(agentInstructions), 'AI readiness guard');

const ok = gates.every((item) => item.ok);
const witness = {
  $schema: 'gtcx://fabric-os/deployment-ops-contract-check/v1',
  version: '1.0.0',
  updated: new Date().toISOString(),
  repo: 'fabric-os',
  ok,
  gates,
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(witness, null, 2) + '\n');
}

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log('=== Deployment ops contract check ===\n');
  for (const item of gates) {
    console.log((item.ok ? 'OK' : 'FAIL') + ' ' + item.id + (item.detail ? ' — ' + item.detail : ''));
  }
  console.log('\n' + (ok ? 'PASS' : 'FAIL') + ' — ' + gates.filter((item) => item.ok).length + '/' + gates.length);
  if (WRITE) console.log('witness: ' + OUT);
}

process.exit(ok ? 0 : 1);
