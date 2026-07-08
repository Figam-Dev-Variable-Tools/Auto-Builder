/**
 * component-set — build ONE real Figma Component Set per TDS component, plus its Component
 * Properties. This is the "★ real component" the spec sheet instantiates everywhere.
 *
 * Fidelity vs. feasibility: the full cartesian product of a component's variant axes is enormous
 * (Button = 4050, Card = 432, Icon = 1350). Materialising every cell would be unusable. Instead we
 * build a REAL but *sparse* set: a base variant (every axis at its default) plus one variant per
 * non-default option of each axis, plus one per non-default State. Every axis and every option
 * therefore appears — Figma infers the exact same variant properties/options — while the node count
 * stays linear. Each demo cell instantiates the specific variant it needs (so setProperties never
 * targets a missing combination). Component art is a SIMPLIFIED framed control (label + slots +
 * flags), faithful to the reference "Framed Style".
 */
import type { ComponentProp, SpecComponent } from './data';
import { spacePx, radiusPx, sizePx } from './tokens';
import { C, add, hstack, solid, toneColor, txt, vstack } from './ui';

interface Axis {
  name: string;
  options: string[];
  def: string;
}

interface BuildCtx {
  c: SpecComponent;
  primaryTextProp: string | null;
  placeholder: ComponentNode;
}

export interface BuiltComponentSet {
  set: ComponentSetNode;
  base: ComponentNode;
  axes: Axis[];
  baseCombo: Record<string, string>;
  propIds: Map<string, string>;
  primaryTextProp: string | null;
  includeState: boolean;
  variantByKey: Map<string, ComponentNode>;
  notes: string[];
  /** Instance of the exact variant matching `partial` merged over the defaults. */
  instanceFor(partial: Record<string, string>): InstanceNode;
}

const HEIGHT_BY_SIZE: Record<string, number> = { sm: 32, md: 40, lg: 48, xs: 26, xl: 56 };

const TEXT_PRIORITY = ['children', 'label', 'title', 'placeholder', 'content', 'value', 'text', 'name'];

function dedupe(xs: string[]): string[] {
  return Array.from(new Set(xs));
}

function pickPrimaryText(c: SpecComponent): string | null {
  const texts = c.componentProps.filter((p) => p.figmaType === 'TEXT' && !p.options);
  for (const key of TEXT_PRIORITY) {
    const hit = texts.find((p) => p.name === key);
    if (hit) return hit.name;
  }
  return texts[0]?.name ?? null;
}

function primaryTextValue(c: SpecComponent, prop: string | null): string {
  if (!prop) return c.name;
  const cp = c.componentProps.find((p) => p.name === prop);
  const def = cp?.default;
  return def != null && String(def).length ? String(def) : c.name;
}

function comboName(axes: Axis[], combo: Record<string, string>): string {
  return axes.map((a) => `${a.name}=${combo[a.name]}`).join(', ');
}

// ── control art ───────────────────────────────────────────────────────────────────────────────

interface ControlStyle {
  labelColor: string;
}

function styleControl(comp: ComponentNode, combo: Record<string, string>): ControlStyle {
  const variant = combo['variant'];
  const tone = combo['tone'] ?? combo['color'] ?? combo['provider'] ?? 'neutral';
  const accent = toneColor(tone);
  const state = combo['State'];

  let fill: string | null = C.white;
  let fillOp = 1;
  let stroke: string | null = C.border;
  let sw = 1;
  let labelColor: string = C.body;

  if (variant === 'solid') {
    fill = accent;
    stroke = null;
    labelColor = '#FFFFFF';
  } else if (variant === 'outline') {
    fill = C.white;
    stroke = accent;
    labelColor = accent;
  } else if (variant === 'ghost' || variant === 'link') {
    fill = null;
    stroke = null;
    labelColor = accent;
  } else if (variant === 'soft') {
    fill = accent;
    fillOp = 0.14;
    stroke = null;
    labelColor = accent;
  }

  if (state === 'hover' && variant !== 'solid') fill = C.sub2;
  if (state === 'focus') {
    stroke = C.focus;
    sw = 2;
  }
  if (state === 'error') stroke = toneColor('danger');
  if (state === 'success') stroke = toneColor('success');
  if (state === 'disabled') comp.opacity = 0.45;

  comp.fills = fill ? [solid(fill, fillOp)] : [];
  if (stroke) {
    comp.strokes = [solid(stroke)];
    comp.strokeWeight = sw;
  } else {
    comp.strokes = [];
  }
  return { labelColor };
}

