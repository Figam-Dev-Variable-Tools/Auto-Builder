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
  type ColorKey,
  type PresetName,
} from '../presets'

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

const COLLECTION_NAMES = ['DS Color', 'DS Typography', 'DS Radius·Spacing']

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

  const textStyles: Array<{ name: string; size: number; bold: boolean }> = [
    { name: 'DS/Display', size: sizes.xxl, bold: true },
    { name: 'DS/Title', size: sizes.xl, bold: true },
    { name: 'DS/Body', size: sizes.md, bold: false },
    { name: 'DS/Caption', size: sizes.sm, bold: false },
  ]
  for (const def of textStyles) {
    const style = figma.createTextStyle()
    style.name = def.name
    style.fontName = { family: familyName, style: def.bold ? 'Bold' : 'Regular' }
    style.fontSize = def.size
    style.lineHeight = { value: 150, unit: 'PERCENT' }
  }

  return {
    warnings,
    collections: { color: colorCol, typography: typoCol, radiusSpacing: rsCol },
    colorVariables,
  }
}
