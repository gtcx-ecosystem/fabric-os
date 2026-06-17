/**
 * Docs tree gates — single enforceable /docs walker (root → nested → files)
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { isPointerStub, looseMarkdownAtRoot } from './docs-decompose-gates.mjs';
import { profileKeyFromTier, readProductTier, resolveDocsPack } from './resolve-docs-pack.mjs';

export function gate(id, ok, detail = null) {
  return { id, ok, ...(detail ? { detail } : {}) };
}

export function loadTreeSpec(repoRoot) {
  const local = join(repoRoot, 'pm/spec/docs-tree-spec.json');
  const canon = join(repoRoot, '../canon-os/pm/spec/docs-tree-spec.json');
  const path = existsSync(local) ? local : canon;
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function loadDocTypes(repoRoot) {
  const local = join(repoRoot, 'pm/spec/docs-document-types.json');
  const canon = join(repoRoot, '../canon-os/pm/spec/docs-document-types.json');
  const path = existsSync(local) ? local : canon;
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function resolveTreeProfile(spec, repoRoot) {
  const sorPath = join(repoRoot, 'docs/sor.json');
  if (existsSync(sorPath)) {
    try {
      const kind = JSON.parse(readFileSync(sorPath, 'utf8')).repoKind;
      if (kind && spec.profiles?.[kind]) return kind;
    } catch {
      /* fall through */
    }
  }
  const tier = profileKeyFromTier(readProductTier(repoRoot));
  if (spec.profiles?.[tier]) return tier;
  if (tier === 'platform' && spec.profiles?.product) return 'product';
  return 'product';
}

export function resolveProfileBlock(spec, profileKey) {
  const block = spec.profiles?.[profileKey];
  if (!block) return spec.profiles?.product;
  if (block.inherits) return { ...spec.profiles[block.inherits], ...block, inherits: block.inherits };
  return block;
}

export function readIaExemptions(repoRoot) {
  const sorPath = join(repoRoot, 'docs/sor.json');
  if (!existsSync(sorPath)) return { readmeExempt: [], depthExempt: [] };
  try {
    const sor = JSON.parse(readFileSync(sorPath, 'utf8'));
    return {
      readmeExempt: sor.iaExemptions?.readmeExemptPathPrefixes ?? [],
      depthExempt: sor.iaExemptions?.depthExemptPathPrefixes ?? [],
    };
  } catch {
    return { readmeExempt: [], depthExempt: [] };
  }
}

function isExemptPath(relPath, prefixes) {
  const norm = relPath.replace(/\\/g, '/');
  return prefixes.some((p) => norm === p.replace(/\/$/, '') || norm.startsWith(p.replace(/\/$/, '') + '/'));
}

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('---', 3);
  if (end < 0) return null;
  const block = text.slice(3, end).trim();
  const out = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return out;
}

function countMd(dir) {
  let n = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules') continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) n++;
    }
  };
  if (existsSync(dir)) walk(dir);
  return n;
}

function subfolderCount(dir) {
  if (!existsSync(dir)) return 0;
  return readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
}

function layerRootAllowlist(spec, layerId) {
  const base = new Set(spec.universal?.layerRootAllowlist ?? []);
  if (layerId === 'foundation') {
    for (const f of spec.universal?.foundationRootExtra ?? []) base.add(f);
  }
  if (layerId === 'roadmap') {
    for (const f of spec.universal?.roadmapRootExtra ?? []) base.add(f);
  }
  return base;
}

function allowedNestedDir(name, patterns) {
  return patterns.some((p) => new RegExp(p).test(name));
}

function collectPackPaths(repoRoot, packName, profileKey = 'product') {
  const resolution = resolveDocsPack(repoRoot, packName);
  const pack = resolution.resolved;
  if (!pack || !resolution.resolvedIsFull) return { requiredFiles: [], subfolders: new Set(), optionalSubfolders: new Set() };

  const requiredFiles = [];
  for (const f of pack.requiredFiles ?? []) requiredFiles.push(f.path);
  for (const f of pack.requiredRootFiles ?? []) requiredFiles.push(f.path);

  const subfolders = new Set(Object.keys(pack.requiredSubfolders ?? {}));
  const optionalSubfolders = new Set(Object.keys(pack.optionalSubfolders ?? {}));

  const profile = pack.profiles?.[profileKey] ?? pack.profiles?.product;
  if (profile?.requiredSubfolders) {
    if (Array.isArray(profile.requiredSubfolders)) {
      for (const k of profile.requiredSubfolders) subfolders.add(k);
    } else {
      for (const k of Object.keys(profile.requiredSubfolders)) subfolders.add(k);
    }
  }
  for (const k of profile?.optionalSubfolders ?? []) optionalSubfolders.add(k);

  return { requiredFiles, subfolders, optionalSubfolders, pack };
}

