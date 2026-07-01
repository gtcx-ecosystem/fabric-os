#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const FLEET_ROOT = join(ROOT, '..');
const SPEC_REL = 'machine/spec/qasc-dslc-ship-fleet-parity.json';
const SPEC = join(ROOT, SPEC_REL);
const OUT = join(ROOT, 'audit/evidence/qasc-dslc-ship-fleet-parity-latest.json');
const OUT_REL = 'audit/evidence/qasc-dslc-ship-fleet-parity-latest.json';
const DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Johannesburg',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
}).format(new Date());
const REPORT = join(ROOT, `audit/reports/qasc-dslc-ship-fleet-parity-${DATE}.md`);
const OUTBOUND_DIR = join(ROOT, 'docs/operations/coordination/outbound');

const WRITE = process.argv.includes('--write');
const STRICT = process.argv.includes('--strict');
const JSON_OUT = process.argv.includes('--json');

function arg(name) {
  return process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : null;
}

function readJson(abs) {
  return JSON.parse(readFileSync(abs, 'utf8'));
}

function maybeReadJson(abs) {
  try {
    return readJson(abs);
  } catch {
    return null;
  }
}

function relExists(repoRoot, rel) {
  return existsSync(join(repoRoot, rel));
}

function packageJson(repoRoot) {
  return maybeReadJson(join(repoRoot, 'package.json'));
}

function scripts(repoRoot) {
  return packageJson(repoRoot)?.scripts ?? {};
}

function missingScripts(repoRoot, names) {
  const repoScripts = scripts(repoRoot);
  return names.filter((name) => !repoScripts[name]);
}

function missingFiles(repoRoot, rels) {
  return rels.filter((rel) => !relExists(repoRoot, rel));
}

function existingFiles(repoRoot, rels) {
  return rels.filter((rel) => relExists(repoRoot, rel));
}

function hasAnyFile(repoRoot, rels) {
  return existingFiles(repoRoot, rels).length > 0;
}

function existingScripts(repoRoot, names) {
  const repoScripts = scripts(repoRoot);
  return names.filter((name) => repoScripts[name]);
}

function newestMatching(repoRoot, dirs, regex) {
  const matches = [];
  for (const dirRel of dirs) {
    const dir = join(repoRoot, dirRel);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir)) {
      if (!regex.test(name)) continue;
      const abs = join(dir, name);
      if (!statSync(abs).isFile()) continue;
      matches.push(relative(repoRoot, abs));
    }
  }
  return matches.sort();
}

function selectedRepos(spec) {
  const selected = arg('--repos');
  if (!selected) return spec.activeRepos;
  const repos = selected
    .split(',')
    .map((repo) => repo.trim())
    .filter(Boolean);
  const unknown = repos.filter((repo) => !spec.activeRepos.includes(repo));
  if (unknown.length)
    throw new Error(`repos outside QASC/DSLC/SHIP parity denominator: ${unknown.join(', ')}`);
  return repos;
}

function providerResult(repo, repoRoot, spec) {
  const provider = spec.providerRepos?.[repo];
  if (!provider) return null;

  const missingProviderScripts = missingScripts(repoRoot, provider.requiredScripts ?? []);
  const missingProviderSpecs = missingFiles(repoRoot, provider.requiredSpecs ?? []);
  const ok = missingProviderScripts.length === 0 && missingProviderSpecs.length === 0;
  return {
    repo,
    classification: ok ? 'fabric-provider' : 'gap',
    valid: ok,
    reason: provider.reason,
    missing: {
      providerScripts: missingProviderScripts,
      providerSpecs: missingProviderSpecs,
    },
    remediation: ok
      ? 'Maintain Fabric-owned AaaS/QASC/DSLC/SHIP provider contracts and release commands.'
      : 'Restore missing Fabric provider scripts/specs before relying on central QASC/DSLC/SHIP parity.',
  };
}

function localCompleteResult(repo, repoRoot, spec) {
  const req = spec.localCompleteRequirements;
  const missingLocalScripts = missingScripts(repoRoot, req.scripts ?? []);
  const missingLocalSpecs = missingFiles(repoRoot, req.specs ?? []);
  const missingLocalWitnesses = missingFiles(repoRoot, req.witnesses ?? []);
  const shipWitnesses = existingFiles(repoRoot, req.anyShipWitness ?? []);
  const ok =
    missingLocalScripts.length === 0 &&
    missingLocalSpecs.length === 0 &&
    missingLocalWitnesses.length === 0 &&
    shipWitnesses.length > 0;

  return {
    repo,
    ok,
    missingLocalScripts,
    missingLocalSpecs,
    missingLocalWitnesses,
    shipWitnesses,
  };
}

