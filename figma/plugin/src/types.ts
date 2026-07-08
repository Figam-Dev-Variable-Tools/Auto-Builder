// Types mirror figma/tds.plugin.json verbatim — the generated contract.
// Do not add, rename, or drop fields here; the plugin reproduces exactly what the
// bundle describes.

export type FigmaVarType = 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

export type ModeValue =
  | { type: 'COLOR'; value: string; rgba: Rgba }
  | { type: 'FLOAT'; value: number }
  | { type: 'STRING'; value: string }
  | { type: 'BOOLEAN'; value: boolean }
  | {
      type: 'VARIABLE_ALIAS';
      aliasId: string;
      aliasName: string;
      aliasCollection: string;
    };

export interface VariableDef {
  id: string;
  name: string;
  type: string;
  figmaType: FigmaVarType;
  scopes: string[];
  description: string;
  group: string;
  valuesByMode: Record<string, ModeValue>;
}

export interface CollectionDef {
  name: string;
  modes: string[];
  variables: VariableDef[];
}

export interface DropShadowEffect {
  type: 'DROP_SHADOW' | 'INNER_SHADOW';
  color: Rgba;
  offset: { x: number; y: number };
  radius: number;
  spread: number;
  visible: boolean;
  blendMode: BlendMode;
}

export interface EffectStyleDef {
  id: string;
  name: string;
  description: string;
  effects: DropShadowEffect[];
}

export interface TextStyleDef {
  id: string;
  name: string;
  description: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeightPercent: number;
  letterSpacingEm: number;
}

export interface TokensBundle {
  collections: CollectionDef[];
  effectStyles: EffectStyleDef[];
  textStyles: TextStyleDef[];
}

export interface VariantAxis {
  name: string;
  label: string;
  options: string[];
  default: string;
}

export type FigmaPropertyType = 'VARIANT' | 'TEXT' | 'BOOLEAN' | 'INSTANCE_SWAP';

export interface FigmaProperty {
  name: string;
  propName: string;
  figmaPropertyType: FigmaPropertyType;
  values?: string[];
  defaultValue?: string | boolean;
  description?: string;
}

export interface TokenBinding {
  property: string;
  token: string;
  when?: Record<string, string>;
}

export interface FigmaBase {
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  itemSpacing?: string;
  paddingX?: string;
  paddingY?: string;
  cornerRadius?: string;
  fill?: string;
  height?: string;
  strokeColor?: string;
  strokeWidth?: string;
  primaryAxisAlign?: 'MIN' | 'CENTER' | 'MAX' | 'SPACE_BETWEEN';
  counterAxisAlign?: 'MIN' | 'CENTER' | 'MAX' | 'BASELINE';
}

export interface ComponentDef {
  name: string;
  slug: string;
  category: string;
  description: string;
  tags: string[];
  isComponentSet: boolean;
  figmaVariantCombinations: number;
  reactVariantCount: number;
  states: string[];
  variantAxes: VariantAxis[];
  figmaProperties: FigmaProperty[];
  tokenBindings: TokenBinding[];
  figma: FigmaBase;
  a11y?: { role?: string; keyboard?: string[]; notes?: string[] };
  responsive?: string;
}

export interface DesignBundle {
  name: string;
  description: string;
  summary?: unknown;
  /** Per-icon inner SVG markup (icon name → concatenated shape tags), from icons.tsx. */
  icons?: Record<string, string>;
  components: ComponentDef[];
}

export interface Bundle {
  version: number;
  generator: string;
  tokens: TokensBundle;
  design: DesignBundle;
}
