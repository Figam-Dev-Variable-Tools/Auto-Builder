// 카테고리: Data · Date&Time · KR · Media · Templates · ETC.
// categories.ts에서 기계적으로 분리(동작 변경 없음). 공용 부품은 categories-shared.ts.
import { brandLogo } from './brand-logos'
import { bindFillVar, bindOnFill, bindSolidFill, bindStrokeVar, boundText, type CategoryDef, type ComponentDoc, FIELD_W, fieldRow, inputShell, krFormCard, krPrimaryBtn, type KrSpec, krSubField, krTrailingBtn, onHex, PAGE_DATA, PAGE_DATETIME, PAGE_ETC, PAGE_KR, PAGE_MEDIA, PAGE_TEMPLATES, recolorIcon, recolorIconOn, tintHex } from './categories-shared'
import { ACCENT, autoFrame, BORDER, boundPaint, type Ctx, INK, MUTED, solid, SUB, SURFACE, txt, WHITE } from './foundations'
import { iconInstance } from './icon-vec'
import { type Axis, buildSet, type PropSpec, type State } from './lib/build-set'
import { onVarName } from './tone'

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
  // 아바타 = solid 면(color/solid-primary) + on-color 이니셜
  bindSolidFill(ctx, c, 'primary')
  const initial = txt(ctx, '김', fs, onHex(ctx, 'primary'), true)
  const iv = ctx.vars.get(onVarName('primary'))
  if (iv) initial.fills = [boundPaint(iv)]
  // 레이어 = CSS 클래스(.initials). TEXT 속성은 이 글자를 만드는 React prop 이름(name)을 쓴다.
  initial.name = 'initials'
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
  // appearance=plain — 이미 보더가 있는 카드 안에 지표를 넣을 때 이중 테두리를 없앤다(Statistics.tsx).
  const plain = combo.appearance === 'plain'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(200, c.height)
  c.itemSpacing = 6
  c.paddingTop = c.paddingBottom = c.paddingLeft = c.paddingRight = plain ? 0 : 20
  c.cornerRadius = plain ? 0 : 12
  if (plain) {
    c.fills = []
    c.strokes = []
  } else {
    bindFillVar(ctx, c, 'color/bg', WHITE)
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }
  const label = boundText(ctx, '총 매출', 13, 'color/secondary', SUB)
  label.name = 'label'
  c.appendChild(label)
  const value = boundText(ctx, '₩12,400,000', 24, 'color/text', INK, true)
  value.name = 'value'
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
  // 레이어는 CSS 클래스(.delta) 그대로. 프레임도 'delta'지만 addTextProp은 TEXT만 찾으므로 겹치지 않는다.
  dt.name = 'delta'
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
  lb.name = 'label'
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
function renderCalendar(ctx: Ctx, combo: Record<string, string>): ComponentNode {
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
  if (combo.disabled === 'true') c.opacity = 0.45 // .calendar.disabled — 상호작용 불가 상태
  const header = autoFrame('header', 'HORIZONTAL')
  header.layoutAlign = 'STRETCH'
  header.primaryAxisSizingMode = 'FIXED'
  header.counterAxisAlignItems = 'CENTER'
  header.primaryAxisAlignItems = 'SPACE_BETWEEN'
  const prev = iconInstance('_Icon/ChevronLeft', 'Prev', 20)
  recolorIcon(prev, SUB)
  header.appendChild(prev)
  const title = boundText(ctx, '2026년 7월', 16, 'color/text', INK, true)
  title.name = 'title'
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
        // 선택 날짜 = solid 면 + on-color 숫자
        if (isSel) bindSolidFill(ctx, cell, 'primary')
        else if (day === today) {
          bindStrokeVar(ctx, cell, 'color/primary', ACCENT)
          cell.strokeWeight = 1
          cell.strokeAlign = 'INSIDE'
        }
        cell.appendChild(
          boundText(
            ctx,
            String(day),
            14,
            isSel ? onVarName('primary') : 'color/text',
            isSel ? onHex(ctx, 'primary') : INK,
            isSel,
          ),
        )
      }
      r.appendChild(cell)
    }
    grid.appendChild(r)
  }
  c.appendChild(grid)
  return c
}
/**
 * 날짜/시간 선택 필드(닫힌 상태). combo는 React prop 축 그대로 — disabled·error.
 * 아이콘은 INSTANCE_SWAP으로 열지 않는다: React DatePicker/TimePicker/DateRangePicker에는
 * 아이콘 ReactNode prop이 없다(§5 — 대응 prop 없는 'Icon' 속성은 유령이라 지웠다).
 */
function pickerField(ctx: Ctx, labelDef: string, valueDef: string, iconKey: string, combo: Record<string, string> = {}): ComponentNode {
  const disabled = combo.disabled === 'true'
  const error = combo.error === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.itemSpacing = 6
  c.fills = []
  c.resize(300, c.height)
  if (disabled) c.opacity = 0.45
  const label = boundText(ctx, labelDef, 13, 'color/secondary', SUB)
  label.name = 'label'
  c.appendChild(label)
  const field = autoFrame('field', 'HORIZONTAL')
  field.layoutAlign = 'STRETCH'
  field.primaryAxisSizingMode = 'FIXED'
  field.counterAxisAlignItems = 'CENTER'
  field.primaryAxisAlignItems = 'SPACE_BETWEEN'
  field.paddingTop = field.paddingBottom = 12
  field.paddingLeft = field.paddingRight = 14
  field.cornerRadius = 10
  bindFillVar(ctx, field, disabled ? 'color/bgSubtle' : 'color/bg', disabled ? SURFACE : WHITE)
  bindStrokeVar(ctx, field, error ? 'color/error' : 'color/border', error ? '#F04452' : BORDER)
  field.strokeWeight = 1
  field.strokeAlign = 'INSIDE'
  const value = boundText(ctx, valueDef, 15, 'color/text', INK)
  value.name = 'value'
  field.appendChild(value)
  const icon = iconInstance(iconKey, 'icon', 18)
  recolorIcon(icon, SUB)
  field.appendChild(icon)
  c.appendChild(field)
  return c
}

// ══ DATA 확장 (Table / Timeline / Tree / Carousel) ═══════════════════
/** 표 칸. compact(=density='compact')는 Table.module.css의 `.compact .th/.td`처럼 상하 여백만 줄인다. */
function cellFrame(w: number, padV: number, compact = false): FrameNode {
  const f = figma.createFrame()
  f.name = 'cell'
  f.layoutMode = 'HORIZONTAL'
  f.primaryAxisSizingMode = 'FIXED'
  f.counterAxisSizingMode = 'AUTO'
  f.counterAxisAlignItems = 'CENTER'
  f.paddingLeft = compact ? 10 : 14
  f.paddingRight = compact ? 6 : 8
  f.paddingTop = compact ? Math.max(4, padV - 4) : padV
  f.paddingBottom = compact ? Math.max(4, padV - 4) : padV
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
// 축은 React Table의 prop 그대로다(striped·bordered·density). 예전의 임의 축 state(default|striped|empty)는
// 지웠다 — striped는 진짜 prop이었고, empty는 prop이 아니라 rows=[] 데이터라 축이 될 수 없다.
function renderTable(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const cols = [180, 200, 140]
  const striped = combo.striped === 'true'
  const bordered = combo.bordered === 'true'
  const compact = combo.density === 'compact'
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
    const cell = cellFrame(cols[i], 12, compact)
    if (bordered) {
      bindStrokeVar(ctx, cell, 'color/border', BORDER)
      cell.strokeWeight = 1
      cell.strokeAlign = 'INSIDE'
    }
    const t = boundText(ctx, h, 13, 'color/secondary', SUB, true)
    t.name = 'Head ' + (i + 1)
    cell.appendChild(t)
    head.appendChild(cell)
  })
  c.appendChild(head)
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
    // bordered는 칸마다 테두리를 그리므로(`.bordered .th/.td`) 행 밑줄은 필요 없다.
    if (!striped && !bordered && ri < rows.length - 1) {
      bindStrokeVar(ctx, row, 'color/border', BORDER)
      row.strokeAlign = 'INSIDE'
      row.strokeTopWeight = 0
      row.strokeLeftWeight = 0
      row.strokeRightWeight = 0
      row.strokeBottomWeight = 1
    }
    const cells: Array<[number, number, SceneNode]> = [
      [cols[0], 13, boundText(ctx, r[0], 14, 'color/text', INK)],
      [cols[1], 13, boundText(ctx, r[1], 14, 'color/secondary', SUB)],
      [
        cols[2],
        10,
        r[2] === 'active'
          ? statusPill(ctx, '활성', '#E6F8F0', 'color/success', '#00C471')
          : statusPill(ctx, '대기', '#FEF3E2', 'color/warning', '#F59E0B'),
      ],
    ]
    cells.forEach(([w, padV, child]) => {
      const cell = cellFrame(w, padV, compact)
      if (bordered) {
        bindStrokeVar(ctx, cell, 'color/border', BORDER)
        cell.strokeWeight = 1
        cell.strokeAlign = 'INSIDE'
      }
      cell.appendChild(child)
      row.appendChild(cell)
    })
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
// showArrows·showDots는 React에서 축이 아니라 boolean prop이다(§3) — 축에서 내려 BOOLEAN 속성으로 선언한다.
// 그래서 화살표·도트는 항상 그리고, 가시성만 속성이 끈다(레이어 = CSS 클래스 arrow·dots).
// loop만 진짜 축이다: loop=false면 첫 슬라이드에서 이전 화살표가 disabled(.arrow:disabled → opacity .35)다.
function renderCarousel(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const loop = combo.loop !== 'false'
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
  const prev = circleBtn(ctx, '_Icon/ChevronLeft', 'arrow', 36)
  // 기본 슬라이드는 1/4(index 0)이라 loop=false면 이전 화살표가 비활성이다.
  if (!loop) prev.opacity = 0.35
  stage.appendChild(prev)
  const slide = figma.createFrame()
  slide.name = 'viewport'
  slide.layoutMode = 'HORIZONTAL'
  slide.primaryAxisSizingMode = 'FIXED'
  slide.counterAxisSizingMode = 'FIXED'
  slide.resize(320, 180)
  slide.primaryAxisAlignItems = 'CENTER'
  slide.counterAxisAlignItems = 'CENTER'
  slide.cornerRadius = 14
  slide.fills = [solid('#EEF2FF')]
  const st = boundText(ctx, '슬라이드 1 / 4', 16, 'color/primary', ACCENT, true)
  st.name = 'slide'
  slide.appendChild(st)
  stage.appendChild(slide)
  stage.appendChild(circleBtn(ctx, '_Icon/ChevronRight', 'arrow', 36))
  c.appendChild(stage)
  const dots = autoFrame('dots', 'HORIZONTAL')
  dots.counterAxisAlignItems = 'CENTER'
  dots.itemSpacing = 6
  for (let i = 0; i < 4; i++) {
    const d = figma.createFrame()
    d.name = i === 0 ? 'dotActive' : 'dot'
    d.resize(i === 0 ? 18 : 8, 8)
    d.cornerRadius = 999
    bindFillVar(ctx, d, i === 0 ? 'color/primary' : 'color/border', i === 0 ? ACCENT : BORDER)
    dots.appendChild(d)
  }
  c.appendChild(dots)
  return c
}
/**
 * 컴포넌트형 단일 KR 필드.
 *
 * 축은 React prop 그대로다 — disabled / error / success (전부 InputBase로 내려가는 boolean).
 * 예전엔 Figma에만 있는 임의 축 state(default|filled|error|disabled)를 썼는데, 그 'filled'가 사실
 * InputBase의 success(초록 보더 + 입력된 글자)와 같은 그림이었다. 이름만 코드로 바꾼 게 아니라
 * 축을 코드 구조에 맞춰 다시 짠 것이다 — 그려지는 그림 자체는 그대로다.
 * (validate·foreigner는 그리지 않는다: 값의 유효성/명칭만 바꾸는 동작 prop이라 정적 변형이 중복된다.)
 */
