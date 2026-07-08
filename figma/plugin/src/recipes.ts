// Per-component "recipe" system — turns each variant into a faithful miniature of the real
// Storybook component instead of the generic box+label fallback.
//
// A recipe receives the already-created (and already-named) variant ComponentNode plus the
// resolved visual channels (ch.*), the token→Variable registry, the shared Icon Slot
// placeholder and the doc fonts. It builds the inner structure INTO that one node and returns
// the same VariantLayers shape the generic path produces, so wireProperties keeps working
// unchanged:
//   label → the text node bound to the first TEXT property
//   bools[propName] → the layer whose `visible` that BOOLEAN toggles
//   swaps[propName] → the icon-slot instance for that INSTANCE_SWAP
//
// Recipes never re-parse CSS: dimensions come from each component's real .css (mirrored as the
// px maps below), colors/spacing/radius come from the token Variables via ch.* or by direct
// token id (both are real tokens from the contract). One component node per variant; children
// are appended to `node`, colors are bound to Variables (setBoundVariableForPaint), and the
// `transparent` sentinel clears a fill/stroke exactly like the generic path.

import type { ComponentDef } from './types';
import type { VariableRegistry } from './variables';
import type { DocFonts } from './doc';

/** Per-variant layers that must be bound to component properties after combining. */
export interface VariantLayers {
  node: ComponentNode;
  label: TextNode | null;
  swaps: Record<string, InstanceNode>;
  // A boolean may drive several layers at once (e.g. Pagination showEdges → first + last jump).
  bools: Record<string, SceneNode | SceneNode[]>;
}

/** Effective token id per visual channel (see resolveChannels in components.ts). */
export type Channels = Record<string, string | undefined>;

export interface RecipeCtx {
  node: ComponentNode;
  comp: ComponentDef;
  combo: Record<string, string>;
  ch: Channels;
  vars: VariableRegistry;
  effects: Map<string, string>;
  placeholder: ComponentNode;
  fonts: DocFonts;
  /** Per-icon inner SVG markup (icon name → shape tags) from the bundle's design.icons. */
  icons: Record<string, string>;
}

export type Recipe = (ctx: RecipeCtx) => VariantLayers;

// ---------------------------------------------------------------------------
// Shared node helpers (bound to real token Variables).
// ---------------------------------------------------------------------------

const SEED: RGB = { r: 0.5, g: 0.5, b: 0.5 }; // overwritten by the bound Variable
const INK: RGB = { r: 0.1, g: 0.1, b: 0.1 };

export const CORNERS: VariableBindableNodeField[] = [
  'topLeftRadius',
  'topRightRadius',
  'bottomLeftRadius',
  'bottomRightRadius',
];

/** A SolidPaint whose color is driven by a Variable (the literal seed is a placeholder). */
export function boundFill(color: RGB, variable: Variable): SolidPaint {
  const paint: SolidPaint = { type: 'SOLID', color, opacity: 1 };
  return figma.variables.setBoundVariableForPaint(paint, 'color', variable);
}

type Fillable = FrameNode | ComponentNode | EllipseNode | RectangleNode | TextNode;
type Strokable = FrameNode | ComponentNode | EllipseNode | RectangleNode;
type Radiusable = FrameNode | ComponentNode | RectangleNode;

/** Set a node's fill from a token id. `transparent`/missing clears the fill. */
function applyFill(n: Fillable, vars: VariableRegistry, id?: string, seed: RGB = SEED): void {
  if (!id || id === 'transparent') {
    n.fills = [];
    return;
  }
  const v = vars.get(id);
  n.fills = v ? [boundFill(seed, v)] : [];
}

/** Set a node's stroke + weight from token ids. `transparent`/missing clears the stroke. */
function applyStroke(
  n: Strokable,
  vars: VariableRegistry,
  id?: string,
  weightId?: string,
  weightPx = 1,
): void {
  if (!id || id === 'transparent') {
    n.strokes = [];
    return;
  }
  const v = vars.get(id);
  if (!v) {
    n.strokes = [];
    return;
  }
  n.strokes = [boundFill(SEED, v)];
  const wv = weightId && weightId !== 'transparent' ? vars.get(weightId) : undefined;
  if (wv) n.setBoundVariable('strokeWeight', wv);
  else n.strokeWeight = weightPx;
}

/** Bind all four corners of a frame/component to a radius token. */
function bindRadius(n: Radiusable, vars: VariableRegistry, id?: string): void {
  if (!id) return;
  const v = vars.get(id);
  if (v) for (const c of CORNERS) n.setBoundVariable(c, v);
}

/** Bind a single node field (padding/gap/height/width/…) to a FLOAT token. */
function bindDim(
  n: FrameNode | ComponentNode,
  field: VariableBindableNodeField,
  vars: VariableRegistry,
  id?: string,
): void {
  if (!id || id === 'transparent') return;
  const v = vars.get(id);
  if (v) n.setBoundVariable(field, v);
}

/** A fixed-size frame (not yet parented); fills cleared so it shows nothing by default. */
function box(w: number, h: number): FrameNode {
  const f = figma.createFrame();
  f.resize(w, h);
  f.fills = [];
  return f;
}

/** A fixed square framed as a circle-container (used for radio / switch tracks). */
function circle(d: number): EllipseNode {
  const e = figma.createEllipse();
  e.resize(d, d);
  return e;
}

/** Append a child and pin it to a fixed size inside an auto-layout parent (no-op otherwise). */
function place(parent: BaseNode & ChildrenMixin, child: SceneNode): void {
  parent.appendChild(child);
  try {
    (child as LayoutMixin & { layoutSizingHorizontal: 'FIXED' }).layoutSizingHorizontal = 'FIXED';
    (child as LayoutMixin & { layoutSizingVertical: 'FIXED' }).layoutSizingVertical = 'FIXED';
  } catch {
    /* parent isn't auto-layout — the resize already fixes the size */
  }
}

/** Append `child` to `parent` and free-position it at (x,y). Uses ABSOLUTE only when the
 *  parent is an Auto Layout frame (required by Figma — it throws otherwise); in a plain
 *  frame, x/y already free-positions the child, so ABSOLUTE is neither needed nor allowed.
 *  The child MUST be appended before positioning, which is exactly what this enforces. */
function absChild(parent: BaseNode & ChildrenMixin, child: SceneNode, x: number, y: number): void {
  parent.appendChild(child);
  const lm = (parent as unknown as { layoutMode?: string }).layoutMode;
  if (lm && lm !== 'NONE') (child as LayoutMixin).layoutPositioning = 'ABSOLUTE';
  child.x = x;
  child.y = y;
}

/** Center a frame's single child both axes (used for check/dash marks). */
function centered(f: FrameNode, w: number, h: number): FrameNode {
  f.layoutMode = 'HORIZONTAL';
  f.primaryAxisAlignItems = 'CENTER';
  f.counterAxisAlignItems = 'CENTER';
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.resize(w, h);
  return f;
}

/** A label text node: real font, bound color + bound font-size where a token exists. */
function labelText(
  font: FontName,
  chars: string,
  vars: VariableRegistry,
  colorId = 'color.fg.default',
  sizeId?: string,
  sizePx = 14,
): TextNode {
  const t = figma.createText();
  t.fontName = font;
  t.characters = chars;
  t.fontSize = sizePx;
  applyFill(t, vars, colorId, INK);
  if (sizeId) {
    const sv = vars.get(sizeId);
    if (sv) t.setBoundVariable('fontSize', sv);
  }
  return t;
}

/** Force a text node onto a single line — it never wraps; truncates with … only if it overflows
 *  (mirrors the field/label CSS `white-space: nowrap`). Keeps placeholders/helper text on one row. */
function noWrap(t: TextNode): void {
  t.textTruncation = 'ENDING';
  t.maxLines = 1;
}

/** An icon-slot instance (kept manually swappable, and mapped into `swaps`). */
function iconSlot(placeholder: ComponentNode, name: string, px: number): InstanceNode {
  const inst = placeholder.createInstance();
  inst.name = name;
  inst.resize(px, px);
  return inst;
}

/** Node types createNodeFromSvg can emit for a shape tag — Figma does NOT always produce VECTOR.
 *  `<circle>/<ellipse>` → ELLIPSE, `<rect>` → RECTANGLE, `<line>` → LINE, `<polygon>` → POLYGON,
 *  overlapping fills → BOOLEAN_OPERATION. All of these carry fills/strokes and must be recolored,
 *  otherwise they keep the literal black from the SVG string and read as broken / off-theme. */
const SHAPE_NODE_TYPES = new Set([
  'VECTOR',
  'ELLIPSE',
  'RECTANGLE',
  'LINE',
  'POLYGON',
  'STAR',
  'BOOLEAN_OPERATION',
]);

/** Apply a callback to every paintable shape node in a subtree (whatever createNodeFromSvg produced).
 *  Container frames/groups are traversed but not recolored themselves. */
function eachShape(node: SceneNode, fn: (v: SceneNode & MinimalStrokesMixin & MinimalFillsMixin) => void): void {
  if (SHAPE_NODE_TYPES.has(node.type)) {
    fn(node as SceneNode & MinimalStrokesMixin & MinimalFillsMixin);
  }
  const kids = (node as unknown as { children?: readonly SceneNode[] }).children;
  if (kids) for (const c of kids) eachShape(c, fn);
}

/** Token-colored ring inside a `size`×`size` frame — the graceful fallback when an icon has no
 *  markup or `createNodeFromSvg` rejects it. Never empty, always theme-bound. */
function iconRingFallback(
  size: number,
  vars: VariableRegistry,
  filled: boolean,
  colorId: string,
  litColor?: string,
): FrameNode {
  const frame = box(size, size);
  frame.name = 'icon';
  const g = Math.round(size * 0.72);
  const mark = circle(g);
  const ref = vars.get(colorId);
  const paint: SolidPaint = litColor
    ? { type: 'SOLID', color: hexRGB(litColor), opacity: 1 }
    : ref
      ? boundFill(INK, ref)
      : { type: 'SOLID', color: INK, opacity: 1 };
  if (filled) {
    mark.fills = [paint];
    mark.strokes = [];
  } else {
    mark.fills = [];
    mark.strokes = [paint];
    mark.strokeWeight = 2;
  }
  absChild(frame, mark, (size - g) / 2, (size - g) / 2);
  return frame;
}

/**
 * Draw a real icon glyph from its inner SVG markup (design.icons[name]). The markup is wrapped in
 * a 24-grid `<svg>` and parsed natively by `figma.createNodeFromSvg` — Figma handles relative
 * commands, arcs, circles and rects, so no manual path normalizer is needed. The frame is scaled
 * to `size` (from the 24 viewBox) and every vector is recolored: stroke icons paint the stroke
 * channel, filled icons the fill, each BOUND to the icon color Variable where one exists. Mirrors
 * the Storybook Icon (feather stroke-style on a 24 grid, `currentColor`).
 */
export function renderIcon(
  markup: string,
  size: number,
  opts: {
    vars: VariableRegistry;
    filled?: boolean;
    colorId?: string;
    strokeWidth?: number;
    /** Recolor to this literal hex SOLID paint (e.g. `#ffffff`) instead of a token-bound paint. */
    litColor?: string;
    /** Skip recoloring entirely — keep the markup's own `fill="#…"` (multicolor logos like Google). */
    preserveColors?: boolean;
  },
): FrameNode {
  const {
    vars,
    filled = false,
    colorId = 'color.fg.default',
    strokeWidth = 2,
    litColor,
    preserveColors = false,
  } = opts;
  if (!markup || !markup.trim()) return iconRingFallback(size, vars, filled, colorId, litColor);
  const stroke = filled ? 'none' : '#000000';
  const fill = filled ? '#000000' : 'none';
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" ` +
    `fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ` +
    `stroke-linecap="round" stroke-linejoin="round">${markup}</svg>`;

  let frame: FrameNode;
  try {
    frame = figma.createNodeFromSvg(svg);
  } catch {
    // A single malformed glyph must never render wrong or abort the set — degrade to a
    // token-colored ring so the slot still reads as an icon and tracks the theme.
    return iconRingFallback(size, vars, filled, colorId, litColor);
  }
  frame.name = 'icon';
  frame.fills = [];
  if (size !== 24) frame.rescale(size / 24);

  // Multicolor marks keep the fills createNodeFromSvg parsed from the markup — never recolor.
  if (preserveColors) return frame;

  const ref = vars.get(colorId);
  const paint = (): SolidPaint =>
    litColor
      ? { type: 'SOLID', color: hexRGB(litColor), opacity: 1 }
      : ref
        ? boundFill(INK, ref)
        : { type: 'SOLID', color: INK, opacity: 1 };
  eachShape(frame, (v) => {
    if (filled) {
      v.fills = [paint()];
      v.strokes = [];
    } else {
      v.strokes = [paint()];
      v.fills = [];
    }
  });
  return frame;
}

// ---------------------------------------------------------------------------
// Tone → token helpers (mirror the CSS custom-property tone maps).
// ---------------------------------------------------------------------------

/** Accent (solid) fill for a tone; `state=error` forces danger (matches CSS). */
function accentToken(combo: Record<string, string>): string {
  if (combo.state === 'error') return 'color.danger.solid';
  switch (combo.tone) {
    case 'neutral':
      return 'color.neutral.solid';
    case 'success':
      return 'color.success.solid';
    case 'warning':
      return 'color.warning.solid';
    case 'danger':
      return 'color.danger.solid';
    case 'info':
      return 'color.info.solid';
    default:
      return 'color.brand.solid';
  }
}

/** On-accent foreground (text/icon over a solid fill). */
function onAccentToken(combo: Record<string, string>): string {
  if (combo.state === 'error') return 'color.danger.fg';
  const tone = combo.tone || 'brand';
  return `color.${tone}.fg`;
}

const px = (sm: number, md: number, lg: number, size?: string): number =>
  size === 'sm' ? sm : size === 'lg' ? lg : md;

/** Five-step size scale (xs · sm · md · lg · xl). */
const px5 = (s: Record<string, number>, size: string | undefined, fallback = 0): number =>
  size !== undefined && s[size] !== undefined ? s[size] : (s.md ?? fallback);

/** Tone-pill fills (soft/outline/solid) — the exact map Tag/Chip/Badge share. */
function tonePill(
  variant: string,
  tone: string,
): {
  fillId: string;
  textId: string;
  strokeId?: string;
} {
  const fillId =
    variant === 'solid'
      ? `color.${tone}.solid`
      : variant === 'outline'
        ? 'transparent'
        : `color.${tone}.subtle`;
  const textId = variant === 'solid' ? `color.${tone}.fg` : `color.${tone}.subtleFg`;
  const strokeId = variant === 'outline' ? `color.${tone}.border` : undefined;
  return { fillId, textId, strokeId };
}

/** Solid accent for a tone (spinner/slider share brand→…→danger, neutral = muted fg). */
function toneAccent(tone: string | undefined): string {
  switch (tone) {
    case 'neutral':
      return 'color.fg.muted';
    case 'success':
      return 'color.success.solid';
    case 'warning':
      return 'color.warning.solid';
    case 'danger':
      return 'color.danger.solid';
    case 'info':
      return 'color.info.solid';
    default:
      return 'color.brand.solid';
  }
}

/** #rrggbb → normalized RGB (for the SocialLoginButton official brand colors — literal, not tokens). */
function hexRGB(h: string): RGB {
  const s = h.replace('#', '');
  return {
    r: parseInt(s.slice(0, 2), 16) / 255,
    g: parseInt(s.slice(2, 4), 16) / 255,
    b: parseInt(s.slice(4, 6), 16) / 255,
  };
}

/** Literal (non-token) solid fill — used only where the source CSS hardcodes a brand color. */
function litFill(n: Fillable, hex: string): void {
  n.fills = [{ type: 'SOLID', color: hexRGB(hex), opacity: 1 }];
}

/** A hairline rule (1px) filled (solid) or dashed-stroked (dashed) from a border token. */
function hairline(
  vars: VariableRegistry,
  colorId: string,
  w: number,
  h: number,
  dashed: boolean,
): FrameNode {
  const line = box(w, h);
  if (dashed) {
    applyStroke(line, vars, colorId, 'border.width.1', 1);
    (line as FrameNode & { dashPattern: number[] }).dashPattern = [4, 4];
  } else {
    applyFill(line, vars, colorId);
  }
  return line;
}

/** A small glyph text node (✕ / ✓ / …) sized in px, colored from a token. */
function glyph(
  font: FontName,
  chars: string,
  vars: VariableRegistry,
  colorId: string,
  sizePx: number,
): TextNode {
  return labelText(font, chars, vars, colorId, undefined, sizePx);
}

/**
 * A real vector icon glyph — the token-colored replacement for the typed `✕ / ✓ / ‹ / ›` characters.
 * Renders the icon from the shared icon set (`close`/`check`/`chevron-*`/…) so dropdown chevrons,
 * tag/chip closes, breadcrumb/pagination arrows and calendar navigation are true vectors, not text.
 * Missing markup degrades to `renderIcon`'s token-colored ring, never a blank slot.
 */
function iconGlyph(
  icons: Record<string, string>,
  name: string,
  size: number,
  vars: VariableRegistry,
  colorId: string,
): FrameNode {
  return renderIcon(icons[name] ?? '', size, { vars, filled: false, colorId, strokeWidth: 2 });
}

// ---------------------------------------------------------------------------
// Field-shaped molecule helpers — mirror the shared Input field language so the
// form composites (TextField/SearchInput/Select/Combobox/Autocomplete/DatePicker/
// FormField) all read as the same control, with each recipe adding its own trim.
// ---------------------------------------------------------------------------

/** Control height token per size (matches --field-height in the field CSS). */
function fieldHeightId(size?: string): string {
  return size === 'sm' ? 'size.control.sm' : size === 'lg' ? 'size.control.lg' : 'size.control.md';
}
/** Field text size token per size (sm/md → sm · lg → md, exactly like Input). */
function fieldFontId(size?: string): string {
  return size === 'lg' ? 'font.size.md' : 'font.size.sm';
}
/** Field background token — filled variant uses the subtle surface. */
function fieldFillId(combo: Record<string, string>): string {
  return combo.variant === 'filled' ? 'color.bg.subtle' : 'color.field.bg';
}
/** Field border token per state (error/success/focus tint; filled hides the rest). */
function fieldStrokeId(combo: Record<string, string>): string {
  if (combo.state === 'error') return 'color.danger.solid';
  if (combo.state === 'success') return 'color.success.solid';
  if (combo.state === 'focus') return 'color.border.focus';
  if (combo.variant === 'filled') return 'transparent';
  if (combo.state === 'hover') return 'color.field.borderHover';
  return 'color.field.border';
}

/** An Input-shaped field row: height/fill/stroke/radius all bound to the field tokens. */
function fieldRow(combo: Record<string, string>, vars: VariableRegistry, width = 240): FrameNode {
  const f = figma.createFrame();
  f.name = 'Field';
  f.layoutMode = 'HORIZONTAL';
  f.counterAxisAlignItems = 'CENTER';
  f.primaryAxisAlignItems = 'MIN';
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.resize(width, f.height);
  bindDim(f, 'height', vars, fieldHeightId(combo.size));
  bindDim(f, 'itemSpacing', vars, 'space.2');
  bindDim(f, 'paddingLeft', vars, 'space.3');
  bindDim(f, 'paddingRight', vars, 'space.3');
  applyFill(f, vars, fieldFillId(combo));
  applyStroke(f, vars, fieldStrokeId(combo), 'border.width.1', 1);
  bindRadius(f, vars, 'radius.control');
  if (combo.state === 'disabled') f.opacity = 0.6;
  return f;
}

/** The muted placeholder text that fills a field row (bound color + bound size). */
function placeholderText(
  font: FontName,
  chars: string,
  vars: VariableRegistry,
  combo: Record<string, string>,
): TextNode {
  return labelText(font, chars, vars, 'color.field.placeholder', fieldFontId(combo.size), 14);
}

/** Make an auto-layout child stretch along the primary axis. */
function fillGrow(child: SceneNode): void {
  try {
    (child as LayoutMixin & { layoutSizingHorizontal: 'FILL' }).layoutSizingHorizontal = 'FILL';
  } catch {
    /* not in auto-layout */
  }
}

/** A magnifier glyph (ring + handle) for search fields. */
function magnifierGlyph(vars: VariableRegistry, size: number): FrameNode {
  const f = box(size, size);
  f.fills = [];
  const ring = circle(Math.round(size * 0.68));
  ring.fills = [];
  applyStroke(ring, vars, 'color.fg.muted', undefined, 1.5);
  ring.x = 0;
  ring.y = 0;
  f.appendChild(ring);
  const handle = box(Math.round(size * 0.34), 1.5);
  applyFill(handle, vars, 'color.fg.muted');
  handle.x = Math.round(size * 0.58);
  handle.y = Math.round(size * 0.62);
  f.appendChild(handle);
  return f;
}

/** A calendar glyph (bordered body + top bar) for date fields. */
function calendarGlyph(vars: VariableRegistry, size: number): FrameNode {
  const f = box(size, size);
  f.fills = [];
  const body = box(size, Math.round(size * 0.82));
  body.fills = [];
  applyStroke(body, vars, 'color.fg.muted', undefined, 1.5);
  bindRadius(body, vars, 'radius.sm');
  body.y = Math.round(size * 0.16);
  f.appendChild(body);
  const bar = box(size, 3);
  applyFill(bar, vars, 'color.fg.muted');
  bar.y = Math.round(size * 0.16);
  f.appendChild(bar);
  return f;
}

/** An upload glyph (up-arrow over a tray) for drop-zones. */
function uploadGlyph(vars: VariableRegistry, size: number): FrameNode {
  const f = box(size, size);
  f.fills = [];
  const stem = box(2, Math.round(size * 0.5));
  applyFill(stem, vars, 'color.fg.subtle');
  stem.x = Math.round(size / 2 - 1);
  stem.y = Math.round(size * 0.18);
  f.appendChild(stem);
  const head = strokePathVar(
    `M${(size * 0.3).toFixed(1)},${(size * 0.36).toFixed(1)} L${(size / 2).toFixed(1)},${(size * 0.18).toFixed(1)} L${(size * 0.7).toFixed(1)},${(size * 0.36).toFixed(1)}`,
    vars,
    'color.fg.subtle',
    1.5,
  );
  f.appendChild(head);
  const tray = box(Math.round(size * 0.62), 2);
  applyFill(tray, vars, 'color.fg.subtle');
  tray.x = Math.round(size * 0.19);
  tray.y = Math.round(size * 0.78);
  f.appendChild(tray);
  return f;
}

/** A muted image placeholder plate: a `color.bg.muted` surface centering the real `image` icon
 *  (mountain + sun) from the icon set — the standard "no image / broken image" affordance. */
function imagePlate(
  vars: VariableRegistry,
  icons: Record<string, string>,
  w: number,
  h: number,
): FrameNode {
  const plate = box(w, h);
  plate.layoutMode = 'HORIZONTAL';
  plate.primaryAxisAlignItems = 'CENTER';
  plate.counterAxisAlignItems = 'CENTER';
  plate.primaryAxisSizingMode = 'FIXED';
  plate.counterAxisSizingMode = 'FIXED';
  plate.resize(w, h);
  plate.clipsContent = true;
  applyFill(plate, vars, 'color.bg.muted');
  bindRadius(plate, vars, 'radius.sm');
  const glyphPx = Math.max(12, Math.round(Math.min(w, h) * 0.5));
  plate.appendChild(iconGlyph(icons, 'image', glyphPx, vars, 'color.fg.subtle'));
  return plate;
}

/** A ¾ tone-colored arc (static spinner) for loading fields. */
function spinnerArc(vars: VariableRegistry, size: number, colorId = 'color.fg.muted'): EllipseNode {
  const arc = circle(size);
  arc.fills = [];
  applyStroke(arc, vars, colorId, undefined, 2);
  (arc as EllipseNode & { arcData: ArcData }).arcData = {
    startingAngle: -Math.PI / 2,
    endingAngle: Math.PI,
    innerRadius: 0,
  };
  return arc;
}

/** A hidden absolute marker so a non-visual BOOLEAN can still be wired to a layer. */
function hiddenMarker(node: ComponentNode | FrameNode, vars: VariableRegistry): FrameNode {
  const m = box(6, 6);
  applyFill(m, vars, 'color.fg.muted');
  absChild(node, m, 0, 0);
  m.visible = false;
  return m;
}

/** A floating popup surface (listbox / calendar) shown below a field: surface + border + radius +
 *  shadow, vertical auto-layout. Mirrors the shared `.tds-*__list/__calendar` popup CSS. */
function popupSurface(
  vars: VariableRegistry,
  effects: Map<string, string>,
  width: number,
): FrameNode {
  const p = box(width, 12);
  p.layoutMode = 'VERTICAL';
  p.primaryAxisSizingMode = 'AUTO';
  p.counterAxisSizingMode = 'FIXED';
  p.counterAxisAlignItems = 'MIN';
  p.resize(width, p.height);
  applyFill(p, vars, 'color.bg.surface');
  applyStroke(p, vars, 'color.border.default', 'border.width.1', 1);
  bindRadius(p, vars, 'radius.surface');
  bindDim(p, 'itemSpacing', vars, 'space.0.5');
  bindDim(p, 'paddingTop', vars, 'space.1');
  bindDim(p, 'paddingBottom', vars, 'space.1');
  bindDim(p, 'paddingLeft', vars, 'space.1');
  bindDim(p, 'paddingRight', vars, 'space.1');
  const sid = effects.get('shadow.lg');
  if (sid) void p.setEffectStyleIdAsync(sid);
  return p;
}

/** An option row inside a listbox popup — selected rows get the brand-subtle fill + trailing check. */
function optionRow(
  vars: VariableRegistry,
  fonts: DocFonts,
  icons: Record<string, string>,
  width: number,
  text: string,
  selected: boolean,
): FrameNode {
  const r = box(width, 30);
  r.layoutMode = 'HORIZONTAL';
  r.counterAxisAlignItems = 'CENTER';
  r.primaryAxisSizingMode = 'FIXED';
  r.counterAxisSizingMode = 'FIXED';
  r.resize(width, 30);
  bindDim(r, 'paddingLeft', vars, 'space.2');
  bindDim(r, 'paddingRight', vars, 'space.2');
  // Combobox.css: the selected option has NO background — only brand-solid text + medium weight.
  r.fills = [];
  bindRadius(r, vars, 'radius.sm');
  const t = labelText(
    selected ? fonts.medium : fonts.regular,
    text,
    vars,
    selected ? 'color.brand.solid' : 'color.fg.default',
    'font.size.sm',
    14,
  );
  r.appendChild(t);
  fillGrow(t);
  if (selected) {
    const chk = iconGlyph(icons, 'check', 14, vars, 'color.brand.solid');
    r.appendChild(chk);
  }
  return r;
}

