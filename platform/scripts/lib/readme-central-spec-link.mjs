/**
 * Owner repos link folder contracts via README — no local FOLDER-SPEC.md (canon-os SoR).
 */
export function readmeLinksCentralFolderSpec(text, specId) {
  if (!text || !specId) return false;
  const id = specId.replace(/^0+/, '').replace(/-/g, '[-]?'); // loose
  const patterns = [
    new RegExp(specId, 'i'),
    new RegExp(`docs-folders/${specId}`, 'i'),
    new RegExp('canon-os.*docs-folders', 'i'),
    new RegExp('gtcx://canon-os/docs-folders/', 'i'),
  ];
  return patterns.some((re) => re.test(text));
}

export function readmeLinksCentralPack(text, packName) {
  if (!text || !packName) return false;
  return new RegExp(packName.replace('.json', ''), 'i').test(text);
}

export function gateReadmeCentralSpec(readmeText, { specId, packName } = {}) {
  const specOk = specId ? readmeLinksCentralFolderSpec(readmeText, specId) : true;
  const packOk = packName ? readmeLinksCentralPack(readmeText, packName) : true;
  return specOk && packOk;
}

/** Product repos must not ship FOLDER-SPEC.md — contract lives in canon-os JSON. */
export function localFolderSpecForbidden(dir, existsSync, join) {
  const path = join(dir, 'FOLDER-SPEC.md');
  return !existsSync(path);
}
