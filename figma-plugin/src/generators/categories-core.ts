// 카테고리: Input · Selection · Action · Feedback.
// categories.ts에서 기계적으로 분리(동작 변경 없음). 공용 부품은 categories-shared.ts.
import { bindFillVar, bindOnFill, bindSolidFill, bindStrokeVar, boundText, type CategoryDef, FIELD_W, fieldRow, fixedFrame, inputShell, onHex, PAGE_ACTION, PAGE_FEEDBACK, PAGE_INPUT, PAGE_SELECTION, recolorIcon, recolorIconOn, recolorIconVar, tintHex, toneBase, VARIANT_HEX } from './categories-shared'
import { ACCENT, autoFrame, BORDER, type Ctx, INK, MUTED, SUB, SURFACE, WHITE } from './foundations'
import { iconInstance } from './icon-vec'
import { buildSet, type PropSpec, type State } from './lib/build-set'
import { onVarName, solidToneHex, solidVarName } from './tone'

function iconNode(_ctx: Ctx, key: string, size: number, hex: string): SceneNode {
  const ic = iconInstance(key, 'icon', size)
  recolorIcon(ic, hex)
  return ic
}

// 아이콘 인스턴스는 icon-vec.ts의 ICON_COMPONENTS(Icon System 페이지가 채움)를 직접 참조.
const ICON_DEFAULT = '_Icon/Star'

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
  sizeAxis?: boolean // true면 sm/md/lg 크기 축 추가(union). 미설정 컴포넌트는 md 고정.
  // ── 아래 4개는 "코드에 있는 prop만 Figma 속성으로 연다"를 데이터로 표현한 것이다.
  //    makeInputSet이 8종에 공통 규칙(label·placeholder·helperText)을 적용하는 바람에
  //    코드에 없는 속성(SearchField.helperText·NumberField.placeholder)까지 만들어내고 있었다.
  /** base TEXT에서 뺄 것 — 코드에 그 prop이 없는 필드. */
  omit?: Array<'placeholder' | 'helperText'>
  /** 단위 표기(affordance.unit)를 여는 코드 prop 이름 — NumberField는 `unit`, CurrencyField는 `currency`다. */
  unitProp?: string
  /** 라벨 아래 설명 줄(TextFieldProps.description). 값이 있으면 레이어와 TEXT 속성을 함께 만든다. */
  description?: string
  /** 글자수 카운터 문구(maxLength는 number라 TEXT 속성이 없다 — 표시 여부만 showCounter로 연다). */
  counter?: string
  /** show* BOOLEAN — 코드 prop 이름 그대로. 레이어는 그 요소를 그리는 CSS 클래스(없으면 prop 이름). */
  bools?: Array<{ prop: string; layer: string; def: boolean }>
  states: State[]
}
// DS/TextField 변형 수 — makeInputSet이 axes를 전부 false/true VARIANT로 곱한다:
// size(3, sizeAxis) × error(2) × success(2) × disabled(2) × readOnly(2) = 48변형. 오너가 준 상한(세트당
// 54)을 이미 밑돈다 — 그래서 축소하지 않았다. error/success는 보더·글자 '색'을 바꾸는 축이라
// componentPropertyReferences(visible·characters·mainComponent 세 필드뿐)로는 BOOLEAN으로 내릴 수
// 없고(Button.disabled의 오버레이 기법과 달리 "면 전체를 덮어 색을 가리는" 방식은 통과 가능하나, 그러면
// disabled/readOnly와 같은 오버레이 레이어 3~4장이 서로 겹쳐 순서·해제 로직이 필요해진다), disabled·
// readOnly는 내릴 수 있어도 renderInput은 8종 입력(TextField·EmailField·PasswordField·SearchField·
// NumberField·CurrencyField·OtpField·Textarea)이 공유하는 단일 함수라 TextField 하나만 축을 빼면
// 나머지 7종의 pixel-parity를 건드리지 않고는 disabled/readOnly 처리를 분기할 수 없다 — 그 7종은 이번
// 배치의 소유 범위 밖이다(작업 보고 참고).
const INPUTS: InputDef[] = [
  { key: 'TextField', setName: 'DS/TextField', label: '이메일', placeholder: 'name@example.com', eyebrow: 'MOLECULE · INPUT', desc: '라벨·설명·헬퍼텍스트를 지원하는 기본 한 줄 텍스트 입력.', helper: '업무용 이메일을 입력하세요.', affordance: {}, axes: ['error', 'success', 'disabled', 'readOnly'], sizeAxis: true, description: '회사 도메인 메일만 가입할 수 있어요.', counter: '0/50', bools: [{ prop: 'showDescription', layer: 'description', def: true }, { prop: 'showCounter', layer: 'counter', def: false }], states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Success', props: { success: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }, { caption: 'ReadOnly', props: { readOnly: 'true' } }] },
  { key: 'EmailField', setName: 'DS/EmailField', label: '이메일', placeholder: 'name@example.com', eyebrow: 'MOLECULE · INPUT', desc: '블러 시 이메일 형식을 검증해 에러/성공을 표시하는 입력.', helper: '가입에 사용할 이메일이에요.', affordance: {}, axes: ['error', 'success', 'disabled', 'required'], states: [{ caption: 'Default', props: {} }, { caption: 'Required', props: { required: 'true' } }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Success', props: { success: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }] },
  { key: 'PasswordField', setName: 'DS/PasswordField', label: '비밀번호', placeholder: '8자 이상 입력', eyebrow: 'MOLECULE · INPUT', desc: '표시/숨김 눈 아이콘 토글이 붙은 비밀번호 입력.', helper: '영문·숫자·기호를 조합하세요.', affordance: { trailing: 'eye' }, axes: ['error', 'success', 'disabled', 'required', 'readOnly'], bools: [{ prop: 'showToggle', layer: 'showToggle', def: true }], states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Success', props: { success: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }, { caption: 'Required', props: { required: 'true' } }, { caption: 'ReadOnly', props: { readOnly: 'true' } }] },
  { key: 'SearchField', setName: 'DS/SearchField', label: '검색', placeholder: '검색어를 입력하세요', eyebrow: 'MOLECULE · INPUT', desc: '검색 아이콘과 지우기 버튼을 가진 검색창.', helper: '', affordance: { leading: 'search', trailing: 'clear' }, axes: ['disabled'], omit: ['helperText'], bools: [{ prop: 'showClear', layer: 'showClear', def: true }], states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { disabled: 'true' } }] },
  { key: 'NumberField', setName: 'DS/NumberField', label: '수량', placeholder: '0', eyebrow: 'MOLECULE · INPUT', desc: '단위 표기 + 증감(−/+) 스테퍼가 붙은 숫자 입력.', helper: '', affordance: { trailing: 'stepper', unit: '개' }, axes: ['disabled', 'readOnly'], omit: ['placeholder'], unitProp: 'unit', states: [{ caption: 'Default', props: {} }, { caption: 'ReadOnly', props: { readOnly: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }] },
  { key: 'CurrencyField', setName: 'DS/CurrencyField', label: '금액', placeholder: '0', eyebrow: 'MOLECULE · INPUT', desc: '천단위 콤마 + 통화 단위 표기가 붙은 금액 입력.', helper: '최대 50,000원까지 입력할 수 있어요.', affordance: { trailing: 'unit', unit: '원' }, axes: ['error', 'disabled', 'readOnly'], unitProp: 'currency', states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'ReadOnly', props: { readOnly: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }] },
  { key: 'OtpField', setName: 'DS/OtpField', label: '인증번호', placeholder: '', eyebrow: 'MOLECULE · INPUT', desc: '자릿수만큼 분리된 셀에 입력하는 인증번호(OTP) 필드.', helper: '문자로 받은 6자리를 입력하세요.', affordance: { otp: 6 }, axes: ['error', 'disabled'], states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }] },
  { key: 'Textarea', setName: 'DS/Textarea', label: '내용', placeholder: '내용을 입력하세요', eyebrow: 'MOLECULE · INPUT', desc: '자동 높이 조절 + 글자수 카운터가 붙은 여러 줄 텍스트 입력. fullWidth 축은 폼 그리드 열을 채우는 넓은 폭을 보여줍니다.', helper: '10자 이상 입력하세요.', affordance: { textarea: true }, axes: ['error', 'disabled', 'readOnly', 'required', 'fullWidth'], counter: '0/500', bools: [{ prop: 'showCounter', layer: 'counter', def: true }], states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'ReadOnly', props: { readOnly: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }, { caption: 'Required', props: { required: 'true' } }, { caption: 'Full Width', props: { fullWidth: 'true' } }] },
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
  const size = combo.size || 'md'
  const sz: Record<string, { pv: number; ph: number; f: number }> = {
    sm: { pv: 7, ph: 10, f: 13 },
    md: { pv: 10, ph: 12, f: 15 },
    lg: { pv: 13, ph: 14, f: 17 },
  }
  const toneVar = error ? 'color/error' : success ? 'color/success' : null
  const toneHex = error ? '#F04452' : success ? '#00C471' : null
  // fullWidth(Textarea 전용 축) — 폼 그리드 열을 채운다(기본 480px 상한을 푼다). 격리된 컴포넌트에서는
  // 상한을 아예 없애는 대신 더 넉넉한 고정 폭으로 대신 보여준다(Select·Button fullWidth와 같은 패턴).
  const fieldW = combo.fullWidth === 'true' ? 480 : FIELD_W

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(fieldW, c.height)
  c.primaryAxisSizingMode = 'AUTO'
  c.itemSpacing = 6
  c.fills = []
  if (disabled) c.opacity = 0.45

  const labelRow = autoFrame('label-row', 'HORIZONTAL')
  labelRow.itemSpacing = 2
  const labelText = boundText(ctx, def.label, 13, 'color/text', INK, true)
  labelText.name = 'label'
  labelRow.appendChild(labelText)
  if (required) labelRow.appendChild(boundText(ctx, '*', 13, 'color/error/600', '#F04452', true))
  c.appendChild(labelRow)

  // 설명 줄(description) — 라벨과 입력 사이. showDescription BOOLEAN이 이 레이어를 켜고 끈다.
  if (def.description) {
    const d = boundText(ctx, def.description, 12, 'color/secondary', SUB)
    d.name = 'description'
    d.layoutAlign = 'STRETCH'
    d.textAutoResize = 'HEIGHT'
    c.appendChild(d)
  }

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
    input.paddingTop = input.paddingBottom = def.affordance.textarea ? 12 : sz[size].pv
    input.paddingLeft = input.paddingRight = sz[size].ph
    if (def.affordance.textarea) input.minHeight = 76
    input.cornerRadius = 8
    bindFillVar(ctx, input, disabled || readOnly ? 'color/bgSubtle' : 'color/bg', disabled || readOnly ? '#F5F7FA' : WHITE)
    bindStrokeVar(ctx, input, toneVar ?? 'color/border', toneHex ?? BORDER)
    input.strokeWeight = 1
    input.strokeAlign = 'INSIDE'
    if (def.affordance.leading === 'search') {
      // 장식 아이콘 — 대응하는 ReactNode prop이 없다(SearchField는 아이콘을 하드코딩한다).
      // INSTANCE_SWAP으로 열면 코드에 없는 속성이 생기므로 속성 없는 레이어로 둔다.
      const lead = iconInstance('_Icon/Search', 'icon', 16)
      recolorIcon(lead, MUTED)
      input.appendChild(lead)
    }
    const val = boundText(ctx, def.placeholder, sz[size].f, 'color/secondary', MUTED)
    val.name = 'placeholder'
    val.layoutGrow = 1
    val.textAutoResize = 'HEIGHT'
    input.appendChild(val)
    // 단위 표기 — 레이어 이름이 곧 코드 prop 이름이다(NumberField.unit / CurrencyField.currency).
    if (def.affordance.unit) {
      const u = boundText(ctx, def.affordance.unit, 14, 'color/secondary', SUB)
      u.name = def.unitProp ?? 'unit'
      input.appendChild(u)
    }
    if (def.affordance.trailing === 'eye' || def.affordance.trailing === 'clear') {
      // 레이어 이름 = 이 아이콘의 표시 여부를 여는 BOOLEAN prop 이름(PasswordField.showToggle /
      // SearchField.showClear). 규약 §6: 속성에 바인딩된 레이어는 prop 이름을 쓴다.
      const eye = def.affordance.trailing === 'eye'
      const tr = iconInstance(eye ? '_Icon/Eye' : '_Icon/Close', eye ? 'showToggle' : 'showClear', 16)
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
    const meta = autoFrame('meta', 'HORIZONTAL')
    meta.layoutAlign = 'STRETCH'
    meta.primaryAxisSizingMode = 'FIXED'
    meta.primaryAxisAlignItems = 'SPACE_BETWEEN'
    meta.counterAxisAlignItems = 'MIN'
    meta.itemSpacing = 8
    const helper = boundText(ctx, helperMsg || def.helper || ' ', 12, toneVar ?? 'color/secondary', toneHex ?? SUB)
    helper.name = 'helperText'
    helper.visible = !!helperMsg
    helper.layoutGrow = 1
    helper.textAutoResize = 'HEIGHT'
    meta.appendChild(helper)
    // 글자수 카운터 — maxLength는 number라 TEXT 속성이 없다. 표시 여부만 showCounter BOOLEAN으로 연다.
    if (def.counter) {
      const cnt = boundText(ctx, def.counter, 12, 'color/secondary', SUB)
      cnt.name = 'counter'
      meta.appendChild(cnt)
    }
    c.appendChild(meta)
  }
  return c
}
function makeInputSet(ctx: Ctx, def: InputDef, page: PageNode): ComponentSetNode {
  // 속성·레이어 이름은 INPUT 계열 React prop 그대로다(TextFieldProps: label / placeholder / helperText).
  // ⚠️ 이 함수의 파생 규칙은 scripts/lib/figma-sets.mjs의 expandInputs가 재현한다 — 바꾸면 거기도 함께 고쳐라
  //    (안 고치면 E-ADAPTER-STALE로 게이트가 실패한다).
  const props: PropSpec = { texts: [{ prop: 'label', layer: 'label', def: def.label }] }
  const omit = def.omit ?? []
  // NumberField는 value가 number라 코드에 placeholder prop이 없다 → 속성을 만들지 않는다.
  if (!def.affordance.otp && !omit.includes('placeholder')) props.texts!.push({ prop: 'placeholder', layer: 'placeholder', def: def.placeholder })
  // SearchField에는 helperText prop이 없다 → 유령 속성을 만들지 않는다.
  if (!omit.includes('helperText')) props.texts!.push({ prop: 'helperText', layer: 'helperText', def: def.helper })
  if (def.affordance.unit && def.unitProp) props.texts!.push({ prop: def.unitProp, layer: def.unitProp, def: def.affordance.unit })
  if (def.description) props.texts!.push({ prop: 'description', layer: 'description', def: def.description })
  if (def.bools) props.bools = def.bools
  // 선행/후행 아이콘은 INSTANCE_SWAP으로 열지 않는다 — 대응하는 ReactNode prop이 코드에 없다
  // (아이콘은 컴포넌트가 하드코딩한 장식이고, 여닫는 것만 showClear·showToggle로 열려 있다).
  const axes = def.axes.map((a) => ({ name: a, values: ['false', 'true'] }))
  if (def.sizeAxis) axes.unshift({ name: 'size', values: ['md', 'sm', 'lg'] })
  return buildSet(ctx, page, def.setName, axes, (combo) => renderInput(ctx, def, combo), props)
}

