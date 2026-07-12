// P2 — tokens → Figma Variables / Text Styles 생성
import {
  COLOR_KEYS,
  PRESETS,
  PRESET_NAMES,
  RADIUS_KEYS,
  SIZE_KEYS,
  SPACING_KEYS,
  WEIGHT_KEYS,
  computeSizes,
  firstFontFamily,
  hexToRgb,
  rgbToHex,
  type ColorKey,
  type PresetName,
} from '../presets'

// 팔레트 틴트/셰이드 계산(오너: 컬러팔레트 100~900도 전부 변수 등록).
function mixHex(hex: string, target: string, amt: number): string {
  const a = hexToRgb(hex)
  const b = hexToRgb(target)
  return rgbToHex({ r: a.r + (b.r - a.r) * amt, g: a.g + (b.g - a.g) * amt, b: a.b + (b.b - a.b) * amt })
}
// 10단 팔레트(오너: 컬러팔레트 더 많이) — 50·100·200·300·400·500·600·700·800·900.
const SHADE_STEPS: Array<[string, (h: string) => string]> = [
  ['50', (h) => mixHex(h, '#FFFFFF', 0.9)],
  ['100', (h) => mixHex(h, '#FFFFFF', 0.8)],
  ['200', (h) => mixHex(h, '#FFFFFF', 0.62)],
  ['300', (h) => mixHex(h, '#FFFFFF', 0.44)],
  ['400', (h) => mixHex(h, '#FFFFFF', 0.24)],
  ['500', (h) => h],
  ['600', (h) => mixHex(h, '#000000', 0.12)],
  ['700', (h) => mixHex(h, '#000000', 0.24)],
  ['800', (h) => mixHex(h, '#000000', 0.36)],
  ['900', (h) => mixHex(h, '#000000', 0.48)],
]
const PALETTE_KEYS: ColorKey[] = ['primary', 'secondary', 'error', 'success', 'warning']

export type GenerateTokensPayload = {
  preset: PresetName
  colors: Record<ColorKey, string>
  typography: { fontFamily: string; baseSize: number; scale: number }
}

export type TokenGenResult = {
  warnings: string[]
  collections: {
    color: VariableCollection
    typography: VariableCollection
    radiusSpacing: VariableCollection
  }
  colorVariables: Record<ColorKey, Variable>
}

export const COLLECTION_NAMES = ['DS Color', 'DS Typography', 'DS Radius·Spacing']

async function existingCollections(): Promise<string[]> {
  const all = await figma.variables.getLocalVariableCollectionsAsync()
  return all.map((c) => c.name)
}

/** §0-15 멱등 가드: 같은 이름 컬렉션 존재 시 중단 */
export async function guardExisting(): Promise<string | null> {
  const names = await existingCollections()
  const dup = COLLECTION_NAMES.filter((n) => names.includes(n))
  if (dup.length > 0) return `이미 존재: ${dup.join(', ')} — 생성을 중단했습니다(§0-15). 삭제는 하지 않습니다.`
  return null
}

