/**
 * Design System manifest generator.
 *
 * Combines the component metadata (src/components/metas.ts) with the generated
 * Figma token export (src/tokens/generated/figma.tokens.json) into a single
 * machine-readable contract that a future Figma plugin can consume to generate,
 * with NO per-component custom logic:
 *
 *   - Variable Collections, Modes, Variables (+ aliases, scopes)   [from tokens]
 *   - Effect Styles, Text Styles                                    [from tokens]
 *   - Components + Component Sets                                    [from components]
 *   - Variant Properties (incl. a State axis)                       [from components]
 *   - Component Properties (BOOLEAN | TEXT | INSTANCE_SWAP)         [from components]
 *   - Auto Layout / fill / radius / padding bindings                [from components.figma]
 *
 * Outputs:
 *   src/generated/design-system.manifest.json  — the component manifest
 *   figma/tds.plugin.json                       — tokens + components bundle (plugin input)
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { componentMetas } from '../src/components/metas';
import { allCollections, tokenRegistry } from '../src/tokens/index';
import type { ComponentMeta } from '../src/core/types';
import { variantCount } from '../src/core/defineComponent';
import { cssBindingsFor } from './lib/css-bindings';
import { extractIcons } from './lib/extract-icons';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

function titleCase(s: string): string {
  return s
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

interface FigmaProperty {
  name: string;
  propName: string;
  figmaPropertyType: 'VARIANT' | 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP';
  values?: string[];
  defaultValue?: string | number | boolean;
  description?: string;
}

function figmaPropertiesFor(meta: ComponentMeta, fixedType?: string): FigmaProperty[] {
  const props: FigmaProperty[] = [];

  for (const v of meta.variantProps) {
    const pinType = v.name === 'type' && fixedType !== undefined;
    props.push({
      name: v.label ?? titleCase(v.name),
      propName: v.name,
      figmaPropertyType: 'VARIANT',
      values: pinType ? [fixedType] : v.options,
      defaultValue: pinType ? fixedType : v.default,
      description: v.description,
    });
  }

  // The `state` axis (default/hover/active/focus/disabled/loading) is intentionally NOT emitted
  // as a Figma variant property: it multiplied every set 4–7× with near-duplicate variants
  // (Button alone went to 4,050), which overwhelmed the plugin so later pages never built.
  // States stay documented in the set description; `disabled`/`loading` remain as BOOLEAN toggles.

  for (const p of meta.componentProps ?? []) {
    props.push({
      name: titleCase(p.name),
      propName: p.name,
      figmaPropertyType: p.figmaType,
      defaultValue: p.default,
      description: p.description,
    });
  }

  return props;
}

/**
 * The variant axes that define the Component Set matrix. The `state` axis is deliberately
 * excluded (see figmaPropertiesFor). When `fixedType` is given, the `type` axis is pinned to
 * that single preset — this is how one type-split set (e.g. "A Type - Card") is produced.
 */
function variantAxes(meta: ComponentMeta, fixedType?: string) {
  return meta.variantProps.map((v) => {
    const pinType = v.name === 'type' && fixedType !== undefined;
    return {
      name: v.name,
      label: v.label ?? titleCase(v.name),
      options: pinType ? [fixedType] : v.options,
      default: pinType ? fixedType : v.default,
    };
  });
}

/** Validate that every token referenced by a component actually exists. */
function validateTokenBindings(): string[] {
  const problems: string[] = [];
  for (const meta of componentMetas) {
    for (const b of meta.tokens ?? []) {
      if (!tokenRegistry.has(b.token)) problems.push(`${meta.name}: unknown token "${b.token}"`);
    }
    const f = meta.figma;
    if (f) {
      for (const [key, val] of Object.entries(f)) {
        if (
          [
            'itemSpacing',
            'paddingX',
            'paddingY',
            'cornerRadius',
            'fill',
            'strokeColor',
            'strokeWidth',
            'height',
          ].includes(key)
        ) {
          if (typeof val === 'string' && !tokenRegistry.has(val)) {
            problems.push(`${meta.name}.figma.${key}: unknown token "${val}"`);
          }
        }
      }
    }
  }
  return problems;
}

// CSS-derived per-variant visual bindings (colors/border/radius/sizing/spacing),
// merged before any hand-authored meta.tokens so explicit meta bindings win.
let cssBindingTotal = 0;
const cssNotes: string[] = [];