// ── DS/InputBase — 입력 박스 자체(오너 지시: "Input 박스 자체도 컴포넌트화, 오른쪽에 아이콘 넣을
// 수 있게 베리언트화, 라벨 없이 가로 배치하는 구성도"). INPUTS(위 8종)와 별도 렌더 함수로 둔다 —
// makeInputSet/renderInput을 공유하면 8종이 쓰는 축(readOnly·required 등)이 세트마다 달라 하나의
// 함수로 합칠 수 없고, 억지로 합치면 기존 세트 모양이 깨진다(작업 보고 "8종 재사용" 참고).
//
// 변형 = size(3) × error(2) × success(2) × disabled(2) = 24(상한 이하로 지켰다).
// InputBaseProps의 나머지 non-show boolean(readOnly·required·fullWidth)과 union(type·inputMode)은
// 축에 넣지 않았다 — 전부 넣으면 3×2^6×5×6로 곱해져 세트가 무너진다. ds-props.mjs 분류상 이 prop들도
// "코드 축"이라 verify-naming이 axis-missing으로 잡는다 — scripts/verify-naming.mjs ALLOWLIST에
// InputBase 예외 등록이 필요하다(이 파일 소유권 밖이라 등록하지 않았다 — 작업 보고 참고).
function renderInputBase(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const error = combo.error === 'true'
  const success = combo.success === 'true'
  const disabled = combo.disabled === 'true'
  const size = combo.size || 'md'
  // InputBase.module.css --input-size-*-py/px·--ds-font-size-* 값과 정확히 같다(그 CSS 상단 주석:
  // "TextField와 같은 스케일을 쓴다" — renderInput의 sz와 동일 값이라 여기서도 같은 리터럴을 쓴다).
  const sz: Record<string, { pv: number; ph: number; f: number; icon: number }> = {
    sm: { pv: 7, ph: 10, f: 13, icon: 14 },
    md: { pv: 10, ph: 12, f: 15, icon: 16 },
    lg: { pv: 13, ph: 14, f: 17, icon: 18 },
  }
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

  // label — InputBaseProps.label은 optional이라 코드에서 생략하면 자리 자체가 안 남는다(라벨 없이
  // 박스만 쓰는 구성, 오너가 지목한 것). Figma엔 "레이어 없음" 축이 없고 코드에 showLabel도 없어
  // 축/BOOLEAN으로 열 수 없다 — 문서의 'Without Label' 상태가 texts:{label:''}로 근사한다.
  const label = boundText(ctx, '이메일', 13, 'color/text', INK, true)
  label.name = 'label'
  c.appendChild(label)

  const wrap = autoFrame('inputWrap', 'HORIZONTAL') // 레이어 이름 = CSS 클래스(.inputWrap)
  wrap.counterAxisAlignItems = 'CENTER'
  wrap.layoutAlign = 'STRETCH'
  wrap.primaryAxisSizingMode = 'FIXED'
  wrap.itemSpacing = 8
  wrap.paddingTop = wrap.paddingBottom = sz[size].pv
  wrap.paddingLeft = wrap.paddingRight = sz[size].ph
  wrap.cornerRadius = 8
  bindFillVar(ctx, wrap, disabled ? 'color/bgSubtle' : 'color/bg', disabled ? '#F5F7FA' : WHITE)
  bindStrokeVar(ctx, wrap, toneVar ?? 'color/border', toneHex ?? BORDER)
  wrap.strokeWeight = 1
  wrap.strokeAlign = 'INSIDE'

  // leading/trailing — 오너가 콕 집은 축(§본문 "오른쪽에 아이콘 넣을 수 있게"). ReactNode 슬롯이라
  // 대응하는 show* prop이 코드에 없다(존재=표시, DS/Chip.leading·DS/Tag.remove와 같은 패턴) — 기본
  // 숨김 + INSTANCE_SWAP만 연다. 문서에 보여주려면 디자이너가 레이어를 켜고 아이콘을 교체한다.
  const leading = iconInstance('_Icon/Search', 'leading', sz[size].icon)
  leading.visible = false
  recolorIconVar(ctx, leading, 'color/secondary', MUTED)
  wrap.appendChild(leading)

  // 값/플레이스홀더 — 한 텍스트 레이어에 TEXT 속성 두 개를 붙일 수 없다(renderSelect와 같은 제약).
  // placeholder만 연다(코드 8종 입력 필드와 같은 관례) — value는 text-missing 예외 대상(작업 보고 참고).
  const val = boundText(ctx, 'name@example.com', sz[size].f, 'color/secondary', MUTED)
  val.name = 'placeholder'
  val.layoutGrow = 1
  wrap.appendChild(val)

  const trailing = iconInstance('_Icon/Dollar', 'trailing', sz[size].icon)
  trailing.visible = false
  recolorIconVar(ctx, trailing, 'color/secondary', MUTED)
  wrap.appendChild(trailing)

  c.appendChild(wrap)

  const meta = autoFrame('meta', 'HORIZONTAL')
  meta.layoutAlign = 'STRETCH'
  meta.primaryAxisSizingMode = 'FIXED'
  meta.primaryAxisAlignItems = 'SPACE_BETWEEN'
  meta.counterAxisAlignItems = 'MIN'
  meta.itemSpacing = 8
  const helper = boundText(ctx, '업무용 이메일을 입력하세요.', 12, toneVar ?? 'color/secondary', toneHex ?? SUB)
  helper.name = 'helperText'
  helper.layoutGrow = 1
  helper.textAutoResize = 'HEIGHT'
  meta.appendChild(helper)
  // 글자수 카운터 — maxLength는 number라 TEXT 속성이 없다. 표시 여부만 showCounter BOOLEAN으로 연다.
  const counter = boundText(ctx, '0/50', 12, 'color/secondary', SUB)
  counter.name = 'counter'
  counter.visible = false
  meta.appendChild(counter)
  c.appendChild(meta)

  return c
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
  // 켜짐 = solid 면(color/solid-primary), 노브 = 그 면 위 전경(color/on-primary)
  if (checked) bindSolidFill(ctx, track, 'primary')
  else bindFillVar(ctx, track, 'color/border', BORDER)
  const knob = figma.createEllipse()
  knob.resize(kn, kn)
  if (checked) bindOnFill(ctx, knob, 'primary')
  else bindFillVar(ctx, knob, 'color/bg', WHITE)
  track.appendChild(knob)
  c.appendChild(track)
  const lbl = boundText(ctx, '알림 받기', 14, 'color/text', INK)
  lbl.name = 'label'
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
  // 체크됨 = solid 면 + on-color 체크/대시(면 위 전경)
  if (on) bindSolidFill(ctx, box, 'primary')
  else bindFillVar(ctx, box, 'color/bg', WHITE)
  bindStrokeVar(ctx, box, on ? solidVarName('primary') : 'color/border', on ? solidToneHex(toneBase(ctx, 'primary')) : BORDER)
  box.strokeWeight = 1
  box.strokeAlign = 'INSIDE'
  if (checked) {
    const ck = iconInstance('_Icon/Check', 'icon', 14)
    recolorIconOn(ctx, ck, 'primary')
    box.appendChild(ck)
  } else if (indet) {
    const dash = figma.createRectangle()
    dash.resize(10, 2)
    dash.cornerRadius = 1
    bindOnFill(ctx, dash, 'primary')
    box.appendChild(dash)
  }
  c.appendChild(box)
  const lbl = boundText(ctx, '약관에 동의합니다', 14, 'color/text', INK)
  lbl.name = 'label'
  c.appendChild(lbl)
  return c
}
// React Radio는 '라디오 한 개'가 아니라 **그룹**이다(RadioProps: options[] · value · name · direction).
// 예전 세트는 항목 하나만 그리고 selected/disabled를 축으로 세워, 코드에 없는 축 두 개를 만들고
// 정작 코드에 있는 direction 축은 빠뜨리고 있었다. 코드가 단일 출처이므로 그룹으로 맞춘다.
// 항목 라벨은 options[] 배열의 데이터라 인덱스 TEXT(Label 1~3)로 편다 — prop이 아니라 데이터다.
const RADIO_OPTIONS: Array<{ label: string; selected: boolean; disabled: boolean }> = [
  { label: '전체 공개', selected: false, disabled: false },
  { label: '링크가 있는 사람만', selected: true, disabled: false },
  { label: '비공개(준비 중)', selected: false, disabled: true },
]
function renderRadio(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const column = combo.direction === 'column'
  const c = figma.createComponent()
  c.layoutMode = column ? 'VERTICAL' : 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = column ? 'MIN' : 'CENTER'
  c.itemSpacing = column ? 10 : 18
  c.fills = []
  RADIO_OPTIONS.forEach((opt, i) => {
    const item = autoFrame('item', 'HORIZONTAL')
    item.counterAxisAlignItems = 'CENTER'
    item.itemSpacing = 8
    if (opt.disabled) item.opacity = 0.45
    const outer = fixedFrame('circle', 'HORIZONTAL', 20, 20)
    outer.primaryAxisAlignItems = 'CENTER'
    outer.counterAxisAlignItems = 'CENTER'
    outer.cornerRadius = 10
    bindFillVar(ctx, outer, 'color/bg', WHITE)
    bindStrokeVar(ctx, outer, opt.selected ? 'color/primary' : 'color/border', opt.selected ? ACCENT : BORDER)
    outer.strokeWeight = opt.selected ? 2 : 1
    outer.strokeAlign = 'INSIDE'
    if (opt.selected) {
      const dot = figma.createEllipse()
      dot.resize(9, 9)
      bindFillVar(ctx, dot, 'color/primary', ACCENT)
      outer.appendChild(dot)
    }
    item.appendChild(outer)
    // 레이어 이름 = 바인딩된 TEXT 속성 이름(규약 §6) — CSS 클래스(.label)로 통일하면 세 항목이
    // 한 속성에 묶여 같은 글자가 된다.
    const lbl = boundText(ctx, opt.label, 14, 'color/text', INK)
    lbl.name = `Label ${i + 1}`
    item.appendChild(lbl)
    c.appendChild(item)
  })
  return c
}
function renderChip(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const selected = combo.selected === 'true'
  const disabled = combo.disabled === 'true'
  const sm = combo.size === 'sm'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = sm ? 4 : 6
  c.paddingTop = c.paddingBottom = sm ? 4 : 7
  c.paddingLeft = c.paddingRight = sm ? 10 : 14
  c.cornerRadius = 999
  // 선택됨 = solid 면 + on-color 글자/아이콘
  if (selected) bindSolidFill(ctx, c, 'primary')
  else {
    bindFillVar(ctx, c, 'color/bgSubtle', SURFACE)
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }
  if (disabled) c.opacity = 0.45
  const fgVar = selected ? onVarName('primary') : 'color/text'
  const fgHex = selected ? onHex(ctx, 'primary') : INK
  // 선행 아이콘(ChipProps.leading) — React는 prop을 안 넘기면 사라진다. Figma엔 '속성 없음'이 없어
  // 레이어를 미리 두고 기본 숨김 + BOOLEAN으로 켠다(INSTANCE_SWAP `leading`이 아이콘을 갈아끼운다).
  const lead = iconInstance(ICON_DEFAULT, 'leading', sm ? 12 : 14)
  lead.visible = false
  recolorIconVar(ctx, lead, fgVar, fgHex)
  c.appendChild(lead)
  const lbl = boundText(ctx, '필터', sm ? 12 : 13, fgVar, fgHex, true)
  lbl.name = 'label'
  c.appendChild(lbl)
  // 제거(×) 버튼 — React는 onRemove(함수)를 넘길 때만 그린다. 함수는 Figma 속성이 될 수 없어 표시 여부만 연다.
  const x = iconInstance('_Icon/Close', 'remove', sm ? 12 : 14)
  x.visible = false
  if (selected) recolorIconOn(ctx, x, 'primary')
  else recolorIconVar(ctx, x, 'color/secondary', SUB)
  c.appendChild(x)
  return c
}
function renderButton(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const variant = combo.variant || 'primary'
  const appearance = combo.appearance || 'solid'
  const size = combo.size || 'md'
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
  const toneHex = VARIANT_HEX[variant] ?? ACCENT
  // appearance: solid=solid 면(color/solid-*) + on-color 글자 / outline=투명+톤 보더+톤 글자 / ghost=투명+톤 글자
  // 웹 Button.module.css: .solid{background:solid 면; color:on-color} · .outline/.ghost{color:var(--tone)=base}
  let fgVar = onVarName(variant)
  let fgHex = onHex(ctx, variant)
  if (appearance === 'solid') {
    bindSolidFill(ctx, c, variant)
  } else {
    c.fills = []
    fgVar = `color/${variant}`
    fgHex = toneHex
    if (appearance === 'outline') {
      bindStrokeVar(ctx, c, `color/${variant}`, toneHex)
      c.strokeWeight = 1
      c.strokeAlign = 'INSIDE'
    }
  }
  const ipx = pad[size].f + 2
  // 레거시 좌측 아이콘 슬롯(ButtonProps.showIcon/icon) — leftIcon이 없을 때만 왼쪽에 렌더된다.
  // 코드에 살아 있는 prop이라 Figma에도 있어야 한다. 레이어 이름은 CSS 클래스(.icon) 그대로.
  const legacy = iconInstance(ICON_DEFAULT, 'icon', ipx)
  legacy.visible = false
  recolorIconVar(ctx, legacy, fgVar, fgHex)
  c.appendChild(legacy)
  // 왼쪽 아이콘(기본 숨김, 토글 대상) — 아이콘도 글자와 같은 색 변수를 따라간다(currentColor와 동일).
  const li = iconInstance(ICON_DEFAULT, 'leftIcon', ipx)
  li.visible = false
  recolorIconVar(ctx, li, fgVar, fgHex)
  c.appendChild(li)
  const lbl = boundText(ctx, '버튼', pad[size].f, fgVar, fgHex, true)
  lbl.name = 'label'
  c.appendChild(lbl)
  // 오른쪽 아이콘(기본 숨김, 토글 대상)
  const ri = iconInstance('_Icon/ChevronRight', 'rightIcon', ipx)
  ri.visible = false
  recolorIconVar(ctx, ri, fgVar, fgHex)
  c.appendChild(ri)
  // disabled — opacity는 componentPropertyReferences 바인딩 대상이 아니다(visible·characters·mainComponent
  // 세 필드뿐 — figma-plugin/node_modules/@figma/plugin-typings/plugin-api.d.ts:6282-6285). 그래서
  // 버튼 전체를 덮는 반투명 흰 오버레이 레이어를 두고 '그 레이어의 visible'만 disabled BOOLEAN에 직접
  // 묶는다 — 방향이 반전 없이 그대로 맞는다(disabled=true → 오버레이 visible=true). renderImageCard의
  // Scrim과 같은 '덮는 레이어' 기법이다(categories-data-kr-media.ts:1653-1664 참고).
  // 레이어 이름은 CSS 클래스가 없으니(React는 opacity라 이런 레이어가 없다) §6대로 바인딩된 prop
  // 이름('disabled')을 그대로 쓴다 — N6(layer-not-css-class)를 ALLOWLIST 없이 통과한다.
  const disabledOverlay = figma.createRectangle()
  disabledOverlay.name = 'disabled'
  bindFillVar(ctx, disabledOverlay, 'color/bg', WHITE)
  disabledOverlay.fills = [{ ...((disabledOverlay.fills as readonly Paint[])[0] as SolidPaint), opacity: 0.55 }]
  disabledOverlay.strokes = []
  disabledOverlay.cornerRadius = 8
  disabledOverlay.visible = false // 기본값(disabled=false) — BOOLEAN 바인딩 대상
  c.appendChild(disabledOverlay)
  disabledOverlay.layoutPositioning = 'ABSOLUTE'
  disabledOverlay.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }
  disabledOverlay.x = 0
  disabledOverlay.y = 0
  disabledOverlay.resize(c.width, c.height)
  return c
}
function renderBadge(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const variant = combo.variant || 'primary'
  const appearance = combo.appearance || 'soft'
  const size = combo.size || 'md'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.paddingTop = c.paddingBottom = size === 'sm' ? 2 : 4
  c.paddingLeft = c.paddingRight = size === 'sm' ? 7 : 9
  c.cornerRadius = 6
  const toneHex = VARIANT_HEX[variant] ?? ACCENT
  // appearance: solid=solid 면(color/solid-*)+on-color 글자 / soft=톤 100(연한) 배경+톤 글자 / outline=투명+톤 보더+톤 글자
  // 웹 Badge.module.css: .soft/.outline의 글자는 var(--tone)=base → Figma도 color/<variant>(base)로 같은 셰이드.
  let fgVar = onVarName(variant)
  let fgHex = onHex(ctx, variant)
  if (appearance === 'solid') {
    bindSolidFill(ctx, c, variant)
  } else {
    fgVar = `color/${variant}`
    fgHex = toneHex
    if (appearance === 'soft') {
      bindFillVar(ctx, c, `color/${variant}/100`, tintHex(toneHex))
    } else {
      c.fills = []
      bindStrokeVar(ctx, c, `color/${variant}`, toneHex)
      c.strokeWeight = 1
      c.strokeAlign = 'INSIDE'
    }
  }
  const lbl = boundText(ctx, 'Badge', size === 'sm' ? 11 : 13, fgVar, fgHex, true)
  lbl.name = 'label'
  c.appendChild(lbl)
  return c
}

