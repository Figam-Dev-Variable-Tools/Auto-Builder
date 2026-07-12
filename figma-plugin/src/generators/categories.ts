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
  applyPageColorMode,
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
import type { PresetName } from '../presets'

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
const PAGE_STRUCTURE = '9. System - Structure'
const PAGE_DATETIME = '10. System - Date & Time'
const PAGE_KR = '11. System - KR'
const PAGE_TEMPLATES = '12. System - Templates'
const PAGE_MEDIA = '13. System - Media'
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
  PAGE_STRUCTURE,
  PAGE_DATETIME,
  PAGE_KR,
  PAGE_TEMPLATES,
  PAGE_MEDIA,
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
  const t = txt(ctx, chars, size, ctx.userColors[varName] ?? hex, bold)
  const v = ctx.vars.get(varName)
  if (v) t.fills = [boundPaint(v)]
  // 오너: 텍스트 크기도 변수로 — font/size/<px>가 있으면 fontSize 바인딩.
  const sv = ctx.vars.get('font/size/' + size)
  if (sv) t.setBoundVariable('fontSize', sv)
  return t
}
function bindFillVar(ctx: Ctx, node: GeometryMixin, varName: string, hex: string) {
  const v = ctx.vars.get(varName)
  node.fills = [v ? boundPaint(v) : solid(ctx.userColors[varName] ?? hex)]
}
function bindStrokeVar(ctx: Ctx, node: MinimalStrokesMixin, varName: string, hex: string) {
  const v = ctx.vars.get(varName)
  node.strokes = [v ? boundPaint(v) : solid(ctx.userColors[varName] ?? hex)]
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
  const sm = combo.size === 'sm'
  const tw = sm ? 36 : 44
  const th = sm ? 22 : 26
  const kn = sm ? 16 : 20
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 10
  c.fills = []
  if (disabled) c.opacity = 0.45
  const track = fixedFrame('track', 'HORIZONTAL', tw, th)
  track.primaryAxisAlignItems = checked ? 'MAX' : 'MIN'
  track.counterAxisAlignItems = 'CENTER'
  track.paddingLeft = track.paddingRight = 3
  track.cornerRadius = th / 2
  bindFillVar(ctx, track, checked ? 'color/primary' : 'color/border', checked ? ACCENT : BORDER)
  const knob = figma.createEllipse()
  knob.resize(kn, kn)
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
  if (combo.removable === 'true') {
    c.paddingRight = 8
    const x = iconInstance('_Icon/Close', 'Remove', 14)
    recolorIcon(x, selected ? WHITE : SUB)
    c.appendChild(x)
  }
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
  const variant = combo.variant || 'default'
  const c = fbBox(340)
  c.counterAxisAlignItems = 'CENTER'
  c.primaryAxisAlignItems = 'SPACE_BETWEEN'
  c.itemSpacing = 10
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = 16
  c.cornerRadius = 8
  c.fills = [solid('#191F28')]
  if (variant !== 'default') {
    const dot = figma.createEllipse()
    dot.resize(8, 8)
    dot.name = 'status'
    dot.fills = [solid(variant === 'error' ? '#FF6B76' : '#3DDC97')]
    c.appendChild(dot)
  }
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
  const p = combo.placement || 'bottom' // top | bottom | left | right
  const horizontal = p === 'left' || p === 'right'
  const c = figma.createComponent()
  c.layoutMode = horizontal ? 'HORIZONTAL' : 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 0
  c.fills = []
  // 화살표: placement가 가리키는 방향(대상 쪽)으로. top→아래, bottom→위, left→오른쪽, right→왼쪽.
  const shape: Record<string, string> = {
    top: 'M0 0 L12 0 L6 6 Z',
    bottom: 'M0 6 L12 6 L6 0 Z',
    left: 'M0 0 L0 12 L6 6 Z',
    right: 'M6 0 L6 12 L0 6 Z',
  }
  const tri = () => {
    const t = figma.createVector()
    t.vectorPaths = [{ windingRule: 'NONZERO', data: shape[p] }]
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
  const arrowFirst = p === 'bottom' || p === 'right'
  if (arrowFirst) c.appendChild(tri())
  c.appendChild(bubble)
  if (!arrowFirst) c.appendChild(tri())
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
  if (combo.variant === 'dots') {
    const dots = autoFrame('dots', 'HORIZONTAL')
    dots.counterAxisAlignItems = 'CENTER'
    dots.itemSpacing = Math.max(3, Math.round(px / 5))
    const ds = Math.max(6, Math.round(px / 2.6))
    for (let i = 0; i < 3; i++) {
      const d = figma.createEllipse()
      d.resize(ds, ds)
      bindFillVar(ctx, d, 'color/primary', ACCENT)
      d.opacity = i === 0 ? 1 : i === 1 ? 0.6 : 0.3
      dots.appendChild(d)
    }
    c.appendChild(dots)
  } else {
    const licon = iconInstance('_Icon/Refresh', 'Icon', px)
    recolorIcon(licon, VARIANT_HEX.primary)
    c.appendChild(licon)
  }
  const ltext = boundText(ctx, '불러오는 중…', 13, 'color/secondary', SUB)
  ltext.name = 'Label'
  c.appendChild(ltext)
  return c
}

// ══ NAVIGATION (Tab / Breadcrumb / Pagination / Dropdown) ════════════
function renderTab(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const active = combo.active === 'true'
  const disabled = combo.disabled === 'true'
  const segmented = combo.variant === 'segmented'
  const c = figma.createComponent()
  if (disabled) c.opacity = 0.45
  if (segmented) {
    // 세그먼트형: 활성 시 알약 배경, 비활성 시 연한 배경(밑줄 없음)
    c.layoutMode = 'HORIZONTAL'
    c.primaryAxisSizingMode = 'AUTO'
    c.counterAxisSizingMode = 'AUTO'
    c.counterAxisAlignItems = 'CENTER'
    c.paddingTop = c.paddingBottom = 8
    c.paddingLeft = c.paddingRight = 18
    c.cornerRadius = 999
    bindFillVar(ctx, c, active ? 'color/primary' : 'color/bgSubtle', active ? ACCENT : SURFACE)
    const t = boundText(ctx, '메뉴', 14, active ? 'color/bg' : 'color/text', active ? WHITE : INK, active)
    t.name = 'Label'
    c.appendChild(t)
    return c
  }
  // 밑줄형(기본)
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
    const selected = idx === 0 // 대표: 선택된 행
    if (selected) bindFillVar(ctx, r, 'color/bgSubtle', SURFACE)
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
  if (combo.disabled === 'true') c.opacity = 0.45
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
function renderModal(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const size = combo.size || 'md'
  const w = size === 'sm' ? 320 : size === 'lg' ? 480 : 380
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
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
function renderDialog(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const variant = combo.variant || 'confirm' // alert | confirm | prompt
  const danger = combo.danger === 'true'
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
  const title = boundText(ctx, danger ? '삭제하시겠어요?' : '계속하시겠어요?', 17, 'color/text', INK, true)
  title.name = 'Title'
  c.appendChild(title)
  const msg = boundText(ctx, danger ? '이 작업은 되돌릴 수 없습니다.' : '선택한 작업을 진행합니다.', 14, 'color/secondary', SUB)
  msg.name = 'Body'
  msg.textAlignHorizontal = 'CENTER'
  c.appendChild(msg)
  if (variant === 'prompt') {
    const field = fieldRow(ctx, null, null, false)
    field.layoutAlign = 'STRETCH'
    const v = boundText(ctx, '입력하세요', 15, 'color/secondary', MUTED)
    v.name = 'Input'
    v.layoutGrow = 1
    field.appendChild(v)
    c.appendChild(field)
  }
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
    const bg = primary ? (danger ? 'color/error' : 'color/primary') : 'color/bgSubtle'
    const bgHex = primary ? (danger ? '#F04452' : ACCENT) : SURFACE
    bindFillVar(ctx, b, bg, bgHex)
    const t = boundText(ctx, label, 14, primary ? 'color/bg' : 'color/text', primary ? WHITE : INK, true)
    t.name = name
    b.appendChild(t)
    return b
  }
  if (variant === 'alert') {
    footer.appendChild(mkBtn('확인', 'Confirm', true))
  } else {
    footer.appendChild(mkBtn('취소', 'Cancel', false))
    footer.appendChild(mkBtn(danger ? '삭제' : '확인', 'Confirm', true))
  }
  c.appendChild(footer)
  return c
}
function renderPopover(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const bottom = combo.placement === 'bottom'
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
  const tri = figma.createVector()
  tri.vectorPaths = [{ windingRule: 'NONZERO', data: bottom ? 'M0 6 L12 6 L6 0 Z' : 'M0 0 L12 0 L6 6 Z' }]
  bindFillVar(ctx, tri, 'color/bg', WHITE)
  tri.strokes = []
  // placement=bottom(대상 아래) → 위쪽 화살표 먼저, 기본 top → 아래쪽 화살표 나중
  if (bottom) c.appendChild(tri)
  c.appendChild(bubble)
  if (!bottom) c.appendChild(tri)
  return c
}

// ══ DATA DISPLAY (Avatar / Statistics / Progress) ════════════════════
function renderAvatar(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const size = combo.size || 'md'
  const status = combo.status || 'online'
  const px = size === 'sm' ? 36 : size === 'lg' ? 64 : size === 'xl' ? 80 : 48
  const fs = size === 'sm' ? 15 : size === 'lg' ? 26 : size === 'xl' ? 32 : 20
  const c = figma.createComponent()
  c.resize(px, px)
  // 모양: shape=rounded면 라운드 사각, 아니면 원
  c.cornerRadius = combo.shape === 'rounded' ? Math.round(px * 0.28) : px / 2
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/primary', ACCENT)
  const initial = txt(ctx, '김', fs, WHITE, true)
  const iv = ctx.vars.get('color/bg')
  if (iv) initial.fills = [boundPaint(iv)]
  initial.name = 'Initial'
  c.appendChild(initial)
  initial.x = (px - initial.width) / 2
  initial.y = (px - initial.height) / 2
  // 상태 점 — online(성공)/offline(회색)/busy(에러). none이면 생략.
  if (status !== 'none') {
    const dot = figma.createEllipse()
    const ds = size === 'sm' ? 9 : size === 'lg' ? 15 : size === 'xl' ? 18 : 12
    dot.resize(ds, ds)
    const sv = status === 'busy' ? 'color/error' : status === 'offline' ? 'color/border' : 'color/success'
    const sh = status === 'busy' ? '#F04452' : status === 'offline' ? BORDER : '#00C471'
    bindFillVar(ctx, dot, sv, sh)
    dot.strokes = [solid(WHITE)]
    dot.strokeWeight = 2
    dot.name = 'Status'
    c.appendChild(dot)
    dot.x = px - ds
    dot.y = px - ds
  }
  return c
}
function renderStatistics(ctx: Ctx, combo: Record<string, string>): ComponentNode {
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
  const dir = combo.delta || 'up'
  const dmap: Record<string, [string, string, string, string]> = {
    up: ['_Icon/ArrowUp', '#00C471', 'color/success', '+12.5%'],
    down: ['_Icon/ArrowDown', '#F04452', 'color/error', '-8.3%'],
    flat: ['_Icon/Minus', '#8B95A1', 'color/tertiary', '0.0%'],
  }
  const [dicon, dhex, dvar, dtext] = dmap[dir] || dmap.up
  const delta = autoFrame('delta', 'HORIZONTAL')
  delta.counterAxisAlignItems = 'CENTER'
  delta.itemSpacing = 4
  const up = iconInstance(dicon, 'Trend Icon', 14)
  recolorIcon(up, dhex)
  delta.appendChild(up)
  const dt = boundText(ctx, dtext, 12, dvar, dhex, true)
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
// 열림 상태 옵션 패널(Select/MultiSelect의 open 베리언트). 떠 있는 메뉴 형태.
function optionPanel(ctx: Ctx, opts: Array<[string, boolean]>, multi: boolean): FrameNode {
  const p = figma.createFrame()
  p.name = 'panel'
  p.layoutMode = 'VERTICAL'
  p.primaryAxisSizingMode = 'AUTO'
  p.counterAxisSizingMode = 'FIXED'
  p.itemSpacing = 2
  p.paddingTop = p.paddingBottom = 6
  p.paddingLeft = p.paddingRight = 6
  p.cornerRadius = 10
  bindFillVar(ctx, p, 'color/bg', WHITE)
  bindStrokeVar(ctx, p, 'color/border', BORDER)
  p.strokeWeight = 1
  p.strokeAlign = 'INSIDE'
  p.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.14 }, offset: { x: 0, y: 6 }, radius: 20, spread: 0, visible: true, blendMode: 'NORMAL' }]
  p.resize(FIELD_W, p.height)
  opts.forEach(([label, selected], i) => {
    const r = autoFrame('option', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'CENTER'
    r.itemSpacing = 10
    r.paddingTop = r.paddingBottom = 9
    r.paddingLeft = r.paddingRight = 10
    r.cornerRadius = 6
    if (selected && !multi) bindFillVar(ctx, r, 'color/bgSubtle', SURFACE)
    if (multi) {
      const box = autoFrame('box', 'HORIZONTAL')
      box.primaryAxisSizingMode = 'FIXED'
      box.counterAxisSizingMode = 'FIXED'
      box.resize(18, 18)
      box.primaryAxisAlignItems = 'CENTER'
      box.counterAxisAlignItems = 'CENTER'
      box.cornerRadius = 5
      if (selected) {
        bindFillVar(ctx, box, 'color/primary', ACCENT)
        const ck = iconInstance('_Icon/Check', 'check', 13)
        recolorIcon(ck, WHITE)
        box.appendChild(ck)
      } else {
        box.fills = []
        bindStrokeVar(ctx, box, 'color/border', BORDER)
        box.strokeWeight = 1.5
        box.strokeAlign = 'INSIDE'
      }
      r.appendChild(box)
    }
    const hot = selected && !multi
    const t = boundText(ctx, label, 14, hot ? 'color/primary' : 'color/text', hot ? ACCENT : INK, hot)
    t.name = 'Option ' + (i + 1)
    t.layoutGrow = 1
    r.appendChild(t)
    if (hot) {
      const ck = iconInstance('_Icon/Check', 'check', 16)
      recolorIcon(ck, ACCENT)
      r.appendChild(ck)
    }
    p.appendChild(r)
  })
  return p
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
  if (combo.open === 'true') {
    addField(optionPanel(ctx, [['전체', false], ['진행 중', true], ['완료', false], ['보류', false]], false))
  }
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
  if (combo.open === 'true') {
    addField(optionPanel(ctx, [['React', true], ['Svelte', true], ['Vue', false], ['Angular', false]], true))
  }
  return c
}
function renderSlider(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const pct = combo.value === '0' ? 0 : combo.value === '100' ? 100 : 50
  const { c, addField } = inputShell(ctx, '볼륨', false)
  if (combo.disabled === 'true') c.opacity = 0.45
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
function renderDrawer(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const left = combo.side === 'left'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(280, c.height)
  c.itemSpacing = 0
  bindFillVar(ctx, c, 'color/bg', WHITE)
  c.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.2 }, offset: { x: left ? 8 : -8, y: 0 }, radius: 32, spread: 0, visible: true, blendMode: 'NORMAL' }]
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