/** A compact month calendar for the DatePicker popup (header + weekday row + day grid). */
function calendarSurface(
  vars: VariableRegistry,
  effects: Map<string, string>,
  fonts: DocFonts,
  icons: Record<string, string>,
  width: number,
): FrameNode {
  const cal = popupSurface(vars, effects, width);
  const cellW = Math.floor((width - 16) / 7);

  const header = box(width - 16, 20);
  header.layoutMode = 'HORIZONTAL';
  header.counterAxisAlignItems = 'CENTER';
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.primaryAxisSizingMode = 'FIXED';
  header.counterAxisSizingMode = 'FIXED';
  header.resize(width - 16, 20);
  header.appendChild(iconGlyph(icons, 'chevron-left', 16, vars, 'color.fg.muted'));
  header.appendChild(labelText(fonts.semibold, '2026 · 7', vars, 'color.fg.default', 'font.size.sm', 13));
  header.appendChild(iconGlyph(icons, 'chevron-right', 16, vars, 'color.fg.muted'));
  cal.appendChild(header);

  const week = box(width - 16, 16);
  week.layoutMode = 'HORIZONTAL';
  week.primaryAxisSizingMode = 'FIXED';
  week.counterAxisSizingMode = 'FIXED';
  week.resize(width - 16, 16);
  for (const d of ['S', 'M', 'T', 'W', 'T', 'F', 'S']) {
    const c = box(cellW, 16);
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisAlignItems = 'CENTER';
    c.counterAxisAlignItems = 'CENTER';
    c.primaryAxisSizingMode = 'FIXED';
    c.counterAxisSizingMode = 'FIXED';
    c.resize(cellW, 16);
    c.appendChild(labelText(fonts.regular, d, vars, 'color.fg.subtle', 'font.size.xs', 11));
    week.appendChild(c);
  }
  cal.appendChild(week);

  let day = 1;
  const selDay = 15;
  for (let row = 0; row < 5; row++) {
    const r = box(width - 16, cellW);
    r.layoutMode = 'HORIZONTAL';
    r.primaryAxisSizingMode = 'FIXED';
    r.counterAxisSizingMode = 'FIXED';
    r.resize(width - 16, cellW);
    for (let col = 0; col < 7; col++) {
      const cell = box(cellW, cellW);
      cell.layoutMode = 'HORIZONTAL';
      cell.primaryAxisAlignItems = 'CENTER';
      cell.counterAxisAlignItems = 'CENTER';
      cell.primaryAxisSizingMode = 'FIXED';
      cell.counterAxisSizingMode = 'FIXED';
      cell.resize(cellW, cellW);
      const show = day <= 31;
      const sel = show && day === selDay;
      if (sel) {
        applyFill(cell, vars, 'color.brand.solid');
        bindRadius(cell, vars, 'radius.md'); // DatePicker.css day cell keeps radius.md when selected
      }
      cell.appendChild(
        labelText(
          fonts.regular,
          show ? String(day) : '',
          vars,
          sel ? 'color.brand.fg' : 'color.fg.default',
          'font.size.xs',
          12,
        ),
      );
      r.appendChild(cell);
      day++;
    }
    cal.appendChild(r);
  }
  return cal;
}

// ---------------------------------------------------------------------------
// Recipes (each mirrors src/components/atoms/<Name>/<Name>.{tsx,css}).
// ---------------------------------------------------------------------------

/** Button — Auto Layout row; Type A label · B icon+label+icon · C icon-only square. */
const button: Recipe = ({ node, combo, ch, vars, placeholder, fonts }) => {
  const type = combo.type;
  const iconPx = px(16, 18, 20, combo.size);

  const isLink = combo.variant === 'link';
  const btnTone = combo.tone || 'brand';
  // Label/fill color per Button.css: solid → on-solid fg, everything else → the tone's subtle fg.
  const btnText = combo.variant === 'solid' ? `color.${btnTone}.fg` : `color.${btnTone}.subtleFg`;
  node.layoutMode = 'HORIZONTAL';
  node.primaryAxisAlignItems = 'CENTER';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = isLink ? 'AUTO' : 'FIXED';
  if (!isLink) bindDim(node, 'height', vars, ch.height);
  if (isLink) {
    // Button.css variant=link: height auto, zero padding, no fill/border (label underlined below).
    node.paddingLeft = 0;
    node.paddingRight = 0;
    node.paddingTop = 0;
    node.paddingBottom = 0;
    bindDim(node, 'itemSpacing', vars, ch.gap);
  } else if (type === 'C') {
    node.paddingLeft = 0;
    node.paddingRight = 0;
    node.itemSpacing = 0;
    node.primaryAxisSizingMode = 'FIXED';
    bindDim(node, 'width', vars, ch.height); // square: width follows height
  } else {
    bindDim(node, 'itemSpacing', vars, ch.gap);
    bindDim(node, 'paddingLeft', vars, ch.padX);
    bindDim(node, 'paddingRight', vars, ch.padX);
    bindDim(node, 'paddingTop', vars, ch.padY);
    bindDim(node, 'paddingBottom', vars, ch.padY);
  }

  applyFill(node, vars, isLink ? 'transparent' : ch.fill);
  if (!isLink) applyStroke(node, vars, ch.stroke, ch.strokeWidth, 1);
  bindRadius(node, vars, ch.radius);
  if (combo.state === 'disabled') node.opacity = 0.5;

  const swaps: Record<string, InstanceNode> = {};
  let label: TextNode | null = null;

  if (type === 'C') {
    const s = iconSlot(placeholder, 'Icon Start', iconPx);
    node.appendChild(s);
    swaps.iconStart = s;
  } else {
    if (type === 'B') {
      const s = iconSlot(placeholder, 'Icon Start', iconPx);
      node.appendChild(s);
      swaps.iconStart = s;
    }
    label = labelText(
      fonts.semibold,
      'Button',
      vars,
      ch.text || btnText,
      ch.fontSize,
      px(14, 14, 16, combo.size),
    );
    if (isLink)
      (label as TextNode & { textDecoration: 'NONE' | 'UNDERLINE' }).textDecoration = 'UNDERLINE';
    node.appendChild(label);
    if (type === 'B') {
      const e = iconSlot(placeholder, 'Icon End', iconPx);
      node.appendChild(e);
      swaps.iconEnd = e;
    }
  }

  return { node, label, swaps, bools: {} };
};

/** Checkbox — square box + toggled check / indeterminate mark + label. */
const checkbox: Recipe = ({ node, combo, ch, vars, fonts, icons }) => {
  const s = px(16, 18, 22, combo.size);
  const glyphPx = px(12, 14, 16, combo.size);
  const accent = accentToken(combo);
  const onAccent = onAccentToken(combo);

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, ch.gap);
  if (combo.state === 'disabled') node.opacity = 0.5;

  const boxFrame = box(s, s);
  applyFill(boxFrame, vars, 'color.field.bg');
  applyStroke(boxFrame, vars, 'color.field.border', 'border.width.2', 2);
  bindRadius(boxFrame, vars, 'radius.sm');
  place(node, boxFrame);

  // Checked overlay: accent square with a check glyph, covering the box.
  const check = centered(box(s, s), s, s);
  applyFill(check, vars, accent);
  bindRadius(check, vars, 'radius.sm');
  const tick = iconGlyph(icons, 'check', glyphPx, vars, onAccent);
  check.appendChild(tick);
  check.x = 0;
  check.y = 0;
  check.visible = false;
  boxFrame.appendChild(check);

  // Indeterminate overlay: accent square with a horizontal bar.
  const dash = centered(box(s, s), s, s);
  applyFill(dash, vars, accent);
  bindRadius(dash, vars, 'radius.sm');
  const bar = box(Math.round(s * 0.45), 2);
  applyFill(bar, vars, onAccent);
  place(dash, bar);
  dash.x = 0;
  dash.y = 0;
  dash.visible = false;
  boxFrame.appendChild(dash);

  const label = labelText(fonts.regular, 'Label', vars, ch.text, ch.fontSize, 14);
  node.appendChild(label);

  return { node, label, swaps: {}, bools: { checked: check, indeterminate: dash } };
};

/** Radio — circle + toggled inner dot + label. */
const radio: Recipe = ({ node, combo, ch, vars, fonts }) => {
  const s = px(16, 18, 22, combo.size);
  const accent = accentToken(combo);

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, ch.gap);
  if (combo.state === 'disabled') node.opacity = 0.5;

  const ring = box(s, s);
  applyFill(ring, vars, 'color.field.bg');
  applyStroke(ring, vars, 'color.field.border', 'border.width.2', 2);
  bindRadius(ring, vars, 'radius.pill');
  place(node, ring);

  const dot = circle(Math.round(s * 0.5));
  applyFill(dot, vars, accent);
  dot.x = (s - Math.round(s * 0.5)) / 2;
  dot.y = (s - Math.round(s * 0.5)) / 2;
  // `checked` is a synthetic On/Off VARIANT here (injected in components.ts) so the set can be an
  // interactive component (click toggles Off↔On). `State` is undefined for a non-injected build.
  dot.visible = combo.State === 'On';
  ring.appendChild(dot);

  const label = labelText(fonts.regular, 'Label', vars, ch.text, ch.fontSize, 14);
  node.appendChild(label);

  return { node, label, swaps: {}, bools: {} };
};

/** Switch — pill track + thumb; `checked` reveals the accent "on" overlay (thumb at end). */
const switchRecipe: Recipe = ({ node, combo, ch, vars, fonts }) => {
  const w = px(32, 40, 52, combo.size);
  const h = px(18, 24, 30, combo.size);
  const pad = px(2, 3, 4, combo.size);
  const thumb = h - 2 * pad;
  const accent = accentToken(combo);

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, ch.gap);
  if (combo.state === 'disabled') node.opacity = 0.5;

  const track = box(w, h);
  applyFill(track, vars, 'color.bg.muted');
  bindRadius(track, vars, 'radius.pill');

  const thumbOff = circle(thumb);
  applyFill(thumbOff, vars, 'color.white');
  thumbOff.x = pad;
  thumbOff.y = pad;
  track.appendChild(thumbOff);

  // "On" overlay — accent track + thumb pinned to the end; shown when checked.
  const on = box(w, h);
  applyFill(on, vars, accent);
  bindRadius(on, vars, 'radius.pill');
  const thumbOn = circle(thumb);
  applyFill(thumbOn, vars, 'color.white');
  thumbOn.x = w - pad - thumb;
  thumbOn.y = pad;
  on.appendChild(thumbOn);
  on.x = 0;
  on.y = 0;
  // `checked` is a synthetic On/Off VARIANT here (injected in components.ts) so the set can be an
  // interactive component (click toggles Off↔On, SMART_ANIMATE slides the thumb).
  on.visible = combo.State === 'On';
  track.appendChild(on);

  const label = labelText(fonts.regular, 'Enabled', vars, ch.text, ch.fontSize, 14);

  // labelPosition: end → [track, label]; start → [label, track].
  if (combo.labelPosition === 'start') {
    node.appendChild(label);
    place(node, track);
  } else {
    place(node, track);
    node.appendChild(label);
  }

  return { node, label, swaps: {}, bools: {} };
};

/** Badge — tone pill (variant solid/soft/outline) + optional dot / icon + label. */
const badge: Recipe = ({ node, combo, ch, vars, placeholder, fonts }) => {
  const tone = combo.tone || 'neutral';
  const variant = combo.variant || 'soft';
  const fillId =
    variant === 'solid'
      ? `color.${tone}.solid`
      : variant === 'outline'
        ? 'transparent'
        : `color.${tone}.subtle`;
  const textId = variant === 'solid' ? `color.${tone}.fg` : `color.${tone}.subtleFg`;
  const strokeId = variant === 'outline' ? `color.${tone}.border` : undefined;

  // Badge.css: size drives padding-x + height (sm 18px · md 22px) and shape drives radius
  // (rounded → radius.sm · pill → radius.pill). The base ch.padX/ch.radius are fixed, so derive.
  const badgePadX = combo.size === 'sm' ? 'space.1.5' : 'space.2';
  const badgeH = combo.size === 'sm' ? 18 : 22;
  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(node.width, badgeH);
  bindDim(node, 'itemSpacing', vars, ch.gap);
  bindDim(node, 'paddingLeft', vars, badgePadX);
  bindDim(node, 'paddingRight', vars, badgePadX);
  applyFill(node, vars, fillId);
  if (strokeId) applyStroke(node, vars, strokeId, 'border.width.1', 1);
  bindRadius(node, vars, combo.shape === 'rounded' ? 'radius.sm' : 'radius.pill');

  // Leading status dot (BOOLEAN `dot`).
  const dotColor = variant === 'solid' ? textId : `color.${tone}.solid`;
  const dot = circle(6);
  applyFill(dot, vars, dotColor);
  dot.visible = false;
  place(node, dot);

  // Leading icon slot (INSTANCE_SWAP `icon`).
  const icon = iconSlot(placeholder, 'Icon', 12);
  node.appendChild(icon);

  const label = labelText(fonts.medium, 'Badge', vars, textId, ch.fontSize, 12);
  node.appendChild(label);

  return { node, label, swaps: { icon }, bools: { dot } };
};

/** Avatar — circle/rounded square with initials + a per-status corner dot. */
const avatar: Recipe = ({ node, combo, ch, vars, fonts }) => {
  const s =
    combo.size === 'xs'
      ? 24
      : combo.size === 'sm'
        ? 32
        : combo.size === 'lg'
          ? 48
          : combo.size === 'xl'
            ? 64
            : 40;

  // Outer container does NOT clip — so the status dot can sit on the avatar edge without being cut
  // off by the pill radius. The avatar body (fill + initials + rounded clip) lives in an inner frame.
  node.layoutMode = 'HORIZONTAL';
  node.primaryAxisAlignItems = 'CENTER';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(s, s);
  node.clipsContent = false;
  node.fills = [];
  if (combo.state === 'error') node.opacity = 0.6;

  const body = box(s, s);
  body.layoutMode = 'HORIZONTAL';
  body.primaryAxisAlignItems = 'CENTER';
  body.counterAxisAlignItems = 'CENTER';
  body.primaryAxisSizingMode = 'FIXED';
  body.counterAxisSizingMode = 'FIXED';
  body.resize(s, s);
  body.clipsContent = true;
  // Avatar.css fills with color.bg.muted (the meta declares no fill → ch.fill is undefined), and
  // shape drives the radius (circle → pill · rounded → lg) rather than the fixed base radius.
  applyFill(body, vars, ch.fill || 'color.bg.muted');
  bindRadius(body, vars, combo.shape === 'rounded' ? 'radius.lg' : 'radius.pill');
  const initials = labelText(
    fonts.semibold,
    'JD',
    vars,
    ch.text || 'color.fg.muted',
    undefined,
    Math.round(s * 0.4),
  );
  body.appendChild(initials);
  place(node, body);

  // Status dot (VARIANT `status`): each value paints its own dot; `none` shows nothing. Placed on
  // the bottom-right edge, slightly inset so it overlaps the body rim and stays fully inside `node`.
  const statusFill: Record<string, string> = {
    online: 'color.success.solid',
    busy: 'color.danger.solid',
    away: 'color.warning.solid',
    offline: 'color.bg.surface',
  };
  const st = combo.status;
  if (st && st !== 'none') {
    const d = Math.max(8, Math.round(s * 0.28));
    const dot = circle(d);
    applyFill(dot, vars, statusFill[st]);
    applyStroke(
      dot,
      vars,
      st === 'offline' ? 'color.fg.subtle' : 'color.bg.surface',
      undefined,
      1.5,
    );
    const inset = Math.round(d * 0.15);
    absChild(node, dot, s - d - inset, s - d - inset);
  }

  return { node, label: null, swaps: {}, bools: {} };
};

/** Input — field row: fill/stroke/radius/height from tokens + muted placeholder + icon slots. */
const input: Recipe = ({ node, combo, ch, vars, placeholder, fonts }) => {
  const fontId = combo.size === 'lg' ? 'font.size.md' : 'font.size.sm';

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  const isUnderline = combo.variant === 'underline';
  const isFilled = combo.variant === 'filled';
  node.resize(220, node.height);
  bindDim(node, 'height', vars, ch.height);
  bindDim(node, 'itemSpacing', vars, ch.gap);
  // Input.css underline uses a tighter padding-inline (space.1); others keep the base padding.
  bindDim(node, 'paddingLeft', vars, isUnderline ? 'space.1' : ch.padX);
  bindDim(node, 'paddingRight', vars, isUnderline ? 'space.1' : ch.padX);
  // Fill per variant: underline → transparent · filled → bg.subtle · outline → field.bg.
  applyFill(node, vars, isUnderline ? 'transparent' : isFilled ? 'color.bg.subtle' : ch.fill);
  applyStroke(node, vars, isFilled ? 'transparent' : ch.stroke, ch.strokeWidth, 1);
  // Underline variant: border only on the bottom edge, square corners.
  if (isUnderline) {
    const n = node as ComponentNode & {
      strokeTopWeight: number;
      strokeRightWeight: number;
      strokeLeftWeight: number;
      strokeBottomWeight: number;
    };
    n.strokeTopWeight = 0;
    n.strokeRightWeight = 0;
    n.strokeLeftWeight = 0;
    n.strokeBottomWeight = 1;
  }
  bindRadius(node, vars, combo.variant === 'underline' ? 'radius.none' : ch.radius);
  if (combo.state === 'disabled') node.opacity = 0.6;

  const swaps: Record<string, InstanceNode> = {};
  const iconPx = px(16, 18, 20, combo.size);

  const start = iconSlot(placeholder, 'Icon Start', iconPx);
  node.appendChild(start);
  swaps.iconStart = start;

  const label = labelText(
    fonts.regular,
    'Placeholder',
    vars,
    'color.field.placeholder',
    fontId,
    14,
  );
  node.appendChild(label);
  label.layoutGrow = 1;
  try {
    (label as LayoutMixin & { layoutSizingHorizontal: 'FILL' }).layoutSizingHorizontal = 'FILL';
  } catch {
    /* not in auto-layout */
  }

  const end = iconSlot(placeholder, 'Icon End', iconPx);
  node.appendChild(end);
  swaps.iconEnd = end;

  return { node, label, swaps, bools: {} };
};

/** Progress — full-width muted track with a ~60% tone-colored fill. */
const progress: Recipe = ({ node, combo, ch, vars }) => {
  const h = px(4, 8, 12, combo.size);
  const W = 220;
  const accent = accentToken(combo);
  // Progress.css: shape=square → radius.none, otherwise the pill track.
  const trackRadius = combo.shape === 'square' ? 'radius.none' : 'radius.pill';

  node.resize(W, h);
  applyFill(node, vars, ch.fill || 'color.bg.muted');
  bindRadius(node, vars, trackRadius);
  node.clipsContent = true;

  const fill = box(Math.round(W * 0.6), h);
  applyFill(fill, vars, accent);
  bindRadius(fill, vars, trackRadius);
  fill.x = 0;
  fill.y = 0;
  node.appendChild(fill);

  return { node, label: null, swaps: {}, bools: {} };
};

/** Tag — tone pill (soft/outline/solid) + leading icon slot + optional trailing ✕ (closable). */
const tag: Recipe = ({ node, combo, vars, placeholder, fonts, icons }) => {
  const tone = combo.tone || 'neutral';
  const variant = combo.variant || 'outline';
  const { fillId, textId, strokeId } = tonePill(variant, tone);
  const h = combo.size === 'sm' ? 20 : 24;
  const padX = combo.size === 'sm' ? 'space.1.5' : 'space.2';
  const radius = combo.shape === 'pill' ? 'radius.pill' : 'radius.sm';

  node.layoutMode = 'HORIZONTAL';
  node.primaryAxisAlignItems = 'CENTER';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(node.width, h);
  bindDim(node, 'itemSpacing', vars, 'space.1');
  bindDim(node, 'paddingLeft', vars, padX);
  bindDim(node, 'paddingRight', vars, padX);
  applyFill(node, vars, fillId);
  if (strokeId) applyStroke(node, vars, strokeId, 'border.width.1', 1);
  bindRadius(node, vars, radius);
  if (combo.state === 'disabled') node.opacity = 0.5;

  const icon = iconSlot(placeholder, 'Icon', 12);
  node.appendChild(icon);

  const label = labelText(fonts.medium, 'Tag', vars, textId, 'font.size.xs', 12);
  node.appendChild(label);

  const close = iconGlyph(icons, 'close', 12, vars, textId);
  close.visible = false;
  node.appendChild(close);

  return { node, label, swaps: { icon }, bools: { closable: close } };
};

/** Chip — interactive tone pill (pill radius) + leading icon/check (selected) + trailing ✕ (removable). */
const chip: Recipe = ({ node, combo, vars, placeholder, fonts, icons }) => {
  const tone = combo.tone || 'neutral';
  const variant = combo.variant || 'soft';
  const { fillId, textId, strokeId } = tonePill(variant, tone);
  const h = combo.size === 'sm' ? 22 : 28;
  const padX = combo.size === 'sm' ? 'space.1.5' : 'space.2';
  const fontId = combo.size === 'sm' ? 'font.size.xs' : 'font.size.sm';

  node.layoutMode = 'HORIZONTAL';
  node.primaryAxisAlignItems = 'CENTER';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(node.width, h);
  bindDim(node, 'itemSpacing', vars, 'space.1');
  bindDim(node, 'paddingLeft', vars, padX);
  bindDim(node, 'paddingRight', vars, padX);
  applyFill(node, vars, fillId);
  if (strokeId) applyStroke(node, vars, strokeId, 'border.width.1', 1);
  bindRadius(node, vars, 'radius.pill');
  if (combo.state === 'disabled') node.opacity = 0.5;

  const icon = iconSlot(placeholder, 'Icon', combo.size === 'sm' ? 12 : 14);
  node.appendChild(icon);

  // Selected → a leading check glyph (the real Chip shows a check when selected).
  const check = iconGlyph(icons, 'check', combo.size === 'sm' ? 12 : 14, vars, textId);
  check.visible = false;
  node.appendChild(check);

  const label = labelText(fonts.medium, 'Chip', vars, textId, fontId, 14);
  node.appendChild(label);

  const remove = iconGlyph(icons, 'close', 12, vars, textId);
  remove.visible = false;
  node.appendChild(remove);

  return { node, label, swaps: { icon }, bools: { selected: check, removable: remove } };
};

/** Spinner — a faint full ring + a ¾ tone-colored arc (no animation). */
const spinner: Recipe = ({ node, combo, vars }) => {
  const s = px5({ xs: 12, sm: 16, md: 20, lg: 28, xl: 40 }, combo.size, 20);
  const weight = combo.size === 'lg' || combo.size === 'xl' ? 3 : 2;
  const accent = toneAccent(combo.tone);

  node.resize(s, s);
  node.fills = [];

  // Spinner.css track = color-mix(accent 25%, transparent) — a faint tint of the tone accent,
  // not grey. Bind the accent and drop opacity to ~25%.
  const track = circle(s);
  track.fills = [];
  applyStroke(track, vars, accent, undefined, weight);
  track.opacity = 0.25;
  track.x = 0;
  track.y = 0;
  node.appendChild(track);

  const arc = circle(s);
  arc.fills = [];
  applyStroke(arc, vars, accent, undefined, weight);
  (arc as EllipseNode & { arcData: ArcData }).arcData = {
    startingAngle: -Math.PI / 2,
    endingAngle: Math.PI,
    innerRadius: 0,
  };
  arc.x = 0;
  arc.y = 0;
  node.appendChild(arc);

  return { node, label: null, swaps: {}, bools: {} };
};

/** Slider — muted track + ~50% tone fill + surface thumb ringed in the tone. */
const slider: Recipe = ({ node, combo, ch, vars }) => {
  const h = px(4, 6, 8, combo.size);
  const thumb = px(14, 18, 22, combo.size);
  const W = 220;
  const accent = ch.fill && ch.fill !== 'transparent' ? ch.fill : toneAccent(combo.tone);

  node.resize(W, thumb);
  node.fills = [];
  if (combo.state === 'disabled') node.opacity = 0.5;

  const track = box(W, h);
  applyFill(track, vars, 'color.bg.muted');
  bindRadius(track, vars, 'radius.pill');
  track.x = 0;
  track.y = (thumb - h) / 2;
  node.appendChild(track);

  const fill = box(Math.round(W * 0.5), h);
  applyFill(fill, vars, accent);
  bindRadius(fill, vars, 'radius.pill');
  fill.x = 0;
  fill.y = (thumb - h) / 2;
  node.appendChild(fill);

  const knob = circle(thumb);
  applyFill(knob, vars, 'color.bg.surface');
  applyStroke(knob, vars, accent, undefined, 2);
  knob.x = Math.round(W * 0.5) - thumb / 2;
  knob.y = 0;
  node.appendChild(knob);

  return { node, label: null, swaps: {}, bools: {} };
};

/** Textarea — multi-row field box; fill/border reflect variant + status, muted placeholder top-left. */
const textarea: Recipe = ({ node, combo, vars, fonts }) => {
  const filled = combo.variant === 'filled';
  const fillId = filled ? 'color.bg.subtle' : 'color.field.bg';
  const strokeId =
    combo.state === 'error'
      ? 'color.danger.solid'
      : combo.state === 'success'
        ? 'color.success.solid'
        : filled
          ? 'transparent'
          : 'color.field.border';
  const h = px(72, 84, 96, combo.size);
  const padY = combo.size === 'lg' ? 'space.3' : combo.size === 'sm' ? 'space.1.5' : 'space.2';
  const padX = combo.size === 'lg' ? 'space.4' : combo.size === 'sm' ? 'space.2.5' : 'space.3';
  const fontId = combo.size === 'lg' ? 'font.size.md' : 'font.size.sm';

  node.layoutMode = 'VERTICAL';
  node.primaryAxisAlignItems = 'MIN';
  node.counterAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(260, h);
  bindDim(node, 'paddingTop', vars, padY);
  bindDim(node, 'paddingBottom', vars, padY);
  bindDim(node, 'paddingLeft', vars, padX);
  bindDim(node, 'paddingRight', vars, padX);
  applyFill(node, vars, fillId);
  applyStroke(node, vars, strokeId, 'border.width.1', 1);
  bindRadius(node, vars, 'radius.control');
  if (combo.state === 'disabled') node.opacity = 0.6;

  const label = labelText(
    fonts.regular,
    'Write something…',
    vars,
    'color.field.placeholder',
    fontId,
    14,
  );
  node.appendChild(label);

  return { node, label, swaps: {}, bools: {} };
};

/** Link — inline tone-colored text; underline=always draws the underline; leading/trailing icon slots. */
const link: Recipe = ({ node, combo, vars, placeholder, fonts, icons }) => {
  const toneColor =
    combo.state === 'disabled'
      ? 'color.fg.disabled'
      : combo.tone === 'neutral'
        ? 'color.fg.default'
        : combo.tone === 'danger'
          ? 'color.danger.subtleFg'
          : 'color.fg.link';
  const sizeId =
    combo.size === 'sm' ? 'font.size.sm' : combo.size === 'lg' ? 'font.size.lg' : 'font.size.md';
  const sizePx = px(14, 16, 18, combo.size);
  const iconPx = px(13, 14, 16, combo.size);

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.1');
  if (combo.state === 'disabled') node.opacity = 0.5;

  // Icon slots stay swappable but hidden by default — a bare link is just text, and always-on
  // placeholder squares made every link read as broken. Toggle a slot visible to add an icon.
  const leading = iconSlot(placeholder, 'Leading Icon', iconPx);
  leading.visible = false;
  node.appendChild(leading);

  const label = labelText(fonts.medium, 'Learn more', vars, toneColor, sizeId, sizePx);
  (label as TextNode & { textDecoration: 'NONE' | 'UNDERLINE' }).textDecoration =
    combo.underline === 'always' ? 'UNDERLINE' : 'NONE';
  node.appendChild(label);

  const trailing = iconSlot(placeholder, 'Trailing Icon', iconPx);
  trailing.visible = false;
  node.appendChild(trailing);

  const ext = iconGlyph(icons, 'external-link', iconPx, vars, toneColor);
  ext.visible = false;
  node.appendChild(ext);

  return {
    node,
    label,
    swaps: { leadingIcon: leading, trailingIcon: trailing },
    bools: { external: ext },
  };
};

