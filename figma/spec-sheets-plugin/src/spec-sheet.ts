/**
 * spec-sheet — compose the per-component documentation card on the canvas.
 *
 * Section order mirrors the reference screenshots:
 *   1. Header (name + description)      2. 개발 상태 (platform pills)
 *   3. Prop sections (one sub-card per variantProp and per discrete componentProp)
 *   4. interaction (State columns, wrapped in a purple dashed group)
 *   5. customize (radius / padding / shadow — only the axes the component exposes)
 *   6. Resource (dashed purple slot previews)
 * Every demo cell is a REAL instance of the component's Component Set (built in component-set.ts).
 */
import { data, PLATFORM_LABEL, type ComponentProp, type SpecComponent, type VariantProp } from './data';
import type { BuiltComponentSet } from './component-set';
import { findEffectStyle, findVariable, radiusPx, shadowEffects, spacePx } from './tokens';
import {
  add,
  C,
  caption,
  codeTag,
  dashedGroup,
  defaultTag,
  greenPill,
  hstack,
  txt,
  vstack,
} from './ui';

const SHEET_W = 900;
const INNER_W = SHEET_W - 56;

function cell(node: SceneNode, capNode: SceneNode): FrameNode {
  const v = vstack('cell', { gap: 6, cross: 'MIN' });
  add(v, node);
  add(v, capNode);
  return v;
}

function sectionCard(title: string, opts: { bordered?: boolean } = {}): { card: FrameNode; body: FrameNode } {
  const card = vstack('section', {
    gap: 12,
    padding: 18,
    radius: 14,
    fill: opts.bordered ? C.white : C.sub,
    stroke: opts.bordered ? C.border : undefined,
  });
  add(card, txt(title, { weight: 'bold', size: 14, color: C.ink }));
  const body = vstack('body', { gap: 14 });
  add(card, body, true);
  return { card, body };
}

/** One prop sub-card: title line (`name = v1 [default] v2 …`) + a row of real instances. */
function propCard(
  parent: FrameNode,
  name: string,
  values: string[],
  def: string | undefined,
  makeCell: (value: string) => FrameNode,
  dashed = false,
): void {
  const card = vstack('prop', { gap: 12, padding: 16, radius: 12, fill: C.sub2 });
  const title = hstack('title', { gap: 6, wrap: true, cross: 'CENTER' });
  add(card, title, true);
  add(title, codeTag(name + ' ='));
  for (const v of values) {
    add(title, txt(v, { size: 12, weight: 'medium', color: C.codeText }));
    if (v === def) add(title, defaultTag());
  }
  const row = dashed
    ? dashedGroup('compare')
    : hstack('row', { gap: 16, wrap: true, cross: 'MIN' });
  add(card, row, true);
  for (const v of values) add(row, makeCell(v));
  add(parent, card, true);
}

function setProp(inst: InstanceNode, id: string | undefined, value: string | boolean): void {
  if (!id) return;
  try {
    inst.setProperties({ [id]: value });
  } catch {
    /* mismatched value — leave instance at its default */
  }
}

// ── prop sections ──────────────────────────────────────────────────────────────────────────

function renderVariantProp(parent: FrameNode, built: BuiltComponentSet, p: VariantProp, dashed: boolean): void {
  propCard(
    parent,
    p.name,
    p.options,
    p.default,
    (value) => cell(built.instanceFor({ [p.name]: value }), caption(value)),
    dashed,
  );
}

function renderBooleanProp(parent: FrameNode, built: BuiltComponentSet, p: ComponentProp): void {
  const id = built.propIds.get(p.name);
  const def = String(Boolean(p.default));
  propCard(parent, p.name, ['false', 'true'], def, (value) => {
    const inst = built.base.createInstance();
    setProp(inst, id, value === 'true');
    return cell(inst, caption(value));
  });
}

function renderSelectProp(parent: FrameNode, built: BuiltComponentSet, p: ComponentProp): void {
  const id = built.propIds.get(p.name);
  propCard(parent, p.name, p.options ?? [], p.default != null ? String(p.default) : undefined, (value) => {
    const inst = built.base.createInstance();
    setProp(inst, id, value);
    return cell(inst, caption(value));
  });
}

// ── interaction ──────────────────────────────────────────────────────────────────────────────

function renderInteraction(parent: FrameNode, c: SpecComponent, built: BuiltComponentSet): void {
  const { card, body } = sectionCard('interaction');
  const group = dashedGroup('states');
  add(body, group, true);
  c.states.forEach((state, i) => {
    const inst = built.instanceFor({ State: state });
    add(group, cell(inst, caption(c.interactions[i] ?? state)));
  });
  add(parent, card, true);
}

// ── customize ──────────────────────────────────────────────────────────────────────────────