// ══ STRUCTURE (Navbar / Header / Footer / Sidebar) ═══════════════════
function bottomBorder(ctx: Ctx, c: FrameNode | ComponentNode) {
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeAlign = 'INSIDE'
  c.strokeTopWeight = 0
  c.strokeLeftWeight = 0
  c.strokeRightWeight = 0
  c.strokeBottomWeight = 1
}
function pillButton(ctx: Ctx, label: string, name: string): FrameNode {
  const btn = autoFrame('cta', 'HORIZONTAL')
  btn.counterAxisAlignItems = 'CENTER'
  btn.paddingTop = btn.paddingBottom = 9
  btn.paddingLeft = btn.paddingRight = 16
  btn.cornerRadius = 8
  bindFillVar(ctx, btn, 'color/primary', ACCENT)
  const t = boundText(ctx, label, 14, 'color/onPrimary', '#FFFFFF', true)
  t.name = name
  btn.appendChild(t)
  return btn
}
function avatarCircle(ctx: Ctx, size: number): FrameNode {
  const a = figma.createFrame()
  a.name = 'Avatar'
  a.resize(size, size)
  a.cornerRadius = 999
  bindFillVar(ctx, a, 'color/primary', ACCENT)
  return a
}
function renderNavbar(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'AUTO'
  c.resize(760, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.primaryAxisAlignItems = 'SPACE_BETWEEN'
  c.paddingTop = c.paddingBottom = 14
  c.paddingLeft = c.paddingRight = 24
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bottomBorder(ctx, c)
  const brand = autoFrame('brand', 'HORIZONTAL')
  brand.counterAxisAlignItems = 'CENTER'
  brand.itemSpacing = 8
  const logo = iconInstance('_Icon/Sparkles', 'Brand Icon', 22)
  recolorIcon(logo, ACCENT)
  brand.appendChild(logo)
  const brandT = boundText(ctx, 'TDS', 18, 'color/text', INK, true)
  brandT.name = 'Brand'
  brand.appendChild(brandT)
  c.appendChild(brand)
  const right = autoFrame('right', 'HORIZONTAL')
  right.counterAxisAlignItems = 'CENTER'
  right.itemSpacing = 24
  const links = autoFrame('links', 'HORIZONTAL')
  links.counterAxisAlignItems = 'CENTER'
  links.itemSpacing = 20
  ;['홈', '제품', '가격'].forEach((label, i) => {
    const t = boundText(ctx, label, 14, i === 0 ? 'color/text' : 'color/secondary', i === 0 ? INK : SUB, i === 0)
    t.name = 'Link ' + (i + 1)
    links.appendChild(t)
  })
  right.appendChild(links)
  right.appendChild(pillButton(ctx, '시작하기', 'CTA'))
  c.appendChild(right)
  return c
}
function renderHeader(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'AUTO'
  c.resize(760, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.primaryAxisAlignItems = 'SPACE_BETWEEN'
  c.paddingTop = c.paddingBottom = 14
  c.paddingLeft = c.paddingRight = 20
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bottomBorder(ctx, c)
  const left = autoFrame('left', 'HORIZONTAL')
  left.counterAxisAlignItems = 'CENTER'
  left.itemSpacing = 12
  const menu = iconInstance('_Icon/Menu', 'Menu Icon', 22)
  recolorIcon(menu, INK)
  left.appendChild(menu)
  const title = boundText(ctx, '페이지 제목', 17, 'color/text', INK, true)
  title.name = 'Title'
  left.appendChild(title)
  c.appendChild(left)
  const right = autoFrame('right', 'HORIZONTAL')
  right.counterAxisAlignItems = 'CENTER'
  right.itemSpacing = 16
  ;[['_Icon/Search', 'Search Icon'], ['_Icon/Bell', 'Bell Icon']].forEach(([k, n]) => {
    const ic = iconInstance(k, n, 20)
    recolorIcon(ic, SUB)
    right.appendChild(ic)
  })
  right.appendChild(avatarCircle(ctx, 30))
  c.appendChild(right)
  return c
}
function renderFooter(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'AUTO'
  c.resize(760, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.primaryAxisAlignItems = 'SPACE_BETWEEN'
  c.paddingTop = c.paddingBottom = 22
  c.paddingLeft = c.paddingRight = 24
  bindFillVar(ctx, c, 'color/bgSubtle', SURFACE)
  const copy = boundText(ctx, '© 2026 TDS. All rights reserved.', 13, 'color/secondary', SUB)
  copy.name = 'Copyright'
  c.appendChild(copy)
  const links = autoFrame('links', 'HORIZONTAL')
  links.counterAxisAlignItems = 'CENTER'
  links.itemSpacing = 18
  ;['이용약관', '개인정보', '문의'].forEach((label, i) => {
    const t = boundText(ctx, label, 13, 'color/secondary', SUB)
    t.name = 'Link ' + (i + 1)
    links.appendChild(t)
  })
  c.appendChild(links)
  return c
}
function renderSidebar(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(240, c.height)
  c.itemSpacing = 4
  c.paddingTop = c.paddingBottom = 16
  c.paddingLeft = c.paddingRight = 12
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeAlign = 'INSIDE'
  c.strokeTopWeight = 0
  c.strokeBottomWeight = 0
  c.strokeLeftWeight = 0
  c.strokeRightWeight = 1
  const brand = autoFrame('brand', 'HORIZONTAL')
  brand.layoutAlign = 'STRETCH'
  brand.counterAxisAlignItems = 'CENTER'
  brand.itemSpacing = 8
  brand.paddingLeft = 8
  brand.paddingTop = 4
  brand.paddingBottom = 12
  const logo = iconInstance('_Icon/Sparkles', 'Brand Icon', 22)
  recolorIcon(logo, ACCENT)
  brand.appendChild(logo)
  const brandT = boundText(ctx, 'TDS Console', 16, 'color/text', INK, true)
  brandT.name = 'Brand'
  brand.appendChild(brandT)
  c.appendChild(brand)
  const items: Array<[string, string]> = [
    ['홈', '_Icon/House'],
    ['대시보드', '_Icon/Grid'],
    ['설정', '_Icon/Settings'],
  ]
  items.forEach(([label, icon], i) => {
    const r = autoFrame('nav', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'CENTER'
    r.itemSpacing = 12
    r.paddingTop = r.paddingBottom = 11
    r.paddingLeft = r.paddingRight = 12
    r.cornerRadius = 8
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

// ══ DATE & TIME (Calendar / DatePicker / TimePicker / DateRangePicker) ═
function gridCell(w: number, h: number): FrameNode {
  const cell = figma.createFrame()
  cell.layoutMode = 'HORIZONTAL'
  cell.primaryAxisSizingMode = 'FIXED'
  cell.counterAxisSizingMode = 'FIXED'
  cell.resize(w, h)
  cell.primaryAxisAlignItems = 'CENTER'
  cell.counterAxisAlignItems = 'CENTER'
  cell.fills = []
  return cell
}
function renderCalendar(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.itemSpacing = 10
  c.paddingTop = c.paddingBottom = 16
  c.paddingLeft = c.paddingRight = 16
  c.cornerRadius = 14
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  const header = autoFrame('header', 'HORIZONTAL')
  header.layoutAlign = 'STRETCH'
  header.primaryAxisSizingMode = 'FIXED'
  header.counterAxisAlignItems = 'CENTER'
  header.primaryAxisAlignItems = 'SPACE_BETWEEN'
  const prev = iconInstance('_Icon/ChevronLeft', 'Prev', 20)
  recolorIcon(prev, SUB)
  header.appendChild(prev)
  const title = boundText(ctx, '2026년 7월', 16, 'color/text', INK, true)
  title.name = 'Title'
  header.appendChild(title)
  const next = iconInstance('_Icon/ChevronRight', 'Next', 20)
  recolorIcon(next, SUB)
  header.appendChild(next)
  c.appendChild(header)
  const wk = figma.createFrame()
  wk.name = 'weekdays'
  wk.layoutMode = 'HORIZONTAL'
  wk.primaryAxisSizingMode = 'FIXED'
  wk.counterAxisSizingMode = 'AUTO'
  wk.itemSpacing = 0
  wk.fills = []
  wk.resize(280, wk.height)
  ;['일', '월', '화', '수', '목', '금', '토'].forEach((d) => {
    const cell = gridCell(40, 24)
    cell.appendChild(boundText(ctx, d, 12, 'color/secondary', SUB))
    wk.appendChild(cell)
  })
  c.appendChild(wk)
  const firstWeekday = 3, days = 31, selected = 15, today = 9
  const grid = figma.createFrame()
  grid.name = 'grid'
  grid.layoutMode = 'VERTICAL'
  grid.primaryAxisSizingMode = 'AUTO'
  grid.counterAxisSizingMode = 'AUTO'
  grid.itemSpacing = 2
  grid.fills = []
  for (let row = 0; row < 5; row++) {
    const r = figma.createFrame()
    r.name = 'week'
    r.layoutMode = 'HORIZONTAL'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisSizingMode = 'AUTO'
    r.itemSpacing = 0
    r.fills = []
    r.resize(280, r.height)
    for (let col = 0; col < 7; col++) {
      const day = row * 7 + col - firstWeekday + 1
      const cell = gridCell(40, 40)
      cell.cornerRadius = 999
      if (day >= 1 && day <= days) {
        const isSel = day === selected
        if (isSel) bindFillVar(ctx, cell, 'color/primary', ACCENT)
        else if (day === today) {
          bindStrokeVar(ctx, cell, 'color/primary', ACCENT)
          cell.strokeWeight = 1
          cell.strokeAlign = 'INSIDE'
        }
        cell.appendChild(boundText(ctx, String(day), 14, isSel ? 'color/onPrimary' : 'color/text', isSel ? '#FFFFFF' : INK, isSel))
      }
      r.appendChild(cell)
    }
    grid.appendChild(r)
  }
  c.appendChild(grid)
  return c
}
function pickerField(ctx: Ctx, labelDef: string, valueDef: string, iconKey: string): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.itemSpacing = 6
  c.fills = []
  c.resize(300, c.height)
  const label = boundText(ctx, labelDef, 13, 'color/secondary', SUB)
  label.name = 'Label'
  c.appendChild(label)
  const field = autoFrame('field', 'HORIZONTAL')
  field.layoutAlign = 'STRETCH'
  field.primaryAxisSizingMode = 'FIXED'
  field.counterAxisAlignItems = 'CENTER'
  field.primaryAxisAlignItems = 'SPACE_BETWEEN'
  field.paddingTop = field.paddingBottom = 12
  field.paddingLeft = field.paddingRight = 14
  field.cornerRadius = 10
  bindFillVar(ctx, field, 'color/bg', WHITE)
  bindStrokeVar(ctx, field, 'color/border', BORDER)
  field.strokeWeight = 1
  field.strokeAlign = 'INSIDE'
  const value = boundText(ctx, valueDef, 15, 'color/text', INK)
  value.name = 'Value'
  field.appendChild(value)
  const icon = iconInstance(iconKey, 'Icon', 18)
  recolorIcon(icon, SUB)
  field.appendChild(icon)
  c.appendChild(field)
  return c
}

// ══ DATA 확장 (Table / Timeline / Tree / Carousel) ═══════════════════
function cellFrame(w: number, padV: number): FrameNode {
  const f = figma.createFrame()
  f.name = 'cell'
  f.layoutMode = 'HORIZONTAL'
  f.primaryAxisSizingMode = 'FIXED'
  f.counterAxisSizingMode = 'AUTO'
  f.counterAxisAlignItems = 'CENTER'
  f.paddingLeft = 14
  f.paddingRight = 8
  f.paddingTop = padV
  f.paddingBottom = padV
  f.fills = []
  f.resize(w, f.height)
  return f
}
function statusPill(ctx: Ctx, label: string, tintHex: string, varName: string, hex: string): FrameNode {
  const p = figma.createFrame()
  p.name = 'status'
  p.layoutMode = 'HORIZONTAL'
  p.primaryAxisSizingMode = 'AUTO'
  p.counterAxisSizingMode = 'AUTO'
  p.counterAxisAlignItems = 'CENTER'
  p.paddingLeft = p.paddingRight = 10
  p.paddingTop = p.paddingBottom = 4
  p.cornerRadius = 999
  p.fills = [solid(tintHex)]
  p.appendChild(boundText(ctx, label, 12, varName, hex, true))
  return p
}
function circleBtn(ctx: Ctx, iconKey: string, name: string, size: number): FrameNode {
  const b = figma.createFrame()
  b.name = name
  b.layoutMode = 'HORIZONTAL'
  b.primaryAxisSizingMode = 'FIXED'
  b.counterAxisSizingMode = 'FIXED'
  b.resize(size, size)
  b.primaryAxisAlignItems = 'CENTER'
  b.counterAxisAlignItems = 'CENTER'
  b.cornerRadius = 999
  bindFillVar(ctx, b, 'color/bg', WHITE)
  bindStrokeVar(ctx, b, 'color/border', BORDER)
  b.strokeWeight = 1
  b.strokeAlign = 'INSIDE'
  const ic = iconInstance(iconKey, name + ' Icon', Math.round(size * 0.5))
  recolorIcon(ic, SUB)
  b.appendChild(ic)
  return b
}
function renderTable(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const cols = [180, 200, 140]
  const striped = combo.state === 'striped'
  const empty = combo.state === 'empty'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.itemSpacing = 0
  c.cornerRadius = 12
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  const head = figma.createFrame()
  head.name = 'thead'
  head.layoutMode = 'HORIZONTAL'
  head.primaryAxisSizingMode = 'AUTO'
  head.counterAxisSizingMode = 'AUTO'
  head.itemSpacing = 0
  bindFillVar(ctx, head, 'color/bgSubtle', SURFACE)
  ;['이름', '역할', '상태'].forEach((h, i) => {
    const cell = cellFrame(cols[i], 12)
    const t = boundText(ctx, h, 13, 'color/secondary', SUB, true)
    t.name = 'Head ' + (i + 1)
    cell.appendChild(t)
    head.appendChild(cell)
  })
  c.appendChild(head)
  if (empty) {
    const er = figma.createFrame()
    er.name = 'empty'
    er.layoutMode = 'HORIZONTAL'
    er.primaryAxisSizingMode = 'FIXED'
    er.counterAxisSizingMode = 'FIXED'
    er.resize(cols[0] + cols[1] + cols[2], 88)
    er.primaryAxisAlignItems = 'CENTER'
    er.counterAxisAlignItems = 'CENTER'
    er.fills = []
    er.appendChild(boundText(ctx, '데이터가 없습니다', 13, 'color/secondary', SUB))
    c.appendChild(er)
    return c
  }
  const rows: Array<[string, string, string]> = [
    ['김디자인', '프로덕트 디자이너', 'active'],
    ['이개발', '프론트엔드 개발자', 'active'],
    ['박기획', '프로덕트 매니저', 'wait'],
  ]
  rows.forEach((r, ri) => {
    const row = figma.createFrame()
    row.name = 'row'
    row.layoutMode = 'HORIZONTAL'
    row.primaryAxisSizingMode = 'AUTO'
    row.counterAxisSizingMode = 'AUTO'
    row.itemSpacing = 0
    row.fills = []
    if (striped && ri % 2 === 1) bindFillVar(ctx, row, 'color/bgSubtle', SURFACE)
    if (!striped && ri < rows.length - 1) {
      bindStrokeVar(ctx, row, 'color/border', BORDER)
      row.strokeAlign = 'INSIDE'
      row.strokeTopWeight = 0
      row.strokeLeftWeight = 0
      row.strokeRightWeight = 0
      row.strokeBottomWeight = 1
    }
    const c0 = cellFrame(cols[0], 13)
    c0.appendChild(boundText(ctx, r[0], 14, 'color/text', INK))
    row.appendChild(c0)
    const c1 = cellFrame(cols[1], 13)
    c1.appendChild(boundText(ctx, r[1], 14, 'color/secondary', SUB))
    row.appendChild(c1)
    const c2 = cellFrame(cols[2], 10)
    c2.appendChild(
      r[2] === 'active'
        ? statusPill(ctx, '활성', '#E6F8F0', 'color/success', '#00C471')
        : statusPill(ctx, '대기', '#FEF3E2', 'color/warning', '#F59E0B'),
    )
    row.appendChild(c2)
    c.appendChild(row)
  })
  return c
}
function renderTimeline(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const items: Array<[string, string, string]> = [
    ['주문 완료', '결제가 정상적으로 확인되었습니다.', '오후 2:30'],
    ['배송 준비', '상품을 포장하고 있습니다.', '오후 4:10'],
    ['배송 시작', '택배사에 상품이 전달되었습니다.', '오후 6:00'],
  ]
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.itemSpacing = 0
  c.fills = []
  c.resize(340, c.height)
  items.forEach(([title, desc, time], i) => {
    const item = autoFrame('item', 'HORIZONTAL')
    item.layoutAlign = 'STRETCH'
    item.primaryAxisSizingMode = 'FIXED'
    item.counterAxisAlignItems = 'MIN'
    item.itemSpacing = 12
    // 상태: 0=완료 1=진행중 2=대기 (done/active/pending 대표 표현)
    const status = i === 0 ? 'done' : i === 1 ? 'active' : 'pending'
    const rail = figma.createFrame()
    rail.name = 'rail'
    rail.layoutMode = 'VERTICAL'
    rail.primaryAxisSizingMode = 'AUTO'
    rail.counterAxisSizingMode = 'FIXED'
    rail.counterAxisAlignItems = 'CENTER'
    rail.itemSpacing = 4
    rail.fills = []
    rail.resize(16, rail.height)
    const dot = figma.createFrame()
    const dsz = status === 'active' ? 14 : 12
    dot.resize(dsz, dsz)
    dot.cornerRadius = 999
    if (status === 'pending') {
      bindFillVar(ctx, dot, 'color/border', BORDER)
    } else if (status === 'active') {
      bindFillVar(ctx, dot, 'color/bg', WHITE)
      bindStrokeVar(ctx, dot, 'color/primary', ACCENT)
      dot.strokeWeight = 3
      dot.strokeAlign = 'INSIDE'
    } else {
      bindFillVar(ctx, dot, 'color/primary', ACCENT)
    }
    rail.appendChild(dot)
    if (i < items.length - 1) {
      const line = figma.createFrame()
      line.resize(2, 44)
      bindFillVar(ctx, line, status === 'done' ? 'color/primary' : 'color/border', status === 'done' ? ACCENT : BORDER)
      rail.appendChild(line)
    }
    item.appendChild(rail)
    const col = autoFrame('content', 'VERTICAL')
    col.itemSpacing = 3
    col.paddingBottom = 18
    const t = boundText(ctx, title, 15, 'color/text', INK, true)
    t.name = 'Title ' + (i + 1)
    col.appendChild(t)
    const d = boundText(ctx, desc, 13, 'color/secondary', SUB)
    d.name = 'Desc ' + (i + 1)
    col.appendChild(d)
    const tm = boundText(ctx, time, 12, 'color/tertiary', MUTED)
    tm.name = 'Time ' + (i + 1)
    col.appendChild(tm)
    item.appendChild(col)
    c.appendChild(item)
  })
  return c
}
function renderTree(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const rows: Array<{ depth: number; chev: string; icon: string; label: string }> = [
    { depth: 0, chev: 'down', icon: '_Icon/Folder', label: '문서' },
    { depth: 1, chev: 'down', icon: '_Icon/Folder', label: '프로젝트' },
    { depth: 2, chev: '', icon: '_Icon/File', label: '기획서.md' },
    { depth: 2, chev: '', icon: '_Icon/File', label: '디자인.fig' },
    { depth: 1, chev: 'right', icon: '_Icon/Folder', label: '이미지' },
  ]
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.itemSpacing = 2
  c.paddingTop = c.paddingBottom = 8
  c.paddingLeft = c.paddingRight = 8
  c.cornerRadius = 12
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  c.resize(300, c.height)
  rows.forEach((r, i) => {
    const row = autoFrame('node', 'HORIZONTAL')
    row.layoutAlign = 'STRETCH'
    row.primaryAxisSizingMode = 'FIXED'
    row.counterAxisAlignItems = 'CENTER'
    row.itemSpacing = 6
    row.paddingTop = row.paddingBottom = 7
    row.paddingRight = 8
    row.paddingLeft = 8 + r.depth * 20
    row.cornerRadius = 6
    const selected = i === 2 // 대표: 선택된 노드 하이라이트
    if (selected) bindFillVar(ctx, row, 'color/bgSubtle', SURFACE)
    if (r.chev) {
      const ch = iconInstance(r.chev === 'down' ? '_Icon/ChevronDown' : '_Icon/ChevronRight', 'Chevron', 16)
      recolorIcon(ch, SUB)
      row.appendChild(ch)
    } else {
      const sp = figma.createFrame()
      sp.name = 'spacer'
      sp.resize(16, 16)
      sp.fills = []
      row.appendChild(sp)
    }
    const ic = iconInstance(r.icon, 'Icon', 16)
    recolorIcon(ic, r.icon === '_Icon/Folder' ? ACCENT : selected ? ACCENT : SUB)
    row.appendChild(ic)
    const t = boundText(ctx, r.label, 14, selected ? 'color/primary' : 'color/text', selected ? ACCENT : INK, selected)
    t.name = 'Node ' + (i + 1)
    row.appendChild(t)
    c.appendChild(row)
  })
  return c
}
function renderCarousel(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const showArrows = combo.showArrows !== 'false'
  const showDots = combo.showDots !== 'false'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 14
  c.fills = []
  const stage = autoFrame('stage', 'HORIZONTAL')
  stage.counterAxisAlignItems = 'CENTER'
  stage.itemSpacing = 12
  if (showArrows) stage.appendChild(circleBtn(ctx, '_Icon/ChevronLeft', 'Prev', 36))
  const slide = figma.createFrame()
  slide.name = 'slide'
  slide.layoutMode = 'HORIZONTAL'
  slide.primaryAxisSizingMode = 'FIXED'
  slide.counterAxisSizingMode = 'FIXED'
  slide.resize(320, 180)
  slide.primaryAxisAlignItems = 'CENTER'
  slide.counterAxisAlignItems = 'CENTER'
  slide.cornerRadius = 14
  slide.fills = [solid('#EEF2FF')]
  const st = boundText(ctx, '슬라이드 1 / 4', 16, 'color/primary', ACCENT, true)
  st.name = 'Slide'
  slide.appendChild(st)
  stage.appendChild(slide)
  if (showArrows) stage.appendChild(circleBtn(ctx, '_Icon/ChevronRight', 'Next', 36))
  c.appendChild(stage)
  if (showDots) {
    const dots = autoFrame('dots', 'HORIZONTAL')
    dots.counterAxisAlignItems = 'CENTER'
    dots.itemSpacing = 6
    for (let i = 0; i < 4; i++) {
      const d = figma.createFrame()
      d.resize(i === 0 ? 18 : 8, 8)
      d.cornerRadius = 999
      bindFillVar(ctx, d, i === 0 ? 'color/primary' : 'color/border', i === 0 ? ACCENT : BORDER)
      dots.appendChild(d)
    }
    c.appendChild(dots)
  }
  return c
}

// ══ KR 컴포넌트 (한국 도메인 폼) — Storybook src/ds/kr 미러 ═══════════
type KrSpec = { label: string; ph: string; helper?: string; errHelper?: string; trailing?: 'eye' | 'chevron' | string; narrow?: boolean }
// 프레임형 필드(콤포지트 내부용) — 라벨 + 입력행 + (옵션)헬퍼
function krSubField(ctx: Ctx, spec: KrSpec, filled = false): FrameNode {
  const f = autoFrame('field/' + spec.label, 'VERTICAL')
  f.layoutAlign = 'STRETCH'
  f.itemSpacing = 6
  const lbl = boundText(ctx, spec.label, 13, 'color/text', INK, true)
  lbl.name = 'FieldLabel'
  f.appendChild(lbl)
  const row = fieldRow(ctx, null, null, false)
  const val = boundText(ctx, spec.ph, 15, filled ? 'color/text' : 'color/secondary', filled ? INK : MUTED)
  val.name = 'Value'
  val.layoutGrow = 1
  row.appendChild(val)
  if (spec.trailing === 'eye' || spec.trailing === 'chevron') {
    const ic = iconInstance(spec.trailing === 'eye' ? '_Icon/EyeOff' : '_Icon/ChevronDown', 'Icon', 18)
    recolorIcon(ic, SUB)
    row.appendChild(ic)
  } else if (typeof spec.trailing === 'string') {
    row.appendChild(krTrailingBtn(ctx, spec.trailing))
  }
  f.appendChild(row)
  if (spec.helper) {
    const h = boundText(ctx, spec.helper, 12, 'color/secondary', SUB)
    h.name = 'Helper'
    f.appendChild(h)
  }
  return f
}
function krTrailingBtn(ctx: Ctx, label: string): FrameNode {
  const b = autoFrame('Button', 'HORIZONTAL')
  b.counterAxisAlignItems = 'CENTER'
  b.paddingTop = b.paddingBottom = 6
  b.paddingLeft = b.paddingRight = 12
  b.cornerRadius = 6
  bindFillVar(ctx, b, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, b, 'color/border', BORDER)
  b.strokeWeight = 1
  b.strokeAlign = 'INSIDE'
  const t = boundText(ctx, label, 13, 'color/text', INK, true)
  b.appendChild(t)
  return b
}
// 컴포넌트형 단일 필드(상태 축)
function krField(ctx: Ctx, spec: KrSpec, combo: Record<string, string>): ComponentNode {
  const st = combo.state || 'default'
  const error = st === 'error'
  const filled = st === 'filled'
  const disabled = st === 'disabled'
  const { c, addField } = inputShell(ctx, spec.label, disabled)
  if (spec.narrow) c.resize(200, c.height)
  const row = fieldRow(ctx, error ? 'color/error' : filled ? 'color/success' : null, error ? '#F04452' : filled ? '#00C471' : null, disabled)
  const val = boundText(ctx, spec.ph, 15, filled ? 'color/text' : 'color/secondary', filled ? INK : MUTED)
  val.name = 'Value'
  val.layoutGrow = 1
  row.appendChild(val)
  if (spec.trailing === 'eye' || spec.trailing === 'chevron') {
    const ic = iconInstance(spec.trailing === 'eye' ? '_Icon/EyeOff' : '_Icon/ChevronDown', 'Icon', 18)
    recolorIcon(ic, SUB)
    row.appendChild(ic)
  } else if (typeof spec.trailing === 'string') {
    row.appendChild(krTrailingBtn(ctx, spec.trailing))
  }
  addField(row)
  const ht = error ? spec.errHelper || '형식이 올바르지 않습니다' : spec.helper
  if (ht) {
    const h = boundText(ctx, ht, 12, error ? 'color/error' : 'color/secondary', error ? '#F04452' : SUB)
    h.name = 'Helper'
    h.layoutAlign = 'STRETCH'
    addField(h)
  }
  return c
}
// 진행 단계 인디케이터
function renderKrStep(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const steps = ['수단 선택', '인증', '완료']
  const current = 1
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 8
  c.fills = []
  steps.forEach((s, i) => {
    if (i > 0) {
      const line = figma.createRectangle()
      line.resize(24, 2)
      bindFillVar(ctx, line, 'color/border', BORDER)
      c.appendChild(line)
    }
    const item = autoFrame('step', 'HORIZONTAL')
    item.counterAxisAlignItems = 'CENTER'
    item.itemSpacing = 6
    const done = i < current
    const active = i === current
    const marker = figma.createFrame()
    marker.name = 'marker'
    marker.layoutMode = 'HORIZONTAL'
    marker.primaryAxisSizingMode = 'FIXED'
    marker.counterAxisSizingMode = 'FIXED'
    marker.resize(24, 24)
    marker.primaryAxisAlignItems = 'CENTER'
    marker.counterAxisAlignItems = 'CENTER'
    marker.cornerRadius = 999
    bindFillVar(ctx, marker, done || active ? 'color/primary' : 'color/bgSubtle', done || active ? ACCENT : SURFACE)
    if (done) {
      const ck = iconInstance('_Icon/Check', 'c', 14)
      recolorIcon(ck, WHITE)
      marker.appendChild(ck)
    } else {
      marker.appendChild(txt(ctx, String(i + 1), 12, active ? WHITE : MUTED, true))
    }
    item.appendChild(marker)
    item.appendChild(boundText(ctx, s, 13, active ? 'color/text' : 'color/secondary', active ? INK : SUB, active))
    c.appendChild(item)
  })
  return c
}
// 통신사 선택 — 필-버튼 라디오 그룹(wrap)
function renderKrCarrier(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(320, c.height)
  c.itemSpacing = 8
  c.fills = []
  const lbl = boundText(ctx, '통신사', 13, 'color/text', INK, true)
  lbl.name = 'Label'
  c.appendChild(lbl)
  const wrap = figma.createFrame()
  wrap.name = 'pills'
  wrap.layoutMode = 'HORIZONTAL'
  wrap.layoutWrap = 'WRAP'
  wrap.primaryAxisSizingMode = 'FIXED'
  wrap.counterAxisSizingMode = 'AUTO'
  wrap.layoutAlign = 'STRETCH'
  wrap.itemSpacing = 8
  wrap.counterAxisSpacing = 8
  wrap.fills = []
  wrap.resize(320, wrap.height)
  ;['SKT', 'KT', 'LG U+', 'SKT 알뜰폰', 'KT 알뜰폰', 'LG U+ 알뜰폰'].forEach((n, i) => {
    const sel = i === 0
    const p = autoFrame('pill', 'HORIZONTAL')
    p.counterAxisAlignItems = 'CENTER'
    p.paddingTop = p.paddingBottom = 8
    p.paddingLeft = p.paddingRight = 16
    p.cornerRadius = 999
    bindFillVar(ctx, p, sel ? 'color/primary' : 'color/bgSubtle', sel ? ACCENT : SURFACE)
    if (!sel) {
      bindStrokeVar(ctx, p, 'color/border', BORDER)
      p.strokeWeight = 1
      p.strokeAlign = 'INSIDE'
    }
    p.appendChild(boundText(ctx, n, 13, sel ? 'color/bg' : 'color/text', sel ? WHITE : INK, sel))
    wrap.appendChild(p)
  })
  c.appendChild(wrap)
  return c
}
// 본인인증 수단 선택 — 카드형 행 리스트
function renderKrAuthMethod(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const methods: Array<[string, string, string]> = [
    ['휴대폰(PASS)', '가장 빠르게 인증', '#3D6BFF'],
    ['카카오 인증', '카카오톡으로 인증', '#FEE500'],
    ['네이버 인증', '네이버 앱으로 인증', '#03C75A'],
    ['공동인증서', '기존 공인인증서로 인증', '#8B95A1'],
    ['금융인증서', '금융결제원 인증서로 인증', '#8B95A1'],
  ]
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(340, c.height)
  c.itemSpacing = 8
  c.fills = []
  const lbl = boundText(ctx, '본인인증 수단', 13, 'color/text', INK, true)
  lbl.name = 'Label'
  c.appendChild(lbl)
  methods.forEach(([title, desc, mark], i) => {
    const sel = i === 0
    const r = autoFrame('method', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'CENTER'
    r.itemSpacing = 12
    r.paddingTop = r.paddingBottom = 13
    r.paddingLeft = r.paddingRight = 14
    r.cornerRadius = 12
    bindFillVar(ctx, r, sel ? 'color/bgSubtle' : 'color/bg', sel ? SURFACE : WHITE)
    bindStrokeVar(ctx, r, sel ? 'color/primary' : 'color/border', sel ? ACCENT : BORDER)
    r.strokeWeight = sel ? 1.5 : 1
    r.strokeAlign = 'INSIDE'
    const dot = figma.createFrame()
    dot.name = 'mark'
    dot.resize(28, 28)
    dot.cornerRadius = 8
    dot.fills = [solid(mark)]
    r.appendChild(dot)
    const col = autoFrame('text', 'VERTICAL')
    col.itemSpacing = 2
    col.layoutGrow = 1
    const t = boundText(ctx, title, 14, 'color/text', INK, true)
    t.name = 'Title'
    col.appendChild(t)
    col.appendChild(boundText(ctx, desc, 12, 'color/secondary', SUB))
    r.appendChild(col)
    if (sel) {
      const ck = iconInstance('_Icon/Check', 'check', 18)
      recolorIcon(ck, ACCENT)
      r.appendChild(ck)
    }
    c.appendChild(r)
  })
  return c
}
// 전자서명 패드
function renderKrSignature(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(320, c.height)
  c.itemSpacing = 10
  c.fills = []
  const lbl = boundText(ctx, '전자서명', 13, 'color/text', INK, true)
  lbl.name = 'Label'
  c.appendChild(lbl)
  const canvas = figma.createFrame()
  canvas.name = 'canvas'
  canvas.layoutMode = 'HORIZONTAL'
  canvas.primaryAxisSizingMode = 'FIXED'
  canvas.counterAxisSizingMode = 'FIXED'
  canvas.layoutAlign = 'STRETCH'
  canvas.resize(320, 160)
  canvas.primaryAxisAlignItems = 'CENTER'
  canvas.counterAxisAlignItems = 'CENTER'
  canvas.cornerRadius = 10
  bindFillVar(ctx, canvas, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, canvas, 'color/border', BORDER)
  canvas.strokeWeight = 1
  canvas.dashPattern = [6, 6]
  canvas.appendChild(boundText(ctx, '여기에 서명해 주세요', 14, 'color/tertiary', MUTED))
  c.appendChild(canvas)
  const btns = autoFrame('actions', 'HORIZONTAL')
  btns.layoutAlign = 'STRETCH'
  btns.primaryAxisSizingMode = 'FIXED'
  btns.primaryAxisAlignItems = 'MAX'
  btns.itemSpacing = 8
  ;['되돌리기', '지우기'].forEach((n) => btns.appendChild(krTrailingBtn(ctx, n)))
  c.appendChild(btns)
  return c
}
// 주소 자동완성 — 입력 + 제안 리스트
function renderKrAutocomplete(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const { c, addField } = inputShell(ctx, '주소', false)
  const row = fieldRow(ctx, null, null, false)
  const val = boundText(ctx, '도로명, 지번, 건물명으로 검색', 15, 'color/secondary', MUTED)
  val.name = 'Value'
  val.layoutGrow = 1
  row.appendChild(val)
  const si = iconInstance('_Icon/Search', 'Icon', 18)
  recolorIcon(si, SUB)
  row.appendChild(si)
  addField(row)
  const panel = figma.createFrame()
  panel.name = 'panel'
  panel.layoutMode = 'VERTICAL'
  panel.primaryAxisSizingMode = 'AUTO'
  panel.counterAxisSizingMode = 'FIXED'
  panel.layoutAlign = 'STRETCH'
  panel.resize(FIELD_W, panel.height)
  panel.itemSpacing = 2
  panel.paddingTop = panel.paddingBottom = 6
  panel.cornerRadius = 10
  bindFillVar(ctx, panel, 'color/bg', WHITE)
  bindStrokeVar(ctx, panel, 'color/border', BORDER)
  panel.strokeWeight = 1
  panel.strokeAlign = 'INSIDE'
  const addr: Array<[string, string]> = [
    ['서울 강남구 테헤란로 152', '06236 · 지번 서울 강남구 역삼동 737'],
    ['서울 강남구 테헤란로 427', '06159 · 지번 서울 강남구 삼성동 159'],
  ]
  addr.forEach(([road, meta], i) => {
    const it = autoFrame('addr', 'VERTICAL')
    it.layoutAlign = 'STRETCH'
    it.primaryAxisSizingMode = 'FIXED'
    it.itemSpacing = 2
    it.paddingTop = it.paddingBottom = 9
    it.paddingLeft = it.paddingRight = 12
    if (i === 0) bindFillVar(ctx, it, 'color/bgSubtle', SURFACE)
    it.appendChild(boundText(ctx, road, 14, 'color/text', INK, true))
    it.appendChild(boundText(ctx, meta, 12, 'color/secondary', SUB))
    panel.appendChild(it)
  })
  addField(panel)
  return c
}
// 콤포지트 폼 공용 카드
function krFormCard(ctx: Ctx, title: string): { c: ComponentNode; add: (n: SceneNode) => void } {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(360, c.height)
  c.itemSpacing = 14
  c.paddingTop = c.paddingBottom = 24
  c.paddingLeft = c.paddingRight = 20
  c.cornerRadius = 14
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  const t = boundText(ctx, title, 17, 'color/text', INK, true)
  t.name = 'Title'
  c.appendChild(t)
  return { c, add: (n) => c.appendChild(n) }
}
function krPrimaryBtn(ctx: Ctx, label: string): FrameNode {
  const b = autoFrame('submit', 'HORIZONTAL')
  b.layoutAlign = 'STRETCH'
  b.primaryAxisSizingMode = 'FIXED'
  b.primaryAxisAlignItems = 'CENTER'
  b.counterAxisAlignItems = 'CENTER'
  b.paddingTop = b.paddingBottom = 12
  b.cornerRadius = 8
  bindFillVar(ctx, b, 'color/primary', ACCENT)
  const t = boundText(ctx, label, 15, 'color/bg', WHITE, true)
  t.name = 'Submit'
  b.appendChild(t)
  return b
}
function renderKrCardForm(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const { c, add } = krFormCard(ctx, '카드 등록')
  add(krSubField(ctx, { label: '카드번호', ph: '0000-0000-0000-0000' }))
  const two = autoFrame('two', 'HORIZONTAL')
  two.layoutAlign = 'STRETCH'
  two.primaryAxisSizingMode = 'FIXED'
  two.itemSpacing = 12
  const exp = krSubField(ctx, { label: '유효기간', ph: 'MM/YY' })
  exp.layoutGrow = 1
  const cvc = krSubField(ctx, { label: 'CVC', ph: '●●●', trailing: 'eye' })
  cvc.layoutGrow = 1
  two.appendChild(exp)
  two.appendChild(cvc)
  add(two)
  add(krSubField(ctx, { label: '소유자명', ph: '카드에 표기된 이름' }))
  add(krPrimaryBtn(ctx, '카드 등록'))
  return c
}
function renderKrAddressForm(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const { c, add } = krFormCard(ctx, '배송지 주소')
  add(krSubField(ctx, { label: '우편번호', ph: '00000', trailing: '우편번호 조회' }))
  add(krSubField(ctx, { label: '도로명 주소', ph: '우편번호 조회 후 자동 입력됩니다' }))
  add(krSubField(ctx, { label: '상세주소', ph: '동/호수 등 상세주소 입력' }))
  add(krSubField(ctx, { label: '배송 요청사항', ph: '선택해주세요', trailing: 'chevron' }))
  return c
}
function renderKrPhoneAuth(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const { c, add } = krFormCard(ctx, '휴대폰 본인인증')
  add(renderKrStepInline(ctx))
  add(krSubField(ctx, { label: '이름', ph: '홍길동' }))
  add(krSubField(ctx, { label: '휴대폰 번호', ph: '010-0000-0000' }))
  add(krSubField(ctx, { label: '인증번호', ph: '6자리 숫자', trailing: '03:00' }))
  add(krPrimaryBtn(ctx, '인증 확인'))
  return c
}
function renderKrIdentity(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const { c, add } = krFormCard(ctx, '본인인증')
  add(renderKrStepInline(ctx))
  const note = boundText(ctx, '본인인증 수단을 선택하세요.', 14, 'color/secondary', SUB)
  note.layoutAlign = 'STRETCH'
  add(note)
  add(krSubField(ctx, { label: '인증 수단', ph: '휴대폰(PASS)', trailing: 'chevron' }))
  add(krPrimaryBtn(ctx, '계속'))
  return c
}
function renderKrCertAuth(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const { c, add } = krFormCard(ctx, '인증서 인증')
  const certs: Array<[string, string, boolean]> = [
    ['개인 · 홍길동', '2026-12-31', false],
    ['금융 · 홍길동', '2025-01-01 (만료)', true],
  ]
  certs.forEach(([name, exp, expired], i) => {
    const r = autoFrame('cert', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'CENTER'
    r.primaryAxisAlignItems = 'SPACE_BETWEEN'
    r.paddingTop = r.paddingBottom = 12
    r.paddingLeft = r.paddingRight = 14
    r.cornerRadius = 10
    if (expired) r.opacity = 0.5
    bindFillVar(ctx, r, i === 0 ? 'color/bgSubtle' : 'color/bg', i === 0 ? SURFACE : WHITE)
    bindStrokeVar(ctx, r, i === 0 ? 'color/primary' : 'color/border', i === 0 ? ACCENT : BORDER)
    r.strokeWeight = 1
    r.strokeAlign = 'INSIDE'
    const col = autoFrame('c', 'VERTICAL')
    col.itemSpacing = 2
    col.appendChild(boundText(ctx, name, 14, 'color/text', INK, true))
    col.appendChild(boundText(ctx, '만료 ' + exp, 12, 'color/secondary', SUB))
    r.appendChild(col)
    add(r)
  })
  add(krPrimaryBtn(ctx, '다음'))
  return c
}
// 콤포지트 내부용 스텝(프레임)
function renderKrStepInline(ctx: Ctx): FrameNode {
  const steps = ['정보 입력', '인증번호', '완료']
  const current = 1
  const wrap = autoFrame('steps', 'HORIZONTAL')
  wrap.layoutAlign = 'STRETCH'
  wrap.primaryAxisSizingMode = 'FIXED'
  wrap.primaryAxisAlignItems = 'CENTER'
  wrap.counterAxisAlignItems = 'CENTER'
  wrap.itemSpacing = 6
  steps.forEach((s, i) => {
    if (i > 0) {
      const line = figma.createRectangle()
      line.resize(20, 2)
      bindFillVar(ctx, line, 'color/border', BORDER)
      wrap.appendChild(line)
    }
    const item = autoFrame('step', 'HORIZONTAL')
    item.counterAxisAlignItems = 'CENTER'
    item.itemSpacing = 5
    const done = i < current
    const active = i === current
    const marker = figma.createFrame()
    marker.layoutMode = 'HORIZONTAL'
    marker.primaryAxisSizingMode = 'FIXED'
    marker.counterAxisSizingMode = 'FIXED'
    marker.resize(20, 20)
    marker.primaryAxisAlignItems = 'CENTER'
    marker.counterAxisAlignItems = 'CENTER'
    marker.cornerRadius = 999
    bindFillVar(ctx, marker, done || active ? 'color/primary' : 'color/bgSubtle', done || active ? ACCENT : SURFACE)
    marker.appendChild(txt(ctx, String(i + 1), 11, done || active ? WHITE : MUTED, true))
    item.appendChild(marker)
    item.appendChild(boundText(ctx, s, 12, active ? 'color/text' : 'color/secondary', active ? INK : SUB, active))
    wrap.appendChild(item)
  })
  return wrap
}

// ══ TEMPLATES (페이지 예시 — 컴포넌트 조합) ══════════════════════════
function tplBlock(ctx: Ctx, label: string, h: number, grow = false): FrameNode {
  const f = figma.createFrame()
  f.name = 'block/' + label
  f.layoutMode = 'HORIZONTAL'
  f.primaryAxisSizingMode = 'FIXED'
  f.counterAxisSizingMode = 'FIXED'
  f.resize(120, h)
  if (grow) f.layoutGrow = 1
  else f.layoutAlign = 'STRETCH'
  f.primaryAxisAlignItems = 'CENTER'
  f.counterAxisAlignItems = 'CENTER'
  f.cornerRadius = 8
  bindFillVar(ctx, f, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, f, 'color/border', BORDER)
  f.strokeWeight = 1
  f.strokeAlign = 'INSIDE'
  f.dashPattern = [4, 4]
  f.appendChild(boundText(ctx, label, 12, 'color/tertiary', MUTED))
  return f
}
function tplBar(ctx: Ctx, title: string, items: string[]): FrameNode {
  const bar = autoFrame('bar', 'HORIZONTAL')
  bar.layoutAlign = 'STRETCH'
  bar.primaryAxisSizingMode = 'FIXED'
  bar.counterAxisAlignItems = 'CENTER'
  bar.primaryAxisAlignItems = 'SPACE_BETWEEN'
  bar.paddingTop = bar.paddingBottom = 14
  bar.paddingLeft = bar.paddingRight = 20
  bindFillVar(ctx, bar, 'color/bg', WHITE)
  bindStrokeVar(ctx, bar, 'color/border', BORDER)
  bar.strokeAlign = 'INSIDE'
  bar.strokeTopWeight = bar.strokeLeftWeight = bar.strokeRightWeight = 0
  bar.strokeBottomWeight = 1
  bar.appendChild(boundText(ctx, title, 15, 'color/text', INK, true))
  const nav = autoFrame('nav', 'HORIZONTAL')
  nav.itemSpacing = 16
  items.forEach((it, i) => nav.appendChild(boundText(ctx, it, 13, i === 0 ? 'color/text' : 'color/secondary', i === 0 ? INK : SUB, i === 0)))
  bar.appendChild(nav)
  return bar
}
function tplShell(ctx: Ctx, w: number): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 12
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  return c
}
function renderTplAdminShell(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = tplShell(ctx, 640)
  c.appendChild(tplBar(ctx, 'DS Admin', ['대시보드', '사용자', '설정']))
  const body = autoFrame('body', 'HORIZONTAL')
  body.layoutAlign = 'STRETCH'
  body.primaryAxisSizingMode = 'FIXED'
  body.itemSpacing = 0
  const side = tplBlock(ctx, 'Sidebar', 300)
  side.resize(180, 300)
  side.layoutAlign = 'INHERIT'
  side.dashPattern = []
  body.appendChild(side)
  const main = tplBlock(ctx, 'Main content', 300, true)
  main.dashPattern = []
  bindFillVar(ctx, main, 'color/bg', WHITE)
  body.appendChild(main)
  c.appendChild(body)
  return c
}
function renderTplDashboard(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = tplShell(ctx, 720)
  c.appendChild(tplBar(ctx, 'DS Admin', ['대시보드', '사용자', '설정']))
  const body = autoFrame('body', 'HORIZONTAL')
  body.layoutAlign = 'STRETCH'
  body.primaryAxisSizingMode = 'FIXED'
  const side = tplBlock(ctx, 'Sidebar', 420)
  side.resize(180, 420)
  side.layoutAlign = 'INHERIT'
  side.dashPattern = []
  body.appendChild(side)
  const main = autoFrame('main', 'VERTICAL')
  main.layoutGrow = 1
  main.primaryAxisSizingMode = 'FIXED'
  main.itemSpacing = 14
  main.paddingTop = main.paddingBottom = 20
  main.paddingLeft = main.paddingRight = 20
  main.appendChild(boundText(ctx, '대시보드', 20, 'color/text', INK, true))
  const kpi = autoFrame('kpi', 'HORIZONTAL')
  kpi.layoutAlign = 'STRETCH'
  kpi.primaryAxisSizingMode = 'FIXED'
  kpi.itemSpacing = 12
  ;['월 매출', '신규 가입', '이탈률'].forEach((k) => kpi.appendChild(tplBlock(ctx, k, 72, true)))
  main.appendChild(kpi)
  const charts = autoFrame('charts', 'HORIZONTAL')
  charts.layoutAlign = 'STRETCH'
  charts.primaryAxisSizingMode = 'FIXED'
  charts.itemSpacing = 12
  charts.appendChild(tplBlock(ctx, 'Chart · Revenue', 120, true))
  charts.appendChild(tplBlock(ctx, 'Chart · Share', 120, true))
  main.appendChild(charts)
  main.appendChild(tplBlock(ctx, 'Table · 최근 가입 사용자', 120))
  body.appendChild(main)
  c.appendChild(body)
  return c
}
function renderTplListPage(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = tplShell(ctx, 640)
  const head = autoFrame('head', 'HORIZONTAL')
  head.layoutAlign = 'STRETCH'
  head.primaryAxisSizingMode = 'FIXED'
  head.counterAxisAlignItems = 'CENTER'
  head.primaryAxisAlignItems = 'SPACE_BETWEEN'
  head.paddingTop = head.paddingBottom = 18
  head.paddingLeft = head.paddingRight = 20
  head.appendChild(boundText(ctx, '사용자 관리', 20, 'color/text', INK, true))
  head.appendChild(krPrimaryBtn(ctx, '사용자 추가'))
  c.appendChild(head)
  const body = autoFrame('body', 'VERTICAL')
  body.layoutAlign = 'STRETCH'
  body.primaryAxisSizingMode = 'FIXED'
  body.itemSpacing = 12
  body.paddingLeft = body.paddingRight = 20
  body.paddingBottom = 20
  const filter = autoFrame('filter', 'HORIZONTAL')
  filter.layoutAlign = 'STRETCH'
  filter.primaryAxisSizingMode = 'FIXED'
  filter.itemSpacing = 8
  filter.appendChild(tplBlock(ctx, 'Search', 40, true))
  filter.appendChild(tplBlock(ctx, 'Status', 40))
  filter.appendChild(tplBlock(ctx, 'Role', 40))
  body.appendChild(filter)
  body.appendChild(tplBlock(ctx, 'Table', 160))
  body.appendChild(tplBlock(ctx, 'Pagination', 40))
  c.appendChild(body)
  return c
}
function renderTplSettings(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const { c, add } = krFormCard(ctx, '설정')
  c.resize(420, c.height)
  const sec = (title: string, rows: FrameNode[]) => {
    const s = autoFrame('section/' + title, 'VERTICAL')
    s.layoutAlign = 'STRETCH'
    s.itemSpacing = 12
    s.paddingTop = s.paddingBottom = 16
    s.paddingLeft = s.paddingRight = 16
    s.cornerRadius = 12
    bindFillVar(ctx, s, 'color/bgSubtle', SURFACE)
    s.appendChild(boundText(ctx, title, 15, 'color/text', INK, true))
    rows.forEach((r) => s.appendChild(r))
    add(s)
  }
  sec('프로필', [krSubField(ctx, { label: '이름', ph: '홍길동' }), krSubField(ctx, { label: '이메일', ph: 'name@example.com' })])
  const toggleRow = (label: string, on: boolean) => {
    const r = autoFrame('toggle', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'CENTER'
    r.primaryAxisAlignItems = 'SPACE_BETWEEN'
    r.appendChild(boundText(ctx, label, 14, 'color/text', INK))
    const tr = figma.createFrame()
    tr.layoutMode = 'HORIZONTAL'
    tr.primaryAxisSizingMode = 'FIXED'
    tr.counterAxisSizingMode = 'FIXED'
    tr.resize(40, 24)
    tr.primaryAxisAlignItems = on ? 'MAX' : 'MIN'
    tr.counterAxisAlignItems = 'CENTER'
    tr.paddingLeft = tr.paddingRight = 3
    tr.cornerRadius = 12
    bindFillVar(ctx, tr, on ? 'color/primary' : 'color/border', on ? ACCENT : BORDER)
    const kn = figma.createEllipse()
    kn.resize(18, 18)
    kn.fills = [solid(WHITE)]
    tr.appendChild(kn)
    r.appendChild(tr)
    return r
  }
  sec('알림', [toggleRow('이메일 알림', true), toggleRow('푸시 알림', false), toggleRow('마케팅 수신', false)])
  add(krPrimaryBtn(ctx, '변경사항 저장'))
  return c
}
function renderTplLogin(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const { c, add } = krFormCard(ctx, 'DS 서비스')
  const sub = boundText(ctx, '계정에 로그인하세요.', 14, 'color/secondary', SUB)
  add(sub)
  add(krSubField(ctx, { label: '이메일', ph: 'name@example.com' }))
  add(krSubField(ctx, { label: '비밀번호', ph: '••••••••', trailing: 'eye' }))
  add(krPrimaryBtn(ctx, '로그인'))
  const social = autoFrame('social', 'VERTICAL')
  social.layoutAlign = 'STRETCH'
  social.itemSpacing = 8
  ;[['카카오 로그인', '#FEE500', '#191919'], ['Google로 로그인', '#FFFFFF', '#1F1F1F'], ['네이버 로그인', '#03C75A', '#FFFFFF']].forEach(([label, bg, fg]) => {
    const b = autoFrame('social-btn', 'HORIZONTAL')
    b.layoutAlign = 'STRETCH'
    b.primaryAxisSizingMode = 'FIXED'
    b.primaryAxisAlignItems = 'CENTER'
    b.counterAxisAlignItems = 'CENTER'
    b.paddingTop = b.paddingBottom = 11
    b.cornerRadius = 8
    b.fills = [solid(bg)]
    if (bg === '#FFFFFF') {
      b.strokes = [solid('#DADCE0')]
      b.strokeWeight = 1
    }
    b.appendChild(txt(ctx, label, 14, fg, true))
    social.appendChild(b)
  })
  add(social)
  return c
}
function renderTplEmptyState(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(360, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 12
  c.paddingTop = c.paddingBottom = 44
  c.paddingLeft = c.paddingRight = 24
  bindFillVar(ctx, c, 'color/bg', WHITE)
  const icon = iconInstance('_Icon/Package', 'Icon', 40)
  recolorIcon(icon, MUTED)
  c.appendChild(icon)
  const t = boundText(ctx, '데이터가 없습니다', 17, 'color/text', INK, true)
  t.name = 'Title'
  c.appendChild(t)
  const d = boundText(ctx, '새 항목을 추가해 시작하세요.', 14, 'color/secondary', SUB)
  d.name = 'Body'
  d.textAlignHorizontal = 'CENTER'
  c.appendChild(d)
  const b = autoFrame('action', 'HORIZONTAL')
  b.counterAxisAlignItems = 'CENTER'
  b.paddingTop = b.paddingBottom = 9
  b.paddingLeft = b.paddingRight = 16
  b.cornerRadius = 8
  bindFillVar(ctx, b, 'color/primary', ACCENT)
  const bt = boundText(ctx, '추가하기', 14, 'color/bg', WHITE, true)
  bt.name = 'Action'
  b.appendChild(bt)
  c.appendChild(b)
  return c
}
function renderTplFilterBar(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'AUTO'
  c.resize(560, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 8
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = 12
  c.cornerRadius = 12
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  const search = fieldRow(ctx, null, null, false)
  search.layoutGrow = 1
  const sv = boundText(ctx, '이름 검색', 14, 'color/secondary', MUTED)
  sv.layoutGrow = 1
  search.appendChild(sv)
  const si = iconInstance('_Icon/Search', 'Icon', 18)
  recolorIcon(si, SUB)
  search.appendChild(si)
  c.appendChild(search)
  ;['상태', '역할'].forEach((s) => {
    const sel = fieldRow(ctx, null, null, false)
    sel.resize(120, sel.height)
    sel.primaryAxisSizingMode = 'FIXED'
    sel.layoutGrow = 0
    const t = boundText(ctx, s, 14, 'color/secondary', MUTED)
    t.layoutGrow = 1
    sel.appendChild(t)
    const ch = iconInstance('_Icon/ChevronDown', 'Icon', 16)
    recolorIcon(ch, SUB)
    sel.appendChild(ch)
    c.appendChild(sel)
  })
  c.appendChild(krTrailingBtn(ctx, '초기화'))
  return c
}

// ══ Storybook-only 백필: Autocomplete · FileUpload · ImageUpload ═════
function renderAutocomplete(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const disabled = combo.state === 'disabled'
  const { c, addField } = inputShell(ctx, '검색', disabled)
  const row = fieldRow(ctx, null, null, disabled)
  const val = boundText(ctx, '검색어를 입력하세요', 15, 'color/secondary', MUTED)
  val.name = 'Value'
  val.layoutGrow = 1
  row.appendChild(val)
  const si = iconInstance('_Icon/Search', 'Icon', 18)
  recolorIcon(si, SUB)
  row.appendChild(si)
  addField(row)
  if (!disabled) addField(optionPanel(ctx, [['서울특별시', false], ['서울대입구역', false], ['서울숲', false]], false))
  return c
}
function dropzone(ctx: Ctx, prompt: string, hint: string, disabled: boolean): FrameNode {
  const z = autoFrame('dropzone', 'VERTICAL')
  z.layoutAlign = 'STRETCH'
  z.primaryAxisSizingMode = 'FIXED'
  z.counterAxisAlignItems = 'CENTER'
  z.primaryAxisAlignItems = 'CENTER'
  z.itemSpacing = 6
  z.paddingTop = z.paddingBottom = 24
  z.cornerRadius = 10
  bindFillVar(ctx, z, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, z, 'color/border', BORDER)
  z.strokeWeight = 1
  z.dashPattern = [6, 6]
  if (disabled) z.opacity = 0.45
  const ic = iconInstance('_Icon/Upload', 'Icon', 22)
  recolorIcon(ic, SUB)
  z.appendChild(ic)
  const p = boundText(ctx, prompt, 14, 'color/text', INK, true)
  p.name = 'Prompt'
  z.appendChild(p)
  const h = boundText(ctx, hint, 12, 'color/secondary', SUB)
  h.name = 'Hint'
  z.appendChild(h)
  return z
}
function renderFileUpload(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const disabled = combo.state === 'disabled'
  const { c, addField } = inputShell(ctx, '첨부 파일', disabled)
  addField(dropzone(ctx, '파일을 끌어다 놓거나 클릭', 'PDF, PNG · 최대 10MB', disabled))
  ;[['기획서.pdf', '1.2MB'], ['디자인.png', '820KB']].forEach(([name, size]) => {
    const r = autoFrame('file', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'CENTER'
    r.itemSpacing = 8
    r.paddingTop = r.paddingBottom = 8
    r.paddingLeft = r.paddingRight = 10
    r.cornerRadius = 8
    bindStrokeVar(ctx, r, 'color/border', BORDER)
    r.strokeWeight = 1
    r.strokeAlign = 'INSIDE'
    const fi = iconInstance('_Icon/File', 'Icon', 16)
    recolorIcon(fi, SUB)
    r.appendChild(fi)
    const t = boundText(ctx, name, 13, 'color/text', INK)
    t.layoutGrow = 1
    r.appendChild(t)
    r.appendChild(boundText(ctx, size, 12, 'color/tertiary', MUTED))
    const x = iconInstance('_Icon/Close', 'Remove', 14)
    recolorIcon(x, SUB)
    r.appendChild(x)
    addField(r)
  })
  return c
}
function renderImageUpload(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const disabled = combo.state === 'disabled'
  const { c, addField } = inputShell(ctx, '이미지', disabled)
  const grid = figma.createFrame()
  grid.name = 'grid'
  grid.layoutMode = 'HORIZONTAL'
  grid.layoutWrap = 'WRAP'
  grid.primaryAxisSizingMode = 'FIXED'
  grid.counterAxisSizingMode = 'AUTO'
  grid.layoutAlign = 'STRETCH'
  grid.itemSpacing = 8
  grid.counterAxisSpacing = 8
  grid.fills = []
  grid.resize(FIELD_W, grid.height)
  if (disabled) grid.opacity = 0.45
  for (let i = 0; i < 3; i++) {
    const th = figma.createFrame()
    th.name = 'thumb'
    th.resize(72, 72)
    th.cornerRadius = 8
    bindFillVar(ctx, th, 'color/bgSubtle', SURFACE)
    grid.appendChild(th)
  }
  const add = autoFrame('add', 'VERTICAL')
  add.primaryAxisSizingMode = 'FIXED'
  add.counterAxisSizingMode = 'FIXED'
  add.resize(72, 72)
  add.primaryAxisAlignItems = 'CENTER'
  add.counterAxisAlignItems = 'CENTER'
  add.cornerRadius = 8
  bindStrokeVar(ctx, add, 'color/border', BORDER)
  add.strokeWeight = 1
  add.dashPattern = [6, 6]
  add.fills = []
  const pl = iconInstance('_Icon/Plus', 'Icon', 20)
  recolorIcon(pl, SUB)
  add.appendChild(pl)
  grid.appendChild(add)
  addField(grid)
  return c
}

// ══ MEDIA (Image · Video · YouTube · ImageCard · ImageSlide) ═════════
function imgBox(ctx: Ctx, w: number, h: number, iconSize = 36): FrameNode {
  const f = figma.createFrame()
  f.name = 'image'
  f.layoutMode = 'HORIZONTAL'
  f.primaryAxisSizingMode = 'FIXED'
  f.counterAxisSizingMode = 'FIXED'
  f.resize(w, h)
  f.primaryAxisAlignItems = 'CENTER'
  f.counterAxisAlignItems = 'CENTER'
  f.clipsContent = true
  bindFillVar(ctx, f, 'color/bgSubtle', SURFACE)
  const ic = iconInstance('_Icon/Image', 'Icon', iconSize)
  recolorIcon(ic, MUTED)
  f.appendChild(ic)
  return f
}
function playButton(ctx: Ctx, yt = false): FrameNode {
  const b = figma.createFrame()
  b.name = 'play'
  b.layoutMode = 'HORIZONTAL'
  b.primaryAxisSizingMode = 'FIXED'
  b.counterAxisSizingMode = 'FIXED'
  b.resize(yt ? 62 : 56, yt ? 44 : 56)
  b.primaryAxisAlignItems = 'CENTER'
  b.counterAxisAlignItems = 'CENTER'
  b.cornerRadius = yt ? 12 : 999
  b.fills = [{ type: 'SOLID', color: yt ? { r: 1, g: 0, b: 0 } : { r: 1, g: 1, b: 1 }, opacity: yt ? 1 : 0.92 }]
  const tri = figma.createVector()
  tri.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 0 L14 8 L0 16 Z' }]
  tri.fills = [{ type: 'SOLID', color: yt ? { r: 1, g: 1, b: 1 } : { r: 0.1, g: 0.12, b: 0.16 } }]
  tri.strokes = []
  b.appendChild(tri)
  return b
}
function renderImage(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const ratio = combo.ratio || '16x9'
  const w = 280
  const h = ratio === '1x1' ? 280 : ratio === '4x3' ? 210 : 158
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, h)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.cornerRadius = combo.rounded === 'false' ? 0 : 12
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bgSubtle', SURFACE)
  const ic = iconInstance('_Icon/Image', 'Icon', 40)
  recolorIcon(ic, MUTED)
  c.appendChild(ic)
  return c
}
function renderVideo(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(320, 180)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.cornerRadius = 12
  c.clipsContent = true
  c.fills = [solid('#1A1F28')]
  c.appendChild(playButton(ctx))
  return c
}
function renderYouTube(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(320, 180)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.cornerRadius = 12
  c.clipsContent = true
  c.fills = [solid('#0F0F0F')]
  c.appendChild(playButton(ctx, true))
  return c
}
function renderImageCard(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(280, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 12
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  const img = imgBox(ctx, 280, 158)
  img.layoutAlign = 'STRETCH'
  c.appendChild(img)
  const body = autoFrame('body', 'VERTICAL')
  body.layoutAlign = 'STRETCH'
  body.itemSpacing = 4
  body.paddingTop = body.paddingBottom = 16
  body.paddingLeft = body.paddingRight = 16
  const t = boundText(ctx, '이미지 카드', 16, 'color/text', INK, true)
  t.name = 'Title'
  body.appendChild(t)
  const d = boundText(ctx, '이미지 위에 제목과 설명이 붙는 카드입니다.', 13, 'color/secondary', SUB)
  d.name = 'Body'
  d.layoutAlign = 'STRETCH'
  d.textAutoResize = 'HEIGHT'
  body.appendChild(d)
  c.appendChild(body)
  return c
}
function renderImageSlide(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 12
  c.fills = []
  const stage = autoFrame('stage', 'HORIZONTAL')
  stage.counterAxisAlignItems = 'CENTER'
  stage.itemSpacing = 12
  stage.appendChild(circleBtn(ctx, '_Icon/ChevronLeft', 'Prev', 36))
  const slide = imgBox(ctx, 300, 169, 40)
  slide.cornerRadius = 12
  const lbl = boundText(ctx, '1 / 3', 13, 'color/secondary', SUB, true)
  lbl.name = 'Counter'
  slide.appendChild(lbl)
  slide.itemSpacing = 8
  stage.appendChild(slide)
  stage.appendChild(circleBtn(ctx, '_Icon/ChevronRight', 'Next', 36))
  c.appendChild(stage)
  const dots = autoFrame('dots', 'HORIZONTAL')
  dots.counterAxisAlignItems = 'CENTER'
  dots.itemSpacing = 6
  for (let i = 0; i < 3; i++) {
    const d = figma.createFrame()
    d.resize(i === 0 ? 18 : 8, 8)
    d.cornerRadius = 999
    bindFillVar(ctx, d, i === 0 ? 'color/primary' : 'color/border', i === 0 ? ACCENT : BORDER)
    dots.appendChild(d)
  }
  c.appendChild(dots)
  return c
}

// ══ FORM (라벨 필드 + 동의 + 제출 폼) ════════════════════════════════
function renderForm(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const { c, add } = krFormCard(ctx, '문의하기')
  add(krSubField(ctx, { label: '이름', ph: '홍길동' }))
  add(krSubField(ctx, { label: '이메일', ph: 'name@example.com' }))
  add(krSubField(ctx, { label: '메시지', ph: '내용을 입력하세요' }))
  const agree = autoFrame('agree', 'HORIZONTAL')
  agree.layoutAlign = 'STRETCH'
  agree.counterAxisAlignItems = 'CENTER'
  agree.itemSpacing = 8
  const box = figma.createFrame()
  box.name = 'box'
  box.layoutMode = 'HORIZONTAL'
  box.primaryAxisSizingMode = 'FIXED'
  box.counterAxisSizingMode = 'FIXED'
  box.resize(18, 18)
  box.primaryAxisAlignItems = 'CENTER'
  box.counterAxisAlignItems = 'CENTER'
  box.cornerRadius = 5
  bindFillVar(ctx, box, 'color/primary', ACCENT)
  const ck = iconInstance('_Icon/Check', 'check', 13)
  recolorIcon(ck, WHITE)
  box.appendChild(ck)
  agree.appendChild(box)
  agree.appendChild(boundText(ctx, '개인정보 수집에 동의합니다', 13, 'color/secondary', SUB))
  add(agree)
  add(krPrimaryBtn(ctx, '보내기'))
  return c
}

// ══ 신규 아톰 (Rating · Skeleton · AvatarGroup · Callout · Kbd) ══════
function renderRating(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const value = parseInt(combo.value || '4', 10)
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 4
  c.fills = []
  for (let i = 0; i < 5; i++) {
    const s = iconInstance('_Icon/Star', 'star', 22)
    recolorIcon(s, i < value ? '#F59E0B' : BORDER)
    c.appendChild(s)
  }
  return c
}
function renderSkeleton(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const variant = combo.variant || 'text'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(280, c.height)
  c.itemSpacing = 10
  c.fills = []
  const bar = (w: number, h: number, round = 6) => {
    const f = figma.createFrame()
    f.name = 'sk'
    f.resize(w, h)
    f.cornerRadius = round
    bindFillVar(ctx, f, 'color/bgSubtle', SURFACE)
    return f
  }
  if (variant === 'circle') {
    const cc = bar(56, 56, 999)
    c.appendChild(cc)
  } else if (variant === 'block') {
    const b = bar(280, 120, 10)
    b.layoutAlign = 'STRETCH'
    c.appendChild(b)
  } else {
    ;[280, 280, 168].forEach((w) => {
      const b = bar(w, 12)
      if (w === 280) b.layoutAlign = 'STRETCH'
      c.appendChild(b)
    })
  }
  return c
}
function renderAvatarGroup(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = -10 // 겹침
  c.fills = []
  const chip = (text: string, muted: boolean) => {
    const a = figma.createFrame()
    a.name = 'avatar'
    a.layoutMode = 'HORIZONTAL'
    a.primaryAxisSizingMode = 'FIXED'
    a.counterAxisSizingMode = 'FIXED'
    a.resize(36, 36)
    a.primaryAxisAlignItems = 'CENTER'
    a.counterAxisAlignItems = 'CENTER'
    a.cornerRadius = 999
    bindFillVar(ctx, a, muted ? 'color/bgSubtle' : 'color/primary', muted ? SURFACE : ACCENT)
    a.strokes = [solid(WHITE)]
    a.strokeWeight = 2
    a.appendChild(boundText(ctx, text, 13, muted ? 'color/secondary' : 'color/bg', muted ? SUB : WHITE, true))
    return a
  }
  ;['김', '이', '박'].forEach((n) => c.appendChild(chip(n, false)))
  c.appendChild(chip('+2', true))
  return c
}
function renderCallout(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const tone = combo.tone || 'info'
  const map: Record<string, [string, string, string, string]> = {
    info: ['color/primary', ACCENT, '#EEF4FF', '_Icon/Info'],
    success: ['color/success', '#00C471', '#E6F8F0', '_Icon/Check'],
    warning: ['color/warning', '#F59E0B', '#FEF3E2', '_Icon/Warning'],
    error: ['color/error', '#F04452', '#FEECEE', '_Icon/AlertCircle'],
  }
  const [tvar, thex, tint, icon] = map[tone] || map.info
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'AUTO'
  c.resize(340, c.height)
  c.counterAxisAlignItems = 'MIN'
  c.itemSpacing = 10
  c.paddingTop = c.paddingBottom = 14
  c.paddingLeft = 14
  c.paddingRight = 16
  c.cornerRadius = 10
  c.fills = [solid(tint)]
  bindStrokeVar(ctx, c, tvar, thex)
  c.strokeAlign = 'INSIDE'
  c.strokeTopWeight = c.strokeRightWeight = c.strokeBottomWeight = 0
  c.strokeLeftWeight = 3
  const ic = iconInstance(icon, 'Icon', 18)
  recolorIcon(ic, thex)
  c.appendChild(ic)
  const col = autoFrame('text', 'VERTICAL')
  col.layoutGrow = 1
  col.itemSpacing = 3
  const t = boundText(ctx, '안내 제목', 14, 'color/text', INK, true)
  t.name = 'Title'
  col.appendChild(t)
  const b = boundText(ctx, '강조해서 보여줄 안내 문구를 담습니다.', 13, 'color/secondary', SUB)
  b.name = 'Body'
  b.layoutAlign = 'STRETCH'
  b.textAutoResize = 'HEIGHT'
  col.appendChild(b)
  c.appendChild(col)
  return c
}
function renderKbd(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 5
  c.fills = []
  ;['⌘', 'K'].forEach((k) => {
    const cap = autoFrame('key', 'HORIZONTAL')
    cap.primaryAxisAlignItems = 'CENTER'
    cap.counterAxisAlignItems = 'CENTER'
    cap.paddingTop = cap.paddingBottom = 3
    cap.paddingLeft = cap.paddingRight = 8
    cap.cornerRadius = 6
    bindFillVar(ctx, cap, 'color/bg', WHITE)
    bindStrokeVar(ctx, cap, 'color/border', BORDER)
    cap.strokeWeight = 1
    cap.strokeAlign = 'INSIDE'
    cap.effects = [{ type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.12 }, offset: { x: 0, y: 1 }, radius: 0, spread: 0, visible: true, blendMode: 'NORMAL' }]
    cap.appendChild(boundText(ctx, k, 13, 'color/secondary', SUB, true))
    c.appendChild(cap)
  })
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
      build: (ctx, page) => buildSet(ctx, page, 'DS/Select', [{ name: 'open', values: ['false', 'true'] }, { name: 'error', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderSelect(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '카테고리' }, { prop: 'Value', layer: 'Value', def: '선택하세요' }, { prop: 'Helper', layer: 'Helper', def: '하나를 선택하세요.' }], swaps: [{ prop: 'Icon', layer: 'Icon', defKey: '_Icon/ChevronDown' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Open', props: { open: 'true' } }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'MultiSelect',
      setName: 'DS/MultiSelect',
      eyebrow: 'ORGANISM · INPUT',
      desc: '여러 항목을 칩으로 선택하는 다중 선택.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/MultiSelect', [{ name: 'open', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderMultiSelect(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '기술 스택' }], swaps: [{ prop: 'Icon', layer: 'Icon', defKey: '_Icon/ChevronDown' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Open', props: { open: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Slider',
      setName: 'DS/Slider',
      eyebrow: 'MOLECULE · INPUT',
      desc: '드래그로 수치를 조절하는 슬라이더.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Slider', [{ name: 'value', values: ['0', '50', '100'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderSlider(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '볼륨' }, { prop: 'Value', layer: 'Value', def: '50%' }] }),
      states: [{ caption: 'Min', props: { value: '0' } }, { caption: 'Mid', props: { value: '50' } }, { caption: 'Max', props: { value: '100' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Upload',
      setName: 'DS/Upload',
      eyebrow: 'ORGANISM · INPUT',
      desc: '클릭/드래그로 파일을 올리는 드롭존.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Upload', [{ name: 'disabled', values: ['false', 'true'] }], (c) => renderUpload(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '첨부 파일' }, { prop: 'Prompt', layer: 'Prompt', def: '파일을 끌어다 놓거나 클릭' }, { prop: 'Hint', layer: 'Hint', def: 'PDF, PNG · 최대 10MB' }], swaps: [{ prop: 'Icon', layer: 'Icon', defKey: '_Icon/Upload' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Autocomplete',
      setName: 'DS/Autocomplete',
      eyebrow: 'MOLECULE · INPUT',
      desc: '입력 + 필터 제안 목록 자동완성.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Autocomplete', [{ name: 'state', values: ['default', 'disabled'] }], (c) => renderAutocomplete(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '검색' }, { prop: 'Value', layer: 'Value', def: '검색어를 입력하세요' }], swaps: [{ prop: 'Icon', layer: 'Icon', defKey: '_Icon/Search' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { state: 'disabled' } }],
    },
    {
      key: 'FileUpload',
      setName: 'DS/FileUpload',
      eyebrow: 'ORGANISM · INPUT',
      desc: '드롭존 + 첨부 파일 목록.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/FileUpload', [{ name: 'state', values: ['default', 'disabled'] }], (c) => renderFileUpload(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '첨부 파일' }, { prop: 'Prompt', layer: 'Prompt', def: '파일을 끌어다 놓거나 클릭' }, { prop: 'Hint', layer: 'Hint', def: 'PDF, PNG · 최대 10MB' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { state: 'disabled' } }],
    },
    {
      key: 'ImageUpload',
      setName: 'DS/ImageUpload',
      eyebrow: 'ORGANISM · INPUT',
      desc: '드롭존 + 썸네일 그리드(추가 타일).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/ImageUpload', [{ name: 'state', values: ['default', 'disabled'] }], (c) => renderImageUpload(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '이미지' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { state: 'disabled' } }],
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
      build: (ctx, page) => buildSet(ctx, page, 'DS/Toggle', [{ name: 'checked', values: ['false', 'true'] }, { name: 'size', values: ['md', 'sm'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderToggle(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '알림 받기' }] }),
      states: [{ caption: 'Off', props: {} }, { caption: 'On', props: { checked: 'true' } }, { caption: 'Small (On)', props: { checked: 'true', size: 'sm' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
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
      build: (ctx, page) => buildSet(ctx, page, 'DS/Chip', [{ name: 'selected', values: ['false', 'true'] }, { name: 'removable', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderChip(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '필터' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Selected', props: { selected: 'true' } }, { caption: 'Removable', props: { selected: 'true', removable: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
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
        buildSet(ctx, page, 'DS/Button', [{ name: 'variant', values: ['primary', 'secondary', 'error', 'success'] }, { name: 'size', values: ['md', 'sm', 'lg'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderButton(ctx, c), {
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
      states: [{ caption: 'Primary', props: { variant: 'primary' } }, { caption: 'Secondary', props: { variant: 'secondary' } }, { caption: 'Error', props: { variant: 'error' } }, { caption: 'Success', props: { variant: 'success' } }, { caption: 'Small', props: { size: 'sm' } }, { caption: 'Large', props: { size: 'lg' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Badge',
      setName: 'DS/Badge',
      eyebrow: 'ATOM · ACTION',
      desc: '상태·분류를 표시하는 배지. variant·size 축을 가집니다.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Badge', [{ name: 'variant', values: ['primary', 'secondary', 'error', 'success'] }, { name: 'size', values: ['md', 'sm'] }], (c) => renderBadge(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: 'Badge' }] }),
      states: [{ caption: 'Primary', props: { variant: 'primary' } }, { caption: 'Secondary', props: { variant: 'secondary' } }, { caption: 'Error', props: { variant: 'error' } }, { caption: 'Success', props: { variant: 'success' } }, { caption: 'Small', props: { size: 'sm' } }],
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
        buildSet(ctx, page, 'DS/Snackbar', [{ name: 'variant', values: ['default', 'success', 'error'] }, { name: 'action', values: ['false', 'true'] }], (c) => renderSnackbar(ctx, c), { texts: [{ prop: 'Message', layer: 'Message', def: '링크를 복사했어요.' }, { prop: 'Action', layer: 'Action', def: '실행 취소' }] }),
      states: [
        { caption: 'Default', props: {} },
        { caption: 'With Action', props: { action: 'true' } },
        { caption: 'Success', props: { variant: 'success' } },
        { caption: 'Error', props: { variant: 'error' } },
      ],
    },
    {
      key: 'Tooltip',
      setName: 'DS/Tooltip',
      eyebrow: 'ATOM · FEEDBACK',
      desc: '요소에 대한 짧은 도움말 말풍선.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Tooltip', [{ name: 'placement', values: ['bottom', 'top', 'left', 'right'] }], (c) => renderTooltip(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '도움말 텍스트' }] }),
      states: [
        { caption: 'Bottom', props: { placement: 'bottom' } },
        { caption: 'Top', props: { placement: 'top' } },
        { caption: 'Left', props: { placement: 'left' } },
        { caption: 'Right', props: { placement: 'right' } },
      ],
    },
    {
      key: 'Loading',
      setName: 'DS/Loading',
      eyebrow: 'ATOM · FEEDBACK',
      desc: '처리 중임을 나타내는 로딩 표시.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Loading', [{ name: 'variant', values: ['spinner', 'dots'] }, { name: 'size', values: ['md', 'sm', 'lg'] }], (c) => renderLoading(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '불러오는 중…' }] }),
      states: [
        { caption: 'Spinner', props: {} },
        { caption: 'Dots', props: { variant: 'dots' } },
        { caption: 'Small', props: { size: 'sm' } },
        { caption: 'Large', props: { size: 'lg' } },
      ],
    },
    {
      key: 'Skeleton',
      setName: 'DS/Skeleton',
      eyebrow: 'ATOM · FEEDBACK',
      desc: '로딩 자리표시 스켈레톤.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Skeleton', [{ name: 'variant', values: ['text', 'block', 'circle'] }], (c) => renderSkeleton(ctx, c)),
      states: [{ caption: 'Text', props: {} }, { caption: 'Block', props: { variant: 'block' } }, { caption: 'Circle', props: { variant: 'circle' } }],
    },
    {
      key: 'Callout',
      setName: 'DS/Callout',
      eyebrow: 'MOLECULE · FEEDBACK',
      desc: '강조 안내 블록(톤별).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Callout', [{ name: 'tone', values: ['info', 'success', 'warning', 'error'] }], (c) => renderCallout(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '안내 제목' }, { prop: 'Body', layer: 'Body', def: '강조해서 보여줄 안내 문구를 담습니다.' }] }),
      states: [{ caption: 'Info', props: {} }, { caption: 'Success', props: { tone: 'success' } }, { caption: 'Warning', props: { tone: 'warning' } }, { caption: 'Error', props: { tone: 'error' } }],
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
      build: (ctx, page) => buildSet(ctx, page, 'DS/Tab', [{ name: 'active', values: ['false', 'true'] }, { name: 'variant', values: ['underline', 'segmented'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderTab(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '메뉴' }] }),
      states: [{ caption: 'Underline (Active)', props: { active: 'true' } }, { caption: 'Underline', props: {} }, { caption: 'Segmented (Active)', props: { active: 'true', variant: 'segmented' } }, { caption: 'Segmented', props: { variant: 'segmented' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
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
      build: (ctx, page) => buildSet(ctx, page, 'DS/Accordion', [{ name: 'expanded', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderAccordion(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '섹션 제목' }, { prop: 'Body', layer: 'Body', def: '펼쳐진 본문 내용' }] }),
      states: [{ caption: 'Collapsed', props: {} }, { caption: 'Expanded', props: { expanded: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Divider',
      setName: 'DS/Divider',
      eyebrow: 'ATOM · LAYOUT',
      desc: '콘텐츠를 나누는 구분선(라벨 옵션).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Divider', [{ name: 'label', values: ['false', 'true'] }], (c) => renderDivider(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '또는' }] }),
      states: [{ caption: 'Plain', props: {} }, { caption: 'With Label', props: { label: 'true' } }],
    },
    {
      key: 'Form',
      setName: 'DS/Form',
      eyebrow: 'ORGANISM · LAYOUT',
      desc: '라벨 필드 + 동의 + 제출 버튼의 폼.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Form', [{ name: 'state', values: ['default'] }], (c) => renderForm(ctx, c)),
      states: [{ caption: 'Default', props: {} }],
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
      build: (ctx, page) => buildSet(ctx, page, 'DS/Modal', [{ name: 'size', values: ['md', 'sm', 'lg'] }], (c) => renderModal(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '모달 제목' }, { prop: 'Body', layer: 'Body', def: '모달 본문 내용' }, { prop: 'Cancel', layer: 'Cancel', def: '취소' }, { prop: 'Confirm', layer: 'Confirm', def: '확인' }], swaps: [{ prop: 'Close Icon', layer: 'Close Icon', defKey: '_Icon/Close' }] }),
      states: [{ caption: 'Medium', props: { size: 'md' } }, { caption: 'Small', props: { size: 'sm' } }, { caption: 'Large', props: { size: 'lg' } }],
    },
    {
      key: 'Dialog',
      setName: 'DS/Dialog',
      eyebrow: 'MOLECULE · OVERLAY',
      desc: '확인/취소를 묻는 간단한 다이얼로그.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Dialog', [{ name: 'variant', values: ['confirm', 'alert', 'prompt'] }, { name: 'danger', values: ['false', 'true'] }], (c) => renderDialog(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '계속하시겠어요?' }, { prop: 'Body', layer: 'Body', def: '선택한 작업을 진행합니다.' }, { prop: 'Cancel', layer: 'Cancel', def: '취소' }, { prop: 'Confirm', layer: 'Confirm', def: '확인' }] }),
      states: [{ caption: 'Confirm', props: {} }, { caption: 'Alert', props: { variant: 'alert' } }, { caption: 'Prompt', props: { variant: 'prompt' } }, { caption: 'Danger', props: { danger: 'true' } }],
    },
    {
      key: 'Popover',
      setName: 'DS/Popover',
      eyebrow: 'MOLECULE · OVERLAY',
      desc: '요소 옆에 붙는 작은 부가정보 팝오버.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Popover', [{ name: 'placement', values: ['top', 'bottom'] }], (c) => renderPopover(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '팝오버 제목' }, { prop: 'Body', layer: 'Body', def: '간단한 부가 설명' }] }),
      states: [{ caption: 'Top', props: {} }, { caption: 'Bottom', props: { placement: 'bottom' } }],
    },
    {
      key: 'Drawer',
      setName: 'DS/Drawer',
      eyebrow: 'ORGANISM · OVERLAY',
      desc: '측면에서 밀려나오는 내비게이션 드로어.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Drawer', [{ name: 'side', values: ['right', 'left'] }], (c) => renderDrawer(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '메뉴' }, { prop: 'Item 1', layer: 'Item 1', def: '홈' }, { prop: 'Item 2', layer: 'Item 2', def: '프로필' }, { prop: 'Item 3', layer: 'Item 3', def: '설정' }], swaps: [{ prop: 'Icon 1', layer: 'Icon 1', defKey: '_Icon/House' }, { prop: 'Icon 2', layer: 'Icon 2', defKey: '_Icon/Person' }, { prop: 'Icon 3', layer: 'Icon 3', defKey: '_Icon/Settings' }] }),
      states: [{ caption: 'Right', props: {} }, { caption: 'Left', props: { side: 'left' } }],
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
  subtitle: '데이터 표시 계열 — 값·상태·구조·흐름을 보여주는 요소. Avatar · Statistics · Progress · Table · Timeline · Tree · Carousel.',
  docs: [
    {
      key: 'Avatar',
      setName: 'DS/Avatar',
      eyebrow: 'ATOM · DATA',
      desc: '사용자를 나타내는 아바타(이니셜 + 온라인 점).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Avatar', [{ name: 'size', values: ['sm', 'md', 'lg', 'xl'] }, { name: 'status', values: ['online', 'offline', 'busy'] }], (c) => renderAvatar(ctx, c), { texts: [{ prop: 'Initial', layer: 'Initial', def: '김' }] }),
      states: [{ caption: 'Small', props: { size: 'sm' } }, { caption: 'Medium', props: { size: 'md' } }, { caption: 'Large', props: { size: 'lg' } }, { caption: 'XL', props: { size: 'xl' } }, { caption: 'Offline', props: { status: 'offline' } }, { caption: 'Busy', props: { status: 'busy' } }],
    },
    {
      key: 'Statistics',
      setName: 'DS/Statistics',
      eyebrow: 'MOLECULE · DATA',
      desc: '지표 값과 증감을 보여주는 통계 카드.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Statistics', [{ name: 'delta', values: ['up', 'down', 'flat'] }], (c) => renderStatistics(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '총 매출' }, { prop: 'Value', layer: 'Value', def: '₩12,400,000' }, { prop: 'Delta', layer: 'Delta', def: '+12.5%' }] }),
      states: [{ caption: 'Up', props: {} }, { caption: 'Down', props: { delta: 'down' } }, { caption: 'Flat', props: { delta: 'flat' } }],
    },
    {
      key: 'Progress',
      setName: 'DS/Progress',
      eyebrow: 'ATOM · DATA',
      desc: '진행 상태를 나타내는 진행 바.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Progress', [{ name: 'value', values: ['25', '50', '75', '100'] }], (c) => renderProgress(ctx, c), { texts: [{ prop: 'Label', layer: 'Label', def: '진행률' }] }),
      states: [{ caption: '25%', props: { value: '25' } }, { caption: '50%', props: { value: '50' } }, { caption: '75%', props: { value: '75' } }, { caption: '100%', props: { value: '100' } }],
    },
    {
      key: 'Table',
      setName: 'DS/Table',
      eyebrow: 'ORGANISM · DATA',
      desc: '헤더 + 데이터 행 + 상태 배지의 표.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Table', [{ name: 'state', values: ['default', 'striped', 'empty'] }], (c) => renderTable(ctx, c), { texts: [{ prop: 'Head 1', layer: 'Head 1', def: '이름' }, { prop: 'Head 2', layer: 'Head 2', def: '역할' }, { prop: 'Head 3', layer: 'Head 3', def: '상태' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Striped', props: { state: 'striped' } }, { caption: 'Empty', props: { state: 'empty' } }],
    },
    {
      key: 'Timeline',
      setName: 'DS/Timeline',
      eyebrow: 'MOLECULE · DATA',
      desc: '시간 순 이벤트를 선·점으로 잇는 타임라인.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Timeline', [{ name: 'state', values: ['default'] }], (c) => renderTimeline(ctx, c), { texts: [{ prop: 'Title 1', layer: 'Title 1', def: '주문 완료' }, { prop: 'Title 2', layer: 'Title 2', def: '배송 준비' }, { prop: 'Title 3', layer: 'Title 3', def: '배송 시작' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Tree',
      setName: 'DS/Tree',
      eyebrow: 'MOLECULE · DATA',
      desc: '폴더/파일 계층을 들여쓰기로 보여주는 트리.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Tree', [{ name: 'state', values: ['default'] }], (c) => renderTree(ctx, c), { texts: [{ prop: 'Node 1', layer: 'Node 1', def: '문서' }, { prop: 'Node 2', layer: 'Node 2', def: '프로젝트' }, { prop: 'Node 3', layer: 'Node 3', def: '기획서.md' }, { prop: 'Node 4', layer: 'Node 4', def: '디자인.fig' }, { prop: 'Node 5', layer: 'Node 5', def: '이미지' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Carousel',
      setName: 'DS/Carousel',
      eyebrow: 'MOLECULE · DATA',
      desc: '슬라이드 + 좌우 이동 + 인디케이터 캐러셀.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Carousel', [{ name: 'showArrows', values: ['true', 'false'] }, { name: 'showDots', values: ['true', 'false'] }], (c) => renderCarousel(ctx, c), { texts: [{ prop: 'Slide', layer: 'Slide', def: '슬라이드 1 / 4' }], swaps: [{ prop: 'Prev', layer: 'Prev Icon', defKey: '_Icon/ChevronLeft' }, { prop: 'Next', layer: 'Next Icon', defKey: '_Icon/ChevronRight' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'No Arrows', props: { showArrows: 'false' } }, { caption: 'No Dots', props: { showDots: 'false' } }],
    },
    {
      key: 'Rating',
      setName: 'DS/Rating',
      eyebrow: 'ATOM · DATA',
      desc: '별점(1~5).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Rating', [{ name: 'value', values: ['3', '4', '5'] }], (c) => renderRating(ctx, c)),
      states: [{ caption: '3', props: { value: '3' } }, { caption: '4', props: {} }, { caption: '5', props: { value: '5' } }],
    },
    {
      key: 'AvatarGroup',
      setName: 'DS/AvatarGroup',
      eyebrow: 'MOLECULE · DATA',
      desc: '겹친 아바타 + 초과 수(+N).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/AvatarGroup', [{ name: 'state', values: ['default'] }], (c) => renderAvatarGroup(ctx, c)),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Kbd',
      setName: 'DS/Kbd',
      eyebrow: 'ATOM · DATA',
      desc: '키보드 키 표시(⌘ K).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Kbd', [{ name: 'state', values: ['default'] }], (c) => renderKbd(ctx, c)),
      states: [{ caption: 'Default', props: {} }],
    },
  ],
}

const STRUCTURE_CATEGORY: CategoryDef = {
  pageName: PAGE_STRUCTURE,
  title: 'Structure',
  subtitle: '앱 뼈대(레이아웃 구조) 계열 — 페이지 상하좌우를 잡는 큰 골격. Navbar · Header · Footer · Sidebar.',
  docs: [
    {
      key: 'Navbar',
      setName: 'DS/Navbar',
      eyebrow: 'ORGANISM · STRUCTURE',
      desc: '브랜드 + 내비 링크 + CTA로 구성된 상단 내비게이션 바.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Navbar', [{ name: 'state', values: ['default'] }], (c) => renderNavbar(ctx, c), { texts: [{ prop: 'Brand', layer: 'Brand', def: 'TDS' }, { prop: 'Link 1', layer: 'Link 1', def: '홈' }, { prop: 'Link 2', layer: 'Link 2', def: '제품' }, { prop: 'Link 3', layer: 'Link 3', def: '가격' }, { prop: 'CTA', layer: 'CTA', def: '시작하기' }], swaps: [{ prop: 'Brand Icon', layer: 'Brand Icon', defKey: '_Icon/Sparkles' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Header',
      setName: 'DS/Header',
      eyebrow: 'ORGANISM · STRUCTURE',
      desc: '메뉴·제목 + 검색·알림·아바타의 앱 헤더.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Header', [{ name: 'state', values: ['default'] }], (c) => renderHeader(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '페이지 제목' }], swaps: [{ prop: 'Menu Icon', layer: 'Menu Icon', defKey: '_Icon/Menu' }, { prop: 'Search Icon', layer: 'Search Icon', defKey: '_Icon/Search' }, { prop: 'Bell Icon', layer: 'Bell Icon', defKey: '_Icon/Bell' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Footer',
      setName: 'DS/Footer',
      eyebrow: 'ORGANISM · STRUCTURE',
      desc: '저작권 표기 + 링크로 구성된 하단 푸터.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Footer', [{ name: 'state', values: ['default'] }], (c) => renderFooter(ctx, c), { texts: [{ prop: 'Copyright', layer: 'Copyright', def: '© 2026 TDS. All rights reserved.' }, { prop: 'Link 1', layer: 'Link 1', def: '이용약관' }, { prop: 'Link 2', layer: 'Link 2', def: '개인정보' }, { prop: 'Link 3', layer: 'Link 3', def: '문의' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Sidebar',
      setName: 'DS/Sidebar',
      eyebrow: 'ORGANISM · STRUCTURE',
      desc: '브랜드 + 세로 내비 항목의 사이드바(활성 상태 포함).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Sidebar', [{ name: 'state', values: ['default'] }], (c) => renderSidebar(ctx, c), { texts: [{ prop: 'Brand', layer: 'Brand', def: 'TDS Console' }, { prop: 'Item 1', layer: 'Item 1', def: '홈' }, { prop: 'Item 2', layer: 'Item 2', def: '대시보드' }, { prop: 'Item 3', layer: 'Item 3', def: '설정' }], swaps: [{ prop: 'Brand Icon', layer: 'Brand Icon', defKey: '_Icon/Sparkles' }, { prop: 'Icon 1', layer: 'Icon 1', defKey: '_Icon/House' }, { prop: 'Icon 2', layer: 'Icon 2', defKey: '_Icon/Grid' }, { prop: 'Icon 3', layer: 'Icon 3', defKey: '_Icon/Settings' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
  ],
}

const DATETIME_CATEGORY: CategoryDef = {
  pageName: PAGE_DATETIME,
  title: 'Date & Time',
  subtitle: '날짜·시간 입력 계열 — 달력과 날짜/시간 선택 필드. Calendar · DatePicker · TimePicker · DateRangePicker.',
  docs: [
    {
      key: 'Calendar',
      setName: 'DS/Calendar',
      eyebrow: 'ORGANISM · DATE',
      desc: '월 단위 달력 그리드(선택일·오늘 표시).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Calendar', [{ name: 'state', values: ['default'] }], (c) => renderCalendar(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '2026년 7월' }], swaps: [{ prop: 'Prev', layer: 'Prev', defKey: '_Icon/ChevronLeft' }, { prop: 'Next', layer: 'Next', defKey: '_Icon/ChevronRight' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'DatePicker',
      setName: 'DS/DatePicker',
      eyebrow: 'MOLECULE · DATE',
      desc: '날짜를 선택하는 입력 필드(달력 아이콘).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/DatePicker', [{ name: 'state', values: ['default'] }], () => pickerField(ctx, '날짜', '2026-07-15', '_Icon/Calendar'), { texts: [{ prop: 'Label', layer: 'Label', def: '날짜' }, { prop: 'Value', layer: 'Value', def: '2026-07-15' }], swaps: [{ prop: 'Icon', layer: 'Icon', defKey: '_Icon/Calendar' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'TimePicker',
      setName: 'DS/TimePicker',
      eyebrow: 'MOLECULE · DATE',
      desc: '시간을 선택하는 입력 필드(시계 아이콘).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/TimePicker', [{ name: 'state', values: ['default'] }], () => pickerField(ctx, '시간', '오후 2:30', '_Icon/Clock'), { texts: [{ prop: 'Label', layer: 'Label', def: '시간' }, { prop: 'Value', layer: 'Value', def: '오후 2:30' }], swaps: [{ prop: 'Icon', layer: 'Icon', defKey: '_Icon/Clock' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'DateRangePicker',
      setName: 'DS/DateRangePicker',
      eyebrow: 'MOLECULE · DATE',
      desc: '기간(시작~종료)을 선택하는 입력 필드.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/DateRangePicker', [{ name: 'state', values: ['default'] }], () => pickerField(ctx, '기간', '2026-07-01  ~  2026-07-15', '_Icon/Calendar'), { texts: [{ prop: 'Label', layer: 'Label', def: '기간' }, { prop: 'Value', layer: 'Value', def: '2026-07-01  ~  2026-07-15' }], swaps: [{ prop: 'Icon', layer: 'Icon', defKey: '_Icon/Calendar' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
  ],
}

// KR 필드형 문서(상태 축 공통)
function krFieldDoc(han: string, key: string, spec: KrSpec): ComponentDoc {
  return {
    key: han,
    setName: 'DS/' + key,
    eyebrow: 'MOLECULE · KR',
    desc: han + ' 입력 필드.',
    build: (ctx, page) =>
      buildSet(ctx, page, 'DS/' + key, [{ name: 'state', values: ['default', 'filled', 'error', 'disabled'] }], (c) => krField(ctx, spec, c), {
        texts: [{ prop: 'Label', layer: 'Label', def: spec.label }, { prop: 'Value', layer: 'Value', def: spec.ph }],
      }),
    states: [
      { caption: 'Default', props: {} },
      { caption: 'Filled', props: { state: 'filled' } },
      { caption: 'Error', props: { state: 'error' } },
      { caption: 'Disabled', props: { state: 'disabled' } },
    ],
  }
}
function krBespokeDoc(han: string, key: string, desc: string, render: (ctx: Ctx, combo: Record<string, string>) => ComponentNode): ComponentDoc {
  return {
    key: han,
    setName: 'DS/' + key,
    eyebrow: 'ORGANISM · KR',
    desc,
    build: (ctx, page) => buildSet(ctx, page, 'DS/' + key, [{ name: 'state', values: ['default'] }], (c) => render(ctx, c)),
    states: [{ caption: 'Default', props: {} }],
  }
}
const KR_CATEGORY: CategoryDef = {
  pageName: PAGE_KR,
  title: 'KR 컴포넌트',
  subtitle: '한국 도메인 폼 계열 — 계좌·카드·본인인증·주소 등. Storybook "6. KR 컴포넌트"와 1:1.',
  docs: [
    krFieldDoc('계좌번호', 'KrAccountField', { label: '계좌번호', ph: '계좌번호 입력', helper: '숫자만 입력하세요' }),
    krFieldDoc('사업자등록번호', 'KrBizNoField', { label: '사업자등록번호', ph: '123-45-67890', helper: '숫자 10자리를 입력하세요', errHelper: '유효하지 않은 사업자등록번호입니다' }),
    krFieldDoc('주민등록번호', 'KrRrnField', { label: '주민등록번호', ph: '900101-1●●●●●●', trailing: 'eye', errHelper: '주민등록번호 형식이 아닙니다' }),
    krFieldDoc('차량번호', 'KrVehicleNoField', { label: '차량번호', ph: '12가3456', errHelper: '차량번호 형식이 아닙니다' }),
    krFieldDoc('카드번호', 'KrCardNoField', { label: '카드번호', ph: '0000-0000-0000-0000', errHelper: '카드번호를 다시 확인해 주세요' }),
    krFieldDoc('유효기간', 'KrExpiryField', { label: '유효기간', ph: 'MM/YY', narrow: true, errHelper: '유효기간이 올바르지 않습니다' }),
    krFieldDoc('CVC', 'KrCvcField', { label: 'CVC', ph: '●●●', narrow: true, trailing: 'eye', helper: '카드 뒷면 3자리' }),
    krFieldDoc('휴대폰 번호', 'KrPhoneField', { label: '휴대폰 번호', ph: '010-0000-0000', errHelper: '휴대폰 번호 형식이 아닙니다' }),
    krFieldDoc('우편번호 조회', 'KrPostcodeSearch', { label: '우편번호', ph: '00000', trailing: '우편번호 조회' }),
    krFieldDoc('은행 선택', 'KrBankSelect', { label: '은행', ph: '은행을 선택하세요', trailing: 'chevron' }),
    krBespokeDoc('통신사 선택', 'KrCarrierSelect', '통신사 선택 필-버튼 라디오 그룹.', renderKrCarrier),
    krBespokeDoc('본인인증 수단 선택', 'KrAuthMethodSelect', '본인인증 수단 카드 리스트.', renderKrAuthMethod),
    krBespokeDoc('주소 자동완성', 'KrAddressAutocomplete', '주소 입력 + 제안 리스트.', renderKrAutocomplete),
    krBespokeDoc('진행 단계', 'KrStepIndicator', '본인인증 진행 단계 인디케이터.', renderKrStep),
    krBespokeDoc('전자서명', 'KrSignaturePad', '전자서명 캔버스 + 되돌리기/지우기.', renderKrSignature),
    krBespokeDoc('카드 등록 폼', 'KrCardForm', '카드번호·유효기간·CVC·소유자명 등록 폼.', renderKrCardForm),
    krBespokeDoc('배송지 주소', 'KrAddressForm', '우편번호 조회 + 도로명·상세·요청사항 주소 폼.', renderKrAddressForm),
    krBespokeDoc('휴대폰 본인인증', 'KrPhoneAuth', '단계 + 이름·휴대폰·인증번호 위저드.', renderKrPhoneAuth),
    krBespokeDoc('본인인증', 'KrIdentityVerification', '통합 본인인증(수단 선택 → 인증 → 완료).', renderKrIdentity),
    krBespokeDoc('인증서 인증', 'KrCertAuth', '공동/금융 인증서 선택 + 다음.', renderKrCertAuth),
  ],
}

const TEMPLATES_CATEGORY: CategoryDef = {
  pageName: PAGE_TEMPLATES,
  title: 'Templates',
  subtitle: '페이지 예시 — DS 컴포넌트를 조합한 화면. Storybook Templates·Admin 미러.',
  docs: [
    krBespokeDoc('AdminShell', 'AdminShell', 'Navbar + Sidebar + Main의 관리자 셸.', renderTplAdminShell),
    krBespokeDoc('Dashboard', 'Dashboard', 'KPI + 차트 + 테이블 대시보드.', renderTplDashboard),
    krBespokeDoc('ListPage', 'ListPage', '헤더 + 필터 + 테이블 + 페이지네이션 목록 화면.', renderTplListPage),
    krBespokeDoc('Settings', 'Settings', '섹션 카드(프로필·알림) + 저장.', renderTplSettings),
    krBespokeDoc('Login', 'Login', '이메일·비밀번호 + 소셜 로그인 카드.', renderTplLogin),
    krBespokeDoc('EmptyState', 'EmptyState', '아이콘 + 제목 + 설명 + 액션 빈 상태.', renderTplEmptyState),
    krBespokeDoc('FilterBar', 'FilterBar', '검색 + 필터 셀렉트 + 초기화 툴바.', renderTplFilterBar),
  ],
}

const MEDIA_CATEGORY: CategoryDef = {
  pageName: PAGE_MEDIA,
  title: 'Media',
  subtitle: '미디어 계열 — 이미지·동영상·임베드. Image · Video · YouTube · ImageCard · ImageSlide.',
  docs: [
    {
      key: 'Image',
      setName: 'DS/Image',
      eyebrow: 'ATOM · MEDIA',
      desc: '비율 지정 이미지(플레이스홀더).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Image', [{ name: 'ratio', values: ['16x9', '4x3', '1x1'] }], (c) => renderImage(ctx, c)),
      states: [{ caption: '16:9', props: {} }, { caption: '4:3', props: { ratio: '4x3' } }, { caption: '1:1', props: { ratio: '1x1' } }],
    },
    {
      key: 'Video',
      setName: 'DS/Video',
      eyebrow: 'MOLECULE · MEDIA',
      desc: '재생 버튼 오버레이가 있는 동영상 플레이어.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Video', [{ name: 'state', values: ['default'] }], (c) => renderVideo(ctx, c)),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'YouTube',
      setName: 'DS/YouTube',
      eyebrow: 'MOLECULE · MEDIA',
      desc: '유튜브 임베드(빨강 재생 버튼).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/YouTube', [{ name: 'state', values: ['default'] }], (c) => renderYouTube(ctx, c)),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'ImageCard',
      setName: 'DS/ImageCard',
      eyebrow: 'MOLECULE · MEDIA',
      desc: '이미지 + 제목/설명 카드.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/ImageCard', [{ name: 'state', values: ['default'] }], (c) => renderImageCard(ctx, c), { texts: [{ prop: 'Title', layer: 'Title', def: '이미지 카드' }, { prop: 'Body', layer: 'Body', def: '이미지 위에 제목과 설명이 붙는 카드입니다.' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'ImageSlide',
      setName: 'DS/ImageSlide',
      eyebrow: 'ORGANISM · MEDIA',
      desc: '3개 이미지 슬라이드(좌우 이동 + 도트).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/ImageSlide', [{ name: 'state', values: ['default'] }], (c) => renderImageSlide(ctx, c), { swaps: [{ prop: 'Prev', layer: 'Prev Icon', defKey: '_Icon/ChevronLeft' }, { prop: 'Next', layer: 'Next Icon', defKey: '_Icon/ChevronRight' }] }),
      states: [{ caption: 'Default', props: {} }],
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
  STRUCTURE_CATEGORY,
  DATETIME_CATEGORY,
  KR_CATEGORY,
  TEMPLATES_CATEGORY,
  MEDIA_CATEGORY,
]

// ── 카테고리 생성 ────────────────────────────────────────────────────
export async function generateCategories(fontFamily: string, colors?: Record<string, string>, preset?: PresetName): Promise<string[]> {
  const ctx = await setup(fontFamily, colors, preset)
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
    applyPageColorMode(ctx, page)

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
