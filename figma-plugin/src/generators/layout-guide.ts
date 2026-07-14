// 레이아웃 가이드 페이지 — 어드민 화면의 "치수 정본"을 Figma에 실측(1:1)으로 깐다.
//   1) 1920 캔버스 분해도(사이드바 240/64 + 콘텐츠 패딩 40 + 실사용 1600/1776) — 치수 라벨(화살표+숫자)
//   2) 12컬럼 그리드 오버레이(1600 안에 12컬럼 · gutter 24 · 컬럼 ≈ 111.3)
//   3) 헤더 높이 72(타이틀만) / 104(breadcrumb+설명) 실측 프레임
//   4) 컨테이너 폭 비교(full 1600 · lg 1200 · md 768)
//   5) 밀도 규격(표 행 44/56 · 셀 패딩 8/12 · 본문 13 / 헤더 12) 실물 표 조각 2개
//   6) 공용 플레이스홀더 8종 컴포넌트(Placeholder/*) — 라이브러리 게시 대상이라 '_' 없는 이름.
// 색·크기·간격·라운드는 전부 Variables 바인딩(raw hex는 변수 없을 때의 폴백).
// 플레이스홀더 모티프의 원본(정본)은 Storybook src/shared/placeholders.tsx — 같은 기하/같은 색 규칙을 재현한다.
import {
  type Ctx,
  solid,
  boundPaint,
  boundText,
  bindTokens,
  fillColor,
  strokeColor,
  autoFrame,
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
import { svgToFigmaPath } from '../svg-path'
import type { PresetName } from '../presets'

// 오너 규칙: 페이지 탭은 "순번. System - 이름". 카테고리(1~14) · Admin(15) 다음 번호.
// 카테고리의 '6. System - Layout'(Card·List·Accordion·Divider)과는 다른 페이지 — 여기는 화면 골격 치수 가이드다.
const PAGE_LAYOUT_GUIDE = '16. System - Layout'
// reset(재생성) 대상 목록. reset.ts가 이 배열을 함께 합쳐야 재생성 시 삭제된다(다른 파일 소유 → 배선 필요).
export const LAYOUT_GUIDE_PAGE_NAMES = [PAGE_LAYOUT_GUIDE]

// ── 레이아웃 규격(정본 수치) ──────────────────────────────────────────
const CANVAS_W = 1920
const SIDEBAR_W = 240
const SIDEBAR_COLLAPSED_W = 64
const CONTENT_PAD = 40
const CONTENT_W = CANVAS_W - SIDEBAR_W // 1680
const CONTENT_INNER_W = CONTENT_W - CONTENT_PAD * 2 // 1600 — 실사용(그리드) 영역
const CONTENT_W_COLLAPSED = CANVAS_W - SIDEBAR_COLLAPSED_W // 1856
const CONTENT_INNER_W_COLLAPSED = CONTENT_W_COLLAPSED - CONTENT_PAD * 2 // 1776

const GRID_COLS = 12
const GUTTER = 24
const COL_W = (CONTENT_INNER_W - GUTTER * (GRID_COLS - 1)) / GRID_COLS // 111.333…

const HEADER_H_TITLE = 72 // 타이틀만
const HEADER_H_FULL = 104 // breadcrumb + 타이틀 + 설명

const CONTAINERS: Array<[string, number, string]> = [
  ['full', 1600, '기본 콘텐츠 폭 — 표·대시보드'],
  ['lg', 1200, '읽기 편한 최대 폭 — 상세·폼'],
  ['md', 768, '태블릿·모달·집중 폼'],
]

type Density = 'compact' | 'comfortable'
const ROW_H: Record<Density, number> = { compact: 44, comfortable: 56 }
const CELL_PAD: Record<Density, number> = { compact: 8, comfortable: 12 }
const FONT_BODY = 13
const FONT_HEAD = 12

// 문서 루트 폭 — 1920 도면이 잘리지 않게. 루트 패딩 80·섹션 render 패딩 24 → 안쪽 폭이 정확히 1920.
const DOC_W = CANVAS_W + 80 * 2 + 24 * 2 // 2128
const SOURCE_X = DOC_W + 152 // 플레이스홀더 컴포넌트 소스 열(문서 오른쪽)

// boundText·bindTokens의 정본은 lib/bind.ts다(foundations.ts가 재수출) — 예전엔 categories.ts·admin.ts·
// screens.ts·site.ts·site-screens.ts와 합쳐 6벌로 복제돼 있었다(verify-bindings B4).

/** 변수 바인딩 + 알파(반투명 오버레이용). paint 단위 opacity라 자식 노드는 흐려지지 않는다. */
function fillColorAlpha(ctx: Ctx, node: GeometryMixin, varName: string, hex: string, alpha: number) {
  const v = ctx.vars.get(varName)
  const base: SolidPaint = v ? boundPaint(v) : solid(ctx.userColors[varName] ?? hex)
  node.fills = [{ ...base, opacity: alpha }]
}

// ── 프레임 헬퍼 ───────────────────────────────────────────────────────
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
/** 오토레이아웃 없는 고정 프레임(치수 라벨처럼 절대 좌표로 얹는 용도). */
function noneFrame(name: string, w: number, h: number): FrameNode {
  const f = figma.createFrame()
  f.name = name
  f.resize(w, h)
  f.fills = []
  f.clipsContent = false // 좁은 구간(40·24)의 숫자 칩이 잘리지 않게
  return f
}
/** 문서 루트 — foundations.makeRoot와 같은 스펙이되 폭만 넓힌다(1920 실측 도면이 1240에 안 들어감). */
function wideRoot(ctx: Ctx, name: string, w: number): FrameNode {
  const root = figma.createFrame()
  root.name = name
  root.layoutMode = 'VERTICAL'
  root.counterAxisSizingMode = 'FIXED'
  root.resize(w, root.height)
  root.primaryAxisSizingMode = 'AUTO'
  root.counterAxisAlignItems = 'MIN'
  root.itemSpacing = 56
  root.paddingTop = root.paddingRight = root.paddingBottom = root.paddingLeft = 80
  fillColor(ctx, root, 'color/bgSubtle', SURFACE)
  return root
}

// ── 벡터(경로) ────────────────────────────────────────────────────────
const NUM = /-?\d*\.?\d+(?:e[+-]?\d+)?/gi
/** 절대 M/L/C/Z 경로의 bbox 좌상단. Figma는 지오메트리를 로컬원점으로 정규화하므로 노드 x/y로 위치를 복원한다. */
function bboxMin(d: string): [number, number] {
  let isX = true
  let mnX = Infinity
  let mnY = Infinity
  let m: RegExpExecArray | null
  NUM.lastIndex = 0
  while ((m = NUM.exec(d))) {
    const v = parseFloat(m[0])
    if (isX) mnX = Math.min(mnX, v)
    else mnY = Math.min(mnY, v)
    isX = !isX
  }
  return [mnX === Infinity ? 0 : mnX, mnY === Infinity ? 0 : mnY]
}
/** SVG path(상대·h/v/a 포함) → 벡터 노드. 부모에 붙인 뒤 bbox-min으로 위치 복원(brand-logos.ts 규약). */
function addPath(parent: FrameNode | ComponentNode, d: string, name: string, filled: boolean): VectorNode {
  const fd = svgToFigmaPath(d)
  const [mx, my] = bboxMin(fd)
  const v = figma.createVector()
  v.name = name
  v.vectorPaths = [{ windingRule: filled ? 'NONZERO' : 'NONE', data: fd }]
  v.fills = []
  v.strokes = []
  parent.appendChild(v)
  v.x = mx
  v.y = my
  return v
}

// ── 치수 라벨(화살표 + 숫자) ──────────────────────────────────────────
const DIM_H = 24 // 가로 치수줄 높이
const DIM_W = 28 // 세로 치수줄 폭

function dimChip(ctx: Ctx, label: string): FrameNode {
  const chip = autoFrame('dim label', 'HORIZONTAL')
  chip.counterAxisAlignItems = 'CENTER'
  chip.paddingLeft = chip.paddingRight = 4
  fillColor(ctx, chip, 'color/bg', WHITE) // 치수선을 덮어 숫자가 또렷하게
  chip.appendChild(boundText(ctx, label, 11, 'color/secondary', SUB, true))
  return chip
}
function addArrow(ctx: Ctx, parent: FrameNode, d: string, x: number, y: number) {
  const a = addPath(parent, d, 'arrow', true)
  fillColor(ctx, a, 'color/secondary', SUB)
  a.x = x
  a.y = y
}
/** 가로 치수줄: ←──── 1600 ────→ */
function dimH(ctx: Ctx, w: number, label: string): FrameNode {
  const f = noneFrame('dim / ' + label, Math.max(w, 1), DIM_H)
  const line = figma.createRectangle()
  line.name = 'line'
  line.resize(Math.max(w, 1), 1)
  fillColor(ctx, line, 'color/secondary', SUB)
  f.appendChild(line)
  line.x = 0
  line.y = 11
  addArrow(ctx, f, 'M 7 0 L 0 4 L 7 8 Z', 0, 7)
  addArrow(ctx, f, 'M 0 0 L 7 4 L 0 8 Z', Math.max(w, 1) - 7, 7)
  const chip = dimChip(ctx, label)
  f.appendChild(chip)
  chip.x = (Math.max(w, 1) - chip.width) / 2
  chip.y = (DIM_H - chip.height) / 2
  return f
}
/** 세로 치수줄(행 높이·헤더 높이 실측용). */
function dimV(ctx: Ctx, h: number, label: string): FrameNode {
  const f = noneFrame('dim / ' + label, DIM_W, Math.max(h, 1))
  const line = figma.createRectangle()
  line.name = 'line'
  line.resize(1, Math.max(h, 1))
  fillColor(ctx, line, 'color/secondary', SUB)
  f.appendChild(line)
  line.x = 14
  line.y = 0
  addArrow(ctx, f, 'M 4 0 L 8 7 L 0 7 Z', 10, 0)
  addArrow(ctx, f, 'M 0 0 L 8 0 L 4 7 Z', 10, Math.max(h, 1) - 7)
  const chip = dimChip(ctx, label)
  f.appendChild(chip)
  chip.x = (DIM_W - chip.width) / 2
  chip.y = (Math.max(h, 1) - chip.height) / 2
  return f
}

/** 수치 요약 카드(라벨 + 값). */
function specChip(ctx: Ctx, label: string, value: string): FrameNode {
  const c = autoFrame('spec / ' + label, 'VERTICAL')
  c.itemSpacing = 2
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = 14
  c.cornerRadius = 10
  fillColor(ctx, c, 'color/bgSubtle', SURFACE)
  strokeColor(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'
  c.appendChild(boundText(ctx, label, 12, 'color/secondary', SUB))
  c.appendChild(boundText(ctx, value, 16, 'color/text', INK, true))
  return c
}
function specRow(ctx: Ctx, items: Array<[string, string]>): FrameNode {
  const row = autoFrame('spec row', 'HORIZONTAL')
  row.itemSpacing = 12
  items.forEach(([l, v]) => row.appendChild(specChip(ctx, l, v)))
  return row
}

// ══ 1) 1920 캔버스 분해도 ═════════════════════════════════════════════
/** 사이드바 + 콘텐츠(패딩/실사용) 블록 + 3단 치수줄. 전부 실측 1:1. */
function canvasDiagram(ctx: Ctx, collapsed: boolean): FrameNode {
  const sw = collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W
  const cw = collapsed ? CONTENT_W_COLLAPSED : CONTENT_W
  const iw = collapsed ? CONTENT_INNER_W_COLLAPSED : CONTENT_INNER_W
  const H = 240

  const wrap = autoFrame('Canvas 1920 / ' + (collapsed ? 'Collapsed' : 'Expanded'), 'VERTICAL')
  wrap.itemSpacing = 8

  // 캔버스 본체
  const canvas = fixedFrame('canvas', 'HORIZONTAL', CANVAS_W, H)
  canvas.itemSpacing = 0
  fillColor(ctx, canvas, 'color/bg', WHITE)
  strokeColor(ctx, canvas, 'color/border', BORDER)
  canvas.strokeWeight = 1
  canvas.strokeAlign = 'INSIDE'
  canvas.cornerRadius = 12
  canvas.clipsContent = true

  // 사이드바
  const side = fixedFrame('sidebar', 'VERTICAL', sw, H)
  side.primaryAxisAlignItems = 'CENTER'
  side.counterAxisAlignItems = 'CENTER'
  side.itemSpacing = 4
  side.paddingLeft = side.paddingRight = 8
  fillColor(ctx, side, 'color/bgSubtle', SURFACE)
  side.appendChild(boundText(ctx, collapsed ? '64' : 'Sidebar', 13, 'color/text', INK, true))
  if (!collapsed) side.appendChild(boundText(ctx, '240', 12, 'color/secondary', SUB))
  canvas.appendChild(side)

  // 콘텐츠(패딩 40 + 실사용 + 패딩 40)
  const content = fixedFrame('content', 'HORIZONTAL', cw, H)
  content.itemSpacing = 0
  const padBox = (name: string) => {
    const p = fixedFrame(name, 'VERTICAL', CONTENT_PAD, H)
    fillColorAlpha(ctx, p, 'color/primary', ACCENT, 0.3) // 패딩 = 반투명 강조
    return p
  }
  content.appendChild(padBox('padding-left'))

  const usable = fixedFrame('usable', 'VERTICAL', iw, H)
  usable.primaryAxisAlignItems = 'CENTER'
  usable.counterAxisAlignItems = 'CENTER'
  usable.itemSpacing = 6
  fillColor(ctx, usable, 'color/bg', WHITE)
  strokeColor(ctx, usable, 'color/primary', ACCENT)
  usable.strokeWeight = 2
  usable.strokeAlign = 'INSIDE'
  usable.dashPattern = [8, 6]
  usable.appendChild(boundText(ctx, `실사용 ${iw}`, 20, 'color/primary', ACCENT, true))
  usable.appendChild(
    boundText(ctx, collapsed ? '사이드바 접힘 — 12컬럼 그리드가 이 폭으로 늘어난다' : '12컬럼 그리드 영역', 13, 'color/secondary', SUB),
  )
  content.appendChild(usable)
  content.appendChild(padBox('padding-right'))
  canvas.appendChild(content)
  wrap.appendChild(canvas)

  // 치수줄 1 — 사이드바 | 콘텐츠
  const r1 = noneFrame('dims / 1', CANVAS_W, DIM_H)
  const d1a = dimH(ctx, sw, String(sw))
  r1.appendChild(d1a)
  d1a.x = 0
  d1a.y = 0
  const d1b = dimH(ctx, cw, String(cw))
  r1.appendChild(d1b)
  d1b.x = sw
  d1b.y = 0
  wrap.appendChild(r1)

  // 치수줄 2 — 패딩 40 | 실사용 | 패딩 40
  const r2 = noneFrame('dims / 2', CANVAS_W, DIM_H)
  const d2a = dimH(ctx, CONTENT_PAD, String(CONTENT_PAD))
  r2.appendChild(d2a)
  d2a.x = sw
  d2a.y = 0
  const d2b = dimH(ctx, iw, String(iw))
  r2.appendChild(d2b)
  d2b.x = sw + CONTENT_PAD
  d2b.y = 0
  const d2c = dimH(ctx, CONTENT_PAD, String(CONTENT_PAD))
  r2.appendChild(d2c)
  d2c.x = sw + CONTENT_PAD + iw
  d2c.y = 0
  wrap.appendChild(r2)

  // 치수줄 3 — 캔버스 전체
  const total = dimH(ctx, CANVAS_W, `${CANVAS_W} · 캔버스 전체`)
  wrap.appendChild(total)

  const cap = boundText(
    ctx,
    collapsed
      ? `사이드바 접힘 · ${SIDEBAR_COLLAPSED_W} + ${CONTENT_W_COLLAPSED} (패딩 ${CONTENT_PAD} + 실사용 ${CONTENT_INNER_W_COLLAPSED} + 패딩 ${CONTENT_PAD})`
      : `사이드바 펼침 · ${SIDEBAR_W} + ${CONTENT_W} (패딩 ${CONTENT_PAD} + 실사용 ${CONTENT_INNER_W} + 패딩 ${CONTENT_PAD})`,
    13,
    'color/secondary',
    SUB,
    true,
  )
  wrap.appendChild(cap)
  return wrap
}

// ══ 2) 12컬럼 그리드 오버레이 ═════════════════════════════════════════
function gridOverlay(ctx: Ctx): FrameNode {
  const wrap = autoFrame('Grid 12', 'VERTICAL')
  wrap.itemSpacing = 8

  const stage = fixedFrame('grid stage', 'HORIZONTAL', CONTENT_INNER_W, 176)
  stage.itemSpacing = GUTTER
  fillColor(ctx, stage, 'color/bg', WHITE)
  strokeColor(ctx, stage, 'color/border', BORDER)
  stage.strokeWeight = 1
  stage.strokeAlign = 'INSIDE'
  stage.cornerRadius = 12
  stage.clipsContent = true

  for (let i = 0; i < GRID_COLS; i++) {
    const col = fixedFrame('col ' + (i + 1), 'VERTICAL', COL_W, 176)
    col.primaryAxisAlignItems = 'CENTER'
    col.counterAxisAlignItems = 'CENTER'
    fillColorAlpha(ctx, col, 'color/primary', ACCENT, 0.3) // 반투명 컬럼 블록
    col.appendChild(boundText(ctx, String(i + 1), 13, 'color/primary', ACCENT, true))
    stage.appendChild(col)
  }
  wrap.appendChild(stage)

  // 컬럼/거터 실측줄 — 1컬럼(111.3) + 거터(24)
  const measure = noneFrame('dims / col+gutter', CONTENT_INNER_W, DIM_H)
  const dc = dimH(ctx, COL_W, String(Math.round(COL_W * 10) / 10))
  measure.appendChild(dc)
  dc.x = 0
  dc.y = 0
  const dg = dimH(ctx, GUTTER, String(GUTTER))
  measure.appendChild(dg)
  dg.x = COL_W
  dg.y = 0
  wrap.appendChild(measure)

  wrap.appendChild(dimH(ctx, CONTENT_INNER_W, `${CONTENT_INNER_W} · 12컬럼 + 거터 11개`))
  wrap.appendChild(
    boundText(
      ctx,
      `12컬럼 · 거터 ${GUTTER} · 컬럼 ${Math.round(COL_W * 100) / 100} — 12 × ${Math.round(COL_W * 10) / 10} + 11 × ${GUTTER} = ${CONTENT_INNER_W}`,
      13,
      'color/secondary',
      SUB,
      true,
    ),
  )
  return wrap
}

// ══ 3) 헤더 높이(72 / 104) ════════════════════════════════════════════
function headerCase(ctx: Ctx, full: boolean): FrameNode {
  const h = full ? HEADER_H_FULL : HEADER_H_TITLE
  const row = autoFrame('Header ' + h, 'HORIZONTAL')
  row.counterAxisAlignItems = 'MIN'
  row.itemSpacing = 12

  row.appendChild(dimV(ctx, h, String(h)))

  const header = fixedFrame('header', full ? 'VERTICAL' : 'HORIZONTAL', CONTENT_INNER_W, h)
  header.paddingLeft = header.paddingRight = 24
  fillColor(ctx, header, 'color/bg', WHITE)
  strokeColor(ctx, header, 'color/border', BORDER)
  header.strokeWeight = 1
  header.strokeAlign = 'INSIDE'
  header.cornerRadius = 12

  if (full) {
    header.primaryAxisAlignItems = 'CENTER'
    header.counterAxisAlignItems = 'MIN'
    header.itemSpacing = 4
    header.paddingTop = header.paddingBottom = 16
    header.appendChild(boundText(ctx, '관리 › 사용자 › 목록', 12, 'color/secondary', SUB))
    header.appendChild(boundText(ctx, '사용자 관리', 20, 'color/text', INK, true))
    header.appendChild(boundText(ctx, '가입한 사용자를 검색하고 권한을 변경합니다.', 13, 'color/secondary', SUB))
  } else {
    header.primaryAxisAlignItems = 'MIN'
    header.counterAxisAlignItems = 'CENTER'
    header.itemSpacing = 8
    header.appendChild(boundText(ctx, '사용자 관리', 20, 'color/text', INK, true))
  }
  row.appendChild(header)

  const cap = autoFrame('cap', 'VERTICAL')
  cap.itemSpacing = 2
  cap.paddingTop = 4
  cap.appendChild(boundText(ctx, `${h}px`, 14, 'color/text', INK, true))
  cap.appendChild(
    boundText(ctx, full ? 'breadcrumb + 타이틀 + 설명' : '타이틀만 (세로 중앙)', 12, 'color/secondary', SUB),
  )
  row.appendChild(cap)
  return row
}

// ══ 4) 컨테이너 폭 비교 바 ════════════════════════════════════════════
function containerBar(ctx: Ctx, name: string, w: number, note: string): FrameNode {
  const item = autoFrame('Container / ' + name, 'VERTICAL')
  item.itemSpacing = 6

  const bar = fixedFrame('bar', 'HORIZONTAL', w, 48)
  bar.primaryAxisAlignItems = 'MIN'
  bar.counterAxisAlignItems = 'CENTER'
  bar.itemSpacing = 8
  bar.paddingLeft = bar.paddingRight = 16
  bar.cornerRadius = 10
  bar.clipsContent = true
  fillColor(ctx, bar, 'color/primary/100', '#EDF2FF')
  strokeColor(ctx, bar, 'color/primary', ACCENT)
  bar.strokeWeight = 1
  bar.strokeAlign = 'INSIDE'
  bar.appendChild(boundText(ctx, name, 14, 'color/primary', ACCENT, true))
  bar.appendChild(boundText(ctx, note, 12, 'color/secondary', SUB))
  item.appendChild(bar)

  item.appendChild(dimH(ctx, w, `${w}px`))
  return item
}

// ══ 5) 밀도 규격(표 조각) ═════════════════════════════════════════════
const TABLE_COLS: Array<[string, number, boolean]> = [
  ['이름', 220, false],
  ['상태', 140, false],
  ['수량', 160, true], // 숫자 = 우측 정렬
]
const TABLE_W = TABLE_COLS.reduce((s, c) => s + c[1], 0) // 520
const TABLE_ROWS: string[][] = [
  ['김민수', '활성', '128'],
  ['박지현', '대기', '42'],
  ['이서준', '정지', '0'],
]

function tableRow(ctx: Ctx, d: Density, cells: string[], head: boolean): FrameNode {
  const h = ROW_H[d]
  const pad = CELL_PAD[d]
  const row = fixedFrame(head ? 'head row' : 'row', 'HORIZONTAL', TABLE_W, h)
  row.itemSpacing = 0
  if (head) fillColor(ctx, row, 'color/bgSubtle', SURFACE)
  else fillColor(ctx, row, 'color/bg', WHITE)
  // 행 구분선은 아래쪽만
  strokeColor(ctx, row, 'color/border', BORDER)
  row.strokeAlign = 'INSIDE'
  row.strokeTopWeight = 0
  row.strokeLeftWeight = 0
  row.strokeRightWeight = 0
  row.strokeBottomWeight = 1

  TABLE_COLS.forEach(([, w, right], i) => {
    const cell = fixedFrame('cell', 'HORIZONTAL', w, h)
    cell.primaryAxisAlignItems = right ? 'MAX' : 'MIN'
    cell.counterAxisAlignItems = 'CENTER'
    cell.paddingLeft = cell.paddingRight = pad
    const t = head
      ? boundText(ctx, cells[i], FONT_HEAD, 'color/secondary', SUB, true)
      : boundText(ctx, cells[i], FONT_BODY, 'color/text', INK)
    cell.appendChild(t)
    row.appendChild(cell)
  })
  return row
}

function densityTable(ctx: Ctx, d: Density): FrameNode {
  const item = autoFrame('Density / ' + d, 'VERTICAL')
  item.itemSpacing = 10

  const stage = autoFrame('stage', 'HORIZONTAL')
  stage.counterAxisAlignItems = 'MIN'
  stage.itemSpacing = 8

  // 표 왼쪽에 행 높이 실측줄(헤더 행만큼 띄우고 첫 본문 행에 정확히 맞춘다)
  const rulerCol = autoFrame('ruler', 'VERTICAL')
  rulerCol.itemSpacing = 0
  const spacer = fixedFrame('spacer', 'VERTICAL', DIM_W, ROW_H[d])
  rulerCol.appendChild(spacer)
  rulerCol.appendChild(dimV(ctx, ROW_H[d], String(ROW_H[d])))
  stage.appendChild(rulerCol)

  const table = autoFrame('table', 'VERTICAL')
  table.counterAxisSizingMode = 'FIXED'
  table.resize(TABLE_W, table.height)
  table.itemSpacing = 0
  table.cornerRadius = 12
  table.clipsContent = true
  fillColor(ctx, table, 'color/bg', WHITE)
  strokeColor(ctx, table, 'color/border', BORDER)
  table.strokeWeight = 1
  table.strokeAlign = 'INSIDE'
  table.appendChild(
    tableRow(
      ctx,
      d,
      TABLE_COLS.map((c) => c[0]),
      true,
    ),
  )
  TABLE_ROWS.forEach((r) => table.appendChild(tableRow(ctx, d, r, false)))
  stage.appendChild(table)
  item.appendChild(stage)

  const cap = autoFrame('cap', 'VERTICAL')
  cap.itemSpacing = 2
  cap.appendChild(
    boundText(ctx, d === 'compact' ? 'compact · 행 44' : 'comfortable · 행 56', 14, 'color/text', INK, true),
  )
  cap.appendChild(
    boundText(
      ctx,
      `셀 패딩 ${CELL_PAD[d]} · 본문 ${FONT_BODY} / 헤더 ${FONT_HEAD} · ${d === 'compact' ? '많은 행을 한 화면에' : '터치·가독 우선'}`,
      12,
      'color/secondary',
      SUB,
    ),
  )
  item.appendChild(cap)
  return item
}

// ══ 6) 공용 플레이스홀더 8종 ══════════════════════════════════════════
// 정본: src/shared/placeholders.tsx (같은 64 캔버스 · 둥근 사각 프레임(rx 10) · 획 1.5 · 강조 1요소).
export const PLACEHOLDER_KINDS = [
  'image',
  'video',
  'file',
  'empty',
  'search',
  'error',
  'delete',
  'success',
] as const
export type PlaceholderKind = (typeof PLACEHOLDER_KINDS)[number]

/** Icon System의 ICON_COMPONENTS와 같은 규약 — 만든 컴포넌트를 여기 등록해 다른 생성기가 참조. */
export const PLACEHOLDER_COMPONENTS = new Map<PlaceholderKind, ComponentNode>()

const PH_CANVAS = 64
const PH_STROKE = 1.5

// 선 = color/text · 면 = color/bgSubtle · 강조 = 심볼 안 한 요소에만(기본 primary, 의미색 3종만 semantic)
type PhRole = 'line' | 'surface' | 'accentLine' | 'accentFill' | 'accentShape'
type PhShape =
  | { s: 'path'; d: string; role: PhRole }
  | { s: 'circle'; cx: number; cy: number; r: number; role: PhRole }

const PH_SYMBOL: Record<PlaceholderKind, PhShape[]> = {
  // 이미지: 산등성이 + 해(강조)
  image: [
    { s: 'circle', cx: 21, cy: 22, r: 3.5, role: 'accentFill' },
    { s: 'path', d: 'M8 47 L22 33 L31 42 L40 34 L56 50', role: 'line' },
  ],
  // 동영상: 중앙 재생 삼각형(강조)
  video: [{ s: 'path', d: 'M27 23 L44 32 L27 41 Z', role: 'accentShape' }],
  // 파일: 문서 시트 + 접힌 모서리(강조) + 본문 2줄
  file: [
    { s: 'path', d: 'M24 17 h9 l9 9 v21 a2 2 0 0 1 -2 2 h-16 a2 2 0 0 1 -2 -2 v-28 a2 2 0 0 1 2 -2 z', role: 'surface' },
    { s: 'path', d: 'M33 17 v7 a2 2 0 0 0 2 2 h7', role: 'accentLine' },
    { s: 'path', d: 'M27 34 h10 M27 41 h6', role: 'line' },
  ],
  // 빈 목록: 본문 줄 3개 — 마지막 줄만 짧고 강조
  empty: [
    { s: 'path', d: 'M16 25 h32 M16 33 h32', role: 'line' },
    { s: 'path', d: 'M16 41 h14', role: 'accentLine' },
  ],
  // 검색: 돋보기 렌즈 + 손잡이(강조)
  search: [
    { s: 'circle', cx: 29, cy: 29, r: 9, role: 'line' },
    { s: 'path', d: 'M36 36 L46 46', role: 'accentLine' },
  ],
  // 오류: 느낌표 — 점만 강조
  error: [
    { s: 'path', d: 'M32 20 v15', role: 'line' },
    { s: 'circle', cx: 32, cy: 43, r: 2.5, role: 'accentFill' },
  ],
  // 삭제: 휴지통 — 안쪽 바 2개만 강조
  delete: [
    { s: 'path', d: 'M21 25 h22', role: 'line' },
    { s: 'path', d: 'M28 25 v-2.5 a2 2 0 0 1 2 -2 h4 a2 2 0 0 1 2 2 v2.5', role: 'line' },
    { s: 'path', d: 'M24.5 25 v19 a3 3 0 0 0 3 3 h9 a3 3 0 0 0 3 -3 v-19', role: 'line' },
    { s: 'path', d: 'M29 31 v10 M35 31 v10', role: 'accentLine' },
  ],
  // 완료: 원 안의 체크 — 체크만 강조
  success: [
    { s: 'circle', cx: 32, cy: 32, r: 11, role: 'surface' },
    { s: 'path', d: 'M27 32.5 l3.5 3.5 L38 28', role: 'accentLine' },
  ],
}

const PH_TONE: Record<PlaceholderKind, { varName: string; hex: string }> = {
  image: { varName: 'color/primary', hex: ACCENT },
  video: { varName: 'color/primary', hex: ACCENT },
  file: { varName: 'color/primary', hex: ACCENT },
  empty: { varName: 'color/primary', hex: ACCENT },
  search: { varName: 'color/primary', hex: ACCENT },
  error: { varName: 'color/error', hex: '#F04452' },
  delete: { varName: 'color/error', hex: '#F04452' },
  success: { varName: 'color/success', hex: '#00C471' },
}

const PH_LABEL: Record<PlaceholderKind, string> = {
  image: '이미지 없음',
  video: '재생 불가',
  file: '첨부 없음',
  empty: '내용 없음',
  search: '검색 결과 없음',
  error: '오류',
  delete: '삭제 확인',
  success: '완료',
}

/** 획 1.5 · 둥근 캡/조인 · 중앙 정렬(SVG와 동일). */
function phStroke(ctx: Ctx, node: GeometryMixin, varName: string, hex: string) {
  strokeColor(ctx, node, varName, hex)
  node.strokeWeight = PH_STROKE
  node.strokeCap = 'ROUND'
  node.strokeJoin = 'ROUND'
  node.strokeAlign = 'CENTER'
}
function applyRole(ctx: Ctx, node: GeometryMixin, role: PhRole, tone: { varName: string; hex: string }) {
  if (role === 'line') {
    node.fills = []
    phStroke(ctx, node, 'color/text', INK)
  } else if (role === 'surface') {
    fillColor(ctx, node, 'color/bgSubtle', SURFACE)
    phStroke(ctx, node, 'color/text', INK)
  } else if (role === 'accentLine') {
    node.fills = []
    phStroke(ctx, node, tone.varName, tone.hex)
  } else if (role === 'accentFill') {
    fillColor(ctx, node, tone.varName, tone.hex)
    node.strokes = []
  } else {
    // accentShape — 면·선 모두 강조색
    fillColor(ctx, node, tone.varName, tone.hex)
    phStroke(ctx, node, tone.varName, tone.hex)
  }
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/** 플레이스홀더 1종 → Figma 컴포넌트. 이름 'Placeholder/Image' — '_' 없음(라이브러리 게시 대상). */
function buildPlaceholder(ctx: Ctx, kind: PlaceholderKind): ComponentNode {
  const tone = PH_TONE[kind]
  const c = figma.createComponent()
  c.name = 'Placeholder/' + capitalize(kind)
  c.resize(PH_CANVAS, PH_CANVAS)
  c.fills = []
  c.clipsContent = false
  c.description = `공용 플레이스홀더 · ${PH_LABEL[kind]}. 둥근 사각 프레임(rx 10) + 심볼 · 획 1.5. 선 color/text · 면 color/bgSubtle · 강조 ${tone.varName}.`

  // 8종을 한 가족으로 묶는 공통 프레임
  const frame = figma.createRectangle()
  frame.name = 'frame'
  frame.resize(52, 48)
  frame.cornerRadius = 10
  frame.fills = []
  phStroke(ctx, frame, 'color/text', INK)
  c.appendChild(frame)
  frame.x = 6
  frame.y = 8

  for (const sh of PH_SYMBOL[kind]) {
    if (sh.s === 'circle') {
      const e = figma.createEllipse()
      e.name = 'symbol'
      e.resize(sh.r * 2, sh.r * 2)
      applyRole(ctx, e, sh.role, tone)
      c.appendChild(e)
      e.x = sh.cx - sh.r
      e.y = sh.cy - sh.r
    } else {
      const filled = sh.role === 'surface' || sh.role === 'accentFill' || sh.role === 'accentShape'
      const v = addPath(c, sh.d, 'symbol', filled)
      applyRole(ctx, v, sh.role, tone)
    }
  }
  return c
}

/** 8종을 만들어 페이지(문서 오른쪽 소스 열)에 배치하고 맵에 등록. */
function buildPlaceholders(ctx: Ctx, page: PageNode): void {
  PLACEHOLDER_COMPONENTS.clear()
  const title = boundText(ctx, 'Placeholder — 공용 플레이스홀더 8종 (라이브러리 게시 대상)', 16, 'color/text', INK, true)
  page.appendChild(title)
  title.x = SOURCE_X
  title.y = 148

  PLACEHOLDER_KINDS.forEach((kind, i) => {
    try {
      const c = buildPlaceholder(ctx, kind)
      page.appendChild(c)
      c.x = SOURCE_X + (i % 4) * 112
      c.y = 200 + Math.floor(i / 4) * 112
      bindTokens(ctx, c) // rx 10 → radius/10 (획 1.5는 변수가 없어 리터럴 유지)
      PLACEHOLDER_COMPONENTS.set(kind, c)
    } catch (e) {
      ctx.warnings.push(`Placeholder/${capitalize(kind)} 생성 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  })
}

/** 문서에 놓는 플레이스홀더 샘플(인스턴스 + 캡션). */
function placeholderItem(ctx: Ctx, kind: PlaceholderKind): FrameNode {
  const item = autoFrame('Placeholder / ' + kind, 'VERTICAL')
  item.counterAxisAlignItems = 'CENTER'
  item.itemSpacing = 8
  item.paddingTop = item.paddingBottom = 16
  item.paddingLeft = item.paddingRight = 16
  item.cornerRadius = 12
  item.counterAxisSizingMode = 'FIXED'
  item.resize(180, item.height)
  fillColor(ctx, item, 'color/bgSubtle', SURFACE)

  const comp = PLACEHOLDER_COMPONENTS.get(kind)
  if (comp) {
    const inst = comp.createInstance()
    inst.name = 'Placeholder'
    item.appendChild(inst)
  }
  const cap = autoFrame('cap', 'VERTICAL')
  cap.counterAxisAlignItems = 'CENTER'
  cap.itemSpacing = 2
  cap.appendChild(boundText(ctx, 'Placeholder/' + capitalize(kind), 12, 'color/text', INK, true))
  cap.appendChild(boundText(ctx, PH_LABEL[kind], 11, 'color/secondary', MUTED))
  item.appendChild(cap)
  return item
}

// ── 페이지 생성 ───────────────────────────────────────────────────────
export async function generateLayoutGuide(
  fontFamily: string,
  colors?: Record<string, string>,
  preset?: PresetName,
): Promise<string[]> {
  const ctx = await setup(fontFamily, colors, preset)
  if (!ctx.vars.get('color/primary')) {
    ctx.warnings.push("Variables가 없습니다 — '토큰'을 먼저 생성하세요(색이 프리셋과 연결되지 않습니다).")
  }
  if (figma.root.children.some((p) => p.name === PAGE_LAYOUT_GUIDE)) {
    ctx.warnings.push(`페이지 '${PAGE_LAYOUT_GUIDE}' 이미 존재 — 건너뜀(재생성하려면 '기존 삭제 후 재생성').`)
    return ctx.warnings
  }

  const page = figma.createPage()
  page.name = PAGE_LAYOUT_GUIDE
  applyPageColorMode(ctx, page)

  // 컴포넌트(소스)는 페이지에 직접, 문서 안에는 인스턴스만 — 카테고리와 같은 규약.
  buildPlaceholders(ctx, page)

  const root = wideRoot(ctx, 'Layout', DOC_W)
  placeRoot(root, page)
  makeHeader(
    ctx,
    root,
    'Layout',
    '어드민 화면의 치수 정본 — 1920 캔버스 분해도 · 12컬럼 그리드 · 헤더 높이 · 컨테이너 폭 · 밀도 · 공용 플레이스홀더 8종. 모든 도면은 실측(1:1)이며 색·크기·간격·라운드는 Variables에 바인딩됩니다.',
  )

  // 1. 캔버스 분해도
  const s1 = makeSection(ctx, root, {
    eyebrow: 'LAYOUT · CANVAS',
    name: '1920 캔버스 분해도',
    desc: `기준 캔버스 ${CANVAS_W}. 사이드바 ${SIDEBAR_W} + 콘텐츠 ${CONTENT_W}(패딩 ${CONTENT_PAD} + 실사용 ${CONTENT_INNER_W} + 패딩 ${CONTENT_PAD}). 사이드바를 접으면 ${SIDEBAR_COLLAPSED_W} + ${CONTENT_W_COLLAPSED}이 되고 실사용 폭이 ${CONTENT_INNER_W_COLLAPSED}로 늘어납니다.`,
    meta: [`Canvas: ${CANVAS_W}`, `Sidebar: ${SIDEBAR_W} / ${SIDEBAR_COLLAPSED_W}`, `Padding: ${CONTENT_PAD}`, 'Scale: 1:1'],
    renderDir: 'VERTICAL',
  })
  s1.itemSpacing = 40
  s1.appendChild(canvasDiagram(ctx, false))
  s1.appendChild(canvasDiagram(ctx, true))
  s1.appendChild(
    specRow(ctx, [
      ['사이드바', `${SIDEBAR_W} / ${SIDEBAR_COLLAPSED_W}`],
      ['콘텐츠', `${CONTENT_W} / ${CONTENT_W_COLLAPSED}`],
      ['콘텐츠 패딩', `${CONTENT_PAD} × 2`],
      ['실사용', `${CONTENT_INNER_W} / ${CONTENT_INNER_W_COLLAPSED}`],
    ]),
  )

  // 2. 12컬럼 그리드
  const s2 = makeSection(ctx, root, {
    eyebrow: 'LAYOUT · GRID',
    name: '12컬럼 그리드',
    desc: `실사용 ${CONTENT_INNER_W} 안에 12컬럼 · 거터 ${GUTTER}. 컬럼 폭은 ${Math.round(COL_W * 100) / 100}(≈ ${Math.round(COL_W * 10) / 10})이며, 카드/폼은 컬럼 배수(예: 3·4·6컬럼)로 폭을 잡습니다.`,
    meta: [`Columns: ${GRID_COLS}`, `Gutter: ${GUTTER}`, `Column: ≈${Math.round(COL_W * 10) / 10}`, `Total: ${CONTENT_INNER_W}`],
    renderDir: 'VERTICAL',
  })
  s2.itemSpacing = 16
  s2.appendChild(gridOverlay(ctx))

  // 3. 헤더 높이
  const s3 = makeSection(ctx, root, {
    eyebrow: 'LAYOUT · HEADER',
    name: '헤더 높이',
    desc: `페이지 헤더는 두 가지뿐입니다. 타이틀만 있으면 ${HEADER_H_TITLE}, breadcrumb과 설명이 붙으면 ${HEADER_H_FULL}. 그 사이 값을 임의로 쓰지 않습니다.`,
    meta: [`Title only: ${HEADER_H_TITLE}`, `With breadcrumb: ${HEADER_H_FULL}`, 'Scale: 1:1'],
    renderDir: 'VERTICAL',
  })
  s3.itemSpacing = 24
  s3.appendChild(headerCase(ctx, false))
  s3.appendChild(headerCase(ctx, true))

  // 4. 컨테이너 폭
  const s4 = makeSection(ctx, root, {
    eyebrow: 'LAYOUT · CONTAINER',
    name: '컨테이너 폭',
    desc: '콘텐츠 컨테이너는 세 단계로만 씁니다. full은 실사용 폭 전체, lg는 읽기 편한 상한, md는 태블릿·모달 폭입니다.',
    meta: CONTAINERS.map(([n, w]) => `${n}: ${w}`),
    renderDir: 'VERTICAL',
  })
  s4.itemSpacing = 20
  CONTAINERS.forEach(([n, w, note]) => s4.appendChild(containerBar(ctx, n, w, note)))

  // 5. 밀도 규격
  const s5 = makeSection(ctx, root, {
    eyebrow: 'LAYOUT · DENSITY',
    name: '밀도 규격',
    desc: `표 행 높이는 compact ${ROW_H.compact} / comfortable ${ROW_H.comfortable} 두 가지. 셀 패딩은 각각 ${CELL_PAD.compact} / ${CELL_PAD.comfortable}이고, 본문 ${FONT_BODY} · 헤더 ${FONT_HEAD}는 두 밀도에서 동일합니다.`,
    meta: [`Row: ${ROW_H.compact} / ${ROW_H.comfortable}`, `Cell pad: ${CELL_PAD.compact} / ${CELL_PAD.comfortable}`, `Body ${FONT_BODY} · Head ${FONT_HEAD}`],
    renderDir: 'WRAP',
  })
  s5.itemSpacing = 40
  s5.appendChild(densityTable(ctx, 'compact'))
  s5.appendChild(densityTable(ctx, 'comfortable'))

  // 6. 플레이스홀더
  const s6 = makeSection(ctx, root, {
    eyebrow: 'LAYOUT · PLACEHOLDER',
    name: '공용 플레이스홀더',
    desc: '이미지·동영상·첨부·빈 목록·검색·오류·삭제·완료 8종. 둥근 사각 프레임(rx 10) + 심볼이라 한 가족으로 읽히고, 선은 color/text · 면은 color/bgSubtle · 강조는 심볼 안 한 요소에만 들어갑니다(오류·삭제는 error, 완료는 success).',
    meta: ['Kinds: 8', 'Canvas: 64', 'Stroke: 1.5', 'Name: Placeholder/*'],
    renderDir: 'WRAP',
  })
  PLACEHOLDER_KINDS.forEach((k) => s6.appendChild(placeholderItem(ctx, k)))

  // 문서 전체의 보더·패딩·라운드·불투명도를 변수로 후처리 바인딩
  bindTokens(ctx, root)
  return ctx.warnings
}
