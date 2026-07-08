// Reproduces design.components[] as Figma Component Sets.
// Every component is described by the same schema, so there is no per-component code:
// we iterate variantAxes into the full cartesian product, apply the base Auto Layout
// frame, bind tokens to Variables, and wire non-variant properties to real layers:
//   TEXT          -> the label text node's `characters`
//   BOOLEAN       -> a marker layer's `visible`
//   INSTANCE_SWAP -> a placeholder instance's `mainComponent`
// Every page is built with the shared doc kit (doc.ts): a vertical auto-layout page canvas
// holding one white doc card per component, each card hugging its variant set. The Cover is
// a doc card inserted at the top of the Foundation canvas.

import type { ComponentDef, FigmaBase, FigmaProperty, VariantAxis } from './types';
import type { VariableRegistry } from './variables';
import type { PageTitle, Pages } from './pages';
import type { DocFonts, Palette } from './doc';
import type { VariantLayers } from './recipes';
import { CORNERS, RECIPES, boundFill, renderIcon } from './recipes';
import { docCard, pageCanvas, stack, txt } from './doc';
import { PAGE_TITLES, classifyCounts, pageForComponent } from './pages';
const DOC_PAGES: PageTitle[] = ['Foundation'];
import { log, progress, warn } from './log';

const SLOT = 20;
const YIELD_EVERY = 150; // variants between event-loop yields (keeps Figma responsive)

/** Yield the main thread via a real async host call — Figma has no setTimeout.
 *  Lets Figma repaint the progress UI and run GC between chunks of heavy node work. */
async function breathe(): Promise<void> {
  await figma.clientStorage.getAsync('__tds_yield__');
}

const VARIANT_GRID_GAP = 24;
const VARIANT_GRID_PAD = 32;

/**
 * Turn a freshly combined Component Set into a wrapping Auto Layout grid. Every variant is
 * created at (0,0) and `combineAsVariants` preserves those positions, so the set would otherwise
 * collapse into one overlapping blob. Under Auto Layout the variants tile and physically cannot
 * overlap. The set width is fixed to ~sqrt(n) columns of the widest variant so large sets read as
 * a readable matrix rather than one endless row.
 */
function gridComponentSet(set: ComponentSetNode, variants: VariantLayers[]): void {
  let cellW = 1;
  for (const v of variants) cellW = Math.max(cellW, v.node.width);
  const cols = Math.max(1, Math.min(variants.length, Math.ceil(Math.sqrt(variants.length * 1.7))));

  set.layoutMode = 'HORIZONTAL';
  set.layoutWrap = 'WRAP';
  set.itemSpacing = VARIANT_GRID_GAP;
  set.counterAxisSpacing = VARIANT_GRID_GAP;
  set.paddingLeft = VARIANT_GRID_PAD;
  set.paddingRight = VARIANT_GRID_PAD;
  set.paddingTop = VARIANT_GRID_PAD;
  set.paddingBottom = VARIANT_GRID_PAD;
  set.primaryAxisSizingMode = 'FIXED';
  set.counterAxisSizingMode = 'AUTO';
  // Fixed primary-axis width so WRAP engages at ~cols columns; height hugs.
  set.resize(VARIANT_GRID_PAD * 2 + cols * cellW + (cols - 1) * VARIANT_GRID_GAP, set.height);
}

/** Warn once, not once per variant, for channels with no Figma representation. */
const oncePerComponent = new Set<string>();
/** The single honest INSTANCE_SWAP note is emitted at most once per run. */
let swapNoteEmitted = false;

interface Ctx {
  vars: VariableRegistry;
  effects: Map<string, string>;
  placeholder: ComponentNode;
  labelFont: FontName;
  fonts: DocFonts;
  icons: Record<string, string>;
}

/** Axis options with the declared default first, so the set's default variant matches the contract. */
function orderedOptions(axis: VariantAxis): string[] {
  if (!axis.default || !axis.options.includes(axis.default)) return axis.options;
  return [axis.default, ...axis.options.filter((o) => o !== axis.default)];
}

/** Full cartesian product of the variant axes; the all-defaults combination is first. */
function cartesian(axes: VariantAxis[]): Record<string, string>[] {
  let combos: Record<string, string>[] = [{}];
  for (const axis of axes) {
    const next: Record<string, string>[] = [];
    for (const combo of combos) {
      for (const opt of orderedOptions(axis)) next.push({ ...combo, [axis.name]: opt });
    }
    combos = next;
  }
  return combos;
}

