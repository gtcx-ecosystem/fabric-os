#!/usr/bin/env node
/**
 * @fileoverview Kyverno Policy Structural Validator
 *
 * Validates Kyverno policy YAML files without requiring the Kyverno CLI:
 *   - All .yaml files in the policies directory are valid Kubernetes resources
 *   - Required fields (apiVersion, kind, metadata.name) are present
 *   - Policy kinds are valid Kyverno types (ClusterPolicy, Policy)
 *   - kustomization.yaml references all policy files
 *   - No duplicate policy names
 *
 * Exits 0 on pass, 1 with categorized violations.
 */

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const POLICIES_DIR = path.join(process.cwd(), 'infra', 'kubernetes', 'base', 'policies');
const KUSTOMIZATION_FILE = path.join(POLICIES_DIR, 'kustomization.yaml');

const VALID_POLICY_KINDS = new Set(['ClusterPolicy', 'Policy']);
const VALID_API_VERSIONS = new Set(['kyverno.io/v1', 'kyverno.io/v2', 'kyverno.io/v2beta1', 'kustomize.config.k8s.io/v1beta1']);

let exitCode = 0;

function fail(category, message) {
  console.error(`kyverno-policy: [${category}] ${message}`);
  exitCode = 1;
}

function parseYamlDocuments(text) {
  const docs = [];
  let current = [];
  for (const line of text.split('\n')) {
    if (line.trim() === '---') {
      if (current.length > 0) {
        docs.push(current.join('\n'));
        current = [];
      }
    } else {
      current.push(line);
    }
  }
  if (current.length > 0) {
    docs.push(current.join('\n'));
  }
  return docs;
}

function extractTopLevelField(doc, key) {
  const match = doc.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  return match?.[1]?.trim() ?? null;
}

function extractNestedField(doc, ...keys) {
  const lines = doc.split('\n');
  let depth = 0;
  const indentStack = [0];

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;

    const indent = line.length - line.trimStart().length;
    while (indentStack.length > 1 && indent <= indentStack[indentStack.length - 1]) {
      indentStack.pop();
      depth--;
    }

    if (trimmed.startsWith(keys[depth] + ':')) {
      if (depth === keys.length - 1) {
        // Key found — value may be on same line or subsequent lines
        const value = trimmed.slice(keys[depth].length + 1).trim();
        // Return the value if inline, or a sentinel if the key exists with nested content
        return value || '<nested>';
      }
      indentStack.push(indent);
      depth++;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 1. Discover all policy YAML files
// ---------------------------------------------------------------------------

const files = readdirSync(POLICIES_DIR)
  .filter((f) => f.endsWith('.yaml') && f !== 'kustomization.yaml')
  .sort();

if (files.length === 0) {
  fail('DISCOVERY', 'No policy YAML files found in policies directory');
  process.exit(exitCode);
}

console.log(`kyverno-policy: Found ${files.length} policy files`);

// ---------------------------------------------------------------------------
// 2. Validate each policy file
// ---------------------------------------------------------------------------

const seenNames = new Set();

for (const filename of files) {
  const filepath = path.join(POLICIES_DIR, filename);
  const text = readFileSync(filepath, 'utf8');
  const docs = parseYamlDocuments(text);

  if (docs.length === 0) {
    fail('STRUCTURE', `${filename}: No YAML documents found`);
    continue;
  }

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    const apiVersion = extractTopLevelField(doc, 'apiVersion');
    const kind = extractTopLevelField(doc, 'kind');
    const name = extractNestedField(doc, 'metadata', 'name');

    if (!apiVersion) {
      fail('STRUCTURE', `${filename}[doc ${i + 1}]: Missing apiVersion`);
    } else if (!VALID_API_VERSIONS.has(apiVersion)) {
      fail('STRUCTURE', `${filename}[doc ${i + 1}]: Unknown apiVersion "${apiVersion}"`);
    }

    if (!kind) {
      fail('STRUCTURE', `${filename}[doc ${i + 1}]: Missing kind`);
    } else if (VALID_POLICY_KINDS.has(kind)) {
      if (!name) {
        fail('STRUCTURE', `${filename}[doc ${i + 1}]: Missing metadata.name`);
      } else {
        if (seenNames.has(name)) {
          fail('UNIQUENESS', `${filename}: Duplicate policy name "${name}"`);
        }
        seenNames.add(name);
      }

      const validationFailureAction = extractNestedField(doc, 'spec', 'validationFailureAction');
      if (!validationFailureAction) {
        fail('POLICY', `${filename}: Missing spec.validationFailureAction`);
      }

      const rules = extractNestedField(doc, 'spec', 'rules');
      if (!rules) {
        fail('POLICY', `${filename}: Missing spec.rules`);
      }
    } else if (kind !== 'Kustomization') {
      fail('STRUCTURE', `${filename}[doc ${i + 1}]: Unexpected kind "${kind}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// 3. Validate kustomization.yaml references all policy files
// ---------------------------------------------------------------------------

const kustomizationText = readFileSync(KUSTOMIZATION_FILE, 'utf8');
  const resourcesMatch = kustomizationText.match(/resources:[ 	]*\n((?:[ 	]*-[ 	]*.+\n?)+)/m);

if (!resourcesMatch) {
  fail('KUSTOMIZATION', 'kustomization.yaml: Missing resources section');
} else {
  const referencedFiles = resourcesMatch[1]
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => line.slice(2).trim());

  for (const filename of files) {
    if (!referencedFiles.includes(filename)) {
      fail('KUSTOMIZATION', `kustomization.yaml: Missing reference to ${filename}`);
    }
  }

  for (const ref of referencedFiles) {
    if (!files.includes(ref) && ref !== 'kustomization.yaml') {
      fail('KUSTOMIZATION', `kustomization.yaml: References non-existent file ${ref}`);
    }
  }

  console.log(`kyverno-policy: Kustomization references ${referencedFiles.length} resources`);
}

// ---------------------------------------------------------------------------
// 4. Summary
// ---------------------------------------------------------------------------

if (exitCode !== 0) {
  console.error(`kyverno-policy: Validation FAILED with violations`);
  process.exit(exitCode);
}

console.log(`kyverno-policy: All ${files.length} policy files structurally valid`);
