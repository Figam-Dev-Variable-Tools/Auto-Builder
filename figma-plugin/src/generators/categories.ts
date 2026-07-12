// 컴포넌트 카테고리 문서 — 네이티브 편집형 컴포넌트(베리언트) + TDS 문서.
// 오너: "완벽한 문서 + 피그마 디자인 컴포넌트 베리언트". 스펙: docs/spec/*.
// 카테고리: Input(8) · Selection(4) · Action(2). 같은 machinery로 이후 확장.
import {
  type Ctx,
  solid,
  boundPaint,
  autoFrame,
  txt,
  makeRoot,
  makeHeader,
  makeSection,
  setup,
  placeRoot,
  INK,
  SUB,
  MUTED,
  BORDER,
  SURFACE,
  ACCENT,
  WHITE,
} from './foundations'
import { iconInstance, ICON_COMPONENTS } from './icon-vec'

const FIELD_W = 300
// 오너 규칙: 페이지 탭은 "순번. System - 이름". 절취선은 하이픈 라인.
const DIVIDER_PAGE = '---------------------------'
const PAGE_INPUT = '1. System - Input'
const PAGE_SELECTION = '2. System - Selection'
const PAGE_ACTION = '3. System - Action'
const PAGE_FEEDBACK = '4. System - Feedback'
const PAGE_NAV = '5. System - Navigation'
const PAGE_LAYOUT = '6. System - Layout'
const PAGE_OVERLAY = '7. System - Overlay'
const PAGE_DATA = '8. System - Data'
// 컴포넌트 세트는 별도 소스 페이지 없이 각 카테고리 페이지에 함께 둔다.
// 레거시 이름들은 reset 정리용으로만 남긴다(생성하지 않음).
export const CATEGORY_PAGE_NAMES = [
  DIVIDER_PAGE,
  PAGE_INPUT,
  PAGE_SELECTION,
  PAGE_ACTION,
  PAGE_FEEDBACK,
  PAGE_NAV,
  PAGE_LAYOUT,
  PAGE_OVERLAY,
  PAGE_DATA,
  'DS · 컴포넌트 소스',
  'Input',
  'Selection',
  'Action',
  '1. Molecule - Input',
  '2. Atom - Selection',
  '3. Atom - Action',
  '✂ ─────────  컴포넌트  ─────────',
]

const VARIANT_HEX: Record<string, string> = {
  primary: ACCENT,
  secondary: SUB,
  error: '#F04452',
  success: '#00C471',
}

// ── 색 바인딩 헬퍼 ────────────────────────────────────────────────────
function boundText(ctx: Ctx, chars: string, size: number, varName: string, hex: string, bold = false): TextNode {
  const t = txt(ctx, chars, size, hex, bold)
  const v = ctx.vars.get(varName)
  if (v) t.fills = [boundPaint(v)]
  return t
}
function bindFillVar(ctx: Ctx, node: GeometryMixin, varName: string, hex: string) {
  const v = ctx.vars.get(varName)
  node.fills = [v ? boundPaint(v) : solid(hex)]
}
function bindStrokeVar(ctx: Ctx, node: MinimalStrokesMixin, varName: string, hex: string) {
  const v = ctx.vars.get(varName)
  node.strokes = [v ? boundPaint(v) : solid(hex)]
}
function iconNode(_ctx: Ctx, key: string, size: number, hex: string): SceneNode {
  const ic = iconInstance(key, 'icon', size)
  recolorIcon(ic, hex)
  return ic
}
function fixedFrame(name: string, dir: 'HORIZONTAL' | 'VERTICAL', w: number, h: number): FrameNode {
  const f = figma.createFrame()
  f.name = name
  f.layoutMode = dir
  f.primaryAxisSizingMode = 'FIXED'
  f.counterAxisSizingMode = 'FIXED'
  f.resize(w, h)
  f.fills = []
  return f
}

// 아이콘 인스턴스는 icon-vec.ts의 ICON_COMPONENTS(Icon System 페이지가 채움)를 직접 참조.
const ICON_DEFAULT = '_Icon/Star'

// ── 컴포넌트 속성(속성 만들기) 헬퍼 ──────────────────────────────────
function addTextProp(set: ComponentSetNode, prop: string, layer: string, def: string) {
  try {
    const id = set.addComponentProperty(prop, 'TEXT', def)
    for (const n of set.findAll((x) => x.type === 'TEXT' && x.name === layer)) {
      ;(n as TextNode).componentPropertyReferences = { ...(n.componentPropertyReferences || {}), characters: id }
    }
  } catch {
    /* 이미 있거나 대상 없음 */
  }
}
function addBoolProp(set: ComponentSetNode, prop: string, layer: string, def: boolean) {
  try {
    const id = set.addComponentProperty(prop, 'BOOLEAN', def)
    for (const n of set.findAll((x) => x.name === layer)) {
      n.componentPropertyReferences = { ...(n.componentPropertyReferences || {}), visible: id }
    }
  } catch {
    /* skip */
  }
}
function addSwapProp(set: ComponentSetNode, prop: string, layer: string, defKey: string) {
  const comp = ICON_COMPONENTS.get(defKey)
  if (!comp) return
  try {
    const id = set.addComponentProperty(prop, 'INSTANCE_SWAP', comp.id)
    for (const n of set.findAll((x) => x.type === 'INSTANCE' && x.name === layer)) {
      ;(n as InstanceNode).componentPropertyReferences = { ...(n.componentPropertyReferences || {}), mainComponent: id }
    }
  } catch {
    /* skip */
  }
}

// ── 제네릭 베리언트 세트 빌더 ────────────────────────────────────────
type Axis = { name: string; values: string[] }
type State = { caption: string; props: Record<string, string> }
type PropSpec = {
  texts?: Array<{ prop: string; layer: string; def: string }>
  bools?: Array<{ prop: string; layer: string; def: boolean }>
  swaps?: Array<{ prop: string; layer: string; defKey: string }>
}

// 세트는 페이지에 만들고(소스), 문서에는 인스턴스를 배치한다(오토레이아웃 안 세트 직접배치는 Figma에서 오작동).
function buildSet(
  ctx: Ctx,
  page: PageNode,
  setName: string,
  axes: Axis[],
  render: (combo: Record<string, string>) => ComponentNode,
  props?: PropSpec,
): ComponentSetNode {
  let combos: Record<string, string>[] = [{}]
  for (const axis of axes) {
    const next: Record<string, string>[] = []
    for (const c of combos) for (const v of axis.values) next.push({ ...c, [axis.name]: v })
    combos = next
  }
  const variants = combos.map((combo) => {
    const comp = render(combo)
    comp.name = axes.map((a) => `${a.name}=${combo[a.name]}`).join(', ')
    page.appendChild(comp)
    return comp
  })
  const set = figma.combineAsVariants(variants, page)
  set.name = setName
  set.layoutMode = 'HORIZONTAL'
  set.layoutWrap = 'WRAP'
  set.itemSpacing = 20
  set.counterAxisSpacing = 20
  set.paddingTop = set.paddingRight = set.paddingBottom = set.paddingLeft = 24
  set.fills = [solid('#FBFCFE')]

  // 속성 만들기: 텍스트(+표시 on/off)·불리언·인스턴스 스왑
  if (props) {
    props.texts?.forEach((t) => {
      addTextProp(set, t.prop, t.layer, t.def)
      addBoolProp(set, `Show ${t.prop}`, t.layer, true) // 오너: 라벨/텍스트 on/off 토글
    })
    props.bools?.forEach((b) => addBoolProp(set, b.prop, b.layer, b.def))
    props.swaps?.forEach((s) => addSwapProp(set, s.prop, s.layer, s.defKey))
  }
  return set
}

// ══ INPUT 계열 ═══════════════════════════════════════════════════════
type Affordance = {
  leading?: 'search'
  trailing?: 'eye' | 'clear' | 'unit' | 'stepper'
  unit?: string
  otp?: number
  textarea?: boolean
}
type InputDef = {
  key: string
  setName: string
  label: string
  placeholder: string
  eyebrow: string
  desc: string
  helper: string
  affordance: Affordance
  axes: string[]
  states: State[]
}
const INPUTS: InputDef[] = [
  { key: 'TextField', setName: 'DS/TextField', label: '이메일', placeholder: 'name@example.com', eyebrow: 'MOLECULE · INPUT', desc: '라벨·설명·헬퍼텍스트를 지원하는 기본 한 줄 텍스트 입력.', helper: '업무용 이메일을 입력하세요.', affordance: {}, axes: ['error', 'success', 'disabled', 'readOnly'], states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Success', props: { success: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }, { caption: 'ReadOnly', props: { readOnly: 'true' } }] },
  { key: 'EmailField', setName: 'DS/EmailField', label: '이메일', placeholder: 'name@example.com', eyebrow: 'MOLECULE · INPUT', desc: '블러 시 이메일 형식을 검증해 에러/성공을 표시하는 입력.', helper: '가입에 사용할 이메일이에요.', affordance: {}, axes: ['error', 'success', 'disabled', 'required'], states: [{ caption: 'Default', props: {} }, { caption: 'Required', props: { required: 'true' } }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Success', props: { success: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }] },
  { key: 'PasswordField', setName: 'DS/PasswordField', label: '비밀번호', placeholder: '8자 이상 입력', eyebrow: 'MOLECULE · INPUT', desc: '표시/숨김 눈 아이콘 토글이 붙은 비밀번호 입력.', helper: '영문·숫자·기호를 조합하세요.', affordance: { trailing: 'eye' }, axes: ['error', 'success', 'disabled', 'required'], states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Success', props: { success: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }, { caption: 'Required', props: { required: 'true' } }] },
  { key: 'SearchField', setName: 'DS/SearchField', label: '검색', placeholder: '검색어를 입력하세요', eyebrow: 'MOLECULE · INPUT', desc: '검색 아이콘과 지우기 버튼을 가진 검색창.', helper: '', affordance: { leading: 'search', trailing: 'clear' }, axes: ['disabled'], states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { disabled: 'true' } }] },
  { key: 'NumberField', setName: 'DS/NumberField', label: '수량', placeholder: '0', eyebrow: 'MOLECULE · INPUT', desc: '단위 표기 + 증감(−/+) 스테퍼가 붙은 숫자 입력.', helper: '', affordance: { trailing: 'stepper', unit: '개' }, axes: ['disabled', 'readOnly'], states: [{ caption: 'Default', props: {} }, { caption: 'ReadOnly', props: { readOnly: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }] },
  { key: 'CurrencyField', setName: 'DS/CurrencyField', label: '금액', placeholder: '0', eyebrow: 'MOLECULE · INPUT', desc: '천단위 콤마 + 통화 단위 표기가 붙은 금액 입력.', helper: '최대 50,000원까지 입력할 수 있어요.', affordance: { trailing: 'unit', unit: '원' }, axes: ['error', 'disabled', 'readOnly'], states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'ReadOnly', props: { readOnly: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }] },
  { key: 'OtpField', setName: 'DS/OtpField', label: '인증번호', placeholder: '', eyebrow: 'MOLECULE · INPUT', desc: '자릿수만큼 분리된 셀에 입력하는 인증번호(OTP) 필드.', helper: '문자로 받은 6자리를 입력하세요.', affordance: { otp: 6 }, axes: ['error', 'disabled'], states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }] },
  { key: 'Textarea', setName: 'DS/Textarea', label: '내용', placeholder: '내용을 입력하세요', eyebrow: 'MOLECULE · INPUT', desc: '자동 높이 조절 + 글자수 카운터가 붙은 여러 줄 텍스트 입력.', helper: '10자 이상 입력하세요.', affordance: { textarea: true }, axes: ['error', 'disabled', 'readOnly', 'required'], states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'ReadOnly', props: { readOnly: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }, { caption: 'Required', props: { required: 'true' } }] },
]

