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
import { strokeIcon } from './icon-vec'
import { ICON_PATHS } from '../icons-data'

const FIELD_W = 300
// 오너 규칙: 페이지 탭은 "순번. System - 이름". 절취선은 하이픈 라인.
const DIVIDER_PAGE = '---------------------------'
const PAGE_INPUT = '1. System - Input'
const PAGE_SELECTION = '2. System - Selection'
const PAGE_ACTION = '3. System - Action'
const PAGE_FEEDBACK = '4. System - Feedback'
// 컴포넌트 세트는 별도 소스 페이지 없이 각 카테고리 페이지에 함께 둔다.
// 레거시 이름들은 reset 정리용으로만 남긴다(생성하지 않음).
export const CATEGORY_PAGE_NAMES = [
  DIVIDER_PAGE,
  PAGE_INPUT,
  PAGE_SELECTION,
  PAGE_ACTION,
  PAGE_FEEDBACK,
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
function iconNode(_ctx: Ctx, key: string, size: number, hex: string): FrameNode {
  const ic = strokeIcon(key, size, solid(hex))
  if (ic) return ic
  const f = figma.createFrame()
  f.name = 'icon'
  f.resize(size, size)
  f.fills = []
  return f
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

// ── 아이콘 컴포넌트 라이브러리 (instance-swap 대상) ─────────────────────
// 오너: "아이콘도 전부 컴포넌트 속성만들기 적용" → 모든 아이콘을 컴포넌트로 만들어 인스턴스로 배치.
let ICON_LIB: Map<string, ComponentNode> | null = null
const ICON_DEFAULT = '_Icon/Star'
function buildIconLib(ctx: Ctx, page: PageNode) {
  const lib = new Map<string, ComponentNode>()
  const tv = ctx.vars.get('color/text')
  const keys = Object.keys(ICON_PATHS)
  keys.forEach((key, i) => {
    const inner = strokeIcon(key, 24, tv ? boundPaint(tv) : solid(INK))
    if (!inner) return
    const comp = figma.createComponent()
    comp.name = key
    comp.resize(24, 24)
    comp.fills = []
    inner.x = 0
    inner.y = 0
    comp.appendChild(inner)
    page.appendChild(comp)
    comp.x = 1360 + (i % 16) * 30
    comp.y = -760 + Math.floor(i / 16) * 30
    lib.set(key, comp)
  })
  ICON_LIB = lib
}
/** 아이콘 인스턴스(instance-swap 대상). 라이브러리 없으면 빈 프레임 폴백. */
function iconInstance(key: string, name: string, size: number): SceneNode {
  const comp = ICON_LIB && ICON_LIB.get(key)
  if (!comp) {
    const f = figma.createFrame()
    f.name = name
    f.resize(size, size)
    f.fills = []
    return f
  }
  const inst = comp.createInstance()
  inst.name = name
  if (size !== 24) inst.rescale(size / 24)
  return inst
}

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
  const comp = ICON_LIB && ICON_LIB.get(defKey)
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

function buildSet(
  ctx: Ctx,
  page: PageNode,
  setName: string,
  axes: Axis[],
  render: (combo: Record<string, string>) => ComponentNode,
  props?: PropSpec,
  srcFill = '#FBFCFE',
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
  set.fills = [solid(srcFill)]

  // 속성 만들기: 텍스트/불리언(표시)/인스턴스 스왑
  if (props) {
    props.texts?.forEach((t) => addTextProp(set, t.prop, t.layer, t.def))
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
  docs: INPUTS.map((def) => ({
    key: def.key,
    setName: def.setName,
    eyebrow: def.eyebrow,
    desc: def.desc,
    build: (ctx, page) => makeInputSet(ctx, def, page),
    states: def.states,
  })),
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
        buildSet(ctx, page, 'DS/Button', [{ name: 'variant', values: ['primary', 'secondary', 'error', 'success'] }, { name: 'size', values: ['sm', 'md', 'lg'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderButton(ctx, c), {
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
      states: [{ caption: 'Primary', props: { variant: 'primary', size: 'md' } }, { caption: 'Secondary', props: { variant: 'secondary', size: 'md' } }, { caption: 'Error', props: { variant: 'error', size: 'md' } }, { caption: 'Success', props: { variant: 'success', size: 'md' } }, { caption: 'Disabled', props: { disabled: 'true', size: 'md' } }],
    },
    {
      key: 'Badge',
      setName: 'DS/Badge',
      eyebrow: 'ATOM · ACTION',
      desc: '상태·분류를 표시하는 배지. variant·size 축을 가집니다.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Badge', [{ name: 'variant', values: ['primary', 'secondary', 'error', 'success'] }, { name: 'size', values: ['sm', 'md'] }], (c) => renderBadge(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: 'Badge' }] }),
      states: [{ caption: 'Primary', props: { variant: 'primary', size: 'md' } }, { caption: 'Secondary', props: { variant: 'secondary', size: 'md' } }, { caption: 'Error', props: { variant: 'error', size: 'md' } }, { caption: 'Success', props: { variant: 'success', size: 'md' } }],
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

const ALL_CATEGORIES = [INPUT_CATEGORY, SELECTION_CATEGORY, ACTION_CATEGORY, FEEDBACK_CATEGORY]

// ── 변형 아이템(인스턴스 + 캡션) ────────────────────────────────────
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

// ── 카테고리 생성 ────────────────────────────────────────────────────
export async function generateCategories(fontFamily: string): Promise<string[]> {
  const ctx = await setup(fontFamily)
  if (!ctx.vars.get('color/primary')) {
    ctx.warnings.push("Variables가 없습니다 — '토큰'을 먼저 생성하세요(색이 프리셋과 연결되지 않습니다).")
  }
  ICON_LIB = null // 이번 생성분 라이브러리(재실행 시 이전 참조 무효화)

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

    // 아이콘 컴포넌트 라이브러리(instance-swap 대상)를 첫 카테고리 페이지에 1회 생성 → 전 페이지 공유.
    if (!ICON_LIB) buildIconLib(ctx, page)

    // 컴포넌트 세트(편집 소스)를 이 카테고리 페이지에 함께 둔다(별도 소스 페이지 없음).
    // 문서(x=0)와 겹치지 않도록 오른쪽(x≥1360)에 세로로 쌓는다.
    const sets = new Map<string, ComponentSetNode>()
    let sy = 200
    for (const doc of cat.docs) {
      const set = doc.build(ctx, page)
      set.x = 1360
      set.y = sy
      sy += set.height + 48
      sets.set(doc.setName, set)
    }

    const root = makeRoot(cat.title)
    placeRoot(root, page)
    makeHeader(ctx, root, cat.title, cat.subtitle)
    for (const doc of cat.docs) {
      const render = makeSection(ctx, root, {
        eyebrow: doc.eyebrow,
        name: doc.key,
        desc: doc.desc,
        meta: [`Set: ${doc.setName}`, `변형 ${doc.states.length}개`, 'Platform: Web'],
        renderDir: 'WRAP',
      })
      const set = sets.get(doc.setName)
      if (!set) {
        ctx.warnings.push(`${doc.setName} 세트 없음 — 문서 건너뜀`)
        continue
      }
      for (const st of doc.states) render.appendChild(variantItem(ctx, set, st))
    }
  }
  return ctx.warnings
}