async function renderCustomize(parent: FrameNode, c: SpecComponent, built: BuiltComponentSet): Promise<void> {
  const { card, body } = sectionCard('customize');

  if (c.customize.radius) {
    const block = vstack('radius', { gap: 10 });
    add(block, txt('radius', { weight: 'medium', size: 12.5, color: C.body }));
    const row = hstack('row', { gap: 14, wrap: true, cross: 'MIN' });
    for (const step of data.tokenScales.radius) {
      const inst = built.base.createInstance();
      const v = findVariable(step.id);
      try {
        if (v) inst.setBoundVariable('cornerRadius', v);
        else inst.cornerRadius = radiusPx(step.id);
      } catch {
        inst.cornerRadius = radiusPx(step.id);
      }
      add(row, cell(inst, codeTag(step.name)));
    }
    add(block, row, true);
    add(body, block, true);
  }

  if (c.customize.padding) {
    const block = vstack('padding', { gap: 10 });
    add(block, txt('padding', { weight: 'medium', size: 12.5, color: C.body }));
    const row = hstack('row', { gap: 14, wrap: true, cross: 'MIN' });
    for (const step of data.tokenScales.spacing) {
      const inst = built.base.createInstance();
      const v = findVariable(step.id);
      const px = spacePx(step.id);
      for (const f of ['paddingLeft', 'paddingRight', 'paddingTop', 'paddingBottom'] as const) {
        try {
          if (v) inst.setBoundVariable(f, v);
          else inst[f] = px;
        } catch {
          inst[f] = px;
        }
      }
      add(row, cell(inst, codeTag(step.name)));
    }
    add(block, row, true);
    add(body, block, true);
  }

  if (c.customize.shadow) {
    const block = vstack('shadow', { gap: 10 });
    add(block, txt('shadow', { weight: 'medium', size: 12.5, color: C.body }));
    const row = hstack('row', { gap: 20, wrap: true, cross: 'MIN' });
    for (const name of data.tokenScales.shadowStyles) {
      const inst = built.base.createInstance();
      const style = findEffectStyle(name);
      try {
        if (style) await inst.setEffectStyleIdAsync(style.id);
        else inst.effects = shadowEffects(name);
      } catch {
        inst.effects = shadowEffects(name);
      }
      add(row, cell(inst, codeTag(name)));
    }
    add(block, row, true);
    add(body, block, true);
  }

  add(parent, card, true);
}

// ── resource ──────────────────────────────────────────────────────────────────────────────

function resourceSlot(preview: SceneNode, name: string): FrameNode {
  const f = vstack('slot', {
    gap: 8,
    padding: 12,
    radius: 10,
    stroke: C.purple,
    strokeWeight: 1.5,
    dashed: true,
    cross: 'CENTER',
  });
  add(f, preview);
  add(f, txt(name, { size: 11, color: C.muted, weight: 'medium' }));
  return f;
}

function renderResource(parent: FrameNode, c: SpecComponent, placeholder: ComponentNode): void {
  const { card, body } = sectionCard('Resource', { bordered: true });
  const row = hstack('slots', { gap: 14, wrap: true, cross: 'MIN' });
  add(body, row, true);
  for (const p of c.componentProps.filter((x) => x.figmaType === 'INSTANCE_SWAP')) {
    const preview = placeholder.createInstance();
    preview.resize(24, 24);
    add(row, resourceSlot(preview, p.name));
  }
  const textSample = hstack('text-sample', { padding: [4, 8], radius: 6, fill: C.sub2 });
  add(textSample, txt('Ag', { size: 13, color: C.body, weight: 'medium' }));
  add(row, resourceSlot(textSample, 'text'));
  add(parent, card, true);
}

// ── sheet ──────────────────────────────────────────────────────────────────────────────────

export async function buildSpecSheet(
  c: SpecComponent,
  built: BuiltComponentSet,
  placeholder: ComponentNode,
): Promise<FrameNode> {
  const sheet = vstack(`Spec Sheet / ${c.name}`, {
    gap: 22,
    padding: 28,
    radius: 18,
    fill: C.white,
    stroke: C.border,
    width: SHEET_W,
  });

  // 1. header
  const header = vstack('header', { gap: 6 });
  add(header, txt(c.name, { weight: 'bold', size: 24, color: C.ink }));
  add(header, txt(c.description, { size: 13, color: C.muted, wrap: INNER_W, lineHeightPct: 145 }));
  add(sheet, header, true);

  // 2. dev status
  const status = hstack('dev-status', { gap: 8, cross: 'CENTER' });
  add(status, txt('개발 상태', { weight: 'medium', size: 13, color: C.muted }));
  for (const pl of c.platforms) {
    if (PLATFORM_LABEL[pl]) add(status, greenPill(PLATFORM_LABEL[pl]));
  }
  add(sheet, status);

  // 3. prop sections (dash the first variant block only when there is no interaction section)
  c.variantProps.forEach((p, i) => {
    renderVariantProp(sheet, built, p, !built.includeState && i === 0);
  });
  for (const p of c.componentProps) {
    if (p.figmaType === 'BOOLEAN') renderBooleanProp(sheet, built, p);
    else if (p.options && p.options.length) renderSelectProp(sheet, built, p);
  }

  // 4. interaction
  if (built.includeState) renderInteraction(sheet, c, built);

  // 5. customize
  if (c.customize.radius || c.customize.padding || c.customize.shadow) {
    await renderCustomize(sheet, c, built);
  }

  // 6. resource
  renderResource(sheet, c, placeholder);

  return sheet;
}