function errorMsg(key: string): string {
  if (key === 'EmailField' || key === 'TextField') return '올바른 이메일 형식이 아닙니다.'
  if (key === 'PasswordField') return '비밀번호가 너무 짧습니다.'
  if (key === 'CurrencyField') return '잔액이 부족합니다.'
  if (key === 'OtpField') return '인증번호가 일치하지 않습니다.'
  return '입력값을 확인하세요.'
}

function renderInput(ctx: Ctx, def: InputDef, combo: Record<string, string>): ComponentNode {
  const error = combo.error === 'true'
  const success = combo.success === 'true'
  const disabled = combo.disabled === 'true'
  const readOnly = combo.readOnly === 'true'
  const required = combo.required === 'true'
  const toneVar = error ? 'color/error' : success ? 'color/success' : null
  const toneHex = error ? '#F04452' : success ? '#00C471' : null

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(FIELD_W, c.height)
  c.primaryAxisSizingMode = 'AUTO'
  c.itemSpacing = 6
  c.fills = []
  if (disabled) c.opacity = 0.45

  const labelRow = autoFrame('label-row', 'HORIZONTAL')
  labelRow.itemSpacing = 2
  const labelText = boundText(ctx, def.label, 13, 'color/text', INK, true)
  labelText.name = 'Label'
  labelRow.appendChild(labelText)
  if (required) labelRow.appendChild(txt(ctx, '*', 13, '#F04452', true))
  c.appendChild(labelRow)

  if (def.affordance.otp) {
    const cells = autoFrame('cells', 'HORIZONTAL')
    cells.layoutAlign = 'STRETCH'
    cells.primaryAxisSizingMode = 'FIXED'
    cells.itemSpacing = 6
    for (let i = 0; i < def.affordance.otp; i++) {
      const cell = autoFrame('cell', 'HORIZONTAL')
      cell.primaryAxisAlignItems = 'CENTER'
      cell.counterAxisAlignItems = 'CENTER'
      cell.layoutGrow = 1
      cell.primaryAxisSizingMode = 'FIXED'
      cell.paddingTop = cell.paddingBottom = 10
      cell.cornerRadius = 8
      bindFillVar(ctx, cell, disabled ? 'color/bgSubtle' : 'color/bg', disabled ? '#F5F7FA' : WHITE)
      bindStrokeVar(ctx, cell, toneVar ?? 'color/border', toneHex ?? BORDER)
      cell.strokeWeight = 1
      cell.strokeAlign = 'INSIDE'
      cell.appendChild(boundText(ctx, i < 3 ? String(i + 1) : '', 16, 'color/text', INK, true))
      cells.appendChild(cell)
    }
    c.appendChild(cells)
  } else {
    const input = autoFrame('input', 'HORIZONTAL')
    input.counterAxisAlignItems = def.affordance.textarea ? 'MIN' : 'CENTER'
    input.layoutAlign = 'STRETCH'
    input.primaryAxisSizingMode = 'FIXED'
    input.itemSpacing = 8
    input.paddingTop = input.paddingBottom = def.affordance.textarea ? 12 : 10
    input.paddingLeft = input.paddingRight = 12
    if (def.affordance.textarea) input.minHeight = 76
    input.cornerRadius = 8
    bindFillVar(ctx, input, disabled || readOnly ? 'color/bgSubtle' : 'color/bg', disabled || readOnly ? '#F5F7FA' : WHITE)
    bindStrokeVar(ctx, input, toneVar ?? 'color/border', toneHex ?? BORDER)
    input.strokeWeight = 1
    input.strokeAlign = 'INSIDE'
    if (def.affordance.leading === 'search') {
      const lead = iconInstance('_Icon/Search', 'Leading Icon', 16)
      recolorIcon(lead, MUTED)
      input.appendChild(lead)
    }
    const val = boundText(ctx, def.placeholder, 15, 'color/secondary', MUTED)
    val.name = 'Value'
    val.layoutGrow = 1
    val.textAutoResize = 'HEIGHT'
    input.appendChild(val)
    if (def.affordance.unit) input.appendChild(txt(ctx, def.affordance.unit, 14, SUB))
    if (def.affordance.trailing === 'eye' || def.affordance.trailing === 'clear') {
      const tr = iconInstance(def.affordance.trailing === 'eye' ? '_Icon/Eye' : '_Icon/Close', 'Trailing Icon', 16)
      recolorIcon(tr, MUTED)
      input.appendChild(tr)
    }
    if (def.affordance.trailing === 'stepper') {
      input.appendChild(iconNode(ctx, '_Icon/Minus', 18, SUB))
      input.appendChild(iconNode(ctx, '_Icon/Plus', 18, SUB))
    }
    c.appendChild(input)
  }

  const helperMsg = error ? errorMsg(def.key) : success ? '사용 가능합니다.' : def.helper
  {
    const helper = boundText(ctx, helperMsg || def.helper || ' ', 12, toneVar ?? 'color/secondary', toneHex ?? SUB)
    helper.name = 'Helper'
    helper.visible = !!helperMsg
    helper.layoutAlign = 'STRETCH'
    helper.textAutoResize = 'HEIGHT'
    c.appendChild(helper)
  }
  return c
}
function makeInputSet(ctx: Ctx, def: InputDef, page: PageNode): ComponentSetNode {
  const props: PropSpec = { texts: [{ prop: 'Label', layer: 'Label', def: def.label }] }
  if (!def.affordance.otp) props.texts!.push({ prop: 'Value', layer: 'Value', def: def.placeholder })
  props.texts!.push({ prop: 'Helper', layer: 'Helper', def: def.helper })
  props.swaps = []
  if (def.affordance.leading === 'search') props.swaps.push({ prop: 'Leading Icon', layer: 'Leading Icon', defKey: '_Icon/Search' })
  if (def.affordance.trailing === 'eye' || def.affordance.trailing === 'clear')
    props.swaps.push({ prop: 'Trailing Icon', layer: 'Trailing Icon', defKey: def.affordance.trailing === 'eye' ? '_Icon/Eye' : '_Icon/Close' })
  return buildSet(ctx, page, def.setName, def.axes.map((a) => ({ name: a, values: ['false', 'true'] })), (combo) => renderInput(ctx, def, combo), props)
}

// ══ SELECTION 계열 ════════════════════════════════════════════════════
function renderToggle(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const checked = combo.checked === 'true'
  const disabled = combo.disabled === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 10
  c.fills = []
  if (disabled) c.opacity = 0.45
  const track = fixedFrame('track', 'HORIZONTAL', 44, 26)
  track.primaryAxisAlignItems = checked ? 'MAX' : 'MIN'
  track.counterAxisAlignItems = 'CENTER'
  track.paddingLeft = track.paddingRight = 3
  track.cornerRadius = 13
  bindFillVar(ctx, track, checked ? 'color/primary' : 'color/border', checked ? ACCENT : BORDER)
  const knob = figma.createEllipse()
  knob.resize(20, 20)
  knob.fills = [solid(WHITE)]
  track.appendChild(knob)
  c.appendChild(track)
  const lbl = boundText(ctx, '알림 받기', 14, 'color/text', INK)
  lbl.name = 'Label'
  c.appendChild(lbl)
  return c
}
function renderCheckbox(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const checked = combo.checked === 'true'
  const indet = combo.indeterminate === 'true'
  const disabled = combo.disabled === 'true'
  const on = checked || indet
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 8
  c.fills = []
  if (disabled) c.opacity = 0.45
  const box = fixedFrame('box', 'HORIZONTAL', 20, 20)
  box.primaryAxisAlignItems = 'CENTER'
  box.counterAxisAlignItems = 'CENTER'
  box.cornerRadius = 6
  bindFillVar(ctx, box, on ? 'color/primary' : 'color/bg', on ? ACCENT : WHITE)
  bindStrokeVar(ctx, box, on ? 'color/primary' : 'color/border', on ? ACCENT : BORDER)
  box.strokeWeight = 1
  box.strokeAlign = 'INSIDE'
  if (checked) box.appendChild(iconNode(ctx, '_Icon/Check', 14, WHITE))
  else if (indet) {
    const dash = figma.createRectangle()
    dash.resize(10, 2)
    dash.cornerRadius = 1
    dash.fills = [solid(WHITE)]
    box.appendChild(dash)
  }
  c.appendChild(box)
  const lbl = boundText(ctx, '약관에 동의합니다', 14, 'color/text', INK)
  lbl.name = 'Label'
  c.appendChild(lbl)
  return c
}
function renderRadio(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const selected = combo.selected === 'true'
  const disabled = combo.disabled === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 8
  c.fills = []
  if (disabled) c.opacity = 0.45
  const outer = fixedFrame('radio', 'HORIZONTAL', 20, 20)
  outer.primaryAxisAlignItems = 'CENTER'
  outer.counterAxisAlignItems = 'CENTER'
  outer.cornerRadius = 10
  bindFillVar(ctx, outer, 'color/bg', WHITE)
  bindStrokeVar(ctx, outer, selected ? 'color/primary' : 'color/border', selected ? ACCENT : BORDER)
  outer.strokeWeight = selected ? 2 : 1
  outer.strokeAlign = 'INSIDE'
  if (selected) {
    const dot = figma.createEllipse()
    dot.resize(9, 9)
    bindFillVar(ctx, dot, 'color/primary', ACCENT)
    outer.appendChild(dot)
  }
  c.appendChild(outer)
  const lbl = boundText(ctx, '선택 옵션', 14, 'color/text', INK)
  lbl.name = 'Label'
  c.appendChild(lbl)
  return c
}
function renderChip(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const selected = combo.selected === 'true'
  const disabled = combo.disabled === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 6
  c.paddingTop = c.paddingBottom = 7
  c.paddingLeft = c.paddingRight = 14
  c.cornerRadius = 999
  bindFillVar(ctx, c, selected ? 'color/primary' : 'color/bgSubtle', selected ? ACCENT : SURFACE)
  if (!selected) {
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }
  if (disabled) c.opacity = 0.45
  const lbl = boundText(ctx, '필터', 13, selected ? 'color/bg' : 'color/text', selected ? WHITE : INK, true)
  lbl.name = 'Label'
  c.appendChild(lbl)
  return c
}