function delegatedResult(repo, repoRoot, spec) {
  const req = spec.delegatedRequirements;
  const pins = existingFiles(repoRoot, req.pinFiles ?? []);
  const qascScripts = existingScripts(repoRoot, req.scriptsAny?.qasc ?? []);
  const dslcScripts = existingScripts(repoRoot, req.scriptsAny?.dslc ?? []);
  const shipScripts = existingScripts(repoRoot, req.scriptsAny?.ship ?? []);
  const qascWitnesses = [
    ...existingFiles(repoRoot, req.witnessesAny?.qasc ?? []),
    ...newestMatching(repoRoot, ['audit/evidence'], /^qasc-.*-latest\.json$/),
  ];
  const dslcWitnesses = [
    ...existingFiles(repoRoot, req.witnessesAny?.dslc ?? []),
    ...newestMatching(repoRoot, ['audit/evidence'], /^dslc-.*-latest\.json$/),
  ];
  const shipWitnesses = [
    ...existingFiles(repoRoot, req.witnessesAny?.ship ?? []),
    ...newestMatching(repoRoot, ['audit/evidence'], /^ship-.*-latest\.json$/),
  ];

  const hasQasc = qascScripts.length > 0 && qascWitnesses.length > 0;
  const hasDslc = dslcScripts.length > 0 && dslcWitnesses.length > 0;
  const hasShip = shipScripts.length > 0 && shipWitnesses.length > 0;
  const ok = pins.length > 0 && hasQasc && hasDslc && hasShip;

  return {
    repo,
    ok,
    pins,
    signals: {
      qasc: {
        scripts: qascScripts,
        witnesses: [...new Set(qascWitnesses)].sort(),
        complete: hasQasc,
      },
      dslc: {
        scripts: dslcScripts,
        witnesses: [...new Set(dslcWitnesses)].sort(),
        complete: hasDslc,
      },
      ship: {
        scripts: shipScripts,
        witnesses: [...new Set(shipWitnesses)].sort(),
        complete: hasShip,
      },
    },
  };
}

function exemptResult(repo, spec) {
  const exemption = spec.exemptions?.[repo];
  if (!exemption) return null;
  return {
    repo,
    classification: 'exempt',
    valid: true,
    reason: exemption.reason,
    owner: exemption.owner,
    reviewDate: exemption.reviewDate,
    impact: exemption.impact,
    remediation: 'Review exemption before expiry; do not treat exemption as protocol completion.',
  };
}

function classify(repo, spec) {
  const repoRoot = join(FLEET_ROOT, repo);
  if (!existsSync(repoRoot) || !existsSync(join(repoRoot, 'package.json'))) {
    return {
      repo,
      checkoutPresent: existsSync(repoRoot),
      packagePresent: false,
      classification: 'gap',
      valid: false,
      remediation:
        'Restore checkout/package.json or remove repo from the versioned Fabric parity denominator.',
    };
  }

  const provider = providerResult(repo, repoRoot, spec);
  if (provider?.valid) return { ...provider, checkoutPresent: true, packagePresent: true };

  const exemption = exemptResult(repo, spec);
  if (exemption) return { ...exemption, checkoutPresent: true, packagePresent: true };

  const local = localCompleteResult(repo, repoRoot, spec);
  if (local.ok) {
    return {
      repo,
      checkoutPresent: true,
      packagePresent: true,
      classification: 'local-complete',
      valid: true,
      local,
      remediation: 'Maintain repo-local QASC/DSLC/SHIP scripts, specs, and latest witnesses.',
    };
  }

  const delegated = delegatedResult(repo, repoRoot, spec);
  if (delegated.ok) {
    return {
      repo,
      checkoutPresent: true,
      packagePresent: true,
      classification: 'delegated',
      valid: true,
      delegated,
      remediation:
        'Maintain pinned Fabric delegation and current QASC/DSLC/SHIP delegated witnesses.',
    };
  }

  const missing = {
    localScripts: local.missingLocalScripts,
    localSpecs: local.missingLocalSpecs,
    localWitnesses: local.missingLocalWitnesses,
    shipWitnessMissing: local.shipWitnesses.length === 0,
    delegatedPinsPresent: delegated.pins,
    delegatedProtocolsMissing: Object.entries(delegated.signals)
      .filter(([, value]) => !value.complete)
      .map(([key]) => key),
    providerScripts: provider?.missing?.providerScripts ?? [],
    providerSpecs: provider?.missing?.providerSpecs ?? [],
  };

  return {
    repo,
    checkoutPresent: true,
    packagePresent: true,
    classification: 'gap',
    valid: false,
    local,
    delegated,
    missing,
    remediation:
      'Either add repo-local qasc:check/dslc:check/ship:check with specs and latest witnesses, or add an explicit Fabric delegation pin plus current delegated QASC/DSLC/SHIP witnesses.',
  };
}