export function validateDocsTree(repoRoot, options = {}) {
  const strict = options.strict === true;
  const structureOnly = options.structureOnly === true;
  const strictFiles = !structureOnly && options.strictFiles !== false;
  const gates = [];
  const metrics = {
    mdFiles: 0,
    folders: 0,
    missingReadme: 0,
    missingFrontmatter: 0,
    missingDocumentType: 0,
    unknownTopLevel: 0,
  };

  const spec = loadTreeSpec(repoRoot);
  if (!spec) {
    gates.push(gate('spec:present', false, 'docs-tree-spec.json missing'));
    return { gates, metrics, pass: false };
  }

  gates.push(gate('spec:present', !!spec && !!spec.updated, spec?.updated ?? 'missing'));

  const docsDir = join(repoRoot, 'docs');
  if (!existsSync(docsDir)) {
    gates.push(gate('docs:present', false));
    return { gates, metrics, pass: false };
  }

  const profileKey = resolveTreeProfile(spec, repoRoot);
  const profile = resolveProfileBlock(spec, profileKey);
  gates.push(gate('profile', !!profile, profileKey));

  const exemptions = readIaExemptions(repoRoot);
  const nestedPatterns = spec.universal?.allowedNestedDirPatterns ?? [];
  const intakePrefixes = spec.universal?.intakeZones?.prefixes ?? [];

  for (const entry of spec.universal?.docsRootRequired ?? []) {
    gates.push(gate(`root:${entry.path.replace('docs/', '')}`, existsSync(join(repoRoot, entry.path)), entry.path));
  }

  for (const f of spec.universal?.forbiddenUnderDocsAbsent ?? []) {
    gates.push(
      gate(`absent:${f.path.replace(/\//g, '-')}`, !existsSync(join(repoRoot, f.path)), existsSync(join(repoRoot, f.path)) ? `use ${f.canonical}` : 'ok'),
    );
  }

  const deprecated = new Set((spec.universal?.deprecatedDecompose ?? []).map((d) => d.path.replace(/^docs\//, '')));
  const allowedTop = new Set(profile?.allowedTopLevel ?? []);

  const topDirs = readdirSync(docsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && !e.name.startsWith('.'))
    .map((e) => e.name);

  const unknownTop = topDirs.filter((n) => !allowedTop.has(n) && !deprecated.has(n));
  metrics.unknownTopLevel = unknownTop.length;
  gates.push(gate('top-level:allowlist', unknownTop.length === 0, unknownTop.length ? unknownTop.join(', ') : 'ok'));

  for (const dep of spec.universal?.deprecatedDecompose ?? []) {
    const rel = dep.path.replace(/^docs\//, '');
    if (dep.path === 'docs/governance' && profileKey === 'constitution-standards') continue;
    const abs = join(repoRoot, dep.path);
    if (!existsSync(abs)) continue;
    const entries = readdirSync(abs).filter((n) => n !== 'README.md');
    const pointerOnly = entries.length === 0 || (entries.length === 1 && existsSync(join(abs, 'README.md')) && isPointerStub(join(abs, 'README.md')));
    gates.push(gate(`deprecated:${rel}`, pointerOnly, pointerOnly ? 'pointer-only' : `decompose → ${dep.canonical}`));
  }

  const layers = [...(profile.requiredLayers ?? []), ...(profile.optionalLayers ?? [])];
  for (const layer of profile.requiredLayers ?? []) {
    const layerPath = `docs/${layer.id}`;
    gates.push(gate(`layer:required:${layer.id}`, existsSync(join(repoRoot, layerPath)), layerPath));
    if (layer.requires) {
      for (const req of layer.requires) {
        gates.push(gate(`layer:file:${layer.id}:${req.split('/').pop()}`, existsSync(join(repoRoot, req)), req));
      }
    }
    if (layer.pack) {
      const { requiredFiles, subfolders } = collectPackPaths(repoRoot, layer.pack, profileKey);
      for (const rf of requiredFiles) {
        gates.push(gate(`pack:required:${rf}`, existsSync(join(repoRoot, rf)), rf));
      }
      for (const sub of subfolders) {
        const subPath = join(repoRoot, layerPath, sub);
        gates.push(gate(`pack:subfolder:${layer.id}/${sub}`, existsSync(subPath), `${layerPath}/${sub}/`));
        if (existsSync(subPath)) {
          gates.push(gate(`pack:subfolder-readme:${layer.id}/${sub}`, existsSync(join(subPath, 'README.md')), 'README.md'));
        }
      }
      const layerAbs = join(repoRoot, layerPath);
      if (existsSync(layerAbs)) {
        const allow = layerRootAllowlist(spec, layer.id);
        const loose = looseMarkdownAtRoot(layerAbs, [...allow]);
        gates.push(gate(`layer:root-sprawl:${layer.id}`, loose.length === 0, loose.length ? loose.join(', ') : 'clean'));
      }
    }
  }

  for (const [aux, rules] of Object.entries(profile.auxiliaryTopLevel ?? {})) {
    const auxPath = join(docsDir, aux);
    if (!existsSync(auxPath)) {
      if (!rules.optional) gates.push(gate(`aux:missing:${aux}`, false, `docs/${aux}/`));
      continue;
    }
    for (const req of rules.requires ?? ['README.md']) {
      gates.push(gate(`aux:${aux}:${req}`, existsSync(join(auxPath, req)), req));
    }
  }

  const walk = (dir, relFromDocs = '') => {
    metrics.folders++;
    const relPath = relFromDocs ? `docs/${relFromDocs}` : 'docs';
    const inIntake = isExemptPath(relPath, intakePrefixes);

    if (!isExemptPath(relPath, exemptions.readmeExempt)) {
      const readme = join(dir, 'README.md');
      if (!existsSync(readme)) {
        metrics.missingReadme++;
        if (strict || structureOnly) gates.push(gate(`folder:readme:${relPath}`, false, 'missing README.md'));
      }
    }

    const mdHere = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isFile() && e.name.endsWith('.md'));
    const subdirs = readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory() && !e.name.startsWith('.'));
    const needsFolderSpec = spec.universal?.everyFolder?.folderSpecWhen;
    if (
      needsFolderSpec &&
      !inIntake &&
      relFromDocs &&
      !existsSync(join(dir, 'FOLDER-SPEC.md')) &&
      (mdHere.length >= (needsFolderSpec.mdCountGte ?? 3) || subdirs.length >= (needsFolderSpec.orSubfolderCountGte ?? 1))
    ) {
      const topLayer = relFromDocs.split('/')[0];
      if (allowedTop.has(topLayer) && spec.universal?.everyFolder?.topLevelLayerRequiresFolderSpec) {
        if (strict) gates.push(gate(`folder:spec:${relPath}`, false, 'missing FOLDER-SPEC.md'));
      }
    }

    const parts = relFromDocs.split('/').filter(Boolean);
    if (parts.length === 2 && allowedTop.has(parts[0])) {
      const layer = layers.find((l) => l.id === parts[0]);
      if (layer?.pack) {
        const { subfolders, optionalSubfolders } = collectPackPaths(repoRoot, layer.pack, profileKey);
        const childName = parts[1];
        if (
          !subfolders.has(childName) &&
          !optionalSubfolders.has(childName) &&
          !allowedNestedDir(childName, nestedPatterns) &&
          !inIntake
        ) {
          if (strict) gates.push(gate(`nested:unknown:${relPath}`, false, `not in ${layer.pack} subfolders`));
        }
      }
    }

    for (const ent of readdirSync(dir, { withFileTypes: true })) {
      if (ent.name.startsWith('.') || ent.name === 'node_modules') continue;
      const p = join(dir, ent.name);
      const childRel = relFromDocs ? `${relFromDocs}/${ent.name}` : ent.name;
      if (ent.isDirectory()) {
        walk(p, childRel);
        continue;
      }
      if (!ent.name.endsWith('.md')) continue;
      metrics.mdFiles++;

      const exemptBasenames = new Set(spec.universal?.everyMarkdown?.exemptBasenames ?? []);
      const exemptRoles = new Set(spec.universal?.everyMarkdown?.exemptRoles ?? []);
      if (exemptBasenames.has(ent.name) || exemptRoles.has(ent.name)) continue;
      if (inIntake && !strictFiles) continue;

      const text = readFileSync(p, 'utf8');
      const fm = parseFrontmatter(text);
      if (!fm) {
        metrics.missingFrontmatter++;
        if (strictFiles) gates.push(gate(`file:frontmatter:${childRel}`, false, 'missing YAML frontmatter'));
        continue;
      }
      if (spec.universal?.everyMarkdown?.pointerStatusExempt && fm.status === 'pointer') continue;
      if (!fm.document_type) {
        metrics.missingDocumentType++;
        if (strictFiles) gates.push(gate(`file:document_type:${childRel}`, false, 'missing document_type'));
      }
      const docTypes = loadDocTypes(repoRoot);
      const required = docTypes?.globalFrontmatter?.required ?? [];
      for (const key of required) {
        if (!fm[key] && strictFiles) {
          gates.push(gate(`file:fm:${key}:${childRel}`, false, `missing ${key}`));
        }
      }
    }
  };

  if (strict) {
    walk(docsDir);
  } else if (!structureOnly) {
    walk(docsDir);
  }

  if (!structureOnly && !strict && metrics.missingReadme > 0) {
    gates.push(gate('folder:readme:rollup', false, `${metrics.missingReadme} folders missing README`));
  }
  if (!structureOnly && !strictFiles && (metrics.missingFrontmatter > 0 || metrics.missingDocumentType > 0)) {
    gates.push(
      gate(
        'file:compliance:rollup',
        false,
        `${metrics.missingFrontmatter} missing frontmatter · ${metrics.missingDocumentType} missing document_type`,
      ),
    );
  }

  const failed = gates.filter((g) => !g.ok);
  return { gates, metrics, pass: failed.length === 0, profileKey };
}