function matches(when: Record<string, string> | undefined, combo: Record<string, string>): boolean {
  if (!when) return true;
  for (const k of Object.keys(when)) if (combo[k] !== when[k]) return false;
  return true;
}

/** Resolve the effective token id per visual channel: base first, matching bindings override. */
function resolveChannels(comp: ComponentDef, combo: Record<string, string>) {
  const f: FigmaBase = comp.figma || {};
  const ch: Record<string, string | undefined> = {
    fill: f.fill,
    stroke: f.strokeColor,
    strokeWidth: f.strokeWidth,
    radius: f.cornerRadius,
    gap: f.itemSpacing,
    padX: f.paddingX,
    padY: f.paddingY,
    height: f.height,
    fontSize: undefined,
    text: undefined,
    shadow: undefined,
  };
  for (const b of comp.tokenBindings || []) {
    if (!matches(b.when, combo)) continue;
    switch (b.property) {
      case 'background':
      case 'fill':
      case 'track':
        ch.fill = b.token;
        break;
      case 'color':
      case 'label-color':
        ch.text = b.token;
        break;
      case 'border-color':
      case 'field-border':
        ch.stroke = b.token;
        break;
      case 'corner-radius':
        ch.radius = b.token;
        break;
      case 'gap':
        ch.gap = b.token;
        break;
      case 'padding-x':
        ch.padX = b.token;
        break;
      case 'padding-y':
        ch.padY = b.token;
        break;
      case 'height':
        ch.height = b.token;
        break;
      case 'font-size':
        ch.fontSize = b.token;
        break;
      case 'stroke-width':
        ch.strokeWidth = b.token;
        break;
      case 'shadow':
        ch.shadow = b.token;
        break;
      case 'transition':
        // Figma has no transition/animation property — cannot be reproduced.
        if (!oncePerComponent.has(comp.name + ':transition')) {
          oncePerComponent.add(comp.name + ':transition');
          warn(`${comp.name}: "transition" token has no Figma equivalent — skipped`);
        }
        break;
      default:
        if (!oncePerComponent.has(comp.name + ':' + b.property)) {
          oncePerComponent.add(comp.name + ':' + b.property);
          warn(`${comp.name}: unmapped binding property "${b.property}" — skipped`);
        }
    }
  }
  return ch;
}

const isLeading = (propName: string) => /start|leading|prefix|before/i.test(propName);

/** Human variant-property label for an axis (e.g. axis "variant" → "Style"). */
function axisLabel(comp: ComponentDef, axisName: string, fallback: string): string {
  const fp = (comp.figmaProperties || []).find(
    (p) => p.figmaPropertyType === 'VARIANT' && p.propName === axisName,
  );
  return fp?.name || fallback;
}

const PROP_TYPE_LABEL: Record<string, string> = {
  TEXT: 'text',
  BOOLEAN: 'boolean',
  INSTANCE_SWAP: 'instance-swap',
};

/** Compose the contract's docs into the set description so Dev Mode shows the full spec. */
function describeComponent(comp: ComponentDef): string {
  const lines: string[] = [];
  if (comp.description) lines.push(comp.description);

  const meta = [`Category: ${comp.category}`];
  if (comp.tags?.length) meta.push(`Tags: ${comp.tags.join(', ')}`);
  lines.push('', meta.join(' · '));
  if (comp.states?.length) lines.push(`States: ${comp.states.join(', ')}`);
  if (comp.responsive) lines.push(`Responsive: ${comp.responsive}`);

  // Composition — the Figma authoring surface Dev Mode needs: every variant axis, every
  // component property (text / boolean / instance-swap) and the swappable slots. This is the
  // "컴포넌트 구성 설명" that documents how to drive the set.
  lines.push('', 'Composition');
  lines.push(
    'Variants: ' +
      comp.variantAxes
        .map((a) => `${axisLabel(comp, a.name, a.label || a.name)} = ${a.options.join(' | ')}`)
        .join(' · '),
  );
  const nonVariant = (comp.figmaProperties || []).filter((p) => p.figmaPropertyType !== 'VARIANT');
  if (nonVariant.length) {
    lines.push(
      'Properties: ' +
        nonVariant
          .map((p) => `${p.name} (${PROP_TYPE_LABEL[p.figmaPropertyType] || p.figmaPropertyType})`)
          .join(' · '),
    );
  }
  const slots = nonVariant.filter((p) => p.figmaPropertyType === 'INSTANCE_SWAP');
  if (slots.length) lines.push('Slots: ' + slots.map((p) => p.name).join(', '));

  const a = comp.a11y;
  if (a && (a.role || a.keyboard?.length || a.notes?.length)) {
    lines.push('', 'Accessibility');
    if (a.role) lines.push(`Role: ${a.role}`);
    if (a.keyboard?.length) {
      lines.push('Keyboard:');
      for (const k of a.keyboard) lines.push(`• ${k}`);
    }
    if (a.notes?.length) {
      lines.push('Notes:');
      for (const n of a.notes) lines.push(`• ${n}`);
    }
  }
  return lines.join('\n');
}