// ══ ACTION 계열 (Button / Badge) ═════════════════════════════════════
/** 인스턴스 아이콘 색 오버라이드(버튼 위 흰색 등). */
function recolorIcon(node: SceneNode, hex: string) {
  if (node.type === 'INSTANCE') {
    const v = node.findOne((n) => n.type === 'VECTOR')
    if (v) (v as VectorNode).strokes = [solid(hex)]
  }
}
function renderButton(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const variant = combo.variant || 'primary'
  const size = combo.size || 'md'
  const disabled = combo.disabled === 'true'
  const pad: Record<string, { v: number; h: number; f: number }> = {
    sm: { v: 7, h: 12, f: 13 },
    md: { v: 10, h: 16, f: 15 },
    lg: { v: 13, h: 20, f: 17 },
  }
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 6
  c.paddingTop = c.paddingBottom = pad[size].v
  c.paddingLeft = c.paddingRight = pad[size].h
  c.cornerRadius = 8
  bindFillVar(ctx, c, `color/${variant}`, VARIANT_HEX[variant] ?? ACCENT)
  if (disabled) c.opacity = 0.45
  const ipx = pad[size].f + 2
  // 왼쪽 아이콘(기본 숨김, 토글 대상)
  const li = iconInstance(ICON_DEFAULT, 'Left Icon', ipx)
  li.visible = false
  recolorIcon(li, WHITE)
  c.appendChild(li)
  const lbl = boundText(ctx, '버튼', pad[size].f, 'color/bg', WHITE, true)
  lbl.name = 'Label'
  c.appendChild(lbl)
  // 오른쪽 아이콘(기본 숨김, 토글 대상)
  const ri = iconInstance('_Icon/ChevronRight', 'Right Icon', ipx)
  ri.visible = false
  recolorIcon(ri, WHITE)
  c.appendChild(ri)
  return c
}
function renderBadge(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const variant = combo.variant || 'primary'
  const size = combo.size || 'md'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.paddingTop = c.paddingBottom = size === 'sm' ? 2 : 4
  c.paddingLeft = c.paddingRight = size === 'sm' ? 7 : 9
  c.cornerRadius = 6
  bindFillVar(ctx, c, `color/${variant}`, VARIANT_HEX[variant] ?? ACCENT)
  const lbl = boundText(ctx, 'Badge', size === 'sm' ? 11 : 13, 'color/bg', WHITE, true)
  lbl.name = 'Label'
  c.appendChild(lbl)
  return c
}

// ══ FEEDBACK 계열 (Alert / Toast / Snackbar / Tooltip / Loading) ═════
const FB_TONE: Record<string, string> = { info: 'primary', success: 'success', warning: 'warning', error: 'error' }
const FB_ICON: Record<string, string> = {
  info: '_Icon/Info',
  success: '_Icon/Check',
  warning: '_Icon/Warning',
  error: '_Icon/AlertCircle',
}
const FB_TITLE: Record<string, string> = { info: '안내', success: '완료', warning: '주의', error: '오류' }
const FB_MSG: Record<string, string> = {
  info: '새로운 업데이트가 있어요.',
  success: '저장되었습니다.',
  warning: '저장 공간이 부족해요.',
  error: '문제가 발생했습니다.',
}
function fbBox(w: number): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'MIN'
  c.itemSpacing = 10
  c.resize(w, c.height)
  c.fills = []
  return c
}
function renderAlert(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const variant = combo.variant || 'info'
  const tone = FB_TONE[variant]
  const c = fbBox(360)
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = 14
  c.cornerRadius = 8
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/' + tone, VARIANT_HEX[tone])
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  const aicon = iconInstance(FB_ICON[variant], 'Icon', 18)
  recolorIcon(aicon, VARIANT_HEX[tone])
  c.appendChild(aicon)
  const col = autoFrame('msg', 'VERTICAL')
  col.layoutGrow = 1
  col.itemSpacing = 2
  const title = boundText(ctx, FB_TITLE[variant], 13, 'color/text', INK, true)
  title.name = 'Title'
  col.appendChild(title)
  const amsg = boundText(ctx, FB_MSG[variant], 12, 'color/secondary', SUB)
  amsg.name = 'Message'
  col.appendChild(amsg)
  c.appendChild(col)
  return c
}
function renderToast(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const variant = combo.variant || 'info'
  const c = fbBox(340)
  c.counterAxisAlignItems = 'CENTER'
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = 14
  c.cornerRadius = 10
  bindFillVar(ctx, c, 'color/bg', WHITE)
  c.effects = [
    { type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.16 }, offset: { x: 0, y: 4 }, radius: 16, spread: 0, visible: true, blendMode: 'NORMAL' },
  ]
  const ticon = iconInstance(FB_ICON[variant], 'Icon', 18)
  recolorIcon(ticon, VARIANT_HEX[FB_TONE[variant]])
  c.appendChild(ticon)
  const msg = boundText(ctx, FB_MSG[variant], 13, 'color/text', INK)
  msg.name = 'Message'
  msg.layoutGrow = 1
  c.appendChild(msg)
  const closeI = iconInstance('_Icon/Close', 'Close Icon', 16)
  recolorIcon(closeI, MUTED)
  c.appendChild(closeI)
  return c
}
function renderSnackbar(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const withAction = combo.action === 'true'
  const c = fbBox(340)
  c.counterAxisAlignItems = 'CENTER'
  c.primaryAxisAlignItems = 'SPACE_BETWEEN'
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = 16
  c.cornerRadius = 8
  c.fills = [solid('#191F28')]
  const msg = txt(ctx, '링크를 복사했어요.', 13, WHITE)
  msg.name = 'Message'
  msg.layoutGrow = 1
  c.appendChild(msg)
  if (withAction) {
    const act = txt(ctx, '실행 취소', 13, '#6C9BFF', true)
    act.name = 'Action'
    c.appendChild(act)
  }
  return c
}
function renderTooltip(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const top = combo.placement === 'top'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 0
  c.fills = []
  const tri = () => {
    const t = figma.createVector()
    t.vectorPaths = [{ windingRule: 'NONZERO', data: top ? 'M0 6 L12 6 L6 0 Z' : 'M0 0 L12 0 L6 6 Z' }]
    t.fills = [solid('#191F28')]
    t.strokes = []
    return t
  }
  const bubble = autoFrame('bubble', 'HORIZONTAL')
  bubble.paddingTop = bubble.paddingBottom = 6
  bubble.paddingLeft = bubble.paddingRight = 10
  bubble.cornerRadius = 6
  bubble.fills = [solid('#191F28')]
  const tipText = txt(ctx, '도움말 텍스트', 12, WHITE)
  tipText.name = 'Label'
  bubble.appendChild(tipText)
  if (top) c.appendChild(tri())
  c.appendChild(bubble)
  if (!top) c.appendChild(tri())
  return c
}
function renderLoading(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const size = combo.size || 'md'
  const px = size === 'sm' ? 18 : size === 'lg' ? 32 : 24
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 10
  c.fills = []
  const licon = iconInstance('_Icon/Refresh', 'Icon', px)
  recolorIcon(licon, VARIANT_HEX.primary)
  c.appendChild(licon)
  const ltext = boundText(ctx, '불러오는 중…', 13, 'color/secondary', SUB)
  ltext.name = 'Label'
  c.appendChild(ltext)
  return c
}

// ══ NAVIGATION (Tab / Breadcrumb / Pagination / Dropdown) ════════════
function renderTab(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const active = combo.active === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 8
  c.paddingTop = c.paddingBottom = 4
  c.fills = []
  const t = boundText(ctx, '메뉴', 14, active ? 'color/primary' : 'color/secondary', active ? ACCENT : SUB, active)
  t.name = 'Label'
  c.appendChild(t)
  const ul = figma.createRectangle()
  ul.resize(40, 2)
  ul.cornerRadius = 1
  ul.layoutAlign = 'STRETCH'
  if (active) bindFillVar(ctx, ul, 'color/primary', ACCENT)
  else ul.fills = []
  c.appendChild(ul)
  return c
}
function renderBreadcrumb(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 6
  c.fills = []
  const chev = () => {
    const i = iconInstance('_Icon/ChevronRight', 'Separator', 14)
    recolorIcon(i, MUTED)
    return i
  }
  const t1 = boundText(ctx, '홈', 13, 'color/secondary', SUB)
  t1.name = 'Item 1'
  c.appendChild(t1)
  c.appendChild(chev())
  const t2 = boundText(ctx, '카테고리', 13, 'color/secondary', SUB)
  t2.name = 'Item 2'
  c.appendChild(t2)
  c.appendChild(chev())
  const t3 = boundText(ctx, '상세 페이지', 13, 'color/text', INK, true)
  t3.name = 'Current'
  c.appendChild(t3)
  return c
}
function renderPagination(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 4
  c.fills = []
  const cell = (label: string, active: boolean) => {
    const f = fixedFrame('cell', 'HORIZONTAL', 32, 32)
    f.primaryAxisAlignItems = 'CENTER'
    f.counterAxisAlignItems = 'CENTER'
    f.cornerRadius = 8
    if (active) bindFillVar(ctx, f, 'color/primary', ACCENT)
    else {
      bindFillVar(ctx, f, 'color/bg', WHITE)
      bindStrokeVar(ctx, f, 'color/border', BORDER)
      f.strokeWeight = 1
      f.strokeAlign = 'INSIDE'
    }
    f.appendChild(boundText(ctx, label, 13, active ? 'color/bg' : 'color/text', active ? WHITE : INK, active))
    return f
  }
  const arrow = (key: string) => {
    const f = fixedFrame('arrow', 'HORIZONTAL', 32, 32)
    f.primaryAxisAlignItems = 'CENTER'
    f.counterAxisAlignItems = 'CENTER'
    f.cornerRadius = 8
    bindFillVar(ctx, f, 'color/bg', WHITE)
    bindStrokeVar(ctx, f, 'color/border', BORDER)
    f.strokeWeight = 1
    f.strokeAlign = 'INSIDE'
    const i = iconInstance(key, 'Arrow', 16)
    recolorIcon(i, SUB)
    f.appendChild(i)
    return f
  }
  c.appendChild(arrow('_Icon/ChevronLeft'))
  c.appendChild(cell('1', true))
  c.appendChild(cell('2', false))
  c.appendChild(cell('3', false))
  c.appendChild(boundText(ctx, '…', 13, 'color/secondary', MUTED))
  c.appendChild(cell('10', false))
  c.appendChild(arrow('_Icon/ChevronRight'))
  return c
}
function renderDropdown(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(200, c.height)
  c.paddingTop = c.paddingBottom = 6
  c.paddingLeft = c.paddingRight = 6
  c.itemSpacing = 2
  c.cornerRadius = 10
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  c.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.14 }, offset: { x: 0, y: 6 }, radius: 20, spread: 0, visible: true, blendMode: 'NORMAL' }]
  const item = (label: string, icon: string, active: boolean, idx: number) => {
    const r = autoFrame('item', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'CENTER'
    r.itemSpacing = 10
    r.paddingTop = r.paddingBottom = 8
    r.paddingLeft = r.paddingRight = 10
    r.cornerRadius = 6
    if (active) bindFillVar(ctx, r, 'color/bgSubtle', SURFACE)
    const ic = iconInstance(icon, 'Icon ' + idx, 16)
    recolorIcon(ic, active ? ACCENT : SUB)
    r.appendChild(ic)
    const t = boundText(ctx, label, 13, active ? 'color/primary' : 'color/text', active ? ACCENT : INK, active)
    t.name = 'Item ' + idx
    r.appendChild(t)
    return r
  }
  c.appendChild(item('프로필', '_Icon/Person', false, 1))
  c.appendChild(item('설정', '_Icon/Settings', true, 2))
  c.appendChild(item('로그아웃', '_Icon/LogOut', false, 3))
  return c
}