function renderReport(witness) {
  const rows = witness.results.map((result) => {
    const missing = result.valid
      ? ''
      : [
          ...(result.missing?.localScripts ?? []),
          ...(result.missing?.localSpecs ?? []),
          ...(result.missing?.localWitnesses ?? []),
        ]
          .slice(0, 3)
          .join('<br>');
    return `| ${result.repo} | ${result.classification} | ${result.valid ? 'yes' : 'no'} | ${missing || result.remediation} |`;
  });

  return `---
title: "QASC/DSLC/SHIP fleet parity"
status: current
date: ${DATE}
owner: fabric-os
authority: GTCX-QASC-001 + GTCX-DSLC-001 + GTCX-SHIP-001
version: ${witness.contractVersion}
---

# QASC/DSLC/SHIP Fleet Parity

Command health: **${witness.commandHealth.ok ? 'pass' : 'fail'}**.
Strict pass: **${witness.strictPass ? 'yes' : 'no'}** (${witness.strictParity.atParity}/${witness.repoCount} repos at parity).

| Classification | Count |
| --- | ---: |
| local-complete | ${witness.summary['local-complete'] ?? 0} |
| fabric-provider | ${witness.summary['fabric-provider'] ?? 0} |
| delegated | ${witness.summary.delegated ?? 0} |
| exempt | ${witness.summary.exempt ?? 0} |
| gap | ${witness.summary.gap ?? 0} |

| Repo | Classification | Valid | Next remediation |
| --- | --- | --- | --- |
${rows.join('\n')}

Machine witness: \`${OUT_REL}\`.
`;
}

function handoffPath(repo) {
  return join(OUTBOUND_DIR, `to-${repo}-qasc-dslc-ship-parity-${DATE}.md`);
}

function renderHandoff(result, witness) {
  const missingScripts = result.missing?.localScripts?.length
    ? result.missing.localScripts.join(', ')
    : 'none';
  const missingSpecs = result.missing?.localSpecs?.length
    ? result.missing.localSpecs.join(', ')
    : 'none';
  const missingWitnesses = result.missing?.localWitnesses?.length
    ? result.missing.localWitnesses.join(', ')
    : 'none';
  const missingShipWitness = result.missing?.shipWitnessMissing ? 'missing' : 'none';
  const delegationPins = result.missing?.delegatedPinsPresent?.length
    ? result.missing.delegatedPinsPresent.join(', ')
    : 'none';
  const delegatedProtocolsMissing = result.missing?.delegatedProtocolsMissing?.length
    ? result.missing.delegatedProtocolsMissing.join(', ')
    : 'none';

  return `---
title: "Outbound — ${result.repo} QASC/DSLC/SHIP parity remediation"
status: current
date: ${DATE}
from: fabric-os
to: ${result.repo}
story: FABRIC-QASC-DSLC-SHIP-FLEET-PARITY-001
authorityClass: R
protocol: P24
owner: ${result.repo}
document_type: coordination-handoff
tier: operating
tags: [fabric-os, ${result.repo}, qasc, dslc, ship, fleet-parity, remediation]
review_cycle: on-change
---

# Outbound — ${result.repo} QASC/DSLC/SHIP parity remediation

Fabric's canonical parity witness classifies \`${result.repo}\` as \`gap\`.

## Missing local parity surface

- Scripts: ${missingScripts}
- Specs: ${missingSpecs}
- Witnesses: ${missingWitnesses}
- SHIP witness any-of: ${missingShipWitness}

## Delegated route gap

- Delegation pins present: ${delegationPins}
- Delegated protocols still missing script+witness: ${delegatedProtocolsMissing}

## Required remediation

- Local route: add repo-local \`qasc:check\`, \`dslc:check\`, and \`ship:check\` scripts with specs and latest witnesses.
- Delegated route: add explicit Fabric delegation pins plus current delegated QASC/DSLC/SHIP witnesses.
- Exempt route: request a Fabric contract exemption with reason, owner, review date, and impact.

Canonical Fabric witness: \`${OUT_REL}\`.
Current strict parity: ${witness.strictParity.atParity}/${witness.repoCount} repos at parity; ${witness.strictParity.gapCount} gaps.
`;
}

