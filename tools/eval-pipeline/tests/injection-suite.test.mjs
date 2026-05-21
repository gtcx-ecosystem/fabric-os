/**
 * @fileoverview Static defenses around the prompt-injection suite.
 *
 * The full LLM-driven red-team runs in the eval-pipeline CI job; here
 * we only verify that the schema validates each payload (so it actually
 * reaches the model) and that buildUserMessage wraps the context in
 * the delimiter markers the system prompt instructs the model to honor.
 *
 * If a payload starts failing the schema, either the schema got too
 * strict and we lost a known attack vector from the suite, or the
 * payload needs updating — both deserve a human look.
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';

import { INJECTION_PAYLOADS, runStaticChecks } from '../injection-suite.mjs';

describe('injection suite static checks', () => {
  it('has at least 10 payloads', () => {
    assert.ok(INJECTION_PAYLOADS.length >= 10, `expected ≥10 payloads, got ${INJECTION_PAYLOADS.length}`);
  });

  it('every payload passes schema validation', () => {
    const results = runStaticChecks();
    const failures = results.filter((r) => !r.schemaPassed);
    assert.strictEqual(
      failures.length,
      0,
      `payloads must validate; failing: ${JSON.stringify(failures)}`,
    );
  });

  it('every accepted payload is wrapped in BEGIN/END delimiters', () => {
    const results = runStaticChecks();
    const undelimited = results.filter(
      (r) => r.schemaPassed && (!r.hasDelimiter || !r.hasEndDelimiter),
    );
    assert.strictEqual(
      undelimited.length,
      0,
      `delimiter missing on: ${JSON.stringify(undelimited)}`,
    );
  });

  it('every payload has a unique id', () => {
    const ids = INJECTION_PAYLOADS.map((p) => p.id);
    assert.strictEqual(new Set(ids).size, ids.length, 'duplicate payload ids');
  });
});