// ══ LAYOUT (Card / List / Accordion / Divider) ═══════════════════════
function renderCard(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const footer = combo.footer === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(280, c.height)
  c.itemSpacing = 12
  c.paddingTop = c.paddingBottom = c.paddingLeft = c.paddingRight = 20
  c.cornerRadius = 12
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  const title = boundText(ctx, '카드 제목', 16, 'color/text', INK, true)
  title.name = 'Title'
  c.appendChild(title)
  const body = boundText(ctx, '카드 본문 텍스트가 들어갑니다. 여러 줄로 늘어날 수 있어요.', 13, 'color/secondary', SUB)
  body.name = 'Body'
  body.layoutAlign = 'STRETCH'
  body.textAutoResize = 'HEIGHT'
  c.appendChild(body)
  if (footer) {
    const div = figma.createRectangle()
    div.resize(240, 1)
    div.layoutAlign = 'STRETCH'
    bindFillVar(ctx, div, 'color/border', BORDER)
    c.appendChild(div)
    const f = autoFrame('footer', 'HORIZONTAL')
    f.layoutAlign = 'STRETCH'
    f.primaryAxisSizingMode = 'FIXED'
    f.primaryAxisAlignItems = 'MAX'
    const btn = autoFrame('btn', 'HORIZONTAL')
    btn.paddingTop = btn.paddingBottom = 7
    btn.paddingLeft = btn.paddingRight = 14
    btn.cornerRadius = 8
    bindFillVar(ctx, btn, 'color/primary', ACCENT)
    btn.appendChild(boundText(ctx, '확인', 13, 'color/bg', WHITE, true))
    f.appendChild(btn)
    c.appendChild(f)
  }
  return c
}
function renderList(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(320, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 12
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  c.clipsContent = true
  const rows: Array<[string, string]> = [
    ['홍길동', '디자이너'],
    ['김철수', '개발자'],
    ['이영희', '기획자'],
  ]
  rows.forEach(([title, sub], idx) => {
    if (idx > 0) {
      const d = figma.createRectangle()
      d.resize(320, 1)
      d.layoutAlign = 'STRETCH'
      bindFillVar(ctx, d, 'color/border', BORDER)
      c.appendChild(d)
    }
    const r = autoFrame('row', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'CENTER'
    r.itemSpacing = 12
    r.paddingTop = r.paddingBottom = 12
    r.paddingLeft = r.paddingRight = 16
    const av = fixedFrame('avatar', 'HORIZONTAL', 36, 36)
    av.primaryAxisAlignItems = 'CENTER'
    av.counterAxisAlignItems = 'CENTER'
    av.cornerRadius = 18
    bindFillVar(ctx, av, 'color/bgSubtle', SURFACE)
    const ic = iconInstance('_Icon/Person', 'Icon', 18)
    recolorIcon(ic, SUB)
    av.appendChild(ic)
    r.appendChild(av)
    const col = autoFrame('col', 'VERTICAL')
    col.layoutGrow = 1
    col.itemSpacing = 2
    const tt = boundText(ctx, title, 14, 'color/text', INK, true)
    tt.name = 'Name ' + (idx + 1)
    col.appendChild(tt)
    const st = boundText(ctx, sub, 12, 'color/secondary', SUB)
    st.name = 'Sub ' + (idx + 1)
    col.appendChild(st)
    r.appendChild(col)
    const chev = iconInstance('_Icon/ChevronRight', 'Chevron', 16)
    recolorIcon(chev, MUTED)
    r.appendChild(chev)
    c.appendChild(r)
  })
  return c
}
function renderAccordion(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const expanded = combo.expanded === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(320, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 8
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  c.clipsContent = true
  const header = autoFrame('header', 'HORIZONTAL')
  header.layoutAlign = 'STRETCH'
  header.primaryAxisSizingMode = 'FIXED'
  header.counterAxisAlignItems = 'CENTER'
  header.primaryAxisAlignItems = 'SPACE_BETWEEN'
  header.paddingTop = header.paddingBottom = 14
  header.paddingLeft = header.paddingRight = 16
  header.itemSpacing = 8
  const title = boundText(ctx, '섹션 제목', 14, 'color/text', INK, true)
  title.name = 'Title'
  header.appendChild(title)
  const chev = iconInstance(expanded ? '_Icon/ChevronUp' : '_Icon/ChevronDown', 'Chevron', 18)
  recolorIcon(chev, SUB)
  header.appendChild(chev)
  c.appendChild(header)
  if (expanded) {
    const div = figma.createRectangle()
    div.resize(320, 1)
    div.layoutAlign = 'STRETCH'
    bindFillVar(ctx, div, 'color/border', BORDER)
    c.appendChild(div)
    const body = autoFrame('body', 'VERTICAL')
    body.layoutAlign = 'STRETCH'
    body.primaryAxisSizingMode = 'FIXED'
    body.paddingTop = body.paddingBottom = 14
    body.paddingLeft = body.paddingRight = 16
    const bt = boundText(ctx, '펼쳐진 본문 내용이 여기에 표시됩니다.', 13, 'color/secondary', SUB)
    bt.name = 'Body'
    bt.layoutAlign = 'STRETCH'
    bt.textAutoResize = 'HEIGHT'
    body.appendChild(bt)
    c.appendChild(body)
  }
  return c
}
function renderDivider(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const withLabel = combo.label === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'AUTO'
  c.resize(280, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 12
  c.fills = []
  const line = () => {
    const l = figma.createRectangle()
    l.resize(100, 1)
    l.layoutGrow = 1
    bindFillVar(ctx, l, 'color/border', BORDER)
    return l
  }
  c.appendChild(line())
  if (withLabel) {
    const t = boundText(ctx, '또는', 12, 'color/secondary', MUTED)
    t.name = 'Label'
    c.appendChild(t)
    c.appendChild(line())
  }
  return c
}

// ══ OVERLAY (Modal / Dialog / Popover) ═══════════════════════════════
function renderModal(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(380, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 16
  bindFillVar(ctx, c, 'color/bg', WHITE)
  c.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.24 }, offset: { x: 0, y: 12 }, radius: 40, spread: 0, visible: true, blendMode: 'NORMAL' }]
  const header = autoFrame('header', 'HORIZONTAL')
  header.layoutAlign = 'STRETCH'
  header.primaryAxisSizingMode = 'FIXED'
  header.counterAxisAlignItems = 'CENTER'
  header.primaryAxisAlignItems = 'SPACE_BETWEEN'
  header.paddingTop = 20
  header.paddingBottom = 8
  header.paddingLeft = 20
  header.paddingRight = 16
  header.itemSpacing = 8
  const title = boundText(ctx, '모달 제목', 18, 'color/text', INK, true)
  title.name = 'Title'
  header.appendChild(title)
  const close = iconInstance('_Icon/Close', 'Close Icon', 20)
  recolorIcon(close, SUB)
  header.appendChild(close)
  c.appendChild(header)
  const body = autoFrame('body', 'VERTICAL')
  body.layoutAlign = 'STRETCH'
  body.primaryAxisSizingMode = 'FIXED'
  body.paddingLeft = 20
  body.paddingRight = 20
  body.paddingBottom = 20
  const bt = boundText(ctx, '모달 본문 내용이 여기에 표시됩니다. 사용자에게 필요한 설명을 담습니다.', 14, 'color/secondary', SUB)
  bt.name = 'Body'
  bt.layoutAlign = 'STRETCH'
  bt.textAutoResize = 'HEIGHT'
  body.appendChild(bt)
  c.appendChild(body)
  const footer = autoFrame('footer', 'HORIZONTAL')
  footer.layoutAlign = 'STRETCH'
  footer.primaryAxisSizingMode = 'FIXED'
  footer.primaryAxisAlignItems = 'MAX'
  footer.itemSpacing = 8
  footer.paddingLeft = 20
  footer.paddingRight = 20
  footer.paddingBottom = 20
  const cancel = autoFrame('cancel', 'HORIZONTAL')
  cancel.paddingTop = cancel.paddingBottom = 9
  cancel.paddingLeft = cancel.paddingRight = 16
  cancel.cornerRadius = 8
  bindFillVar(ctx, cancel, 'color/bgSubtle', SURFACE)
  const ct = boundText(ctx, '취소', 14, 'color/text', INK, true)
  ct.name = 'Cancel'
  cancel.appendChild(ct)
  footer.appendChild(cancel)
  const confirm = autoFrame('confirm', 'HORIZONTAL')
  confirm.paddingTop = confirm.paddingBottom = 9
  confirm.paddingLeft = confirm.paddingRight = 16
  confirm.cornerRadius = 8
  bindFillVar(ctx, confirm, 'color/primary', ACCENT)
  const cf = boundText(ctx, '확인', 14, 'color/bg', WHITE, true)
  cf.name = 'Confirm'
  confirm.appendChild(cf)
  footer.appendChild(confirm)
  c.appendChild(footer)
  return c
}
function renderDialog(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(300, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 8
  c.paddingTop = 28
  c.paddingBottom = 20
  c.paddingLeft = 24
  c.paddingRight = 24
  c.cornerRadius = 16
  bindFillVar(ctx, c, 'color/bg', WHITE)
  c.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.24 }, offset: { x: 0, y: 12 }, radius: 40, spread: 0, visible: true, blendMode: 'NORMAL' }]
  const title = boundText(ctx, '삭제하시겠어요?', 17, 'color/text', INK, true)
  title.name = 'Title'
  c.appendChild(title)
  const msg = boundText(ctx, '이 작업은 되돌릴 수 없습니다.', 14, 'color/secondary', SUB)
  msg.name = 'Body'
  msg.textAlignHorizontal = 'CENTER'
  c.appendChild(msg)
  const footer = autoFrame('footer', 'HORIZONTAL')
  footer.layoutAlign = 'STRETCH'
  footer.primaryAxisSizingMode = 'FIXED'
  footer.itemSpacing = 8
  footer.paddingTop = 12
  const mkBtn = (label: string, name: string, primary: boolean) => {
    const b = autoFrame(name, 'HORIZONTAL')
    b.layoutGrow = 1
    b.primaryAxisAlignItems = 'CENTER'
    b.counterAxisAlignItems = 'CENTER'
    b.paddingTop = b.paddingBottom = 10
    b.cornerRadius = 8
    bindFillVar(ctx, b, primary ? 'color/error' : 'color/bgSubtle', primary ? '#F04452' : SURFACE)
    const t = boundText(ctx, label, 14, primary ? 'color/bg' : 'color/text', primary ? WHITE : INK, true)
    t.name = name
    b.appendChild(t)
    return b
  }
  footer.appendChild(mkBtn('취소', 'Cancel', false))
  footer.appendChild(mkBtn('삭제', 'Confirm', true))
  c.appendChild(footer)
  return c
}
function renderPopover(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 0
  c.fills = []
  const bubble = autoFrame('bubble', 'VERTICAL')
  bubble.counterAxisSizingMode = 'FIXED'
  bubble.resize(220, bubble.height)
  bubble.itemSpacing = 4
  bubble.paddingTop = bubble.paddingBottom = 14
  bubble.paddingLeft = bubble.paddingRight = 14
  bubble.cornerRadius = 12
  bindFillVar(ctx, bubble, 'color/bg', WHITE)
  bindStrokeVar(ctx, bubble, 'color/border', BORDER)
  bubble.strokeWeight = 1
  bubble.strokeAlign = 'INSIDE'
  bubble.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.16 }, offset: { x: 0, y: 6 }, radius: 20, spread: 0, visible: true, blendMode: 'NORMAL' }]
  const title = boundText(ctx, '팝오버 제목', 14, 'color/text', INK, true)
  title.name = 'Title'
  bubble.appendChild(title)
  const body = boundText(ctx, '간단한 부가 설명을 담는 팝오버입니다.', 13, 'color/secondary', SUB)
  body.name = 'Body'
  body.layoutAlign = 'STRETCH'
  body.textAutoResize = 'HEIGHT'
  bubble.appendChild(body)
  c.appendChild(bubble)
  const tri = figma.createVector()
  tri.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0 L12 0 L6 6 Z' }]
  bindFillVar(ctx, tri, 'color/bg', WHITE)
  tri.strokes = []
  c.appendChild(tri)
  return c
}

