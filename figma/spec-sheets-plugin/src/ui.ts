/**
 * ui — presentation primitives for the spec sheets: palette, fonts and Auto-Layout node builders.
 *
 * Everything here is generic scaffolding (frames, text, tags, pills, dashed groups). It carries no
 * component knowledge — component semantics live in component-set.ts / spec-sheet.ts. The colour
 * palette is a small fixed documentation theme (NOT a token table); component art borrows a handful
 * of tone accents from TONE for visual differentiation only.
 */

// ── Palette (documentation chrome — intentionally small & fixed) ─────────────────────────────
export const C = {
  ink: '#111827',
  body: '#1F2937',
  muted: '#6B7280',
  faint: '#9CA3AF',
  white: '#FFFFFF',
  sheet: '#FFFFFF',
  sub: '#F7F8FA',
  sub2: '#F3F4F6',
  border: '#E5E7EB',
  border2: '#D1D5DB',
  code: '#EEF1F5',
  codeText: '#334155',
  tagBg: '#E5E7EB',
  tagText: '#6B7280',
  green: '#16A34A',
  purple: '#A855F7',
  focus: '#3B82F6',
} as const;

/** Accent per tone/provider — decorative only, used to differentiate variant art. Unknown → neutral. */
export const TONE: Record<string, string> = {
  brand: '#3B82F6',
  primary: '#3B82F6',
  neutral: '#64748B',
  secondary: '#64748B',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  error: '#EF4444',
  info: '#0EA5E9',
  accent: '#8B5CF6',
  muted: '#94A3B8',
};

export function toneColor(tone: string | undefined): string {
  if (!tone) return TONE.neutral;
  return TONE[tone] ?? TONE.neutral;
}

// ── Colour helpers ───────────────────────────────────────────────────────────────────────────
export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

export function solid(hex: string, opacity = 1): SolidPaint {
  return { type: 'SOLID', color: hexToRgb(hex), opacity };
}

// ── Fonts ──────────────────────────────────────────────────────────────────────────────────
export type Weight = 'regular' | 'medium' | 'bold';

let family = 'Inter';
const loaded = new Set<string>();

export async function initFonts(): Promise<string> {
  const families = ['Inter', 'Roboto'];
  for (const fam of families) {
    try {
      await figma.loadFontAsync({ family: fam, style: 'Regular' });
      family = fam;
      loaded.add('Regular');
      break;
    } catch {
      /* try next family */
    }
  }
  for (const style of ['Medium', 'Bold', 'Semi Bold']) {
    try {
      await figma.loadFontAsync({ family, style });
      loaded.add(style);
    } catch {
      /* weight unavailable — fall back to Regular */
    }
  }
  return family;
}

function fontFor(weight: Weight): FontName {
  const want = weight === 'bold' ? 'Bold' : weight === 'medium' ? 'Medium' : 'Regular';
  const style = loaded.has(want) ? want : 'Regular';
  return { family, style };
}

// ── Node builders ────────────────────────────────────────────────────────────────────────────
export interface StackOpts {
  gap?: number;
  padding?: number | [number, number] | [number, number, number, number];
  fill?: string | null;
  fillOpacity?: number;
  radius?: number;
  stroke?: string;
  strokeWeight?: number;
  dashed?: boolean;
  align?: 'MIN' | 'CENTER' | 'MAX';
  cross?: 'MIN' | 'CENTER' | 'MAX';
  wrap?: boolean;
  width?: number;
}

function applyStack(f: FrameNode, dir: 'HORIZONTAL' | 'VERTICAL', name: string, o: StackOpts): FrameNode {
  f.name = name;
  f.layoutMode = dir;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.itemSpacing = o.gap ?? 0;
  const p = o.padding ?? 0;
  if (typeof p === 'number') {
    f.paddingTop = f.paddingBottom = f.paddingLeft = f.paddingRight = p;
  } else if (p.length === 2) {
    f.paddingTop = f.paddingBottom = p[0];
    f.paddingLeft = f.paddingRight = p[1];
  } else {
    [f.paddingTop, f.paddingRight, f.paddingBottom, f.paddingLeft] = p;
  }
  f.fills = o.fill ? [solid(o.fill, o.fillOpacity ?? 1)] : [];
  if (o.radius != null) f.cornerRadius = o.radius;
  if (o.stroke) {
    f.strokes = [solid(o.stroke)];
    f.strokeWeight = o.strokeWeight ?? 1;
    if (o.dashed) f.dashPattern = [6, 4];
  }
  if (o.align) f.primaryAxisAlignItems = o.align;
  if (o.cross) f.counterAxisAlignItems = o.cross;
  if (o.wrap) f.layoutWrap = 'WRAP';
  if (o.width != null) {
    f.counterAxisSizingMode = 'FIXED';
    f.resize(o.width, f.height);
  }
  return f;
}

export function hstack(name: string, o: StackOpts = {}): FrameNode {
  return applyStack(figma.createFrame(), 'HORIZONTAL', name, o);
}

export function vstack(name: string, o: StackOpts = {}): FrameNode {
  return applyStack(figma.createFrame(), 'VERTICAL', name, o);
}

/** Append `child` to an auto-layout `parent`, optionally stretching it to fill the cross axis. */
export function add<T extends SceneNode>(parent: FrameNode | ComponentNode, child: T, fill = false): T {
  parent.appendChild(child);
  if (fill && 'layoutSizingHorizontal' in child) {
    child.layoutSizingHorizontal = 'FILL';
  }
  return child;
}

export interface TextOpts {
  weight?: Weight;
  size?: number;
  color?: string;
  wrap?: number; // fixed width → wraps and auto-heights
  lineHeightPct?: number;
}

export function txt(chars: string, o: TextOpts = {}): TextNode {
  const t = figma.createText();
  t.fontName = fontFor(o.weight ?? 'regular');
  t.fontSize = o.size ?? 13;
  t.characters = chars;
  t.fills = [solid(o.color ?? C.body)];
  if (o.lineHeightPct != null) t.lineHeight = { unit: 'PERCENT', value: o.lineHeightPct };
  if (o.wrap != null) {
    t.textAutoResize = 'HEIGHT';
    t.resize(o.wrap, t.height);
  } else {
    t.textAutoResize = 'WIDTH_AND_HEIGHT';
  }
  return t;
}

/** Monospace-ish code chip, e.g. `size = md`. */
export function codeTag(text: string): FrameNode {
  const f = hstack('code', { padding: [3, 7], radius: 5, fill: C.code });
  add(f, txt(text, { size: 11.5, color: C.codeText, weight: 'medium' }));
  return f;
}

/** Tiny grey "default" pill placed next to a default value. */
export function defaultTag(label = 'default'): FrameNode {
  const f = hstack('default-tag', { padding: [2, 6], radius: 999, fill: C.tagBg });
  add(f, txt(label, { size: 10, color: C.tagText, weight: 'medium' }));
  return f;
}

/** Green rounded dev-status pill. */
export function greenPill(label: string): FrameNode {
  const f = hstack('pill', { padding: [4, 9], radius: 6, fill: C.green });
  add(f, txt(label, { size: 11.5, color: C.white, weight: 'medium' }));
  return f;
}

/** Small caption below a demo instance. */
export function caption(text: string): TextNode {
  return txt(text, { size: 10.5, color: C.faint });
}

/** Purple dashed comparison group wrapper. */
export function dashedGroup(name = 'compare'): FrameNode {
  return hstack(name, {
    gap: 16,
    padding: 14,
    radius: 12,
    stroke: C.purple,
    strokeWeight: 1.5,
    dashed: true,
    cross: 'MIN',
    wrap: true,
  });
}
