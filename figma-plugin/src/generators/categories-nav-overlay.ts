// 카테고리: Navigation · Layout · Overlay · Structure.
// categories.ts에서 기계적으로 분리(동작 변경 없음). 공용 부품은 categories-shared.ts.
import { bindFillVar, bindSolidFill, bindStrokeVar, boundText, type CategoryDef, fieldRow, fixedFrame, krFormCard, krPrimaryBtn, krSubField, onHex, PAGE_LAYOUT, PAGE_NAV, PAGE_OVERLAY, PAGE_STRUCTURE, recolorIcon, recolorIconOn } from './categories-shared'
import { ACCENT, autoFrame, BORDER, type Ctx, INK, MUTED, SUB, SURFACE, WHITE } from './foundations'
import { iconInstance } from './icon-vec'
import { buildSet } from './lib/build-set'
import { onVarName } from './tone'

// ══ NAVIGATION (Tab / Breadcrumb / Pagination / Dropdown) ════════════
function renderTab(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const active = combo.active === 'true'
  const disabled = combo.disabled === 'true'
  const segmented = combo.variant === 'segmented'
  // size — React Tab.size('sm'|'md') 그대로. md는 지금까지의 치수를 한 픽셀도 바꾸지 않는다
  // (Tab.module.css: .sm .tab = xs/4·10, .md .tab = sm/6·12 — 그 비율만 Figma 치수에 옮겼다).
  const sm = combo.size === 'sm'
  const fs = sm ? 13 : 14
  const c = figma.createComponent()
  if (disabled) c.opacity = 0.45
  if (segmented) {
    // 세그먼트형: 활성 시 알약 배경, 비활성 시 연한 배경(밑줄 없음)
    c.layoutMode = 'HORIZONTAL'
    c.primaryAxisSizingMode = 'AUTO'
    c.counterAxisSizingMode = 'AUTO'
    c.counterAxisAlignItems = 'CENTER'
    c.paddingTop = c.paddingBottom = sm ? 6 : 8
    c.paddingLeft = c.paddingRight = sm ? 14 : 18
    c.cornerRadius = 999
    // 활성 세그먼트 = solid 면 + on-color 글자
    if (active) bindSolidFill(ctx, c, 'primary')
    else bindFillVar(ctx, c, 'color/bgSubtle', SURFACE)
    const t = boundText(
      ctx,
      '메뉴',
      fs,
      active ? onVarName('primary') : 'color/text',
      active ? onHex(ctx, 'primary') : INK,
      active,
    )
    t.name = 'label'
    c.appendChild(t)
    return c
  }
  // 밑줄형(기본)
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = sm ? 6 : 8
  c.paddingTop = c.paddingBottom = sm ? 3 : 4
  c.fills = []
  const t = boundText(ctx, '메뉴', fs, active ? 'color/primary' : 'color/secondary', active ? ACCENT : SUB, active)
  t.name = 'label'
  c.appendChild(t)
  const ul = figma.createRectangle()
  ul.resize(sm ? 32 : 40, 2)
  ul.cornerRadius = 1
  ul.layoutAlign = 'STRETCH'
  if (active) bindFillVar(ctx, ul, 'color/primary', ACCENT)
  else ul.fills = []
  c.appendChild(ul)
  return c
}

