/**
 * GS-MATURITY-LANE-001 — external assurance witness lane fields.
 * @see pm/spec/assurance-lane-witness-fields.json
 */

/** @param {Record<string, unknown>} witness */
export function applyExternalAssuranceLane(witness, opts = {}) {
  const segment = opts.procurementSegment ?? 'enterpriseUsEu';
  return {
    ...witness,
    lane: 'externalAssurance',
    blocksEngineeringMaturity: false,
    blocksIntegratorPilotGtm: false,
    blocksGtmStage: false,
    blocksIR: witness.blocksIR ?? false,
    blocksAnyRepo: witness.blocksAnyRepo ?? false,
    procurementSegment: segment,
    dealQualificationOnly: true,
    policy: witness.policy ?? 'GS-MATURITY-LANE-001',
  };
}

const REQUIRED = [
  'lane',
  'blocksEngineeringMaturity',
  'blocksIntegratorPilotGtm',
  'blocksGtmStage',
];

/**
 * @param {Record<string, unknown>} witness
 * @param {string} relPath
 */
export function validateExternalAssuranceWitness(witness, relPath) {
  const failures = [];
  for (const key of REQUIRED) {
    if (witness[key] === undefined) failures.push(`missing:${key}`);
  }
  if (witness.lane !== 'externalAssurance') failures.push(`lane:${witness.lane}`);
  if (witness.blocksEngineeringMaturity !== false) failures.push('blocksEngineeringMaturity:not-false');
  if (witness.blocksIntegratorPilotGtm !== false) failures.push('blocksIntegratorPilotGtm:not-false');
  if (witness.blocksGtmStage !== false) failures.push('blocksGtmStage:not-false');
  if (witness.blocksAnyRepo === true) failures.push('blocksAnyRepo:true');
  return { ok: failures.length === 0, failures, path: relPath };
}

/** Basenames under audit/evidence/ requiring externalAssurance lane fields. */
export const EXTERNAL_ASSURANCE_WITNESS_FILES = [
  'secas-pentest-ingest-check-latest.json',
  'secas-pentest-remediation-check-latest.json',
  'secas-parallel-lane-check-latest.json',
  'legalops-check-latest.json',
  'legal-friction-check-latest.json',
  'ext-inf-002-sow-approval-2026-06-10.json',
  'm3-external-certification-latest.json',
];

export function isExternalAssuranceWitnessFilename(name) {
  if (EXTERNAL_ASSURANCE_WITNESS_FILES.includes(name)) return true;
  if (/pentest/i.test(name) && name.endsWith('.json')) return true;
  if (/soc2/i.test(name) && name.endsWith('.json')) return true;
  if (/^ext-inf-/i.test(name) && name.endsWith('.json')) return true;
  return false;
}
