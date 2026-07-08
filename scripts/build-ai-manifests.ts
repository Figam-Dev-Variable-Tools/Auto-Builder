/**
 * build-ai-manifests — regenerates the DATA-DERIVED manifests in `.ai/` from the
 * real source of truth, so the AI memory layer never drifts from the codebase.
 *
 * Suggested package.json wiring (add by hand — this script does NOT edit package.json):
 *   "ai:manifests": "tsx scripts/build-ai-manifests.ts"
 *   "ds:build":     "npm run tokens:build && npm run manifest:build && npm run catalog:build && npm run ai:manifests"
 *
 * IT REGENERATES (overwrites) only the data-derived files:
 *   PROJECT_MANIFEST.json, DESIGN_MANIFEST.json, COMPONENT_INDEX.json, TOKEN_INDEX.json,
 *   FIGMA_MAPPING.json, PLUGIN_INDEX.json, VARIANT_INDEX.json, DEPENDENCY_GRAPH.json
 *
 * IT NEVER TOUCHES the seed/planned files (maintained by humans/agents):
 *   RESPONSIVE_RULES.json, INTERACTION_RULES.json, ANIMATION_RULES.json, ERD.json,
 *   API_SPEC.json, TASKS.json, SESSION_SUMMARY.md, CHANGELOG.md, REVIEW_REPORT.md
 *
 * Counting note: the SOURCE view is 60 components (24 atoms / 27 molecules / 9 organisms),
 * matching docs/COMPONENTS.md, src/components/metas.ts and .ai/COMPONENT_INDEX.json. The Figma
 * manifest expands components with a `type` (A/B/C) axis into one entry per preset — 96 Figma
 * component entries / 86 component sets / 3,792 variants. Both numbers are surfaced, clearly labelled.
 *
 * Prefer reading the already-GENERATED artifacts (run `npm run ds:build` first if source changed):
 *   src/generated/design-system.manifest.json, src/tokens/generated/figma.tokens.json, figma/tds.plugin.json
 * plus a dynamic import of every *.meta.ts (mirrors scripts/build-catalog.ts) for the 60-source view.
 */
/* eslint-disable @typescript-eslint/no-explicit-any --
   Codegen script that ingests dynamically-shaped GENERATED JSON at its read boundaries
   (src/generated/design-system.manifest.json, src/tokens/generated/figma.tokens.json,
   figma/tds.plugin.json, package.json) plus *.meta.ts modules loaded via dynamic import.
   `any` is the pragmatic type here; the authoritative shapes are typed in scripts/build-manifest.ts,
   src/core and src/tokens. */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');
const AI_DIR = join(ROOT, '.ai');
const GENERATED_AT = new Date().toISOString();
const GENERATOR = 'scripts/build-ai-manifests.ts';

/* ------------------------------------------------------------------ helpers */

function readJson<T = any>(rel: string): T | null {
  const p = join(ROOT, rel);
  if (!existsSync(p)) {
    console.warn(`[ai-manifests] source missing, skipping downstream: ${rel}`);
    return null;
  }
  return JSON.parse(readFileSync(p, 'utf8')) as T;
}

function write(name: string, obj: unknown): void {
  writeFileSync(join(AI_DIR, name), JSON.stringify(obj, null, 2) + '\n', 'utf8');
  console.log(`[ai-manifests] wrote .ai/${name}`);
}

function base(name: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    $schema: `https://tds.dev/schemas/${name}.json`,
    version: 1,
    generatedAt: GENERATED_AT,
    generator: GENERATOR,
    ...extra,
  };
}

/** id "color.bg.default" -> css var "--tds-color-bg-default" */
const cssVarOf = (id: string): string => `--tds-${id.replace(/\./g, '-')}`;

/** Recursively collect every *.meta.ts path (mirrors build-catalog.ts). */
function findMetaFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...findMetaFiles(full));
    else if (entry.name.endsWith('.meta.ts')) out.push(full);
  }
  return out;
}

/** Pick the exported ComponentMeta from a module (the `*Meta` object). */
function pickMeta(mod: Record<string, unknown>): any | undefined {
  for (const value of Object.values(mod)) {
    if (
      value &&
      typeof value === 'object' &&
      'name' in (value as object) &&
      'category' in (value as object) &&
      'variantProps' in (value as object)
    ) {
      return value;
    }
  }
  return undefined;
}