// ── DS/CategoryTabs — 탭 그룹(3항목 예시). variant(underline·pill) × align × rule ──
// 출처: CategoryTabs.module.css. 어드민 목록에서 쓰이므로(제목상 Admin/CategoryTabs) site-accent가 아닌
// primary를 강조색으로 쓴다(다른 admin 컴포넌트와 동일한 관례 — ViewSwitch 등 참고).
/** 탭 그룹의 항목 하나 — pill(알약 필터) / underline(라벨+2px 밑줄) 두 룩. */
function ctItem(ctx: Ctx, label: string, selected: boolean, pill: boolean, layerName: string): FrameNode {
  if (pill) {
    const item = autoFrame(layerName + ' Item', 'HORIZONTAL')
    item.counterAxisAlignItems = 'CENTER'
    item.paddingTop = item.paddingBottom = 8
    item.paddingLeft = item.paddingRight = 16
    item.cornerRadius = 999
    if (selected) bindSolidFill(ctx, item, 'primary')
    else {
      bindFillVar(ctx, item, 'color/bg', WHITE)
      bindStrokeVar(ctx, item, 'color/border', BORDER)
      item.strokeWeight = 1
      item.strokeAlign = 'INSIDE'
    }
    const t = boundText(ctx, label, 14, selected ? onVarName('primary') : 'color/text', selected ? onHex(ctx, 'primary') : INK, selected)
    t.name = layerName
    item.appendChild(t)
    return item
  }
  const item = autoFrame(layerName + ' Item', 'VERTICAL')
  item.counterAxisAlignItems = 'CENTER'
  item.itemSpacing = 8
  const t = boundText(ctx, label, 14, selected ? 'color/primary' : 'color/secondary', selected ? ACCENT : SUB, selected)
  t.name = layerName
  item.appendChild(t)
  const bar = figma.createRectangle()
  bar.name = layerName + ' Bar'
  bar.resize(32, 2)
  bar.cornerRadius = 1
  if (selected) bindFillVar(ctx, bar, 'color/primary', ACCENT)
  else bar.fills = []
  item.appendChild(bar)
  return item
}
function renderCategoryTabs(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const pill = combo.variant === 'pill'
  const center = combo.align === 'center'
  // rule: underline 룩의 컨테이너 가로선 ON/OFF(기본 true) — pill은 애초에 면 경계가 없다.
  const showRule = combo.rule !== 'false'
  const W = 460

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(W, c.height)
  c.itemSpacing = 0
  c.fills = []

  const tablist = autoFrame('Tablist', 'HORIZONTAL')
  tablist.counterAxisAlignItems = 'CENTER'
  tablist.itemSpacing = pill ? 8 : 20
  tablist.paddingBottom = pill ? 12 : 10
  tablist.appendChild(ctItem(ctx, '전체', true, pill, 'Tab 1'))
  tablist.appendChild(ctItem(ctx, '진행 중', false, pill, 'Tab 2'))
  tablist.appendChild(ctItem(ctx, '완료', false, pill, 'Tab 3'))
  // align=center — 격리된 컴포넌트에서는 여유 폭이 있어야 가운데 정렬이 보이므로
  // 고정 폭(W)으로 펼치고 그 안에서 가운데로 둔다(Pagination·Button fullWidth와 같은 패턴).
  if (center) {
    tablist.primaryAxisSizingMode = 'FIXED'
    tablist.resize(W, tablist.height)
    tablist.primaryAxisAlignItems = 'CENTER'
  }
  c.appendChild(tablist)

  if (!pill) {
    const rule = figma.createRectangle()
    rule.name = 'Rule'
    rule.resize(W, 1)
    bindFillVar(ctx, rule, 'color/border', BORDER)
    rule.visible = showRule
    c.appendChild(rule)
  }
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
function renderPagination(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  // shape: square=라운드 사각(기본) / circle=원형. align: 격리된 컴포넌트에서 좌/가운데/우측 정렬은
  // 여유 폭이 있어야 보이므로, start가 아니면 넉넉한 고정 폭(480)으로 펼치고 그 안에서 정렬한다.
  const circle = combo.shape === 'circle'
  const align = combo.align || 'start'
  // size — React Pagination.size('sm'|'md'|'lg') 그대로. md는 지금까지의 치수(칸 32 / 글자 13 / 아이콘 16)
  // 그대로이고 sm·lg만 새로 그린다. Pagination.module.css의 --item-size·--item-font가 하는 일과 같다.
  const size = combo.size || 'md'
  const cellSize = size === 'sm' ? 28 : size === 'lg' ? 36 : 32
  const cellFont = size === 'sm' ? 12 : size === 'lg' ? 14 : 13
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16
  const cellRadius = circle ? cellSize / 2 : 8
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 4
  c.fills = []
  const cell = (label: string, active: boolean) => {
    const f = fixedFrame('cell', 'HORIZONTAL', cellSize, cellSize)
    f.primaryAxisAlignItems = 'CENTER'
    f.counterAxisAlignItems = 'CENTER'
    f.cornerRadius = cellRadius
    // 현재 페이지 = solid 면 + on-color 숫자
    if (active) bindSolidFill(ctx, f, 'primary')
    else {
      bindFillVar(ctx, f, 'color/bg', WHITE)
      bindStrokeVar(ctx, f, 'color/border', BORDER)
      f.strokeWeight = 1
      f.strokeAlign = 'INSIDE'
    }
    f.appendChild(
      boundText(
        ctx,
        label,
        cellFont,
        active ? onVarName('primary') : 'color/text',
        active ? onHex(ctx, 'primary') : INK,
        active,
      ),
    )
    return f
  }
  const arrow = (key: string, name: string) => {
    const f = fixedFrame(name, 'HORIZONTAL', cellSize, cellSize)
    f.primaryAxisAlignItems = 'CENTER'
    f.counterAxisAlignItems = 'CENTER'
    f.cornerRadius = cellRadius
    bindFillVar(ctx, f, 'color/bg', WHITE)
    bindStrokeVar(ctx, f, 'color/border', BORDER)
    f.strokeWeight = 1
    f.strokeAlign = 'INSIDE'
    const i = iconInstance(key, 'Arrow', iconSize)
    recolorIcon(i, SUB)
    f.appendChild(i)
    return f
  }
  // 처음·끝 버튼(React showFirstLast, 기본 false)은 항상 그려 두되 visible=false로 시작한다 —
  // 기본 렌더가 지금과 똑같아야 하기 때문이다(§4 "기본값 = 현재 동작"). BOOLEAN 속성이 이걸 켠다.
  // 레이어 이름을 두 프레임 모두 'showFirstLast'로 맞춘 건 addBoolProp이 findAll(name===layer)로
  // 바인딩하기 때문 — 하나의 속성이 처음·끝 버튼을 한 쌍으로 켜고 끈다(따로 켜지는 일이 없어야 한다).
  const first = arrow('_Icon/ChevronsLeft', 'showFirstLast')
  first.visible = false
  c.appendChild(first)
  c.appendChild(arrow('_Icon/ChevronLeft', 'arrow'))
  c.appendChild(cell('1', true))
  c.appendChild(cell('2', false))
  c.appendChild(cell('3', false))
  const ell = boundText(ctx, '…', cellFont, 'color/secondary', MUTED)
  ell.name = 'ellipsis'
  c.appendChild(ell)
  c.appendChild(cell('10', false))
  c.appendChild(arrow('_Icon/ChevronRight', 'arrow'))
  const last = arrow('_Icon/ChevronsRight', 'showFirstLast')
  last.visible = false
  c.appendChild(last)
  if (align !== 'start') {
    c.primaryAxisSizingMode = 'FIXED'
    c.resize(480, c.height)
    c.primaryAxisAlignItems = align === 'center' ? 'CENTER' : 'MAX'
  }
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
  title.name = 'title'
  c.appendChild(title)
  // 본문은 React Card의 children이다 → 규약 §7대로 슬롯 레이어 이름은 'content'.
  const body = boundText(ctx, '카드 본문 텍스트가 들어갑니다. 여러 줄로 늘어날 수 있어요.', 13, 'color/secondary', SUB)
  body.name = 'content'
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
    bindSolidFill(ctx, btn, 'primary')
    btn.appendChild(boundText(ctx, '확인', 13, onVarName('primary'), onHex(ctx, 'primary'), true))
    f.appendChild(btn)
    c.appendChild(f)
  }
  return c
}
function renderList(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  // divider·selectable — React List의 같은 이름 prop 그대로.
  // 두 축의 기본값을 'true'로 둔 건 지금까지 이 세트가 그리던 그림(행 사이 실선 + 첫 행 강조)이
  // 곧 기본 변형이어야 하기 때문이다(§4 "기본값 = 현재 동작"). React 쪽 기본값과는 별개다.
  const divider = combo.divider !== 'false'
  const selectable = combo.selectable !== 'false'
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
    if (idx > 0 && divider) {
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
    const selected = selectable && idx === 0 // 대표: 선택된 행
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
  title.name = 'title'
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
    t.name = 'label'
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
  title.name = 'title'
  header.appendChild(title)
  // 닫기 아이콘 레이어는 CSS 클래스 이름(.close) 그대로 — showClose BOOLEAN이 여기에 붙는다(규약 §6).
  const close = iconInstance('_Icon/Close', 'close', 20)
  recolorIcon(close, SUB)
  header.appendChild(close)
  c.appendChild(header)
  const body = autoFrame('body', 'VERTICAL')
  body.layoutAlign = 'STRETCH'
  body.primaryAxisSizingMode = 'FIXED'
  body.paddingLeft = 20
  body.paddingRight = 20
  body.paddingBottom = 20
  // 본문은 React Modal의 children이다 → 슬롯 레이어 이름은 'content'(규약 §7).
  const bt = boundText(ctx, '모달 본문 내용이 여기에 표시됩니다. 사용자에게 필요한 설명을 담습니다.', 14, 'color/secondary', SUB)
  bt.name = 'content'
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
  bindSolidFill(ctx, confirm, 'primary')
  const cf = boundText(ctx, '확인', 14, onVarName('primary'), onHex(ctx, 'primary'), true)
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
  title.name = 'title'
  c.appendChild(title)
  // 레이어 이름은 전부 React prop / CSS 클래스 이름 그대로다(규약 §4·§6):
  // 본문=description(.description), 입력=input(.input), 버튼 라벨=confirmLabel·cancelLabel(prop 이름).
  const msg = boundText(ctx, danger ? '이 작업은 되돌릴 수 없습니다.' : '선택한 작업을 진행합니다.', 14, 'color/secondary', SUB)
  msg.name = 'description'
  msg.textAlignHorizontal = 'CENTER'
  c.appendChild(msg)
  if (variant === 'prompt') {
    const field = fieldRow(ctx, null, null, false)
    field.layoutAlign = 'STRETCH'
    const v = boundText(ctx, '입력하세요', 15, 'color/secondary', MUTED)
    v.name = 'input'
    v.layoutGrow = 1
    field.appendChild(v)
    c.appendChild(field)
  }
  const footer = autoFrame('footer', 'HORIZONTAL')
  footer.layoutAlign = 'STRETCH'
  footer.primaryAxisSizingMode = 'FIXED'
  footer.itemSpacing = 8
  footer.paddingTop = 12
  const mkBtn = (label: string, layer: string, primary: boolean) => {
    const b = autoFrame('action', 'HORIZONTAL')
    b.layoutGrow = 1
    b.primaryAxisAlignItems = 'CENTER'
    b.counterAxisAlignItems = 'CENTER'
    b.paddingTop = b.paddingBottom = 10
    b.cornerRadius = 8
    // 주 버튼(확인/삭제) = solid 면 + on-color 글자. 보조 버튼(취소)은 옅은 배경 + 본문색.
    const tone = danger ? 'error' : 'primary'
    if (primary) bindSolidFill(ctx, b, tone)
    else bindFillVar(ctx, b, 'color/bgSubtle', SURFACE)
    const t = boundText(ctx, label, 14, primary ? onVarName(tone) : 'color/text', primary ? onHex(ctx, tone) : INK, true)
    t.name = layer
    b.appendChild(t)
    return b
  }
  if (variant === 'alert') {
    footer.appendChild(mkBtn('확인', 'confirmLabel', true))
  } else {
    footer.appendChild(mkBtn('취소', 'cancelLabel', false))
    footer.appendChild(mkBtn(danger ? '삭제' : '확인', 'confirmLabel', true))
  }
  c.appendChild(footer)
  return c
}
function renderPopover(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  // placement 값은 React Popover의 유니온 그대로다: 'bottom-start' | 'bottom-end'.
  // (예전엔 top/bottom을 그렸는데 React는 위로 여는 배치가 없다 — 코드에 없는 그림을 문서가 보여주고 있었다.)
  // 패널이 항상 트리거 '아래'에 뜨므로 화살표는 늘 버블 위쪽에 붙고, 축은 그 화살표가
  // 트리거의 왼쪽 모서리(start)에 서는지 오른쪽 모서리(end)에 서는지만 가른다.
  const end = combo.placement === 'bottom-end'
  const W = 220
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 0
  c.fills = []
  // 화살표 줄 — showArrow BOOLEAN이 이 줄을 통째로 감춘다(레이어 이름 = CSS 클래스 .arrow).
  // 삼각형만 감추면 6px짜리 빈 줄이 남아 버블이 아래로 밀리므로 줄과 삼각형에 같은 이름을 준다
  // (addBoolProp은 findAll(name===layer)로 바인딩한다).
  const arrowRow = fixedFrame('arrow', 'HORIZONTAL', W, 6)
  arrowRow.paddingLeft = arrowRow.paddingRight = 16
  arrowRow.primaryAxisAlignItems = end ? 'MAX' : 'MIN'
  const tri = figma.createVector()
  tri.name = 'arrow'
  tri.vectorPaths = [{ windingRule: 'NONZERO', data: 'M0 6 L12 6 L6 0 Z' }]
  bindFillVar(ctx, tri, 'color/bg', WHITE)
  tri.strokes = []
  arrowRow.appendChild(tri)
  c.appendChild(arrowRow)
  const bubble = autoFrame('bubble', 'VERTICAL')
  bubble.counterAxisSizingMode = 'FIXED'
  bubble.resize(W, bubble.height)
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
  title.name = 'title'
  bubble.appendChild(title)
  // 본문 = React Popover의 children → 슬롯 레이어 이름은 'content'(규약 §7).
  const body = boundText(ctx, '간단한 부가 설명을 담는 팝오버입니다.', 13, 'color/secondary', SUB)
  body.name = 'content'
  body.layoutAlign = 'STRETCH'
  body.textAutoResize = 'HEIGHT'
  bubble.appendChild(body)
  c.appendChild(bubble)
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
  title.name = 'title'
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
  title.name = 'title'
  c.appendChild(title)
  // 본문 = React BottomSheet의 children → 슬롯 레이어 이름은 'content'(규약 §7).
  const body = boundText(ctx, '아래에서 원하는 항목을 선택하세요.', 14, 'color/secondary', SUB)
  body.name = 'content'
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
  // 취소 라벨 레이어는 CSS 클래스(.cancel) 그대로 — TEXT 속성 이름은 React prop인 cancelLabel이다(§4·§6).
  const ct = boundText(ctx, '취소', 15, 'color/primary', ACCENT, true)
  ct.name = 'cancel'
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
  bindSolidFill(ctx, btn, 'primary')
  const t = boundText(ctx, label, 14, onVarName('primary'), onHex(ctx, 'primary'), true)
  t.name = name
  btn.appendChild(t)
  return btn
}
function avatarCircle(ctx: Ctx, size: number): FrameNode {
  const a = figma.createFrame()
  a.name = 'Avatar'
  a.resize(size, size)
  a.cornerRadius = 999
  bindSolidFill(ctx, a, 'primary')
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
  brandT.name = 'brand'
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
function renderHeader(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  // divider — React Header.divider(기본 true) 그대로. 하단 보더 한 줄의 ON/OFF다(.divider).
  const divider = combo.divider !== 'false'
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
  if (divider) bottomBorder(ctx, c)
  const left = autoFrame('left', 'HORIZONTAL')
  left.counterAxisAlignItems = 'CENTER'
  left.itemSpacing = 12
  const menu = iconInstance('_Icon/Menu', 'Menu Icon', 22)
  recolorIcon(menu, INK)
  left.appendChild(menu)
  const title = boundText(ctx, '페이지 제목', 17, 'color/text', INK, true)
  title.name = 'title'
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
  copy.name = 'copyright'
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
function renderSidebar(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  // collapsed — React Sidebar.collapsed(미니 모드) 그대로. 아이콘만 남기고 폭을 64로 줄인다
  // (Sidebar.module.css의 .mini: 항목 가운데 정렬 + 라벨 숨김). 기본값 false = 지금까지의 그림.
  const collapsed = combo.collapsed === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(collapsed ? 64 : 240, c.height)
  c.itemSpacing = 4
  c.paddingTop = c.paddingBottom = 16
  c.paddingLeft = c.paddingRight = collapsed ? 8 : 12
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
  brand.primaryAxisAlignItems = collapsed ? 'CENTER' : 'MIN'
  brand.itemSpacing = 8
  brand.paddingLeft = collapsed ? 0 : 8
  brand.paddingTop = 4
  brand.paddingBottom = 12
  const logo = iconInstance('_Icon/Sparkles', 'Brand Icon', 22)
  recolorIcon(logo, ACCENT)
  brand.appendChild(logo)
  // 미니 모드는 워드마크를 그리지 않는다 — 'brand' TEXT 속성은 펼친 변형에만 붙는다.
  if (!collapsed) {
    const brandT = boundText(ctx, 'TDS Console', 16, 'color/text', INK, true)
    brandT.name = 'brand'
    brand.appendChild(brandT)
  }
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
    r.primaryAxisAlignItems = collapsed ? 'CENTER' : 'MIN'
    r.itemSpacing = 12
    r.paddingTop = r.paddingBottom = 11
    r.paddingLeft = r.paddingRight = collapsed ? 0 : 12
    r.cornerRadius = 8
    if (i === 0) bindFillVar(ctx, r, 'color/bgSubtle', SURFACE)
    const ic = iconInstance(icon, 'Icon ' + (i + 1), 18)
    recolorIcon(ic, i === 0 ? ACCENT : SUB)
    r.appendChild(ic)
    if (!collapsed) {
      const t = boundText(ctx, label, 14, i === 0 ? 'color/primary' : 'color/text', i === 0 ? ACCENT : INK, i === 0)
      t.name = 'Item ' + (i + 1)
      r.appendChild(t)
    }
    c.appendChild(r)
  })
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
  bindSolidFill(ctx, box, 'primary')
  const ck = iconInstance('_Icon/Check', 'check', 13)
  recolorIconOn(ctx, ck, 'primary')
  box.appendChild(ck)
  agree.appendChild(box)
  agree.appendChild(boundText(ctx, '개인정보 수집에 동의합니다', 13, 'color/secondary', SUB))
  add(agree)
  // 공용 krPrimaryBtn은 라벨 레이어를 'Submit'으로 만든다(여러 세트가 공유하는 부품이라 손대지 않는다).
  // 이 세트에서만 React Form.submitLabel prop 이름으로 바꿔 TEXT 속성이 붙을 자리를 만든다(규약 §4).
  const submit = krPrimaryBtn(ctx, '보내기')
  const submitLabel = submit.findOne((n) => n.type === 'TEXT' && n.name === 'Submit')
  if (submitLabel) submitLabel.name = 'submitLabel'
  add(submit)
  return c
}

export const NAVIGATION_CATEGORY: CategoryDef = {
  pageName: PAGE_NAV,
  title: 'Navigation',
  subtitle: '내비게이션 계열 — 이동·탐색 컨트롤. Tab · CategoryTabs · Breadcrumb · Pagination · Dropdown.',
  docs: [
    {
      key: 'Tab',
      setName: 'DS/Tab',
      eyebrow: 'MOLECULE · NAVIGATION',
      desc: '섹션을 전환하는 탭 아이템(활성/비활성). variant(underline·segmented) × size(md·sm) 축입니다.',
      // size는 React Tab.size와 같은 축이다. 축 4개라 2×2×2×2 = 16변형(권장 상한 40 안).
      build: (ctx, page) => buildSet(ctx, page, 'DS/Tab', [{ name: 'active', values: ['false', 'true'] }, { name: 'variant', values: ['underline', 'segmented'] }, { name: 'disabled', values: ['false', 'true'] }, { name: 'size', values: ['md', 'sm'] }], (c) => renderTab(ctx, c), { texts: [{ prop: 'Label', layer: 'label', def: '메뉴' }] }),
      states: [{ caption: 'Underline (Active)', props: { active: 'true' } }, { caption: 'Underline', props: {} }, { caption: 'Segmented (Active)', props: { active: 'true', variant: 'segmented' } }, { caption: 'Segmented', props: { variant: 'segmented' } }, { caption: 'Small', props: { size: 'sm' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'CategoryTabs',
      setName: 'DS/CategoryTabs',
      eyebrow: 'MOLECULE · NAVIGATION',
      desc:
        '탭 그룹(전체·진행 중·완료 3개 예시). variant(underline·pill) × align(start·center) × rule(가로선) 축입니다. ' +
        '항목 라벨은 Tab 1/Tab 2/Tab 3 TEXT 속성으로 편집합니다. (추가·삭제 입력은 문서화 범위 밖 — Figma는 정적 세트입니다.)',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/CategoryTabs',
          [
            { name: 'variant', values: ['underline', 'pill'] },
            { name: 'align', values: ['start', 'center'] },
            { name: 'rule', values: ['true', 'false'] },
          ],
          (c) => renderCategoryTabs(ctx, c),
          {
            texts: [
              { prop: 'Tab 1', layer: 'Tab 1', def: '전체' },
              { prop: 'Tab 2', layer: 'Tab 2', def: '진행 중' },
              { prop: 'Tab 3', layer: 'Tab 3', def: '완료' },
            ],
          },
        ),
      states: [
        { caption: 'Underline (기본)', props: {} },
        { caption: 'Pill', props: { variant: 'pill' } },
        { caption: 'Center', props: { align: 'center' } },
        { caption: 'No Rule', props: { rule: 'false' } },
      ],
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
      desc:
        '페이지를 넘기는 페이지네이션. shape(square·circle) × align(start·center·end) × size(md·sm·lg) 축을 가집니다. ' +
        '처음·끝 버튼은 showFirstLast BOOLEAN, 생략기호 문구는 labels.ellipsis TEXT 속성입니다.',
      // 2 × 3 × 3 = 18변형(권장 상한 40 안).
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/Pagination',
          [
            { name: 'shape', values: ['square', 'circle'] },
            { name: 'align', values: ['start', 'center', 'end'] },
            { name: 'size', values: ['md', 'sm', 'lg'] },
          ],
          (c) => renderPagination(ctx, c),
          {
            // 화면에 글자로 그려지는 문구는 생략기호(…) 하나뿐이다 — 나머지 labels.*는 aria 이름이다.
            texts: [{ prop: 'labels.ellipsis', layer: 'ellipsis', def: '…' }],
            bools: [{ prop: 'showFirstLast', layer: 'showFirstLast', def: false }],
          },
        ),
      states: [
        { caption: 'Square (Start)', props: {} },
        { caption: 'Circle', props: { shape: 'circle' } },
        { caption: 'Center', props: { align: 'center' } },
        { caption: 'End', props: { align: 'end' } },
        { caption: 'Small', props: { size: 'sm' } },
        { caption: 'Large', props: { size: 'lg' } },
      ],
    },
    {
      key: 'Dropdown',
      setName: 'DS/Dropdown',
      eyebrow: 'ORGANISM · NAVIGATION',
      desc: '액션·이동 항목을 담는 드롭다운 메뉴(열린 패널).',
      // 아이콘 INSTANCE_SWAP을 지웠다: React DropdownItem에는 icon 필드가 없다(label·onSelect·danger·disabled·divider뿐).
      // 대응 prop이 없는 속성은 §5를 기계적으로 위반하는 유령 슬롯이다 — 아이콘 그림 자체는 그대로 남는다.
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Dropdown', [{ name: 'state', values: ['default'] }], (c) => renderDropdown(ctx, c), {
          texts: [{ prop: 'Item 1', layer: 'Item 1', def: '프로필' }, { prop: 'Item 2', layer: 'Item 2', def: '설정' }, { prop: 'Item 3', layer: 'Item 3', def: '로그아웃' }],
        }),
      states: [{ caption: 'Default', props: {} }],
    },
  ],
}