function krField(ctx: Ctx, spec: KrSpec, combo: Record<string, string>, valueName = 'value'): ComponentNode {
  const disabled = combo.disabled === 'true'
  const error = combo.error === 'true'
  const success = combo.success === 'true'
  // error·success는 값이 입력된 뒤에만 나오는 상태다 → 글자는 placeholder(회색)가 아니라 본문(INK).
  const hasValue = error || success
  const { c, addField } = inputShell(ctx, spec.label, disabled)
  if (spec.narrow) c.resize(200, c.height)
  const toneVar = error ? 'color/error' : success ? 'color/success' : null
  const toneHex = error ? '#F04452' : success ? '#00C471' : null
  const row = fieldRow(ctx, toneVar, toneHex, disabled)
  const val = boundText(ctx, spec.ph, 15, hasValue ? 'color/text' : 'color/secondary', hasValue ? INK : MUTED)
  // 레이어 = 이 글자를 만드는 React prop 이름(대개 value, KrPostcodeSearch만 postcode).
  val.name = valueName
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
    // 레이어 = 이 글자를 만드는 React prop 이름(helperText).
    h.name = 'helperText'
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
    // 완료·진행 중 마커 = solid 면 + on-color 체크/번호
    const strong = done || active
    if (strong) bindSolidFill(ctx, marker, 'primary')
    else bindFillVar(ctx, marker, 'color/bgSubtle', SURFACE)
    if (done) {
      const ck = iconInstance('_Icon/Check', 'c', 14)
      recolorIconOn(ctx, ck, 'primary')
      marker.appendChild(ck)
    } else {
      marker.appendChild(
        boundText(ctx, String(i + 1), 12, active ? onVarName('primary') : 'color/secondary', active ? onHex(ctx, 'primary') : MUTED, true),
      )
    }
    item.appendChild(marker)
    item.appendChild(boundText(ctx, s, 13, active ? 'color/text' : 'color/secondary', active ? INK : SUB, active))
    c.appendChild(item)
  })
  return c
}
// 통신사 선택 — 필-버튼 라디오 그룹(wrap)
function renderKrCarrier(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(320, c.height)
  c.itemSpacing = 8
  c.fills = []
  if (combo.disabled === 'true') c.opacity = 0.45 // .pill:disabled
  const lbl = boundText(ctx, '통신사', 13, 'color/text', INK, true)
  lbl.name = 'label'
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
    // 선택된 통신사 = solid 면 + on-color 글자
    if (sel) bindSolidFill(ctx, p, 'primary')
    else {
      bindFillVar(ctx, p, 'color/bgSubtle', SURFACE)
      bindStrokeVar(ctx, p, 'color/border', BORDER)
      p.strokeWeight = 1
      p.strokeAlign = 'INSIDE'
    }
    p.appendChild(
      boundText(ctx, n, 13, sel ? onVarName('primary') : 'color/text', sel ? onHex(ctx, 'primary') : INK, sel),
    )
    wrap.appendChild(p)
  })
  c.appendChild(wrap)
  return c
}
// 본인인증 수단 선택 — 카드형 행 리스트
function renderKrAuthMethod(ctx: Ctx, combo: Record<string, string>): ComponentNode {
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
  if (combo.disabled === 'true') c.opacity = 0.45
  const lbl = boundText(ctx, '본인인증 수단', 13, 'color/text', INK, true)
  lbl.name = 'label'
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
    t.name = 'title'
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
function renderKrSignature(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(320, c.height)
  c.itemSpacing = 10
  c.fills = []
  if (combo.disabled === 'true') c.opacity = 0.45 // .canvas.disabled
  const lbl = boundText(ctx, '전자서명', 13, 'color/text', INK, true)
  lbl.name = 'label'
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
function renderKrAutocomplete(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const disabled = combo.disabled === 'true'
  const error = combo.error === 'true'
  const { c, addField } = inputShell(ctx, '주소', disabled)
  const row = fieldRow(ctx, error ? 'color/error' : null, error ? '#F04452' : null, disabled)
  const val = boundText(ctx, '도로명, 지번, 건물명으로 검색', 15, 'color/secondary', MUTED)
  val.name = 'value'
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
function renderKrCardForm(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const { c, add } = krFormCard(ctx, '카드 등록')
  if (combo.disabled === 'true') c.opacity = 0.45
  add(krSubField(ctx, { label: '카드번호', ph: '0000-0000-0000-0000' }))
  const two = autoFrame('row2', 'HORIZONTAL') // CSS 클래스 .row2 — 유효기간+CVC 2열
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
/**
 * krSubField는 값 텍스트를 전부 'value'로 이름 짓는다(공용 부품이라 고칠 수 없다).
 * KrAddressForm은 값이 6개(value.postcode·road·jibun·detail·request·requestNote)라 그대로 두면
 * addTextProp의 findAll(name==='value')이 네 칸을 한 속성에 묶어버린다 → 필드마다 이름을 갈아 끼운다.
 */
function nameValueLayer(field: FrameNode, layer: string): FrameNode {
  const v = field.findOne((n) => n.type === 'TEXT' && n.name === 'value')
  if (v) v.name = layer
  return field
}
function renderKrAddressForm(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const withRequest = combo.withRequest === 'true'
  const detailError = combo.detailError === 'true'
  const disabled = combo.disabled === 'true'
  const { c, add } = krFormCard(ctx, '배송지 주소')
  if (disabled) c.opacity = 0.45
  add(nameValueLayer(krSubField(ctx, { label: '우편번호', ph: '00000', trailing: '우편번호 조회' }), 'value.postcode'))
  add(nameValueLayer(krSubField(ctx, { label: '도로명 주소', ph: '우편번호 조회 후 자동 입력됩니다' }), 'value.road'))
  const detail = nameValueLayer(
    krSubField(ctx, {
      label: '상세주소',
      ph: '동/호수 등 상세주소 입력',
      helper: detailError ? '상세주소를 입력해주세요' : undefined,
    }),
    'value.detail',
  )
  // detailError — 상세주소 칸만 에러 보더 + 에러 헬퍼(KrAddressForm.tsx: error={detailError}).
  if (detailError) {
    const row = detail.findOne((n) => n.name === 'field')
    if (row) bindStrokeVar(ctx, row as FrameNode, 'color/error', '#F04452')
    const h = detail.findOne((n) => n.type === 'TEXT' && n.name === 'Helper')
    if (h) bindFillVar(ctx, h as TextNode, 'color/error', '#F04452')
  }
  add(detail)
  // withRequest=false면 요청사항 칸 자체가 그려지지 않는다(React도 `{withRequest && …}`).
  if (withRequest) {
    add(nameValueLayer(krSubField(ctx, { label: '배송 요청사항', ph: '선택해주세요', trailing: 'chevron' }), 'value.request'))
  }
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
// kind — 공동인증서 / 금융인증서(KrCertAuth.tsx: noun + CERTS[kind]). 축 이름·값은 React 유니온 그대로.
function renderKrCertAuth(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const finance = combo.kind === 'finance'
  const { c, add } = krFormCard(ctx, (finance ? '금융인증서' : '공동인증서') + ' 인증')
  const certs: Array<[string, string, boolean]> = finance
    ? [
        ['금융인증서 · 홍길동', '2027-03-31', false],
        ['금융인증서 · 홍길동(구)', '2025-01-01 (만료)', true],
      ]
    : [
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
    // 완료·진행 중 마커 = solid 면 + on-color 번호
    const strong = done || active
    if (strong) bindSolidFill(ctx, marker, 'primary')
    else bindFillVar(ctx, marker, 'color/bgSubtle', SURFACE)
    marker.appendChild(
      boundText(ctx, String(i + 1), 11, strong ? onVarName('primary') : 'color/secondary', strong ? onHex(ctx, 'primary') : MUTED, true),
    )
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
  // label='' — 접힌 사이드바처럼 글자를 담을 폭이 없는 블록. 빈 텍스트 노드를 만들지 않는다.
  if (label) f.appendChild(boundText(ctx, label, 12, 'color/tertiary', MUTED))
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
  const brand = boundText(ctx, title, 15, 'color/text', INK, true)
  brand.name = 'brand' // AdminShell.brand — 셸 좌상단 워드마크
  bar.appendChild(brand)
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
// 축은 React AdminShell의 prop 그대로 — contentPadding(본문 여백) · sidebarCollapsed(사이드바 접기).
function renderTplAdminShell(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const padded = combo.contentPadding !== 'false' // React 기본값 true
  const collapsed = combo.sidebarCollapsed === 'true'
  const c = tplShell(ctx, 640)
  c.appendChild(tplBar(ctx, 'DS Admin', ['대시보드', '사용자', '설정']))
  const body = autoFrame('body', 'HORIZONTAL')
  body.layoutAlign = 'STRETCH'
  body.primaryAxisSizingMode = 'FIXED'
  body.itemSpacing = 0
  const side = tplBlock(ctx, collapsed ? '' : 'Sidebar', 300)
  side.resize(collapsed ? 56 : 180, 300)
  side.layoutAlign = 'INHERIT'
  side.dashPattern = []
  body.appendChild(side)
  // main = CSS 클래스 .main, contentPadding=true면 .padded가 붙는다.
  const main = tplBlock(ctx, 'Main content', 300, true)
  main.name = 'main'
  main.dashPattern = []
  main.paddingTop = main.paddingBottom = main.paddingLeft = main.paddingRight = padded ? 20 : 0
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
    // 켜짐 = solid 면 + on-color 노브
    if (on) bindSolidFill(ctx, tr, 'primary')
    else bindFillVar(ctx, tr, 'color/border', BORDER)
    const kn = figma.createEllipse()
    kn.resize(18, 18)
    if (on) bindOnFill(ctx, kn, 'primary')
    else bindFillVar(ctx, kn, 'color/bg', WHITE)
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
  ;[
    ['kakao', '카카오 로그인', '#FEE500', '#191919'],
    ['naver', '네이버 로그인', '#03C75A', '#FFFFFF'],
    ['google', 'Google로 로그인', '#FFFFFF', '#1F1F1F'],
  ].forEach(([provider, label, bg, fg]) => {
    const b = autoFrame('social-btn', 'HORIZONTAL')
    b.layoutAlign = 'STRETCH'
    b.primaryAxisSizingMode = 'FIXED'
    b.primaryAxisAlignItems = 'CENTER'
    b.counterAxisAlignItems = 'CENTER'
    b.itemSpacing = 8
    b.paddingTop = b.paddingBottom = 11
    b.cornerRadius = 8
    b.fills = [solid(bg)]
    if (bg === '#FFFFFF') {
      b.strokes = [solid('#DADCE0')]
      b.strokeWeight = 1
    }
    const logo = brandLogo(provider, 18)
    if (logo) {
      logo.name = 'logo'
      b.appendChild(logo)
    }
    b.appendChild(txt(ctx, label, 14, fg, true))
    social.appendChild(b)
  })
  add(social)
  return c
}
// compact — EmptyState.tsx의 `compact ? styles.compact : ''` + Placeholder size(compact 32 / 48).
// 레이어는 전부 CSS 클래스 그대로(icon·title·description·action).
function renderTplEmptyState(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const compact = combo.compact === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(360, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = compact ? 8 : 12
  c.paddingTop = c.paddingBottom = compact ? 24 : 44
  c.paddingLeft = c.paddingRight = 24
  bindFillVar(ctx, c, 'color/bg', WHITE)
  const icon = iconInstance('_Icon/Package', 'icon', compact ? 32 : 40)
  recolorIcon(icon, MUTED)
  c.appendChild(icon)
  const t = boundText(ctx, '데이터가 없습니다', compact ? 15 : 17, 'color/text', INK, true)
  t.name = 'title'
  c.appendChild(t)
  const d = boundText(ctx, '새 항목을 추가해 시작하세요.', compact ? 13 : 14, 'color/secondary', SUB)
  d.name = 'description'
  d.textAlignHorizontal = 'CENTER'
  c.appendChild(d)
  const b = autoFrame('action', 'HORIZONTAL')
  b.counterAxisAlignItems = 'CENTER'
  b.paddingTop = b.paddingBottom = 9
  b.paddingLeft = b.paddingRight = 16
  b.cornerRadius = 8
  bindSolidFill(ctx, b, 'primary')
  const bt = boundText(ctx, '추가하기', 14, onVarName('primary'), onHex(ctx, 'primary'), true)
  bt.name = 'actionLabel' // 프레임(.action)과 겹치지 않게 prop 이름으로 — addTextProp은 TEXT만 찾는다
  b.appendChild(bt)
  c.appendChild(b)
  return c
}
// appearance — FilterBar.tsx 기본값은 'plain'(테두리 없음), 'card'만 .card(면+보더)가 붙는다.
function renderTplFilterBar(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const card = combo.appearance === 'card'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'AUTO'
  c.resize(560, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 8
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = card ? 12 : 0
  c.cornerRadius = card ? 12 : 0
  if (card) {
    bindFillVar(ctx, c, 'color/bg', WHITE)
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  } else {
    c.fills = []
    c.strokes = []
  }
  const search = fieldRow(ctx, null, null, false)
  search.layoutGrow = 1
  const sv = boundText(ctx, '이름 검색', 14, 'color/secondary', MUTED)
  sv.name = 'searchPlaceholder' // 검색칸의 안내 문구 — React prop 이름 그대로
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

// ══ MEDIA (Image · Video · YouTube · ImageCard · ImageSlide) ═════════
// 비율 축의 단일 출처는 Storybook src/ds/Image/Image.tsx의 MediaRatio(10값).
// 값 순서만 다르다: Figma의 defaultVariant = '각 축 values[0] 조합'이라, Storybook 기본값(ratio='16x9')이
// 기본 변형이 되도록 16x9를 맨 앞에 둔다(나머지는 Storybook 선언 순서 유지).
const MEDIA_RATIOS = ['16x9', '1x1', '4x3', '3x2', '21x9', '4x5', '3x4', '9x16', '2x1', 'auto']
// ImageCard는 4축(ratio×layout×align×scrim) 곱이라 비율은 대표 4값만 — 변형 폭발 방지.
const CARD_RATIOS = ['16x9', '4x3', '1x1', '21x9']
// 가로÷세로. auto(원본 비율 유지)는 플레이스홀더에 원본이 없으므로 16:9로 폴백
// (Storybook의 `.ratioAuto .placeholder { aspect-ratio: 16/9 }`와 같은 규칙).
const RATIO_WH: Record<string, number> = {
  '1x1': 1,
  '4x3': 4 / 3,
  '3x2': 3 / 2,
  '16x9': 16 / 9,
  '21x9': 21 / 9,
  '4x5': 4 / 5,
  '3x4': 3 / 4,
  '9x16': 9 / 16,
  '2x1': 2,
  auto: 16 / 9,
}
/** 기준 폭 w의 비율 박스. 세로 비율(9x16·3x4 등)은 maxH에서 잘라 세트가 세로로 폭발하지 않게 한다. */
function ratioBox(ratio: string, w: number, maxH: number): { w: number; h: number } {
  const r = RATIO_WH[ratio] ?? RATIO_WH['16x9']
  let bw = w
  let bh = Math.round(w / r)
  if (bh > maxH) {
    bh = maxH
    bw = Math.round(maxH * r)
  }
  return { w: bw, h: bh }
}
/** 박스 크기에 맞춘 심볼 크기 — 짧은 변의 45%(28~72px). */
function glyphSize(w: number, h: number): number {
  return Math.max(28, Math.min(72, Math.round(Math.min(w, h) * 0.45)))
}

// 공용 플레이스홀더 SVG 언어(src/shared/placeholders.tsx)의 획 두께 — 크기와 무관하게 1.5 고정.
const PH_STROKE = 1.5
/**
 * 이미지/영상 없음 자리의 심볼. 공용 SVG 언어를 그대로 옮긴다:
 *  - 모티프: 둥근 사각 프레임(64 캔버스 기준 x6 y8 52×48 rx10) + 그 안의 심볼
 *  - 획: 1.5 고정 · 둥근 캡/조인 / 강조(primary)는 심볼 안 요소 '하나'에만
 * `_Placeholder/*` 컴포넌트에는 의존하지 않는다 — 카테고리 세트는 자립해야 한다.
 * 좌표는 brand-logos.ts와 같은 방식으로 스케일 후 bbox 최소점으로 배치한다.
 */
function phGlyph(ctx: Ctx, kind: 'image' | 'video', size: number): FrameNode {
  const k = size / 64
  const p = (n: number) => Math.round(n * k * 100) / 100
  const g = figma.createFrame()
  g.name = 'Placeholder'
  g.resize(size, size)
  g.fills = []
  g.clipsContent = false

  // 8종 공통 둥근 사각 프레임(선 = secondary/300)
  const box = figma.createRectangle()
  box.name = 'frame'
  box.resize(p(52), p(48))
  box.fills = []
  bindStrokeVar(ctx, box, 'color/secondary/300', MUTED)
  box.strokeWeight = PH_STROKE
  box.strokeAlign = 'CENTER'
  box.cornerRadius = p(10)
  g.appendChild(box)
  box.x = p(6)
  box.y = p(8)

  if (kind === 'image') {
    // 이미지: 산등성이 + 해(강조)
    const sun = figma.createEllipse()
    sun.name = 'sun'
    sun.resize(p(7), p(7))
    sun.strokes = []
    bindFillVar(ctx, sun, 'color/primary', ACCENT)
    g.appendChild(sun)
    sun.x = p(17.5)
    sun.y = p(18.5)

    const ridge = figma.createVector()
    ridge.name = 'ridge'
    ridge.vectorPaths = [
      { windingRule: 'NONE', data: `M ${p(8)} ${p(47)} L ${p(22)} ${p(33)} L ${p(31)} ${p(42)} L ${p(40)} ${p(34)} L ${p(56)} ${p(50)}` },
    ]
    ridge.fills = []
    bindStrokeVar(ctx, ridge, 'color/secondary/300', MUTED)
    ridge.strokeWeight = PH_STROKE
    ridge.strokeCap = 'ROUND'
    ridge.strokeJoin = 'ROUND'
    g.appendChild(ridge)
    ridge.x = p(8) // 경로 bbox 최소점 (8,33)
    ridge.y = p(33)
  } else {
    // 동영상: 중앙 재생 삼각형(강조)
    const play = figma.createVector()
    play.name = 'play'
    play.vectorPaths = [{ windingRule: 'NONZERO', data: `M ${p(27)} ${p(23)} L ${p(44)} ${p(32)} L ${p(27)} ${p(41)} Z` }]
    bindFillVar(ctx, play, 'color/primary', ACCENT)
    bindStrokeVar(ctx, play, 'color/primary', ACCENT)
    play.strokeWeight = PH_STROKE
    play.strokeCap = 'ROUND'
    play.strokeJoin = 'ROUND'
    g.appendChild(play)
    play.x = p(27) // 경로 bbox 최소점 (27,23)
    play.y = p(23)
  }
  return g
}
/** 회색(bgSubtle) 비율 박스 + 플레이스홀더 심볼. 캡션(Counter 등)은 심볼 아래로 쌓인다. */
function imgBox(ctx: Ctx, w: number, h: number, kind: 'image' | 'video' = 'image'): FrameNode {
  const f = figma.createFrame()
  f.name = 'image'
  f.layoutMode = 'VERTICAL'
  f.primaryAxisSizingMode = 'FIXED'
  f.counterAxisSizingMode = 'FIXED'
  f.resize(w, h)
  f.primaryAxisAlignItems = 'CENTER'
  f.counterAxisAlignItems = 'CENTER'
  f.itemSpacing = 8
  f.clipsContent = true
  bindFillVar(ctx, f, 'color/bgSubtle', SURFACE)
  f.appendChild(phGlyph(ctx, kind, glyphSize(w, h)))
  return f
}
/** 유튜브 재생 버튼 — 빨강+흰 삼각은 브랜드 크롬(brand-logos와 같이 테마 토큰 대상이 아님). */
function ytPlayButton(): FrameNode {
  const b = figma.createFrame()
  b.name = 'play'
  b.layoutMode = 'HORIZONTAL'
  b.primaryAxisSizingMode = 'FIXED'
  b.counterAxisSizingMode = 'FIXED'
  b.resize(62, 44)
  b.primaryAxisAlignItems = 'CENTER'
  b.counterAxisAlignItems = 'CENTER'
  b.cornerRadius = 12
  b.fills = [solid('#FF0000')]
  const tri = figma.createVector()
  tri.vectorPaths = [{ windingRule: 'NONZERO', data: 'M 0 0 L 14 8 L 0 16 Z' }]
  tri.fills = [solid(WHITE)]
  tri.strokes = []
  b.appendChild(tri)
  return b
}
function renderImage(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const { w, h } = ratioBox(combo.ratio || '16x9', 280, 280)
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, h)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.cornerRadius = combo.rounded === 'true' ? 12 : 0 // Storybook Image 기본 rounded=false
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bgSubtle', SURFACE)
  c.appendChild(phGlyph(ctx, 'image', glyphSize(w, h)))
  return c
}
function renderVideo(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const { w, h } = ratioBox(combo.ratio || '16x9', 320, 280)
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, h)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.cornerRadius = combo.rounded === 'false' ? 0 : 12 // Storybook Video 기본 rounded=true
  c.clipsContent = true
  // src 없는 상태 = Storybook의 Placeholder(kind="video") — 회색 면 + 재생 심볼(토큰 바인딩).
  bindFillVar(ctx, c, 'color/bgSubtle', SURFACE)
  c.appendChild(phGlyph(ctx, 'video', glyphSize(w, h)))
  return c
}
function renderYouTube(_ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const { w, h } = ratioBox(combo.ratio || '16x9', 320, 280)
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, h)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.cornerRadius = 12
  c.clipsContent = true
  c.fills = [solid('#0F0F0F')] // 유튜브 플레이어 크롬 — 브랜드 고정색(테마 토큰 대상 아님)
  c.appendChild(ytPlayButton())
  return c
}

// ── ImageCard: layout(below|overlay) × align × scrim ─────────────────
/** overlay 스크림 — 테마와 무관하게 항상 어두워야 흰 글자가 읽히므로 토큰이 아닌 검정 알파(Storybook과 동일). */
function scrimPaint(scrim: string, align: string): Paint {
  const black = { r: 0, g: 0, b: 0 }
  if (scrim === 'solid') return { type: 'SOLID', color: black, opacity: 0.45 }
  // gradientTransform [[0,1,0],[-1,0,1]] = 위→아래. position 0 = 위, 1 = 아래.
  const stops: ColorStop[] =
    align === 'top'
      ? [
          { position: 0, color: { ...black, a: 0.78 } },
          { position: 0.45, color: { ...black, a: 0.35 } },
          { position: 0.75, color: { ...black, a: 0 } },
          { position: 1, color: { ...black, a: 0 } },
        ]
      : align === 'center'
        ? [
            { position: 0, color: { ...black, a: 0.15 } },
            { position: 0.5, color: { ...black, a: 0.6 } },
            { position: 1, color: { ...black, a: 0.15 } },
          ]
        : [
            { position: 0, color: { ...black, a: 0 } },
            { position: 0.25, color: { ...black, a: 0 } },
            { position: 0.55, color: { ...black, a: 0.35 } },
            { position: 1, color: { ...black, a: 0.78 } },
          ]
  return {
    type: 'GRADIENT_LINEAR',
    gradientTransform: [
      [0, 1, 0],
      [-1, 0, 1],
    ],
    gradientStops: stops,
  }
}
/** 좌상단 배지 — 프레임/텍스트 모두 'Badge'라 Show Badge 하나로 함께 껐다 켠다. */
function cardBadge(ctx: Ctx): FrameNode {
  const b = autoFrame('Badge', 'HORIZONTAL')
  b.counterAxisAlignItems = 'CENTER'
  b.paddingTop = b.paddingBottom = 4
  b.paddingLeft = b.paddingRight = 8
  b.cornerRadius = 999
  bindSolidFill(ctx, b, 'primary')
  const t = boundText(ctx, 'NEW', 12, onVarName('primary'), onHex(ctx, 'primary'), true)
  t.name = 'badge'
  b.appendChild(t)
  return b
}
/** 하단 CTA — overlay는 이미지 위 흰 반투명(고정색), below는 토큰 색. */
function cardAction(ctx: Ctx, overlay: boolean): FrameNode {
  // 프레임 = CSS 클래스(.action / .overlayAction), 글자 = 그 문구를 만드는 prop 이름(actionLabel).
  const a = autoFrame(overlay ? 'overlayAction' : 'action', 'HORIZONTAL')
  a.counterAxisAlignItems = 'CENTER'
  a.paddingTop = a.paddingBottom = 8
  a.paddingLeft = a.paddingRight = 12
  a.cornerRadius = 8
  a.strokeWeight = 1
  a.strokeAlign = 'INSIDE'
  if (overlay) {
    a.fills = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.16 }]
    a.strokes = [{ type: 'SOLID', color: { r: 1, g: 1, b: 1 }, opacity: 0.6 }]
  } else {
    bindFillVar(ctx, a, 'color/bg', WHITE)
    bindStrokeVar(ctx, a, 'color/border', BORDER)
  }
  const t = boundText(ctx, '자세히 보기', 13, overlay ? 'color/bg' : 'color/primary', overlay ? WHITE : ACCENT, true)
  t.name = 'actionLabel'
  a.appendChild(t)
  return a
}
function renderImageCard(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const overlay = combo.layout === 'overlay'
  const align = combo.align || 'bottom'
  const scrim = combo.scrim || 'gradient'
  const W = 280
  const { h } = ratioBox(combo.ratio || '16x9', W, 320) // 카드 폭은 고정, 높이만 비율에서

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(W, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 12
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  const media = imgBox(ctx, W, h)
  media.name = 'media'
  media.layoutAlign = 'STRETCH'
  c.appendChild(media)

  if (overlay) {
    // z 순서 = 자식 순서: 스크림 → 본문 → 배지(Storybook의 z-index 1·2·3과 동일)
    if (scrim !== 'none') {
      const sc = figma.createRectangle()
      sc.name = 'Scrim'
      sc.resize(W, h)
      sc.strokes = []
      sc.fills = [scrimPaint(scrim, align)]
      media.appendChild(sc)
      sc.layoutPositioning = 'ABSOLUTE'
      sc.constraints = { horizontal: 'STRETCH', vertical: 'STRETCH' }
      sc.x = 0
      sc.y = 0
    }
    const body = autoFrame('overlayBody', 'VERTICAL')
    body.counterAxisSizingMode = 'FIXED'
    body.itemSpacing = 8
    body.counterAxisAlignItems = align === 'center' ? 'CENTER' : 'MIN'
    body.resize(W - 32, body.height)
    const t = boundText(ctx, '이미지 카드', 18, 'color/bg', WHITE, true) // 이미지 위 글자 = 흰색(color/bg)
    t.name = 'title'
    t.layoutAlign = 'STRETCH'
    t.textAutoResize = 'HEIGHT'
    if (align === 'center') t.textAlignHorizontal = 'CENTER'
    body.appendChild(t)
    const d = boundText(ctx, '이미지 위에 제목과 설명이 붙는 카드입니다.', 13, 'color/bg', WHITE)
    d.name = 'description'
    d.layoutAlign = 'STRETCH'
    d.textAutoResize = 'HEIGHT'
    d.opacity = 0.9
    if (align === 'center') d.textAlignHorizontal = 'CENTER'
    body.appendChild(d)
    body.appendChild(cardAction(ctx, true))
    media.appendChild(body)
    body.layoutPositioning = 'ABSOLUTE'
    body.constraints = { horizontal: 'STRETCH', vertical: align === 'top' ? 'MIN' : align === 'center' ? 'CENTER' : 'MAX' }
    body.x = 16
    // 낮은 비율(21:9)에서 본문이 위로 새지 않게 최소 여백을 남긴다.
    const y = align === 'top' ? 16 : align === 'center' ? Math.round((h - body.height) / 2) : h - body.height - 16
    body.y = Math.max(8, y)
  } else {
    const body = autoFrame('body', 'VERTICAL')
    body.layoutAlign = 'STRETCH'
    body.itemSpacing = 8
    body.paddingTop = body.paddingBottom = 16
    body.paddingLeft = body.paddingRight = 16
    // eyebrow — 제목 위 한 줄 라벨(분류). below 배치에서만 그린다(Storybook과 동일).
    const eyebrow = boundText(ctx, '카테고리', 12, 'color/secondary', SUB, true)
    eyebrow.name = 'eyebrow'
    body.appendChild(eyebrow)
    const t = boundText(ctx, '이미지 카드', 16, 'color/text', INK, true)
    t.name = 'title'
    body.appendChild(t)
    const d = boundText(ctx, '이미지 위에 제목과 설명이 붙는 카드입니다.', 13, 'color/secondary', SUB)
    d.name = 'description'
    d.layoutAlign = 'STRETCH'
    d.textAutoResize = 'HEIGHT'
    body.appendChild(d)
    body.appendChild(cardAction(ctx, false))
    c.appendChild(body)
  }

  // 배지는 below·overlay 공통으로 미디어 좌상단(맨 위 레이어)
  const badge = cardBadge(ctx)
  media.appendChild(badge)
  badge.layoutPositioning = 'ABSOLUTE'
  badge.constraints = { horizontal: 'MIN', vertical: 'MIN' }
  badge.x = 12
  badge.y = 12
  return c
}
function renderImageSlide(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const { w, h } = ratioBox(combo.ratio || '16x9', 300, 260)
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
  const slide = imgBox(ctx, w, h)
  slide.name = 'slide'
  slide.cornerRadius = 12
  const lbl = boundText(ctx, '1 / 3', 13, 'color/secondary', SUB, true)
  lbl.name = 'Counter'
  slide.appendChild(lbl) // imgBox는 VERTICAL → 심볼 아래에 붙는다(Storybook 플레이스홀더 label과 동일)
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

// ══ 신규 아톰 (Rating · Skeleton · AvatarGroup · Callout · Kbd) ══════
// size — Rating.module.css의 --star-size(md 24 / sm 16). value는 number prop이라 축이 아니지만
// 별점은 값 없이는 그릴 그림이 없어 대표 3값으로 이산화해 둔다(baseline → ALLOWLIST 참조).
function renderRating(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const value = parseInt(combo.value || '4', 10)
  const px = combo.size === 'sm' ? 16 : 24
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = combo.size === 'sm' ? 3 : 4
  c.fills = []
  for (let i = 0; i < 5; i++) {
    const s = iconInstance('_Icon/Star', 'star', px)
    recolorIcon(s, i < value ? '#F59E0B' : BORDER)
    c.appendChild(s)
  }
  return c
}
// size — AvatarGroup.module.css: sm 24px(겹침 -8) / md 32px(겹침 -10).
// md의 기존 그림(36px)은 건드리지 않는다("모양 불변") — sm만 CSS 값 그대로 새로 그린다.
function renderAvatarGroup(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const sm = combo.size === 'sm'
  const px = sm ? 24 : 36
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = sm ? -8 : -10 // 겹침
  c.fills = []
  const chip = (text: string, muted: boolean) => {
    const a = figma.createFrame()
    a.name = muted ? 'more' : 'avatar'
    a.layoutMode = 'HORIZONTAL'
    a.primaryAxisSizingMode = 'FIXED'
    a.counterAxisSizingMode = 'FIXED'
    a.resize(px, px)
    a.primaryAxisAlignItems = 'CENTER'
    a.counterAxisAlignItems = 'CENTER'
    a.cornerRadius = 999
    // 아바타 칩 = solid 면 + on-color 이니셜(+N만 옅은 배경 + 보조 글자색)
    if (muted) bindFillVar(ctx, a, 'color/bgSubtle', SURFACE)
    else bindSolidFill(ctx, a, 'primary')
    a.strokes = [solid(WHITE)]
    a.strokeWeight = 2
    const t = boundText(ctx, text, sm ? 11 : 13, muted ? 'color/secondary' : onVarName('primary'), muted ? SUB : onHex(ctx, 'primary'), true)
    if (!muted) t.name = 'initial'
    a.appendChild(t)
    return a
  }
  ;['김', '이', '박'].forEach((n) => c.appendChild(chip(n, false)))
  c.appendChild(chip('+2', true))
  return c
}
// withSeparator — Kbd.tsx: `{withSeparator && index > 0 && <span className={styles.separator}>+</span>}`
function renderKbd(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const withSeparator = combo.withSeparator === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 5
  c.fills = []
  ;['⌘', 'K'].forEach((k, i) => {
    if (withSeparator && i > 0) {
      const sep = boundText(ctx, '+', 13, 'color/tertiary', MUTED)
      sep.name = 'separator'
      c.appendChild(sep)
    }
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

// ══ ETC — 소셜/OAuth 로그인 ══════════════════════════════════════════
const SOCIAL_STYLE: Record<string, { bg: string; fg: string; label: string; border?: string }> = {
  kakao: { bg: '#FEE500', fg: '#191919', label: '카카오 로그인' },
  naver: { bg: '#03C75A', fg: '#FFFFFF', label: '네이버 로그인' },
  google: { bg: '#FFFFFF', fg: '#1F1F1F', label: 'Google로 로그인', border: '#DADCE0' },
  facebook: { bg: '#1877F2', fg: '#FFFFFF', label: 'Facebook으로 로그인' },
  apple: { bg: '#000000', fg: '#FFFFFF', label: 'Apple로 로그인' },
  microsoft: { bg: '#FFFFFF', fg: '#1F1F1F', label: 'Microsoft 계정으로 로그인', border: '#8C8C8C' },
  x: { bg: '#000000', fg: '#FFFFFF', label: 'X로 계속하기' },
}
function renderSocial(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const provider = combo.provider || 'kakao'
  const s = SOCIAL_STYLE[provider] || SOCIAL_STYLE.kakao
  const lg = combo.size === 'lg'
  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'AUTO'
  c.resize(320, c.height)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 8
  c.paddingTop = c.paddingBottom = lg ? 14 : 11
  c.cornerRadius = 8
  c.fills = [solid(s.bg)]
  if (s.border) {
    c.strokes = [solid(s.border)]
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }
  const logo = brandLogo(provider, lg ? 22 : 18)
  if (logo) {
    logo.name = 'logo'
    c.appendChild(logo)
  }
  const t = txt(ctx, s.label, lg ? 16 : 14, s.fg, true)
  t.name = 'label'
  c.appendChild(t)
  return c
}

export const DATA_CATEGORY: CategoryDef = {
  pageName: PAGE_DATA,
  title: 'Data Display',
  subtitle: '데이터 표시 계열 — 값·상태·구조·흐름을 보여주는 요소. Avatar · Statistics · Progress · Table · Timeline · Tree · Carousel.',
  docs: [
    {
      key: 'Avatar',
      setName: 'DS/Avatar',
      eyebrow: 'ATOM · DATA',
      desc: '사용자를 나타내는 아바타(이니셜 + 온라인 점). 축은 Avatar.tsx의 size·shape·status 그대로.',
      // shape는 렌더가 이미 그리고 있었는데 축 선언만 빠져 있었다 — 4×3×2 = 24변형(상한 40).
      build: (ctx, page) => buildSet(ctx, page, 'DS/Avatar', [{ name: 'size', values: ['sm', 'md', 'lg', 'xl'] }, { name: 'shape', values: ['circle', 'rounded'] }, { name: 'status', values: ['online', 'offline', 'busy'] }], (c) => renderAvatar(ctx, c), { texts: [{ prop: 'name', layer: 'initials', def: '김' }] }),
      states: [{ caption: 'Small', props: { size: 'sm' } }, { caption: 'Medium', props: { size: 'md' } }, { caption: 'Large', props: { size: 'lg' } }, { caption: 'XL', props: { size: 'xl' } }, { caption: 'Rounded', props: { shape: 'rounded' } }, { caption: 'Offline', props: { status: 'offline' } }, { caption: 'Busy', props: { status: 'busy' } }],
    },
    {
      key: 'Statistics',
      setName: 'DS/Statistics',
      eyebrow: 'MOLECULE · DATA',
      desc: '지표 값과 증감을 보여주는 통계 카드. appearance=plain은 이미 보더가 있는 카드 안에 넣을 때.',
      // delta(up/down/flat)는 prop이 아니라 items[].delta의 부호다 — 지표 카드의 대표 3그림으로 남긴다.
      build: (ctx, page) => buildSet(ctx, page, 'DS/Statistics', [{ name: 'delta', values: ['up', 'down', 'flat'] }, { name: 'appearance', values: ['card', 'plain'] }], (c) => renderStatistics(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '총 매출' }, { prop: 'value', layer: 'value', def: '₩12,400,000' }, { prop: 'delta', layer: 'delta', def: '+12.5%' }] }),
      states: [{ caption: 'Up', props: {} }, { caption: 'Down', props: { delta: 'down' } }, { caption: 'Flat', props: { delta: 'flat' } }, { caption: 'Plain', props: { appearance: 'plain' } }],
    },
    {
      key: 'Progress',
      setName: 'DS/Progress',
      eyebrow: 'ATOM · DATA',
      desc: '진행 상태를 나타내는 진행 바.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Progress', [{ name: 'value', values: ['25', '50', '75', '100'] }], (c) => renderProgress(ctx, c), { texts: [{ prop: 'label', layer: 'label', def: '진행률' }] }),
      states: [{ caption: '25%', props: { value: '25' } }, { caption: '50%', props: { value: '50' } }, { caption: '75%', props: { value: '75' } }, { caption: '100%', props: { value: '100' } }],
    },
    {
      key: 'Table',
      setName: 'DS/Table',
      eyebrow: 'ORGANISM · DATA',
      desc: '헤더 + 데이터 행 + 상태 배지의 표. 축은 Table.tsx의 striped·bordered·density 그대로(2×2×2 = 8변형).',
      // 예전 축 state(default|striped|empty)는 지웠다: striped는 진짜 prop이었고,
      // empty는 prop이 아니라 rows=[] 데이터라 축이 될 수 없다(emptyText는 ALLOWLIST 참조).
      build: (ctx, page) => buildSet(ctx, page, 'DS/Table', [{ name: 'striped', values: ['false', 'true'] }, { name: 'bordered', values: ['false', 'true'] }, { name: 'density', values: ['comfortable', 'compact'] }], (c) => renderTable(ctx, c), { texts: [{ prop: 'Head 1', layer: 'Head 1', def: '이름' }, { prop: 'Head 2', layer: 'Head 2', def: '역할' }, { prop: 'Head 3', layer: 'Head 3', def: '상태' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Striped', props: { striped: 'true' } }, { caption: 'Bordered', props: { bordered: 'true' } }, { caption: 'Compact', props: { density: 'compact' } }],
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
      desc: '슬라이드 + 좌우 이동 + 인디케이터 캐러셀. showArrows·showDots는 축이 아니라 BOOLEAN 속성이다(§3).',
      // Prev/Next INSTANCE_SWAP은 지웠다 — React Carousel에 아이콘 ReactNode prop이 없고(§5),
      // 게다가 레이어가 'Prev Icon'이라 findAll(name==='Prev')이 아무것도 못 찾는 유령 속성이었다.
      build: (ctx, page) => buildSet(ctx, page, 'DS/Carousel', [{ name: 'loop', values: ['true', 'false'] }], (c) => renderCarousel(ctx, c), {
        texts: [{ prop: 'slide', layer: 'slide', def: '슬라이드 1 / 4' }],
        bools: [{ prop: 'showArrows', layer: 'arrow', def: true }, { prop: 'showDots', layer: 'dots', def: true }],
      }),
      states: [{ caption: 'Default', props: {} }, { caption: 'No loop (첫 슬라이드)', props: { loop: 'false' } }],
    },
    {
      key: 'Rating',
      setName: 'DS/Rating',
      eyebrow: 'ATOM · DATA',
      desc: '별점(1~5). size는 Rating.tsx의 유니온 그대로(sm 16px / md 24px).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Rating', [{ name: 'value', values: ['3', '4', '5'] }, { name: 'size', values: ['md', 'sm'] }], (c) => renderRating(ctx, c)),
      states: [{ caption: '3', props: { value: '3' } }, { caption: '4', props: {} }, { caption: '5', props: { value: '5' } }, { caption: 'Small', props: { size: 'sm' } }],
    },
    {
      key: 'AvatarGroup',
      setName: 'DS/AvatarGroup',
      eyebrow: 'MOLECULE · DATA',
      desc: '겹친 아바타 + 초과 수(+N).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/AvatarGroup', [{ name: 'size', values: ['md', 'sm'] }], (c) => renderAvatarGroup(ctx, c)),
      states: [{ caption: 'Medium', props: {} }, { caption: 'Small', props: { size: 'sm' } }],
    },
    {
      key: 'Kbd',
      setName: 'DS/Kbd',
      eyebrow: 'ATOM · DATA',
      desc: '키보드 키 표시(⌘ K). withSeparator는 키 사이에 +를 넣는다.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/Kbd', [{ name: 'withSeparator', values: ['false', 'true'] }], (c) => renderKbd(ctx, c)),
      states: [{ caption: 'Default', props: {} }, { caption: 'With separator', props: { withSeparator: 'true' } }],
    },
  ],
}

export const DATETIME_CATEGORY: CategoryDef = {
  pageName: PAGE_DATETIME,
  title: 'Date & Time',
  subtitle: '날짜·시간 입력 계열 — 달력과 날짜/시간 선택 필드. Calendar · DatePicker · TimePicker · DateRangePicker.',
  docs: [
    // 세 픽커의 'Icon' INSTANCE_SWAP은 전부 지웠다 — React DatePicker/TimePicker/DateRangePicker에
    // 아이콘 ReactNode prop이 없다. 뭉뚱그린 'Icon'은 규약 §5가 금지하는 이름이기도 하다.
    {
      key: 'Calendar',
      setName: 'DS/Calendar',
      eyebrow: 'ORGANISM · DATE',
      desc: '월 단위 달력 그리드(선택일·오늘 표시).',
      // Calendar.tsx에는 string prop이 하나도 없다(월 제목은 내부 상태에서 나온다) → TEXT 'Title'을 지웠다.
      build: (ctx, page) => buildSet(ctx, page, 'DS/Calendar', [{ name: 'disabled', values: ['false', 'true'] }], (c) => renderCalendar(ctx, c)),
      states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'DatePicker',
      setName: 'DS/DatePicker',
      eyebrow: 'MOLECULE · DATE',
      desc: '날짜를 선택하는 입력 필드(달력 아이콘). 축은 DatePicker.tsx의 disabled·error 그대로.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/DatePicker', [{ name: 'disabled', values: ['false', 'true'] }, { name: 'error', values: ['false', 'true'] }], (c) => pickerField(ctx, '날짜', '2026-07-15', '_Icon/Calendar', c), { texts: [{ prop: 'label', layer: 'label', def: '날짜' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'TimePicker',
      setName: 'DS/TimePicker',
      eyebrow: 'MOLECULE · DATE',
      desc: '시간을 선택하는 입력 필드(시계 아이콘).',
      build: (ctx, page) => buildSet(ctx, page, 'DS/TimePicker', [{ name: 'disabled', values: ['false', 'true'] }], (c) => pickerField(ctx, '시간', '오후 2:30', '_Icon/Clock', c), { texts: [{ prop: 'label', layer: 'label', def: '시간' }, { prop: 'value', layer: 'value', def: '오후 2:30' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
    {
      key: 'DateRangePicker',
      setName: 'DS/DateRangePicker',
      eyebrow: 'MOLECULE · DATE',
      desc: '기간(시작~종료)을 선택하는 입력 필드.',
      // DateRangePicker.tsx의 string prop은 label·helperText뿐이다(표시되는 기간 문자열은 Date 상태에서 나온다).
      build: (ctx, page) => buildSet(ctx, page, 'DS/DateRangePicker', [{ name: 'disabled', values: ['false', 'true'] }], (c) => pickerField(ctx, '기간', '2026-07-01  ~  2026-07-15', '_Icon/Calendar', c), { texts: [{ prop: 'label', layer: 'label', def: '기간' }] }),
      states: [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { disabled: 'true' } }],
    },
  ],
}

/**
 * KR 필드형 문서.
 *
 * 축은 그 컴포넌트가 **실제로 가진** boolean prop만 세운다(전부 InputBase의 disabled/error/success로 내려간다).
 * disabled는 10개 필드 공통, error·success는 있는 필드에만. 변형 수는 2~8개로 상한(40) 안이다:
 *   KrAccountField 2×2×2=8 · KrCvcField/KrPostcodeSearch 2×2=4 · 나머지 2.
 * 예전엔 Figma에만 있는 임의 축 state(default|filled|error|disabled) 하나로 다 덮었는데,
 * 그 'filled'가 곧 success(초록 보더 + 입력된 글자)였다 — 그림은 그대로 두고 축만 코드에 맞췄다.
 */
type KrFieldOpts = {
  error?: boolean
  success?: boolean
  helperText?: boolean
  /** 값 텍스트를 담는 React prop 이름 — KrPostcodeSearch만 value가 아니라 postcode다. */
  valueProp?: string
}
/**
 * ⚠ buildSet 인자는 **리터럴 · 팩토리 파라미터 · 모듈 상수**로만 써야 한다.
 * 게이트의 추출기(scripts/lib/figma-sets.mjs)는 AST를 정적 평가하는데 **함수 지역 const는 못 읽는다**
 * (axes/texts를 지역 변수로 빼면 E-UNPARSED로 실패한다). 그래서 축·속성을 호출부 opts에서 그대로 편다.
 * 같은 이유로 props 자리에 undefined를 넘기면 안 된다 — 속성이 없으면 빈 객체 {}를 넘긴다.
 */
function krFieldDoc(han: string, key: string, spec: KrSpec, opts: KrFieldOpts): ComponentDoc {
  const states: State[] = [{ caption: 'Default', props: {} }]
  if (opts.success) states.push({ caption: 'Success', props: { success: 'true' } })
  if (opts.error) states.push({ caption: 'Error', props: { error: 'true' } })
  states.push({ caption: 'Disabled', props: { disabled: 'true' } })
  return {
    key: han,
    setName: 'DS/' + key,
    eyebrow: 'MOLECULE · KR',
    desc: han + ' 입력 필드.',
    build: (ctx, page) =>
      buildSet(
        ctx,
        page,
        'DS/' + key,
        [
          { name: 'disabled', values: ['false', 'true'] },
          ...(opts.error ? [{ name: 'error', values: ['false', 'true'] }] : []),
          ...(opts.success ? [{ name: 'success', values: ['false', 'true'] }] : []),
        ],
        (c) => krField(ctx, spec, c, opts.valueProp ?? 'value'),
        {
          texts: [
            { prop: 'label', layer: 'label', def: spec.label },
            { prop: opts.valueProp ?? 'value', layer: opts.valueProp ?? 'value', def: spec.ph },
            ...(opts.helperText
              ? [{ prop: 'helperText', layer: 'helperText', def: spec.helper ?? spec.errHelper ?? '형식이 올바르지 않습니다' }]
              : []),
          ],
        },
      ),
    states,
  }
}
/** 축이 없는 KR 콤포지트는 state=default 하나로 선다 — Figma 세트는 베리언트 축이 최소 1개 있어야 성립한다. */
const NO_AXIS: Axis[] = [{ name: 'state', values: ['default'] }]
/** 대부분의 KR 콤포지트가 가진 유일한 축 — disabled. */
const DISABLED_AXIS: Axis[] = [{ name: 'disabled', values: ['false', 'true'] }]
/** 속성이 없는 세트 — 추출기가 undefined를 못 읽으므로 빈 객체를 넘긴다(위 주석 참조). */
const NO_PROPS: PropSpec = {}
const DEFAULT_STATES: State[] = [{ caption: 'Default', props: {} }]
const DISABLED_STATES: State[] = [{ caption: 'Default', props: {} }, { caption: 'Disabled', props: { disabled: 'true' } }]
function krBespokeDoc(
  han: string,
  key: string,
  desc: string,
  render: (ctx: Ctx, combo: Record<string, string>) => ComponentNode,
  axes: Axis[],
  props: PropSpec,
  states: State[],
): ComponentDoc {
  return {
    key: han,
    setName: 'DS/' + key,
    eyebrow: 'ORGANISM · KR',
    desc,
    build: (ctx, page) => buildSet(ctx, page, 'DS/' + key, axes, (c) => render(ctx, c), props),
    states,
  }
}

export const KR_CATEGORY: CategoryDef = {
  pageName: PAGE_KR,
  title: 'Korea Templates',
  subtitle: '한국 도메인 폼 계열 — 계좌·카드·본인인증·주소 등. Storybook "6. KR 컴포넌트"와 1:1.',
  docs: [
    krFieldDoc('계좌번호', 'KrAccountField', { label: '계좌번호', ph: '계좌번호 입력', helper: '숫자만 입력하세요' }, { error: true, success: true, helperText: true }),
    krFieldDoc('사업자등록번호', 'KrBizNoField', { label: '사업자등록번호', ph: '123-45-67890', helper: '숫자 10자리를 입력하세요', errHelper: '유효하지 않은 사업자등록번호입니다' }, { helperText: true }),
    krFieldDoc('주민등록번호', 'KrRrnField', { label: '주민등록번호', ph: '900101-1●●●●●●', trailing: 'eye', errHelper: '주민등록번호 형식이 아닙니다' }, {}),
    krFieldDoc('차량번호', 'KrVehicleNoField', { label: '차량번호', ph: '12가3456', errHelper: '차량번호 형식이 아닙니다' }, {}),
    krFieldDoc('카드번호', 'KrCardNoField', { label: '카드번호', ph: '0000-0000-0000-0000', errHelper: '카드번호를 다시 확인해 주세요' }, {}),
    krFieldDoc('유효기간', 'KrExpiryField', { label: '유효기간', ph: 'MM/YY', narrow: true, errHelper: '유효기간이 올바르지 않습니다' }, {}),
    krFieldDoc('CVC', 'KrCvcField', { label: 'CVC', ph: '●●●', narrow: true, trailing: 'eye', helper: '카드 뒷면 3자리' }, { error: true, helperText: true }),
    krFieldDoc('휴대폰 번호', 'KrPhoneField', { label: '휴대폰 번호', ph: '010-0000-0000', errHelper: '휴대폰 번호 형식이 아닙니다' }, {}),
    // 우편번호는 조회 결과로만 채워진다 — 그래서 값 prop 이름이 value가 아니라 postcode다(KrPostcodeSearch.tsx).
    krFieldDoc('우편번호 조회', 'KrPostcodeSearch', { label: '우편번호', ph: '00000', trailing: '우편번호 조회' }, { error: true, helperText: true, valueProp: 'postcode' }),
    krFieldDoc('은행 선택', 'KrBankSelect', { label: '은행', ph: '은행을 선택하세요', trailing: 'chevron' }, {}),
    krBespokeDoc('통신사 선택', 'KrCarrierSelect', '통신사 선택 필-버튼 라디오 그룹.', renderKrCarrier, DISABLED_AXIS, NO_PROPS, DISABLED_STATES),
    krBespokeDoc('본인인증 수단 선택', 'KrAuthMethodSelect', '본인인증 수단 카드 리스트.', renderKrAuthMethod, DISABLED_AXIS, NO_PROPS, DISABLED_STATES),
    krBespokeDoc(
      '주소 자동완성',
      'KrAddressAutocomplete',
      '주소 입력 + 제안 리스트.',
      renderKrAutocomplete,
      [{ name: 'disabled', values: ['false', 'true'] }, { name: 'error', values: ['false', 'true'] }],
      { texts: [{ prop: 'label', layer: 'label', def: '주소' }, { prop: 'value', layer: 'value', def: '도로명, 지번, 건물명으로 검색' }] },
      [{ caption: 'Default', props: {} }, { caption: 'Error', props: { error: 'true' } }, { caption: 'Disabled', props: { disabled: 'true' } }],
    ),
    krBespokeDoc('진행 단계', 'KrStepIndicator', '본인인증 진행 단계 인디케이터.', renderKrStep, NO_AXIS, NO_PROPS, DEFAULT_STATES),
    krBespokeDoc('전자서명', 'KrSignaturePad', '전자서명 캔버스 + 되돌리기/지우기.', renderKrSignature, DISABLED_AXIS, NO_PROPS, DISABLED_STATES),
    krBespokeDoc('카드 등록 폼', 'KrCardForm', '카드번호·유효기간·CVC·소유자명 등록 폼.', renderKrCardForm, DISABLED_AXIS, NO_PROPS, DISABLED_STATES),
    krBespokeDoc(
      '배송지 주소',
      'KrAddressForm',
      '우편번호 조회 + 도로명·상세·요청사항 주소 폼. 축은 KrAddressForm.tsx의 withRequest·detailError·disabled 그대로(2×2×2 = 8변형).',
      renderKrAddressForm,
      [
        { name: 'withRequest', values: ['false', 'true'] },
        { name: 'detailError', values: ['false', 'true'] },
        { name: 'disabled', values: ['false', 'true'] },
      ],
      {
        // 값 텍스트는 필드마다 이름을 갈아 끼웠다(nameValueLayer) — 안 그러면 네 칸이 한 속성에 묶인다.
        texts: [
          { prop: 'value.postcode', layer: 'value.postcode', def: '00000' },
          { prop: 'value.road', layer: 'value.road', def: '우편번호 조회 후 자동 입력됩니다' },
          { prop: 'value.detail', layer: 'value.detail', def: '동/호수 등 상세주소 입력' },
          { prop: 'value.request', layer: 'value.request', def: '선택해주세요' },
        ],
      },
      [
        { caption: 'Default', props: {} },
        { caption: 'With request', props: { withRequest: 'true' } },
        { caption: 'Detail error', props: { detailError: 'true' } },
        { caption: 'Disabled', props: { disabled: 'true' } },
      ],
    ),
    krBespokeDoc('휴대폰 본인인증', 'KrPhoneAuth', '단계 + 이름·휴대폰·인증번호 위저드.', renderKrPhoneAuth, NO_AXIS, NO_PROPS, DEFAULT_STATES),
    krBespokeDoc('본인인증', 'KrIdentityVerification', '통합 본인인증(수단 선택 → 인증 → 완료).', renderKrIdentity, NO_AXIS, NO_PROPS, DEFAULT_STATES),
    krBespokeDoc(
      '인증서 인증',
      'KrCertAuth',
      '공동/금융 인증서 선택 + 다음.',
      renderKrCertAuth,
      [{ name: 'kind', values: ['joint', 'finance'] }],
      NO_PROPS,
      [{ caption: '공동인증서', props: {} }, { caption: '금융인증서', props: { kind: 'finance' } }],
    ),
  ],
}

export const TEMPLATES_CATEGORY: CategoryDef = {
  pageName: PAGE_TEMPLATES,
  title: 'Templates',
  subtitle: '페이지 예시 — DS 컴포넌트를 조합한 화면. Storybook Templates·Admin 미러.',
  docs: [
    krBespokeDoc(
      'AdminShell',
      'AdminShell',
      'Navbar + Sidebar + Main의 관리자 셸. 축은 AdminShell.tsx의 contentPadding·sidebarCollapsed 그대로.',
      renderTplAdminShell,
      [
        { name: 'contentPadding', values: ['true', 'false'] }, // React 기본값 true
        { name: 'sidebarCollapsed', values: ['false', 'true'] },
      ],
      { texts: [{ prop: 'brand', layer: 'brand', def: 'DS Admin' }] },
      [
        { caption: 'Default', props: {} },
        { caption: 'No content padding', props: { contentPadding: 'false' } },
        { caption: 'Sidebar collapsed', props: { sidebarCollapsed: 'true' } },
      ],
    ),
    // Dashboard·ListPage·Settings·Login은 React 템플릿에 prop이 하나도 없다 → state=default 한 축(NO_AXIS).
    krBespokeDoc('Dashboard', 'Dashboard', 'KPI + 차트 + 테이블 대시보드.', renderTplDashboard, NO_AXIS, NO_PROPS, DEFAULT_STATES),
    krBespokeDoc('ListPage', 'ListPage', '헤더 + 필터 + 테이블 + 페이지네이션 목록 화면.', renderTplListPage, NO_AXIS, NO_PROPS, DEFAULT_STATES),
    krBespokeDoc('Settings', 'Settings', '섹션 카드(프로필·알림) + 저장.', renderTplSettings, NO_AXIS, NO_PROPS, DEFAULT_STATES),
    krBespokeDoc('Login', 'Login', '이메일·비밀번호 + 소셜 로그인 카드.', renderTplLogin, NO_AXIS, NO_PROPS, DEFAULT_STATES),
    krBespokeDoc(
      'EmptyState',
      'EmptyState',
      '아이콘 + 제목 + 설명 + 액션 빈 상태. icon은 INSTANCE_SWAP으로 갈아끼운다.',
      renderTplEmptyState,
      [{ name: 'compact', values: ['false', 'true'] }],
      {
        texts: [
          { prop: 'title', layer: 'title', def: '데이터가 없습니다' },
          { prop: 'description', layer: 'description', def: '새 항목을 추가해 시작하세요.' },
          { prop: 'actionLabel', layer: 'actionLabel', def: '추가하기' },
        ],
        swaps: [{ prop: 'icon', layer: 'icon', defKey: '_Icon/Package' }],
      },
      [{ caption: 'Default', props: {} }, { caption: 'Compact', props: { compact: 'true' } }],
    ),
    krBespokeDoc(
      'FilterBar',
      'FilterBar',
      '검색 + 필터 셀렉트 + 초기화 툴바. appearance 기본값은 plain(테두리 없음).',
      renderTplFilterBar,
      [{ name: 'appearance', values: ['plain', 'card'] }], // React 기본값 plain
      { texts: [{ prop: 'searchPlaceholder', layer: 'searchPlaceholder', def: '이름 검색' }] },
      [{ caption: 'Plain (기본)', props: {} }, { caption: 'Card', props: { appearance: 'card' } }],
    ),
  ],
}

export const MEDIA_CATEGORY: CategoryDef = {
  pageName: PAGE_MEDIA,
  title: 'Media',
  subtitle: '미디어 계열 — 이미지·동영상·임베드. 비율 축(MediaRatio 10값)은 Storybook src/ds/Image/Image.tsx가 단일 출처.',
  docs: [
    {
      key: 'Image',
      setName: 'DS/Image',
      eyebrow: 'ATOM · MEDIA',
      desc: '비율 지정 이미지. ratio 10값 × rounded 축(이미지가 없으면 공용 플레이스홀더 심볼).',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/Image',
          [
            { name: 'ratio', values: MEDIA_RATIOS },
            { name: 'rounded', values: ['false', 'true'] },
          ],
          (c) => renderImage(ctx, c),
        ),
      states: [
        { caption: '16:9', props: {} },
        { caption: '1:1', props: { ratio: '1x1' } },
        { caption: '4:3', props: { ratio: '4x3' } },
        { caption: '21:9', props: { ratio: '21x9' } },
        { caption: '9:16', props: { ratio: '9x16' } },
        { caption: 'auto (16:9 폴백)', props: { ratio: 'auto' } },
        { caption: 'Rounded', props: { rounded: 'true' } },
      ],
    },
    {
      key: 'Video',
      setName: 'DS/Video',
      eyebrow: 'MOLECULE · MEDIA',
      desc: '동영상 — src가 없으면 재생 심볼 플레이스홀더. ratio 10값 × rounded 축.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/Video',
          [
            { name: 'ratio', values: MEDIA_RATIOS },
            { name: 'rounded', values: ['true', 'false'] },
          ],
          (c) => renderVideo(ctx, c),
        ),
      states: [
        { caption: '16:9', props: {} },
        { caption: '1:1', props: { ratio: '1x1' } },
        { caption: '9:16', props: { ratio: '9x16' } },
        { caption: '21:9', props: { ratio: '21x9' } },
        { caption: 'Square edge', props: { rounded: 'false' } },
      ],
    },
    {
      key: 'YouTube',
      setName: 'DS/YouTube',
      eyebrow: 'MOLECULE · MEDIA',
      desc: '유튜브 임베드(빨강 재생 버튼 = 브랜드 크롬). ratio 10값.',
      build: (ctx, page) => buildSet(ctx, page, 'DS/YouTube', [{ name: 'ratio', values: MEDIA_RATIOS }], (c) => renderYouTube(ctx, c)),
      states: [
        { caption: '16:9', props: {} },
        { caption: '4:3', props: { ratio: '4x3' } },
        { caption: '21:9', props: { ratio: '21x9' } },
        { caption: '9:16', props: { ratio: '9x16' } },
      ],
    },
    {
      key: 'ImageCard',
      setName: 'DS/ImageCard',
      eyebrow: 'MOLECULE · MEDIA',
      desc:
        '이미지 카드 — layout(below·overlay) × align × scrim + eyebrow(분류 라벨) + 배지 + CTA. 비율은 대표 4값(변형 폭발 방지). ' +
        'fill(그리드 셀을 꽉 채움)은 격리된 컴포넌트 외형을 바꾸지 않는 컨텍스트 축이라 축 대신 문서화용 BOOLEAN 속성으로만 남깁니다.',
      build: (ctx, page) => {
        const set = buildSet(
          ctx,
          page,
          'DS/ImageCard',
          [
            { name: 'ratio', values: CARD_RATIOS },
            { name: 'layout', values: ['below', 'overlay'] },
            { name: 'align', values: ['bottom', 'top', 'center'] },
            { name: 'scrim', values: ['gradient', 'solid', 'none'] },
          ],
          (c) => renderImageCard(ctx, c),
          {
            texts: [
              { prop: 'eyebrow', layer: 'eyebrow', def: '카테고리' },
              { prop: 'title', layer: 'title', def: '이미지 카드' },
              { prop: 'description', layer: 'description', def: '이미지 위에 제목과 설명이 붙는 카드입니다.' },
              { prop: 'badge', layer: 'badge', def: 'NEW' },
              { prop: 'actionLabel', layer: 'actionLabel', def: '자세히 보기' },
            ],
          },
        )
        // fill — 그리드 셀 폭을 꽉 채우는 컨텍스트 종속 동작(인스턴스가 놓이는 부모가 결정)이라
        // Figma의 componentPropertyReferences로는 리사이즈를 바인딩할 수 없다. 축 폭발 없이
        // Storybook과의 prop 이름 대응만 남긴다(바인딩 대상 레이어 없음 — 문서/핸드오프용).
        set.addComponentProperty('fill', 'BOOLEAN', false)
        return set
      },
      // align·scrim은 overlay에서만 의미가 있다(below는 Storybook과 동일하게 무시).
      states: [
        { caption: 'Below (기본)', props: {} },
        { caption: 'Overlay · Bottom', props: { layout: 'overlay' } },
        { caption: 'Overlay · Top', props: { layout: 'overlay', align: 'top' } },
        { caption: 'Overlay · Center', props: { layout: 'overlay', align: 'center' } },
        { caption: 'Overlay · Solid scrim', props: { layout: 'overlay', scrim: 'solid' } },
        { caption: 'Overlay · No scrim', props: { layout: 'overlay', scrim: 'none' } },
        { caption: 'Below · 1:1', props: { ratio: '1x1' } },
        { caption: 'Overlay · 21:9', props: { ratio: '21x9', layout: 'overlay' } },
      ],
    },
    {
      key: 'ImageSlide',
      setName: 'DS/ImageSlide',
      eyebrow: 'ORGANISM · MEDIA',
      desc: '3개 이미지 슬라이드(좌우 이동 + 도트). ratio 10값.',
      // Prev/Next INSTANCE_SWAP은 지웠다 — React ImageSlide에 아이콘 ReactNode prop이 없고(§5),
      // 레이어도 'Prev Icon'이라 findAll(name==='Prev')이 아무것도 못 찾는 유령 속성이었다.
      build: (ctx, page) =>
        buildSet(ctx, page, 'DS/ImageSlide', [{ name: 'ratio', values: MEDIA_RATIOS }], (c) => renderImageSlide(ctx, c), {
          texts: [{ prop: 'Counter', layer: 'Counter', def: '1 / 3' }],
        }),
      states: [
        { caption: '16:9', props: {} },
        { caption: '4:3', props: { ratio: '4x3' } },
        { caption: '1:1', props: { ratio: '1x1' } },
        { caption: '9:16', props: { ratio: '9x16' } },
      ],
    },
  ],
}

export const ETC_CATEGORY: CategoryDef = {
  pageName: PAGE_ETC,
  title: 'ETC',
  subtitle: '기타 — 소셜/OAuth 로그인. 카카오·네이버·구글·페이스북·애플·Microsoft·X.',
  docs: [
    {
      key: 'SocialLoginButton',
      setName: 'DS/SocialLoginButton',
      eyebrow: 'MOLECULE · ETC',
      desc: '소셜/OAuth 로그인 버튼(프로바이더·사이즈·로고 토글). 정식 브랜드 로고 SVG.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/SocialLoginButton',
          [
            { name: 'provider', values: ['kakao', 'naver', 'google', 'facebook', 'apple', 'microsoft', 'x'] },
            { name: 'size', values: ['md', 'lg'] },
          ],
          (c) => renderSocial(ctx, c),
          { texts: [{ prop: 'label', layer: 'label', def: '카카오 로그인' }], bools: [{ prop: 'showLogo', layer: 'logo', def: true }] },
        ),
      states: [
        { caption: 'Kakao', props: {} },
        { caption: 'Naver', props: { provider: 'naver' } },
        { caption: 'Google', props: { provider: 'google' } },
        { caption: 'Facebook', props: { provider: 'facebook' } },
        { caption: 'Apple', props: { provider: 'apple' } },
        { caption: 'Microsoft', props: { provider: 'microsoft' } },
        { caption: 'X', props: { provider: 'x' } },
      ],
    },
  ],
}