/** Build one component-set def from a meta, optionally pinned to a single `type` preset. */
function buildDef(meta: ComponentMeta, fixedType?: string) {
  const axes = variantAxes(meta, fixedType);
  const { bindings: cssBindings, note } = cssBindingsFor(ROOT, meta.name, meta.slug, axes, (id) =>
    tokenRegistry.has(id),
  );
  if (note) cssNotes.push(note);
  cssBindingTotal += cssBindings.length;

  const combos = axes.reduce((acc, a) => acc * a.options.length, 1);
  return {
    name: fixedType !== undefined ? `${fixedType} Type - ${meta.name}` : meta.name,
    slug: meta.slug,
    category: meta.category,
    description: meta.description,
    tags: meta.tags ?? [],
    isComponentSet: combos > 1,
    figmaVariantCombinations: combos,
    reactVariantCount: variantCount(meta),
    states: meta.states,
    variantAxes: axes,
    figmaProperties: figmaPropertiesFor(meta, fixedType),
    tokenBindings: [...cssBindings, ...(meta.tokens ?? [])],
    figma: meta.figma ?? null,
    a11y: meta.a11y ?? null,
    responsive: meta.responsive ?? null,
  };
}

// Components with a `type` layout-preset axis are split into one Component Set per preset
// (e.g. "A Type - Card", "B Type - Card", "C Type - Card"), so each layout reads as its own
// artifact and no single set carries the full `type × everything` product.
const components = componentMetas.flatMap((meta) => {
  const typeProp = meta.variantProps.find((v) => v.name === 'type');
  return typeProp ? typeProp.options.map((opt) => buildDef(meta, opt)) : [buildDef(meta)];
});

const problems = validateTokenBindings();
if (problems.length) {
  console.warn(`⚠ ${problems.length} token-binding problem(s):`);
  for (const p of problems) console.warn(`   - ${p}`);
}

// Per-icon inner SVG markup (name → shapes) so the Figma plugin can draw the real glyph for the
// Icon set and every icon slot instead of a generic placeholder. Parsed from the icon registry.
const icons = extractIcons(ROOT);

const manifest = {
  $schema: 'https://tds.dev/schemas/design-system-manifest.json',
  version: 1,
  name: 'TDS — Figma Dev Tools Design System',
  description:
    'Metadata-driven Design System manifest. A Figma plugin can consume this to generate Components, Component Sets, Variant/Component Properties, and bind Auto Layout to token variables — no per-component logic.',
  summary: {
    components: components.length,
    atoms: components.filter((c) => c.category === 'atom').length,
    molecules: components.filter((c) => c.category === 'molecule').length,
    organisms: components.filter((c) => c.category === 'organism').length,
    componentSets: components.filter((c) => c.isComponentSet).length,
    totalFigmaVariants: components.reduce((a, c) => a + c.figmaVariantCombinations, 0),
    tokenCollections: allCollections.length,
    tokens: tokenRegistry.size,
    icons: Object.keys(icons).length,
  },
  icons,
  components,
};

// Bundle = tokens + components (single input a plugin needs to build everything).
const figmaTokens = JSON.parse(
  readFileSync(resolve(ROOT, 'src/tokens/generated/figma.tokens.json'), 'utf8'),
);

const bundle = {
  $schema: 'https://tds.dev/schemas/tds-plugin-bundle.json',
  version: 1,
  generator: 'tds/scripts/build-manifest.ts',
  tokens: figmaTokens,
  design: manifest,
};

mkdirSync(resolve(ROOT, 'src/generated'), { recursive: true });
mkdirSync(resolve(ROOT, 'figma'), { recursive: true });
writeFileSync(
  resolve(ROOT, 'src/generated/design-system.manifest.json'),
  JSON.stringify(manifest, null, 2),
  'utf8',
);
writeFileSync(resolve(ROOT, 'figma/tds.plugin.json'), JSON.stringify(bundle, null, 2), 'utf8');

console.log(
  `✓ manifest: ${components.length} components ` +
    `(${manifest.summary.atoms} atoms, ${manifest.summary.molecules} molecules, ${manifest.summary.organisms} organisms), ` +
    `${manifest.summary.componentSets} component sets, ${manifest.summary.totalFigmaVariants} total Figma variants` +
    (problems.length ? ` — ${problems.length} warning(s)` : ''),
);
console.log(
  `✓ CSS-derived visual bindings: ${cssBindingTotal} across ${components.length} components` +
    (cssNotes.length ? ` (${cssNotes.length} without CSS bindings)` : ''),
);
console.log(`✓ icon geometry: ${Object.keys(icons).length} glyphs extracted from icons.tsx`);
