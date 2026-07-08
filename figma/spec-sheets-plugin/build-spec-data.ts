/**
 * build-spec-data — emits figma/spec-sheets-plugin/spec-data.json from the REAL TDS metadata.
 *
 * The spec-sheets plugin is a documentation generator: for each component it draws a vertical
 * "spec sheet" (dev status · every prop's values · interaction · customize · Resource) AND the real
 * Figma Component Set + Component Properties. All of that is driven by the same single source of
 * truth every other TDS output uses — each component's `*.meta.ts` (`ComponentMeta`). Nothing here
 * is invented: prop names, options, defaults and figma property types are copied verbatim from the
 * metas; token scales (radius / spacing / shadow) come from the generated token export.
 *
 * Run:  npm run spec:data   (also chained inside npm run spec:build)
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { componentMetas } from '../../src/components/metas';
import type { ComponentMeta } from '../../src/core/types';

const ROOT = resolve(import.meta.dirname, '..', '..');
const OUT = join(import.meta.dirname, 'spec-data.json');
const TOKENS = join(ROOT, 'src', 'tokens', 'generated', 'figma.tokens.json');

/** Interaction columns shown in a spec sheet, mapped from the canonical ComponentState set. */
const STATE_TO_INTERACTION: Record<string, string> = {
  default: 'normal',
  hover: 'hovered',
  focus: 'focused',
  active: 'pressed',
  disabled: 'disabled',
  error: 'error',
  success: 'success',
  loading: 'loading',
  readonly: 'readonly',
};

interface TokenVar {
  id: string;
  name: string;
  figmaType?: string;
}
interface FigmaTokens {
  collections?: { variables: TokenVar[] }[];
  effectStyles?: { name: string }[];
}

function readTokenScales(): {
  radius: { id: string; name: string }[];
  spacing: { id: string; name: string }[];
  shadowStyles: string[];
} {
  if (!existsSync(TOKENS)) {
    console.warn('[spec-data] figma.tokens.json missing — run `npm run tokens:build` first. Emitting empty scales.');
    return { radius: [], spacing: [], shadowStyles: [] };
  }
  const t = JSON.parse(readFileSync(TOKENS, 'utf8')) as FigmaTokens;
  const vars = (t.collections ?? []).flatMap((c) => c.variables);
  const pick = (prefix: string) =>
    vars
      .filter((v) => v.id.startsWith(prefix))
      .map((v) => ({ id: v.id, name: v.id.slice(prefix.length) }));
  return {
    radius: pick('radius.'),
    spacing: pick('space.'),
    shadowStyles: (t.effectStyles ?? []).map((s) => s.name),
  };
}

/** Which customize axes a component exposes, inferred from its real figma/token bindings. */
function customizeAxes(m: ComponentMeta): { radius: boolean; padding: boolean; shadow: boolean } {
  const f = m.figma;
  const tokens = m.tokens ?? [];
  return {
    radius: Boolean(f?.cornerRadius) || tokens.some((t) => /radius|corner/i.test(t.property + t.token)),
    padding: Boolean(f?.paddingX || f?.paddingY) || tokens.some((t) => /padding/i.test(t.property)),
    shadow: tokens.some((t) => /shadow/i.test(t.token)),
  };
}

function main() {
  const tokenScales = readTokenScales();

  const components = componentMetas.map((m) => ({
    name: m.name,
    slug: m.slug,
    category: m.category,
    description: m.description,
    tags: m.tags ?? [],
    // Platform / dev-status is NOT tracked in ComponentMeta today. TDS is a React web system, so we
    // report the ONLY platform we can verify — Web — and never invent Android/iOS. Add a `platforms`
    // field to ComponentMeta (and this map) to surface more.
    platforms: ['web'] as string[],
    variantProps: m.variantProps,
    componentProps: m.componentProps ?? [],
    states: m.states,
    interactions: m.states.map((s) => STATE_TO_INTERACTION[s] ?? s),
    customize: customizeAxes(m),
    tokens: m.tokens ?? [],
    figma: m.figma ?? null,
    isComponentSet: m.isComponentSet ?? false,
  }));

  const data = {
    $schema: 'https://tds.dev/schemas/spec-sheets-data.json',
    version: 1,
    generatedAt: new Date().toISOString(),
    generator: 'figma/spec-sheets-plugin/build-spec-data.ts',
    source: 'src/components/metas.ts (componentMetas) + src/tokens/generated/figma.tokens.json',
    note: 'Platform support defaults to ["web"] — ComponentMeta does not yet track Android/iOS.',
    count: components.length,
    tokenScales,
    components,
  };

  writeFileSync(OUT, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(
    `[spec-data] wrote ${components.length} components → ${OUT} ` +
      `(radius ${tokenScales.radius.length} · spacing ${tokenScales.spacing.length} · shadows ${tokenScales.shadowStyles.length})`,
  );
}

main();