/** Divider — a hairline rule (horizontal or vertical), tone→border color, solid/dashed, optional label. */
const divider: Recipe = ({ node, combo, vars, fonts }) => {
  const colorId =
    combo.tone === 'subtle'
      ? 'color.border.subtle'
      : combo.tone === 'strong'
        ? 'color.border.strong'
        : 'color.border.default';
  const dashed = combo.variant === 'dashed';

  if (combo.orientation === 'vertical') {
    node.resize(16, 48);
    node.fills = [];
    const line = hairline(vars, colorId, 1, 48, dashed);
    line.x = 8;
    line.y = 0;
    node.appendChild(line);
    return { node, label: null, swaps: {}, bools: {} };
  }

  // Divider.css default is ONE continuous full-width rule; the two-segment form only appears when
  // a label is present. Draw a single line and overlay a centered label whose surface-colored
  // backdrop hugs the text — empty (default) it collapses to zero width, so the rule stays whole.
  node.resize(240, 20);
  node.fills = [];

  const line = hairline(vars, colorId, 240, 1, dashed);
  line.x = 0;
  line.y = 10;
  node.appendChild(line);

  const wrap = box(1, 16);
  wrap.layoutMode = 'HORIZONTAL';
  wrap.primaryAxisAlignItems = 'CENTER';
  wrap.counterAxisAlignItems = 'CENTER';
  wrap.primaryAxisSizingMode = 'AUTO';
  wrap.counterAxisSizingMode = 'AUTO';
  applyFill(wrap, vars, 'color.bg.surface');
  const label = labelText(fonts.regular, '', vars, 'color.fg.muted', 'font.size.sm', 14);
  wrap.appendChild(label);
  node.appendChild(wrap);
  wrap.x = Math.round((240 - wrap.width) / 2);
  wrap.y = Math.round((20 - wrap.height) / 2);

  return { node, label, swaps: {}, bools: {} };
};

/** Skeleton — muted placeholder; text = 3 lines (last short), else circle/rect/rounded block. */
const skeleton: Recipe = ({ node, combo, vars }) => {
  const muted = 'color.bg.muted';

  if (combo.shape === 'circle') {
    node.resize(48, 48);
    node.fills = [];
    const c = circle(48);
    applyFill(c, vars, muted);
    node.appendChild(c);
    return { node, label: null, swaps: {}, bools: {} };
  }

  if (combo.shape === 'rect' || combo.shape === 'rounded') {
    node.resize(240, 72);
    applyFill(node, vars, muted);
    bindRadius(node, vars, combo.shape === 'rounded' ? 'radius.lg' : 'radius.none');
    return { node, label: null, swaps: {}, bools: {} };
  }

  // text — a stack of bones, last one shortened.
  node.layoutMode = 'VERTICAL';
  node.counterAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(240, node.height);
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.2');
  const widths = [240, 240, 144];
  for (const w of widths) {
    const bone = box(w, 12);
    applyFill(bone, vars, muted);
    bindRadius(bone, vars, 'radius.sm');
    node.appendChild(bone);
  }
  return { node, label: null, swaps: {}, bools: {} };
};

/** Tooltip — small rounded bubble (inverse or surface) + a pointer nub per placement. */
const tooltip: Recipe = ({ node, combo, vars, fonts }) => {
  const inverse = (combo.tone || 'inverse') === 'inverse';
  const bgId = inverse ? 'color.bg.inverse' : 'color.bg.surface';
  const fgId = inverse ? 'color.fg.inverse' : 'color.fg.default';

  node.layoutMode = 'HORIZONTAL';
  node.primaryAxisAlignItems = 'CENTER';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  bindDim(node, 'paddingTop', vars, 'space.1');
  bindDim(node, 'paddingBottom', vars, 'space.1');
  bindDim(node, 'paddingLeft', vars, 'space.2');
  bindDim(node, 'paddingRight', vars, 'space.2');
  applyFill(node, vars, bgId);
  if (!inverse) applyStroke(node, vars, 'color.border.default', 'border.width.1', 1);
  bindRadius(node, vars, 'radius.sm');

  const nub = box(8, 8);
  applyFill(nub, vars, bgId);
  const place = combo.placement || 'top';
  let nubX: number;
  let nubY: number;
  if (place === 'top') {
    nubX = 44;
    nubY = 24;
  } else if (place === 'bottom') {
    nubX = 44;
    nubY = -4;
  } else if (place === 'left') {
    nubX = 92;
    nubY = 10;
  } else {
    nubX = -4;
    nubY = 10;
  }
  absChild(node, nub, nubX, nubY);

  const label = labelText(fonts.regular, 'Tooltip', vars, fgId, 'font.size.xs', 12);
  node.appendChild(label);

  return { node, label, swaps: {}, bools: {} };
};

/** Image — placeholder surface with radius per axis, ratio per axis, and a simple image glyph. */
const image: Recipe = ({ node, combo, vars, icons }) => {
  const radiusId =
    combo.radius === 'none'
      ? 'radius.none'
      : combo.radius === 'sm'
        ? 'radius.sm'
        : combo.radius === 'lg'
          ? 'radius.lg'
          : combo.radius === 'full'
            ? 'radius.pill'
            : 'radius.md';
  const dims: Record<string, [number, number]> = {
    square: [160, 160],
    '4:3': [200, 150],
    '16:9': [200, 112],
    '3:2': [200, 133],
    auto: [200, 120],
  };
  const [w, h] = dims[combo.ratio || 'auto'] || dims.auto;

  node.layoutMode = 'HORIZONTAL';
  node.primaryAxisAlignItems = 'CENTER';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(w, h);
  node.clipsContent = true;
  applyFill(node, vars, 'color.bg.subtle');
  bindRadius(node, vars, radiusId);

  // Placeholder / broken-image affordance — the real `image` icon (mountain + sun) centered on the
  // surface, matching Image.tsx's skeleton/error fallback instead of an ad-hoc plate+sun.
  const glyphPx = Math.max(24, Math.round(Math.min(w, h) * 0.32));
  node.appendChild(iconGlyph(icons, 'image', glyphPx, vars, 'color.fg.subtle'));

  return { node, label: null, swaps: {}, bools: {} };
};

/** Icon — the real glyph for `combo.name`, size-scaled on the 24 grid; stroke vs filled per `mode`. */
const icon: Recipe = ({ node, combo, vars, icons }) => {
  const s = px5({ xs: 14, sm: 16, md: 20, lg: 24, xl: 32 }, combo.size, 20);
  const markup = icons[combo.name];
  // Brand logos are fill-based marks (not stroke glyphs): force filled regardless of mode, and
  // keep multicolor logos' own colors (logo-google carries explicit hex fills); mono logos get
  // filled with the token icon color so they stay visible + themeable.
  const isLogo = combo.name.startsWith('logo-');
  const preserve = /fill="#/i.test(markup);
  const filled = isLogo ? true : combo.mode === 'filled';

  node.resize(s, s);
  node.fills = [];

  if (markup) {
    const glyph = renderIcon(markup, s, {
      vars,
      filled,
      colorId: 'color.fg.default',
      strokeWidth: 2,
      preserveColors: isLogo && preserve,
    });
    node.appendChild(glyph);
    glyph.x = 0;
    glyph.y = 0;
  } else {
    // Defensive fallback (all 130 names ship markup): a token-colored ring, never an empty box.
    const g = Math.round(s * 0.72);
    const mark = circle(g);
    if (filled) {
      applyFill(mark, vars, 'color.fg.default');
      mark.strokes = [];
    } else {
      mark.fills = [];
      applyStroke(mark, vars, 'color.fg.default', undefined, 2);
    }
    mark.x = (s - g) / 2;
    mark.y = (s - g) / 2;
    node.appendChild(mark);
  }

  return { node, label: null, swaps: {}, bools: {} };
};

/** SocialLoginButton — branded row per provider (official brand colors, literal) + mark + label. */
const PROVIDER: Record<string, { bg: string; fg: string; border?: string; bgToken?: string }> = {
  kakao: { bg: '#fee500', fg: '#191919' },
  naver: { bg: '#03c75a', fg: '#ffffff' },
  apple: { bg: '#000000', fg: '#ffffff' },
  google: { bg: '#ffffff', fg: '#1f1f1f', border: '#747775' },
  facebook: { bg: '#1877f2', fg: '#ffffff' },
  email: { bg: '', fg: '#ffffff', bgToken: 'color.neutral.500' },
};
const PROVIDER_LABEL: Record<string, string> = {
  kakao: '카카오톡으로 계속하기',
  naver: '네이버로 계속하기',
  apple: 'Apple로 계속하기',
  google: 'Google로 계속하기',
  facebook: 'Facebook으로 계속하기',
  email: '이메일로 계속하기',
};

const socialLoginButton: Recipe = ({ node, combo, vars, fonts, icons }) => {
  const provider = combo.provider || 'kakao';
  const p = PROVIDER[provider];
  const heightId =
    combo.size === 'sm'
      ? 'size.control.sm'
      : combo.size === 'lg'
        ? 'size.control.lg'
        : 'size.control.md';
  const padX = combo.size === 'sm' ? 'space.3' : combo.size === 'lg' ? 'space.5' : 'space.4';
  const radiusId =
    combo.shape === 'pill'
      ? 'radius.pill'
      : combo.shape === 'square'
        ? 'radius.none'
        : 'radius.control';
  const fontPx = combo.size === 'lg' ? 16 : 14;
  const mark = combo.size === 'lg' ? 22 : 20;

  node.layoutMode = 'HORIZONTAL';
  node.primaryAxisAlignItems = 'CENTER';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  bindDim(node, 'height', vars, heightId);
  bindDim(node, 'itemSpacing', vars, 'space.2');
  bindDim(node, 'paddingLeft', vars, padX);
  bindDim(node, 'paddingRight', vars, padX);
  if (p.bgToken) applyFill(node, vars, p.bgToken);
  else litFill(node, p.bg);
  if (p.border) {
    node.strokes = [{ type: 'SOLID', color: hexRGB(p.border) }];
    node.strokeWeight = 1;
  }
  bindRadius(node, vars, radiusId);
  if (combo.state === 'disabled') node.opacity = 0.5;

  // Real provider mark from the bundle glyphs (email falls back to the mail icon). Google keeps its
  // 4 brand colors on the white button; every other mark is recolored to the on-brand foreground.
  const markup = provider === 'email' ? icons['mail'] : icons['logo-' + provider];
  const preserve = provider === 'google';
  // Logos are filled marks; email reuses the stroke-style `mail` glyph, so render it STROKED
  // (a filled envelope is a solid blob). Both are recolored to the on-brand foreground.
  const strokeMark = provider === 'email';
  if (markup) {
    const g = renderIcon(markup, mark, {
      vars,
      filled: !strokeMark,
      litColor: preserve ? undefined : p.fg,
      preserveColors: preserve,
    });
    node.appendChild(g);
  } else {
    // Defensive: if a glyph is somehow missing, keep the old disc badge so nothing crashes.
    const badge = circle(mark);
    litFill(badge, p.fg);
    node.appendChild(badge);
  }

  const label = labelText(
    fonts.semibold,
    PROVIDER_LABEL[provider],
    vars,
    undefined,
    undefined,
    fontPx,
  );
  litFill(label, p.fg);
  node.appendChild(label);

  return { node, label, swaps: {}, bools: {} };
};

/** Text — a typography specimen: variant→size/weight, tone→color, align→alignment. */
const TEXT_SPEC: Record<string, { size: number; font: keyof DocFonts }> = {
  display: { size: 48, font: 'bold' },
  h1: { size: 36, font: 'bold' },
  h2: { size: 30, font: 'semibold' },
  h3: { size: 24, font: 'semibold' },
  h4: { size: 20, font: 'semibold' },
  bodyLg: { size: 18, font: 'regular' },
  body: { size: 16, font: 'regular' },
  bodySm: { size: 14, font: 'regular' },
  label: { size: 14, font: 'medium' },
  caption: { size: 12, font: 'regular' },
  code: { size: 14, font: 'regular' },
};
const TEXT_TONE: Record<string, string> = {
  default: 'color.fg.default',
  muted: 'color.fg.muted',
  subtle: 'color.fg.subtle',
  brand: 'color.brand.subtleFg',
  success: 'color.success.subtleFg',
  warning: 'color.warning.subtleFg',
  danger: 'color.danger.subtleFg',
  inverse: 'color.fg.inverse',
};

