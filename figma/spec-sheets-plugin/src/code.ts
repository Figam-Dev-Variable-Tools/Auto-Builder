/**
 * TDS Spec Sheets — Figma plugin main thread.
 *
 * Reads bundled component metadata (spec-data.json, generated verbatim from each `*.meta.ts`) and,
 * per selected component, generates a documentation "spec sheet" on the canvas backed by a REAL
 * Figma Component Set with real Component Properties — double-clickable components with a genuine
 * property panel, not rectangle mockups.
 *
 * Message protocol (with ui.html):
 *   in : { type:'ui-ready' }                 → out { type:'components', components:[{name,slug,category}] }
 *   in : { type:'generate', slugs:string[] } → out { type:'log', message } … { type:'done', message }
 */
import { buildComponentSet } from './component-set';
import { data } from './data';
import { buildSpecSheet } from './spec-sheet';
import { C, initFonts, solid } from './ui';
import { loadTokenIndexes } from './tokens';

interface GenerateMsg {
  type: 'generate';
  slugs: string[];
}
interface UiReadyMsg {
  type: 'ui-ready';
}
type InMsg = GenerateMsg | UiReadyMsg;

const log = (message: string) => figma.ui.postMessage({ type: 'log', message });

figma.showUI(__html__, { width: 340, height: 560, themeColors: true });

figma.ui.onmessage = (msg: InMsg) => {
  if (msg.type === 'ui-ready') {
    figma.ui.postMessage({
      type: 'components',
      components: data.components.map((c) => ({ name: c.name, slug: c.slug, category: c.category })),
    });
    return;
  }
  if (msg.type === 'generate') {
    void generate(msg.slugs);
  }
};

/** A neutral 16×16 component used as the default target for every INSTANCE_SWAP slot. */
function makePlaceholder(): ComponentNode {
  const comp = figma.createComponent();
  comp.name = 'Spec/Slot Placeholder';
  comp.resize(16, 16);
  comp.fills = [];
  const dot = figma.createEllipse();
  dot.resize(12, 12);
  dot.x = 2;
  dot.y = 2;
  dot.fills = [solid(C.faint)];
  comp.appendChild(dot);
  comp.x = -800;
  comp.y = -800;
  return comp;
}

async function generate(slugs: string[]): Promise<void> {
  const page = figma.createPage();
  page.name = 'TDS Spec Sheets';
  await figma.setCurrentPageAsync(page);

  const tokenInfo = await initFonts()
    .then(() => loadTokenIndexes())
    .catch(() => ({ variables: 0, effects: 0 }));
  log(
    `Fonts loaded. Token binding: ${tokenInfo.variables} Variables, ${tokenInfo.effects} effect styles ` +
      `${tokenInfo.variables === 0 ? '(none found — using literal fallbacks)' : 'available'}.`,
  );

  const placeholder = makePlaceholder();
  const sheets: SceneNode[] = [];
  let y = 0;
  let ok = 0;
  const failed: string[] = [];

  for (const slug of slugs) {
    const c = data.components.find((k) => k.slug === slug);
    if (!c) {
      log(`Skipped unknown slug: ${slug}`);
      continue;
    }
    try {
      log(`▶ ${c.name} — building component set (${c.variantProps.length} axes, ${c.states.length} states)`);
      const built = buildComponentSet(c, placeholder);
      const variantCount = built.set.children.length;
      const sheet = await buildSpecSheet(c, built, placeholder);

      sheet.x = 0;
      sheet.y = y;
      built.set.x = sheet.width + 80;
      built.set.y = y;

      sheets.push(sheet);
      for (const note of built.notes) log(`  · ${note}`);
      log(`  ✓ ${c.name} — ${variantCount} variants, ${built.propIds.size} component properties`);

      y += Math.max(sheet.height, built.set.height) + 120;
      ok += 1;
    } catch (err) {
      failed.push(c.name);
      log(`  ✗ ${c.name} failed: ${String(err)}`);
    }
  }

  if (sheets.length) figma.viewport.scrollAndZoomIntoView(sheets);

  const summary =
    `${ok}/${slugs.length} component${slugs.length === 1 ? '' : 's'} generated` +
    (failed.length ? ` · failed: ${failed.join(', ')}` : '');
  figma.ui.postMessage({ type: 'done', message: summary });
}
