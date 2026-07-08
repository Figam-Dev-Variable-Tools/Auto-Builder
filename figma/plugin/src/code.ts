// TDS — Design System Reproducer (Figma plugin main thread).
// Reads the single generated contract (figma/tds.plugin.json, inlined at build time)
// and rebuilds the design system: Variables -> Styles -> Component Sets.
// No per-component code — the manifest is iterated.

import bundleJson from '../../tds.plugin.json';
import type { Bundle } from './types';
import { buildVariables } from './variables';
import { buildEffectStyles, buildTextStyles } from './styles';
import { buildComponents } from './components';
import { createPages } from './pages';
import { buildFoundation, FOUNDATION_CARDS } from './foundation';
import { Tokens, flushFontNotes, loadDocFonts, makePalette } from './doc';
import { done, log, progress, warn, warnings } from './log';

const bundle = bundleJson as unknown as Bundle;

figma.showUI(__html__, { width: 380, height: 460 });

async function run(): Promise<void> {
  const t = bundle.tokens;
  const d = bundle.design;

  log(`Bundle v${bundle.version} · ${bundle.generator}`);
  log(
    `Contract: ${t.collections.length} collections · ${t.effectStyles.length} effect + ${t.textStyles.length} text styles · ${d.components.length} components`,
  );
  warnings.length = 0;

  progress(0.02, 'Variables…');
  const vars = buildVariables(t.collections);

  progress(0.26, 'Effect styles…');
  const effects = buildEffectStyles(t.effectStyles);

  progress(0.28, 'Text styles…');
  await buildTextStyles(t.textStyles);

  // Shared documentation chrome — palette resolved from real tokens, Inter UI fonts.
  const palette = makePalette(new Tokens(t));
  const fonts = await loadDocFonts();

  progress(0.29, 'Pages…');
  const pages = createPages();

  progress(0.29, 'Foundation…');
  const foundation = await buildFoundation(
    t,
    palette,
    fonts,
    effects,
    vars,
    pages.byTitle.get('Foundation')!,
  );

  progress(0.3, 'Component sets…');
  await buildComponents(
    d.components,
    { vars, effects, icons: d.icons ?? {} },
    { palette, fonts },
    {
      name: d.name,
      description: d.description,
      collections: t.collections.length,
      effectStyles: t.effectStyles.length,
      textStyles: t.textStyles.length,
    },
    pages,
    foundation.root,
  );

  // ONE consolidated note about any real font families Figma could not render.
  flushFontNotes();

  const totalVariants = d.components.reduce((a, c) => a + c.figmaVariantCombinations, 0);
  if (warnings.length) {
    log(`Completed with ${warnings.length} note(s) — see above.`, 'warn');
  }
  done(
    `Done — ${pages.order.length} pages, ${t.collections.length} collections, ${t.effectStyles.length + t.textStyles.length} styles, ${FOUNDATION_CARDS.length} foundation cards, ${d.components.length} component sets (${totalVariants} variants).`,
  );
  figma.notify('TDS design system reproduced.');
}

figma.ui.onmessage = async (msg: { type: string }) => {
  if (msg.type === 'run') {
    try {
      await run();
    } catch (e) {
      warn(`Fatal: ${String(e)}`);
      done('Failed — see log.');
      figma.notify('TDS reproduction failed — see plugin log.', { error: true });
    }
  } else if (msg.type === 'close') {
    figma.closePlugin();
  }
};
