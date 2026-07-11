// 부록 C 프리셋 고정값 — 플러그인 임베드 사본 (tokens/*.json과 동일 값)
// 2026-07-10 오너 지시: toss 프리셋을 참조 디자인(클린 SaaS 시트) 기준으로 재조정하고
// 전 프리셋에 warning/bgSubtle/border 키 추가 (부록 C 원표 대비 확장).
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

export const PRESETS: Record<PresetName, TokensJson> = {
  bootstrap: {
    $preset: 'bootstrap',
    color: {
      primary: '#7952B3',
      secondary: '#6C757D',
      error: '#DC3545',
      success: '#198754',
      warning: '#FFC107',
      bg: '#FFFFFF',
      bgSubtle: '#F8F9FA',
      text: '#212529',
      border: '#DEE2E6',
    },
    typography: {
      fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
      baseSize: 16,
      scale: 1.25,
      sizes: computeSizes(16, 1.25),
      weights: { regular: 400, medium: 500, bold: 700 },
    },
    radius: { sm: 4, md: 8, lg: 12 },
    spacing: { '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24 },
  },
  tailwind: {
    $preset: 'tailwind',
    color: {
      primary: '#06B6D4',
      secondary: '#64748B',
      error: '#EF4444',
      success: '#22C55E',
      warning: '#F59E0B',
      bg: '#FFFFFF',
      bgSubtle: '#F9FAFB',
      text: '#0F172A',
      border: '#E5E7EB',
    },
    typography: {
      fontFamily: "'Inter', system-ui, sans-serif",
      baseSize: 16,
      scale: 1.25,
      sizes: computeSizes(16, 1.25),
      weights: { regular: 400, medium: 500, bold: 700 },
    },
    radius: { sm: 4, md: 8, lg: 12 },
    spacing: { '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24 },
  },
  toss: {
    $preset: 'toss',
    color: {
      primary: '#3D6BFF',
      secondary: '#4E5968',
      error: '#F04452',
      success: '#00C471',
      warning: '#FF9F0A',
      bg: '#FFFFFF',
      bgSubtle: '#F5F7FA',
      text: '#191F28',
      border: '#E5E8EB',
    },
    typography: {
      fontFamily: "'Pretendard', -apple-system, sans-serif",
      baseSize: 16,
      scale: 1.2,
      sizes: computeSizes(16, 1.2),
      weights: { regular: 400, medium: 500, bold: 700 },
    },
    radius: { sm: 4, md: 8, lg: 12 },
    spacing: { '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24 },
  },
}

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