// ══ DATA DISPLAY (Avatar / Statistics / Progress) ════════════════════
function renderAvatar(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const size = combo.size || 'md'
  const px = size === 'sm' ? 36 : size === 'lg' ? 64 : 48
  const c = figma.createComponent()
  c.resize(px, px)
  c.cornerRadius = px / 2
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/primary', ACCENT)
  const initial = txt(ctx, '김', px === 36 ? 15 : px === 64 ? 26 : 20, WHITE, true)
  const iv = ctx.vars.get('color/bg')
  if (iv) initial.fills = [boundPaint(iv)]
  initial.name = 'Initial'
  c.appendChild(initial)
  initial.x = (px - initial.width) / 2
  initial.y = (px - initial.height) / 2
  // 온라인 상태 점
  const dot = figma.createEllipse()
  const ds = px === 36 ? 9 : px === 64 ? 15 : 12
  dot.resize(ds, ds)
  bindFillVar(ctx, dot, 'color/success', '#00C471')
  dot.strokes = [solid(WHITE)]
  dot.strokeWeight = 2
  dot.name = 'Status'
  c.appendChild(dot)
  dot.x = px - ds
  dot.y = px - ds
  return c
}
function renderStatistics(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(200, c.height)
  c.itemSpacing = 6
  c.paddingTop = c.paddingBottom = c.paddingLeft = c.paddingRight = 20
  c.cornerRadius = 12
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  const label = boundText(ctx, '총 매출', 13, 'color/secondary', SUB)
  label.name = 'Label'
  c.appendChild(label)
  const value = boundText(ctx, '₩12,400,000', 24, 'color/text', INK, true)
  value.name = 'Value'
  c.appendChild(value)
  const delta = autoFrame('delta', 'HORIZONTAL')
  delta.counterAxisAlignItems = 'CENTER'
  delta.itemSpacing = 4
  const up = iconInstance('_Icon/Trending', 'Trend Icon', 14)
  recolorIcon(up, '#00C471')
  delta.appendChild(up)
  const dt = boundText(ctx, '+12.5%', 12, 'color/success', '#00C471', true)
  dt.name = 'Delta'
  delta.appendChild(dt)
  c.appendChild(delta)
  return c
}
function renderProgress(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const pct = combo.value === '25' ? 25 : combo.value === '75' ? 75 : combo.value === '100' ? 100 : 50
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(280, c.height)
  c.itemSpacing = 8
  c.fills = []
  const labelRow = autoFrame('labelRow', 'HORIZONTAL')
  labelRow.layoutAlign = 'STRETCH'
  labelRow.primaryAxisSizingMode = 'FIXED'
  labelRow.primaryAxisAlignItems = 'SPACE_BETWEEN'
  const lb = boundText(ctx, '진행률', 13, 'color/text', INK, true)
  lb.name = 'Label'
  labelRow.appendChild(lb)
  const pv = boundText(ctx, pct + '%', 13, 'color/secondary', SUB)
  pv.name = 'Percent'
  labelRow.appendChild(pv)
  c.appendChild(labelRow)
  const track = figma.createFrame()
  track.name = 'track'
  track.layoutMode = 'HORIZONTAL'
  track.primaryAxisSizingMode = 'FIXED'
  track.counterAxisSizingMode = 'FIXED'
  track.resize(280, 8)
  track.cornerRadius = 999
  track.layoutAlign = 'STRETCH'
  bindFillVar(ctx, track, 'color/bgSubtle', SURFACE)
  const fill = figma.createFrame()
  fill.name = 'fill'
  fill.resize(Math.max(8, (280 * pct) / 100), 8)
  fill.cornerRadius = 999
  bindFillVar(ctx, fill, 'color/primary', ACCENT)
  track.appendChild(fill)
  c.appendChild(track)
  return c
}

// ══ INPUT 복합 (Select / MultiSelect / Slider / Upload) ══════════════
function inputShell(ctx: Ctx, label: string, disabled: boolean): { c: ComponentNode; addField: (f: SceneNode) => void } {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(FIELD_W, c.height)
  c.primaryAxisSizingMode = 'AUTO'
  c.itemSpacing = 6
  c.fills = []
  if (disabled) c.opacity = 0.45
  const lbl = boundText(ctx, label, 13, 'color/text', INK, true)
  lbl.name = 'Label'
  c.appendChild(lbl)
  return { c, addField: (f) => c.appendChild(f) }
}
function fieldRow(ctx: Ctx, toneVar: string | null, toneHex: string | null, disabled: boolean): FrameNode {
  const row = autoFrame('field', 'HORIZONTAL')
  row.counterAxisAlignItems = 'CENTER'
  row.layoutAlign = 'STRETCH'
  row.primaryAxisSizingMode = 'FIXED'
  row.itemSpacing = 8
  row.paddingTop = row.paddingBottom = 10
  row.paddingLeft = row.paddingRight = 12
  row.cornerRadius = 8
  bindFillVar(ctx, row, disabled ? 'color/bgSubtle' : 'color/bg', disabled ? '#F5F7FA' : WHITE)
  bindStrokeVar(ctx, row, toneVar ?? 'color/border', toneHex ?? BORDER)
  row.strokeWeight = 1
  row.strokeAlign = 'INSIDE'
  return row
}
function renderSelect(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const error = combo.error === 'true'
  const disabled = combo.disabled === 'true'
  const { c, addField } = inputShell(ctx, '카테고리', disabled)
  const row = fieldRow(ctx, error ? 'color/error' : null, error ? '#F04452' : null, disabled)
  const val = boundText(ctx, '선택하세요', 15, 'color/secondary', MUTED)
  val.name = 'Value'
  val.layoutGrow = 1
  row.appendChild(val)
  const chev = iconInstance('_Icon/ChevronDown', 'Icon', 18)
  recolorIcon(chev, SUB)
  row.appendChild(chev)
  addField(row)
  const helper = boundText(ctx, error ? '필수 항목입니다.' : '하나를 선택하세요.', 12, error ? 'color/error' : 'color/secondary', error ? '#F04452' : SUB)
  helper.name = 'Helper'
  helper.layoutAlign = 'STRETCH'
  addField(helper)
  return c
}
function renderMultiSelect(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const disabled = combo.disabled === 'true'
  const { c, addField } = inputShell(ctx, '기술 스택', disabled)
  const row = fieldRow(ctx, null, null, disabled)
  const chips = autoFrame('chips', 'HORIZONTAL')
  chips.itemSpacing = 6
  chips.layoutGrow = 1
  ;['React', 'Svelte'].forEach((t) => {
    const chip = autoFrame('chip', 'HORIZONTAL')
    chip.counterAxisAlignItems = 'CENTER'
    chip.paddingTop = chip.paddingBottom = 3
    chip.paddingLeft = chip.paddingRight = 8
    chip.cornerRadius = 6
    bindFillVar(ctx, chip, 'color/bgSubtle', SURFACE)
    chip.appendChild(txt(ctx, t, 12, INK))
    chips.appendChild(chip)
  })
  row.appendChild(chips)
  const chev = iconInstance('_Icon/ChevronDown', 'Icon', 18)
  recolorIcon(chev, SUB)
  row.appendChild(chev)
  addField(row)
  return c
}
function renderSlider(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const pct = combo.value === '0' ? 0 : combo.value === '100' ? 100 : 50
  const { c, addField } = inputShell(ctx, '볼륨', false)
  const meta = autoFrame('meta', 'HORIZONTAL')
  meta.layoutAlign = 'STRETCH'
  meta.primaryAxisSizingMode = 'FIXED'
  meta.primaryAxisAlignItems = 'SPACE_BETWEEN'
  const pv = boundText(ctx, pct + '%', 13, 'color/secondary', SUB)
  pv.name = 'Value'
  const spacer = txt(ctx, '', 13, SUB)
  meta.appendChild(spacer)
  meta.appendChild(pv)
  // 트랙(플레인 프레임): fill + thumb 수동 배치
  const track = figma.createFrame()
  track.name = 'track'
  track.resize(FIELD_W, 18)
  track.fills = []
  const rail = figma.createFrame()
  rail.name = 'rail'
  rail.resize(FIELD_W, 6)
  rail.cornerRadius = 999
  bindFillVar(ctx, rail, 'color/bgSubtle', SURFACE)
  track.appendChild(rail)
  rail.x = 0
  rail.y = 6
  const fill = figma.createFrame()
  fill.name = 'fill'
  fill.resize(Math.max(6, (FIELD_W * pct) / 100), 6)
  fill.cornerRadius = 999
  bindFillVar(ctx, fill, 'color/primary', ACCENT)
  track.appendChild(fill)
  fill.x = 0
  fill.y = 6
  const thumb = figma.createEllipse()
  thumb.resize(18, 18)
  thumb.fills = [solid(WHITE)]
  bindStrokeVar(ctx, thumb, 'color/primary', ACCENT)
  thumb.strokeWeight = 2
  track.appendChild(thumb)
  thumb.x = Math.min(FIELD_W - 18, Math.max(0, (FIELD_W * pct) / 100 - 9))
  thumb.y = 0
  addField(track)
  return c
}
function renderUpload(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const disabled = combo.disabled === 'true'
  const { c, addField } = inputShell(ctx, '첨부 파일', disabled)
  const zone = autoFrame('dropzone', 'VERTICAL')
  zone.layoutAlign = 'STRETCH'
  zone.primaryAxisSizingMode = 'FIXED'
  zone.counterAxisAlignItems = 'CENTER'
  zone.itemSpacing = 8
  zone.paddingTop = zone.paddingBottom = 24
  zone.cornerRadius = 8
  bindFillVar(ctx, zone, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, zone, 'color/border', BORDER)
  zone.strokeWeight = 1
  zone.strokeAlign = 'INSIDE'
  zone.dashPattern = [6, 4]
  const up = iconInstance('_Icon/Upload', 'Icon', 24)
  recolorIcon(up, SUB)
  zone.appendChild(up)
  const t = boundText(ctx, '파일을 끌어다 놓거나 클릭', 13, 'color/text', INK, true)
  t.name = 'Prompt'
  zone.appendChild(t)
  const sub = boundText(ctx, 'PDF, PNG · 최대 10MB', 11, 'color/secondary', SUB)
  sub.name = 'Hint'
  zone.appendChild(sub)
  addField(zone)
  return c
}