const text: Recipe = ({ node, combo, vars, fonts }) => {
  const spec = TEXT_SPEC[combo.variant || 'body'] || TEXT_SPEC.body;
  const colorId = TEXT_TONE[combo.tone || 'default'] || TEXT_TONE.default;
  const align = combo.align || 'start';

  node.layoutMode = 'HORIZONTAL';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.primaryAxisAlignItems = align === 'center' ? 'CENTER' : align === 'end' ? 'MAX' : 'MIN';
  node.counterAxisAlignItems = 'CENTER';
  node.fills = [];

  const label = labelText(
    fonts[spec.font],
    'The quick brown fox',
    vars,
    colorId,
    undefined,
    spec.size,
  );
  (label as TextNode & { textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' }).textAlignHorizontal =
    align === 'center' ? 'CENTER' : align === 'end' ? 'RIGHT' : 'LEFT';
  node.appendChild(label);

  return { node, label, swaps: {}, bools: {} };
};

/** Label — form label text; required → red ✱, optional → muted (optional); disabled dims. */
const label: Recipe = ({ node, combo, vars, fonts }) => {
  const sizeId =
    combo.size === 'sm' ? 'font.size.xs' : combo.size === 'lg' ? 'font.size.md' : 'font.size.sm';
  const sizePx = px(12, 14, 16, combo.size);
  const disabled = combo.state === 'disabled';
  const textId = disabled ? 'color.fg.disabled' : 'color.fg.default';

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.1');
  if (disabled) node.opacity = 0.6;

  const text = labelText(fonts.medium, 'Email address', vars, textId, sizeId, sizePx);
  node.appendChild(text);

  const required = glyph(fonts.medium, '*', vars, 'color.danger.solid', sizePx);
  required.visible = false;
  node.appendChild(required);

  const optional = labelText(fonts.regular, '(optional)', vars, 'color.fg.muted', sizeId, sizePx);
  optional.visible = false;
  node.appendChild(optional);

  return { node, label: text, swaps: {}, bools: { required, optional } };
};

// ---------------------------------------------------------------------------
// Chart helpers (mirror src/utils/chart.ts + src/styles/charts.css).
// The categorical series palette (--chart-1…6) is LITERAL hex in the source CSS
// (not a token), so series color is painted with literal fills — exactly like the
// SocialLoginButton brand colors. The structural chart vars ARE tokens:
//   --chart-grid = color.border.subtle · --chart-axis = color.border.default
//   --chart-label = color.fg.muted · --chart-surface = color.bg.surface
// so gridlines / axes / labels / the plot surface are bound to Variables.
// ---------------------------------------------------------------------------

/** The six categorical series hues (light palette), in fixed order — literal, not tokens. */
const CHART_HEX = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948'];
const seriesHex = (i: number): string => CHART_HEX[((i % 6) + 6) % 6];

const CHART_GRID = 'color.border.subtle';
const CHART_AXIS = 'color.border.default';
const CHART_LABEL = 'color.fg.muted';
const CHART_SURFACE = 'color.bg.surface';

/** `M`+`L` polyline through points (mirror of chart.ts linePath). */
function poly(pts: { x: number; y: number }[]): string {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
}

/** Figma's `vectorPaths` parser rejects comma-separated coordinates — it wants whitespace, so
 *  `M4.5,6.4 L8,9.9` fails with "Failed to convert path. Invalid command at ,6.4". Normalize every
 *  `x,y` pair to `x y` at the one chokepoint where paths become Vectors. This is what un-skips the
 *  chevron molecules (Select/Combobox/Dropdown/ListItem/Accordion/FileUpload) and the comma-pathed
 *  charts (Line/Radar/Sparkline/Scatter-trend). */
const figPath = (d: string): string => d.replace(/,/g, ' ');

/** A stroked vector whose color is bound to a token Variable (grid rings / spokes). */
function strokePathVar(
  data: string,
  vars: VariableRegistry,
  colorId: string,
  weight: number,
): VectorNode {
  const v = figma.createVector();
  v.vectorPaths = [{ windingRule: 'NONE', data: figPath(data) }];
  const ref = vars.get(colorId);
  v.strokes = ref ? [boundFill(SEED, ref)] : [{ type: 'SOLID', color: SEED, opacity: 1 }];
  v.strokeWeight = weight;
  v.fills = [];
  return v;
}

// ---- Theme-aware series colors --------------------------------------------------------------
// charts.css defines --chart-1…6 with DISTINCT light + dark values, so series identity must bind
// to the `chart.N` Theme Variables (added in tokens/semantic.ts) to recolor in dark mode — unlike
// the truly-fixed SocialLogin brand hues. Fall back to the light literal if a Variable is missing.

/** 0-based series index → `chart.N` token id (1-based, wrapping the 6-hue palette). */
const seriesId = (i: number): string => `chart.${((((i % 6) + 6) % 6) + 1)}`;

/** Stroked vector whose color is BOUND to the series Variable (lines / trend / outlines). */
function strokePathSeries(
  data: string,
  vars: VariableRegistry,
  i: number,
  weight: number,
): VectorNode {
  const v = figma.createVector();
  v.vectorPaths = [{ windingRule: 'NONE', data: figPath(data) }];
  const ref = vars.get(seriesId(i));
  v.strokes = ref ? [boundFill(SEED, ref)] : [{ type: 'SOLID', color: hexRGB(seriesHex(i)), opacity: 1 }];
  v.strokeWeight = weight;
  v.fills = [];
  v.strokeCap = 'ROUND';
  v.strokeJoin = 'ROUND';
  return v;
}

/** Filled vector whose color is BOUND to the series Variable (area / radar / donut wedges). */
function fillPathSeries(data: string, vars: VariableRegistry, i: number, opacity = 1): VectorNode {
  const v = figma.createVector();
  v.vectorPaths = [{ windingRule: 'NONZERO', data: figPath(data) }];
  const ref = vars.get(seriesId(i));
  const paint: SolidPaint = ref
    ? boundFill(SEED, ref)
    : { type: 'SOLID', color: hexRGB(seriesHex(i)), opacity: 1 };
  v.fills = [opacity === 1 ? paint : { ...paint, opacity }];
  v.strokes = [];
  return v;
}

/** Fixed rect whose fill is BOUND to the series Variable (bars / legend swatches). */
function litBoxSeries(w: number, h: number, vars: VariableRegistry, i: number): FrameNode {
  const f = box(w, h);
  applyFill(f, vars, seriesId(i));
  return f;
}

/** Data dot: series fill + a chart-surface halo ring (separates the dot from the line/area). */
function chartDotSeries(d: number, vars: VariableRegistry, i: number): EllipseNode {
  const e = circle(d);
  applyFill(e, vars, seriesId(i));
  applyStroke(e, vars, CHART_SURFACE, undefined, 1.5);
  return e;
}

/** Plain plot surface for a chart node: fixed size + bound surface fill, no auto layout. */
function chartCanvas(node: ComponentNode, vars: VariableRegistry, w: number, h: number): void {
  node.resize(w, h);
  applyFill(node, vars, CHART_SURFACE);
  node.strokes = [];
}

// ---------------------------------------------------------------------------
// Recipes (charts + IconButton). Mirror src/components/**/<Name>.{tsx,css}.
// ---------------------------------------------------------------------------

/** IconButton — square icon-only action; fill/stroke/radius/size per variant·tone·shape·size. */
const iconButton: Recipe = ({ node, combo, ch, vars, placeholder, fonts }) => {
  const tone = combo.tone || 'neutral';
  const variant = combo.variant || 'ghost';
  const iconPx = px(16, 18, 20, combo.size);
  const sizePx = px(32, 40, 48, combo.size);
  const loading = combo.state === 'loading';

  let fillId = 'transparent';
  let strokeId: string | undefined;
  if (variant === 'solid') fillId = `color.${tone}.solid`;
  else if (variant === 'soft') fillId = `color.${tone}.subtle`;
  else if (variant === 'outline') strokeId = `color.${tone}.border`;

  node.layoutMode = 'HORIZONTAL';
  node.primaryAxisAlignItems = 'CENTER';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.itemSpacing = 0;
  node.paddingLeft = 0;
  node.paddingRight = 0;
  node.paddingTop = 0;
  node.paddingBottom = 0;
  node.resize(sizePx, sizePx);
  bindDim(node, 'width', vars, ch.height);
  bindDim(node, 'height', vars, ch.height);
  applyFill(node, vars, fillId);
  if (strokeId) applyStroke(node, vars, strokeId, 'border.width.1', 1);
  bindRadius(node, vars, ch.radius);
  if (combo.state === 'disabled') node.opacity = 0.5;

  const icon = iconSlot(placeholder, 'Icon', iconPx);
  icon.visible = !loading;
  node.appendChild(icon);

  // Loading spinner arc (state=loading and the BOOLEAN `loading`).
  const spin = circle(iconPx);
  spin.fills = [];
  applyStroke(spin, vars, toneAccent(tone), undefined, 2);
  (spin as EllipseNode & { arcData: ArcData }).arcData = {
    startingAngle: -Math.PI / 2,
    endingAngle: Math.PI,
    innerRadius: 0,
  };
  absChild(node, spin, (sizePx - iconPx) / 2, (sizePx - iconPx) / 2);
  spin.visible = loading;

  // Pressed / toggled overlay (BOOLEAN `pressed`) — the tone-subtle selected fill.
  const pressed = box(sizePx, sizePx);
  applyFill(pressed, vars, `color.${tone}.subtle`);
  bindRadius(pressed, vars, ch.radius);
  absChild(node, pressed, 0, 0);
  pressed.visible = false;

  // Notification indicator dot (BOOLEAN `indicator`).
  const indicator = circle(8);
  applyFill(indicator, vars, 'color.danger.solid');
  applyStroke(indicator, vars, 'color.bg.surface', undefined, 1.5);
  absChild(node, indicator, sizePx - 10, 2);
  indicator.visible = false;

  // Disabled dim overlay (BOOLEAN `disabled`).
  const disabled = box(sizePx, sizePx);
  applyFill(disabled, vars, 'color.bg.surface');
  bindRadius(disabled, vars, ch.radius);
  disabled.opacity = 0.5;
  absChild(node, disabled, 0, 0);
  disabled.visible = false;

  // Accessible label (aria-label) — a text layer, not visible in an icon-only button.
  const label = labelText(fonts.medium, 'Action', vars, 'color.fg.default', undefined, 12);
  absChild(node, label, 0, 0);
  label.visible = false;

  return { node, label, swaps: { icon }, bools: { loading: spin, pressed, indicator, disabled } };
};

/** Sparkline — tiny axis-less trend: A a polyline (+ end dot) · B mini bars; color per `color`. */
const sparkline: Recipe = ({ node, combo, vars, fonts }) => {
  const W = 96;
  const H = 28;
  const pad = 3;
  const si = Number(combo.color || '1') - 1;
  const data = combo.type === 'B' ? [5, 8, 4, 9, 6, 7] : [4, 6, 5, 8, 6, 10, 7];
  const n = data.length;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const xAt = (i: number) => pad + (n <= 1 ? 0 : (i / (n - 1)) * (W - pad * 2));
  const yAt = (v: number) => H - pad - ((v - min) / span) * (H - pad * 2);

  node.resize(W, H);
  node.fills = [];

  let endDot: SceneNode;
  if (combo.type === 'B') {
    const bw = Math.max(2, (W - pad * 2) / n - 2);
    for (let i = 0; i < n; i++) {
      const y = yAt(data[i]);
      const bar = litBoxSeries(bw, Math.max(1, H - pad - y), vars, si);
      bar.x = xAt(i) - bw / 2;
      bar.y = y;
      node.appendChild(bar);
    }
    const d = chartDotSeries(5, vars, si);
    d.x = 0;
    d.y = 0;
    d.visible = false; // no end dot on bars
    node.appendChild(d);
    endDot = d;
  } else {
    const pts = data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
    node.appendChild(strokePathSeries(poly(pts), vars, si, 1.75));
    const last = pts[n - 1];
    const d = chartDotSeries(5, vars, si);
    d.x = last.x - 2.5;
    d.y = last.y - 2.5;
    node.appendChild(d);
    endDot = d;
  }

  const label = labelText(fonts.regular, 'Trend', vars, CHART_LABEL, undefined, 10);
  label.x = 0;
  label.y = 0;
  label.visible = false;
  node.appendChild(label);

  return { node, label, swaps: {}, bools: { endDot } };
};

/** BarChart — token baseline + literal-colored bars; A vertical columns · B horizontal bars. */
const barChart: Recipe = ({ node, combo, vars, fonts }) => {
  const vertical = combo.type !== 'B';
  const seriesIdx = Number(combo.color || '1') - 1;
  const data = [6, 10, 7, 12, 9];
  const cats = ['A', 'B', 'C', 'D', 'E'];
  const max = 12;
  const n = data.length;
  const W = 200;
  const H = 130;
  chartCanvas(node, vars, W, H);

  const vals = box(W, H);
  vals.fills = [];
  vals.x = 0;
  vals.y = 0;

  if (vertical) {
    const pad = 10;
    const top = 16;
    const bottom = H - 20;
    const plotH = bottom - top;
    // Horizontal gridlines at the tick fractions (mirror BarChart.tsx ticks(max)).
    for (let g = 0; g <= 4; g++) {
      const y = bottom - (g / 4) * plotH;
      const gl = hairline(vars, CHART_GRID, W - pad * 2, 1, false);
      gl.x = pad;
      gl.y = y;
      node.appendChild(gl);
    }
    const axis = hairline(vars, CHART_AXIS, W - pad * 2, 1, false);
    axis.x = pad;
    axis.y = bottom;
    node.appendChild(axis);
    const slot = (W - pad * 2) / n;
    const bw = slot * 0.6;
    for (let i = 0; i < n; i++) {
      const h = (data[i] / max) * plotH;
      const x = pad + i * slot + (slot - bw) / 2;
      const y = bottom - h;
      const bar = litBoxSeries(bw, h, vars, seriesIdx);
      bindRadius(bar, vars, 'radius.sm');
      bar.x = x;
      bar.y = y;
      node.appendChild(bar);
      const t = labelText(fonts.semibold, String(data[i]), vars, 'color.fg.default', 'font.size.xs', 10);
      t.x = x;
      t.y = y - 13;
      vals.appendChild(t);
      // Category-axis label under each column (.tds-barchart__cat).
      const c = labelText(fonts.regular, cats[i], vars, CHART_LABEL, 'font.size.xs', 10);
      c.x = x + bw / 2 - 3;
      c.y = bottom + 4;
      node.appendChild(c);
    }
  } else {
    const left = 40;
    const top = 8;
    const right = W - 16;
    const plotW = right - left;
    const axis = hairline(vars, CHART_AXIS, 1, H - 16, false);
    axis.x = left;
    axis.y = top;
    node.appendChild(axis);
    const slot = (H - 16) / n;
    const bh = slot * 0.6;
    for (let i = 0; i < n; i++) {
      const w = (data[i] / max) * plotW;
      const y = top + i * slot + (slot - bh) / 2;
      const bar = litBoxSeries(w, bh, vars, seriesIdx);
      bindRadius(bar, vars, 'radius.sm');
      bar.x = left;
      bar.y = y;
      node.appendChild(bar);
      const t = labelText(fonts.semibold, String(data[i]), vars, 'color.fg.default', 'font.size.xs', 10);
      t.x = left + w + 4;
      t.y = y + bh / 2 - 6;
      vals.appendChild(t);
      // Category-axis label beside each bar, in the left margin (.tds-barchart__cat).
      const c = labelText(fonts.regular, cats[i], vars, CHART_LABEL, 'font.size.xs', 10);
      c.x = left - 12;
      c.y = y + bh / 2 - 6;
      node.appendChild(c);
    }
  }
  node.appendChild(vals);

  const label = labelText(fonts.regular, '200', vars, CHART_LABEL, undefined, 10);
  label.x = 0;
  label.y = 0;
  label.visible = false;
  node.appendChild(label);

  return { node, label, swaps: {}, bools: { showValues: vals } };
};

/** LineChart — faint gridlines + a literal-colored polyline (A) or filled area (B). */
const lineChart: Recipe = ({ node, combo, vars, fonts }) => {
  const area = combo.type === 'B';
  const W = 200;
  const H = 130;
  chartCanvas(node, vars, W, H);
  const left = 8;
  const right = W - 30;
  const top = 12;
  const bottom = H - 22;
  const plotH = bottom - top;
  const data = [5, 8, 6, 11, 9, 13];
  const cats = ['1월', '2월', '3월', '4월', '5월', '6월'];
  const max = 14;
  const n = data.length;
  const xAt = (i: number) => left + (i / (n - 1)) * (right - left);
  const yAt = (v: number) => top + plotH - (v / max) * plotH;

  for (let g = 0; g <= 4; g++) {
    const y = top + (g / 4) * plotH;
    const gl = hairline(vars, CHART_GRID, right - left, 1, false);
    gl.x = left;
    gl.y = y;
    node.appendChild(gl);
  }

  const pts = data.map((v, i) => ({ x: xAt(i), y: yAt(v) }));
  if (area) {
    const d = `${poly(pts)} L${right.toFixed(2)},${bottom} L${left.toFixed(2)},${bottom} Z`;
    node.appendChild(fillPathSeries(d, vars, 0, 0.14));
  }
  node.appendChild(strokePathSeries(poly(pts), vars, 0, 2));

  const dots = box(W, H);
  dots.fills = [];
  dots.x = 0;
  dots.y = 0;
  for (const p of pts) {
    const d = chartDotSeries(6, vars, 0);
    d.x = p.x - 3;
    d.y = p.y - 3;
    dots.appendChild(d);
  }
  dots.visible = false;
  node.appendChild(dots);

  const cw = 26;
  for (let i = 0; i < n; i++) {
    const cat = labelText(fonts.regular, cats[i], vars, CHART_LABEL, 'font.size.xs', 10);
    (cat as TextNode & { textAutoResize: 'NONE' | 'HEIGHT' | 'WIDTH_AND_HEIGHT' }).textAutoResize =
      'HEIGHT';
    cat.resize(cw, cat.height);
    (cat as TextNode & { textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' }).textAlignHorizontal =
      'CENTER';
    cat.x = xAt(i) - cw / 2;
    cat.y = H - 12;
    node.appendChild(cat);
  }

  const label = labelText(fonts.semibold, String(data[n - 1]), vars, 'color.fg.default', 'font.size.xs', 11);
  label.x = right + 4;
  label.y = yAt(data[n - 1]) - 6;
  node.appendChild(label);

  return { node, label, swaps: {}, bools: { showDots: dots } };
};

/** DonutChart — arcData wedges (A donut hole · B pie) + a swatch legend; literal series colors. */
const donutChart: Recipe = ({ node, combo, vars, fonts }) => {
  const donut = combo.type === 'A';
  const R = 66;
  const rInner = donut ? 40 : 0;
  const centerX = 85;
  const topY = 8;
  chartCanvas(node, vars, 170, 210); // tall enough for the legend under the ring

  const sweeps = [0.34, 0.28, 0.22, 0.16];
  let a = -Math.PI / 2;
  sweeps.forEach((f, i) => {
    const e = a + f * 2 * Math.PI;
    const seg = circle(2 * R);
    applyFill(seg, vars, seriesId(i));
    applyStroke(seg, vars, CHART_SURFACE, undefined, 2);
    (seg as EllipseNode & { arcData: ArcData }).arcData = {
      startingAngle: a,
      endingAngle: e,
      innerRadius: donut ? rInner / R : 0,
    };
    seg.x = centerX - R;
    seg.y = topY;
    node.appendChild(seg);
    a = e;
  });

  const label = labelText(fonts.bold, '260', vars, 'color.fg.default', undefined, 22);
  label.x = centerX - 18;
  label.y = topY + R - 12;
  label.visible = donut;
  node.appendChild(label);

  const legend = box(150, 44);
  legend.layoutMode = 'VERTICAL';
  legend.itemSpacing = 3;
  legend.primaryAxisSizingMode = 'AUTO';
  legend.counterAxisSizingMode = 'AUTO';
  legend.fills = [];
  legend.x = 12;
  legend.y = topY + 2 * R + 8;
  for (let i = 0; i < 4; i++) {
    const row = box(90, 12);
    row.layoutMode = 'HORIZONTAL';
    row.itemSpacing = 5;
    row.counterAxisAlignItems = 'CENTER';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.fills = [];
    const sw = litBoxSeries(8, 8, vars, i);
    bindRadius(sw, vars, 'radius.sm');
    place(row, sw);
    row.appendChild(
      labelText(fonts.regular, `Item ${i + 1}`, vars, CHART_LABEL, 'font.size.xs', 10),
    );
    legend.appendChild(row);
  }
  node.appendChild(legend);

  return { node, label, swaps: {}, bools: { showLegend: legend } };
};

/** RadarChart — token concentric-polygon grid + spokes; literal filled (A) or outline (B) shape. */
const radarChart: Recipe = ({ node, combo, vars, fonts }) => {
  const S = 170;
  const C = S / 2;
  const R = C - 26;
  const n = 5;
  chartCanvas(node, vars, S, S);
  const pt = (i: number, r: number) => {
    const ang = (i / n) * 2 * Math.PI - Math.PI / 2;
    return { x: C + r * Math.cos(ang), y: C + r * Math.sin(ang) };
  };

  const RINGS = 4;
  for (let ring = 1; ring <= RINGS; ring++) {
    const lvl = ring / RINGS;
    const pts = Array.from({ length: n }, (_, i) => pt(i, R * lvl));
    node.appendChild(strokePathVar(`${poly(pts)} Z`, vars, CHART_GRID, 1));
  }
  for (let i = 0; i < n; i++) {
    const p = pt(i, R);
    node.appendChild(
      strokePathVar(`M${C},${C} L${p.x.toFixed(2)},${p.y.toFixed(2)}`, vars, CHART_GRID, 1),
    );
  }

  const vals = [0.8, 0.55, 0.9, 0.5, 0.7];
  const spts = vals.map((f, i) => pt(i, R * f));
  const path = `${poly(spts)} Z`;
  if (combo.type === 'A') node.appendChild(fillPathSeries(path, vars, 0, 0.18));
  node.appendChild(strokePathSeries(path, vars, 0, 2));

  // Series vertex dot at every polygon vertex (r = 2.5, d = 5).
  for (const p of spts) {
    const dot = chartDotSeries(5, vars, 0);
    dot.x = p.x - 2.5;
    dot.y = p.y - 2.5;
    node.appendChild(dot);
  }

  // Vertex label for EVERY axis spoke.
  const axisLabels = ['기획', '디자인', '개발', '분석', '운영'];
  let first: TextNode | null = null;
  for (let i = 0; i < n; i++) {
    const chars = axisLabels[i] ?? `축 ${i + 1}`;
    const anchor = pt(i, R + 12);
    const t = labelText(fonts.regular, chars, vars, CHART_LABEL, 'font.size.xs', 10);
    // Roughly center the label on its spoke endpoint.
    t.x = anchor.x - chars.length * 5;
    t.y = anchor.y - 6;
    node.appendChild(t);
    if (i === 0) first = t;
  }

  return { node, label: first!, swaps: {}, bools: {} };
};

/** Gauge — token track arc + literal value arc (arcData ring); A 180° · B 270°; big value read-out. */
const gauge: Recipe = ({ node, combo, vars, fonts }) => {
  const si = Number(combo.color || '1') - 1;
  const semi = combo.type === 'A';
  const size = 160;
  const pad = size * 0.06;
  const rOuter = size / 2 - pad;
  const stroke = Math.round(size * 0.12);
  const inner = (rOuter - stroke) / rOuter;
  const H = semi ? Math.round(size * 0.66) : Math.round(size * 0.92);
  chartCanvas(node, vars, size, H + 20);
  const cx = size / 2;
  const cy = rOuter + pad;
  const D = rOuter * 2;
  const ratio = 0.62;

  const start = semi ? Math.PI : 0.75 * Math.PI;
  const sweep = semi ? Math.PI : 1.5 * Math.PI;

  const track = circle(D);
  applyFill(track, vars, CHART_GRID);
  track.strokes = [];
  (track as EllipseNode & { arcData: ArcData }).arcData = {
    startingAngle: start,
    endingAngle: start + sweep,
    innerRadius: inner,
  };
  track.x = cx - rOuter;
  track.y = cy - rOuter;
  node.appendChild(track);

  const val = circle(D);
  applyFill(val, vars, seriesId(si));
  val.strokes = [];
  (val as EllipseNode & { arcData: ArcData }).arcData = {
    startingAngle: start,
    endingAngle: start + sweep * ratio,
    innerRadius: inner,
  };
  val.x = cx - rOuter;
  val.y = cy - rOuter;
  node.appendChild(val);

  const label = labelText(fonts.bold, '62', vars, 'color.fg.default', undefined, 30);
  label.x = cx - 16;
  label.y = cy - 16;
  node.appendChild(label);

  const caption = labelText(fonts.regular, 'Score', vars, CHART_LABEL, 'font.size.xs', 11);
  caption.x = cx - 18;
  caption.y = cy + 12;
  node.appendChild(caption);

  return { node, label, swaps: {}, bools: {} };
};

/** ScatterChart — token L-axes + gridlines, literal-colored dots; B adds a literal trend line. */
const scatterChart: Recipe = ({ node, combo, vars, fonts }) => {
  const W = 200;
  const H = 140;
  chartCanvas(node, vars, W, H);
  const left = 26;
  const right = W - 12;
  const top = 12;
  const bottom = H - 24;
  const plotH = bottom - top;
  const maxY = 8;
  const charW = 5.2;

  // Horizontal gridlines + Y-axis tick value at each (top→maxY, bottom→0), CHART_LABEL.
  for (let g = 1; g <= 3; g++) {
    const y = top + (g / 4) * plotH;
    const gl = hairline(vars, CHART_GRID, right - left, 1, false);
    gl.x = left;
    gl.y = y;
    node.appendChild(gl);
    const val = String(Math.round(maxY * (1 - g / 4)));
    const yt = labelText(fonts.regular, val, vars, CHART_LABEL, 'font.size.xs', 9);
    yt.x = left - 6 - val.length * charW;
    yt.y = y - 5;
    node.appendChild(yt);
  }
  const yaxis = hairline(vars, CHART_AXIS, 1, bottom - top, false);
  yaxis.x = left;
  yaxis.y = top;
  node.appendChild(yaxis);
  const xaxis = hairline(vars, CHART_AXIS, right - left, 1, false);
  xaxis.x = left;
  xaxis.y = bottom;
  node.appendChild(xaxis);

  const pts: [number, number][] = [
    [0.15, 0.7],
    [0.3, 0.55],
    [0.42, 0.62],
    [0.55, 0.4],
    [0.66, 0.35],
    [0.8, 0.26],
    [0.9, 0.32],
  ];
  for (const [fx, fy] of pts) {
    const cx = left + fx * (right - left);
    const cy = top + fy * plotH;
    const d = chartDotSeries(7, vars, 0);
    d.x = cx - 3.5;
    d.y = cy - 3.5;
    node.appendChild(d);
  }

  // X-axis min / mid / max tick labels (.tds-scatterchart__tick), start/middle/end aligned.
  const xVals = ['0', '5', '10'];
  const xAnchors = [left, (left + right) / 2, right];
  xVals.forEach((v, i) => {
    const xt = labelText(fonts.regular, v, vars, CHART_LABEL, 'font.size.xs', 9);
    const w = v.length * charW;
    xt.x = i === 0 ? xAnchors[i] : i === xVals.length - 1 ? xAnchors[i] - w : xAnchors[i] - w / 2;
    xt.y = bottom + 5;
    node.appendChild(xt);
  });

  if (combo.type === 'B') {
    // Linear trend line: series color, dashed (5 4) at 0.6 opacity per ScatterChart.css.
    const y1 = top + 0.7 * plotH;
    const y2 = top + 0.28 * plotH;
    const trend = strokePathSeries(
      `M${left},${y1.toFixed(1)} L${right},${y2.toFixed(1)}`,
      vars,
      0,
      2,
    );
    trend.strokes = trend.strokes.map((s) => ({ ...s, opacity: 0.6 }));
    (trend as VectorNode & { dashPattern: number[] }).dashPattern = [5, 4];
    node.appendChild(trend);
  }

  const label = labelText(fonts.regular, 'x', vars, CHART_LABEL, 'font.size.xs', 9);
  label.x = 4;
  label.y = top - 2;
  label.visible = false;
  node.appendChild(label);

  return { node, label, swaps: {}, bools: {} };
};

/** Heatmap — a 5×4 single-hue ramp grid over chart-1; B shows value labels in cells. */
const heatmap: Recipe = ({ node, combo, vars, fonts }) => {
  const cols = 5;
  const rows = 4;
  const cell = 28;
  const gap = 3;
  const labelW = 20;
  const labelH = 16;
  const showValues = combo.type === 'B';
  const W = labelW + cols * (cell + gap);
  const H = labelH + rows * (cell + gap);

  // Sequential legend under the grid (min → max stepped swatch + edge labels).
  const legendSteps = 6;
  const legendGap = 8;
  const minLabelW = 18;
  const maxLabelW = 18;
  const legendH = 8;
  const legendY = H + 12;
  const legendBarY = legendY + 2;
  const legendBottom = legendY + Math.max(legendH, 12);

  chartCanvas(node, vars, W + 6, legendBottom + 6);

  for (let c = 0; c < cols; c++) {
    const t = labelText(
      fonts.regular,
      String.fromCharCode(65 + c),
      vars,
      CHART_LABEL,
      'font.size.xs',
      9,
    );
    t.x = labelW + c * (cell + gap) + cell / 2 - 4;
    t.y = 2;
    node.appendChild(t);
  }

  const vals = [
    [0.2, 0.5, 0.7, 0.4, 0.9],
    [0.6, 0.3, 0.85, 0.5, 0.2],
    [0.1, 0.7, 0.4, 0.95, 0.6],
    [0.5, 0.2, 0.6, 0.35, 0.8],
  ];
  for (let r = 0; r < rows; r++) {
    const rt = labelText(fonts.regular, String(r + 1), vars, CHART_LABEL, 'font.size.xs', 9);
    rt.x = 2;
    rt.y = labelH + r * (cell + gap) + cell / 2 - 6;
    node.appendChild(rt);
    for (let c = 0; c < cols; c++) {
      const t = vals[r][c];
      const cx = labelW + c * (cell + gap);
      const cy = labelH + r * (cell + gap);

      // Theme-aware cell: CHART_SURFACE base + chart.1-BOUND overlay at opacity t
      // (t=0 → surface, t=1 → chart.1) — mirrors color-mix(chart-1 X%, chart-surface).
      const cellBase = box(cell, cell);
      applyFill(cellBase, vars, CHART_SURFACE);
      bindRadius(cellBase, vars, 'radius.sm');
      cellBase.x = cx;
      cellBase.y = cy;
      node.appendChild(cellBase);

      const cellFill = box(cell, cell);
      applyFill(cellFill, vars, seriesId(0));
      bindRadius(cellFill, vars, 'radius.sm');
      cellFill.opacity = 0.08 + t * 0.92; // RAMP_FLOOR 8% (Heatmap.tsx rampColor)
      cellFill.x = cx;
      cellFill.y = cy;
      node.appendChild(cellFill);

      if (showValues) {
        const vt = labelText(
          fonts.medium,
          String(Math.round(t * 100)),
          vars,
          t > 0.55 ? 'color.bg.surface' : 'color.fg.default',
          'font.size.xs',
          9,
        );
        vt.x = cx + cell / 2 - 7;
        vt.y = cy + cell / 2 - 6;
        node.appendChild(vt);
      }
    }
  }

  // Legend: min label · stepped low→high swatch · max label (matches .tds-heatmap__legend).
  const flat = vals.reduce((a: number[], r) => a.concat(r), []);
  const vmin = Math.min(...flat);
  const vmax = Math.max(...flat);

  const minLabel = labelText(
    fonts.regular,
    String(Math.round(vmin * 100)),
    vars,
    CHART_LABEL,
    'font.size.xs',
    9,
  );
  minLabel.x = 0;
  minLabel.y = legendY;
  node.appendChild(minLabel);

  const barX = minLabelW + legendGap;
  const barMaxX = W - maxLabelW - legendGap;
  const stepW = (barMaxX - barX) / legendSteps;
  for (let i = 0; i < legendSteps; i++) {
    const t = i / (legendSteps - 1);
    const stepBase = box(stepW, legendH);
    applyFill(stepBase, vars, CHART_SURFACE);
    stepBase.x = barX + i * stepW;
    stepBase.y = legendBarY;
    node.appendChild(stepBase);

    const stepFill = box(stepW, legendH);
    applyFill(stepFill, vars, seriesId(0));
    stepFill.opacity = 0.08 + t * 0.92;
    stepFill.x = barX + i * stepW;
    stepFill.y = legendBarY;
    node.appendChild(stepFill);
  }

  const maxLabel = labelText(
    fonts.regular,
    String(Math.round(vmax * 100)),
    vars,
    CHART_LABEL,
    'font.size.xs',
    9,
  );
  maxLabel.x = W - maxLabelW;
  maxLabel.y = legendY;
  node.appendChild(maxLabel);

  const label = labelText(fonts.regular, 'Heatmap', vars, CHART_LABEL, 'font.size.xs', 9);
  label.x = 0;
  label.y = 0;
  label.visible = false;
  node.appendChild(label);

  return { node, label, swaps: {}, bools: {} };
};

/** TextField — a Label + the shared Input field; Type A stacked · B floating · C inline (label left). */
const textField: Recipe = ({ node, combo, ch, vars, placeholder, fonts, icons }) => {
  const type = combo.type;
  const sizeId = fieldFontId(combo.size);
  const inline = type === 'C';
  const floating = type === 'B';
  // Fixed root width per layout so every size variant lines up and the field is wide enough that
  // "you@example.com" and the helper line fit on one row (Type C reserves a left label column).
  const W = inline ? 320 : 280;
  const labelColW = 140;
  const iconPx = px(16, 18, 20, combo.size);

  node.layoutMode = inline ? 'HORIZONTAL' : 'VERTICAL';
  node.primaryAxisAlignItems = 'MIN';
  node.counterAxisAlignItems = 'MIN';
  if (inline) {
    node.primaryAxisSizingMode = 'FIXED'; // fixed width
    node.counterAxisSizingMode = 'AUTO'; // hug height
  } else {
    node.primaryAxisSizingMode = 'AUTO'; // hug height
    node.counterAxisSizingMode = 'FIXED'; // fixed width
  }
  node.resize(W, node.height);
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, inline ? 'space.4' : 'space.1.5');
  if (combo.state === 'disabled') node.opacity = 0.6;

  // Label row (label + required ✱ + optional hint). Type B floats it smaller/muted.
  const labelRow = box(inline ? labelColW : W, 20);
  labelRow.layoutMode = 'HORIZONTAL';
  labelRow.counterAxisAlignItems = 'CENTER';
  labelRow.primaryAxisSizingMode = inline ? 'FIXED' : 'AUTO';
  labelRow.counterAxisSizingMode = 'AUTO';
  labelRow.primaryAxisAlignItems = inline ? 'MAX' : 'MIN'; // Type C right-aligns the inline label
  labelRow.fills = [];
  if (inline) {
    labelRow.resize(labelColW, 20);
    bindDim(labelRow, 'paddingTop', vars, 'space.2');
  }
  bindDim(labelRow, 'itemSpacing', vars, 'space.1');
  const labelColor = floating ? 'color.fg.muted' : ch.text || 'color.fg.default';
  const label = labelText(
    fonts.medium,
    'Email address',
    vars,
    labelColor,
    floating ? 'font.size.xs' : sizeId,
    14,
  );
  labelRow.appendChild(label);
  const required = glyph(fonts.medium, '*', vars, 'color.danger.solid', 14);
  required.visible = false;
  labelRow.appendChild(required);
  const optional = labelText(
    fonts.regular,
    '(optional)',
    vars,
    'color.fg.muted',
    'font.size.xs',
    12,
  );
  optional.visible = false;
  labelRow.appendChild(optional);
  // Type A stacks the label above the control; Type C sits it to the left; Type B floats it.
  if (inline) place(node, labelRow);
  else if (!floating) node.appendChild(labelRow);

  // Control column: the field row over the helper text — the vertical stack the label sits
  // above (Type A) / to the left of (Type C). Mirrors TextField.css `.tds-text-field__control`.
  const control = box(inline ? 160 : W, 40);
  control.name = 'Control';
  control.layoutMode = 'VERTICAL';
  control.primaryAxisSizingMode = 'AUTO'; // hug height
  control.counterAxisSizingMode = 'FIXED'; // width filled below
  control.counterAxisAlignItems = 'MIN';
  control.fills = [];
  bindDim(control, 'itemSpacing', vars, 'space.1');

  // The field row itself.
  const field = fieldRow(combo, vars, inline ? 160 : W);
  const swaps: Record<string, InstanceNode> = {};
  const start = iconSlot(placeholder, 'Icon Start', iconPx);
  start.visible = false; // default TextField has no leading icon (kept swappable)
  field.appendChild(start);
  swaps.iconStart = start;
  const ph = placeholderText(fonts.regular, 'you@example.com', vars, combo);
  field.appendChild(ph);
  fillGrow(ph);
  noWrap(ph); // single line — never wraps; fits fully at this width
  const clearable = iconGlyph(icons, 'close', 12, vars, 'color.fg.muted');
  clearable.visible = false;
  field.appendChild(clearable);
  const revealable = circle(iconPx);
  revealable.fills = [];
  applyStroke(revealable, vars, 'color.fg.muted', undefined, 1.5);
  revealable.visible = false;
  place(field, revealable);
  const loading = spinnerArc(vars, iconPx, 'color.fg.muted');
  loading.visible = false;
  place(field, loading);
  const end = iconSlot(placeholder, 'Icon End', iconPx);
  end.visible = false; // default TextField has no trailing icon (kept swappable)
  field.appendChild(end);
  swaps.iconEnd = end;
  control.appendChild(field);
  fillGrow(field);

  // Helper text below the field — completes the label → field → helper stack; tinted per state.
  const hintColor =
    combo.state === 'error'
      ? 'color.danger.solid'
      : combo.state === 'success'
        ? 'color.success.solid'
        : 'color.fg.muted';
  const hint = labelText(
    fonts.regular,
    'We never share your email.',
    vars,
    hintColor,
    'font.size.xs',
    12,
  );
  noWrap(hint);
  fillGrow(hint); // take the control-column width so an over-long single line clips, not grows
  control.appendChild(hint);
  control.clipsContent = true; // clip an over-long hint at the column edge instead of overflowing

  node.appendChild(control);
  fillGrow(control); // fill remaining width (Type C) / full width (Types A·B); height hugs

  // Type B floating label: lift the label onto the field's top border with a field-bg notch
  // masking the stroke behind it (TextField.css [data-type='B'] .tds-text-field__label).
  if (floating) {
    applyFill(labelRow, vars, 'color.field.bg'); // TextField.css notch is field-bg for all variants
    bindDim(labelRow, 'paddingLeft', vars, 'space.1');
    bindDim(labelRow, 'paddingRight', vars, 'space.1');
    absChild(field, labelRow, 8, -8);
  }

  const disabled = hiddenMarker(node, vars);

  return {
    node,
    label,
    swaps,
    bools: { required, optional, clearable, revealable, loading, disabled },
  };
};

/** SearchInput — a field row with a leading magnifier + trailing clear ✕ / filter / spinner. */
const searchInput: Recipe = ({ node, combo, vars, fonts, icons }) => {
  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(240, node.height);
  bindDim(node, 'height', vars, fieldHeightId(combo.size));
  bindDim(node, 'itemSpacing', vars, 'space.2');
  bindDim(node, 'paddingLeft', vars, 'space.3');
  bindDim(node, 'paddingRight', vars, 'space.3');
  applyFill(node, vars, fieldFillId(combo));
  applyStroke(node, vars, fieldStrokeId(combo), 'border.width.1', 1);
  bindRadius(node, vars, 'radius.control');
  if (combo.state === 'disabled') node.opacity = 0.6;

  const iconPx = px(16, 18, 20, combo.size);
  const search = magnifierGlyph(vars, iconPx);
  place(node, search);

  const label = placeholderText(fonts.regular, 'Search…', vars, combo);
  node.appendChild(label);
  fillGrow(label);

  const filterActive = box(iconPx, iconPx);
  applyFill(filterActive, vars, 'color.brand.subtle');
  bindRadius(filterActive, vars, 'radius.pill');
  filterActive.visible = false;
  place(node, filterActive);

  const clearable = iconGlyph(icons, 'close', 12, vars, 'color.fg.muted');
  clearable.visible = combo.state !== 'loading';
  node.appendChild(clearable);

  const loading = spinnerArc(vars, iconPx, 'color.fg.muted');
  loading.visible = combo.state === 'loading';
  place(node, loading);

  const disabled = hiddenMarker(node, vars);

  return { node, label, swaps: {}, bools: { loading, clearable, filterActive, disabled } };
};

/** Select — an Input-style field + leading icon slot + trailing status marker + chevron-down. */
const select: Recipe = ({ node, combo, vars, placeholder, fonts, icons }) => {
  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(240, node.height);
  bindDim(node, 'height', vars, fieldHeightId(combo.size));
  bindDim(node, 'itemSpacing', vars, 'space.2');
  bindDim(node, 'paddingLeft', vars, 'space.3');
  bindDim(node, 'paddingRight', vars, 'space.3');
  applyFill(node, vars, fieldFillId(combo));
  applyStroke(node, vars, fieldStrokeId(combo), 'border.width.1', 1);
  bindRadius(node, vars, 'radius.control');
  if (combo.state === 'disabled') node.opacity = 0.6;

  const iconPx = px(16, 18, 20, combo.size);
  const swaps: Record<string, InstanceNode> = {};
  // Select.css gates the leading icon behind [data-has-leading]; a default Select has none, so
  // keep the slot swappable but hidden (like the link recipe) instead of forcing an icon on every one.
  const start = iconSlot(placeholder, 'Icon Start', iconPx);
  start.visible = false;
  node.appendChild(start);
  swaps.iconStart = start;

  const label = placeholderText(fonts.regular, 'Select an option', vars, combo);
  node.appendChild(label);
  fillGrow(label);

  const statusColor =
    combo.state === 'error'
      ? 'color.danger.solid'
      : combo.state === 'success'
        ? 'color.success.solid'
        : 'color.fg.muted';
  const statusIcon = circle(Math.round(iconPx * 0.8));
  applyFill(statusIcon, vars, statusColor);
  statusIcon.visible = combo.state === 'error' || combo.state === 'success';
  place(node, statusIcon);

  const chevron = iconGlyph(icons, 'chevron-down', iconPx, vars, 'color.fg.muted');
  place(node, chevron);

  const disabled = hiddenMarker(node, vars);

  return { node, label, swaps, bools: { statusIcon, disabled } };
};

/** Combobox — a field row + trailing clear ✕ (clearable) + chevron-down. */
const combobox: Recipe = ({ node, combo, vars, effects, fonts, icons }) => {
  const W = 240;
  const iconPx = px(16, 18, 20, combo.size);
  node.layoutMode = 'VERTICAL';
  node.counterAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(W, node.height);
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.1');
  if (combo.state === 'disabled') node.opacity = 0.6;

  // Closed field row (Input-shaped) + trailing clear ✕ and chevron.
  const field = fieldRow(combo, vars, W);
  const label = placeholderText(fonts.regular, '검색 또는 선택', vars, combo);
  field.appendChild(label);
  fillGrow(label);
  const clearable = iconGlyph(icons, 'close', 12, vars, 'color.fg.subtle');
  clearable.visible = false;
  field.appendChild(clearable);
  place(field, iconGlyph(icons, 'chevron-down', iconPx, vars, 'color.fg.subtle'));
  node.appendChild(field);
  fillGrow(field);

  // Open listbox popup — the defining combobox affordance (filtered options, first selected).
  const pop = popupSurface(vars, effects, W);
  const optW = W - 8;
  ['Apple', 'Apricot', 'Avocado'].forEach((o, i) =>
    pop.appendChild(optionRow(vars, fonts, icons, optW, o, i === 0)),
  );
  node.appendChild(pop);

  const disabled = hiddenMarker(node, vars);
  return { node, label, swaps: {}, bools: { clearable, disabled } };
};

/** Autocomplete — a field row with a trailing typing caret, swapped for a spinner while loading. */
const autocomplete: Recipe = ({ node, combo, vars, effects, fonts, icons }) => {
  const W = 240;
  const iconPx = px(16, 18, 20, combo.size);
  node.layoutMode = 'VERTICAL';
  node.counterAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(W, node.height);
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.1');
  if (combo.state === 'disabled') node.opacity = 0.6;

  const field = fieldRow(combo, vars, W);
  const label = placeholderText(fonts.regular, '입력해 검색', vars, combo);
  field.appendChild(label);
  fillGrow(label);
  const loading = spinnerArc(vars, iconPx, 'color.fg.muted');
  loading.visible = combo.state === 'loading';
  place(field, loading);
  node.appendChild(field);
  fillGrow(field);

  // Suggestion list — unlike Combobox the typed value is preserved, so no option is pre-selected.
  const pop = popupSurface(vars, effects, W);
  const optW = W - 8;
  ['Suggestion 1', 'Suggestion 2', 'Suggestion 3'].forEach((o) =>
    pop.appendChild(optionRow(vars, fonts, icons, optW, o, false)),
  );
  node.appendChild(pop);

  const disabled = hiddenMarker(node, vars);
  return { node, label, swaps: {}, bools: { loading, disabled } };
};

/** DatePicker — a field row with a muted YYYY-MM-DD placeholder + a trailing calendar glyph. */
const datePicker: Recipe = ({ node, combo, vars, effects, fonts, icons }) => {
  const W = 240;
  const iconPx = px(16, 18, 20, combo.size);
  node.layoutMode = 'VERTICAL';
  node.counterAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(W, node.height);
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.1');
  if (combo.state === 'disabled') node.opacity = 0.6;

  // Closed field row (ISO placeholder + trailing calendar glyph).
  const field = fieldRow(combo, vars, W);
  const label = placeholderText(fonts.regular, 'YYYY-MM-DD', vars, combo);
  field.appendChild(label);
  fillGrow(label);
  place(field, calendarGlyph(vars, iconPx));
  node.appendChild(field);
  fillGrow(field);

  // Open calendar popup — the month grid with a brand-filled selected day.
  node.appendChild(calendarSurface(vars, effects, fonts, icons, W));

  const disabled = hiddenMarker(node, vars);
  return { node, label, swaps: {}, bools: { disabled } };
};

/** FileUpload — Type A dashed drop-zone (upload glyph + label + hint) · Type B compact row. */
const fileUpload: Recipe = ({ node, combo, vars, fonts }) => {
  const compact = combo.type === 'B';
  const tone = combo.tone || 'neutral';
  const accentId =
    combo.state === 'error'
      ? 'color.danger.border'
      : tone === 'brand'
        ? 'color.brand.border'
        : 'color.border.strong';
  const padY = compact
    ? 'space.3'
    : combo.size === 'sm'
      ? 'space.5'
      : combo.size === 'lg'
        ? 'space.10'
        : 'space.8';
  const padX = compact
    ? 'space.4'
    : combo.size === 'sm'
      ? 'space.4'
      : combo.size === 'lg'
        ? 'space.8'
        : 'space.6';
  const iconPx = compact ? 20 : px(24, 30, 36, combo.size);

  node.layoutMode = compact ? 'HORIZONTAL' : 'VERTICAL';
  node.primaryAxisAlignItems = compact ? 'MIN' : 'CENTER';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = compact ? 'FIXED' : 'AUTO';
  node.resize(300, node.height);
  bindDim(node, 'itemSpacing', vars, compact ? 'space.3' : 'space.2');
  bindDim(node, 'paddingTop', vars, padY);
  bindDim(node, 'paddingBottom', vars, padY);
  bindDim(node, 'paddingLeft', vars, padX);
  bindDim(node, 'paddingRight', vars, padX);
  applyFill(node, vars, 'color.bg.subtle');
  applyStroke(node, vars, accentId, 'border.width.1', 1);
  (node as ComponentNode & { dashPattern: number[] }).dashPattern = [4, 4];
  bindRadius(node, vars, 'radius.surface');
  if (combo.state === 'disabled') node.opacity = 0.55;

  const up = uploadGlyph(vars, iconPx);
  place(node, up);

  const textBlock = box(180, 32);
  textBlock.layoutMode = 'VERTICAL';
  textBlock.primaryAxisSizingMode = 'AUTO';
  textBlock.counterAxisSizingMode = 'AUTO';
  textBlock.counterAxisAlignItems = compact ? 'MIN' : 'CENTER';
  textBlock.fills = [];
  bindDim(textBlock, 'itemSpacing', vars, 'space.0.5');
  const prompt = labelText(
    fonts.medium,
    '파일을 끌어다 놓거나 클릭해 업로드',
    vars,
    'color.fg.default',
    'font.size.sm',
    14,
  );
  textBlock.appendChild(prompt);
  const hint = labelText(
    fonts.regular,
    'SVG, PNG, JPG',
    vars,
    'color.fg.subtle',
    'font.size.xs',
    12,
  );
  textBlock.appendChild(hint);
  node.appendChild(textBlock);

  const multiple = hiddenMarker(node, vars);
  const disabled = hiddenMarker(node, vars);

  return { node, label: hint, swaps: {}, bools: { multiple, disabled } };
};

/** ImageUpload — a thumbnail plate + a dashed add-tile; radius per shape, tile size per size. */
const imageUpload: Recipe = ({ node, combo, vars, fonts, icons }) => {
  const tile = combo.size === 'sm' ? 72 : combo.size === 'lg' ? 128 : 96;
  const radiusId =
    combo.shape === 'square'
      ? 'radius.none'
      : combo.shape === 'circle'
        ? 'radius.pill'
        : 'radius.lg';

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.3');
  if (combo.state === 'disabled') node.opacity = 0.55;

  // Existing thumbnail.
  const thumb = box(tile, tile);
  applyFill(thumb, vars, 'color.bg.subtle');
  applyStroke(thumb, vars, 'color.border.subtle', 'border.width.1', 1);
  bindRadius(thumb, vars, radiusId);
  thumb.clipsContent = true;
  thumb.layoutMode = 'HORIZONTAL';
  thumb.primaryAxisAlignItems = 'CENTER';
  thumb.counterAxisAlignItems = 'CENTER';
  thumb.primaryAxisSizingMode = 'FIXED';
  thumb.counterAxisSizingMode = 'FIXED';
  const plate = imagePlate(vars, icons, Math.round(tile * 0.5), Math.round(tile * 0.38));
  place(thumb, plate);
  place(node, thumb);

  // Dashed add-tile.
  const add = box(tile, tile);
  add.layoutMode = 'VERTICAL';
  add.primaryAxisAlignItems = 'CENTER';
  add.counterAxisAlignItems = 'CENTER';
  add.primaryAxisSizingMode = 'FIXED';
  add.counterAxisSizingMode = 'FIXED';
  applyFill(add, vars, 'color.bg.subtle');
  applyStroke(
    add,
    vars,
    combo.state === 'error' ? 'color.danger.border' : 'color.border.strong',
    'border.width.1',
    1,
  );
  (add as FrameNode & { dashPattern: number[] }).dashPattern = [4, 4];
  bindRadius(add, vars, radiusId);
  bindDim(add, 'itemSpacing', vars, 'space.1');
  const glyphImg = imagePlate(vars, icons, Math.round(tile * 0.34), Math.round(tile * 0.26));
  place(add, glyphImg);
  // Add-tile prompt — medium fg.default label + an optional fg.subtle hint (ImageUpload.css).
  const addLabel = labelText(fonts.medium, '이미지 추가', vars, 'color.fg.default', 'font.size.xs', 12);
  add.appendChild(addLabel);
  const addHint = labelText(fonts.regular, 'PNG · JPG', vars, 'color.fg.subtle', 'font.size.xs', 10);
  addHint.visible = false;
  add.appendChild(addHint);
  place(node, add);

  const multiple = hiddenMarker(node, vars);
  const disabled = hiddenMarker(node, vars);

  return { node, label: addLabel, swaps: {}, bools: { multiple, disabled } };
};

/** FormField — a Label (+ required ✱) · a generic field box · a hint line tinted per state. */
const formField: Recipe = ({ node, combo, vars, fonts }) => {
  const horizontal = combo.layout === 'horizontal';
  const sizeId = fieldFontId(combo.size);
  // Fixed root width for every variant so the label/field/helper columns line up and the field is
  // wide enough that "you@example.com" and the helper line fit on one row in both layouts.
  const W = 320;
  const labelColW = 160;

  node.layoutMode = horizontal ? 'HORIZONTAL' : 'VERTICAL';
  node.primaryAxisAlignItems = 'MIN';
  node.counterAxisAlignItems = 'MIN';
  if (horizontal) {
    node.primaryAxisSizingMode = 'FIXED'; // fixed width
    node.counterAxisSizingMode = 'AUTO'; // hug height
  } else {
    node.primaryAxisSizingMode = 'AUTO'; // hug height
    node.counterAxisSizingMode = 'FIXED'; // fixed width
  }
  node.resize(W, node.height);
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, horizontal ? 'space.4' : 'space.1.5');
  if (combo.state === 'disabled') node.opacity = 0.6;

  // Label row — FormField.css horizontal label is a fixed column with a top pad to baseline-align.
  const labelRow = box(horizontal ? labelColW : W, 20);
  labelRow.layoutMode = 'HORIZONTAL';
  labelRow.counterAxisAlignItems = 'CENTER';
  labelRow.primaryAxisSizingMode = horizontal ? 'FIXED' : 'AUTO';
  labelRow.counterAxisSizingMode = 'AUTO';
  labelRow.fills = [];
  if (horizontal) {
    labelRow.resize(labelColW, 20);
    bindDim(labelRow, 'paddingTop', vars, 'space.2');
  }
  bindDim(labelRow, 'itemSpacing', vars, 'space.1');
  const label = labelText(fonts.medium, 'Email', vars, 'color.fg.default', sizeId, 14);
  labelRow.appendChild(label);
  const required = glyph(fonts.medium, '*', vars, 'color.danger.solid', 14);
  required.visible = false;
  labelRow.appendChild(required);
  const optional = labelText(
    fonts.regular,
    '(optional)',
    vars,
    'color.fg.muted',
    'font.size.xs',
    12,
  );
  optional.visible = false;
  labelRow.appendChild(optional);
  if (horizontal) place(node, labelRow);
  else node.appendChild(labelRow);

  // Control column (field box over hint line) — the label → field → helper vertical stack.
  const control = box(horizontal ? labelColW : W, 40);
  control.name = 'Control';
  control.layoutMode = 'VERTICAL';
  control.primaryAxisSizingMode = 'AUTO'; // hug height
  control.counterAxisSizingMode = 'FIXED'; // width filled below
  control.counterAxisAlignItems = 'MIN';
  control.fills = [];
  bindDim(control, 'itemSpacing', vars, 'space.1');

  const field = fieldRow(combo, vars, horizontal ? labelColW : W);
  const ph = placeholderText(fonts.regular, 'you@example.com', vars, combo);
  field.appendChild(ph);
  fillGrow(ph);
  noWrap(ph); // single line — never wraps
  control.appendChild(field);
  fillGrow(field);

  const hintColor =
    combo.state === 'error'
      ? 'color.danger.solid'
      : combo.state === 'success'
        ? 'color.success.solid'
        : 'color.fg.muted';
  const hint = labelText(
    fonts.regular,
    'We never share your email.',
    vars,
    hintColor,
    'font.size.xs',
    12,
  );
  noWrap(hint);
  fillGrow(hint); // take the control-column width so an over-long single line clips, not grows
  control.appendChild(hint);
  control.clipsContent = true; // clip an over-long hint at the column edge instead of overflowing

  node.appendChild(control);
  fillGrow(control); // fill remaining width (horizontal) / full width (vertical); height hugs

  const disabled = hiddenMarker(node, vars);

  return { node, label, swaps: {}, bools: { required, optional, disabled } };
};

// ---------------------------------------------------------------------------
// Batch 5 — structural / overlay molecules. Mirror src/components/molecules/**.
// Each renders ONE representative instance of the compound component per variant.
// ---------------------------------------------------------------------------

/** Card — surface container; A vertical · B horizontal · C overlay; media + title + body line. */
const card: Recipe = ({ node, combo, ch, vars, effects, fonts, icons }) => {
  const type = combo.type;
  const fillId = combo.variant === 'filled' ? 'color.bg.subtle' : 'color.bg.surface';
  const strokeId = combo.variant === 'outlined' ? 'color.border.default' : 'transparent';
  const padId =
    combo.padding === 'none'
      ? undefined
      : combo.padding === 'sm'
        ? 'space.3'
        : combo.padding === 'lg'
          ? 'space.6'
          : 'space.4';
  const overlay = type === 'C';
  const W = 240;

  node.clipsContent = true;
  applyFill(node, vars, fillId);
  applyStroke(node, vars, strokeId, 'border.width.1', 1);
  bindRadius(node, vars, ch.radius || 'radius.lg');
  if (combo.variant === 'elevated') {
    const sid = effects.get('shadow.sm');
    if (sid) void node.setEffectStyleIdAsync(sid);
  }

  node.layoutMode = type === 'B' ? 'HORIZONTAL' : 'VERTICAL';
  node.primaryAxisAlignItems = overlay ? 'MAX' : 'MIN';
  node.counterAxisAlignItems = 'MIN';
  node.itemSpacing = 0;
  node.paddingLeft = 0;
  node.paddingRight = 0;
  node.paddingTop = 0;
  node.paddingBottom = 0;
  node.primaryAxisSizingMode = overlay ? 'FIXED' : 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(W, overlay ? 200 : node.height);

  // Media block (full-bleed).
  const media = imagePlate(vars, icons, type === 'B' ? 96 : W, type === 'B' ? 120 : 132);
  if (overlay) {
    media.resize(W, 200);
    absChild(node, media, 0, 0);
    // Card.css [data-type='C'] draws a dark bottom-up gradient ::after so the white overlay text
    // stays legible: linear-gradient(to top, rgba(0,0,0,.75), rgba(0,0,0,.1) 60%, transparent).
    const scrim = box(W, 200);
    scrim.fills = [
      {
        type: 'GRADIENT_LINEAR',
        gradientTransform: [
          [0, 1, 0],
          [-1, 0, 1],
        ],
        gradientStops: [
          { position: 0, color: { r: 0, g: 0, b: 0, a: 0 } },
          { position: 0.4, color: { r: 0, g: 0, b: 0, a: 0.1 } },
          { position: 1, color: { r: 0, g: 0, b: 0, a: 0.75 } },
        ],
      },
    ];
    absChild(node, scrim, 0, 0);
  } else if (type === 'B') {
    place(node, media);
  } else {
    node.appendChild(media);
    fillGrow(media);
  }

  // Content column (padded).
  const content = box(W, 60);
  content.layoutMode = 'VERTICAL';
  content.primaryAxisSizingMode = 'AUTO';
  content.counterAxisSizingMode = 'FIXED';
  content.counterAxisAlignItems = 'MIN';
  content.resize(W, content.height);
  content.fills = [];
  bindDim(content, 'itemSpacing', vars, 'space.1');
  if (padId) {
    bindDim(content, 'paddingTop', vars, padId);
    bindDim(content, 'paddingBottom', vars, padId);
    bindDim(content, 'paddingLeft', vars, padId);
    bindDim(content, 'paddingRight', vars, padId);
  }
  const title = labelText(
    fonts.semibold,
    'Card title',
    vars,
    overlay ? 'color.white' : 'color.fg.default',
    undefined,
    type === 'C' ? 20 : type === 'B' ? 16 : 18,
  );
  content.appendChild(title);
  const body = labelText(
    fonts.regular,
    'Supporting copy for the card body.',
    vars,
    overlay ? 'color.white' : 'color.fg.muted',
    'font.size.sm',
    13,
  );
  if (overlay) body.opacity = 0.85;
  content.appendChild(body);

  if (overlay) {
    absChild(node, content, 0, 128);
  } else {
    node.appendChild(content);
    fillGrow(content);
  }

  const interactive = hiddenMarker(node, vars);
  const selected = hiddenMarker(node, vars);

  return { node, label: title, swaps: {}, bools: { interactive, selected } };
};

/** ListItem — row: leading media + title/description stack + trailing/chevron; selected tint; A/B. */
const listItem: Recipe = ({ node, combo, vars, placeholder, fonts, icons }) => {
  const typeB = combo.type === 'B';
  const size = combo.size;
  const W = 300;
  const rowH = typeB ? 72 : size === 'sm' ? 38 : size === 'lg' ? 54 : 46;
  const mediaPx = typeB ? 48 : 32;
  const padX = typeB
    ? 'space.4'
    : size === 'sm'
      ? 'space.2'
      : size === 'lg'
        ? 'space.4'
        : 'space.3';
  const padY = typeB
    ? 'space.4'
    : size === 'sm'
      ? 'space.1.5'
      : size === 'lg'
        ? 'space.3'
        : 'space.2';
  const gap = typeB ? 'space.4' : size === 'sm' ? 'space.2' : 'space.3';
  const bg =
    combo.state === 'hover'
      ? 'color.bg.subtle'
      : combo.state === 'active'
        ? 'color.bg.muted'
        : 'transparent';

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = typeB ? 'MIN' : 'CENTER';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(W, rowH);
  bindDim(node, 'itemSpacing', vars, gap);
  bindDim(node, 'paddingLeft', vars, padX);
  bindDim(node, 'paddingRight', vars, padX);
  bindDim(node, 'paddingTop', vars, padY);
  bindDim(node, 'paddingBottom', vars, padY);
  applyFill(node, vars, bg);
  bindRadius(node, vars, 'radius.md');
  if (combo.state === 'disabled') node.opacity = 0.5;

  // Selected tint overlay (behind content).
  const selected = box(W, rowH);
  applyFill(selected, vars, 'color.brand.subtle');
  bindRadius(selected, vars, 'radius.md');
  absChild(node, selected, 0, 0);
  selected.visible = false;

  const dragHandle = glyph(fonts.regular, '⠿', vars, 'color.fg.subtle', 14);
  dragHandle.visible = false;
  place(node, dragHandle);

  const swaps: Record<string, InstanceNode> = {};
  const leading = iconSlot(placeholder, 'Leading', mediaPx);
  place(node, leading);
  swaps.leading = leading;

  const content = box(120, rowH);
  content.layoutMode = 'VERTICAL';
  content.primaryAxisAlignItems = 'CENTER';
  content.counterAxisAlignItems = 'MIN';
  content.primaryAxisSizingMode = 'AUTO';
  content.counterAxisSizingMode = 'AUTO';
  content.fills = [];
  bindDim(content, 'itemSpacing', vars, typeB ? 'space.1' : 'space.0.5');
  const title = labelText(
    fonts.medium,
    'List item title',
    vars,
    'color.fg.default',
    undefined,
    size === 'sm' ? 13 : 15,
  );
  content.appendChild(title);
  const description = labelText(
    fonts.regular,
    'Secondary description text',
    vars,
    'color.fg.muted',
    'font.size.sm',
    12,
  );
  content.appendChild(description);
  node.appendChild(content);
  fillGrow(content);

  const trailing = iconSlot(placeholder, 'Trailing', typeB ? 20 : 18);
  place(node, trailing);
  swaps.trailing = trailing;

  const chevron = iconGlyph(icons, 'chevron-down', 16, vars, 'color.fg.subtle');
  chevron.visible = false;
  place(node, chevron);

  const disabled = hiddenMarker(node, vars);

  return {
    node,
    label: title,
    swaps,
    bools: { selected, withChevron: chevron, dragHandle, disabled },
  };
};

/** Tabs — tab bar of 3 labels, active emphasized per variant; A top · B left · C bottom. */
const tabs: Recipe = ({ node, combo, vars, effects, fonts }) => {
  const variant = combo.variant;
  const vertical = combo.type === 'B';
  const size = combo.size;
  const fontPx = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
  const sizeId = size === 'sm' ? 'font.size.xs' : size === 'lg' ? 'font.size.md' : 'font.size.sm';
  const padX = size === 'sm' ? 'space.2.5' : size === 'lg' ? 'space.4' : 'space.3';
  const padY = size === 'sm' ? 'space.1.5' : size === 'lg' ? 'space.2.5' : 'space.2';
  const stretch = combo.align === 'stretch';

  node.layoutMode = vertical ? 'HORIZONTAL' : 'VERTICAL';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.counterAxisAlignItems = 'MIN';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.4');
  if (combo.state === 'disabled') node.opacity = 0.5;

  const list = box(vertical ? 160 : 320, 40);
  list.layoutMode = vertical ? 'VERTICAL' : 'HORIZONTAL';
  list.primaryAxisSizingMode = 'AUTO';
  list.counterAxisSizingMode = 'AUTO';
  list.counterAxisAlignItems = 'CENTER';
  list.primaryAxisAlignItems = combo.align === 'center' ? 'CENTER' : 'MIN';
  list.fills = [];
  if (variant === 'solid') {
    applyFill(list, vars, 'color.bg.subtle');
    bindRadius(list, vars, 'radius.lg');
    bindDim(list, 'itemSpacing', vars, 'space.1');
    bindDim(list, 'paddingTop', vars, 'space.1');
    bindDim(list, 'paddingBottom', vars, 'space.1');
    bindDim(list, 'paddingLeft', vars, 'space.1');
    bindDim(list, 'paddingRight', vars, 'space.1');
  } else if (variant === 'line') {
    bindDim(list, 'itemSpacing', vars, 'space.4');
    // Tabs.css draws ONE border on the edge facing the panel: bottom (A) · right (B) · top (C).
    applyStroke(list, vars, 'color.border.default', 'border.width.1', 1);
    const ls = list as FrameNode & {
      strokeTopWeight: number;
      strokeRightWeight: number;
      strokeBottomWeight: number;
      strokeLeftWeight: number;
    };
    ls.strokeLeftWeight = 0;
    ls.strokeRightWeight = vertical ? 1 : 0;
    ls.strokeTopWeight = !vertical && combo.type === 'C' ? 1 : 0;
    ls.strokeBottomWeight = !vertical && combo.type !== 'C' ? 1 : 0;
  } else {
    bindDim(list, 'itemSpacing', vars, 'space.1');
  }

  let first: TextNode | null = null;
  ['Overview', 'Activity', 'Settings'].forEach((txt, i) => {
    const active = i === 0;
    const tab = box(60, 32);
    // Type B (vertical) lays the row + right-edge indicator horizontally; A/C stack vertically.
    tab.layoutMode = vertical ? 'HORIZONTAL' : 'VERTICAL';
    tab.counterAxisAlignItems = 'CENTER';
    tab.primaryAxisSizingMode = 'AUTO';
    tab.counterAxisSizingMode = 'AUTO';
    tab.fills = [];
    tab.itemSpacing = 0;

    const row = box(60, 24);
    row.layoutMode = 'HORIZONTAL';
    row.primaryAxisAlignItems = 'CENTER';
    row.counterAxisAlignItems = 'CENTER';
    row.primaryAxisSizingMode = 'AUTO';
    row.counterAxisSizingMode = 'AUTO';
    row.fills = [];
    bindDim(row, 'itemSpacing', vars, 'space.2');
    bindDim(row, 'paddingLeft', vars, padX);
    bindDim(row, 'paddingRight', vars, padX);
    bindDim(row, 'paddingTop', vars, padY);
    bindDim(row, 'paddingBottom', vars, padY);

    let textId = active ? 'color.fg.default' : 'color.fg.muted';
    if (variant === 'pill') {
      bindRadius(row, vars, 'radius.pill');
      if (active) {
        applyFill(row, vars, 'color.brand.solid');
        textId = 'color.brand.fg';
      }
    } else if (variant === 'solid') {
      bindRadius(row, vars, 'radius.md');
      if (active) {
        applyFill(row, vars, 'color.bg.surface');
        textId = 'color.fg.default';
        const sid = effects.get('shadow.sm');
        if (sid) void row.setEffectStyleIdAsync(sid);
      }
    } else if (variant === 'line' && active) {
      textId = 'color.brand.subtleFg';
    }

    const t = labelText(fonts.medium, txt, vars, textId, sizeId, fontPx);
    row.appendChild(t);
    tab.appendChild(row);
    fillGrow(row);

    if (variant === 'line') {
      if (vertical) {
        // Type B: vertical indicator on the trailing (right) edge.
        const bar = box(2, 20);
        applyFill(bar, vars, active ? 'color.brand.solid' : 'transparent');
        tab.appendChild(bar);
      } else {
        const bar = box(40, 2);
        applyFill(bar, vars, active ? 'color.brand.solid' : 'transparent');
        // Type C indicator sits on top (above the row); Type A underlines below.
        if (combo.type === 'C') tab.insertChild(0, bar);
        else tab.appendChild(bar);
        fillGrow(bar);
      }
    }

    list.appendChild(tab);
    if (stretch && !vertical) fillGrow(tab);
    if (i === 0) first = t;
  });

  const panel = box(vertical ? 200 : 320, vertical ? 96 : 48);
  applyFill(panel, vars, 'color.bg.subtle');
  bindRadius(panel, vars, 'radius.sm');

  if (vertical) {
    node.appendChild(list);
    node.appendChild(panel);
    fillGrow(panel);
  } else {
    const kids = combo.type === 'C' ? [panel, list] : [list, panel];
    for (const k of kids) {
      node.appendChild(k);
      fillGrow(k);
    }
  }

  return { node, label: first, swaps: {}, bools: {} };
};

/** Accordion — 2 disclosure items (first open: header + body); separated/contained/ghost; A/B. */
const accordion: Recipe = ({ node, combo, vars, fonts, icons }) => {
  const variant = combo.variant;
  const typeB = combo.type === 'B';
  const size = combo.size;
  const W = 300;
  const triggerPadY = size === 'sm' ? 'space.2' : size === 'lg' ? 'space.4' : 'space.3';
  const triggerPadX = size === 'sm' ? 'space.3' : size === 'lg' ? 'space.5' : 'space.4';
  const fontPx = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;
  const sizeId = size === 'sm' ? 'font.size.sm' : size === 'lg' ? 'font.size.lg' : 'font.size.md';
  const boxed = typeB || variant === 'separated';
  const divided = !typeB && (variant === 'contained' || variant === 'ghost');

  node.layoutMode = 'VERTICAL';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(W, node.height);
  node.counterAxisAlignItems = 'MIN';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, boxed ? 'space.2' : 'space.0.5');
  if (variant === 'contained' && !typeB) {
    applyStroke(node, vars, 'color.border.default', 'border.width.1', 1);
    bindRadius(node, vars, 'radius.lg');
    node.clipsContent = true;
    node.itemSpacing = 0;
  }
  if (combo.state === 'disabled') node.opacity = 0.5;

  let first: TextNode | null = null;
  const mkItem = (title: string, open: boolean, isFirst: boolean) => {
    const item = box(W, 48);
    item.layoutMode = 'VERTICAL';
    item.primaryAxisSizingMode = 'AUTO';
    item.counterAxisSizingMode = 'FIXED';
    item.counterAxisAlignItems = 'MIN';
    item.resize(W, item.height);
    item.fills = [];
    if (boxed) {
      applyStroke(item, vars, 'color.border.default', 'border.width.1', 1);
      bindRadius(item, vars, 'radius.lg');
      item.clipsContent = true;
    }

    const header = box(W, 44);
    header.layoutMode = 'HORIZONTAL';
    header.primaryAxisAlignItems = 'SPACE_BETWEEN';
    header.counterAxisAlignItems = 'CENTER';
    header.primaryAxisSizingMode = 'FIXED';
    header.counterAxisSizingMode = 'AUTO';
    header.resize(W, 44);
    header.fills = [];
    bindDim(header, 'itemSpacing', vars, 'space.3');
    bindDim(header, 'paddingTop', vars, triggerPadY);
    bindDim(header, 'paddingBottom', vars, triggerPadY);
    bindDim(header, 'paddingLeft', vars, triggerPadX);
    bindDim(header, 'paddingRight', vars, triggerPadX);
    const t = labelText(
      open ? fonts.semibold : fonts.medium,
      title,
      vars,
      'color.fg.default',
      sizeId,
      fontPx,
    );
    header.appendChild(t);
    fillGrow(t);
    const chevron = iconGlyph(icons, 'chevron-down', 18, vars, open ? 'color.brand.solid' : 'color.fg.muted');
    place(header, chevron);
    item.appendChild(header);
    fillGrow(header);

    if (open) {
      const bodyFrame = box(W, 32);
      bodyFrame.layoutMode = 'VERTICAL';
      bodyFrame.primaryAxisSizingMode = 'AUTO';
      bodyFrame.counterAxisSizingMode = 'FIXED';
      bodyFrame.counterAxisAlignItems = 'MIN';
      bodyFrame.resize(W, bodyFrame.height);
      bodyFrame.fills = [];
      bindDim(bodyFrame, 'paddingLeft', vars, triggerPadX);
      bindDim(bodyFrame, 'paddingRight', vars, triggerPadX);
      bindDim(bodyFrame, 'paddingBottom', vars, size === 'sm' ? 'space.3' : 'space.4');
      const bt = labelText(
        fonts.regular,
        'Panel content shown while this item is expanded.',
        vars,
        'color.fg.muted',
        'font.size.sm',
        13,
      );
      bodyFrame.appendChild(bt);
      fillGrow(bt);
      item.appendChild(bodyFrame);
      fillGrow(bodyFrame);
    }

    node.appendChild(item);
    fillGrow(item);
    if (isFirst) first = t;
  };

  mkItem('Section one', true, true);
  if (divided) {
    const hr = hairline(vars, 'color.border.default', W, 1, false);
    node.appendChild(hr);
    fillGrow(hr);
  }
  mkItem('Section two', false, false);

  return { node, label: first, swaps: {}, bools: {} };
};

/** Breadcrumb — 3 crumbs joined by the separator glyph; last crumb emphasized; size. */
const breadcrumb: Recipe = ({ node, combo, vars, fonts, icons }) => {
  const size = combo.size;
  const fontPx = size === 'sm' ? 12 : 14;
  const sizeId = size === 'sm' ? 'font.size.xs' : 'font.size.sm';
  // slash/dot separators are punctuation (kept as text); the default chevron is a real icon.
  const sepChar = combo.separator === 'slash' ? '/' : combo.separator === 'dot' ? '•' : null;

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, size === 'sm' ? 'space.1.5' : 'space.2');
  if (combo.state === 'disabled') node.opacity = 0.5;

  const crumbs = ['Home', 'Library', 'Datasets'];
  let first: TextNode | null = null;
  crumbs.forEach((c, i) => {
    const last = i === crumbs.length - 1;
    const t = labelText(
      last ? fonts.medium : fonts.regular,
      c,
      vars,
      last ? 'color.fg.default' : 'color.fg.muted',
      sizeId,
      fontPx,
    );
    node.appendChild(t);
    if (i === 0) first = t;
    if (!last) {
      node.appendChild(
        sepChar
          ? glyph(fonts.regular, sepChar, vars, 'color.fg.subtle', fontPx)
          : iconGlyph(icons, 'chevron-right', fontPx + 2, vars, 'color.fg.subtle'),
      );
    }
  });

  return { node, label: first, swaps: {}, bools: {} };
};