export const LAYOUT_CATEGORY: CategoryDef = {
  pageName: PAGE_LAYOUT,
  title: 'Layout',
  subtitle: '레이아웃 계열 — 콘텐츠를 담고 배치하는 컨테이너. Card · List · Accordion · Divider.',
  docs: [
    {
      key: 'Card',
      setName: 'DS/Card',
      eyebrow: 'MOLECULE · LAYOUT',
      desc: '제목·본문(children)·(선택)푸터를 담는 카드.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Card', [{ name: 'footer', values: ['false', 'true'] }], (c) => renderCard(ctx, c), { texts: [{ prop: 'title', layer: 'title', def: '카드 제목' }, { prop: 'content', layer: 'content', def: '카드 본문 텍스트가 들어갑니다.' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'With Footer', props: { footer: 'true' } }],
    },
    {
      key: 'List',
      setName: 'DS/List',
      eyebrow: 'ORGANISM · LAYOUT',
      desc: '아바타·제목·설명·이동을 가진 리스트. divider(행 사이 실선) × selectable(선택 강조) 축입니다.',
      // 두 축 모두 React List의 같은 이름 prop이다. 2 × 2 = 4변형.
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/List',
          [
            { name: 'divider', values: ['true', 'false'] },
            { name: 'selectable', values: ['true', 'false'] },
          ],
          (c) => renderList(ctx, c),
          {
            texts: [
              { prop: 'Name 1', layer: 'Name 1', def: '홍길동' },
              { prop: 'Sub 1', layer: 'Sub 1', def: '디자이너' },
              { prop: 'Name 2', layer: 'Name 2', def: '김철수' },
              { prop: 'Sub 2', layer: 'Sub 2', def: '개발자' },
              { prop: 'Name 3', layer: 'Name 3', def: '이영희' },
              { prop: 'Sub 3', layer: 'Sub 3', def: '기획자' },
            ],
          },
        ),
      states: [
        { caption: 'Default', props: {} },
        { caption: 'No Divider', props: { divider: 'false' } },
        { caption: 'Not Selectable', props: { selectable: 'false' } },
      ],
    },
    {
      key: 'Accordion',
      setName: 'DS/Accordion',
      eyebrow: 'MOLECULE · LAYOUT',
      desc: '제목을 눌러 본문을 펼치고 접는 아코디언.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Accordion', [{ name: 'expanded', values: ['false', 'true'] }, { name: 'disabled', values: ['false', 'true'] }], (c) => renderAccordion(ctx, c), { texts: [{ prop: 'Title', layer: 'title', def: '섹션 제목' }, { prop: 'Body', layer: 'Body', def: '펼쳐진 본문 내용' }] }),
      states: [{ caption: 'Collapsed', props: {} }, { caption: 'Expanded', props: { expanded: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'Divider',
      setName: 'DS/Divider',
      eyebrow: 'ATOM · LAYOUT',
      desc: '콘텐츠를 나누는 구분선(라벨 옵션).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Divider', [{ name: 'label', values: ['false', 'true'] }], (c) => renderDivider(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '또는' }] }),
      states: [{ caption: 'Plain', props: {} }, { caption: 'With Label', props: { label: 'true' } }],
    },
    {
      key: 'Form',
      setName: 'DS/Form',
      eyebrow: 'ORGANISM · LAYOUT',
      desc: '라벨 필드 + 동의 + 제출 버튼의 폼.',
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/Form', [{ name: 'state', values: ['default'] }], (c) => renderForm(ctx, c), {
          texts: [
            { prop: 'title', layer: 'title', def: '문의하기' },
            { prop: 'submitLabel', layer: 'submitLabel', def: '보내기' },
          ],
        }),
      states: [{ caption: 'Default', props: {} }],
    },
  ],
}