// ── DS/Tag — 분류 라벨(중립 표면 + 톤 점). Badge/Chip과 달리 톤이 면을 채우지 않는다. ──
// 출처: Tag.module.css — 보더/배경은 톤을 옅게 섞은 색(color-mix), 점(dot)·글자는 톤 그대로.
// Figma는 color-mix 8%/28% 믹스를 그대로 표현할 변수가 없어 soft 배지와 같은 톤/100(연한) 배경으로 근사한다.
function renderTag(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const tone = combo.tone || 'secondary'
  const size = combo.size || 'md'
  const dim = size === 'sm' ? { pv: 1, ph: 6, f: 11, dot: 5 } : { pv: 2, ph: 8, f: 13, dot: 6 }
  const toneHex = VARIANT_HEX[tone] ?? SUB

  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 4
  c.paddingTop = c.paddingBottom = dim.pv
  c.paddingLeft = c.paddingRight = dim.ph
  c.cornerRadius = 4
  bindFillVar(ctx, c, `color/${tone}/100`, tintHex(toneHex))
  bindStrokeVar(ctx, c, `color/${tone}`, toneHex)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  // 레이어 이름 = CSS 클래스(Tag.module.css의 .dot / .label / .remove) — 규약 §6.
  const dot = figma.createEllipse()
  dot.name = 'dot'
  dot.resize(dim.dot, dim.dot)
  bindFillVar(ctx, dot, `color/${tone}`, toneHex)
  c.appendChild(dot)

  // 라벨은 톤이 아니라 중립 텍스트색 — Tag는 "낮은 강조"라 여러 개를 나열해도 시끄럽지 않다.
  const lbl = boundText(ctx, '태그', dim.f, 'color/text', INK)
  lbl.name = 'label'
  c.appendChild(lbl)

  // 제거 버튼 — React는 onRemove(함수)를 넘길 때만 그린다. 기본 숨김이고 removeIcon(INSTANCE_SWAP)이 아이콘을 바꾼다.
  const rm = iconInstance('_Icon/Close', 'remove', size === 'sm' ? 10 : 12)
  recolorIconVar(ctx, rm, 'color/secondary', SUB)
  rm.visible = false
  c.appendChild(rm)
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
// (FB_TITLE은 지웠다 — DS/Alert가 title/message 두 줄을 그리던 시절의 잔재다. React Alert는 label 한 줄뿐이다.)
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
// React Alert는 `아이콘(showIcon) + 라벨 한 줄`이다(AlertProps: variant · label · showIcon).
// 예전 세트는 title/message 두 줄을 그려 대응하는 prop이 없는 TEXT 속성 두 개(Title·Message)를 만들고
// 있었다 — 코드가 단일 출처이므로 라벨 한 줄로 맞춘다. 레이어 이름은 CSS 클래스(.icon/.label) 그대로.
function renderAlert(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const variant = combo.variant || 'info'
  const tone = FB_TONE[variant]
  const c = fbBox(360)
  c.counterAxisAlignItems = 'CENTER'
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = 14
  c.cornerRadius = 8
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/' + tone, VARIANT_HEX[tone])
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  const aicon = iconInstance(FB_ICON[variant], 'icon', 18)
  recolorIcon(aicon, VARIANT_HEX[tone])
  c.appendChild(aicon)
  const label = boundText(ctx, FB_MSG[variant], 13, 'color/text', INK)
  label.name = 'label'
  label.layoutGrow = 1
  label.textAutoResize = 'HEIGHT'
  c.appendChild(label)
  return c
}
function renderToast(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  // 축 이름은 코드 prop 그대로 `tone`이다(ToastProps: tone · message · showIcon).
  const tone = combo.tone || 'info'
  const c = fbBox(340)
  c.counterAxisAlignItems = 'CENTER'
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = 14
  c.cornerRadius = 10
  bindFillVar(ctx, c, 'color/bg', WHITE)
  c.effects = [
    { type: 'DROP_SHADOW', color: { r: 0.1, g: 0.12, b: 0.16, a: 0.16 }, offset: { x: 0, y: 4 }, radius: 16, spread: 0, visible: true, blendMode: 'NORMAL' },
  ]
  const ticon = iconInstance(FB_ICON[tone], 'iconCircle', 18)
  recolorIcon(ticon, VARIANT_HEX[FB_TONE[tone]])
  c.appendChild(ticon)
  const msg = boundText(ctx, FB_MSG[tone], 13, 'color/text', INK)
  msg.name = 'message'
  msg.layoutGrow = 1
  c.appendChild(msg)
  const closeI = iconInstance('_Icon/Close', 'close', 16)
  recolorIcon(closeI, MUTED)
  c.appendChild(closeI)
  return c
}
function renderSnackbar(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const variant = combo.variant || 'default'
  const c = fbBox(340)
  c.counterAxisAlignItems = 'CENTER'
  c.primaryAxisAlignItems = 'SPACE_BETWEEN'
  c.itemSpacing = 10
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = 16
  c.cornerRadius = 8
  // React(Snackbar.module.css .snackbar)는 --ds-color-text를 면으로 쓰는 역전 표면이다.
  bindFillVar(ctx, c, 'color/text', INK)
  if (variant !== 'default') {
    const dot = figma.createEllipse()
    dot.resize(8, 8)
    // 레이어 = CSS 클래스(.success/.error) — 톤 점은 variant 축이 그린다.
    dot.name = variant === 'error' ? 'error' : 'success'
    // 어두운 면 위라 밝은 셰이드(-400)를 쓴다 — React .success .icon/.error .icon과 같은 토큰.
    bindFillVar(ctx, dot, variant === 'error' ? 'color/error/400' : 'color/success/400', variant === 'error' ? '#FF6B76' : '#3DDC97')
    c.appendChild(dot)
  }
  const msg = boundText(ctx, '링크를 복사했어요.', 13, 'color/bg', WHITE)
  msg.name = 'message'
  msg.layoutGrow = 1
  c.appendChild(msg)
  // 액션 라벨 — 예전엔 `action` 축(코드에 없는 이름)으로 켜고 껐다. 코드는 actionLabel(string) 하나뿐이라
  // TEXT 속성으로 열고 항상 그린다(축을 늘리지 않는다). React .action은 --ds-color-primary-300.
  const act = boundText(ctx, '실행 취소', 13, 'color/primary/300', '#6C9BFF', true)
  act.name = 'action'
  c.appendChild(act)
  // 닫기(×) — showClose BOOLEAN이 켜고 끈다. React 기본값은 false라 기본 숨김.
  const close = iconInstance('_Icon/Close', 'close', 16)
  recolorIcon(close, '#8B95A1')
  close.visible = false
  c.appendChild(close)
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
  // React(Tooltip.module.css .bubble/.arrow)는 둘 다 --ds-color-text를 면으로 쓴다.
  const tri = () => {
    const t = figma.createVector()
    t.vectorPaths = [{ windingRule: 'NONZERO', data: shape[p] }]
    bindFillVar(ctx, t, 'color/text', INK)
    t.strokes = []
    return t
  }
  const bubble = autoFrame('bubble', 'HORIZONTAL')
  bubble.paddingTop = bubble.paddingBottom = 6
  bubble.paddingLeft = bubble.paddingRight = 10
  bubble.cornerRadius = 6
  bindFillVar(ctx, bubble, 'color/text', INK)
  // TooltipProps.content(string)가 말풍선 글자다. children(트리거)은 세트 밖이므로
  // 규약 §7의 슬롯 이름 `content`를 이 텍스트 레이어가 가져간다. React .bubble은 color: var(--ds-color-bg).
  const tipText = boundText(ctx, '도움말 텍스트', 12, 'color/bg', WHITE)
  tipText.name = 'content'
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
  // overlay=true — 부모를 덮는 반투명 면 위에 중앙 배치(LoadingProps.overlay). 격리된 컴포넌트에서는
  // 덮을 부모가 없으므로 고정 크기 면으로 그 그림을 보여준다.
  const overlay = combo.overlay === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 10
  c.fills = []
  if (overlay) {
    c.primaryAxisSizingMode = 'FIXED'
    c.counterAxisSizingMode = 'FIXED'
    c.resize(240, 96)
    c.primaryAxisAlignItems = 'CENTER'
    c.cornerRadius = 10
    bindFillVar(ctx, c, 'color/bg', WHITE)
    c.opacity = 0.92
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }
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
  ltext.name = 'label'
  c.appendChild(ltext)
  return c
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
        bindSolidFill(ctx, box, 'primary')
        const ck = iconInstance('_Icon/Check', 'check', 13)
        recolorIconOn(ctx, ck, 'primary')
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
  // fullWidth — 폼 그리드에서 열을 채운다(기본 320px 상한을 푼다). 격리된 컴포넌트에서는
  // 상한을 아예 없애는 대신 더 넉넉한 고정 폭으로 대신 보여준다(다른 fullWidth 축과 같은 패턴).
  if (combo.fullWidth === 'true') c.resize(480, c.height)
  const row = fieldRow(ctx, error ? 'color/error' : null, error ? '#F04452' : null, disabled)
  // 트리거 텍스트는 값과 플레이스홀더가 같은 레이어를 공유한다(값이 없으면 플레이스홀더).
  // 한 텍스트 레이어에 TEXT 속성 두 개를 붙일 수 없어 코드 prop `value` 쪽을 열었다.
  const val = boundText(ctx, '선택하세요', 15, 'color/secondary', MUTED)
  val.name = 'value'
  val.layoutGrow = 1
  row.appendChild(val)
  // 셰브런은 대응하는 ReactNode prop이 없다(하드코딩된 장식) — INSTANCE_SWAP으로 열지 않는다.
  const chev = iconInstance('_Icon/ChevronDown', 'chevron', 18)
  recolorIcon(chev, SUB)
  row.appendChild(chev)
  addField(row)
  if (combo.open === 'true') {
    addField(optionPanel(ctx, [['전체', false], ['진행 중', true], ['완료', false], ['보류', false]], false))
  }
  const helper = boundText(ctx, error ? '필수 항목입니다.' : '하나를 선택하세요.', 12, error ? 'color/error' : 'color/secondary', error ? '#F04452' : SUB)
  helper.name = 'helper'
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
    // React(MultiSelect.module.css .chip)는 color: var(--ds-color-primary) 위에 10% 프라이머리 틴트
    // 배경이다(여기 있던 bgSubtle 면 + INK 글자는 토큰이 달랐다) — /50(90% 흰 틴트)이 10% 톤과 같다.
    bindFillVar(ctx, chip, 'color/primary/50', '#EEF2FF')
    chip.appendChild(boundText(ctx, t, 12, 'color/primary', ACCENT))
    chips.appendChild(chip)
  })
  row.appendChild(chips)
  const chev = iconInstance('_Icon/ChevronDown', 'chevron', 18)
  recolorIcon(chev, SUB)
  row.appendChild(chev)
  addField(row)
  if (combo.open === 'true') {
    addField(optionPanel(ctx, [['React', true], ['Svelte', true], ['Vue', false], ['Angular', false]], true))
  }
  // helperText(코드 prop)를 담을 레이어가 없어 속성을 열 수 없었다 — 헬퍼 줄을 추가한다.
  const helper = boundText(ctx, '최대 3개까지 고를 수 있어요.', 12, 'color/secondary', SUB)
  helper.name = 'helper'
  helper.layoutAlign = 'STRETCH'
  addField(helper)
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
  // 값 + 단위는 코드에서 함께 나타났다 사라진다(showValue) — 한 프레임(value)으로 묶어 한 BOOLEAN이 둘 다 켜고 끈다.
  // 숫자 자체는 value(number) 축이 그린다(Figma엔 숫자 속성 타입이 없다). 단위만 TEXT prop `unit`으로 연다.
  const pvRow = autoFrame('value', 'HORIZONTAL')
  pvRow.itemSpacing = 1
  const pv = boundText(ctx, String(pct), 13, 'color/secondary', SUB)
  pv.name = 'value'
  const pu = boundText(ctx, '%', 13, 'color/secondary', SUB)
  pu.name = 'unit'
  pvRow.appendChild(pv)
  pvRow.appendChild(pu)
  const spacer = boundText(ctx, '', 13, 'color/secondary', SUB)
  meta.appendChild(spacer)
  meta.appendChild(pvRow)
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
  // React(Slider.module.css .range::-webkit-slider-thumb)는 solid-primary 면 + bg 테두리다
  // (여기 있던 흰 면 + primary 테두리는 반대였다).
  bindFillVar(ctx, thumb, 'color/solid-primary', ACCENT)
  bindStrokeVar(ctx, thumb, 'color/bg', WHITE)
  thumb.strokeWeight = 2
  track.appendChild(thumb)
  thumb.x = Math.min(FIELD_W - 18, Math.max(0, (FIELD_W * pct) / 100 - 9))
  thumb.y = 0
  addField(track)
  return c
}
function renderUpload(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const disabled = combo.disabled === 'true'
  const preview = combo.preview || 'none'
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
  const up = iconInstance('_Icon/Upload', 'icon', 24)
  recolorIcon(up, SUB)
  zone.appendChild(up)
  // 드롭존 안내 문구는 React가 하드코딩한다(커스터마이즈 통로는 children 슬롯이다) — TEXT 속성으로 열지 않는다.
  const t = boundText(ctx, '파일을 끌어다 놓거나 클릭', 13, 'color/text', INK, true)
  t.name = 'text'
  zone.appendChild(t)
  addField(zone)

  // preview 축(UploadProps.preview) — 고른 파일을 '어떻게 그리는가'. FileUpload·ImageUpload가
  // 이 축으로 흡수됐으므로 세 값의 그림이 실제로 다르다(none은 목록 없음).
  if (preview === 'list') {
    const list = autoFrame('list', 'VERTICAL')
    list.layoutAlign = 'STRETCH'
    list.primaryAxisSizingMode = 'AUTO'
    list.itemSpacing = 6
    ;[['제안서.pdf', '1.2MB'], ['도면.png', '640KB']].forEach(([nm, sz]) => {
      const it = autoFrame('item', 'HORIZONTAL')
      it.layoutAlign = 'STRETCH'
      it.primaryAxisSizingMode = 'FIXED'
      it.counterAxisAlignItems = 'CENTER'
      it.itemSpacing = 8
      it.paddingTop = it.paddingBottom = 8
      it.paddingLeft = it.paddingRight = 10
      it.cornerRadius = 6
      bindFillVar(ctx, it, 'color/bgSubtle', SURFACE)
      const fi = iconInstance('_Icon/File', 'fileIcon', 16)
      recolorIcon(fi, SUB)
      it.appendChild(fi)
      const nameT = boundText(ctx, nm, 12, 'color/text', INK)
      nameT.name = 'name'
      nameT.layoutGrow = 1
      it.appendChild(nameT)
      const szT = boundText(ctx, sz, 11, 'color/secondary', SUB)
      szT.name = 'size'
      it.appendChild(szT)
      const rm = iconInstance('_Icon/Close', 'listRemove', 14)
      recolorIcon(rm, MUTED)
      it.appendChild(rm)
      list.appendChild(it)
    })
    addField(list)
  } else if (preview === 'grid') {
    const grid = autoFrame('grid', 'HORIZONTAL')
    grid.layoutAlign = 'STRETCH'
    grid.primaryAxisSizingMode = 'FIXED'
    grid.itemSpacing = 8
    for (let i = 0; i < 3; i++) {
      const th = fixedFrame('thumb', 'HORIZONTAL', 84, 84)
      th.primaryAxisAlignItems = 'CENTER'
      th.counterAxisAlignItems = 'CENTER'
      th.cornerRadius = 8
      bindFillVar(ctx, th, 'color/bgSubtle', SURFACE)
      bindStrokeVar(ctx, th, 'color/border', BORDER)
      th.strokeWeight = 1
      th.strokeAlign = 'INSIDE'
      const ic = iconInstance(i === 2 ? '_Icon/Plus' : '_Icon/Image', i === 2 ? 'addTile' : 'img', 20)
      recolorIcon(ic, MUTED)
      th.appendChild(ic)
      grid.appendChild(th)
    }
    addField(grid)
  }

  // helperText(코드 prop) — 예전엔 'Hint'라는 임의 이름으로 열려 있었다.
  const sub = boundText(ctx, 'PDF, PNG · 최대 10MB', 11, 'color/secondary', SUB)
  sub.name = 'helper'
  sub.layoutAlign = 'STRETCH'
  addField(sub)
  return c
}