/** Pagination — prev · 1 2 3 · next; current emphasized; outline/ghost, shape, size. */
const pagination: Recipe = ({ node, combo, vars, fonts, icons }) => {
  const size = combo.size;
  const itemSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  const fontPx = size === 'sm' ? 12 : size === 'lg' ? 16 : 14;
  const sizeId = size === 'sm' ? 'font.size.xs' : size === 'lg' ? 'font.size.md' : 'font.size.sm';
  const radiusId = combo.shape === 'pill' ? 'radius.pill' : 'radius.md';
  const outline = combo.variant === 'outline';

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.1');
  if (combo.state === 'disabled') node.opacity = 0.5;

  // A page cell. Numbered pages pass `txt`; the prev/next/edge arrows pass an `iconName` so they
  // render as real vector chevrons (single ‹ › → chevron-*, edge « » → chevrons-*) instead of text.
  const mkItem = (
    txt: string | null,
    sel: boolean,
    iconName?: string,
  ): { it: FrameNode; t: TextNode | null } => {
    const it = box(itemSize, itemSize);
    it.layoutMode = 'HORIZONTAL';
    it.primaryAxisAlignItems = 'CENTER';
    it.counterAxisAlignItems = 'CENTER';
    it.primaryAxisSizingMode = 'FIXED';
    it.counterAxisSizingMode = 'FIXED';
    it.resize(itemSize, itemSize);
    applyFill(it, vars, sel ? 'color.brand.solid' : 'transparent');
    applyStroke(
      it,
      vars,
      sel ? 'color.brand.solid' : outline ? 'color.border.default' : 'transparent',
      'border.width.1',
      1,
    );
    bindRadius(it, vars, radiusId);
    const color = sel ? 'color.brand.fg' : 'color.fg.muted';
    let t: TextNode | null = null;
    if (iconName) {
      it.appendChild(iconGlyph(icons, iconName, fontPx + 2, vars, color));
    } else {
      t = labelText(fonts.medium, txt ?? '', vars, color, sizeId, fontPx);
      it.appendChild(t);
    }
    return { it, t };
  };

  // showEdges reveals BOTH the first («) and last (») page jumps — bind both to the one boolean.
  const edgeFirst = mkItem(null, false, 'chevrons-left');
  edgeFirst.it.visible = false;
  place(node, edgeFirst.it);

  place(node, mkItem(null, false, 'chevron-left').it);
  let label: TextNode | null = null;
  ['1', '2', '3'].forEach((n, i) => {
    const { it, t } = mkItem(n, i === 0);
    place(node, it);
    if (i === 0) label = t;
  });
  place(node, mkItem(null, false, 'chevron-right').it);

  const edgeLast = mkItem(null, false, 'chevrons-right');
  edgeLast.it.visible = false;
  place(node, edgeLast.it);

  return { node, label, swaps: {}, bools: { showEdges: [edgeFirst.it, edgeLast.it] } };
};

