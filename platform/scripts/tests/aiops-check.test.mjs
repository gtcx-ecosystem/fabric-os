#!/usr/bin/env node
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateLane } from '../aiops-check.mjs';

describe('aiops-check', () => {
  it('returns 11 pillars', () => {
    const { witness } = evaluateLane();
    assert.equal(witness.pillars.length, 11);
  });

  it('foundation scaffold is green', () => {
    const { witness } = evaluateLane();
    assert.ok(witness.foundationScore100 >= 80);
  });
});