export async function generateTokens(payload: GenerateTokensPayload): Promise<TokenGenResult> {
  const warnings: string[] = []
  // 무효/중복 이름이 있어도 전체 생성이 중단되지 않도록 안전 래퍼(경고만 남기고 계속).
  const safeVar = (name: string, col: VariableCollection, type: 'FLOAT' | 'COLOR' | 'STRING'): Variable | null => {
    try {
      return figma.variables.createVariable(name, col, type)
    } catch (e) {
      warnings.push(`변수 '${name}' 건너뜀: ${e instanceof Error ? e.message : String(e)}`)
      return null
    }
  }

  // 1. "DS Color" — 3 modes (보정 #8: 첫 모드 rename 후 addMode)
  const colorCol = figma.variables.createVariableCollection('DS Color')
  colorCol.renameMode(colorCol.modes[0].modeId, PRESET_NAMES[0]) // bootstrap
  const modeIds: Record<PresetName, string> = {
    bootstrap: colorCol.modes[0].modeId,
    tailwind: colorCol.addMode('tailwind'),
    toss: colorCol.addMode('toss'),
  }

  const colorVariables = {} as Record<ColorKey, Variable>
  for (const key of COLOR_KEYS) {
    const v = figma.variables.createVariable(`color/${key}`, colorCol, 'COLOR')
    for (const preset of PRESET_NAMES) {
      // 선택 프리셋 mode에는 UI 입력값, 나머지는 부록 C 기본값.
      // UI가 보내지 않은 색(warning/bgSubtle/border 등)은 프리셋 기본값으로 폴백.
      const fromUi = preset === payload.preset ? payload.colors[key] : undefined
      const hex = fromUi ?? PRESETS[preset].color[key]
      v.setValueForMode(modeIds[preset], hexToRgb(hex))
    }
    colorVariables[key] = v
  }

  // 1b. 컬러 팔레트 셰이드 — color/<key>/100·300·500·700·900 (모드별 base에서 계산)
  for (const key of PALETTE_KEYS) {
    for (const [step, fn] of SHADE_STEPS) {
      const v = figma.variables.createVariable(`color/${key}/${step}`, colorCol, 'COLOR')
      for (const preset of PRESET_NAMES) {
        const fromUi = preset === payload.preset ? payload.colors[key] : undefined
        const base = fromUi ?? PRESETS[preset].color[key]
        v.setValueForMode(modeIds[preset], hexToRgb(fn(base)))
      }
    }
  }

  // 2. "DS Typography" — 단일 mode
  const typoCol = figma.variables.createVariableCollection('DS Typography')
  const typoMode = typoCol.modes[0].modeId

  const family = figma.variables.createVariable('font/family', typoCol, 'STRING')
  family.setValueForMode(typoMode, payload.typography.fontFamily)

  const sizes = computeSizes(payload.typography.baseSize, payload.typography.scale)
  const sizeVars: Partial<Record<(typeof SIZE_KEYS)[number], Variable>> = {}
  for (const key of SIZE_KEYS) {
    const v = figma.variables.createVariable(`font/size/${key}`, typoCol, 'FLOAT')
    v.setValueForMode(typoMode, sizes[key])
    sizeVars[key] = v
  }
  // 오너: Figma 내 텍스트를 전부 변수로 — 컴포넌트가 쓰는 픽셀 크기도 font/size/<px> 변수로.
  for (const px of [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 26, 28, 30, 32, 36, 40]) {
    safeVar(`font/size/${px}`, typoCol, 'FLOAT')?.setValueForMode(typoMode, px)
  }
  const weights = { regular: 400, medium: 500, bold: 700 }
  for (const key of WEIGHT_KEYS) {
    const v = figma.variables.createVariable(`font/weight/${key}`, typoCol, 'FLOAT')
    v.setValueForMode(typoMode, weights[key])
  }

  // 3. "DS Radius·Spacing" — 단일 mode
  const rsCol = figma.variables.createVariableCollection('DS Radius·Spacing')
  const rsMode = rsCol.modes[0].modeId
  const radius = { sm: 4, md: 8, lg: 12 }
  for (const key of RADIUS_KEYS) {
    const v = figma.variables.createVariable(`radius/${key}`, rsCol, 'FLOAT')
    v.setValueForMode(rsMode, radius[key])
  }
  const spacing: Record<string, number> = { '1': 4, '2': 8, '3': 12, '4': 16, '5': 20, '6': 24 }
  for (const key of SPACING_KEYS) {
    const v = figma.variables.createVariable(`spacing/${key}`, rsCol, 'FLOAT')
    v.setValueForMode(rsMode, spacing[key])
  }
  // 보더 두께(외곽선)도 변수로 — 오너: 보더/외곽선도 변수로 등록.
  for (const [name, w] of [
    ['border/width', 1],
    ['border/width-thick', 2],
  ] as Array<[string, number]>) {
    const v = figma.variables.createVariable(name, rsCol, 'FLOAT')
    v.setValueForMode(rsMode, w)
  }
  // 오너: 보더·마진·라운드도 전부 변수로 — 컴포넌트가 쓰는 px 값을 변수로 등록해 후처리 바인딩.
  // 마진/패딩은 별도 네임스페이스 space/<px> (semantic spacing/1..6과 이름 충돌 방지).
  for (const px of [2, 4, 5, 6, 7, 8, 10, 12, 13, 14, 16, 18, 20, 24, 999]) {
    safeVar(`radius/${px}`, rsCol, 'FLOAT')?.setValueForMode(rsMode, px)
  }
  for (const px of [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 18, 20, 22, 24, 28, 32, 40]) {
    safeVar(`space/${px}`, rsCol, 'FLOAT')?.setValueForMode(rsMode, px)
  }
  // border는 정수 두께만(1.5 등 소수점은 Figma 변수명에서 무효 → 리터럴 유지).
  for (const w of [1, 2, 3]) {
    safeVar(`border/${w}`, rsCol, 'FLOAT')?.setValueForMode(rsMode, w)
  }
  // 오너: 불투명도도 변수로 — 컴포넌트가 쓰는 opacity를 opacity/<pct> 변수로(45=비활성 등).
  for (const pct of [30, 45, 50, 60, 90, 100]) {
    safeVar(`opacity/${pct}`, rsCol, 'FLOAT')?.setValueForMode(rsMode, pct / 100)
  }

  // 4. Text Styles — DS/Display·Title·Body·Caption (로드 실패 시 Inter 폴백)
  let familyName = firstFontFamily(payload.typography.fontFamily)
  try {
    await figma.loadFontAsync({ family: familyName, style: 'Regular' })
    await figma.loadFontAsync({ family: familyName, style: 'Bold' })
  } catch {
    warnings.push(`폰트 '${familyName}' 로드 실패 — Inter로 폴백했습니다 (조직에 폰트 설치 필요).`)
    familyName = 'Inter'
    await figma.loadFontAsync({ family: familyName, style: 'Regular' })
    await figma.loadFontAsync({ family: familyName, style: 'Bold' })
  }

  // 오너: 각 폰트 크기별·굵기별로 Text Style 등록.
  const sizeStyles: Array<[string, number]> = [
    ['Display', sizes.xxl],
    ['Title', sizes.xl],
    ['Heading', sizes.lg],
    ['Body', sizes.md],
    ['Caption', sizes.sm],
    ['Small', sizes.xs],
  ]
  const weightStyles: string[] = ['Regular', 'Bold']
  try {
    await figma.loadFontAsync({ family: familyName, style: 'Medium' })
    weightStyles.splice(1, 0, 'Medium') // Regular · Medium · Bold
  } catch {
    /* Medium 미제공 폰트 — 건너뜀 */
  }
  for (const [sname, size] of sizeStyles) {
    for (const wstyle of weightStyles) {
      const style = figma.createTextStyle()
      style.name = `DS/${sname}/${wstyle}`
      style.fontName = { family: familyName, style: wstyle }
      style.fontSize = size
      style.lineHeight = { value: 150, unit: 'PERCENT' }
    }
  }

  return {
    warnings,
    collections: { color: colorCol, typography: typoCol, radiusSpacing: rsCol },
    colorVariables,
  }
}