// ══ Storybook-only 백필: Autocomplete ════════════════════════════════
// FileUpload · ImageUpload는 여기서 제거했다 — Storybook src/ds에서 사라졌고(커밋 64bd32f 'empty slate for
// full rebuild'), 두 역할은 살아 있는 DS/Upload 한 세트로 흡수됐다. 없는 컴포넌트의 Figma 세트를 계속 찍으면
// 디자이너가 코드에 없는 컴포넌트를 쓰게 된다. (DS/Upload는 그대로 둔다.)
function renderAutocomplete(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  // 축 이름은 코드 prop 그대로다(AutocompleteProps: disabled · error). 예전의 state=default|disabled는
  // 코드에 없는 이름이었다.
  const disabled = combo.disabled === 'true'
  const error = combo.error === 'true'
  const { c, addField } = inputShell(ctx, '검색', disabled)
  const row = fieldRow(ctx, error ? 'color/error' : null, error ? '#F04452' : null, disabled)
  const val = boundText(ctx, '검색어를 입력하세요', 15, 'color/secondary', MUTED)
  val.name = 'value'
  val.layoutGrow = 1
  row.appendChild(val)
  // 검색 아이콘은 하드코딩된 장식이다 — 대응 ReactNode prop이 없어 INSTANCE_SWAP으로 열지 않는다.
  const si = iconInstance('_Icon/Search', 'icon', 18)
  recolorIcon(si, SUB)
  row.appendChild(si)
  addField(row)
  if (!disabled) addField(optionPanel(ctx, [['서울특별시', false], ['서울대입구역', false], ['서울숲', false]], false))
  const helper = boundText(ctx, error ? '후보를 골라주세요.' : '두 글자 이상 입력하면 후보가 나타납니다.', 12, error ? 'color/error' : 'color/secondary', error ? '#F04452' : SUB)
  helper.name = 'helperText'
  helper.layoutAlign = 'STRETCH'
  addField(helper)
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
  // React(Callout.module.css)는 color-mix(tone 8%, transparent) — 변수로 못 옮기는 혼합값이라
  // 가장 가까운 이산 셰이드(<tone>/50, 90% 흰 틴트)에 바인딩한다.
  bindFillVar(ctx, c, tvar + '/50', tint)
  bindStrokeVar(ctx, c, tvar, thex)
  c.strokeAlign = 'INSIDE'
  c.strokeTopWeight = c.strokeRightWeight = c.strokeBottomWeight = 0
  c.strokeLeftWeight = 3
  const ic = iconInstance(icon, 'icon', 18)
  recolorIcon(ic, thex)
  c.appendChild(ic)
  const col = autoFrame('text', 'VERTICAL')
  col.layoutGrow = 1
  col.itemSpacing = 3
  const t = boundText(ctx, '안내 제목', 14, 'color/text', INK, true)
  t.name = 'title'
  col.appendChild(t)
  // 본문은 children(ReactNode) 슬롯이다 — 규약 §7의 슬롯 이름 `content`를 쓴다.
  // 세트가 그리는 실체는 텍스트 한 줄이라 TEXT 속성이 유일하게 쓸모 있는 표현이다.
  const b = boundText(ctx, '강조해서 보여줄 안내 문구를 담습니다.', 13, 'color/secondary', SUB)
  b.name = 'content'
  b.layoutAlign = 'STRETCH'
  b.textAutoResize = 'HEIGHT'
  col.appendChild(b)
  c.appendChild(col)
  return c
}