function makeSlot(ctx: BuildCtx, name: string, visible: boolean): InstanceNode {
  const inst = ctx.placeholder.createInstance();
  inst.name = name;
  inst.resize(16, 16);
  inst.visible = visible;
  return inst;
}

function isLeading(name: string): boolean {
  return /start|leading/i.test(name);
}
function isIconLike(name: string): boolean {
  return /icon|leading|trailing|start|end|avatar|thumb|logo|arrow/i.test(name);
}

function buildControlChildren(ctx: BuildCtx, comp: ComponentNode, combo: Record<string, string>, style: ControlStyle): void {
  const c = ctx.c;
  const swaps = c.componentProps.filter((p) => p.figmaType === 'INSTANCE_SWAP');
  const leading = swaps.filter((p) => isLeading(p.name));
  const trailingIcons = swaps.filter((p) => !isLeading(p.name) && isIconLike(p.name));
  const hiddenSwaps = swaps.filter((p) => !isIconLike(p.name));
  const booleans = c.componentProps.filter((p) => p.figmaType === 'BOOLEAN');
  const secondaryTexts = c.componentProps.filter(
    (p) => p.figmaType === 'TEXT' && p.name !== ctx.primaryTextProp,
  );

  for (const p of leading) add(comp, makeSlot(ctx, '__slot_' + p.name, true));

  const label = txt(primaryTextValue(c, ctx.primaryTextProp), {
    weight: 'medium',
    size: combo['size'] === 'lg' ? 15 : combo['size'] === 'sm' ? 12 : 13,
    color: style.labelColor,
  });
  label.name = '__label';
  add(comp, label);

  if (booleans.length) {
    const flags = hstack('__flags', { gap: 4 });
    for (const p of booleans) {
      const chip = hstack('__flag_' + p.name, { padding: [1, 5], radius: 4, fill: C.sub2 });
      add(chip, txt(p.name, { size: 9, color: C.muted, weight: 'medium' }));
      chip.visible = Boolean(p.default);
      add(flags, chip);
    }
    add(comp, flags);
  }

  for (const p of trailingIcons) add(comp, makeSlot(ctx, '__slot_' + p.name, true));

  if (secondaryTexts.length || hiddenSwaps.length) {
    const meta = vstack('__meta', { gap: 2 });
    for (const p of secondaryTexts) {
      const t = txt(String(p.default ?? '') || p.name, { size: 10, color: C.muted });
      t.name = '__text_' + p.name;
      add(meta, t);
    }
    for (const p of hiddenSwaps) add(meta, makeSlot(ctx, '__slot_' + p.name, true));
    meta.visible = false;
    add(comp, meta);
  }
}

function buildControl(ctx: BuildCtx, combo: Record<string, string>): ComponentNode {
  const f = ctx.c.figma;
  const dir: 'HORIZONTAL' | 'VERTICAL' = f?.layoutMode === 'VERTICAL' ? 'VERTICAL' : 'HORIZONTAL';
  const comp = figma.createComponent();
  comp.layoutMode = dir;
  comp.primaryAxisSizingMode = 'AUTO';
  comp.counterAxisSizingMode = 'AUTO';
  comp.primaryAxisAlignItems = 'CENTER';
  comp.counterAxisAlignItems = 'CENTER';
  comp.itemSpacing = f?.itemSpacing ? spacePx(f.itemSpacing) : 8;

  const padX = f?.paddingX ? spacePx(f.paddingX) : 14;
  const padY = f?.paddingY ? spacePx(f.paddingY) : 8;
  comp.paddingLeft = comp.paddingRight = padX;
  comp.paddingTop = comp.paddingBottom = padY;

  let radius = f?.cornerRadius ? radiusPx(f.cornerRadius) : 8;
  if (combo['shape'] === 'pill') radius = 9999;
  else if (combo['shape'] === 'square') radius = 0;
  comp.cornerRadius = radius;

  const size = combo['size'];
  if (dir === 'HORIZONTAL') {
    comp.minHeight = size ? (HEIGHT_BY_SIZE[size] ?? sizePx(f?.height)) : sizePx(f?.height);
  } else {
    comp.minWidth = 200;
  }

  const style = styleControl(comp, combo);
  buildControlChildren(ctx, comp, combo, style);
  return comp;
}

// ── binding component properties ────────────────────────────────────────────────────────────

function layerNameFor(cp: ComponentProp, primaryText: string | null): string {
  if (cp.figmaType === 'BOOLEAN') return '__flag_' + cp.name;
  if (cp.figmaType === 'INSTANCE_SWAP') return '__slot_' + cp.name;
  return cp.name === primaryText ? '__label' : '__text_' + cp.name;
}

