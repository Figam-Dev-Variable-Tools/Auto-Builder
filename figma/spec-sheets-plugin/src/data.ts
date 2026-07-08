/**
 * data — typed view over the bundled spec-data.json.
 *
 * spec-data.json is generated (see ../build-spec-data.ts) verbatim from every component's
 * `*.meta.ts`. Nothing in this plugin invents prop names, options, defaults or figma types —
 * they are read from here. We cast the raw JSON to explicit interfaces so the rest of the
 * codebase gets real types instead of a giant structurally-inferred union.
 */
import raw from '../spec-data.json';

export type FigmaType = 'BOOLEAN' | 'TEXT' | 'INSTANCE_SWAP';

export interface VariantProp {
  name: string;
  label?: string;
  options: string[];
  default?: string;
  description?: string;
}

export interface ComponentProp {
  name: string;
  type: string;
  default?: string | number | boolean;
  description?: string;
  options?: string[];
  figmaType: FigmaType;
}

export interface TokenRef {
  property: string;
  token: string;
  when?: Record<string, string>;
}

export interface FigmaSpec {
  layoutMode?: 'HORIZONTAL' | 'VERTICAL' | 'NONE';
  itemSpacing?: string;
  paddingX?: string;
  paddingY?: string;
  cornerRadius?: string;
  fill?: string;
  height?: string;
  primaryAxisAlign?: string;
  counterAxisAlign?: string;
}

export interface Customize {
  radius: boolean;
  padding: boolean;
  shadow: boolean;
}

export interface SpecComponent {
  name: string;
  slug: string;
  category: 'atom' | 'molecule' | 'organism';
  description: string;
  tags: string[];
  platforms: string[];
  variantProps: VariantProp[];
  componentProps: ComponentProp[];
  states: string[];
  interactions: string[];
  customize: Customize;
  tokens: TokenRef[];
  figma: FigmaSpec | null;
  isComponentSet: boolean;
}

export interface TokenScaleEntry {
  id: string;
  name: string;
}

export interface SpecData {
  version: number;
  count: number;
  tokenScales: {
    radius: TokenScaleEntry[];
    spacing: TokenScaleEntry[];
    shadowStyles: string[];
  };
  components: SpecComponent[];
}

export const data = raw as unknown as SpecData;

/** Human-friendly platform pill labels. Only platforms present in the data are ever rendered. */
export const PLATFORM_LABEL: Record<string, string> = {
  web: '🌐 Web',
  android: '🤖 Android',
  ios: '🍎 iOS',
};