async function loadSourceMetas(): Promise<any[]> {
  const dir = join(ROOT, 'src', 'components');
  const files = findMetaFiles(dir).sort();
  const metas: any[] = [];
  for (const file of files) {
    try {
      const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
      const meta = pickMeta(mod);
      if (meta) metas.push({ ...meta, sourcePath: relative(ROOT, file).replace(/\\/g, '/') });
    } catch (err) {
      console.warn(`[ai-manifests] failed to import ${file}: ${(err as Error).message}`);
    }
  }
  return metas;
}

const CATEGORY_KEY: Record<string, string> = { atom: 'atoms', molecule: 'molecules', organism: 'organisms' };

function countByCategory(metas: any[]): Record<string, number> {
  const c: Record<string, number> = { atoms: 0, molecules: 0, organisms: 0 };
  for (const m of metas) c[CATEGORY_KEY[m.category] ?? m.category] = (c[CATEGORY_KEY[m.category] ?? m.category] ?? 0) + 1;
  return c;
}

function comboCount(m: any): number {
  const axes: any[] = m.variantProps ?? [];
  return axes.reduce((n, a) => n * Math.max(1, (a.options ?? []).length), 1);
}

/* ------------------------------------------------------------------- builders */

async function main() {
  if (!existsSync(AI_DIR)) {
    console.error('[ai-manifests] .ai/ directory not found — nothing to do.');
    process.exit(1);
  }

  const pkg = readJson<any>('package.json');
  const dsManifest = readJson<any>('src/generated/design-system.manifest.json');
  const figmaTokens = readJson<any>('src/tokens/generated/figma.tokens.json');
  const bundle = readJson<any>('figma/tds.plugin.json');
  const metas = await loadSourceMetas();

  const sourceCounts = countByCategory(metas);
  const sourceTotal = metas.length;

  /* ---- PROJECT_MANIFEST.json ---- */
  if (pkg) {
    write('PROJECT_MANIFEST.json', base('project-manifest', {
      authority: 'docs/ai-os/00_MASTER_RULES.md',
      description: 'Root descriptor of the TDS repository for AI agents. Read after .ai/SESSION_SUMMARY.md.',
      identity: {
        name: pkg.name,
        version: pkg.version,
        type: pkg.type,
        node: pkg.engines?.node,
        private: pkg.private,
      },
      stack: ['React 18', 'Vite 5', 'TypeScript 5', 'Storybook 8'],
      scripts: pkg.scripts ?? {},
      dependencies: pkg.dependencies ?? {},
      aliases: {
        '@/*': 'src/*',
        '@core/*': 'src/core/*',
        '@components/*': 'src/components/*',
        '@tokens/*': 'src/tokens/*',
      },
      barrel: '@/components',
      sourceOfTruthHierarchy: [
        'docs/ai-os/00_MASTER_RULES.md (constitution)',
        'Storybook + *.meta.ts / src/tokens/* (sources)',
        'generated manifests (src/generated/*, src/tokens/generated/*, figma/tds.plugin.json)',
        'Figma (reproduction; never flows back up)',
      ],
      structure: {
        source: ['src/tokens', 'src/core', 'src/components', 'src/hooks', 'src/utils', 'src/styles', 'src/stories'],
        generated: ['src/generated', 'src/tokens/generated', 'figma/tds.plugin.json', 'figma/plugin/code.js'],
        scripts: 'scripts/',
        aiOsDocs: 'docs/ai-os/',
        aiState: '.ai/',
      },
      planned: {
        note: 'These do NOT exist in the repo today.',
        items: ['backend/server', 'database', 'Supabase', 'REST/GraphQL/RPC API', 'auth', 'CI (.github)', 'unit/e2e test framework (vitest/playwright/jest)'],
        targetBackend: 'Supabase (Postgres/Auth/RLS/Storage/Edge Functions/Realtime) + Node >=20 / TypeScript API, scaling beyond 10,000,000 users',
      },
    }));
  }

  /* ---- DESIGN_MANIFEST.json ---- */
  {
    const colls = (figmaTokens?.collections ?? []).map((c: any) => ({ name: c.name, id: c.id, modes: c.modes, variables: c.variables.length }));
    write('DESIGN_MANIFEST.json', base('design-manifest', {
      title: 'TDS Design System summary',
      designLock: 'Storybook is the ONLY source of visual truth (immutable); Figma is a pixel-perfect reproduction, never a redesign.',
      sources: ['src/components/metas.ts', 'src/generated/design-system.manifest.json', 'src/tokens/generated/figma.tokens.json', 'figma/tds.plugin.json'],
      components: {
        sourceView: { total: sourceTotal, ...sourceCounts, note: 'Catalog/source components (docs/COMPONENTS.md, metas.ts, COMPONENT_INDEX.json).' },
        figmaView: dsManifest?.summary
          ? {
              componentEntries: dsManifest.summary.components,
              atoms: dsManifest.summary.atoms,
              molecules: dsManifest.summary.molecules,
              organisms: dsManifest.summary.organisms,
              componentSets: dsManifest.summary.componentSets,
              totalFigmaVariants: dsManifest.summary.totalFigmaVariants,
              note: 'Figma-facing entries after `type` (A/B/C) preset splitting in build-manifest.ts.',
            }
          : null,
      },
      axes: {
        type: 'A/B/C — layout preset (split into one Figma set per preset)',
        variant: 'labelled "Style" — visual fill (solid/outline/ghost/soft/link)',
        tone: 'brand/neutral/success/warning/danger',
        size: 'sm/md/lg',
        shape: 'rounded/pill/square',
        state: 'default/hover/active/focus/disabled/loading — NOT emitted as a Figma variant',
      },
      tokens: {
        total: figmaTokens ? colls.reduce((n: number, c: any) => n + c.variables, 0) + (figmaTokens.effectStyles?.length ?? 0) + (figmaTokens.textStyles?.length ?? 0) : null,
        collections: colls,
        effectStyles: figmaTokens?.effectStyles?.length ?? 0,
        textStyles: figmaTokens?.textStyles?.length ?? 0,
        themeModes: ['light', 'dark'],
      },
    }));
  }

  /* ---- COMPONENT_INDEX.json (60-source reuse view) ---- */
  if (metas.length) {
    write('COMPONENT_INDEX.json', base('component-index', {
      purpose: 'Reuse-first index. Read this before opening any component source. 60 source components.',
      count: sourceTotal,
      categories: sourceCounts,
      components: metas
        .map((m) => ({
          slug: m.slug,
          name: m.name,
          category: m.category,
          tags: m.tags ?? [],
          variantAxes: Object.fromEntries((m.variantProps ?? []).map((v: any) => [v.name, v.options])),
          componentProps: (m.componentProps ?? []).map((p: any) => ({ name: p.name, type: p.type, figmaType: p.figmaType })),
          states: m.states ?? [],
          isComponentSet: m.isComponentSet ?? comboCount(m) > 1,
          description: (m.description ?? '').replace(/\s*\n\s*/g, ' '),
          sourcePath: m.sourcePath,
        }))
        .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    }));

    /* ---- VARIANT_INDEX.json ---- */
    write('VARIANT_INDEX.json', base('variant-index', {
      purpose: 'Variant axis vocabulary + per-component axes and combination counts.',
      stateAxisNote: 'The state axis is deliberately NOT emitted as a Figma variant (would explode combos). disabled/loading survive as BOOLEAN component props.',
      axisVocabulary: {
        type: ['A', 'B', 'C'],
        variantStyle: ['solid', 'outline', 'ghost', 'soft', 'link'],
        tone: ['brand', 'neutral', 'success', 'warning', 'danger'],
        size: ['sm', 'md', 'lg'],
        shape: ['rounded', 'pill', 'square'],
        state: ['default', 'hover', 'active', 'focus', 'disabled', 'loading'],
      },
      components: metas
        .map((m) => ({
          slug: m.slug,
          name: m.name,
          category: m.category,
          axes: (m.variantProps ?? []).map((v: any) => ({ name: v.name, label: v.label, options: v.options, default: v.default })),
          reactCombos: comboCount(m),
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  }

  /* ---- TOKEN_INDEX.json ---- */
  if (figmaTokens) {
    write('TOKEN_INDEX.json', base('token-index', {
      sources: ['src/tokens/generated/figma.tokens.json', 'src/tokens/generated/token-ids.ts'],
      purpose: 'Token index. All styling uses var(--tds-*); never hardcode design values.',
      cssPrefix: '--tds-',
      naming: {
        id: 'dot-notation (color.bg.default)',
        cssVar: '--tds-<id-with-dots-as-dashes> (--tds-color-bg-default)',
        figmaName: 'slash-notation (color/bg/default)',
      },
      themeModes: ['light', 'dark'],
      collections: (figmaTokens.collections ?? []).map((c: any) => ({
        name: c.name,
        id: c.id,
        modes: c.modes,
        count: c.variables.length,
        variables: c.variables.map((v: any) => ({
          id: v.id,
          figmaName: v.name,
          type: v.figmaType,
          cssVar: cssVarOf(v.id),
          scopes: v.scopes,
          group: v.group,
        })),
      })),
      effectStyles: (figmaTokens.effectStyles ?? []).map((s: any) => s.name),
      textStyles: (figmaTokens.textStyles ?? []).map((s: any) => s.name),
    }));
  }

  /* ---- FIGMA_MAPPING.json ---- */
  if (bundle?.design) {
    const comps = bundle.design.components ?? [];
    write('FIGMA_MAPPING.json', base('figma-mapping', {
      title: 'Storybook -> Figma mapping (post type-preset split).',
      source: 'figma/tds.plugin.json (design.components)',
      contract: 'figma/README.md',
      bundleSummary: bundle.design.summary ?? null,
      pageTaxonomy: ['Foundation', 'Layout', 'Navigation', 'Actions', 'Input', 'Data Display', 'Feedback', 'Overlay'],
      stateAxisNote: 'state is NOT a Figma variant; disabled/loading -> BOOLEAN component properties.',
      components: comps.map((c: any) => ({
        name: c.name,
        isComponentSet: c.isComponentSet,
        variantAxes: (c.variantAxes ?? []).map((a: any) => ({ name: a.name, options: a.options })),
        figmaProperties: (c.figmaProperties ?? []).map((p: any) => ({ propName: p.propName, figmaPropertyType: p.figmaPropertyType })),
      })),
    }));
  }

  /* ---- PLUGIN_INDEX.json ---- */
  {
    const pluginManifest = readJson<any>('figma/plugin/manifest.json');
    const srcDir = join(ROOT, 'figma', 'plugin', 'src');
    const modules = existsSync(srcDir)
      ? readdirSync(srcDir).filter((f) => f.endsWith('.ts')).sort()
      : [];
    write('PLUGIN_INDEX.json', base('plugin-index', {
      title: 'Figma plugin module index — reproduces the system from the bundle with no per-component code.',
      pluginName: pluginManifest?.name ?? 'TDS',
      root: 'figma/plugin/',
      entry: { source: 'figma/plugin/src/code.ts', built: 'figma/plugin/code.js (generated, git-ignored)' },
      manifest: pluginManifest
        ? { main: pluginManifest.main, ui: pluginManifest.ui, networkAccess: pluginManifest.networkAccess }
        : null,
      buildCommand: 'npm run plugin:build (esbuild figma/plugin/src/code.ts --bundle --format=iife)',
      testHarness: 'figma/plugin/test/harness.ts (npm run plugin:test) — headless Figma-API mock; process.exit(1) on any coverage mismatch',
      modules,
      algorithm: [
        'Iterate tokens.collections -> createVariableCollection/addMode/createVariable/scopes/valuesByMode (resolve VARIABLE_ALIAS)',
        'Create Effect + Text styles',
        'For each design.component: build base frame from figma{}, generate cartesian product of variantAxes as variants named "Axis=value, ...", register figmaProperties, apply tokenBindings honoring when{}',
        'Route components onto 8 pages via pages.ts classifier',
      ],
    }));
  }

  /* ---- DEPENDENCY_GRAPH.json ---- */
  if (pkg) {
    write('DEPENDENCY_GRAPH.json', base('dependency-graph', {
      title: 'Build & dependency graph of the TDS pipeline.',
      aliases: { '@/*': 'src/*', '@core/*': 'src/core/*', '@components/*': 'src/components/*', '@tokens/*': 'src/tokens/*' },
      runtimeDeps: Object.keys(pkg.dependencies ?? {}),
      pipelines: {
        'ds:build': ['tokens:build', 'manifest:build', 'catalog:build'],
        'figma:build': ['ds:build', 'plugin:typecheck', 'plugin:build', 'plugin:test'],
      },
      edges: [
        { from: 'src/tokens/*', via: 'scripts/build-tokens.ts', to: ['src/tokens/generated/tokens.css', 'src/tokens/generated/figma.tokens.json', 'src/tokens/generated/token-ids.ts'] },
        { from: ['src/components/metas.ts', 'src/tokens/generated/figma.tokens.json'], via: 'scripts/build-manifest.ts', to: ['src/generated/design-system.manifest.json', 'figma/tds.plugin.json'] },
        { from: 'src/components/*.meta.ts', via: 'scripts/build-catalog.ts', to: ['docs/COMPONENTS.md'] },
        { from: ['package.json', 'src/generated/*', 'src/tokens/generated/*', 'figma/tds.plugin.json', 'src/components/*.meta.ts'], via: 'scripts/build-ai-manifests.ts', to: ['.ai/*.json (data-derived)'] },
        { from: 'figma/tds.plugin.json', via: 'figma/plugin/src/code.ts (esbuild)', to: ['figma/plugin/code.js', 'Figma document'] },
      ],
    }));
  }

  console.log('[ai-manifests] done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