// ══ OVERLAY 시트 (Drawer / BottomSheet / ActionSheet) ════════════════
function renderDrawer(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(280, c.height)
  c.itemSpacing = 0
  bindFillVar(ctx, c, 'color/bg', WHITE)
  c.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.2 }, offset: { x: -8, y: 0 }, radius: 32, spread: 0, visible: true, blendMode: 'NORMAL' }]
  const header = autoFrame('header', 'HORIZONTAL')
  header.layoutAlign = 'STRETCH'
  header.primaryAxisSizingMode = 'FIXED'
  header.counterAxisAlignItems = 'CENTER'
  header.primaryAxisAlignItems = 'SPACE_BETWEEN'
  header.paddingTop = header.paddingBottom = 18
  header.paddingLeft = 20
  header.paddingRight = 16
  const title = boundText(ctx, '메뉴', 17, 'color/text', INK, true)
  title.name = 'Title'
  header.appendChild(title)
  const close = iconInstance('_Icon/Close', 'Close Icon', 20)
  recolorIcon(close, SUB)
  header.appendChild(close)
  c.appendChild(header)
  const items: Array<[string, string]> = [
    ['홈', '_Icon/House'],
    ['프로필', '_Icon/Person'],
    ['설정', '_Icon/Settings'],
  ]
  items.forEach(([label, icon], i) => {
    const r = autoFrame('nav', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'CENTER'
    r.itemSpacing = 12
    r.paddingTop = r.paddingBottom = 12
    r.paddingLeft = r.paddingRight = 20
    if (i === 0) bindFillVar(ctx, r, 'color/bgSubtle', SURFACE)
    const ic = iconInstance(icon, 'Icon ' + (i + 1), 18)
    recolorIcon(ic, i === 0 ? ACCENT : SUB)
    r.appendChild(ic)
    const t = boundText(ctx, label, 14, i === 0 ? 'color/primary' : 'color/text', i === 0 ? ACCENT : INK, i === 0)
    t.name = 'Item ' + (i + 1)
    r.appendChild(t)
    c.appendChild(r)
  })
  return c
}
function renderBottomSheet(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(360, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 12
  c.paddingTop = 10
  c.paddingBottom = 24
  c.paddingLeft = 20
  c.paddingRight = 20
  c.topLeftRadius = c.topRightRadius = 20
  bindFillVar(ctx, c, 'color/bg', WHITE)
  c.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.2 }, offset: { x: 0, y: -8 }, radius: 32, spread: 0, visible: true, blendMode: 'NORMAL' }]
  const handle = figma.createFrame()
  handle.name = 'handle'
  handle.resize(36, 4)
  handle.cornerRadius = 999
  bindFillVar(ctx, handle, 'color/border', BORDER)
  c.appendChild(handle)
  const title = boundText(ctx, '옵션 선택', 17, 'color/text', INK, true)
  title.name = 'Title'
  c.appendChild(title)
  const body = boundText(ctx, '아래에서 원하는 항목을 선택하세요.', 14, 'color/secondary', SUB)
  body.name = 'Body'
  body.layoutAlign = 'STRETCH'
  body.textAlignHorizontal = 'CENTER'
  c.appendChild(body)
  return c
}
function renderActionSheet(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(320, c.height)
  c.itemSpacing = 8
  c.fills = []
  const group = figma.createFrame()
  group.name = 'group'
  group.layoutMode = 'VERTICAL'
  group.primaryAxisSizingMode = 'AUTO'
  group.counterAxisSizingMode = 'FIXED'
  group.resize(320, group.height)
  group.itemSpacing = 0
  group.cornerRadius = 14
  group.clipsContent = true
  bindFillVar(ctx, group, 'color/bg', WHITE)
  const actions: Array<[string, boolean]> = [
    ['공유하기', false],
    ['수정하기', false],
    ['삭제하기', true],
  ]
  actions.forEach(([label, danger], i) => {
    if (i > 0) {
      const d = figma.createRectangle()
      d.resize(320, 1)
      d.layoutAlign = 'STRETCH'
      bindFillVar(ctx, d, 'color/border', BORDER)
      group.appendChild(d)
    }
    const r = autoFrame('action', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.primaryAxisAlignItems = 'CENTER'
    r.counterAxisAlignItems = 'CENTER'
    r.paddingTop = r.paddingBottom = 15
    const t = boundText(ctx, label, 15, danger ? 'color/error' : 'color/text', danger ? '#F04452' : INK, false)
    t.name = 'Action ' + (i + 1)
    r.appendChild(t)
    group.appendChild(r)
  })
  c.appendChild(group)
  const cancel = autoFrame('cancel', 'HORIZONTAL')
  cancel.layoutAlign = 'STRETCH'
  cancel.primaryAxisSizingMode = 'FIXED'
  cancel.primaryAxisAlignItems = 'CENTER'
  cancel.counterAxisAlignItems = 'CENTER'
  cancel.paddingTop = cancel.paddingBottom = 15
  cancel.cornerRadius = 14
  bindFillVar(ctx, cancel, 'color/bg', WHITE)
  const ct = boundText(ctx, '취소', 15, 'color/primary', ACCENT, true)
  ct.name = 'Cancel'
  cancel.appendChild(ct)
  c.appendChild(cancel)
  return c
}

// ── 카테고리 정의 ────────────────────────────────────────────────────
type ComponentDoc = {
  key: string
  setName: string
  eyebrow: string
  desc: string
  build: (ctx: Ctx, page: PageNode) => ComponentSetNode
  states: State[]
}
type CategoryDef = { pageName: string; title: string; subtitle: string; docs: ComponentDoc[] }

const INPUT_CATEGORY: CategoryDef = {
  pageName: PAGE_INPUT,
  title: 'Input',
  subtitle:
    '텍스트 입력 계열 — 라벨·입력·헬퍼 규약을 공유하는 폼 필드. 각 컴포넌트의 상태 변형을 편집 가능한 Figma 컴포넌트로 렌더합니다.',
  docs: [
    ...INPUTS.map((def) => ({
      key: def.key,
      setName: def.setName,
      eyebrow: def.eyebrow,
      desc: def.desc,
      build: (ctx: Ctx, page: PageNode) => makeInputSet(ctx, def, page),
      states: def.states,
    })),
    {
      key: 'Select',
      setName: 'DS/Select',
      eyebrow: 'ORGANISM · INPUT',
      desc: '옵션 목록에서 하나를 고르는 단일 선택.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Select', [{ name: 'error', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderSelect(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '카테고리' }, { prop: 'Value', layer: 'Value', def: '선택하세요' }, { prop: 'Helper', layer: 'Helper', def: '하나를 선택하세요.' }], swaps: [{ prop: 'Icon', layer: 'Icon', defKey: '_Icon/ChevronDown' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'MultiSelect',
      setName: 'DS/MultiSelect',
      eyebrow: 'ORGANISM · INPUT',
      desc: '여러 항목을 칩으로 선택하는 다중 선택.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/MultiSelect', [{ name: 'disabled', values: ['false', 'true'] }], (c) => renderMultiSelect(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '기술 스택' }], swaps: [{ prop: 'Icon', layer: 'Icon', defKey: '_Icon/ChevronDown' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Slider',
      setName: 'DS/Slider',
      eyebrow: 'MOLECULE · INPUT',
      desc: '드래그로 수치를 조절하는 슬라이더.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Slider', [{ name: 'value', values: ['0', '50', '100'] }], (c) => renderSlider(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '볼륨' }, { prop: 'Value', layer: 'Value', def: '50%' }] }),
      states: [{ caption: 'Min', props: { value: '0' } }, { caption: 'Mid', props: { value: '50' } }, { caption: 'Max', props: { value: '100' } }],
    },
    {
      key: 'Upload',
      setName: 'DS/Upload',
      eyebrow: 'ORGANISM · INPUT',
      desc: '클릭/드래그로 파일을 올리는 드롭존.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Upload', [{ name: 'disabled', values: ['false', 'true'] }], (c) => renderUpload(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '첨부 파일' }, { prop: 'Prompt', layer: 'Prompt', def: '파일을 끌어다 놓거나 클릭' }, { prop: 'Hint', layer: 'Hint', def: 'PDF, PNG · 최대 10MB' }], swaps: [{ prop: 'Icon', layer: 'Icon', defKey: '_Icon/Upload' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
  ],
}

const SELECTION_CATEGORY: CategoryDef = {
  pageName: PAGE_SELECTION,
  title: 'Selection',
  subtitle: '선택 계열 — 켜고 끄거나 고르는 컨트롤. Toggle · Checkbox · Radio · Chip.',
  docs: [
    {
      key: 'Toggle',
      setName: 'DS/Toggle',
      eyebrow: 'ATOM · SELECTION',
      desc: '켜짐/꺼짐을 전환하는 스위치.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Toggle', [{ name: 'checked', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderToggle(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '알림 받기' }] }),
      states: [{ caption: 'Off', props: {} }, { caption: 'On', props: { checked: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Checkbox',
      setName: 'DS/Checkbox',
      eyebrow: 'ATOM · SELECTION',
      desc: '여러 항목을 독립적으로 선택하는 체크박스.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Checkbox', [{ name: 'checked', values: ['false', 'true'] }, { name: 'indeterminate', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderCheckbox(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '약관에 동의합니다' }] }),
      states: [{ caption: 'Unchecked', props: {} }, { caption: 'Checked', props: { checked: 'true' } }, { caption: 'Indeterminate', props: { indeterminate: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Radio',
      setName: 'DS/Radio',
      eyebrow: 'ATOM · SELECTION',
      desc: '한 그룹에서 하나만 고르는 라디오.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Radio', [{ name: 'selected', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderRadio(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '선택 옵션' }] }),
      states: [{ caption: 'Unselected', props: {} }, { caption: 'Selected', props: { selected: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Chip',
      setName: 'DS/Chip',
      eyebrow: 'MOLECULE · SELECTION',
      desc: '선택 가능한 필터/태그 칩.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Chip', [{ name: 'selected', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderChip(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '필터' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Selected', props: { selected: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
  ],
}

const ACTION_CATEGORY: CategoryDef = {
  pageName: PAGE_ACTION,
  title: 'Action',
  subtitle: '액션 계열 — 사용자 행동을 유발하거나 상태를 표시. Button · Badge.',
  docs: [
    {
      key: 'Button',
      setName: 'DS/Button',
      eyebrow: 'ATOM · ACTION',
      desc: '주요 액션을 실행하는 버튼. variant·size 축을 가집니다.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Button', [{ name: 'variant', values: ['primary', 'secondary', 'error', 'success'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderButton(ctx, { ...c, size: 'md' }), {
          texts: [{ prop: 'Label', layer: 'Label', def: '버튼' }],
          bools: [
            { prop: 'Show Left Icon', layer: 'Left Icon', def: false },
            { prop: 'Show Right Icon', layer: 'Right Icon', def: false },
          ],
          swaps: [
            { prop: 'Left Icon', layer: 'Left Icon', defKey: '_Icon/Star' },
            { prop: 'Right Icon', layer: 'Right Icon', defKey: '_Icon/ChevronRight' },
          ],
        }),
      states: [{ caption: 'Primary', props: { variant: 'primary' } }, { caption: 'Secondary', props: { variant: 'secondary' } }, { caption: 'Error', props: { variant: 'error' } }, { caption: 'Success', props: { variant: 'success' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Badge',
      setName: 'DS/Badge',
      eyebrow: 'ATOM · ACTION',
      desc: '상태·분류를 표시하는 배지. variant·size 축을 가집니다.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Badge', [{ name: 'variant', values: ['primary', 'secondary', 'error', 'success'] }], (c) => renderBadge(ctx, { ...c, size: 'md' }), { texts: [{ prop: 'Label', layer: 'Label', def: 'Badge' }] }),
      states: [{ caption: 'Primary', props: { variant: 'primary' } }, { caption: 'Secondary', props: { variant: 'secondary' } }, { caption: 'Error', props: { variant: 'error' } }, { caption: 'Success', props: { variant: 'success' } }],
    },
  ],
}

const FEEDBACK_CATEGORY: CategoryDef = {
  pageName: PAGE_FEEDBACK,
  title: 'Feedback',
  subtitle: '피드백 계열 — 상태·결과를 알리는 요소. Alert · Toast · Snackbar · Tooltip · Loading.',
  docs: [
    {
      key: 'Alert',
      setName: 'DS/Alert',
      eyebrow: 'MOLECULE · FEEDBACK',
      desc: '페이지 안에 인라인으로 상태를 알리는 배너.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Alert', [{ name: 'variant', values: ['info', 'success', 'warning', 'error'] }], (c) => renderAlert(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '안내' }, { prop: 'Message', layer: 'Message', def: '메시지 내용' }] }),
      states: [
        { caption: 'Info', props: { variant: 'info' } },
        { caption: 'Success', props: { variant: 'success' } },
        { caption: 'Warning', props: { variant: 'warning' } },
        { caption: 'Error', props: { variant: 'error' } },
      ],
    },
    {
      key: 'Toast',
      setName: 'DS/Toast',
      eyebrow: 'MOLECULE · FEEDBACK',
      desc: '일시적으로 떠서 결과를 알리는 카드(그림자).',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Toast', [{ name: 'variant', values: ['info', 'success', 'warning', 'error'] }], (c) => renderToast(ctx, c), { texts: [{ prop: 'Message', layer: 'Message', def: '메시지 내용' }] }),
      states: [
        { caption: 'Info', props: { variant: 'info' } },
        { caption: 'Success', props: { variant: 'success' } },
        { caption: 'Warning', props: { variant: 'warning' } },
        { caption: 'Error', props: { variant: 'error' } },
      ],
    },
    {
      key: 'Snackbar',
      setName: 'DS/Snackbar',
      eyebrow: 'MOLECULE · FEEDBACK',
      desc: '하단에서 간단한 메시지와 실행취소를 제공하는 바.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Snackbar', [{ name: 'action', values: ['false', 'true'] }], (c) => renderSnackbar(ctx, c), { texts: [{ prop: 'Message', layer: 'Message', def: '링크를 복사했어요.' }, { prop: 'Action', layer: 'Action', def: '실행 취소' }] }),
      states: [
        { caption: 'Default', props: {} },
        { caption: 'WithAction', props: { action: 'true' } },
      ],
    },
    {
      key: 'Tooltip',
      setName: 'DS/Tooltip',
      eyebrow: 'ATOM · FEEDBACK',
      desc: '요소에 대한 짧은 도움말 말풍선.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Tooltip', [{ name: 'placement', values: ['bottom', 'top'] }], (c) => renderTooltip(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '도움말 텍스트' }] }),
      states: [
        { caption: 'Bottom', props: { placement: 'bottom' } },
        { caption: 'Top', props: { placement: 'top' } },
      ],
    },
    {
      key: 'Loading',
      setName: 'DS/Loading',
      eyebrow: 'ATOM · FEEDBACK',
      desc: '처리 중임을 나타내는 로딩 표시.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Loading', [{ name: 'size', values: ['sm', 'md', 'lg'] }], (c) => renderLoading(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '불러오는 중…' }] }),
      states: [
        { caption: 'Small', props: { size: 'sm' } },
        { caption: 'Medium', props: { size: 'md' } },
        { caption: 'Large', props: { size: 'lg' } },
      ],
    },
  ],
}

const NAVIGATION_CATEGORY: CategoryDef = {
  pageName: PAGE_NAV,
  title: 'Navigation',
  subtitle: '내비게이션 계열 — 이동·탐색 컨트롤. Tab · Breadcrumb · Pagination · Dropdown.',
  docs: [
    {
      key: 'Tab',
      setName: 'DS/Tab',
      eyebrow: 'MOLECULE · NAVIGATION',
      desc: '섹션을 전환하는 탭 아이템(활성/비활성).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Tab', [{ name: 'active', values: ['false', 'true'] }], (c) => renderTab(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '메뉴' }] }),
      states: [{ caption: 'Inactive', props: {} }, { caption: 'Active', props: { active: 'true' } }],
    },
    {
      key: 'Breadcrumb',
      setName: 'DS/Breadcrumb',
      eyebrow: 'MOLECULE · NAVIGATION',
      desc: '현재 위치의 경로를 보여주는 이동 경로.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Breadcrumb', [{ name: 'state', values: ['default'] }], (c) => renderBreadcrumb(ctx, c), { texts: [{ prop: 'Item 1', layer: 'Item 1', def: '홈' }, { prop: 'Item 2', layer: 'Item 2', def: '카테고리' }, { prop: 'Current', layer: 'Current', def: '상세 페이지' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Pagination',
      setName: 'DS/Pagination',
      eyebrow: 'MOLECULE · NAVIGATION',
      desc: '페이지를 넘기는 페이지네이션.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Pagination', [{ name: 'state', values: ['default'] }], (c) => renderPagination(ctx, c)),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Dropdown',
      setName: 'DS/Dropdown',
      eyebrow: 'ORGANISM · NAVIGATION',
      desc: '액션·이동 항목을 담는 드롭다운 메뉴.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Dropdown', [{ name: 'state', values: ['default'] }], (c) => renderDropdown(ctx, c), {
          texts: [{ prop: 'Item 1', layer: 'Item 1', def: '프로필' }, { prop: 'Item 2', layer: 'Item 2', def: '설정' }, { prop: 'Item 3', layer: 'Item 3', def: '로그아웃' }],
          swaps: [{ prop: 'Icon 1', layer: 'Icon 1', defKey: '_Icon/Person' }, { prop: 'Icon 2', layer: 'Icon 2', defKey: '_Icon/Settings' }, { prop: 'Icon 3', layer: 'Icon 3', defKey: '_Icon/LogOut' }],
        }),
      states: [{ caption: 'Default', props: {} }],
    },
  ],
}

const LAYOUT_CATEGORY: CategoryDef = {
  pageName: PAGE_LAYOUT,
  title: 'Layout',
  subtitle: '레이아웃 계열 — 콘텐츠를 담고 배치하는 컨테이너. Card · List · Accordion · Divider.',
  docs: [
    {
      key: 'Card',
      setName: 'DS/Card',
      eyebrow: 'MOLECULE · LAYOUT',
      desc: '제목·본문·(선택)푸터를 담는 카드.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Card', [{ name: 'footer', values: ['false', 'true'] }], (c) => renderCard(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '카드 제목' }, { prop: 'Body', layer: 'Body', def: '카드 본문 텍스트가 들어갑니다.' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'With Footer', props: { footer: 'true' } }],
    },
    {
      key: 'List',
      setName: 'DS/List',
      eyebrow: 'ORGANISM · LAYOUT',
      desc: '아바타·제목·설명·이동을 가진 리스트.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/List', [{ name: 'state', values: ['default'] }], (c) => renderList(ctx, c), {
          texts: [
            { prop: 'Name 1', layer: 'Name 1', def: '홍길동' },
            { prop: 'Sub 1', layer: 'Sub 1', def: '디자이너' },
            { prop: 'Name 2', layer: 'Name 2', def: '김철수' },
            { prop: 'Sub 2', layer: 'Sub 2', def: '개발자' },
            { prop: 'Name 3', layer: 'Name 3', def: '이영희' },
            { prop: 'Sub 3', layer: 'Sub 3', def: '기획자' },
          ],
        }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Accordion',
      setName: 'DS/Accordion',
      eyebrow: 'MOLECULE · LAYOUT',
      desc: '제목을 눌러 본문을 펼치고 접는 아코디언.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Accordion', [{ name: 'expanded', values: ['false', 'true'] }], (c) => renderAccordion(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '섹션 제목' }, { prop: 'Body', layer: 'Body', def: '펼쳐진 본문 내용' }] }),
      states: [{ caption: 'Collapsed', props: {} }, { caption: 'Expanded', props: { expanded: 'true' } }],
    },
    {
      key: 'Divider',
      setName: 'DS/Divider',
      eyebrow: 'ATOM · LAYOUT',
      desc: '콘텐츠를 나누는 구분선(라벨 옵션).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Divider', [{ name: 'label', values: ['false', 'true'] }], (c) => renderDivider(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '또는' }] }),
      states: [{ caption: 'Plain', props: {} }, { caption: 'With Label', props: { label: 'true' } }],
    },
  ],
}