export const INPUT_CATEGORY: CategoryDef = {
  pageName: PAGE_INPUT,
  title: 'Input',
  subtitle:
    '텍스트 입력 계열 — 라벨·입력·헬퍼 규약을 공유하는 폼 필드. 각 컴포넌트의 상태 변형을 편집 가능한 Figma 컴포넌트로 렌더합니다.',
  docs: [
    {
      key: 'InputBase',
      setName: 'DS/InputBase',
      eyebrow: 'ATOM · INPUT',
      desc:
        '입력 박스 자체(라벨·헬퍼가 아니라 박스 중심) — TextField 등 8종이 공유하는 sm/md/lg 크기 스케일을 그대로 씁니다. ' +
        'leading·trailing INSTANCE_SWAP으로 좌/우에 아이콘을 자유롭게 바꿔 끼울 수 있고, 라벨 없이 박스만 쓰는 구성도 지원합니다(Without Label 상태 참고).',
      build: (ctx: Ctx, page: PageNode) =>
        buildSet(
          ctx,
          page,
          'DS/InputBase',
          [
            { name: 'size', values: ['md', 'sm', 'lg'] },
            { name: 'error', values: ['false', 'true'] },
            { name: 'success', values: ['false', 'true'] },
            { name: 'disabled', values: ['false', 'true'] },
          ],
          (combo) => renderInputBase(ctx, combo),
          {
            texts: [
              { prop: 'label', layer: 'label', def: '이메일' },
              { prop: 'placeholder', layer: 'placeholder', def: 'name@example.com' },
              { prop: 'helperText', layer: 'helperText', def: '업무용 이메일을 입력하세요.' },
            ],
            bools: [{ prop: 'showCounter', layer: 'counter', def: false }],
            swaps: [
              { prop: 'leading', layer: 'leading', defKey: '_Icon/Search' },
              { prop: 'trailing', layer: 'trailing', defKey: '_Icon/Dollar' },
            ],
          },
        ),
      states: [
        { caption: 'Default', props: {} },
        { caption: 'Small', props: { size: 'sm' } },
        { caption: 'Large', props: { size: 'lg' } },
        { caption: 'Error', props: { error: 'true' } },
        { caption: 'Success', props: { success: 'true' } },
        { caption: 'Disabled', props: { disabled: 'true' } },
        { caption: 'Without Label', props: {}, texts: { label: '' } },
      ],
    },
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
      desc: '옵션 목록에서 하나를 고르는 단일 선택. fullWidth 축은 폼 그리드 열을 채우는 넓은 폭을 보여줍니다.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Select', [{ name: 'open', values: ['false', 'true'] }, { name: 'error', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }, { name: 'fullWidth', values: ['false', 'true'] }], (c) => renderSelect(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '카테고리' }, { prop: 'value', layer: 'value', def: '선택하세요' }, { prop: 'helperText', layer: 'helper', def: '하나를 선택하세요.' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Open', props: { open: 'true' } }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }, { caption: 'Full Width', props: { fullWidth: 'true' } }],
    },
    {
      key: 'MultiSelect',
      setName: 'DS/MultiSelect',
      eyebrow: 'ORGANISM · INPUT',
      desc: '여러 항목을 칩으로 선택하는 다중 선택.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/MultiSelect', [{ name: 'open', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderMultiSelect(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '기술 스택' }, { prop: 'helperText', layer: 'helper', def: '최대 3개까지 고를 수 있어요.' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Open', props: { open: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Slider',
      setName: 'DS/Slider',
      eyebrow: 'MOLECULE · INPUT',
      desc: '드래그로 수치를 조절하는 슬라이더. 값 표시는 showValue, 단위는 unit 속성입니다.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Slider', [{ name: 'value', values: ['50', '0', '100'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderSlider(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '볼륨' }, { prop: 'unit', layer: 'unit', def: '%' }], bools: [{ prop: 'showValue', layer: 'value', def: true }] }),
      states: [{ caption: 'Mid', props: { value: '50' } }, { caption: 'Min', props: { value: '0' } }, { caption: 'Max', props: { value: '100' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Upload',
      setName: 'DS/Upload',
      eyebrow: 'ORGANISM · INPUT',
      desc: '클릭/드래그로 파일을 올리는 드롭존. preview 축이 고른 파일을 목록·그리드로 보여줍니다.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Upload', [{ name: 'preview', values: ['none', 'list', 'grid'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderUpload(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '첨부 파일' }, { prop: 'helperText', layer: 'helper', def: 'PDF, PNG · 최대 10MB' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'List', props: { preview: 'list' } }, { caption: 'Grid', props: { preview: 'grid' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Autocomplete',
      setName: 'DS/Autocomplete',
      eyebrow: 'MOLECULE · INPUT',
      desc: '입력 + 필터 제안 목록 자동완성.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Autocomplete', [{ name: 'disabled', values: ['false', 'true'] }, { name: 'error', values: ['false', 'true'] }], (c) => renderAutocomplete(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '검색' }, { prop: 'value', layer: 'value', def: '검색어를 입력하세요' }, { prop: 'helperText', layer: 'helperText', def: '두 글자 이상 입력하면 후보가 나타납니다.' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    // DS/FileUpload · DS/ImageUpload는 제거했다 — Storybook src/ds에서 삭제된 컴포넌트라 세트만 남아 있었다(둘 다 DS/Upload로 흡수).
  ],
}

export const SELECTION_CATEGORY: CategoryDef = {
  pageName: PAGE_SELECTION,
  title: 'Selection',
  subtitle: '선택 계열 — 켜고 끄거나 고르는 컨트롤. Toggle · Checkbox · Radio · Chip.',
  docs: [
    {
      key: 'Toggle',
      setName: 'DS/Toggle',
      eyebrow: 'ATOM · SELECTION',
      desc: '켜짐/꺼짐을 전환하는 스위치.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Toggle', [{ name: 'checked', values: ['false', 'true'] }, { name: 'size', values: ['md', 'sm'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderToggle(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '알림 받기' }] }),
      states: [{ caption: 'Off', props: {} }, { caption: 'On', props: { checked: 'true' } }, { caption: 'Small (On)', props: { checked: 'true', size: 'sm' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Checkbox',
      setName: 'DS/Checkbox',
      eyebrow: 'ATOM · SELECTION',
      desc: '여러 항목을 독립적으로 선택하는 체크박스.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Checkbox', [{ name: 'checked', values: ['false', 'true'] }, { name: 'indeterminate', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderCheckbox(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '약관에 동의합니다' }] }),
      states: [{ caption: 'Unchecked', props: {} }, { caption: 'Checked', props: { checked: 'true' } }, { caption: 'Indeterminate', props: { indeterminate: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Radio',
      setName: 'DS/Radio',
      eyebrow: 'MOLECULE · SELECTION',
      desc: '한 그룹에서 하나만 고르는 라디오 그룹. options[] 배열을 받으므로 축은 배치(direction) 하나입니다.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Radio', [{ name: 'direction', values: ['row', 'column'] }], (c) => renderRadio(ctx, c), {
          texts: RADIO_OPTIONS.map((opt, i) => ({ prop: `Label ${i + 1}`, layer: `Label ${i + 1}`, def: opt.label })),
        }),
      states: [{ caption: 'Row', props: {} }, { caption: 'Column', props: { direction: 'column' } }],
    },
    {
      key: 'Chip',
      setName: 'DS/Chip',
      eyebrow: 'MOLECULE · SELECTION',
      desc:
        '선택 가능한 필터/태그 칩. selected·disabled·size 축이고, 선행 아이콘은 "Show Leading"+leading(교체), ' +
        '제거 버튼은 "Show Remove" 속성입니다(둘 다 React에선 prop을 넘길 때만 나타난다).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Chip', [{ name: 'selected', values: ['false', 'true'] }, { name: 'size', values: ['md', 'sm'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderChip(ctx, c), {
        texts: [{ prop: 'label', layer: 'label', def: '필터' }],
        bools: [
          { prop: 'Show Leading', layer: 'leading', def: false },
          { prop: 'Show Remove', layer: 'remove', def: false },
        ],
        swaps: [{ prop: 'leading', layer: 'leading', defKey: ICON_DEFAULT }],
      }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Selected', props: { selected: 'true' } }, { caption: 'Small', props: { selected: 'true', size: 'sm' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
  ],
}

export const ACTION_CATEGORY: CategoryDef = {
  pageName: PAGE_ACTION,
  title: 'Action',
  subtitle: '액션 계열 — 사용자 행동을 유발하거나 상태를 표시. Button · Badge · Tag.',
  docs: [
    {
      key: 'Button',
      setName: 'DS/Button',
      eyebrow: 'ATOM · ACTION',
      desc: '주요 액션을 실행하는 버튼. variant·appearance·size 축을 가집니다(6×3×3=54변형 — 오너 지시로 축소, 아래 주석 참고).',
      // 변형 축소(오너 지시: "432변형이면 세트가 사실상 못 쓴다"): variant(6)×appearance(3)×size(3)×
      // disabled(2)×fullWidth(2)×iconOnly(2) = 432 → variant×appearance×size = 6×3×3 = **54**로 줄였다.
      // 셋 다 code.ts의 classifyProps 규칙상 "show*가 아닌 boolean → VARIANT 축"이라 여기서 빼면
      // verify-naming이 N2 axis-missing(디자인상 disabled/fullWidth/iconOnly 각각)을 낸다 — ALLOWLIST
      // 등록 필요(scripts/** 소유 밖이라 등록하지 않았다, 작업 보고 참고). 세 축을 내린 방식은 서로 다르다:
      //   · disabled — **진짜 BOOLEAN**이다. opacity는 componentPropertyReferences 바인딩 대상이 아니라서
      //     (visible·characters·mainComponent 세 필드뿐) renderButton에 반투명 흰 오버레이 레이어를 새로
      //     추가하고 그 레이어의 visible만 disabled에 직접 묶었다(renderImageCard의 Scrim과 같은 기법).
      //     방향이 반전 없이 그대로 맞는다(disabled=true → 오버레이 visible=true) → 실시간 토글이 된다.
      //     다만 BOOLEAN 이름이 show*가 아니라 N3(bool-extra) ALLOWLIST도 함께 필요하다.
      //   · fullWidth — **명목상**이다. 폭 변경이라 어떤 BOOLEAN에도 못 묶는다(같은 세 필드 제약). 축도
      //     BOOLEAN도 만들지 않았다 — SiteSection.maxWidth/padding과 같은 axis-missing 사유.
      //   · iconOnly — **명목상**이다. "라벨 숨김"은 BOOLEAN=true일 때 label.visible=true가 되는 직결
      //     바인딩만 가능해(반전 불가) label을 직접 숨길 수 없고, leftIcon은 이미 showLeftIcon이 같은
      //     레이어의 visible을 쓰고 있어 겹쳐 묶을 수 없다(한 레이어는 visible 참조를 하나만 가진다).
      //     안전하게 라벨을 가리는 방법(마스크 사각형)은 appearance별 배경색이 달라(solid는 톤, outline·
      //     ghost는 투명) 일반화할 수 없어 채택하지 않았다 — 축도 BOOLEAN도 만들지 않는다(axis-missing).
      //     문서의 "Icon Only" 예시는 기존 showLeftIcon(true) + label 텍스트 빈 값으로 근사한다
      //     (InputBase의 'Without Label' 상태가 texts:{label:''}로 근사하는 것과 같은 관행).
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Button', [{ name: 'variant', values: ['primary', 'secondary', 'error', 'success', 'warning', 'neutral'] }, { name: 'appearance', values: ['solid', 'outline', 'ghost'] }, { name: 'size', values: ['md', 'sm', 'lg'] }], (c) => renderButton(ctx, c), {
          texts: [{ prop: 'label', layer: 'label', def: '버튼' }],
          bools: [
            // 레거시 슬롯(showIcon/icon)도 코드에 살아 있다 — 빠뜨리면 Figma가 코드보다 좁아진다.
            { prop: 'showIcon', layer: 'icon', def: false },
            { prop: 'showLeftIcon', layer: 'leftIcon', def: false },
            { prop: 'showRightIcon', layer: 'rightIcon', def: false },
            // disabled — 위 축소 주석 참고. show*가 아닌 이름이라 N3 ALLOWLIST 등록이 필요하다.
            { prop: 'disabled', layer: 'disabled', def: false },
          ],
          swaps: [
            { prop: 'icon', layer: 'icon', defKey: ICON_DEFAULT },
            { prop: 'leftIcon', layer: 'leftIcon', defKey: ICON_DEFAULT },
            { prop: 'rightIcon', layer: 'rightIcon', defKey: '_Icon/ChevronRight' },
          ],
        }),
      states: [{ caption: 'Primary', props: { variant: 'primary' } }, { caption: 'Secondary', props: { variant: 'secondary' } }, { caption: 'Error', props: { variant: 'error' } }, { caption: 'Success', props: { variant: 'success' } }, { caption: 'Neutral', props: { variant: 'neutral' } }, { caption: 'Small', props: { size: 'sm' } }, { caption: 'Large', props: { size: 'lg' } }, { caption: 'Disabled', props: { disabled: 'true' } }, { caption: 'Icon Only', props: { showLeftIcon: 'true' }, texts: { label: '' } }],
    },
    {
      key: 'Badge',
      setName: 'DS/Badge',
      eyebrow: 'ATOM · ACTION',
      desc: '상태·분류를 표시하는 배지. variant·size 축을 가집니다.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Badge', [{ name: 'variant', values: ['primary', 'secondary', 'error', 'success', 'warning', 'neutral'] }, { name: 'appearance', values: ['soft', 'solid', 'outline'] }, { name: 'size', values: ['md', 'sm'] }], (c) => renderBadge(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: 'Badge' }] }),
      states: [{ caption: 'Primary', props: { variant: 'primary' } }, { caption: 'Secondary', props: { variant: 'secondary' } }, { caption: 'Error', props: { variant: 'error' } }, { caption: 'Success', props: { variant: 'success' } }, { caption: 'Neutral', props: { variant: 'neutral' } }, { caption: 'Small', props: { size: 'sm' } }],
    },
    {
      key: 'Tag',
      setName: 'DS/Tag',
      eyebrow: 'ATOM · ACTION',
      desc:
        '분류(카테고리) 라벨 — 중립 표면 + 톤 점(dot). Badge(상태, 톤이 면을 채움)·Chip(선택 가능한 pill)과 시각적으로 구분됩니다. ' +
        'tone·size 축이고, 점 노출은 showDot(기본 켜짐), 제거 버튼은 "Show Remove"(기본 꺼짐)·removeIcon(교체) 속성입니다.',
      // 예전엔 addBoolProp을 buildSet 밖에서 불러 속성을 달았다 — 추출기(figma-sets.mjs)는 buildSet 인자만
      // 읽으므로 그 속성들이 게이트에 보이지 않았다(검사받지 않는 그림자 속성). 전부 선언으로 옮긴다.
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/Tag',
          [
            { name: 'tone', values: ['secondary', 'primary', 'success', 'warning', 'error', 'neutral'] },
            { name: 'size', values: ['md', 'sm'] },
          ],
          (c) => renderTag(ctx, c),
          {
            texts: [{ prop: 'label', layer: 'label', def: '태그' }],
            bools: [
              { prop: 'showDot', layer: 'dot', def: true },
              { prop: 'Show Remove', layer: 'remove', def: false },
            ],
            swaps: [{ prop: 'removeIcon', layer: 'remove', defKey: '_Icon/Close' }],
          },
        ),
      states: [
        { caption: 'Default', props: {} },
        { caption: 'Primary', props: { tone: 'primary' } },
        { caption: 'Neutral', props: { tone: 'neutral' } },
        { caption: 'Small', props: { size: 'sm' } },
      ],
    },
  ],
}

export const FEEDBACK_CATEGORY: CategoryDef = {
  pageName: PAGE_FEEDBACK,
  title: 'Feedback',
  subtitle: '피드백 계열 — 상태·결과를 알리는 요소. Alert · Toast · Snackbar · Tooltip · Loading.',
  docs: [
    {
      key: 'Alert',
      setName: 'DS/Alert',
      eyebrow: 'MOLECULE · FEEDBACK',
      desc: '페이지 안에 인라인으로 상태를 알리는 배너. 아이콘은 showIcon 속성으로 켭니다.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Alert', [{ name: 'variant', values: ['info', 'success', 'warning', 'error'] }], (c) => renderAlert(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '새로운 업데이트가 있어요.' }], bools: [{ prop: 'showIcon', layer: 'icon', def: true }] }),
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
      desc: '일시적으로 떠서 결과를 알리는 카드(그림자). 축 이름은 코드 prop 그대로 tone입니다.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Toast', [{ name: 'tone', values: ['info', 'success', 'warning', 'error'] }], (c) => renderToast(ctx, c), { texts: [{ prop: 'message', layer: 'message', def: '메시지 내용' }], bools: [{ prop: 'showIcon', layer: 'iconCircle', def: true }] }),
      states: [
        { caption: 'Info', props: { tone: 'info' } },
        { caption: 'Success', props: { tone: 'success' } },
        { caption: 'Warning', props: { tone: 'warning' } },
        { caption: 'Error', props: { tone: 'error' } },
      ],
    },
    {
      key: 'Snackbar',
      setName: 'DS/Snackbar',
      eyebrow: 'MOLECULE · FEEDBACK',
      desc: '하단에서 간단한 메시지와 실행취소를 제공하는 바. 실행 문구는 actionLabel, 닫기는 showClose 속성입니다.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Snackbar', [{ name: 'variant', values: ['default', 'success', 'error'] }], (c) => renderSnackbar(ctx, c), { texts: [{ prop: 'message', layer: 'message', def: '링크를 복사했어요.' }, { prop: 'actionLabel', layer: 'action', def: '실행 취소' }], bools: [{ prop: 'showClose', layer: 'close', def: false }] }),
      states: [
        { caption: 'Default', props: {} },
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
        buildSet(ctx, page, 'DS/Tooltip', [{ name: 'placement', values: ['bottom', 'top', 'left', 'right'] }], (c) => renderTooltip(ctx, c), { texts: [{ prop: 'content', layer: 'content', def: '도움말 텍스트' }] }),
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
      desc: '처리 중임을 나타내는 로딩 표시. overlay 축은 부모를 덮는 반투명 면 위 중앙 배치입니다.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Loading', [{ name: 'variant', values: ['spinner', 'dots'] }, { name: 'size', values: ['md', 'sm', 'lg'] }, { name: 'overlay', values: ['false', 'true'] }], (c) => renderLoading(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '불러오는 중…' }] }),
      states: [
        { caption: 'Spinner', props: {} },
        { caption: 'Dots', props: { variant: 'dots' } },
        { caption: 'Small', props: { size: 'sm' } },
        { caption: 'Large', props: { size: 'lg' } },
        { caption: 'Overlay', props: { overlay: 'true' } },
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
      build: (ctx, page) => buildSet(ctx, page, 'DS/Callout', [{ name: 'tone', values: ['info', 'success', 'warning', 'error'] }], (c) => renderCallout(ctx, c), { texts: [{ prop: 'title', layer: 'title', def: '안내 제목' }, { prop: 'content', layer: 'content', def: '강조해서 보여줄 안내 문구를 담습니다.' }] }),
      states: [{ caption: 'Info', props: {} }, { caption: 'Success', props: { tone: 'success' } }, { caption: 'Warning', props: { tone: 'warning' } }, { caption: 'Error', props: { tone: 'error' } }],
    },
  ],
}
