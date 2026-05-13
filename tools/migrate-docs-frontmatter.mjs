#!/usr/bin/env node
/**
 * @fileoverview Docs YAML Frontmatter Migration Script
 *
 * Migrates all markdown files in docs/ to machine-readable format with
 * YAML frontmatter per the forensic-docs-machine-readable-prompt.
 *
 * Usage:
 *   node tools/migrate-docs-frontmatter.mjs [--batch=N] [--dry-run]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import path from 'node:path';

const DOCS_ROOT = path.join(process.cwd(), 'docs');
const TODAY = '2026-05-10'; // Use a fixed date for consistency

// ---------------------------------------------------------------------------
// Approved enums
// ---------------------------------------------------------------------------

const STATUS_ENUM = ['current', 'draft', 'deprecated', 'superseded'];
const OWNER_ENUM = ['protocol-architect', 'crypto-security-engineer', 'frontier-infra-engineer', 'quality-evidence-lead', 'product-lead'];
const TIER_ENUM = ['critical', 'standard', 'informational'];
const REVIEW_CYCLE_ENUM = ['quarterly', 'monthly', 'on-change'];

// ---------------------------------------------------------------------------
// Tag taxonomy with keyword mappings
// ---------------------------------------------------------------------------

const TAG_KEYWORDS = {
  security: ['security', 'threat', 'vulnerability', 'penetration', 'pentest', 'cve', 'audit-integrity', 'break-glass', 'bug-bounty', 'defense', 'forensic', 'red-team', 'stig', 'zero-trust', 'rasp', 'secrets', 'signed-commits', 'soc', 'tokenization'],
  crypto: ['cryptography', 'cryptographic', 'encryption', 'fips', 'key-ceremony', 'signature', 'zkp', 'zero-knowledge', 'hash'],
  compliance: ['compliance', 'soc2', 'iso27001', 'pci-dss', 'gdpr', 'poipa', 'regulatory', 'audit', 'controls-matrix', 'data-classification', 'data-retention', 'risk-register', 'vendor-risk', 'separation-of-duties'],
  architecture: ['architecture', 'system-design', 'domain-model', 'adr', 'overview', 'trust-model', 'microservices'],
  infrastructure: ['infrastructure', 'terraform', 'kubernetes', 'k8s', 'eks', 'vpc', 'network', 'connectivity', 'deployment', 'devops', 'ci-cd', 'monitoring', 'observability', 'telemetry'],
  testing: ['testing', 'test-plan', 'qa', 'uat', 'load-test', 'chaos'],
  api: ['api', 'openapi', 'swagger', 'graphql', 'rest'],
  frontend: ['frontend', 'ui', 'ux', 'design-system', 'screen', 'user-journey', 'user-flow'],
  backend: ['backend', 'server', 'database', 'connection-pooling', 'schema'],
  database: ['database', 'rds', 'postgres', 'sql', 'migration', 'failover'],
  network: ['network', 'sync', 'offline', 'connectivity', 'latency'],
  devops: ['devops', 'ci-cd', 'deployment', 'release', 'rollback', 'runbook', 'incident', 'disaster-recovery', 'on-call', 'slo', 'error-budget'],
  governance: ['governance', 'conflict-of-interest', 'editorial-independence', 'access-control', 'policy', 'procedure'],
  risk: ['risk', 'threat-model', 'vulnerability', 'remediation'],
  performance: ['performance', 'scalability', 'resilience', 'load-test', 'latency', 'slo'],
  ux: ['ux', 'user-experience', 'user-guide', 'persona', 'onboarding'],
  mobile: ['mobile', 'offline', 'app', 'pwa'],
  web3: ['web3', 'blockchain', 'smart-contract', 'wallet'],
  blockchain: ['blockchain', 'web3', 'consensus', 'ledger'],
  identity: ['identity', 'kyc', 'did', 'authentication', 'authorization', 'access-control'],
  events: ['events', 'webhook', 'pub-sub', 'queue'],
  schemas: ['schema', 'data-spec', 'content-schema', 'database-schema'],
  verification: ['verification', 'validation', 'audit', 'integrity', 'proof'],
  workproof: ['workproof', 'proof-of-work', 'consensus'],
  resilience: ['resilience', 'chaos', 'failover', 'disaster-recovery', 'high-availability'],
  telemetry: ['telemetry', 'metrics', 'monitoring', 'observability', 'logging', 'tracing'],
  agentic: ['agent', 'agentic', 'ai', 'llm', 'ml', 'fine-tune', 'model'],
  gtm: ['gtm', 'go-to-market', 'pilot', 'regulatory', 'sandbox', 'market', 'competitor', 'industry'],
  docs: ['documentation', 'docs-standard', 'writing-guide', 'glossary'],
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  }
  return files;
}

function relativeDocs(filePath) {
  return path.relative(process.cwd(), filePath);
}

function getGitDate(filePath) {
  try {
    const out = execSync(`git log -1 --format=%cs -- "${filePath}"`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    return out.trim() || TODAY;
  } catch {
    return TODAY;
  }
}

function extractH1(content) {
  const match = content.match(/^# (.+)$/m);
  return match ? match[1].trim() : null;
}

function extractBlockquoteMetadata(content) {
  const lines = content.split('\n');
  const meta = {};
  let inBlockquote = false;

  for (const line of lines) {
    if (line.startsWith('> ')) {
      inBlockquote = true;
      const bm = line.match(/^> \*\*(\w+):\*\*\s*(.+)$/);
      if (bm) {
        const key = bm[1].toLowerCase();
        meta[key] = bm[2].trim();
      }
    } else if (inBlockquote && line.trim() === '') {
      continue;
    } else if (inBlockquote) {
      break;
    }
  }

  return meta;
}

function removeBlockquoteMetadata(content) {
  const lines = content.split('\n');
  const result = [];
  let inBlockquote = false;
  let blockquoteRemoved = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('> ')) {
      inBlockquote = true;
      blockquoteRemoved = true;
      continue;
    }
    if (inBlockquote && line.trim() === '') {
      // Skip blank lines immediately after blockquote
      continue;
    }
    if (inBlockquote) {
      inBlockquote = false;
    }
    result.push(line);
  }

  // Remove leading blank lines
  while (result.length > 0 && result[0].trim() === '') {
    result.shift();
  }

  return { content: result.join('\n'), removed: blockquoteRemoved };
}

// ---------------------------------------------------------------------------
// Metadata inference
// ---------------------------------------------------------------------------

function inferOwner(filePath, content) {
  const lowerContent = content.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  // Crypto / security domain
  if (lowerPath.includes('security/') || lowerPath.includes('cryptography') || lowerPath.includes('crypto/')) {
    return 'crypto-security-engineer';
  }
  if (['cryptography', 'cryptographic', 'encryption', 'fips', 'signature', 'zero-knowledge', 'threat', 'vulnerability', 'pentest'].some(k => lowerContent.includes(k))) {
    return 'crypto-security-engineer';
  }

  // Audit / compliance / evidence
  if (lowerPath.includes('audit/') || lowerPath.includes('compliance/') || lowerPath.includes('assessments/')) {
    return 'quality-evidence-lead';
  }
  if (['audit', 'compliance', 'evidence', 'governance', 'risk', 'soc2', 'iso27001'].some(k => lowerContent.includes(k))) {
    return 'quality-evidence-lead';
  }

  // Infrastructure / DevOps
  if (lowerPath.includes('devops/') || lowerPath.includes('infrastructure') || lowerPath.includes('operations/') || lowerPath.includes('terraform') || lowerPath.includes('kubernetes') || lowerPath.includes('k8s')) {
    return 'frontier-infra-engineer';
  }
  if (['terraform', 'kubernetes', 'k8s', 'eks', 'infrastructure', 'deployment', 'devops', 'monitoring', 'observability'].some(k => lowerContent.includes(k))) {
    return 'frontier-infra-engineer';
  }

  // Product / GTM
  if (lowerPath.includes('gtm/') || lowerPath.includes('product/') || lowerPath.includes('onboarding/')) {
    return 'product-lead';
  }
  if (['go-to-market', 'pilot', 'market', 'user-guide', 'product', 'roadmap', 'sprint'].some(k => lowerContent.includes(k))) {
    return 'product-lead';
  }

  // Default: protocol-architect
  return 'protocol-architect';
}

function inferTier(filePath, content) {
  const lowerPath = filePath.toLowerCase();
  const lowerContent = content.toLowerCase();

  // Critical: security, compliance, audit, release gates
  if (lowerPath.includes('security/') || lowerPath.includes('compliance/') || lowerPath.includes('audit/')) {
    return 'critical';
  }
  if (['security policy', 'compliance requirement', 'controls matrix', 'threat model', 'break-glass', 'incident response', 'disaster recovery'].some(k => lowerContent.includes(k))) {
    return 'critical';
  }

  // Informational: reference, glossary, guides, templates
  if (lowerPath.includes('reference/') || lowerPath.includes('glossary') || lowerPath.includes('guide') || lowerPath.includes('template') || lowerPath.includes('overview')) {
    return 'informational';
  }
  if (['glossary', 'faq', 'guide', 'template', 'overview', 'introduction'].some(k => lowerContent.includes(k))) {
    return 'informational';
  }

  // Standard: everything else
  return 'standard';
}

function inferTags(filePath, content) {
  const lowerContent = content.toLowerCase();
  const lowerPath = filePath.toLowerCase();
  const combined = lowerPath + ' ' + lowerContent;
  const tags = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    if (keywords.some(kw => combined.includes(kw))) {
      tags.push(tag);
      if (tags.length >= 5) break;
    }
  }

  // Ensure at least 2 tags
  if (tags.length === 0) {
    tags.push('docs');
  }
  if (tags.length === 1) {
    // Add a second tag based on path
    if (lowerPath.includes('docs/')) tags.push('docs');
    else if (lowerPath.includes('security/')) tags.push('security');
    else if (lowerPath.includes('compliance/')) tags.push('compliance');
    else if (lowerPath.includes('infrastructure/') || lowerPath.includes('devops/')) tags.push('infrastructure');
    else tags.push('architecture');
  }

  // Deduplicate
  return [...new Set(tags)].slice(0, 5);
}

function inferReviewCycle(tier) {
  if (tier === 'critical') return 'quarterly';
  if (tier === 'standard') return 'on-change';
  return 'monthly';
}

function inferStatus(content) {
  const lower = content.toLowerCase();
  if (lower.includes('draft') || lower.includes('wip') || lower.includes('todo') || lower.includes('work in progress')) {
    return 'draft';
  }
  if (lower.includes('superseded') || lower.includes('replaced by')) {
    return 'superseded';
  }
  if (lower.includes('deprecated') || lower.includes('obsolete')) {
    return 'deprecated';
  }
  return 'current';
}

function filenameToTitle(filename) {
  const base = path.basename(filename, '.md');
  return base
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/Adr/g, 'ADR')
    .replace(/Soc2/g, 'SOC 2')
    .replace(/Iso27001/g, 'ISO 27001')
    .replace(/Pci-dss/g, 'PCI DSS')
    .replace(/K8s/g, 'K8s')
    .replace(/Ci-cd/g, 'CI/CD')
    .replace(/Gtcx/g, 'GTCX')
    .replace(/Qa/g, 'QA')
    .replace(/Uat/g, 'UAT')
    .replace(/Slo/g, 'SLO')
    .replace(/Rto/g, 'RTO')
    .replace(/Rpo/g, 'RPO')
    .replace(/Rasp/g, 'RASP')
    .replace(/Fips/g, 'FIPS')
    .replace(/Stig/g, 'STIG')
    .replace(/Nist/g, 'NIST')
    .replace(/Gtm/g, 'GTM')
    .replace(/Api/g, 'API')
    .replace(/Sdk/g, 'SDK')
    .replace(/Db/g, 'DB')
    .replace(/Sql/g, 'SQL')
    .replace(/Aws/g, 'AWS')
    .replace(/Eks/g, 'EKS')
    .replace(/Ecr/g, 'ECR')
    .replace(/Vpc/g, 'VPC')
    .replace(/Waf/g, 'WAF')
    .replace(/Rds/g, 'RDS')
    .replace(/S3/g, 'S3')
    .replace(/Iam/g, 'IAM')
    .replace(/Kms/g, 'KMS')
    .replace(/Dns/g, 'DNS')
    .replace(/Tls/g, 'TLS')
    .replace(/Mtls/g, 'mTLS')
    .replace(/Ssh/g, 'SSH')
    .replace(/Http/g, 'HTTP')
    .replace(/Https/g, 'HTTPS')
    .replace(/Url/g, 'URL')
    .replace(/Uri/g, 'URI')
    .replace(/Json/g, 'JSON')
    .replace(/Yaml/g, 'YAML')
    .replace(/Xml/g, 'XML')
    .replace(/Html/g, 'HTML')
    .replace(/Css/g, 'CSS')
    .replace(/Js/g, 'JS')
    .replace(/Ts/g, 'TS')
    .replace(/Nodejs/g, 'Node.js')
    .replace(/Pnpm/g, 'pnpm')
    .replace(/Npm/g, 'npm')
    .replace(/Cve/g, 'CVE')
    .replace(/Csr/g, 'CSR')
    .replace(/Csp/g, 'CSP')
    .replace(/Cors/g, 'CORS')
    .replace(/Xss/g, 'XSS')
    .replace(/Csrf/g, 'CSRF')
    .replace(/Sqli/g, 'SQLi')
    .replace(/Idor/g, 'IDOR')
    .replace(/Lfi/g, 'LFI')
    .replace(/Rfi/g, 'RFI')
    .replace(/Xxe/g, 'XXE')
    .replace(/Ssti/g, 'SSTI')
    .replace(/Os/g, 'OS')
    .replace(/Cpu/g, 'CPU')
    .replace(/Gpu/g, 'GPU')
    .replace(/Ram/g, 'RAM')
    .replace(/Ssd/g, 'SSD')
    .replace(/Hdd/g, 'HDD')
    .replace(/Vm/g, 'VM')
    .replace(/Os/g, 'OS')
    .replace(/Iot/g, 'IoT')
    .replace(/Ai/g, 'AI')
    .replace(/Ml/g, 'ML')
    .replace(/Nlp/g, 'NLP')
    .replace(/Llm/g, 'LLM')
    .replace(/Rag/g, 'RAG')
    .replace(/Pii/g, 'PII')
    .replace(/Phi/g, 'PHI')
    .replace(/Hipaa/g, 'HIPAA')
    .replace(/Gdp/g, 'GDPR')
    .replace(/Ccpa/g, 'CCPA')
    .replace(/Pci/g, 'PCI')
    .replace(/Dss/g, 'DSS')
    .replace(/Sla/g, 'SLA')
    .replace(/Ola/g, 'OLA')
    .replace(/Kpi/g, 'KPI')
    .replace(/Okr/g, 'OKR');
}

// ---------------------------------------------------------------------------
// Migration for a single file
// ---------------------------------------------------------------------------

function migrateFile(filePath) {
  const relPath = relativeDocs(filePath);
  let content = readFileSync(filePath, 'utf8');

  // Skip if already has YAML frontmatter
  if (content.trimStart().startsWith('---\n')) {
    return { file: relPath, status: 'skipped', reason: 'Already has YAML frontmatter' };
  }

  // Extract existing metadata
  const h1 = extractH1(content);
  const bqMeta = extractBlockquoteMetadata(content);

  // Infer metadata
  const title = h1 || filenameToTitle(filePath);
  const status = bqMeta.status ? bqMeta.status.toLowerCase().replace(/\W+/g, '') : inferStatus(content);
  const normalizedStatus = STATUS_ENUM.includes(status) ? status : 'current';

  const date = bqMeta.date || getGitDate(filePath);
  const owner = bqMeta.owner ? inferOwnerFromString(bqMeta.owner) : inferOwner(filePath, content);
  const role = owner;
  const tier = inferTier(filePath, content);
  const tags = inferTags(filePath, content);
  const reviewCycle = inferReviewCycle(tier);

  // Remove blockquote metadata
  const { content: cleanedContent, removed } = removeBlockquoteMetadata(content);

  // Construct frontmatter
  const frontmatter = `---
title: "${title}"
status: "${normalizedStatus}"
date: "${date}"
owner: "${owner}"
role: "${role}"
tier: "${tier}"
tags: ["${tags.join('", "')}"]
review_cycle: "${reviewCycle}"
---
`;

  // If no H1 and title was inferred from filename, add an H1
  let finalContent = frontmatter + cleanedContent;
  if (!h1) {
    finalContent = frontmatter + `\n# ${title}\n\n` + cleanedContent;
  }

  // Ensure final newline
  if (!finalContent.endsWith('\n')) {
    finalContent += '\n';
  }

  // Write
  writeFileSync(filePath, finalContent, 'utf8');

  return {
    file: relPath,
    status: 'migrated',
    removedBlockquote: removed,
    frontmatter: { title, status: normalizedStatus, date, owner, tier, tags, reviewCycle },
  };
}

function inferOwnerFromString(str) {
  const lower = str.toLowerCase();
  if (lower.includes('security') || lower.includes('crypto')) return 'crypto-security-engineer';
  if (lower.includes('audit') || lower.includes('compliance') || lower.includes('evidence') || lower.includes('quality')) return 'quality-evidence-lead';
  if (lower.includes('infra') || lower.includes('devops') || lower.includes('ops') || lower.includes('sre')) return 'frontier-infra-engineer';
  if (lower.includes('product') || lower.includes('gtm') || lower.includes('market')) return 'product-lead';
  return 'protocol-architect';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
const batchArg = args.find((a) => a.startsWith('--batch='));
const batchNum = batchArg ? parseInt(batchArg.slice(8), 10) : null;
const dryRun = args.includes('--dry-run');

const allFiles = walk(DOCS_ROOT).sort();
const BATCH_SIZE = 30;

if (batchNum !== null) {
  const start = (batchNum - 1) * BATCH_SIZE;
  const end = start + BATCH_SIZE;
  const batchFiles = allFiles.slice(start, end);

  console.log(`Batch ${batchNum}: ${batchFiles.length} files (${start + 1}–${Math.min(end, allFiles.length)} of ${allFiles.length})`);

  const results = [];
  for (const filePath of batchFiles) {
    if (dryRun) {
      console.log(`  [DRY-RUN] Would migrate: ${relativeDocs(filePath)}`);
    } else {
      const result = migrateFile(filePath);
      results.push(result);
      console.log(`  ${result.status}: ${result.file}${result.removedBlockquote ? ' (blockquote removed)' : ''}`);
    }
  }

  if (!dryRun) {
    const migrated = results.filter(r => r.status === 'migrated').length;
    const skipped = results.filter(r => r.status === 'skipped').length;
    console.log(`\nBatch ${batchNum} complete: ${migrated} migrated, ${skipped} skipped`);
  }
} else {
  console.log(`Total docs: ${allFiles.length}`);
  console.log(`Run with --batch=N to process a batch of ${BATCH_SIZE}`);
  console.log(`Total batches needed: ${Math.ceil(allFiles.length / BATCH_SIZE)}`);
}