function compactResult(result) {
  const base = {
    repo: result.repo,
    checkoutPresent: result.checkoutPresent,
    packagePresent: result.packagePresent,
    classification: result.classification,
    valid: result.valid,
    remediation: result.remediation,
  };

  if (result.classification === 'fabric-provider') {
    return {
      ...base,
      reason: result.reason,
      missing: result.missing,
    };
  }

  if (result.classification === 'local-complete') {
    return {
      ...base,
      local: {
        missingLocalScripts: result.local?.missingLocalScripts ?? [],
        missingLocalSpecs: result.local?.missingLocalSpecs ?? [],
        missingLocalWitnesses: result.local?.missingLocalWitnesses ?? [],
        shipWitnesses: result.local?.shipWitnesses ?? [],
      },
    };
  }

  if (result.classification === 'delegated') {
    return {
      ...base,
      delegated: {
        pins: result.delegated?.pins ?? [],
        protocolsComplete: Object.fromEntries(
          Object.entries(result.delegated?.signals ?? {}).map(([key, value]) => [
            key,
            Boolean(value.complete),
          ])
        ),
      },
    };
  }

  return {
    ...base,
    missingSummary: {
      localScripts: result.missing?.localScripts?.length ?? 0,
      localSpecs: result.missing?.localSpecs?.length ?? 0,
      localWitnesses: result.missing?.localWitnesses?.length ?? 0,
      shipWitnessMissing: Boolean(result.missing?.shipWitnessMissing),
      delegatedPinsPresent: result.missing?.delegatedPinsPresent ?? [],
      delegatedProtocolsMissing: result.missing?.delegatedProtocolsMissing ?? [],
      providerScripts: result.missing?.providerScripts?.length ?? 0,
      providerSpecs: result.missing?.providerSpecs?.length ?? 0,
    },
  };
}

const spec = readJson(SPEC);
const repos = selectedRepos(spec);
const results = repos.map((repo) => classify(repo, spec));
const summary = results.reduce((acc, result) => {
  acc[result.classification] = (acc[result.classification] ?? 0) + 1;
  return acc;
}, {});
const strictPass = results.every((result) => result.valid);
const atParity = results.filter((result) => result.valid).length;
const gapCount = results.filter((result) => result.classification === 'gap').length;

const witness = {
  schema: 'gtcx://fabric-os/qasc-dslc-ship-fleet-parity-witness/v1',
  generatedAt: new Date().toISOString(),
  ownerRepo: 'fabric-os',
  contract: SPEC_REL,
  contractVersion: spec.version,
  sourceHandoff: spec.sourceHandoff ?? null,
  commandHealth: {
    ok: true,
    status: 'pass',
    scanCompleted: true,
    repoCount: results.length,
  },
  strictParity: {
    ok: strictPass,
    atParity,
    gapCount,
    rule: 'strict parity passes only when every repo is local-complete, fabric-provider, delegated, or exempt',
  },
  strictPass,
  repoCount: results.length,
  summary,
  results: results.map((result) => compactResult(result)),
};

if (WRITE) {
  mkdirSync(dirname(OUT), { recursive: true });
  mkdirSync(dirname(REPORT), { recursive: true });
  mkdirSync(OUTBOUND_DIR, { recursive: true });
  writeFileSync(OUT, `${JSON.stringify(witness, null, 2)}\n`);
  writeFileSync(REPORT, renderReport(witness));
  for (const result of results.filter((item) => item.classification === 'gap')) {
    writeFileSync(handoffPath(result.repo), renderHandoff(result, witness));
  }
}

if (JSON_OUT) {
  console.log(JSON.stringify(witness, null, 2));
} else {
  console.log(`QASC/DSLC/SHIP fleet parity: ${strictPass ? 'STRICT PASS' : 'STRICT GAP'}`);
  console.log(`repos: ${results.length}`);
  for (const [classification, count] of Object.entries(summary).sort()) {
    console.log(`${classification}: ${count}`);
  }
  for (const result of results) {
    console.log(`${result.repo}: ${result.classification}${result.valid ? '' : ' — gap'}`);
  }
  if (WRITE) {
    console.log('witness=audit/evidence/qasc-dslc-ship-fleet-parity-latest.json');
    console.log(`report=audit/reports/qasc-dslc-ship-fleet-parity-${DATE}.md`);
  }
}

process.exit(STRICT && !strictPass ? 1 : 0);