export const OVERLAY_CATEGORY: CategoryDef = {
  pageName: PAGE_OVERLAY,
  title: 'Overlay',
  subtitle: '오버레이 계열 — 화면 위에 떠서 상호작용하는 표면. Modal · Dialog · Popover.',
  docs: [
    {
      key: 'Modal',
      setName: 'DS/Modal',
      eyebrow: 'ORGANISM · OVERLAY',
      desc: '제목·본문(children)·액션 버튼을 담는 모달 대화상자. 닫기 버튼은 showClose BOOLEAN입니다.',
      // 'Close Icon' INSTANCE_SWAP을 지웠다 — React Modal에는 아이콘 slot prop이 없다(showClose 불리언뿐).
      // 아이콘 그림은 그대로 남고, 이제 그 레이어(.close)에는 showClose가 붙는다.
      build: (ctx, page) => buildSet(ctx, page, 'DS/Modal', [{ name: 'size', values: ['md', 'sm', 'lg'] }], (c) => renderModal(ctx, c), { texts: [{ prop: 'title', layer: 'title', def: '모달 제목' }, { prop: 'content', layer: 'content', def: '모달 본문 내용' }, { prop: 'Cancel', layer: 'Cancel', def: '취소' }, { prop: 'Confirm', layer: 'Confirm', def: '확인' }], bools: [{ prop: 'showClose', layer: 'close', def: true }] }),
      states: [{ caption: 'Medium', props: { size: 'md' } }, { caption: 'Small', props: { size: 'sm' } }, { caption: 'Large', props: { size: 'lg' } }],
    },
    {
      key: 'Dialog',
      setName: 'DS/Dialog',
      eyebrow: 'MOLECULE · OVERLAY',
      desc: '확인/취소를 묻는 간단한 다이얼로그.',
      // TEXT 속성 이름을 전부 React prop 이름으로 맞췄다(Body→description, Cancel→cancelLabel, Confirm→confirmLabel).
      // placeholder는 prompt 변형의 입력창(.input)에만 붙는다 — 다른 변형엔 그 레이어가 없다.
      build: (ctx, page) => buildSet(ctx, page, 'DS/Dialog', [{ name: 'variant', values: ['confirm', 'alert', 'prompt'] }, { name: 'danger', values: ['false', 'true'] }], (c) => renderDialog(ctx, c), { texts: [{ prop: 'title', layer: 'title', def: '계속하시겠어요?' }, { prop: 'description', layer: 'description', def: '선택한 작업을 진행합니다.' }, { prop: 'cancelLabel', layer: 'cancelLabel', def: '취소' }, { prop: 'confirmLabel', layer: 'confirmLabel', def: '확인' }, { prop: 'placeholder', layer: 'input', def: '입력하세요' }] }),
      states: [{ caption: 'Confirm', props: {} }, { caption: 'Alert', props: { variant: 'alert' } }, { caption: 'Prompt', props: { variant: 'prompt' } }, { caption: 'Danger', props: { danger: 'true' } }],
    },
    {
      key: 'Popover',
      setName: 'DS/Popover',
      eyebrow: 'MOLECULE · OVERLAY',
      desc: '트리거 아래에 붙는 작은 부가정보 팝오버. placement(bottom-start·bottom-end) 축입니다.',
      // placement 값은 React Popover의 유니온 그대로다. showArrow는 React 기본이 false지만 Figma 기본 변형은
      // 화살표가 보이는 대표 모습을 그린다 — 지금까지 이 세트가 그리던 그림을 유지하기 위해서다(속성 기본값은 파리티 검사 대상이 아니다).
      build: (ctx, page) => buildSet(ctx, page, 'DS/Popover', [{ name: 'placement', values: ['bottom-start', 'bottom-end'] }], (c) => renderPopover(ctx, c), { texts: [{ prop: 'title', layer: 'title', def: '팝오버 제목' }, { prop: 'content', layer: 'content', def: '간단한 부가 설명' }], bools: [{ prop: 'showArrow', layer: 'arrow', def: true }] }),
      states: [{ caption: 'Bottom Start', props: {} }, { caption: 'Bottom End', props: { placement: 'bottom-end' } }],
    },
    {
      key: 'Drawer',
      setName: 'DS/Drawer',
      eyebrow: 'ORGANISM · OVERLAY',
      desc: '측면에서 밀려나오는 내비게이션 드로어.',
      // 아이콘 INSTANCE_SWAP을 지웠다 — React Drawer는 items 배열이 아니라 children(ReactNode)을 받는다.
      // 즉 이 아이콘들에 대응하는 prop이 애초에 없다(§5 유령 슬롯). 그림은 그대로 남는다.
      build: (ctx, page) => buildSet(ctx, page, 'DS/Drawer', [{ name: 'side', values: ['right', 'left'] }], (c) => renderDrawer(ctx, c), { texts: [{ prop: 'title', layer: 'title', def: '메뉴' }, { prop: 'Item 1', layer: 'Item 1', def: '홈' }, { prop: 'Item 2', layer: 'Item 2', def: '프로필' }, { prop: 'Item 3', layer: 'Item 3', def: '설정' }] }),
      states: [{ caption: 'Right', props: {} }, { caption: 'Left', props: { side: 'left' } }],
    },
    {
      key: 'BottomSheet',
      setName: 'DS/BottomSheet',
      eyebrow: 'ORGANISM · OVERLAY',
      desc: '하단에서 올라오는 시트. 상단 그립바는 showHandle BOOLEAN입니다.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/BottomSheet', [{ name: 'state', values: ['default'] }], (c) => renderBottomSheet(ctx, c), { texts: [{ prop: 'title', layer: 'title', def: '옵션 선택' }, { prop: 'content', layer: 'content', def: '아래에서 원하는 항목을 선택하세요.' }], bools: [{ prop: 'showHandle', layer: 'handle', def: true }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'ActionSheet',
      setName: 'DS/ActionSheet',
      eyebrow: 'MOLECULE · OVERLAY',
      desc: '하단 액션 목록 시트(취소 포함).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/ActionSheet', [{ name: 'state', values: ['default'] }], (c) => renderActionSheet(ctx, c), { texts: [{ prop: 'Action 1', layer: 'Action 1', def: '공유하기' }, { prop: 'Action 2', layer: 'Action 2', def: '수정하기' }, { prop: 'Action 3', layer: 'Action 3', def: '삭제하기' }, { prop: 'cancelLabel', layer: 'cancel', def: '취소' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
  ],
}

export const STRUCTURE_CATEGORY: CategoryDef = {
  pageName: PAGE_STRUCTURE,
  title: 'Structure',
  subtitle: '앱 뼈대(레이아웃 구조) 계열 — 페이지 상하좌우를 잡는 큰 골격. Navbar · Header · Footer · Sidebar.',
  docs: [
    {
      key: 'Navbar',
      setName: 'DS/Navbar',
      eyebrow: 'ORGANISM · STRUCTURE',
      desc: '브랜드 + 내비 링크 + CTA로 구성된 상단 내비게이션 바.',
      // 'Brand Icon' INSTANCE_SWAP을 지웠다 — React Navbar.brand는 string(워드마크)이고 로고 아이콘 slot prop이 없다.
      // 로고 그림은 그대로 남는다(장식). 대응 prop 없는 스왑은 §5 유령 슬롯이다.
      build: (ctx, page) => buildSet(ctx, page, 'DS/Navbar', [{ name: 'state', values: ['default'] }], (c) => renderNavbar(ctx, c), { texts: [{ prop: 'brand', layer: 'brand', def: 'TDS' }, { prop: 'Link 1', layer: 'Link 1', def: '홈' }, { prop: 'Link 2', layer: 'Link 2', def: '제품' }, { prop: 'Link 3', layer: 'Link 3', def: '가격' }, { prop: 'CTA', layer: 'CTA', def: '시작하기' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Header',
      setName: 'DS/Header',
      eyebrow: 'ORGANISM · STRUCTURE',
      desc: '메뉴·제목 + 검색·알림·아바타의 앱 헤더. divider(하단 보더) 축입니다.',
      // 아이콘 INSTANCE_SWAP 3개(Menu·Search·Bell)를 지웠다 — React Header의 slot prop은 breadcrumb·actions뿐이고
      // 이 아이콘들에 대응하는 prop이 없다(§5 유령 슬롯). 아이콘 그림은 그대로 남는다.
      build: (ctx, page) => buildSet(ctx, page, 'DS/Header', [{ name: 'divider', values: ['true', 'false'] }], (c) => renderHeader(ctx, c), { texts: [{ prop: 'title', layer: 'title', def: '페이지 제목' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'No Divider', props: { divider: 'false' } }],
    },
    {
      key: 'Footer',
      setName: 'DS/Footer',
      eyebrow: 'ORGANISM · STRUCTURE',
      desc: '저작권 표기 + 링크로 구성된 하단 푸터.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Footer', [{ name: 'state', values: ['default'] }], (c) => renderFooter(ctx, c), { texts: [{ prop: 'copyright', layer: 'copyright', def: '© 2026 TDS. All rights reserved.' }, { prop: 'Link 1', layer: 'Link 1', def: '이용약관' }, { prop: 'Link 2', layer: 'Link 2', def: '개인정보' }, { prop: 'Link 3', layer: 'Link 3', def: '문의' }] }),
      states: [{ caption: 'Default', props: {} }],
    },
    {
      key: 'Sidebar',
      setName: 'DS/Sidebar',
      eyebrow: 'ORGANISM · STRUCTURE',
      desc: '브랜드 + 세로 내비 항목의 사이드바(활성 상태 포함). collapsed(미니 모드) 축입니다.',
      // TEXT 'Brand' → 'brand'(React prop 이름 그대로). 'Brand Icon' 스왑은 지웠다 —
      // React Sidebar.brand는 ReactNode 슬롯 하나이고 별도 로고 아이콘 prop이 없다.
      // Icon 1~3은 남긴다: SidebarItem.icon(ReactNode)이 실재하는 항목별 아이콘이라 교체 수단이 필요하다.
      build: (ctx, page) => buildSet(ctx, page, 'DS/Sidebar', [{ name: 'collapsed', values: ['false', 'true'] }], (c) => renderSidebar(ctx, c), { texts: [{ prop: 'brand', layer: 'brand', def: 'TDS Console' }, { prop: 'Item 1', layer: 'Item 1', def: '홈' }, { prop: 'Item 2', layer: 'Item 2', def: '대시보드' }, { prop: 'Item 3', layer: 'Item 3', def: '설정' }], swaps: [{ prop: 'Icon 1', layer: 'Icon 1', defKey: '_Icon/House' }, { prop: 'Icon 2', layer: 'Icon 2', defKey: '_Icon/Grid' }, { prop: 'Icon 3', layer: 'Icon 3', defKey: '_Icon/Settings' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Collapsed', props: { collapsed: 'true' } }],
    },
  ],
}
