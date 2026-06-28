#!/usr/bin/env node
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractDateMs,
  extractScore,
  witnessTypeFromFile,
  summarizeRepoAudit,
  evaluateConformance,
} from '../lib/aaas-audit-registry.mjs';

const DAY = 86_400_000;
const now = 1_750_000_000_000;

describe('aaas-audit-registry · extractors', () => {
  it('extracts score from flat and nested multiPillar shapes', () => {
    assert.equal(extractScore({ composite100: 91 }), 91);
    assert.equal(extractScore({ multiPillar: { fullComposite100: 73 } }), 73);
    assert.equal(extractScore({ foo: 1 }), null);
  });
  it('derives witness type from filename', () => {
    assert.equal(witnessTypeFromFile('mpr-repo-latest.json'), 'mpr-repo');
    assert.equal(witnessTypeFromFile('aaas-honesty-gate-latest.json'), 'aaas-honesty-gate');
  });
  it('extracts date from common fields', () => {
    assert.equal(extractDateMs({ date: '2026-06-27' }), Date.parse('2026-06-27'));
    assert.equal(extractDateMs({ nope: 1 }), null);
  });
});

describe('aaas-audit-registry · summarizeRepoAudit', () => {
  it('flags stale witnesses against cadence', () => {
    const s = summarizeRepoAudit({
      repo: 'x',
      nowMs: now,
      cadenceDays: 7,
      witnesses: [
        { file: 'mpr-repo-latest.json', json: { date: new Date(now - 2 * DAY).toISOString(), multiPillar: { fullComposite100: 90 } } },
        { file: 'composite-audit-latest.json', json: { date: new Date(now - 30 * DAY).toISOString(), composite100: 100 } },
        { file: 'aaas-honesty-gate-latest.json', json: { foo: 1 } }, // undateable → stale
      ],
    });
    assert.equal(s.count, 3);
    assert.deepEqual(s.types.sort(), ['aaas-honesty-gate', 'composite-audit', 'mpr-repo']);
    assert.equal(s.staleCount, 2); // composite 30d + undateable honesty
  });
});

describe('aaas-audit-registry · evaluateConformance', () => {
  const contract = {
    obligations: { repo: { requiredFolders: ['audit/evidence', 'audit/reports', 'reports'] } },
    auditProfiles: { product: ['mpr', 'composite', 'honesty'] },
  };
  it('passes a fully conformant repo', () => {
    const r = evaluateConformance({
      binding: { repo: 'p', auditProfile: 'product' },
      contract,
      presentFolders: ['audit/evidence', 'audit/reports', 'reports'],
      repoState: { types: ['mpr-repo', 'composite-audit', 'aaas-honesty-gate'], staleCount: 0 },
      hasPin: true,
    });
    assert.equal(r.ok, true);
  });
  it('fails on missing folder, missing audit type, staleness, or no pin', () => {
    const r = evaluateConformance({
      binding: { repo: 'p', auditProfile: 'product' },
      contract,
      presentFolders: ['audit/evidence'],
      repoState: { types: ['mpr-repo'], staleCount: 1 },
      hasPin: false,
    });
    assert.equal(r.ok, false);
    assert.deepEqual(r.missingFolders, ['audit/reports', 'reports']);
    assert.deepEqual(r.missingAudits.sort(), ['composite', 'honesty']);
    assert.equal(r.staleWitnesses, 1);
    assert.equal(r.hasPin, false);
  });
});