const OVERLAY_CATEGORY: CategoryDef = {
  pageName: PAGE_OVERLAY,
  title: 'Overlay',
  subtitle: '오버레이 계열 — 화면 위에 떠서 상호작용하는 표면. Modal · Dialog · Popover.',
  docs: [
    {
      key: 'Modal',
      setName: 'DS/Modal',
      eyebrow: 'ORGANISM · OVERLAY',
      desc: '제목·본문·액션 버튼을 담는 모달 대화상자.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Modal', [{ name: 'state', values: ['default'] }], (c) => renderModal(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '모달 제목' }, { prop: 'Body', layer: 'Body', def: '모달 본문 내용' }, { prop: 'Cancel', layer: 'Cancel', def: '취소' }, { prop: 'Confirm', layer: 'Confirm', def: '확인' }], swaps: [{ prop: 'Close Icon', layer: 'Close Icon', defKey: '_Icon/Close' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Dialog',
      setName: 'DS/Dialog',
      eyebrow: 'MOLECULE · OVERLAY',
      desc: '확인/취소를 묻는 간단한 다이얼로그.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Dialog', [{ name: 'state', values: ['default'] }], (c) => renderDialog(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '삭제하시겠어요?' }, { prop: 'Body', layer: 'Body', def: '이 작업은 되돌릴 수 없습니다.' }, { prop: 'Cancel', layer: 'Cancel', def: '취소' }, { prop: 'Confirm', layer: 'Confirm', def: '삭제' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Popover',
      setName: 'DS/Popover',
      eyebrow: 'MOLECULE · OVERLAY',
      desc: '요소 옆에 붙는 작은 부가정보 팝오버.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Popover', [{ name: 'state', values: ['default'] }], (c) => renderPopover(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '팝오버 제목' }, { prop: 'Body', layer: 'Body', def: '간단한 부가 설명' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Drawer',
      setName: 'DS/Drawer',
      eyebrow: 'ORGANISM · OVERLAY',
      desc: '측면에서 밀려나오는 내비게이션 드로어.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Drawer', [{ name: 'state', values: ['default'] }], (c) => renderDrawer(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '메뉴' }, { prop: 'Item 1', layer: 'Item 1', def: '홈' }, { prop: 'Item 2', layer: 'Item 2', def: '프로필' }, { prop: 'Item 3', layer: 'Item 3', def: '설정' }], swaps: [{ prop: 'Icon 1', layer: 'Icon 1', defKey: '_Icon/House' }, { prop: 'Icon 2', layer: 'Icon 2', defKey: '_Icon/Person' }, { prop: 'Icon 3', layer: 'Icon 3', defKey: '_Icon/Settings' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'BottomSheet',
      setName: 'DS/BottomSheet',
      eyebrow: 'ORGANISM · OVERLAY',
      desc: '하단에서 올라오는 시트(핸들 포함).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/BottomSheet', [{ name: 'state', values: ['default'] }], (c) => renderBottomSheet(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '옵션 선택' }, { prop: 'Body', layer: 'Body', def: '아래에서 원하는 항목을 선택하세요.' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'ActionSheet',
      setName: 'DS/ActionSheet',
      eyebrow: 'MOLECULE · OVERLAY',
      desc: '하단 액션 목록 시트(취소 포함).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/ActionSheet', [{ name: 'state', values: ['default'] }], (c) => renderActionSheet(ctx, c), { texts: [{ prop: 'Action 1', layer: 'Action 1', def: '공유하기' }, { prop: 'Action 2', layer: 'Action 2', def: '수정하기' }, { prop: 'Action 3', layer: 'Action 3', def: '삭제하기' }, { prop: 'Cancel', layer: 'Cancel', def: '취소' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
  ],
}

const DATA_CATEGORY: CategoryDef = {
  pageName: PAGE_DATA,
  title: 'Data Display',
  subtitle: '데이터 표시 계열 — 값·상태·사람을 보여주는 요소. Avatar · Statistics · Progress.',
  docs: [
    {
      key: 'Avatar',
      setName: 'DS/Avatar',
      eyebrow: 'ATOM · DATA',
      desc: '사용자를 나타내는 아바타(이니셜 + 온라인 점).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Avatar', [{ name: 'size', values: ['sm', 'md', 'lg'] }], (c) => renderAvatar(ctx, c), { texts: [{ prop: 'Initial', layer: 'Initial', def: '김' }] }),
      states: [{ caption: 'Small', props: { size: 'sm' } }, { caption: 'Medium', props: { size: 'md' } }, { caption: 'Large', props: { size: 'lg' } }],
    },
    {
      key: 'Statistics',
      setName: 'DS/Statistics',
      eyebrow: 'MOLECULE · DATA',
      desc: '지표 값과 증감을 보여주는 통계 카드.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Statistics', [{ name: 'state', values: ['default'] }], (c) => renderStatistics(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '총 매출' }, { prop: 'Value', layer: 'Value', def: '₩12,400,000' }, { prop: 'Delta', layer: 'Delta', def: '+12.5%' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Progress',
      setName: 'DS/Progress',
      eyebrow: 'ATOM · DATA',
      desc: '진행 상태를 나타내는 진행 바.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Progress', [{ name: 'value', values: ['25', '50', '75', '100'] }], (c) => renderProgress(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '진행률' }] }),
      states: [{ caption: '25%', props: { value: '25' } }, { caption: '50%', props: { value: '50' } }, { caption: '75%', props: { value: '75' } }, { caption: '100%', props: { value: '100' } }],
    },
  ],
}

const ALL_CATEGORIES = [
  INPUT_CATEGORY,
  SELECTION_CATEGORY,
  ACTION_CATEGORY,
  FEEDBACK_CATEGORY,
  NAVIGATION_CATEGORY,
  LAYOUT_CATEGORY,
  OVERLAY_CATEGORY,
  DATA_CATEGORY,
]

// ── 카테고리 생성 ────────────────────────────────────────────────────
export async function generateCategories(fontFamily: string): Promise<string[]> {
  const ctx = await setup(fontFamily)
  if (!ctx.vars.get('color/primary')) {
    ctx.warnings.push("Variables가 없습니다 — '토큰'을 먼저 생성하세요(색이 프리셋과 연결되지 않습니다).")
  }
  if (!figma.root.children.some((p) => p.name.indexOf('Icon System') >= 0)) {
    ctx.warnings.push('Icon System 페이지가 없어 아이콘이 인라인 폴백됩니다 — 아이콘 스왑을 쓰려면 Icon System도 함께 생성하세요.')
  }

  // 절취선(구분) 페이지 — 파운데이션과 컴포넌트 카테고리 사이. 페이지 목록에서 시각적 구분자.
  if (!figma.root.children.some((p) => p.name === DIVIDER_PAGE)) {
    const div = figma.createPage()
    div.name = DIVIDER_PAGE
  }

  for (const cat of ALL_CATEGORIES) {
    if (figma.root.children.some((p) => p.name === cat.pageName)) {
      ctx.warnings.push(`페이지 '${cat.pageName}' 이미 존재 — 건너뜀(재생성하려면 '기존 삭제 후 재생성').`)
      continue
    }
    const page = figma.createPage()
    page.name = cat.pageName

    // 컴포넌트 세트(편집 소스)를 페이지에 만든다(문서 오른쪽 x≥1360). 문서엔 인스턴스를 배치.
    const sets = new Map<string, ComponentSetNode>()
    let sy = 200
    for (const doc of cat.docs) {
      try {
        const set = doc.build(ctx, page)
        set.x = 1360
        set.y = sy
        sy += set.height + 48
        sets.set(doc.setName, set)
      } catch (e) {
        ctx.warnings.push(`${doc.setName} 세트 생성 실패: ${e instanceof Error ? e.message : String(e)}`)
      }
    }

    const root = makeRoot(cat.title)
    placeRoot(root, page)
    makeHeader(ctx, root, cat.title, cat.subtitle)
    for (const doc of cat.docs) {
      const render = makeSection(ctx, root, {
        eyebrow: doc.eyebrow,
        name: doc.key,
        desc: doc.desc,
        meta: [`Set: ${doc.setName}`, `상태 ${doc.states.length}개`, 'Platform: Web'],
        renderDir: 'WRAP',
      })
      const set = sets.get(doc.setName)
      if (!set) continue
      for (const st of doc.states) render.appendChild(variantItem(ctx, set, st))
    }
  }
  return ctx.warnings
}

// ── 문서 안 변형 아이템(인스턴스 + 캡션) ─────────────────────────────
function variantItem(ctx: Ctx, set: ComponentSetNode, state: State): FrameNode {
  const item = autoFrame('Variant / ' + state.caption, 'VERTICAL')
  item.counterAxisAlignItems = 'MIN'
  item.itemSpacing = 8
  const inst = set.defaultVariant.createInstance()
  inst.layoutAlign = 'INHERIT'
  inst.layoutGrow = 0
  try {
    inst.setProperties(state.props)
  } catch {
    ctx.warnings.push(`${set.name} setProperties 실패: ${JSON.stringify(state.props)}`)
  }
  item.appendChild(inst)
  item.appendChild(txt(ctx, state.caption, 12, SUB))
  return item
}
