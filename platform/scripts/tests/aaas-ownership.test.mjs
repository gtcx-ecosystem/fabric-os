#!/usr/bin/env node
/**
 * AaaS enforced ownership — validation suite.
 * Guards the L5 Team & Ownership behavior: unowned artifact type or unowned
 * handoff item is a hard violation; SLA breaches escalate.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveArtifactOwnership, evaluateOwnership } from '../lib/aaas-ownership.mjs';

const contract = {
  obligations: { repo: { requiredFolders: ['audit/evidence', 'audit/handoff', 'reports'] } },
  ownership: {
    artifacts: {
      'audit/evidence': { owner: 'fabric-os', slaDays: 7, escalation: 'P24 -> bridge-os' },
      'audit/handoff': { owner: 'fabric-os', slaDays: 7, escalation: 'P24 -> repo' },
      reports: { owner: 'repo', slaDays: 30, escalation: 'P24 -> repo' },
    },
    handoffItem: { ownerField: 'owner', slaDays: 14, escalation: 'P24 to named owner' },
  },
};

describe('resolveArtifactOwnership', () => {
  it('resolves a binding or null', () => {
    assert.equal(resolveArtifactOwnership(contract, 'audit/evidence').owner, 'fabric-os');
    assert.equal(resolveArtifactOwnership(contract, 'nope'), null);
  });
});

describe('evaluateOwnership — violations (hard)', () => {
  it('passes when every required type is owned and handoff items have owners', () => {
    const w = evaluateOwnership({
      contract,
      artifacts: [{ type: 'audit/evidence', ageDays: 1 }],
      handoffItems: [{ action: 'Raise compliance', owner: 'agile-os' }],
    });
    assert.equal(w.ok, true);
    assert.equal(w.violations.length, 0);
    assert.equal(w.ownedTypes, 3);
  });

  it('flags an unowned required artifact type', () => {
    const c2 = JSON.parse(JSON.stringify(contract));
    delete c2.ownership.artifacts.reports;
    const w = evaluateOwnership({ contract: c2 });
    assert.equal(w.ok, false);
    assert.ok(w.violations.some((v) => v.kind === 'unowned-artifact-type' && v.type === 'reports'));
  });

  it('flags a handoff item with no owner', () => {
    const w = evaluateOwnership({
      contract,
      handoffItems: [{ action: 'do X', owner: 'agile-os' }, { action: 'do Y', owner: '' }],
    });
    assert.equal(w.ok, false);
    assert.equal(w.handoffItemsUnowned, 1);
    assert.ok(w.violations.some((v) => v.kind === 'handoff-item-no-owner' && v.action === 'do Y'));
  });
});

describe('evaluateOwnership — SLA escalation (soft)', () => {
  it('escalates an artifact past its SLA but does not hard-fail', () => {
    const w = evaluateOwnership({
      contract,
      artifacts: [{ type: 'audit/evidence', ageDays: 20 }],
    });
    assert.equal(w.ok, true); // SLA breach escalates, not a violation
    assert.equal(w.escalations.length, 1);
    assert.equal(w.escalations[0].type, 'audit/evidence');
    assert.equal(w.escalations[0].slaDays, 7);
    assert.match(w.escalations[0].escalation, /bridge-os/);
    assert.equal(w.slaStatus[0].withinSla, false);
  });

  it('keeps a within-SLA artifact clean', () => {
    const w = evaluateOwnership({ contract, artifacts: [{ type: 'reports', ageDays: 10 }] });
    assert.equal(w.escalations.length, 0);
    assert.equal(w.slaStatus[0].withinSla, true);
  });
});
