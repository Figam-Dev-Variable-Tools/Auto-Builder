/**
 * tokens — resolve TDS design tokens to real Figma Variables / Effect Styles when they exist in
 * the target file, otherwise to literal fallback values.
 *
 * The spec-sheets plugin prefers binding to real Variables (so a file that already ran the TDS
 * fidelity plugin stays fully token-driven). When those Variables / Effect Styles are absent, we
 * degrade gracefully to literal numbers / effects — never crash. The literal maps below mirror
 * src/tokens/generated/figma.tokens.json and are used ONLY as fallbacks.
 */

/** radius.<name> → px (semantic control/surface/pill resolved through their primitive aliases). */
const RADIUS_PX: Record<string, number> = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
  control: 6,
  surface: 12,
  pill: 9999,
};

/** space.<name> → px. */
const SPACE_PX: Record<string, number> = {
  '0': 0,
  '1': 4,
  '2': 8,
  '3': 12,
  '4': 16,
  '5': 20,
  '6': 24,
  '7': 28,
  '8': 32,
  '9': 36,
  '10': 40,
  '12': 48,
  '14': 56,
  '16': 64,
  '20': 80,
  '24': 96,
  '28': 112,
  '32': 128,
  px: 1,
  '0.5': 2,
  '1.5': 6,
  '2.5': 10,
  '3.5': 14,
};

/** size.control.<name> → px (control heights). */
const SIZE_PX: Record<string, number> = {
  'size.control.sm': 32,
  'size.control.md': 40,
  'size.control.lg': 48,
};

/** Literal drop-shadow fallbacks keyed by effect-style name. Mirrors tokens.effectStyles. */
const SHADOW_LIT: Record<string, DropShadowEffect[]> = {
  'shadow/xs': [drop(0, 1, 2, 0, 0.06)],
  'shadow/sm': [drop(0, 2, 6, -1, 0.08)],
  'shadow/md': [drop(0, 6, 16, -2, 0.1)],
  'shadow/lg': [drop(0, 12, 28, -4, 0.12)],
  'shadow/xl': [drop(0, 24, 48, -8, 0.16)],
  'shadow/focus': [
    {
      type: 'DROP_SHADOW',
      color: { r: 0.2, g: 0.4, b: 1, a: 0.4 },
      offset: { x: 0, y: 0 },
      radius: 0,
      spread: 3,
      visible: true,
      blendMode: 'NORMAL',
    },
  ],
};

function drop(x: number, y: number, radius: number, spread: number, a: number): DropShadowEffect {
  return {
    type: 'DROP_SHADOW',
    color: { r: 0.0431, g: 0.0549, b: 0.0784, a },
    offset: { x, y },
    radius,
    spread,
    visible: true,
    blendMode: 'NORMAL',
  };
}

/** Strip a `radius.`/`space.` prefix, tolerating either `radius.md` or bare `md`. */
function tail(token: string, prefix: string): string {
  return token.startsWith(prefix) ? token.slice(prefix.length) : token;
}

export function radiusPx(token: string): number {
  const key = tail(token, 'radius.');
  return RADIUS_PX[key] ?? 6;
}

export function spacePx(token: string): number {
  const key = tail(token, 'space.');
  return SPACE_PX[key] ?? 8;
}

export function sizePx(token: string | undefined): number {
  if (!token) return 40;
  return SIZE_PX[token] ?? 40;
}

export function shadowEffects(name: string): DropShadowEffect[] {
  return SHADOW_LIT[name] ?? SHADOW_LIT['shadow/md'];
}

// ── Variable / Effect-style indexes (loaded once per run) ────────────────────────────────────

let varByName: Map<string, Variable> | null = null;
let effByName: Map<string, BaseStyle> | null = null;

/** A token id uses dots (`radius.md`); the matching Figma Variable name uses slashes (`radius/md`). */
function varName(tokenId: string): string {
  return tokenId.replace(/\./g, '/');
}

export async function loadTokenIndexes(): Promise<{ variables: number; effects: number }> {
  const vars = await figma.variables.getLocalVariablesAsync();
  varByName = new Map(vars.map((v) => [v.name, v]));
  const effs = await figma.getLocalEffectStylesAsync();
  effByName = new Map(effs.map((s) => [s.name, s]));
  return { variables: vars.length, effects: effs.length };
}

export function findVariable(tokenId: string): Variable | null {
  if (!varByName) return null;
  return varByName.get(varName(tokenId)) ?? null;
}

export function findEffectStyle(name: string): BaseStyle | null {
  if (!effByName) return null;
  return effByName.get(name) ?? null;
}
