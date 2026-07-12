// 프리셋 고정값 — tokens/*.json 단일 소스(SSOT)에서 생성된 presets.data.ts를 사용한다.
// scripts/build-tokens.mjs가 Storybook CSS 변수(--ds-*)와 이 데이터를 함께 생성 →
// Storybook ⇄ Figma 값이 구조적으로 절대 어긋날 수 없다(완전한 양방향성).
import { PRESET_DATA } from './presets.data'

export type PresetName = 'bootstrap' | 'tailwind' | 'toss'

export type ColorKey =
  | 'primary'
  | 'secondary'
  | 'error'
  | 'success'
  | 'warning'
  | 'bg'
  | 'bgSubtle'
  | 'text'
  | 'border'
export type SizeKey = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'
export type WeightKey = 'regular' | 'medium' | 'bold'
export type RadiusKey = 'sm' | 'md' | 'lg'
export type SpacingKey = '1' | '2' | '3' | '4' | '5' | '6'

export interface TokensJson {
  $preset: PresetName
  color: Record<ColorKey, string>
  typography: {
    fontFamily: string
    baseSize: number
    scale: number
    sizes: Record<SizeKey, number>
    weights: Record<WeightKey, number>
  }
  radius: Record<RadiusKey, number>
  spacing: Record<SpacingKey, number>
}

export const COLOR_KEYS: ColorKey[] = [
  'primary',
  'secondary',
  'error',
  'success',
  'warning',
  'bg',
  'bgSubtle',
  'text',
  'border',
]
export const SIZE_KEYS: SizeKey[] = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
export const WEIGHT_KEYS: WeightKey[] = ['regular', 'medium', 'bold']
export const RADIUS_KEYS: RadiusKey[] = ['sm', 'md', 'lg']
export const SPACING_KEYS: SpacingKey[] = ['1', '2', '3', '4', '5', '6']

// sizes = round(baseSize × scale^n), n = -2..3 (부록 C 공식)
export function computeSizes(baseSize: number, scale: number): Record<SizeKey, number> {
  const exp = [-2, -1, 0, 1, 2, 3]
  const out = {} as Record<SizeKey, number>
  SIZE_KEYS.forEach((k, i) => {
    out[k] = Math.round(baseSize * Math.pow(scale, exp[i]))
  })
  return out
}

export const PRESETS: Record<PresetName, TokensJson> = PRESET_DATA

export const PRESET_NAMES: PresetName[] = ['bootstrap', 'tailwind', 'toss']

export function hexToRgb(hex: string): RGB {
  const h = (hex || '#000000').replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  }
}

export function rgbToHex(rgb: RGB): string {
  const c = (v: number) =>
    Math.round(v * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
  return `#${c(rgb.r)}${c(rgb.g)}${c(rgb.b)}`
}

/** fontFamily CSS 문자열에서 첫 패밀리명 추출: "'Pretendard', ..." → "Pretendard" */
export function firstFontFamily(fontFamily: string): string {
  const first = fontFamily.split(',')[0].trim()
  return first.replace(/^['"]|['"]$/g, '')
}