function fieldFor(cp: ComponentProp): 'visible' | 'characters' | 'mainComponent' {
  if (cp.figmaType === 'BOOLEAN') return 'visible';
  if (cp.figmaType === 'INSTANCE_SWAP') return 'mainComponent';
  return 'characters';
}

function bindAcrossVariants(set: ComponentSetNode, layerName: string, field: string, id: string): void {
  for (const v of set.children) {
    if (v.type !== 'COMPONENT') continue;
    const layer = v.findOne((n) => n.name === layerName);
    if (!layer || !('componentPropertyReferences' in layer)) continue;
    const refs: { visible?: string; characters?: string; mainComponent?: string } = {
      ...(layer.componentPropertyReferences ?? {}),
    };
    if (field === 'visible') refs.visible = id;
    else if (field === 'characters') refs.characters = id;
    else refs.mainComponent = id;
    layer.componentPropertyReferences = refs;
  }
}

// ── entry ────────────────────────────────────────────────────────────────────────────────────

export function buildComponentSet(c: SpecComponent, placeholder: ComponentNode): BuiltComponentSet {
  const notes: string[] = [];
  const includeState = c.states.length > 1;
  const baseState = c.states.includes('default') ? 'default' : c.states[0];

  const axes: Axis[] = c.variantProps.map((p) => ({
    name: p.name,
    options: dedupe(p.options),
    def: p.default ?? p.options[0],
  }));
  if (includeState) axes.push({ name: 'State', options: dedupe(c.states), def: baseState });

  const baseCombo: Record<string, string> = {};
  for (const a of axes) baseCombo[a.name] = a.def;

  const primaryTextProp = pickPrimaryText(c);
  const ctx: BuildCtx = { c, primaryTextProp, placeholder };

  const variantByKey = new Map<string, ComponentNode>();
  const nodes: ComponentNode[] = [];

  const base = buildControl(ctx, baseCombo);
  base.name = comboName(axes, baseCombo);
  variantByKey.set(base.name, base);
  nodes.push(base);

  for (const a of axes) {
    for (const opt of a.options) {
      if (opt === a.def) continue;
      const combo = { ...baseCombo, [a.name]: opt };
      const name = comboName(axes, combo);
      if (variantByKey.has(name)) continue;
      const node = buildControl(ctx, combo);
      node.name = name;
      variantByKey.set(name, node);
      nodes.push(node);
    }
  }

  const set = figma.combineAsVariants(nodes, figma.currentPage);
  set.name = `Spec/${c.name}`;
  set.layoutMode = 'HORIZONTAL';
  set.layoutWrap = 'WRAP';
  set.primaryAxisSizingMode = 'FIXED';
  set.counterAxisSizingMode = 'AUTO';
  set.itemSpacing = 16;
  set.counterAxisSpacing = 16;
  set.paddingTop = set.paddingBottom = set.paddingLeft = set.paddingRight = 24;
  set.fills = [solid(C.white)];
  set.strokes = [solid(C.border)];
  set.cornerRadius = 12;
  set.resize(Math.max(520, Math.min(880, 260 + nodes.length * 10)), set.height);

  const propIds = new Map<string, string>();
  const axisNames = new Set(axes.map((a) => a.name));

  for (const cp of c.componentProps) {
    if (axisNames.has(cp.name)) {
      notes.push(`prop "${cp.name}" collides with a variant axis — skipped as component property`);
      continue;
    }
    let id: string | null = null;
    try {
      if (cp.figmaType === 'BOOLEAN') {
        id = set.addComponentProperty(cp.name, 'BOOLEAN', Boolean(cp.default));
      } else if (cp.figmaType === 'TEXT') {
        id = set.addComponentProperty(cp.name, 'TEXT', String(cp.default ?? ''));
      } else {
        try {
          id = set.addComponentProperty(cp.name, 'INSTANCE_SWAP', placeholder.key);
        } catch {
          id = set.addComponentProperty(cp.name, 'INSTANCE_SWAP', '');
        }
      }
    } catch (e) {
      notes.push(`could not add property "${cp.name}" (${cp.figmaType}): ${String(e)}`);
      continue;
    }
    propIds.set(cp.name, id);
    bindAcrossVariants(set, layerNameFor(cp, primaryTextProp), fieldFor(cp), id);
  }

  return {
    set,
    base,
    axes,
    baseCombo,
    propIds,
    primaryTextProp,
    includeState,
    variantByKey,
    notes,
    instanceFor(partial: Record<string, string>): InstanceNode {
      const combo = { ...baseCombo, ...partial };
      const name = comboName(axes, combo);
      const node = variantByKey.get(name) ?? base;
      return node.createInstance();
    },
  };
}