function buildVariant(
  comp: ComponentDef,
  combo: Record<string, string>,
  displayName: Record<string, string>,
  nameAxes: VariantAxis[],
  ctx: Ctx,
): VariantLayers {
  const node = figma.createComponent();
  // Variant name carries exactly the axes that define this set's variant properties. Normally
  // that's comp.variantAxes; a split card drops the fixed axis, an interactive toggle adds the
  // synthetic `State` axis. Every variant in one set MUST share the same axis set (Figma rule).
  node.name = nameAxes.map((a) => `${displayName[a.name]}=${combo[a.name]}`).join(', ');

  const ch = resolveChannels(comp, combo);

  // Per-component recipe: build a faithful miniature of the real component. Falls through to
  // the generic box+label rendering below for the components without a recipe yet.
  const recipe = RECIPES[comp.slug];
  if (recipe) {
    return recipe({
      node,
      comp,
      combo,
      ch,
      vars: ctx.vars,
      effects: ctx.effects,
      placeholder: ctx.placeholder,
      fonts: ctx.fonts,
      icons: ctx.icons,
    });
  }

  const base = comp.figma || {};
  const hasLayout = !!base.layoutMode && base.layoutMode !== 'NONE';

  if (hasLayout) {
    node.layoutMode = base.layoutMode as 'HORIZONTAL' | 'VERTICAL';
    node.primaryAxisAlignItems =
      (base.primaryAxisAlign as 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN') || 'MIN';
    node.counterAxisAlignItems =
      (base.counterAxisAlign as 'MIN' | 'CENTER' | 'MAX' | 'BASELINE') || 'CENTER';
    node.primaryAxisSizingMode = 'AUTO';
    node.counterAxisSizingMode = 'AUTO';

    const gapVar = ch.gap ? ctx.vars.get(ch.gap) : undefined;
    if (gapVar) node.setBoundVariable('itemSpacing', gapVar);
    const padXVar = ch.padX ? ctx.vars.get(ch.padX) : undefined;
    if (padXVar) {
      node.setBoundVariable('paddingLeft', padXVar);
      node.setBoundVariable('paddingRight', padXVar);
    }
    const padYVar = ch.padY ? ctx.vars.get(ch.padY) : undefined;
    if (padYVar) {
      node.setBoundVariable('paddingTop', padYVar);
      node.setBoundVariable('paddingBottom', padYVar);
    }
    const heightVar = ch.height ? ctx.vars.get(ch.height) : undefined;
    if (heightVar) {
      if (base.layoutMode === 'HORIZONTAL') node.counterAxisSizingMode = 'FIXED';
      else node.primaryAxisSizingMode = 'FIXED';
      node.setBoundVariable('height', heightVar);
    }
  } else {
    node.resize(120, 40);
  }

  // Fill — `transparent` (from CSS `background: transparent`) clears the fill.
  if (ch.fill === 'transparent') {
    node.fills = [];
  } else if (ch.fill) {
    const v = ctx.vars.get(ch.fill);
    if (v) node.fills = [boundFill({ r: 0.5, g: 0.5, b: 0.5 }, v)];
    else warn(`${comp.name}: fill token "${ch.fill}" not found`);
  } else {
    node.fills = [];
  }

  // Stroke — `transparent` clears it; otherwise bind color (+ width when known).
  if (ch.stroke === 'transparent') {
    node.strokes = [];
  } else if (ch.stroke) {
    const v = ctx.vars.get(ch.stroke);
    if (v) {
      node.strokes = [boundFill({ r: 0.5, g: 0.5, b: 0.5 }, v)];
      const wVar =
        ch.strokeWidth && ch.strokeWidth !== 'transparent'
          ? ctx.vars.get(ch.strokeWidth)
          : undefined;
      if (wVar) node.setBoundVariable('strokeWeight', wVar);
      else node.strokeWeight = 1;
    }
  }

  // Corner radius
  if (ch.radius) {
    const v = ctx.vars.get(ch.radius);
    if (v) for (const corner of CORNERS) node.setBoundVariable(corner, v);
  }

  const props = comp.figmaProperties || [];

  // Leading INSTANCE_SWAP slots (before the label).
  const swaps: Record<string, InstanceNode> = {};
  const addSwap = (p: FigmaProperty) => {
    const inst = ctx.placeholder.createInstance();
    inst.name = p.name;
    inst.resize(SLOT, SLOT);
    node.appendChild(inst);
    swaps[p.propName] = inst;
  };
  for (const p of props)
    if (p.figmaPropertyType === 'INSTANCE_SWAP' && isLeading(p.propName)) addSwap(p);

  // Label text child (bound to the first TEXT property below when present).
  let label: TextNode | null = null;
  const textProp = props.find((p) => p.figmaPropertyType === 'TEXT');
  if (textProp) {
    label = figma.createText();
    label.fontName = ctx.labelFont;
    label.characters = String(textProp.defaultValue ?? comp.name);
    const textVar = ch.text && ch.text !== 'transparent' ? ctx.vars.get(ch.text) : undefined;
    if (textVar) label.fills = [boundFill({ r: 0.1, g: 0.1, b: 0.1 }, textVar)];
    const sizeVar =
      ch.fontSize && ch.fontSize !== 'transparent' ? ctx.vars.get(ch.fontSize) : undefined;
    if (sizeVar) label.setBoundVariable('fontSize', sizeVar);
    node.appendChild(label);
  }

  // Trailing INSTANCE_SWAP slots (after the label).
  for (const p of props)
    if (p.figmaPropertyType === 'INSTANCE_SWAP' && !isLeading(p.propName)) addSwap(p);

  // Shadow (effect style, not a variable) — applied after children so it isn't overwritten.
  if (ch.shadow) {
    const styleId = ctx.effects.get(ch.shadow);
    if (styleId) void node.setEffectStyleIdAsync(styleId);
    else warn(`${comp.name}: shadow token "${ch.shadow}" is not an effect style`);
  }

  // BOOLEAN marker layers — small dots whose visibility follows the property.
  const bools: Record<string, SceneNode> = {};
  let bi = 0;
  for (const p of props) {
    if (p.figmaPropertyType !== 'BOOLEAN') continue;
    const dot = figma.createEllipse();
    dot.name = p.name;
    dot.resize(8, 8);
    dot.fills = [{ type: 'SOLID', color: { r: 0.6, g: 0.6, b: 0.6 } }];
    node.appendChild(dot);
    if (hasLayout) {
      dot.layoutPositioning = 'ABSOLUTE';
      dot.x = node.x + 2 + bi * 10;
      dot.y = node.y + 2;
    }
    dot.visible = Boolean(p.defaultValue);
    bools[p.propName] = dot;
    bi++;
  }

  return { node, label, swaps, bools };
}

/** Add non-variant component properties to the set and bind them to the per-variant layers. */
async function wireProperties(
  comp: ComponentDef,
  set: ComponentSetNode,
  variants: VariantLayers[],
  placeholder: ComponentNode,
  skipProps?: Set<string>,
): Promise<void> {
  // A prop promoted to a synthetic VARIANT (e.g. Radio/Switch `checked` → On/Off) must NOT also be
  // added as a component property, or it would be represented twice.
  const props = (comp.figmaProperties || []).filter((p) => !skipProps?.has(p.propName));
  let firstTextId: string | null = null;
  let k = 0;
  const tick = async () => {
    if (++k % 400 === 0) await breathe();
  };

  // Set a layer's property reference defensively — Figma occasionally rejects a
  // single reference ("Could not create a new component property reference"); one bad
  // layer must never abort the whole run, so every assignment is isolated.
  const setRef = (
    node: SceneNode | null,
    field: 'visible' | 'mainComponent' | 'characters',
    id: string,
  ) => {
    if (!node) return;
    try {
      node.componentPropertyReferences = { [field]: id };
    } catch {
      /* skip this layer's binding — the variant still renders */
    }
  };

  for (const p of props) {
    if (p.figmaPropertyType === 'VARIANT') continue;
    try {
      if (p.figmaPropertyType === 'TEXT') {
        const id = set.addComponentProperty(p.name, 'TEXT', String(p.defaultValue ?? ''));
        if (!firstTextId) firstTextId = id;
      } else if (p.figmaPropertyType === 'BOOLEAN') {
        const id = set.addComponentProperty(p.name, 'BOOLEAN', Boolean(p.defaultValue));
        for (const v of variants) {
          const layer = v.bools[p.propName];
          // A boolean can drive one layer or several (e.g. Pagination showEdges → first + last).
          if (Array.isArray(layer)) for (const l of layer) setRef(l, 'visible', id);
          else setRef(layer ?? null, 'visible', id);
          await tick();
        }
      } else if (p.figmaPropertyType === 'INSTANCE_SWAP') {
        // Best-effort (Goal 4). A local main component either has an empty `.key`, or a key
        // Figma rejects as a swap default ("incompatible with property type"), in this runtime.
        // Either way the addComponentProperty fails — so we try quietly, and on failure KEEP
        // the icon-slot instances in every variant (manually swappable via right-click → Swap
        // instance) and emit ONE consolidated note per run instead of a per-property error.
        const key = placeholder.key;
        let swapId: string | null = null;
        if (key) {
          try {
            swapId = set.addComponentProperty(p.name, 'INSTANCE_SWAP', key, {
              preferredValues: [{ type: 'COMPONENT' as const, key }],
            });
          } catch {
            swapId = null; // local key not accepted as a swap default here
          }
        }
        if (swapId) {
          for (const v of variants) {
            setRef(v.swaps[p.propName] ?? null, 'mainComponent', swapId);
            await tick();
          }
        } else if (!swapNoteEmitted) {
          swapNoteEmitted = true;
          warn(
            'Icon slots render the real Icon primitive and are manually swappable (right-click → ' +
              'Swap instance) but not exposed as a bound swap property — the local Icon component ' +
              'has no usable key in this runtime. Publish Icon to a library to expose it as a bound swap.',
          );
        }
      }
    } catch (e) {
      warn(`${comp.name}: could not add property "${p.name}" (${String(e)})`);
    }
  }

  if (firstTextId) {
    for (const v of variants) {
      setRef(v.label, 'characters', firstTextId);
      await tick();
    }
  }
}

// ---------------------------------------------------------------------------
// Per-component build strategy (plugin-side rendering choices, not contract changes).
// ---------------------------------------------------------------------------

/** Components whose card is split into one set per value of the named axis, so each px/scale reads
 *  as its own legible card instead of one giant blob of near-identical variants. */
const SPLIT_BY: Record<string, string> = { icon: 'size', text: 'variant' };

/** Components rendered as Figma **interactive components**: a synthetic On/Off `State` variant axis
 *  is added (a boolean prop can't be prototyped) and click reactions toggle Off↔On. */
const INTERACTIVE_TOGGLE = new Set<string>(['radio', 'switch']);

/** The synthetic On/Off axis injected for INTERACTIVE_TOGGLE components (drives the recipe overlay
 *  via `combo.State` and replaces the `checked` boolean). */
const STATE_AXIS: VariantAxis = { name: 'State', label: 'State', options: ['Off', 'On'], default: 'Off' };

/** Wire prototype reactions so an interactive Radio/Switch set click-toggles between its Off and On
 *  variants (SMART_ANIMATE mimics the CSS thumb-slide / dot-scale). Pairs variants by every axis
 *  except `State`. All writes are best-effort — older runtimes / the headless mock may lack reactions. */
async function wireToggleReactions(
  combos: Record<string, string>[],
  variants: VariantLayers[],
): Promise<void> {
  const keyOf = (c: Record<string, string>) =>
    Object.keys(c)
      .filter((k) => k !== 'State')
      .sort()
      .map((k) => `${k}=${c[k]}`)
      .join(',');
  const byKey = new Map<string, { off?: ComponentNode; on?: ComponentNode }>();
  for (let i = 0; i < combos.length; i++) {
    const entry = byKey.get(keyOf(combos[i])) ?? {};
    if (combos[i].State === 'On') entry.on = variants[i].node;
    else entry.off = variants[i].node;
    byKey.set(keyOf(combos[i]), entry);
  }

  const transition = { type: 'SMART_ANIMATE', easing: { type: 'EASE_OUT' }, duration: 0.2 };
  const mkReaction = (destinationId: string) => ({
    trigger: { type: 'ON_CLICK' },
    actions: [
      { type: 'NODE', destinationId, navigation: 'CHANGE_TO', transition, preserveScrollPosition: false },
    ],
  });

  type ReactableNode = {
    id: string;
    setReactionsAsync?: (r: unknown[]) => Promise<void>;
    reactions?: unknown[];
  };
  const apply = async (from: ComponentNode, toId: string) => {
    const n = from as unknown as ReactableNode;
    if (typeof n.setReactionsAsync === 'function') await n.setReactionsAsync([mkReaction(toId)]);
    else n.reactions = [mkReaction(toId)];
  };

  for (const { off, on } of byKey.values()) {
    if (!off || !on) continue;
    try {
      await apply(off, on.id);
      await apply(on, off.id);
    } catch {
      /* reactions unsupported in this runtime — the variants still render, just not interactive */
    }
  }
}

/** Bundle-level metadata reproduced on the library cover. */
export interface LibMeta {
  name: string;
  description: string;
  collections: number;
  effectStyles: number;
  textStyles: number;
}

/**
 * The shared INSTANCE_SWAP source used by every icon slot (Button/IconButton/Link/Input/…).
 * It is a faithful reproduction of the Storybook **Icon** primitive — the real default glyph
 * (the Icon component's default `name: 'star'`, size md · stroke) drawn on the 24-grid — so every
 * slot shows a real, recognizable, swappable icon instead of a bare grey ellipse. Color is bound
 * to the `color.fg.default` Variable so it reads as a proper icon and tracks the theme.
 */
function makePlaceholder(vars: VariableRegistry, icons: Record<string, string>): ComponentNode {
  const icon = figma.createComponent();
  icon.name = 'Icon';
  icon.resize(SLOT, SLOT);
  icon.fills = [];

  const markup = icons.star ?? icons.image;
  if (markup) {
    const glyph = renderIcon(markup, SLOT, {
      vars,
      filled: false,
      colorId: 'color.fg.default',
      strokeWidth: 2,
    });
    icon.appendChild(glyph);
    glyph.x = 0;
    glyph.y = 0;
  } else {
    // Fallback ring if the bundle carries no icon geometry — still token-colored, never empty.
    const g = Math.round(SLOT * 0.72);
    const mark = figma.createEllipse();
    mark.resize(g, g);
    mark.fills = [];
    const v = vars.get('color.fg.default');
    if (v) {
      mark.strokes = [boundFill({ r: 0.1, g: 0.1, b: 0.1 }, v)];
      mark.strokeWeight = 2;
    } else {
      mark.strokes = [{ type: 'SOLID', color: { r: 0.4, g: 0.4, b: 0.43 } }];
      mark.strokeWeight = 2;
    }
    icon.appendChild(mark);
    mark.x = (SLOT - g) / 2;
    mark.y = (SLOT - g) / 2;
  }

  icon.x = -800;
  icon.y = -800;
  return icon;
}

const cap = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const PAGE_DESCRIPTIONS: Partial<Record<PageTitle, string>> = {
  Layout: 'Surfaces, containers and separators that structure a screen.',
  Navigation: 'Wayfinding — menus, tabs, breadcrumbs and pagination.',
  Actions: 'Buttons and action triggers, including auth / social sign-in.',
  Input: 'Form fields, selection and other data-entry controls.',
  'Data Display': 'Read-only presentation — tables, lists, tags and charts.',
  Feedback: 'Status, progress and messaging surfaces.',
  Overlay: 'Layered surfaces — dialogs, popovers and drawers.',
};

export async function buildComponents(
  defs: ComponentDef[],
  base: { vars: VariableRegistry; effects: Map<string, string>; icons: Record<string, string> },
  doc: { palette: Palette; fonts: DocFonts },
  lib: LibMeta,
  pages: Pages,
  foundationRoot: FrameNode,
): Promise<void> {
  const { palette, fonts } = doc;

  // Shared placeholder main component for every INSTANCE_SWAP slot — an icon-slot look.
  // Created on the Foundation page (current page after buildFoundation).
  const foundationPage = pages.byTitle.get('Foundation');
  // NOTE: page switching MUST use setCurrentPageAsync — the synchronous
  // `figma.currentPage =` setter does not reliably move the page in the plugin runtime,
  // which left every set stacked on one page and crashed combineAsVariants.
  if (foundationPage) await figma.setCurrentPageAsync(foundationPage);
  const placeholder = makePlaceholder(base.vars, base.icons);
  const ctx: Ctx = { ...base, placeholder, labelFont: fonts.regular, fonts };

  const catCounts: Record<string, number> = {};
  for (const c of defs) catCounts[c.category] = (catCounts[c.category] || 0) + 1;
  const pageCounts = classifyCounts(defs);
  const totalVariants = defs.reduce((a, c) => a + c.figmaVariantCombinations, 0);

  // ---- Library Cover: a doc card inserted at the TOP of the Foundation page canvas. ----
  const componentPages = PAGE_TITLES.filter((t) => !DOC_PAGES.includes(t));
  const cover = docCard({
    eyebrow: 'Design System',
    title: lib.name,
    description: lib.description,
    palette,
    fonts,
  });
  cover.root.name = 'Cover';
  const stats = stack('VERTICAL', 6);
  const statLines = [
    `${lib.collections} variable collections · ${ctx.vars.size} variables`,
    `${lib.effectStyles + lib.textStyles} styles (${lib.effectStyles} effect · ${lib.textStyles} text)`,
    `${defs.length} component sets · ${totalVariants.toLocaleString()} variants`,
    `Atoms ${catCounts.atom || 0} · Molecules ${catCounts.molecule || 0} · Organisms ${catCounts.organism || 0}`,
    `${PAGE_TITLES.length} pages · component pages: ${componentPages
      .map((t) => `${t} ${pageCounts[t]}`)
      .join(' · ')}`,
    `Generated from figma/tds.plugin.json`,
  ];
  for (const line of statLines) stats.appendChild(txt(line, fonts.regular, 13, palette.muted));
  cover.body.appendChild(stats);
  // Insert as the first child of the Foundation canvas (above the page header).
  foundationRoot.insertChild(0, cover.root);

  // ---- Group components per functional page (ONE page switch each). ----
  const byPage = new Map<PageTitle, ComponentDef[]>();
  for (const c of defs) {
    const t = pageForComponent(c);
    (byPage.get(t) ?? byPage.set(t, []).get(t)!).push(c);
  }

  let built = 0; // variants built so far (drives the progress bar)
  const pct = () => 0.3 + 0.66 * (built / Math.max(1, totalVariants));

  for (const pageTitle of PAGE_TITLES) {
    if (DOC_PAGES.includes(pageTitle)) continue;
    const page = pages.byTitle.get(pageTitle);
    if (!page) {
      warn(`Page "${pageTitle}" missing — components for it will be skipped`);
      continue;
    }
    const comps = byPage.get(pageTitle) ?? [];
    await figma.setCurrentPageAsync(page);

    const idx = PAGE_TITLES.indexOf(pageTitle) + 1;
    const desc = `${PAGE_DESCRIPTIONS[pageTitle] ?? ''} ${comps.length} components.`.trim();
    const { root, body } = pageCanvas({
      index: idx,
      title: pageTitle,
      description: desc,
      palette,
      fonts,
    });
    root.x = 0;
    root.y = 0;
    page.appendChild(root);

    // Build one doc card + Component Set. `nameAxes` are the axes that define this set's variant
    // properties (a split card omits the fixed axis; an interactive toggle adds `State`).
    const buildCardSet = async (
      comp: ComponentDef,
      ci: number,
      combos: Record<string, string>[],
      nameAxes: VariantAxis[],
      displayName: Record<string, string>,
      titleSuffix: string | null,
      skipProps: Set<string> | undefined,
      interactive: boolean,
    ): Promise<void> => {
      // The component's doc card (attached to the page canvas BEFORE combining so the
      // card body — the combine parent — is already on the current page).
      const tags = (comp.tags || []).slice(0, 3).join(', ');
      const badge = `${combos.length} variants` + (tags ? ` · ${tags}` : '');
      const card = docCard({
        eyebrow: `${cap(comp.category)} · ${pageTitle}`,
        title: titleSuffix ? `${comp.name} · ${titleSuffix}` : comp.name,
        description: comp.description,
        palette,
        fonts,
        badge,
      });
      body.appendChild(card.root);

      // Build variants incrementally, yielding so Figma stays responsive on huge sets.
      const variants: VariantLayers[] = [];
      for (let vi = 0; vi < combos.length; vi++) {
        variants.push(buildVariant(comp, combos[vi], displayName, nameAxes, ctx));
        built++;
        if (built % YIELD_EVERY === 0) {
          progress(
            pct(),
            `${pageTitle} · ${comp.name} (${ci + 1}/${comps.length}) — ${vi + 1}/${combos.length} variants · ${built}/${totalVariants} total`,
          );
          await breathe();
        }
      }

      progress(pct(), `${comp.name}${titleSuffix ? ` · ${titleSuffix}` : ''}: combining ${combos.length} variants…`);
      await breathe();
      // Parent = the card's body frame — it is on the current page, so the same-page
      // guard passes. Appending a big set into an auto-layout card is one reflow (OK).
      const set = figma.combineAsVariants(
        variants.map((v) => v.node),
        card.body,
      );
      set.name = titleSuffix ? `${comp.name} / ${titleSuffix}` : comp.name;
      set.description = describeComponent(comp);
      // Every variant is created at (0,0); combineAsVariants preserves those positions, so the
      // set would collapse into one overlapping blob. Make the set a wrapping Auto Layout grid —
      // under Auto Layout the variants physically cannot overlap, whatever their positions were.
      gridComponentSet(set, variants);
      await breathe();

      await wireProperties(comp, set, variants, placeholder, skipProps);
      if (interactive) await wireToggleReactions(combos, variants);

      log(`${comp.name}${titleSuffix ? ` · ${titleSuffix}` : ''} [${pageTitle}]: ${combos.length} variants`);
    };

    for (let ci = 0; ci < comps.length; ci++) {
      const comp = comps[ci];

      // One component's failure must not abort the whole run — isolate and continue.
      try {
        // Interactive toggles gain a synthetic On/Off `State` axis so the set can be prototyped.
        const interactive = INTERACTIVE_TOGGLE.has(comp.slug);
        const axes: VariantAxis[] = interactive ? [...comp.variantAxes, STATE_AXIS] : comp.variantAxes;

        // Human-facing variant property names (e.g. axis "variant" -> "Style"; synthetic → its label).
        const displayName: Record<string, string> = {};
        for (const axis of axes) {
          const fp = (comp.figmaProperties || []).find(
            (p) => p.figmaPropertyType === 'VARIANT' && p.propName === axis.name,
          );
          displayName[axis.name] = fp?.name || axis.label || axis.name;
        }

        // Split components (Icon/Text) render one card per value of the split axis (px/scale), so
        // each size reads cleanly instead of one 1000+ near-identical-variant blob.
        const splitAxisName = SPLIT_BY[comp.slug];
        const splitAxis = splitAxisName ? axes.find((a) => a.name === splitAxisName) : undefined;
        if (splitAxisName && splitAxis) {
          const rest = axes.filter((a) => a.name !== splitAxisName);
          for (const opt of orderedOptions(splitAxis)) {
            const combos = cartesian(rest).map((c) => ({ ...c, [splitAxisName]: opt }));
            await buildCardSet(
              comp,
              ci,
              combos,
              rest,
              displayName,
              `${displayName[splitAxisName]}=${opt}`,
              undefined,
              false,
            );
          }
          continue;
        }

        const combos = cartesian(axes);
        await buildCardSet(
          comp,
          ci,
          combos,
          axes,
          displayName,
          null,
          interactive ? new Set(['checked']) : undefined,
          interactive,
        );
      } catch (e) {
        warn(`${comp.name}: skipped (${String(e)})`);
      }
    }
  }

  // Land the user on the Foundation page.
  if (foundationPage) await figma.setCurrentPageAsync(foundationPage);
}