/** A menu-panel item row (dot icon + label + optional trailing) used by Dropdown/Menu. */
function menuRow(
  vars: VariableRegistry,
  fonts: DocFonts,
  width: number,
  padY: string,
  padX: string,
  fontId: string,
  fontPx: number,
  text: string,
  colorId: string,
  dotId: string,
): { row: FrameNode; label: TextNode } {
  const row = box(width, 32);
  row.layoutMode = 'HORIZONTAL';
  row.counterAxisAlignItems = 'CENTER';
  row.primaryAxisSizingMode = 'FIXED';
  row.counterAxisSizingMode = 'AUTO';
  row.resize(width, row.height);
  row.fills = [];
  bindDim(row, 'itemSpacing', vars, 'space.2');
  bindDim(row, 'paddingTop', vars, padY);
  bindDim(row, 'paddingBottom', vars, padY);
  bindDim(row, 'paddingLeft', vars, padX);
  bindDim(row, 'paddingRight', vars, padX);
  bindRadius(row, vars, 'radius.md');
  const dot = circle(14);
  applyFill(dot, vars, dotId);
  place(row, dot);
  const label = labelText(fonts.regular, text, vars, colorId, fontId, fontPx);
  row.appendChild(label);
  fillGrow(label);
  return { row, label };
}

/** Dropdown — trigger button + anchored menu panel (3 item rows); placement, size. */
const dropdown: Recipe = ({ node, combo, vars, placeholder, effects, fonts, icons }) => {
  const size = combo.size;
  const top = combo.placement.startsWith('top');
  const end = combo.placement.endsWith('end');
  const heightId = size === 'sm' ? 'size.control.sm' : 'size.control.md';
  const itemPadY = size === 'sm' ? 'space.1.5' : 'space.2';
  const itemPadX = size === 'sm' ? 'space.2' : 'space.2.5';
  const itemFontId = size === 'sm' ? 'font.size.xs' : 'font.size.sm';
  const itemFontPx = size === 'sm' ? 12 : 14;

  node.layoutMode = 'VERTICAL';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.counterAxisAlignItems = end ? 'MAX' : 'MIN';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.1');
  if (combo.state === 'disabled') node.opacity = 0.5;

  const swaps: Record<string, InstanceNode> = {};

  const trigger = box(160, 40);
  trigger.layoutMode = 'HORIZONTAL';
  trigger.counterAxisAlignItems = 'CENTER';
  trigger.primaryAxisAlignItems = 'MIN';
  trigger.primaryAxisSizingMode = 'AUTO';
  trigger.counterAxisSizingMode = 'FIXED';
  bindDim(trigger, 'height', vars, heightId);
  bindDim(trigger, 'itemSpacing', vars, 'space.2');
  bindDim(trigger, 'paddingLeft', vars, 'space.3');
  bindDim(trigger, 'paddingRight', vars, 'space.3');
  applyFill(trigger, vars, 'color.bg.surface');
  applyStroke(trigger, vars, 'color.border.default', 'border.width.1', 1);
  bindRadius(trigger, vars, 'radius.control');
  const trig = iconSlot(placeholder, 'Trigger', 18);
  trigger.appendChild(trig);
  swaps.trigger = trig;
  trigger.appendChild(
    labelText(fonts.medium, 'Options', vars, 'color.fg.default', itemFontId, itemFontPx),
  );
  place(trigger, iconGlyph(icons, 'chevron-down', 16, vars, 'color.fg.muted'));

  const menuPanel = box(200, 120);
  menuPanel.layoutMode = 'VERTICAL';
  menuPanel.primaryAxisSizingMode = 'AUTO';
  menuPanel.counterAxisSizingMode = 'FIXED';
  menuPanel.resize(200, menuPanel.height);
  menuPanel.counterAxisAlignItems = 'MIN';
  bindDim(menuPanel, 'paddingTop', vars, 'space.1');
  bindDim(menuPanel, 'paddingBottom', vars, 'space.1');
  bindDim(menuPanel, 'paddingLeft', vars, 'space.1');
  bindDim(menuPanel, 'paddingRight', vars, 'space.1');
  applyFill(menuPanel, vars, 'color.bg.surface');
  applyStroke(menuPanel, vars, 'color.border.default', 'border.width.1', 1);
  bindRadius(menuPanel, vars, 'radius.lg');
  const sid = effects.get('shadow.lg');
  if (sid) void menuPanel.setEffectStyleIdAsync(sid);

  let label: TextNode | null = null;
  ['Edit', 'Duplicate', 'Delete'].forEach((txt, i) => {
    const danger = i === 2;
    const { row, label: rl } = menuRow(
      vars,
      fonts,
      190,
      itemPadY,
      itemPadX,
      itemFontId,
      itemFontPx,
      txt,
      danger ? 'color.danger.subtleFg' : 'color.fg.default',
      danger ? 'color.danger.solid' : 'color.fg.muted',
    );
    if (i === 0) applyFill(row, vars, 'color.bg.subtle');
    menuPanel.appendChild(row);
    fillGrow(row);
    if (i === 0) label = rl;
  });

  for (const p of top ? [menuPanel, trigger] : [trigger, menuPanel]) node.appendChild(p);

  return { node, label, swaps, bools: {} };
};

/** Menu — surface panel of MenuItem rows (icon + label + shortcut) + a separator; size, placement. */
const menu: Recipe = ({ node, combo, vars, placeholder, effects, fonts }) => {
  const sm = combo.size === 'sm';
  const itemPadY = sm ? 'space.1.5' : 'space.2';
  const itemPadX = sm ? 'space.2' : 'space.3';
  const fontId = sm ? 'font.size.xs' : 'font.size.sm';
  const fontPx = sm ? 12 : 14;
  const W = sm ? 168 : 200;

  node.layoutMode = 'VERTICAL';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(W, node.height);
  node.counterAxisAlignItems = 'MIN';
  bindDim(node, 'paddingTop', vars, 'space.1');
  bindDim(node, 'paddingBottom', vars, 'space.1');
  bindDim(node, 'paddingLeft', vars, 'space.1');
  bindDim(node, 'paddingRight', vars, 'space.1');
  node.itemSpacing = 0;
  applyFill(node, vars, 'color.bg.surface');
  applyStroke(node, vars, 'color.border.default', 'border.width.1', 1);
  bindRadius(node, vars, 'radius.surface');
  const sid = effects.get('shadow.lg');
  if (sid) void node.setEffectStyleIdAsync(sid);

  const addItem = (text: string, shortcut: string | undefined, danger: boolean): TextNode => {
    const { row, label } = menuRow(
      vars,
      fonts,
      W - 8,
      itemPadY,
      itemPadX,
      fontId,
      fontPx,
      text,
      danger ? 'color.danger.solid' : 'color.fg.default',
      danger ? 'color.danger.solid' : 'color.fg.subtle',
    );
    bindRadius(row, vars, 'radius.sm');
    if (shortcut) {
      const badge = box(30, 18);
      badge.layoutMode = 'HORIZONTAL';
      badge.primaryAxisAlignItems = 'CENTER';
      badge.counterAxisAlignItems = 'CENTER';
      badge.primaryAxisSizingMode = 'AUTO';
      badge.counterAxisSizingMode = 'AUTO';
      bindDim(badge, 'paddingLeft', vars, 'space.1.5');
      bindDim(badge, 'paddingRight', vars, 'space.1.5');
      applyFill(badge, vars, 'color.bg.subtle');
      bindRadius(badge, vars, 'radius.sm');
      badge.appendChild(
        labelText(fonts.regular, shortcut, vars, 'color.fg.subtle', 'font.size.xs', 11),
      );
      place(row, badge);
    }
    node.appendChild(row);
    fillGrow(row);
    return label;
  };

  const first = addItem('New file', '⌘N', false);
  addItem('Open…', '⌘O', false);
  const sep = hairline(vars, 'color.border.subtle', W - 8, 1, false);
  node.appendChild(sep);
  fillGrow(sep);
  addItem('Delete', undefined, true);

  // Trigger swap slot (the anchor button) — kept for the INSTANCE_SWAP property, hidden in-panel.
  const trig = iconSlot(placeholder, 'Trigger', 18);
  absChild(node, trig, 0, 0);
  trig.visible = false;

  return { node, label: first, swaps: { trigger: trig }, bools: {} };
};

/** Popover — anchored surface panel + arrow nub per side + title + body line; align, size. */
const popover: Recipe = ({ node, combo, vars, effects, fonts }) => {
  const sm = combo.size === 'sm';
  const W = sm ? 160 : 220;
  const H = sm ? 66 : 78;
  const side = combo.side;
  const align = combo.align;

  node.layoutMode = 'VERTICAL';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(W, H);
  node.counterAxisAlignItems = 'MIN';
  node.primaryAxisAlignItems = 'MIN';
  bindDim(node, 'paddingTop', vars, sm ? 'space.2' : 'space.3');
  bindDim(node, 'paddingBottom', vars, sm ? 'space.2' : 'space.3');
  bindDim(node, 'paddingLeft', vars, sm ? 'space.3' : 'space.4');
  bindDim(node, 'paddingRight', vars, sm ? 'space.3' : 'space.4');
  bindDim(node, 'itemSpacing', vars, 'space.1');
  applyFill(node, vars, 'color.bg.surface');
  applyStroke(node, vars, 'color.border.default', 'border.width.1', 1);
  bindRadius(node, vars, 'radius.surface');
  const sid = effects.get('shadow.lg');
  if (sid) void node.setEffectStyleIdAsync(sid);

  const title = labelText(
    fonts.semibold,
    'Popover title',
    vars,
    'color.fg.default',
    'font.size.sm',
    14,
  );
  node.appendChild(title);
  const body = labelText(
    fonts.regular,
    'Contextual details anchored to the trigger.',
    vars,
    'color.fg.muted',
    'font.size.sm',
    13,
  );
  node.appendChild(body);
  fillGrow(body);

  // Arrow nub — a small square straddling the anchored edge, with the border on the edge that
  // meets the popover body removed so it reads as a connected pointer (Popover.css diamond nub).
  const arrow = box(10, 10);
  applyFill(arrow, vars, 'color.bg.surface');
  applyStroke(arrow, vars, 'color.border.default', 'border.width.1', 1);
  const aw = arrow as FrameNode & {
    strokeTopWeight: number;
    strokeRightWeight: number;
    strokeBottomWeight: number;
    strokeLeftWeight: number;
  };
  const alongH = align === 'start' ? 20 : align === 'end' ? W - 30 : W / 2 - 5;
  const alongV = align === 'start' ? 18 : align === 'end' ? H - 28 : H / 2 - 5;
  let arrowX: number;
  let arrowY: number;
  if (side === 'bottom') {
    arrowX = alongH;
    arrowY = -5;
    aw.strokeBottomWeight = 0;
  } else if (side === 'top') {
    arrowX = alongH;
    arrowY = H - 5;
    aw.strokeTopWeight = 0;
  } else if (side === 'right') {
    arrowX = -5;
    arrowY = alongV;
    aw.strokeRightWeight = 0;
  } else {
    arrowX = W - 5;
    arrowY = alongV;
    aw.strokeLeftWeight = 0;
  }
  absChild(node, arrow, arrowX, arrowY);

  const open = hiddenMarker(node, vars);

  return { node, label: title, swaps: {}, bools: { arrow, open } };
};

