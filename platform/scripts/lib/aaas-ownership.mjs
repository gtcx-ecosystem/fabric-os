/**
 * AaaS enforced ownership — pure functions (no fs).
 *
 * The L5 Team & Ownership addition (§4c.4): ownership stops being a doc convention
 * and becomes machine-checkable. Every required artifact folder must carry an owner
 * + SLA + escalation binding in the contract; every handoff item must name an owner;
 * an artifact past its SLA escalates. Unowned artifact type or unowned handoff item
 * = a contract violation (hard fail). SLA breaches escalate (flagged, --strict fails).
 */

/** Resolve the ownership binding for an artifact folder type from the contract. */
export function resolveArtifactOwnership(contract, type) {
  return contract?.ownership?.artifacts?.[type] ?? null;
}

/**
 * Evaluate ownership.
 *  contract       — the AaaS contract (carries ownership + obligations.requiredFolders)
 *  artifacts      — [{ type, ageDays }]  observed artifact instances (for SLA)
 *  handoffItems   — [{ action?, owner }] handoff directives to check for an owner
 * Returns a witness partitioning violations (hard) from escalations (SLA).
 */
export function evaluateOwnership({ contract, artifacts = [], handoffItems = [] }) {
  const required = contract?.obligations?.repo?.requiredFolders ?? [];
  const handoffSla = contract?.ownership?.handoffItem?.slaDays ?? null;

  // 1. Every required folder must have an ownership binding.
  const unownedTypes = required.filter((t) => !resolveArtifactOwnership(contract, t));

  // 2. Every handoff item must name an owner.
  const ownerField = contract?.ownership?.handoffItem?.ownerField ?? 'owner';
  const missingOwner = handoffItems
    .map((h, i) => ({ i, owner: h?.[ownerField], action: h?.action ?? `item ${i}` }))
    .filter((h) => !h.owner || String(h.owner).trim() === '');

  // 3. SLA status per observed artifact instance; breaches escalate.
  const escalations = [];
  const slaStatus = artifacts.map((a) => {
    const binding = resolveArtifactOwnership(contract, a.type);
    const slaDays = binding?.slaDays ?? null;
    const breached = slaDays != null && typeof a.ageDays === 'number' && a.ageDays > slaDays;
    if (breached) {
      escalations.push({
        type: a.type,
        owner: binding?.owner ?? null,
        ageDays: a.ageDays,
        slaDays,
        escalation: binding?.escalation ?? null,
      });
    }
    return { type: a.type, owner: binding?.owner ?? null, ageDays: a.ageDays ?? null, slaDays, withinSla: !breached };
  });

  const violations = [
    ...unownedTypes.map((t) => ({ kind: 'unowned-artifact-type', type: t })),
    ...missingOwner.map((h) => ({ kind: 'handoff-item-no-owner', action: h.action })),
  ];

  return {
    schema: 'gtcx://fabric-os/aaas-ownership/v1',
    requiredTypes: required.length,
    ownedTypes: required.length - unownedTypes.length,
    handoffItemsChecked: handoffItems.length,
    handoffItemsUnowned: missingOwner.length,
    handoffSlaDays: handoffSla,
    slaStatus,
    escalations,
    violations,
    // Hard fail on a contract violation; SLA breaches escalate but don't fail by default.
    ok: violations.length === 0,
  };
}