/** EmptyState — centered icon disc + title + description + primary/secondary action buttons; tone/size/align. */
const emptyState: Recipe = ({ node, combo, vars, placeholder, fonts }) => {
  const size = combo.size;
  const start = combo.align === 'start';
  const tone = combo.tone;
  const medallion = size === 'sm' ? 48 : size === 'lg' ? 88 : 64;
  const glyphPx = size === 'sm' ? 24 : size === 'lg' ? 44 : 32;
  const discFill =
    tone === 'brand'
      ? 'color.brand.subtle'
      : tone === 'danger'
        ? 'color.danger.subtle'
        : 'color.bg.subtle';
  const alignH: 'LEFT' | 'CENTER' = start ? 'LEFT' : 'CENTER';

  node.layoutMode = 'VERTICAL';
  node.primaryAxisAlignItems = 'CENTER';
  node.counterAxisAlignItems = start ? 'MIN' : 'CENTER';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(360, node.height);
  node.fills = [];
  bindDim(
    node,
    'itemSpacing',
    vars,
    size === 'sm' ? 'space.3' : size === 'lg' ? 'space.5' : 'space.4',
  );
  bindDim(
    node,
    'paddingLeft',
    vars,
    size === 'sm' ? 'space.4' : size === 'lg' ? 'space.8' : 'space.6',
  );
  bindDim(
    node,
    'paddingRight',
    vars,
    size === 'sm' ? 'space.4' : size === 'lg' ? 'space.8' : 'space.6',
  );
  bindDim(
    node,
    'paddingTop',
    vars,
    size === 'sm' ? 'space.6' : size === 'lg' ? 'space.10' : 'space.8',
  );
  bindDim(
    node,
    'paddingBottom',
    vars,
    size === 'sm' ? 'space.6' : size === 'lg' ? 'space.10' : 'space.8',
  );

  const swaps: Record<string, InstanceNode> = {};

  const disc = box(medallion, medallion);
  disc.layoutMode = 'HORIZONTAL';
  disc.primaryAxisAlignItems = 'CENTER';
  disc.counterAxisAlignItems = 'CENTER';
  disc.primaryAxisSizingMode = 'FIXED';
  disc.counterAxisSizingMode = 'FIXED';
  disc.resize(medallion, medallion);
  applyFill(disc, vars, discFill);
  bindRadius(disc, vars, 'radius.pill');
  const icon = iconSlot(placeholder, 'Icon', glyphPx);
  disc.appendChild(icon);
  swaps.icon = icon;
  place(node, disc);

  const textBlock = box(300, 40);
  textBlock.layoutMode = 'VERTICAL';
  textBlock.primaryAxisSizingMode = 'AUTO';
  textBlock.counterAxisSizingMode = 'AUTO';
  textBlock.counterAxisAlignItems = start ? 'MIN' : 'CENTER';
  textBlock.fills = [];
  bindDim(textBlock, 'itemSpacing', vars, 'space.2');
  const title = labelText(
    fonts.semibold,
    '표시할 항목이 없습니다',
    vars,
    'color.fg.default',
    undefined,
    size === 'sm' ? 16 : size === 'lg' ? 22 : 18,
  );
  (title as TextNode & { textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' }).textAlignHorizontal =
    alignH;
  textBlock.appendChild(title);
  const desc = labelText(
    fonts.regular,
    '새로운 항목을 추가해 시작하세요.',
    vars,
    'color.fg.muted',
    'font.size.sm',
    14,
  );
  (desc as TextNode & { textAlignHorizontal: 'LEFT' | 'CENTER' | 'RIGHT' }).textAlignHorizontal =
    alignH;
  textBlock.appendChild(desc);
  place(node, textBlock);

  const actions = box(220, 40);
  actions.layoutMode = 'HORIZONTAL';
  actions.primaryAxisAlignItems = start ? 'MIN' : 'CENTER';
  actions.counterAxisAlignItems = 'CENTER';
  actions.primaryAxisSizingMode = 'AUTO';
  actions.counterAxisSizingMode = 'AUTO';
  actions.fills = [];
  bindDim(actions, 'itemSpacing', vars, 'space.2');

  const mkAction = (name: string, txt: string, primary: boolean): InstanceNode => {
    const btn = box(120, 40);
    btn.layoutMode = 'HORIZONTAL';
    btn.primaryAxisAlignItems = 'CENTER';
    btn.counterAxisAlignItems = 'CENTER';
    btn.primaryAxisSizingMode = 'AUTO';
    btn.counterAxisSizingMode = 'FIXED';
    bindDim(btn, 'height', vars, 'size.control.md');
    bindDim(btn, 'itemSpacing', vars, 'space.2');
    bindDim(btn, 'paddingLeft', vars, 'space.4');
    bindDim(btn, 'paddingRight', vars, 'space.4');
    applyFill(btn, vars, primary ? 'color.brand.solid' : 'transparent');
    if (!primary) applyStroke(btn, vars, 'color.border.default', 'border.width.1', 1);
    bindRadius(btn, vars, 'radius.control');
    const slot = iconSlot(placeholder, name, 16);
    btn.appendChild(slot);
    btn.appendChild(
      labelText(
        fonts.semibold,
        txt,
        vars,
        primary ? 'color.brand.fg' : 'color.fg.default',
        undefined,
        14,
      ),
    );
    place(actions, btn);
    return slot;
  };

  swaps.action = mkAction('Action', '시작하기', true);
  swaps.secondaryAction = mkAction('Secondary Action', '자세히', false);
  place(node, actions);

  return { node, label: title, swaps, bools: {} };
};

/** SocialLogin — A stacked full-width provider buttons + divider + others row · B circular icon row. */
const socialLogin: Recipe = ({ node, combo, vars, fonts }) => {
  const typeB = combo.type === 'B';
  const size = combo.size;
  const heightId =
    size === 'sm' ? 'size.control.sm' : size === 'lg' ? 'size.control.lg' : 'size.control.md';
  const radiusId =
    combo.shape === 'pill'
      ? 'radius.pill'
      : combo.shape === 'square'
        ? 'radius.none'
        : 'radius.control';
  const fontPx = size === 'lg' ? 16 : 14;
  const markPx = size === 'sm' ? 34 : size === 'lg' ? 46 : 40;
  const W = 260;

  node.layoutMode = 'VERTICAL';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(typeB ? 240 : W, node.height);
  node.counterAxisAlignItems = 'CENTER';
  node.fills = [];
  bindDim(node, 'itemSpacing', vars, 'space.4');
  if (combo.state === 'disabled') node.opacity = 0.6;

  const brandFill = (n: FrameNode, provider: string): void => {
    const p = PROVIDER[provider];
    if (p.bgToken) applyFill(n, vars, p.bgToken);
    else litFill(n, p.bg);
    if (p.border) {
      n.strokes = [{ type: 'SOLID', color: hexRGB(p.border) }];
      n.strokeWeight = 1;
    }
  };

  const fullBtn = (provider: string): FrameNode => {
    const p = PROVIDER[provider];
    const btn = box(W, 44);
    btn.layoutMode = 'HORIZONTAL';
    btn.primaryAxisAlignItems = 'CENTER';
    btn.counterAxisAlignItems = 'CENTER';
    btn.primaryAxisSizingMode = 'FIXED';
    btn.counterAxisSizingMode = 'FIXED';
    btn.resize(W, 44);
    bindDim(btn, 'height', vars, heightId);
    bindDim(btn, 'itemSpacing', vars, 'space.2');
    bindDim(btn, 'paddingLeft', vars, 'space.4');
    bindDim(btn, 'paddingRight', vars, 'space.4');
    brandFill(btn, provider);
    bindRadius(btn, vars, radiusId);
    const badge = circle(20);
    litFill(badge, p.fg);
    place(btn, badge);
    const t = labelText(
      fonts.semibold,
      PROVIDER_LABEL[provider],
      vars,
      undefined,
      undefined,
      fontPx,
    );
    litFill(t, p.fg);
    btn.appendChild(t);
    return btn;
  };

  const circBtn = (provider: string): FrameNode => {
    const p = PROVIDER[provider];
    const c = box(markPx, markPx);
    c.layoutMode = 'HORIZONTAL';
    c.primaryAxisAlignItems = 'CENTER';
    c.counterAxisAlignItems = 'CENTER';
    c.primaryAxisSizingMode = 'FIXED';
    c.counterAxisSizingMode = 'FIXED';
    c.resize(markPx, markPx);
    brandFill(c, provider);
    bindRadius(c, vars, 'radius.pill');
    const badge = circle(Math.round(markPx * 0.5));
    litFill(badge, p.fg);
    place(c, badge);
    return c;
  };

  if (typeB) {
    const grid = box(240, markPx);
    grid.layoutMode = 'HORIZONTAL';
    grid.primaryAxisAlignItems = 'CENTER';
    grid.counterAxisAlignItems = 'CENTER';
    grid.primaryAxisSizingMode = 'AUTO';
    grid.counterAxisSizingMode = 'AUTO';
    grid.fills = [];
    bindDim(grid, 'itemSpacing', vars, size === 'lg' ? 'space.4' : 'space.3');
    for (const p of ['kakao', 'naver', 'apple', 'facebook', 'email']) place(grid, circBtn(p));
    place(node, grid);
    const label = labelText(
      fonts.regular,
      '다른 계정으로 계속하기',
      vars,
      'color.fg.muted',
      'font.size.sm',
      13,
    );
    label.visible = false;
    node.appendChild(label);
    const showOthers = hiddenMarker(node, vars);
    const disabled = hiddenMarker(node, vars);
    return { node, label, swaps: {}, bools: { showOthers, disabled } };
  }

  // Type A.
  const primary = box(W, 140);
  primary.layoutMode = 'VERTICAL';
  primary.primaryAxisSizingMode = 'AUTO';
  primary.counterAxisSizingMode = 'FIXED';
  primary.resize(W, primary.height);
  primary.counterAxisAlignItems = 'CENTER';
  primary.fills = [];
  bindDim(primary, 'itemSpacing', vars, 'space.3');
  for (const p of ['kakao', 'naver', 'apple']) {
    const b = fullBtn(p);
    primary.appendChild(b);
    fillGrow(b);
  }
  node.appendChild(primary);
  fillGrow(primary);

  // Others block (divider + circular row), toggled by showOthers.
  const others = box(W, 60);
  others.layoutMode = 'VERTICAL';
  others.primaryAxisSizingMode = 'AUTO';
  others.counterAxisSizingMode = 'FIXED';
  others.resize(W, others.height);
  others.counterAxisAlignItems = 'CENTER';
  others.fills = [];
  bindDim(others, 'itemSpacing', vars, 'space.4');

  const divider = box(W, 20);
  divider.layoutMode = 'HORIZONTAL';
  divider.counterAxisAlignItems = 'CENTER';
  divider.primaryAxisAlignItems = 'CENTER';
  divider.primaryAxisSizingMode = 'FIXED';
  divider.counterAxisSizingMode = 'AUTO';
  divider.resize(W, 20);
  divider.fills = [];
  bindDim(divider, 'itemSpacing', vars, 'space.3');
  const l1 = hairline(vars, 'color.border.subtle', 80, 1, false);
  divider.appendChild(l1);
  fillGrow(l1);
  const label = labelText(
    fonts.regular,
    '다른 계정으로 계속하기',
    vars,
    'color.fg.muted',
    'font.size.sm',
    13,
  );
  divider.appendChild(label);
  const l2 = hairline(vars, 'color.border.subtle', 80, 1, false);
  divider.appendChild(l2);
  fillGrow(l2);
  others.appendChild(divider);
  fillGrow(divider);

  const row = box(120, markPx);
  row.layoutMode = 'HORIZONTAL';
  row.primaryAxisAlignItems = 'CENTER';
  row.counterAxisAlignItems = 'CENTER';
  row.primaryAxisSizingMode = 'AUTO';
  row.counterAxisSizingMode = 'AUTO';
  row.fills = [];
  bindDim(row, 'itemSpacing', vars, 'space.4');
  for (const p of ['facebook', 'email']) place(row, circBtn(p));
  others.appendChild(row);

  node.appendChild(others);
  fillGrow(others);

  const disabled = hiddenMarker(node, vars);

  return { node, label, swaps: {}, bools: { showOthers: others, disabled } };
};

// ---------------------------------------------------------------------------
// Batch 6 — organisms. Mirror src/components/organisms/**. Each renders ONE clear
// representative instance of the compound component per variant (a scaled-down but
// recognizable example), token-bound via ch.*/applyFill/applyStroke like the rest.
// ---------------------------------------------------------------------------

/** Alert/Toast tonal channel ids (mirror src/styles/tones.css `.tds-tone` --tone-*). */
function toneVars(tone: string): {
  solid: string;
  onSolid: string;
  subtle: string;
  subtleFg: string;
  border: string;
} {
  return {
    solid: `color.${tone}.solid`,
    onSolid: `color.${tone}.fg`,
    subtle: `color.${tone}.subtle`,
    subtleFg: `color.${tone}.subtleFg`,
    border: `color.${tone}.border`,
  };
}

/** A vertical stack of muted bones (body/content placeholder lines). */
function bodyLines(vars: VariableRegistry, w: number, widths: number[]): FrameNode {
  const stack = box(w, 40);
  stack.layoutMode = 'VERTICAL';
  stack.primaryAxisSizingMode = 'AUTO';
  stack.counterAxisSizingMode = 'FIXED';
  stack.counterAxisAlignItems = 'MIN';
  stack.resize(w, stack.height);
  stack.fills = [];
  bindDim(stack, 'itemSpacing', vars, 'space.2');
  for (const lw of widths) {
    const line = box(lw, 9);
    applyFill(line, vars, 'color.bg.muted');
    bindRadius(line, vars, 'radius.sm');
    stack.appendChild(line);
  }
  return stack;
}

/** A compact bound-token action button (ghost or brand). */
function miniButton(
  vars: VariableRegistry,
  fonts: DocFonts,
  txt: string,
  primary: boolean,
): FrameNode {
  const b = box(72, 32);
  b.layoutMode = 'HORIZONTAL';
  b.primaryAxisAlignItems = 'CENTER';
  b.counterAxisAlignItems = 'CENTER';
  b.primaryAxisSizingMode = 'AUTO';
  b.counterAxisSizingMode = 'FIXED';
  b.resize(b.width, 32);
  bindDim(b, 'paddingLeft', vars, 'space.3');
  bindDim(b, 'paddingRight', vars, 'space.3');
  applyFill(b, vars, primary ? 'color.brand.solid' : 'transparent');
  if (!primary) applyStroke(b, vars, 'color.border.default', 'border.width.1', 1);
  bindRadius(b, vars, 'radius.control');
  b.appendChild(
    labelText(
      fonts.semibold,
      txt,
      vars,
      primary ? 'color.brand.fg' : 'color.fg.default',
      'font.size.sm',
      13,
    ),
  );
  return b;
}

/** Modal — scrim + rounded dialog panel: title/close · body lines · footer buttons. */
const modal: Recipe = ({ node, combo, vars, effects, placeholder, fonts, icons }) => {
  const size = combo.size;
  const type = combo.type;
  const W = 460;
  const H = 320;
  node.resize(W, H);
  applyFill(node, vars, 'color.overlay');
  node.strokes = [];
  node.clipsContent = true;

  const fullscreen = type === 'C' || size === 'full';
  const sheet = type === 'B';
  const panelW = fullscreen
    ? W
    : sheet
      ? W
      : size === 'sm'
        ? 300
        : size === 'lg'
          ? 380
          : size === 'xl'
            ? 420
            : 340;
  const panelH = fullscreen ? H : sheet ? 224 : 214;

  const panel = box(panelW, panelH);
  panel.layoutMode = 'VERTICAL';
  panel.primaryAxisSizingMode = 'FIXED';
  panel.counterAxisSizingMode = 'FIXED';
  panel.counterAxisAlignItems = 'MIN';
  panel.itemSpacing = 0;
  applyFill(panel, vars, 'color.bg.surface');
  panel.clipsContent = true;
  if (fullscreen) {
    bindRadius(panel, vars, 'radius.none');
  } else if (sheet) {
    const rv = vars.get('radius.surface');
    if (rv) {
      panel.setBoundVariable('topLeftRadius', rv);
      panel.setBoundVariable('topRightRadius', rv);
    }
    panel.bottomLeftRadius = 0;
    panel.bottomRightRadius = 0;
  } else {
    bindRadius(panel, vars, 'radius.surface');
  }
  const sid = effects.get('shadow.xl');
  if (sid) void panel.setEffectStyleIdAsync(sid);

  if (sheet) {
    const grip = box(36, 4);
    applyFill(grip, vars, 'color.border.strong');
    bindRadius(grip, vars, 'radius.pill');
    absChild(panel, grip, (panelW - 36) / 2, 8);
  }

  // Header — heading block (title + description) + close glyph.
  const header = box(panelW, 48);
  header.layoutMode = 'HORIZONTAL';
  header.counterAxisAlignItems = 'MIN';
  header.primaryAxisSizingMode = 'FIXED';
  header.counterAxisSizingMode = 'AUTO';
  header.resize(panelW, 48);
  header.fills = [];
  bindDim(header, 'itemSpacing', vars, 'space.3');
  bindDim(header, 'paddingLeft', vars, 'space.6');
  bindDim(header, 'paddingRight', vars, 'space.6');
  bindDim(header, 'paddingTop', vars, sheet ? 'space.5' : 'space.5');
  bindDim(header, 'paddingBottom', vars, 'space.3');
  const heading = box(panelW - 80, 40);
  heading.layoutMode = 'VERTICAL';
  heading.primaryAxisSizingMode = 'AUTO';
  heading.counterAxisSizingMode = 'AUTO';
  heading.counterAxisAlignItems = 'MIN';
  heading.fills = [];
  bindDim(heading, 'itemSpacing', vars, 'space.1');
  const title = labelText(
    fonts.semibold,
    'Dialog title',
    vars,
    'color.fg.default',
    'font.size.lg',
    18,
  );
  heading.appendChild(title);
  const desc = labelText(
    fonts.regular,
    'A short supporting description.',
    vars,
    'color.fg.muted',
    'font.size.sm',
    13,
  );
  heading.appendChild(desc);
  header.appendChild(heading);
  fillGrow(heading);
  const close = iconGlyph(icons, 'close', 16, vars, 'color.fg.muted');
  place(header, close);
  panel.appendChild(header);
  fillGrow(header);

  // Body — muted lines.
  const body = bodyLines(vars, panelW, [panelW - 48, panelW - 48, panelW - 120]);
  bindDim(body, 'paddingLeft', vars, 'space.6');
  bindDim(body, 'paddingRight', vars, 'space.6');
  bindDim(body, 'paddingBottom', vars, 'space.5');
  panel.appendChild(body);
  fillGrow(body);

  const sep = hairline(vars, 'color.border.subtle', panelW, 1, false);
  panel.appendChild(sep);
  fillGrow(sep);

  // Footer — right-aligned action buttons + the swappable footer slot.
  const footer = box(panelW, 56);
  footer.layoutMode = 'HORIZONTAL';
  footer.primaryAxisAlignItems = 'MAX';
  footer.counterAxisAlignItems = 'CENTER';
  footer.primaryAxisSizingMode = 'FIXED';
  footer.counterAxisSizingMode = 'AUTO';
  footer.resize(panelW, 56);
  footer.fills = [];
  bindDim(footer, 'itemSpacing', vars, 'space.2');
  bindDim(footer, 'paddingLeft', vars, 'space.6');
  bindDim(footer, 'paddingRight', vars, 'space.6');
  bindDim(footer, 'paddingTop', vars, 'space.4');
  bindDim(footer, 'paddingBottom', vars, 'space.4');
  const footerSlot = iconSlot(placeholder, 'Footer', 16);
  footerSlot.visible = false;
  place(footer, footerSlot);
  place(footer, miniButton(vars, fonts, 'Cancel', false));
  place(footer, miniButton(vars, fonts, 'Confirm', true));
  panel.appendChild(footer);
  fillGrow(footer);

  node.appendChild(panel);
  if (fullscreen) {
    panel.x = 0;
    panel.y = 0;
  } else if (sheet) {
    panel.x = 0;
    panel.y = H - panelH;
  } else {
    panel.x = (W - panelW) / 2;
    panel.y = combo.placement === 'top' ? 24 : (H - panelH) / 2;
  }

  const open = hiddenMarker(node, vars);

  return { node, label: title, swaps: { footer: footerSlot }, bools: { open, closable: close } };
};

/** Drawer — scrim + edge-anchored panel per side: title/close · body · footer. */
const drawer: Recipe = ({ node, combo, vars, effects, placeholder, fonts, icons }) => {
  const side = combo.side;
  const size = combo.size;
  const type = combo.type;
  const W = 460;
  const H = 300;
  node.resize(W, H);
  applyFill(node, vars, 'color.overlay');
  node.strokes = [];
  node.clipsContent = true;

  const horizontal = side === 'left' || side === 'right';
  const floating = type === 'B';
  const full = type === 'C';
  const inset = floating ? 16 : 0;
  let panelW: number;
  let panelH: number;
  if (horizontal) {
    panelW = full ? 320 : size === 'sm' ? 200 : size === 'lg' ? 320 : 260;
    panelH = H - inset * 2;
  } else {
    panelH = full ? H : size === 'sm' ? 150 : size === 'lg' ? 240 : 196;
    panelW = W - inset * 2;
  }

  const panel = box(panelW, panelH);
  panel.layoutMode = 'VERTICAL';
  panel.primaryAxisSizingMode = 'FIXED';
  panel.counterAxisSizingMode = 'FIXED';
  panel.counterAxisAlignItems = 'MIN';
  panel.itemSpacing = 0;
  applyFill(panel, vars, 'color.bg.surface');
  panel.clipsContent = true;
  const rv = vars.get('radius.surface');
  if (rv) {
    if (floating) {
      for (const c of CORNERS) panel.setBoundVariable(c, rv);
    } else if (side === 'top') {
      panel.setBoundVariable('bottomLeftRadius', rv);
      panel.setBoundVariable('bottomRightRadius', rv);
    } else if (side === 'bottom') {
      panel.setBoundVariable('topLeftRadius', rv);
      panel.setBoundVariable('topRightRadius', rv);
    }
  }
  const sid = effects.get('shadow.xl');
  if (sid) void panel.setEffectStyleIdAsync(sid);

  // Header — title + close, with a bottom divider.
  const header = box(panelW, 44);
  header.layoutMode = 'HORIZONTAL';
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';
  header.primaryAxisSizingMode = 'FIXED';
  header.counterAxisSizingMode = 'AUTO';
  header.resize(panelW, 44);
  header.fills = [];
  bindDim(header, 'itemSpacing', vars, 'space.3');
  bindDim(header, 'paddingTop', vars, 'space.4');
  bindDim(header, 'paddingBottom', vars, 'space.4');
  bindDim(header, 'paddingLeft', vars, 'space.5');
  bindDim(header, 'paddingRight', vars, 'space.5');
  const title = labelText(fonts.semibold, 'Panel', vars, 'color.fg.default', 'font.size.lg', 18);
  header.appendChild(title);
  fillGrow(title);
  const close = iconGlyph(icons, 'close', 16, vars, 'color.fg.muted');
  place(header, close);
  panel.appendChild(header);
  fillGrow(header);
  const sepTop = hairline(vars, 'color.border.subtle', panelW, 1, false);
  panel.appendChild(sepTop);
  fillGrow(sepTop);

  // Body.
  const body = bodyLines(
    vars,
    panelW,
    horizontal
      ? [panelW - 48, panelW - 40, panelW - 88, panelW - 60]
      : [panelW - 80, panelW - 40, panelW - 120],
  );
  bindDim(body, 'paddingTop', vars, 'space.5');
  bindDim(body, 'paddingLeft', vars, 'space.5');
  bindDim(body, 'paddingRight', vars, 'space.5');
  panel.appendChild(body);
  fillGrow(body);

  // Footer — divider + buttons + swap slot.
  const sepBot = hairline(vars, 'color.border.subtle', panelW, 1, false);
  panel.appendChild(sepBot);
  fillGrow(sepBot);
  const footer = box(panelW, 56);
  footer.layoutMode = 'HORIZONTAL';
  footer.primaryAxisAlignItems = 'MAX';
  footer.counterAxisAlignItems = 'CENTER';
  footer.primaryAxisSizingMode = 'FIXED';
  footer.counterAxisSizingMode = 'AUTO';
  footer.resize(panelW, 56);
  footer.fills = [];
  bindDim(footer, 'itemSpacing', vars, 'space.2');
  bindDim(footer, 'paddingTop', vars, 'space.4');
  bindDim(footer, 'paddingBottom', vars, 'space.4');
  bindDim(footer, 'paddingLeft', vars, 'space.5');
  bindDim(footer, 'paddingRight', vars, 'space.5');
  const footerSlot = iconSlot(placeholder, 'Footer', 16);
  footerSlot.visible = false;
  place(footer, footerSlot);
  place(footer, miniButton(vars, fonts, 'Save', true));
  panel.appendChild(footer);
  fillGrow(footer);

  node.appendChild(panel);
  if (side === 'right') {
    panel.x = W - panelW - inset;
    panel.y = inset;
  } else if (side === 'left') {
    panel.x = inset;
    panel.y = inset;
  } else if (side === 'top') {
    panel.x = inset;
    panel.y = inset;
  } else {
    panel.x = inset;
    panel.y = H - panelH - inset;
  }

  const open = hiddenMarker(node, vars);

  return { node, label: title, swaps: { footer: footerSlot }, bools: { open, closable: close } };
};

/** A single nav link (text, optionally the active/brand-emphasized one). */
function navLink(
  vars: VariableRegistry,
  fonts: DocFonts,
  txt: string,
  active: boolean,
  fontPx: number,
): FrameNode {
  const l = box(60, 32);
  l.layoutMode = 'HORIZONTAL';
  l.primaryAxisAlignItems = 'CENTER';
  l.counterAxisAlignItems = 'CENTER';
  l.primaryAxisSizingMode = 'AUTO';
  l.counterAxisSizingMode = 'AUTO';
  l.fills = [];
  bindDim(l, 'paddingLeft', vars, 'space.3');
  bindDim(l, 'paddingRight', vars, 'space.3');
  bindDim(l, 'paddingTop', vars, 'space.2');
  bindDim(l, 'paddingBottom', vars, 'space.2');
  bindRadius(l, vars, 'radius.control');
  if (active) applyFill(l, vars, 'color.brand.subtle');
  l.appendChild(
    labelText(
      fonts.medium,
      txt,
      vars,
      active ? 'color.brand.solid' : 'color.fg.muted',
      'font.size.sm',
      fontPx,
    ),
  );
  return l;
}

/** Header — app top bar: brand + nav links + actions; surface/transparent/elevated; A/B/C. */
const header: Recipe = ({ node, combo, vars, effects, placeholder, fonts }) => {
  const variant = combo.variant;
  const type = combo.type;
  const size = combo.size;
  const sticky = combo.sticky === 'true';
  const h = type === 'C' ? 52 : size === 'sm' ? 52 : size === 'lg' ? 76 : 64;
  const W = 680;
  const centered = type === 'B';
  const compact = type === 'C';

  const swaps: Record<string, InstanceNode> = {};
  const surfaceFill = variant === 'transparent' ? 'transparent' : 'color.bg.surface';

  const buildBrand = (): FrameNode => {
    const brand = box(120, 28);
    brand.layoutMode = 'HORIZONTAL';
    brand.counterAxisAlignItems = 'CENTER';
    brand.primaryAxisSizingMode = 'AUTO';
    brand.counterAxisSizingMode = 'AUTO';
    brand.fills = [];
    bindDim(brand, 'itemSpacing', vars, 'space.2');
    const brandSlot = iconSlot(placeholder, 'Brand', 24);
    brand.appendChild(brandSlot);
    swaps.brand = brandSlot;
    brand.appendChild(labelText(fonts.bold, 'Acme', vars, 'color.fg.default', 'font.size.lg', 18));
    return brand;
  };
  const buildNav = (align: 'MIN' | 'CENTER'): FrameNode => {
    const nav = box(300, 32);
    nav.layoutMode = 'HORIZONTAL';
    nav.counterAxisAlignItems = 'CENTER';
    nav.primaryAxisAlignItems = align;
    nav.primaryAxisSizingMode = 'FIXED';
    nav.counterAxisSizingMode = 'AUTO';
    nav.resize(300, 32);
    nav.fills = [];
    bindDim(nav, 'itemSpacing', vars, 'space.1');
    ['Product', 'Pricing', 'Docs', 'About'].forEach((t, i) =>
      place(nav, navLink(vars, fonts, t, i === 0, 14)),
    );
    return nav;
  };
  const buildActions = (): FrameNode => {
    const actions = box(80, 32);
    actions.layoutMode = 'HORIZONTAL';
    actions.counterAxisAlignItems = 'CENTER';
    actions.primaryAxisAlignItems = 'MAX';
    actions.primaryAxisSizingMode = 'AUTO';
    actions.counterAxisSizingMode = 'AUTO';
    actions.fills = [];
    bindDim(actions, 'itemSpacing', vars, 'space.2');
    const actionSlot = iconSlot(placeholder, 'Actions', 20);
    actions.appendChild(actionSlot);
    swaps.actions = actionSlot;
    const avatar = circle(28);
    applyFill(avatar, vars, 'color.brand.subtle');
    place(actions, avatar);
    return actions;
  };
  const applyElevation = (n: ComponentNode | FrameNode) => {
    if (variant === 'elevated' || sticky) {
      const sid = effects.get('shadow.sm');
      if (sid) void n.setEffectStyleIdAsync(sid);
    }
  };

  if (centered) {
    // Header.css Type B: brand centered in the bar, nav on its OWN row below (border-top).
    node.layoutMode = 'VERTICAL';
    node.counterAxisAlignItems = 'MIN';
    node.primaryAxisSizingMode = 'AUTO';
    node.counterAxisSizingMode = 'FIXED';
    node.resize(W, node.height);
    node.itemSpacing = 0;
    applyFill(node, vars, surfaceFill);
    applyElevation(node);
    node.clipsContent = true;

    const bar = box(W, h);
    bar.layoutMode = 'HORIZONTAL';
    bar.primaryAxisAlignItems = 'CENTER';
    bar.counterAxisAlignItems = 'CENTER';
    bar.primaryAxisSizingMode = 'FIXED';
    bar.counterAxisSizingMode = 'FIXED';
    bar.resize(W, h);
    bar.fills = [];
    bar.appendChild(buildBrand()); // centered single child
    const actions = buildActions();
    absChild(bar, actions, W - 140, Math.round((h - 32) / 2));
    const searchSlot = iconSlot(placeholder, 'Search', 20);
    searchSlot.visible = false;
    absChild(bar, searchSlot, 24, Math.round((h - 20) / 2));
    swaps.search = searchSlot;
    node.appendChild(bar);
    fillGrow(bar);

    const navrow = box(W, 44);
    navrow.layoutMode = 'HORIZONTAL';
    navrow.primaryAxisAlignItems = 'CENTER';
    navrow.counterAxisAlignItems = 'CENTER';
    navrow.primaryAxisSizingMode = 'FIXED';
    navrow.counterAxisSizingMode = 'FIXED';
    navrow.resize(W, 44);
    navrow.fills = [];
    applyStroke(navrow, vars, 'color.border.subtle', 'border.width.1', 1);
    const ns = navrow as FrameNode & {
      strokeTopWeight: number;
      strokeRightWeight: number;
      strokeBottomWeight: number;
      strokeLeftWeight: number;
    };
    ns.strokeLeftWeight = 0;
    ns.strokeRightWeight = 0;
    ns.strokeTopWeight = 1;
    // The header's own bottom border (surface variant only) sits under the nav row.
    ns.strokeBottomWeight = variant === 'surface' ? 1 : 0;
    navrow.appendChild(buildNav('CENTER'));
    node.appendChild(navrow);
    fillGrow(navrow);

    const menuOpen = hiddenMarker(node, vars);
    return { node, label: null, swaps, bools: { menuOpen } };
  }

  // Type A (standard) · Type C (compact, nav hidden) — a single row.
  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'CENTER';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.resize(W, h);
  bindDim(node, 'itemSpacing', vars, 'space.6');
  bindDim(node, 'paddingLeft', vars, 'space.6');
  bindDim(node, 'paddingRight', vars, 'space.6');
  applyFill(node, vars, surfaceFill);
  applyElevation(node);
  node.clipsContent = true;

  place(node, buildBrand());

  const nav = buildNav('MIN');
  nav.visible = !compact;
  node.appendChild(nav);
  fillGrow(nav);

  const searchSlot = iconSlot(placeholder, 'Search', 20);
  searchSlot.visible = false;
  place(node, searchSlot);
  swaps.search = searchSlot;

  place(node, buildActions());

  if (variant === 'surface') {
    const line = hairline(vars, 'color.border.subtle', W, 1, false);
    absChild(node, line, 0, h - 1);
  }

  const menuOpen = hiddenMarker(node, vars);
  return { node, label: null, swaps, bools: { menuOpen } };
};

/** Navbar — brand + a row of links (one active) aligned per `align` + actions; A/B. */
const navbar: Recipe = ({ node, combo, vars, effects, placeholder, fonts }) => {
  const variant = combo.variant;
  const size = combo.size;
  const type = combo.type;
  const sticky = combo.sticky === 'true';
  const align = combo.align;
  const barH = size === 'sm' ? 48 : size === 'lg' ? 64 : 56;
  const W = 680;
  const rowNav = type === 'B';

  node.layoutMode = 'VERTICAL';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.counterAxisAlignItems = 'MIN';
  node.resize(W, node.height);
  node.itemSpacing = 0;
  applyFill(node, vars, variant === 'transparent' ? 'transparent' : 'color.bg.surface');
  if (variant === 'elevated' || sticky) {
    const sid = effects.get('shadow.sm');
    if (sid) void node.setEffectStyleIdAsync(sid);
  }
  node.clipsContent = true;

  const swaps: Record<string, InstanceNode> = {};

  const mkNav = (): FrameNode => {
    const nav = box(320, 32);
    nav.layoutMode = 'HORIZONTAL';
    nav.counterAxisAlignItems = 'CENTER';
    nav.primaryAxisAlignItems = align === 'center' ? 'CENTER' : align === 'end' ? 'MAX' : 'MIN';
    nav.primaryAxisSizingMode = 'FIXED';
    nav.counterAxisSizingMode = 'AUTO';
    nav.resize(320, 32);
    nav.fills = [];
    bindDim(nav, 'itemSpacing', vars, 'space.1');
    ['Home', 'Features', 'Team', 'Contact'].forEach((t, i) =>
      place(nav, navLink(vars, fonts, t, i === 0, 14)),
    );
    return nav;
  };

  // Bar row — brand + (inline nav for Type A) + actions.
  const bar = box(W, barH);
  bar.layoutMode = 'HORIZONTAL';
  bar.counterAxisAlignItems = 'CENTER';
  bar.primaryAxisAlignItems = 'MIN';
  bar.primaryAxisSizingMode = 'FIXED';
  bar.counterAxisSizingMode = 'FIXED';
  bar.resize(W, barH);
  bar.fills = [];
  bindDim(bar, 'itemSpacing', vars, 'space.4');
  bindDim(bar, 'paddingLeft', vars, 'space.6');
  bindDim(bar, 'paddingRight', vars, 'space.6');

  const brand = box(110, 28);
  brand.layoutMode = 'HORIZONTAL';
  brand.counterAxisAlignItems = 'CENTER';
  brand.primaryAxisSizingMode = 'AUTO';
  brand.counterAxisSizingMode = 'AUTO';
  brand.fills = [];
  bindDim(brand, 'itemSpacing', vars, 'space.2');
  const brandSlot = iconSlot(placeholder, 'Brand', 22);
  brand.appendChild(brandSlot);
  swaps.brand = brandSlot;
  brand.appendChild(labelText(fonts.bold, 'Nova', vars, 'color.fg.default', 'font.size.lg', 18));
  place(bar, brand);

  if (!rowNav) {
    const nav = mkNav();
    bar.appendChild(nav);
    fillGrow(nav);
  } else {
    const spacer = box(20, 1);
    spacer.fills = [];
    bar.appendChild(spacer);
    fillGrow(spacer);
  }

  const actions = box(70, 32);
  actions.layoutMode = 'HORIZONTAL';
  actions.counterAxisAlignItems = 'CENTER';
  actions.primaryAxisAlignItems = 'MAX';
  actions.primaryAxisSizingMode = 'AUTO';
  actions.counterAxisSizingMode = 'AUTO';
  actions.fills = [];
  bindDim(actions, 'itemSpacing', vars, 'space.2');
  const actionSlot = iconSlot(placeholder, 'Actions', 20);
  actions.appendChild(actionSlot);
  swaps.actions = actionSlot;
  place(bar, actions);
  node.appendChild(bar);
  fillGrow(bar);

  if (variant === 'surface') {
    const line = hairline(vars, 'color.border.subtle', W, 1, false);
    node.appendChild(line);
    fillGrow(line);
  }

  // Type B — nav on its own row below the bar.
  if (rowNav) {
    const navrow = box(W, 40);
    navrow.layoutMode = 'HORIZONTAL';
    navrow.counterAxisAlignItems = 'CENTER';
    navrow.primaryAxisSizingMode = 'FIXED';
    navrow.counterAxisSizingMode = 'AUTO';
    navrow.resize(W, 40);
    navrow.fills = [];
    bindDim(navrow, 'paddingLeft', vars, 'space.6');
    bindDim(navrow, 'paddingRight', vars, 'space.6');
    bindDim(navrow, 'paddingTop', vars, 'space.2');
    bindDim(navrow, 'paddingBottom', vars, 'space.2');
    const nav = mkNav();
    navrow.appendChild(nav);
    fillGrow(nav);
    node.appendChild(navrow);
    fillGrow(navrow);
  }

  const menuOpen = hiddenMarker(node, vars);

  return { node, label: null, swaps, bools: { menuOpen } };
};

/** A footer link-column: a heading + a few muted link labels. */
function footerColumn(
  vars: VariableRegistry,
  fonts: DocFonts,
  heading: string,
  links: string[],
): FrameNode {
  const col = box(120, 100);
  col.layoutMode = 'VERTICAL';
  col.primaryAxisSizingMode = 'AUTO';
  col.counterAxisSizingMode = 'AUTO';
  col.counterAxisAlignItems = 'MIN';
  col.fills = [];
  bindDim(col, 'itemSpacing', vars, 'space.2');
  col.appendChild(labelText(fonts.semibold, heading, vars, 'color.fg.default', 'font.size.sm', 13));
  for (const l of links)
    col.appendChild(labelText(fonts.regular, l, vars, 'color.fg.muted', 'font.size.sm', 13));
  return col;
}

/** Footer — brand + link columns + a bottom copyright bar; surface/transparent; A/B/C. */
const footer: Recipe = ({ node, combo, vars, placeholder, fonts }) => {
  const variant = combo.variant;
  const type = combo.type;
  const W = 680;
  const centered = type === 'B';
  const minimal = type === 'C';

  node.layoutMode = 'VERTICAL';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.counterAxisAlignItems = centered ? 'CENTER' : 'MIN';
  node.resize(W, node.height);
  applyFill(node, vars, variant === 'transparent' ? 'transparent' : 'color.bg.surface');
  bindDim(node, 'itemSpacing', vars, 'space.6');
  bindDim(node, 'paddingLeft', vars, 'space.6');
  bindDim(node, 'paddingRight', vars, 'space.6');
  bindDim(node, 'paddingTop', vars, minimal ? 'space.5' : 'space.8');
  bindDim(node, 'paddingBottom', vars, minimal ? 'space.5' : 'space.8');

  const swaps: Record<string, InstanceNode> = {};

  const brandSlot = iconSlot(placeholder, 'Brand', 24);
  let description: TextNode | null = null;

  // Top area — brand block + columns (skipped on minimal Type C).
  if (!minimal) {
    const top = box(W - 48, 120);
    top.layoutMode = 'HORIZONTAL';
    top.primaryAxisAlignItems = centered ? 'CENTER' : 'SPACE_BETWEEN';
    top.counterAxisAlignItems = 'MIN';
    top.primaryAxisSizingMode = 'FIXED';
    top.counterAxisSizingMode = 'AUTO';
    top.resize(W - 48, top.height);
    top.fills = [];
    bindDim(top, 'itemSpacing', vars, 'space.8');

    const brandBlock = box(240, 80);
    brandBlock.layoutMode = 'VERTICAL';
    brandBlock.primaryAxisSizingMode = 'AUTO';
    brandBlock.counterAxisSizingMode = 'AUTO';
    brandBlock.counterAxisAlignItems = centered ? 'CENTER' : 'MIN';
    brandBlock.fills = [];
    bindDim(brandBlock, 'itemSpacing', vars, 'space.2');
    const brandRow = box(120, 28);
    brandRow.layoutMode = 'HORIZONTAL';
    brandRow.counterAxisAlignItems = 'CENTER';
    brandRow.primaryAxisSizingMode = 'AUTO';
    brandRow.counterAxisSizingMode = 'AUTO';
    brandRow.fills = [];
    bindDim(brandRow, 'itemSpacing', vars, 'space.2');
    brandRow.appendChild(brandSlot);
    brandRow.appendChild(
      labelText(fonts.bold, 'Acme', vars, 'color.fg.default', 'font.size.lg', 18),
    );
    brandBlock.appendChild(brandRow);
    description = labelText(
      fonts.regular,
      'Build faster with a unified design system.',
      vars,
      'color.fg.muted',
      'font.size.sm',
      13,
    );
    brandBlock.appendChild(description);
    place(top, brandBlock);

    if (!centered) {
      const cols = box(360, 110);
      cols.layoutMode = 'HORIZONTAL';
      cols.primaryAxisAlignItems = 'MAX';
      cols.counterAxisAlignItems = 'MIN';
      cols.primaryAxisSizingMode = 'AUTO';
      cols.counterAxisSizingMode = 'AUTO';
      cols.fills = [];
      bindDim(cols, 'itemSpacing', vars, 'space.6');
      cols.appendChild(footerColumn(vars, fonts, 'Product', ['Features', 'Pricing', 'Changelog']));
      cols.appendChild(footerColumn(vars, fonts, 'Company', ['About', 'Careers', 'Blog']));
      cols.appendChild(footerColumn(vars, fonts, 'Support', ['Help', 'Contact', 'Status']));
      place(top, cols);
    }
    node.appendChild(top);
    fillGrow(top);

    const sep = hairline(vars, 'color.border.subtle', W - 48, 1, false);
    node.appendChild(sep);
    if (!centered) fillGrow(sep);
  } else {
    description = labelText(
      fonts.regular,
      'Build faster with a unified design system.',
      vars,
      'color.fg.muted',
      'font.size.sm',
      13,
    );
    description.visible = false;
    node.appendChild(description);
    brandSlot.visible = false;
    node.appendChild(brandSlot);
  }
  swaps.brand = brandSlot;

  // Bottom bar — copyright + legal links + social slot.
  const bottom = box(W - 48, 28);
  bottom.layoutMode = 'HORIZONTAL';
  bottom.counterAxisAlignItems = 'CENTER';
  bottom.primaryAxisAlignItems = centered ? 'CENTER' : 'MIN';
  bottom.primaryAxisSizingMode = 'FIXED';
  bottom.counterAxisSizingMode = 'AUTO';
  bottom.resize(W - 48, 28);
  bottom.fills = [];
  bindDim(bottom, 'itemSpacing', vars, 'space.4');
  bottom.appendChild(
    labelText(fonts.regular, '© 2026 Acme, Inc.', vars, 'color.fg.muted', 'font.size.sm', 13),
  );
  const legal = box(140, 20);
  legal.layoutMode = 'HORIZONTAL';
  legal.counterAxisAlignItems = 'CENTER';
  legal.primaryAxisSizingMode = 'AUTO';
  legal.counterAxisSizingMode = 'AUTO';
  legal.fills = [];
  bindDim(legal, 'itemSpacing', vars, 'space.4');
  for (const l of ['Privacy', 'Terms'])
    legal.appendChild(labelText(fonts.regular, l, vars, 'color.fg.muted', 'font.size.sm', 13));
  place(bottom, legal);
  fillGrow(legal);
  const newsletterSlot = iconSlot(placeholder, 'Newsletter', 18);
  newsletterSlot.visible = false;
  place(bottom, newsletterSlot);
  swaps.newsletter = newsletterSlot;
  const socialSlot = iconSlot(placeholder, 'Social', 20);
  place(bottom, socialSlot);
  swaps.social = socialSlot;
  node.appendChild(bottom);
  fillGrow(bottom);

  return { node, label: description, swaps, bools: {} };
};

/** Sidebar — vertical nav rail: brand + nav items (one active) + footer; surface/floating. */
const sidebar: Recipe = ({ node, combo, vars, effects, placeholder, fonts }) => {
  const variant = combo.variant;
  const width = combo.width;
  const collapsed = combo.collapsed === 'true';
  const type = combo.type;
  const boxed = type === 'C';
  const W = collapsed ? 72 : width === 'narrow' ? 200 : width === 'wide' ? 280 : 240;
  const H = 360;
  const itemPadY = type === 'B' ? 'space.1.5' : 'space.2';

  node.layoutMode = 'VERTICAL';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.counterAxisAlignItems = 'MIN';
  node.resize(W, H);
  applyFill(node, vars, 'color.bg.surface');
  bindDim(node, 'itemSpacing', vars, 'space.4');
  bindDim(node, 'paddingTop', vars, 'space.4');
  bindDim(node, 'paddingBottom', vars, 'space.4');
  bindDim(node, 'paddingLeft', vars, 'space.3');
  bindDim(node, 'paddingRight', vars, 'space.3');
  node.clipsContent = true;
  if (variant === 'floating') {
    applyStroke(node, vars, 'color.border.default', 'border.width.1', 1);
    bindRadius(node, vars, 'radius.xl');
    // Sidebar.css [data-variant='floating'] carries shadow.sm.
    const sid = effects.get('shadow.sm');
    if (sid) void node.setEffectStyleIdAsync(sid);
  }

  const swaps: Record<string, InstanceNode> = {};

  // Header — brand slot + wordmark (wordmark hidden when collapsed).
  const head = box(W - 24, 32);
  head.layoutMode = 'HORIZONTAL';
  head.counterAxisAlignItems = 'CENTER';
  head.primaryAxisAlignItems = collapsed ? 'CENTER' : 'MIN';
  head.primaryAxisSizingMode = 'FIXED';
  head.counterAxisSizingMode = 'AUTO';
  head.resize(W - 24, 32);
  head.fills = [];
  bindDim(head, 'itemSpacing', vars, 'space.2');
  bindDim(head, 'paddingLeft', vars, 'space.2');
  bindDim(head, 'paddingRight', vars, 'space.2');
  const headerSlot = iconSlot(placeholder, 'Header', 24);
  head.appendChild(headerSlot);
  swaps.header = headerSlot;
  const brandWord = labelText(fonts.bold, 'Console', vars, 'color.fg.default', 'font.size.md', 15);
  brandWord.visible = !collapsed;
  head.appendChild(brandWord);
  fillGrow(brandWord);
  node.appendChild(head);
  fillGrow(head);

  // Body — nav items (first active).
  const body = box(W - 24, 200);
  body.layoutMode = 'VERTICAL';
  body.primaryAxisSizingMode = 'AUTO';
  body.counterAxisSizingMode = 'FIXED';
  body.counterAxisAlignItems = 'MIN';
  body.resize(W - 24, body.height);
  body.fills = [];
  bindDim(body, 'itemSpacing', vars, 'space.0.5');
  if (boxed) {
    applyFill(body, vars, 'color.bg.subtle');
    applyStroke(body, vars, 'color.border.subtle', 'border.width.1', 1);
    bindRadius(body, vars, 'radius.lg');
    bindDim(body, 'paddingTop', vars, 'space.2');
    bindDim(body, 'paddingBottom', vars, 'space.2');
    bindDim(body, 'paddingLeft', vars, 'space.2');
    bindDim(body, 'paddingRight', vars, 'space.2');
  }

  // Section label (Sidebar.Section) — uppercase, subtle, semibold; hidden when collapsed.
  if (!collapsed) {
    const sectionLabel = labelText(fonts.semibold, 'MENU', vars, 'color.fg.subtle', 'font.size.xs', 11);
    body.appendChild(sectionLabel);
  }

  ['Dashboard', 'Projects', 'Members', 'Reports', 'Settings'].forEach((t, i) => {
    const active = i === 0;
    const item = box(W - 24, 36);
    item.layoutMode = 'HORIZONTAL';
    item.counterAxisAlignItems = 'CENTER';
    item.primaryAxisAlignItems = collapsed ? 'CENTER' : 'MIN';
    item.primaryAxisSizingMode = 'FIXED';
    item.counterAxisSizingMode = 'AUTO';
    item.resize(W - 24, 36);
    item.fills = [];
    bindDim(item, 'itemSpacing', vars, type === 'B' ? 'space.2' : 'space.3');
    bindDim(item, 'paddingTop', vars, itemPadY);
    bindDim(item, 'paddingBottom', vars, itemPadY);
    if (!collapsed) {
      bindDim(item, 'paddingLeft', vars, 'space.3');
      bindDim(item, 'paddingRight', vars, 'space.3');
    }
    bindRadius(item, vars, 'radius.md');
    if (active) applyFill(item, vars, boxed ? 'color.bg.surface' : 'color.brand.subtle');
    const dot = iconSlot(placeholder, 'Item', 18);
    place(item, dot);
    const lbl = labelText(
      fonts.medium,
      t,
      vars,
      active ? 'color.brand.subtleFg' : 'color.fg.muted',
      'font.size.sm',
      14,
    );
    lbl.visible = !collapsed;
    item.appendChild(lbl);
    fillGrow(lbl);
    body.appendChild(item);
    fillGrow(item);
  });
  node.appendChild(body);
  fillGrow(body);

  // Footer — top divider + slot.
  const sep = hairline(vars, 'color.border.subtle', W - 24, 1, false);
  node.appendChild(sep);
  fillGrow(sep);
  const foot = box(W - 24, 40);
  foot.layoutMode = 'HORIZONTAL';
  foot.counterAxisAlignItems = 'CENTER';
  foot.primaryAxisAlignItems = collapsed ? 'CENTER' : 'MIN';
  foot.primaryAxisSizingMode = 'FIXED';
  foot.counterAxisSizingMode = 'AUTO';
  foot.resize(W - 24, 40);
  foot.fills = [];
  bindDim(foot, 'itemSpacing', vars, 'space.2');
  bindDim(foot, 'paddingTop', vars, 'space.2');
  bindDim(foot, 'paddingLeft', vars, 'space.2');
  bindDim(foot, 'paddingRight', vars, 'space.2');
  const footerSlot = iconSlot(placeholder, 'Footer', 24);
  foot.appendChild(footerSlot);
  swaps.footer = footerSlot;
  const footWord = labelText(
    fonts.medium,
    'Jane Doe',
    vars,
    'color.fg.default',
    'font.size.sm',
    13,
  );
  footWord.visible = !collapsed;
  foot.appendChild(footWord);
  fillGrow(footWord);
  node.appendChild(foot);
  fillGrow(foot);

  if (variant === 'surface') {
    const edge = hairline(vars, 'color.border.subtle', 1, H, false);
    absChild(node, edge, W - 1, 0);
  }

  return { node, label: null, swaps, bools: {} };
};

/** Alert — tone icon + title/body + optional close/action; subtle/solid/outline; A/B/C. */
const alert: Recipe = ({ node, combo, vars, placeholder, fonts, icons }) => {
  const tone = combo.tone || 'info';
  const variant = combo.variant;
  const type = combo.type;
  const t = toneVars(tone);
  const solid = variant === 'solid';
  const banner = type === 'B';
  const prominent = type === 'C';
  const W = banner ? 480 : 360;

  const fillId = solid ? t.solid : variant === 'outline' ? 'color.bg.surface' : t.subtle;
  const textId = solid ? t.onSolid : 'color.fg.default';
  const strokeId = solid ? undefined : t.border;

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = banner ? 'CENTER' : 'MIN';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'AUTO';
  node.resize(W, node.height);
  bindDim(node, 'itemSpacing', vars, 'space.3');
  bindDim(node, 'paddingTop', vars, prominent ? 'space.4' : 'space.3');
  bindDim(node, 'paddingBottom', vars, prominent ? 'space.4' : 'space.3');
  bindDim(node, 'paddingLeft', vars, prominent ? 'space.5' : 'space.4');
  bindDim(node, 'paddingRight', vars, prominent ? 'space.5' : 'space.4');
  applyFill(node, vars, fillId);
  if (strokeId) applyStroke(node, vars, strokeId, 'border.width.1', 1);
  bindRadius(node, vars, banner ? 'radius.none' : 'radius.lg');
  node.clipsContent = true;

  // Prominent Type C — left accent bar. An ABSOLUTE child rejects layoutSizingVertical FILL, and a
  // STRETCH constraint on a short bar only preserves margins (leaves a 10px stub). Instead make the
  // bar taller than any alert and let the node's clipsContent (set above) crop it to full height.
  if (prominent) {
    const barWrap = box(4, 400);
    applyFill(barWrap, vars, t.solid);
    absChild(node, barWrap, 0, 0);
  }

  // Leading tone icon (BOOLEAN showIcon).
  const iconWrap = box(18, 18);
  iconWrap.layoutMode = 'HORIZONTAL';
  iconWrap.primaryAxisAlignItems = 'CENTER';
  iconWrap.counterAxisAlignItems = 'CENTER';
  iconWrap.primaryAxisSizingMode = 'FIXED';
  iconWrap.counterAxisSizingMode = 'FIXED';
  iconWrap.resize(18, 18);
  iconWrap.fills = [];
  const disc = circle(16);
  applyFill(disc, vars, solid ? t.onSolid : t.solid);
  place(iconWrap, disc);
  place(node, iconWrap);

  // Content — title + body.
  const content = box(W - 100, 40);
  content.layoutMode = 'VERTICAL';
  content.primaryAxisSizingMode = 'AUTO';
  content.counterAxisSizingMode = 'FIXED';
  content.counterAxisAlignItems = 'MIN';
  content.resize(W - 100, content.height);
  content.fills = [];
  bindDim(content, 'itemSpacing', vars, 'space.1');
  const title = labelText(
    fonts.semibold,
    'Heads up',
    vars,
    textId,
    prominent ? 'font.size.md' : 'font.size.sm',
    prominent ? 15 : 14,
  );
  content.appendChild(title);
  // Alert.css: for subtle/outline the body inherits the tone's subtle-fg (only the title is forced
  // to fg.default); solid keeps the on-solid color.
  const bodyTxt = labelText(
    fonts.regular,
    'This is an alert message.',
    vars,
    solid ? textId : variant === 'outline' ? 'color.fg.default' : t.subtleFg,
    'font.size.sm',
    13,
  );
  bodyTxt.opacity = 0.95; // Alert.css .tds-alert__body opacity is unconditional
  content.appendChild(bodyTxt);

  // Action slot (rendered under body).
  const actionSlot = iconSlot(placeholder, 'Action', 16);
  actionSlot.visible = false;
  content.appendChild(actionSlot);
  node.appendChild(content);
  fillGrow(content);

  // Close (BOOLEAN closable).
  const close = iconGlyph(icons, 'close', 14, vars, textId);
  close.opacity = 0.7;
  close.visible = false;
  place(node, close);

  return {
    node,
    label: title,
    swaps: { action: actionSlot },
    bools: { showIcon: iconWrap, closable: close },
  };
};

/** Toast — surface card + tone left accent + shadow; tone icon + title/description + close. */
const toast: Recipe = ({ node, combo, vars, effects, placeholder, fonts, icons }) => {
  const tone = combo.tone || 'neutral';
  const type = combo.type;
  const t = toneVars(tone);
  const rich = type === 'B';
  const W = 340;

  node.layoutMode = 'HORIZONTAL';
  node.counterAxisAlignItems = 'MIN';
  node.primaryAxisAlignItems = 'MIN';
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'AUTO';
  node.resize(W, node.height);
  bindDim(node, 'itemSpacing', vars, 'space.3');
  bindDim(node, 'paddingTop', vars, rich ? 'space.4' : 'space.3');
  bindDim(node, 'paddingBottom', vars, rich ? 'space.4' : 'space.3');
  bindDim(node, 'paddingLeft', vars, 'space.4');
  bindDim(node, 'paddingRight', vars, 'space.4');
  applyFill(node, vars, 'color.bg.surface');
  applyStroke(node, vars, 'color.border.default', 'border.width.1', 1);
  bindRadius(node, vars, 'radius.lg');
  node.clipsContent = true;
  const sid = effects.get('shadow.lg');
  if (sid) void node.setEffectStyleIdAsync(sid);

  // Left tone accent bar (3px). ABSOLUTE children can't use FILL sizing, and a STRETCH constraint on
  // a short bar only preserves margins (a stub) — make the bar taller than any toast and let the
  // node's clipsContent (set above) crop it to a flush, full-height accent.
  const accent = box(3, 400);
  applyFill(accent, vars, t.solid);
  absChild(node, accent, 0, 0);

  // Tone icon.
  const iconWrap = box(18, 18);
  iconWrap.layoutMode = 'HORIZONTAL';
  iconWrap.primaryAxisAlignItems = 'CENTER';
  iconWrap.counterAxisAlignItems = 'CENTER';
  iconWrap.primaryAxisSizingMode = 'FIXED';
  iconWrap.counterAxisSizingMode = 'FIXED';
  iconWrap.resize(18, 18);
  iconWrap.fills = [];
  const disc = circle(16);
  applyFill(disc, vars, t.solid);
  place(iconWrap, disc);
  place(node, iconWrap);

  // Content — title + description.
  const content = box(W - 100, 40);
  content.layoutMode = 'VERTICAL';
  content.primaryAxisSizingMode = 'AUTO';
  content.counterAxisSizingMode = 'FIXED';
  content.counterAxisAlignItems = 'MIN';
  content.resize(W - 100, content.height);
  content.fills = [];
  bindDim(content, 'itemSpacing', vars, rich ? 'space.1' : 'space.0.5');
  const title = labelText(
    fonts.semibold,
    'Saved',
    vars,
    'color.fg.default',
    rich ? 'font.size.md' : 'font.size.sm',
    rich ? 15 : 14,
  );
  content.appendChild(title);
  const descTxt = labelText(
    fonts.regular,
    'Your changes have been saved.',
    vars,
    'color.fg.muted',
    'font.size.sm',
    13,
  );
  content.appendChild(descTxt);
  node.appendChild(content);
  fillGrow(content);

  // Action slot (INSTANCE_SWAP action).
  const actionSlot = iconSlot(placeholder, 'Action', 16);
  actionSlot.visible = false;
  place(node, actionSlot);

  // Close (BOOLEAN closable).
  const close = iconGlyph(icons, 'close', 14, vars, 'color.fg.muted');
  place(node, close);

  return { node, label: title, swaps: { action: actionSlot }, bools: { closable: close } };
};

/** Table — bordered surface: header row (subtle fill) + 3 body rows with cell text + dividers. */
const table: Recipe = ({ node, combo, vars, fonts, icons }) => {
  const variant = combo.variant;
  const size = combo.size;
  const compact = combo.type === 'B';
  const cellPadY = compact
    ? 'space.1'
    : size === 'sm'
      ? 'space.2'
      : size === 'lg'
        ? 'space.4'
        : 'space.3';
  const cellPadX = compact
    ? 'space.3'
    : size === 'sm'
      ? 'space.3'
      : size === 'lg'
        ? 'space.5'
        : 'space.4';
  const fontPx = size === 'sm' ? 12 : 13;
  const fontId = size === 'sm' ? 'font.size.xs' : 'font.size.sm';
  const cols = [150, 90, 80, 70];
  const W = cols.reduce((a, b) => a + b, 0);
  const bordered = variant === 'bordered';

  node.layoutMode = 'VERTICAL';
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'FIXED';
  node.counterAxisAlignItems = 'MIN';
  node.resize(W, node.height);
  node.itemSpacing = 0;
  applyFill(node, vars, 'color.bg.surface');
  applyStroke(node, vars, 'color.border.default', 'border.width.1', 1);
  bindRadius(node, vars, 'radius.lg');
  node.clipsContent = true;

  const headers = ['Name', 'Status', 'Role', 'Date'];
  const rows = [
    ['Ada Lovelace', 'Active', 'Admin', 'May 3'],
    ['Alan Turing', 'Invited', 'Editor', 'May 6'],
    ['Grace Hopper', 'Active', 'Viewer', 'May 9'],
  ];

  const selectCells: SceneNode[] = [];
  const mkRow = (cells: string[], head: boolean, striped: boolean): TextNode[] => {
    const row = box(W, 40);
    row.layoutMode = 'HORIZONTAL';
    row.counterAxisAlignItems = 'CENTER';
    row.primaryAxisSizingMode = 'FIXED';
    row.counterAxisSizingMode = 'AUTO';
    row.resize(W, 40);
    row.fills = [];
    if (head) applyFill(row, vars, 'color.bg.subtle');
    else if (striped) applyFill(row, vars, 'color.bg.subtle');

    // Leading selection checkbox cell — hidden by default, revealed together by `selectable`.
    const selCell = box(36, 40);
    selCell.layoutMode = 'HORIZONTAL';
    selCell.primaryAxisAlignItems = 'CENTER';
    selCell.counterAxisAlignItems = 'CENTER';
    selCell.primaryAxisSizingMode = 'FIXED';
    selCell.counterAxisSizingMode = 'FIXED';
    selCell.resize(36, 40);
    selCell.fills = [];
    const chk = box(16, 16);
    applyFill(chk, vars, head ? 'color.brand.solid' : 'color.field.bg');
    applyStroke(chk, vars, head ? 'color.brand.solid' : 'color.field.border', 'border.width.2', 2);
    bindRadius(chk, vars, 'radius.sm');
    if (head) {
      chk.layoutMode = 'HORIZONTAL';
      chk.primaryAxisAlignItems = 'CENTER';
      chk.counterAxisAlignItems = 'CENTER';
      chk.appendChild(iconGlyph(icons, 'check', 12, vars, 'color.brand.fg'));
    }
    selCell.appendChild(chk);
    selCell.visible = false;
    selectCells.push(selCell);
    place(row, selCell);

    const texts: TextNode[] = [];
    cells.forEach((c, i) => {
      const cell = box(cols[i], 40);
      cell.layoutMode = 'HORIZONTAL';
      cell.counterAxisAlignItems = 'CENTER';
      cell.primaryAxisAlignItems = 'MIN';
      cell.primaryAxisSizingMode = 'FIXED';
      cell.counterAxisSizingMode = 'AUTO';
      cell.resize(cols[i], 40);
      cell.fills = [];
      bindDim(cell, 'paddingTop', vars, cellPadY);
      bindDim(cell, 'paddingBottom', vars, cellPadY);
      bindDim(cell, 'paddingLeft', vars, cellPadX);
      bindDim(cell, 'paddingRight', vars, cellPadX);
      if (bordered && i < cells.length - 1)
        applyStroke(cell, vars, 'color.border.subtle', 'border.width.1', 1);
      const txt = labelText(
        head ? fonts.semibold : fonts.regular,
        c,
        vars,
        head ? 'color.fg.muted' : 'color.fg.default',
        fontId,
        fontPx,
      );
      cell.appendChild(txt);
      texts.push(txt);
      place(row, cell);
    });
    node.appendChild(row);
    fillGrow(row);
    return texts;
  };

  const headTexts = mkRow(headers, true, false);
  const headSep = hairline(vars, 'color.border.default', W, 1, false);
  node.appendChild(headSep);
  fillGrow(headSep);
  rows.forEach((r, i) => {
    // Table.css shades :nth-child(odd) → data rows 1 and 3 (0-indexed 0 and 2).
    mkRow(r, false, variant === 'striped' && i % 2 === 0);
    if (i < rows.length - 1) {
      const sep = hairline(vars, 'color.border.subtle', W, 1, false);
      node.appendChild(sep);
      fillGrow(sep);
    }
  });

  const stickyHeader = hiddenMarker(node, vars);
  const loading = hiddenMarker(node, vars);

  return {
    node,
    label: headTexts[0],
    swaps: {},
    // `selectable` drives the whole leading checkbox column (header + every body row) at once.
    bools: { stickyHeader, selectable: selectCells, loading },
  };
};

export const RECIPES: Record<string, Recipe> = {
  button,
  checkbox,
  radio,
  switch: switchRecipe,
  badge,
  avatar,
  input,
  progress,
  tag,
  chip,
  spinner,
  slider,
  textarea,
  link,
  divider,
  skeleton,
  tooltip,
  image,
  icon,
  'social-login-button': socialLoginButton,
  text,
  label,
  'icon-button': iconButton,
  sparkline,
  'bar-chart': barChart,
  'line-chart': lineChart,
  'donut-chart': donutChart,
  'radar-chart': radarChart,
  gauge,
  'scatter-chart': scatterChart,
  heatmap,
  'text-field': textField,
  'search-input': searchInput,
  select,
  combobox,
  autocomplete,
  'date-picker': datePicker,
  'file-upload': fileUpload,
  'image-upload': imageUpload,
  'form-field': formField,
  card,
  'list-item': listItem,
  tabs,
  accordion,
  breadcrumb,
  pagination,
  dropdown,
  menu,
  popover,
  'empty-state': emptyState,
  'social-login': socialLogin,
  modal,
  drawer,
  header,
  footer,
  sidebar,
  navbar,
  alert,
  toast,
  table,
};
