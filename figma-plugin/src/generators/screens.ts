// 어드민 화면(스크린) 페이지 — 스토리북 어드민 24화면을 1920 폭 화면 프레임으로.
// (2026-07 §A 배치: 카테고리 관리/등록·메인비주얼 관리/등록·시공 문의 내역/상세·문의 설정·
//  사용자 목록·상품 상세·상품 등록/수정 10종을 신설했다 — 오너 사이드바 6그룹 커버리지 완성.)
//
// 화면 = 사이드바(DS/AdminSidebar 인스턴스) + 콘텐츠 열. 사이드바의 active 베리언트가 화면마다 달라
//   '지금 어느 메뉴인지'가 프레임 안에서 그대로 보인다. 메뉴 라벨의 단일 소스는 ./admin-menu(ADMIN_MENU)다.
//
// 오너 확정(2026-07): 화면은 '15. System - Admin Component'가 만든 컴포넌트 세트의 **인스턴스로 조립**한다.
//   화면이 프레임을 직접 그리면 컴포넌트를 고쳐도 화면이 안 바뀐다 — 그게 "왜 컴포넌트 변수 처리가
//   안 되어 있냐"는 지적의 정체였다. 이제 페이지 헤더·표·오늘의 할일·정의 리스트·메모·타임라인·
//   드롭존은 ADMIN_SETS에서 세트를 꺼내 createInstance → setProperties로 조립한다.
//   텍스트는 반드시 컴포넌트 TEXT 속성으로 덮어쓴다(인스턴스 안 레이어를 직접 찾지 않는다).
//
// 폴백: '어드민 컴포넌트' 스코프를 끄고 '어드민 화면'만 켜면 ADMIN_SETS가 비어 있다 →
//   예전처럼 직접 그리는 경로(draw*)로 내려가 화면이 비지 않게 하고 warning을 남긴다.
//
// 밀도 규격: 표 행 44 / 셀 패딩 8·12 / 본문 13 / 헤더 12. 마감: 1px 보더 + radius lg(12), 그림자 없음,
//   bgSubtle 배경 위 흰 카드. 색·타이포·간격·라운드는 전부 Variables 바인딩(폴백은 리터럴 hex).
import {
  type Ctx,
  solid,
  boundPaint,
  boundText,
  bindFillVar,
  bindStrokeVar,
  bindTokens,
  setup,
  applyPageColorMode,
  INK,
  SUB,
  BORDER,
  SURFACE,
  ACCENT,
  WHITE,
} from './foundations'
import { iconInstance } from './icon-vec'
import { ADMIN_SETS, adminSet, adoptAdminSets, propKeys, PAGE_ADMIN } from './admin'
import { ADMIN_MENU, groupOfActive, type AdminActive } from './admin-menu'
import type { PresetName } from '../presets'

// 오너 규칙: 페이지 탭은 "순번. System - 이름". 카테고리(1~14) · Admin(15) · Layout(16) 다음 번호.
// 오너 확정(2026-07 개편): '17. System - Admin Screens' → '17. System - Admin Pages'로 개명.
const PAGE_SCREENS = '17. System - Admin Pages'
// reset 대상(재생성 시 삭제) — reset.ts가 이 배열을 읽는다.
// 옛 이름도 남겨 둔다 — 안 그러면 개명 전 파일의 유령 페이지가 영영 안 지워진다.
export const SCREEN_PAGE_NAMES = [PAGE_SCREENS, '17. System - Admin Screens']

// ── 밀도 규격(스펙) ──────────────────────────────────────────────────
const SCREEN_W = 1920 // 화면 프레임 전체(사이드바 + 콘텐츠)
const SIDEBAR_W = 240 // DS/AdminSidebar(collapsed=false)의 폭과 같아야 한다
const CONTENT_W = SCREEN_W - SIDEBAR_W // 1680 — 콘텐츠 열
const SCREEN_PAD = 32
const INNER_W = CONTENT_W - SCREEN_PAD * 2 // 1616 — 콘텐츠 열 안쪽 폭(전폭 표·카드)
const GAP = 20
const PANEL_W = 240
const MAIN_W = INNER_W - PANEL_W - GAP // 1356 — 좌 패널이 있는 화면의 본문 폭
const ROW_H = 44 // 표 행
const CELL_PX = 12 // 셀 좌우 패딩
const CELL_PY = 8 // 셀 상하 패딩
const F_BODY = 13 // 본문
const F_HEAD = 12 // 표 헤더
const R_CARD = 12 // radius lg
const R_CTRL = 8 // 컨트롤(입력·버튼)
const CTRL_H = 36 // 컨트롤 높이
const SCREEN_GAP = 120 // 화면 프레임 간 세로 간격

// 톤 → 폴백 hex(변수 없을 때만 사용)
type Tone = 'primary' | 'secondary' | 'success' | 'warning' | 'error'
const TONE_HEX: Record<Tone, string> = {
  primary: ACCENT,
  secondary: SUB,
  error: '#F04452',
  success: '#00C471',
  warning: '#FF9F0A',
}
/** soft 배경 폴백 — 변수 color/<tone>/100 이 없을 때만 쓰는 리터럴(흰색 쪽으로 mix). */
function tintHex(hex: string, amt = 0.86): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * amt)
  return '#' + ((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, '0')
}

// boundText·bindFillVar·bindStrokeVar·bindTokens의 정본은 lib/bind.ts다(foundations.ts가 재수출) —
// 예전엔 categories.ts·admin.ts·layout-guide.ts·site.ts·site-screens.ts와 합쳐 6벌로 복제돼
// 있었다(verify-bindings B4). 인스턴스 내부를 건너뛰는 동작은 bindTokens(ctx, root, { skipInstances: true })
// 옵션으로 흡수했다 — 세트(15. Admin)에서 이미 바인딩된 인스턴스에 또 오버라이드를 쌓으면
// "컴포넌트를 고쳐도 화면이 안 바뀌는" 상태로 되돌아간다(오너 지적의 핵심 증상).

// ── 컴포넌트 인스턴스 조립 ───────────────────────────────────────────
// 화면의 블록은 여기를 통해서만 컴포넌트가 된다. 세트가 없으면 null → 호출부가 draw* 폴백으로 내려간다.
type InstOpts = {
  /** 베리언트 축(축 이름 그대로). 예: { density: 'compact', frame: 'flush' } */
  variant?: Record<string, string>
  /** TEXT·BOOLEAN 속성(표시 이름 기준). 예: { Title: '상품 목록', 'Show Select': false } */
  props?: Record<string, string | boolean>
  name?: string
}
/** 세트가 없다고 이미 경고한 이름 — 24화면 × 같은 세트로 경고가 도배되는 걸 막는다. */
const warnedMissing = new Set<string>()

/**
 * ADMIN_SETS에서 세트를 꺼내 인스턴스를 만들고 속성을 건다.
 * TEXT·BOOLEAN 속성은 setProperties에 전체 키('Title#12:3')가 필요해 propKeys로 표시 이름을 해석한다.
 */
function inst(ctx: Ctx, setName: string, opts: InstOpts = {}): InstanceNode | null {
  const set = adminSet(setName)
  if (!set) {
    if (!warnedMissing.has(setName)) {
      warnedMissing.add(setName)
      ctx.warnings.push(
        `${setName} 세트가 없어 화면에 직접 그렸습니다 — '어드민 컴포넌트'를 함께 생성하면 인스턴스로 조립됩니다.`,
      )
    }
    return null
  }

  let node: InstanceNode
  try {
    node = set.defaultVariant.createInstance()
  } catch (e) {
    ctx.warnings.push(`${setName} 인스턴스 생성 실패: ${e instanceof Error ? e.message : String(e)}`)
    return null
  }
  if (opts.name) node.name = opts.name

  const keys = propKeys(set)
  const props: Record<string, string | boolean> = { ...(opts.variant ?? {}) } // 베리언트 축은 이름 그대로
  const missing: string[] = []
  const given = opts.props ?? {}
  for (const name of Object.keys(given)) {
    const key = keys[name]
    if (key) props[key] = given[name]
    else missing.push(name)
  }
  if (missing.length) ctx.warnings.push(`${setName}: 없는 속성 ${missing.join(', ')} — 무시했습니다.`)
  try {
    node.setProperties(props)
  } catch (e) {
    ctx.warnings.push(`${setName} setProperties 실패: ${e instanceof Error ? e.message : String(e)}`)
  }
  return node
}
/** 세로 부모 안에서 폭을 꽉 채우는 인스턴스. */
function instFill(n: InstanceNode): InstanceNode {
  n.layoutAlign = 'STRETCH'
  return n
}
/** 가로 부모 안에서 남는 폭을 가져가는 인스턴스. */
function instGrow(n: InstanceNode): InstanceNode {
  n.layoutGrow = 1
  return n
}

// ── 레이아웃 원시 헬퍼 ───────────────────────────────────────────────
function box(name: string, dir: 'HORIZONTAL' | 'VERTICAL', gap = 0): FrameNode {
  const f = figma.createFrame()
  f.name = name
  f.layoutMode = dir
  f.primaryAxisSizingMode = 'AUTO'
  f.counterAxisSizingMode = 'AUTO'
  f.itemSpacing = gap
  f.fills = []
  return f
}
const vbox = (name: string, gap = 0) => box(name, 'VERTICAL', gap)
const hbox = (name: string, gap = 0) => box(name, 'HORIZONTAL', gap)

/** 부모 폭을 꽉 채운다(세로 부모 안). */
function fill(f: FrameNode): FrameNode {
  f.layoutAlign = 'STRETCH'
  if (f.layoutMode === 'HORIZONTAL') f.primaryAxisSizingMode = 'FIXED'
  else f.counterAxisSizingMode = 'FIXED'
  return f
}
/** 가로 부모 안에서 남는 폭을 가져간다. */
function grow(f: FrameNode): FrameNode {
  f.layoutGrow = 1
  if (f.layoutMode === 'HORIZONTAL') f.primaryAxisSizingMode = 'FIXED'
  else f.counterAxisSizingMode = 'FIXED'
  return f
}
/** 가로 부모 안에서 높이를 꽉 채운다. */
function fillH(f: FrameNode): FrameNode {
  f.layoutAlign = 'STRETCH'
  if (f.layoutMode === 'VERTICAL') f.primaryAxisSizingMode = 'FIXED'
  else f.counterAxisSizingMode = 'FIXED'
  return f
}
function pad(f: FrameNode, v: number, h: number = v): FrameNode {
  f.paddingTop = f.paddingBottom = v
  f.paddingLeft = f.paddingRight = h
  return f
}
function fixed(name: string, dir: 'HORIZONTAL' | 'VERTICAL', w: number, h: number): FrameNode {
  const f = figma.createFrame()
  f.name = name
  f.layoutMode = dir
  f.primaryAxisSizingMode = 'FIXED'
  f.counterAxisSizingMode = 'FIXED'
  f.resize(w, h)
  f.fills = []
  return f
}
/** 아래쪽 1px 구분선만(표 행·툴바 하단). strokeWeight가 mixed가 되어 bindTokens는 건너뛴다. */
function bottomLine(ctx: Ctx, f: FrameNode) {
  bindStrokeVar(ctx, f, 'color/border', BORDER)
  f.strokeAlign = 'INSIDE'
  f.strokeTopWeight = 0
  f.strokeLeftWeight = 0
  f.strokeRightWeight = 0
  f.strokeBottomWeight = 1
}
/** 오른쪽 1px 구분선만(5분할 카드 행 등). */
function rightLine(ctx: Ctx, f: FrameNode) {
  bindStrokeVar(ctx, f, 'color/border', BORDER)
  f.strokeAlign = 'INSIDE'
  f.strokeTopWeight = 0
  f.strokeLeftWeight = 0
  f.strokeBottomWeight = 0
  f.strokeRightWeight = 1
}
/** 1px 보더 + radius. */
function outline(ctx: Ctx, f: FrameNode, radius = R_CARD) {
  bindStrokeVar(ctx, f, 'color/border', BORDER)
  f.strokeWeight = 1
  f.strokeAlign = 'INSIDE'
  f.cornerRadius = radius
}

// ── 타이포 숏컷 ──────────────────────────────────────────────────────
const tBody = (ctx: Ctx, s: string, bold = false) => boundText(ctx, s, F_BODY, 'color/text', INK, bold)
const tSub = (ctx: Ctx, s: string, size = F_BODY) => boundText(ctx, s, size, 'color/secondary', SUB)
// 흐린 보조 텍스트 폴백 hex — SUB(#4E5968)를 44% 흰색과 섞은 값. tokens.ts의 SHADE_STEPS 300
// 공식과 같다(mixHex(base, '#FFFFFF', 0.44)) → color/secondary/300 변수가 없을 때만 쓰인다.
const MUTED_TINT = '#9CA2AA'
/**
 * 흐린 보조 텍스트 — color/secondary/300(연한 셰이드) 바인딩.
 * React가 플레이스홀더·캡션에 쓰는 --ds-color-secondary-300과 같은 토큰이다
 * (src/shared/placeholders.module.css:27 등). 예전엔 secondary + 노드 opacity 0.6으로 흉내 냈는데,
 * 오너가 텍스트 opacity를 금지했다("폰트는 100%") — 셰이드 변수로 옮겨 글자 자체는 always 100%다.
 */
function tMuted(ctx: Ctx, s: string, size = F_BODY): TextNode {
  return boundText(ctx, s, size, 'color/secondary/300', MUTED_TINT)
}
const tLink = (ctx: Ctx, s: string) => boundText(ctx, s, F_BODY, 'color/primary', ACCENT, true)

// ── 원자(자체 구현 — admin.ts 인스턴스에 의존하지 않는다) ────────────
// 조사 기록(2026-07 모듈화 검토): card()·flatCard()·cardHead()·table()·toolbar()·pagination()·
// fieldRow()·defRow() 같은 '컨테이너' 원자들은 FRAME을 반환해서 호출부가 그 뒤에 자유롭게
// appendChild로 내용을 채운다(회원 목록의 11열 표, 상품 등록의 4개 폼 섹션 등 화면마다 내용이 전부 다르다).
// Figma의 컴포넌트 인스턴스(INSTANCE)는 이렇게 임의 자식을 나중에 끼워 넣을 수 없다 — 인스턴스의
// 자식은 메인 컴포넌트가 정한 구조 그대로이고, 바꿀 수 있는 통로는 TEXT/BOOLEAN/INSTANCE_SWAP/VARIANT
// 뿐이다(내용이 화면마다 다른 자유 슬롯이 없다). 그래서 DS/AdminCard(admin.ts에 이미 있지만 미사용)도
// '임의 children을 담는 카드'가 아니라 내부 구조가 고정된 상품 카드 하나를 통째로 미러링한 것이다.
// → 이 원자들을 인스턴스로 바꾸려는 시도는 하지 않았다: 바꾸려면 각 화면의 폼 섹션·표 내용을
// 컴포넌트 안에 통째로 하드코딩해야 하는데, 그러면 화면마다 다른 실제 내용이 사라지거나
// (표4/폼 섹션 등 여러 화면이 공유할 수 없는) 세트가 화면 수만큼 늘어난다. React의 FormSection·
// AdminCard도 children을 ReactNode로 받는 구조라 이 자체가 Figma 파리티의 근본적 한계다.
function icon(ctx: Ctx, key: string, size: number, varName = 'color/secondary', hex = SUB): SceneNode {
  const ic = iconInstance(key, key.replace('_Icon/', ''), size)
  // 인스턴스 안 벡터의 stroke를 변수로(없으면 리터럴). recolor는 INSTANCE·FRAME 폴백 모두 처리.
  const v = ctx.vars.get(varName)
  const paint: Paint = v ? boundPaint(v) : solid(ctx.userColors[varName] ?? hex)
  const target = ic as unknown as { findOne?: (cb: (n: SceneNode) => boolean) => SceneNode | null }
  if (typeof target.findOne === 'function') {
    const vec = target.findOne((n) => n.type === 'VECTOR')
    if (vec) (vec as VectorNode).strokes = [paint]
  }
  return ic
}

type BtnKind = 'primary' | 'outline' | 'ghost' | 'danger'
function btn(ctx: Ctx, label: string, kind: BtnKind = 'outline', iconKey?: string, h = CTRL_H): FrameNode {
  const b = hbox('Button / ' + label, 6)
  b.counterAxisSizingMode = 'FIXED'
  b.resize(b.width, h)
  b.counterAxisAlignItems = 'CENTER'
  b.primaryAxisAlignItems = 'CENTER'
  pad(b, 0, 14)
  b.cornerRadius = R_CTRL
  let fgVar = 'color/text'
  let fgHex = INK
  if (kind === 'primary') {
    bindFillVar(ctx, b, 'color/primary', ACCENT)
    fgVar = 'color/bg'
    fgHex = WHITE
  } else if (kind === 'danger') {
    bindFillVar(ctx, b, 'color/error/100', tintHex(TONE_HEX.error))
    fgVar = 'color/error'
    fgHex = TONE_HEX.error
  } else if (kind === 'outline') {
    bindFillVar(ctx, b, 'color/bg', WHITE)
    bindStrokeVar(ctx, b, 'color/border', BORDER)
    b.strokeWeight = 1
    b.strokeAlign = 'INSIDE'
  } else {
    b.fills = []
    fgVar = 'color/secondary'
    fgHex = SUB
  }
  if (iconKey) b.appendChild(icon(ctx, iconKey, 15, fgVar, fgHex))
  b.appendChild(boundText(ctx, label, F_BODY, fgVar, fgHex, true))
  return b
}
/** 아이콘만 있는 정사각 버튼. */
function iconBtn(ctx: Ctx, iconKey: string, size = CTRL_H): FrameNode {
  const b = fixed('IconButton', 'HORIZONTAL', size, size)
  b.primaryAxisAlignItems = 'CENTER'
  b.counterAxisAlignItems = 'CENTER'
  b.cornerRadius = R_CTRL
  bindFillVar(ctx, b, 'color/bg', WHITE)
  bindStrokeVar(ctx, b, 'color/border', BORDER)
  b.strokeWeight = 1
  b.strokeAlign = 'INSIDE'
  b.appendChild(icon(ctx, iconKey, 16))
  return b
}
function badge(ctx: Ctx, label: string, tone: Tone = 'primary'): FrameNode {
  const c = hbox('Badge / ' + label)
  c.counterAxisAlignItems = 'CENTER'
  pad(c, 4, 8)
  c.cornerRadius = 6
  bindFillVar(ctx, c, `color/${tone}/100`, tintHex(TONE_HEX[tone]))
  c.appendChild(boundText(ctx, label, 11, `color/${tone}`, TONE_HEX[tone], true))
  return c
}
function checkbox(ctx: Ctx, checked = false): FrameNode {
  const c = fixed('Checkbox', 'HORIZONTAL', 16, 16)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.cornerRadius = 4
  if (checked) {
    bindFillVar(ctx, c, 'color/primary', ACCENT)
    c.appendChild(icon(ctx, '_Icon/Check', 12, 'color/bg', WHITE))
  } else {
    bindFillVar(ctx, c, 'color/bg', WHITE)
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }
  return c
}
function toggleMini(ctx: Ctx, on: boolean): FrameNode {
  const t = fixed('Toggle', 'HORIZONTAL', 36, 20)
  t.primaryAxisAlignItems = on ? 'MAX' : 'MIN'
  t.counterAxisAlignItems = 'CENTER'
  pad(t, 0, 3)
  t.cornerRadius = 999
  bindFillVar(ctx, t, on ? 'color/primary' : 'color/border', on ? ACCENT : BORDER)
  const knob = figma.createEllipse()
  knob.resize(14, 14)
  bindFillVar(ctx, knob, 'color/bg', WHITE)
  t.appendChild(knob)
  return t
}
/** 이미지 자리 — bgSubtle 사각 + Image 아이콘. */
function thumbBox(ctx: Ctx, w: number, h: number, radius = 6): FrameNode {
  const f = fixed('Thumb', 'HORIZONTAL', w, h)
  f.primaryAxisAlignItems = 'CENTER'
  f.counterAxisAlignItems = 'CENTER'
  f.cornerRadius = radius
  bindFillVar(ctx, f, 'color/bgSubtle', SURFACE)
  f.appendChild(icon(ctx, '_Icon/Image', Math.max(12, Math.round(Math.min(w, h) * 0.42))))
  return f
}
function avatar(ctx: Ctx, size: number, initial: string): FrameNode {
  const a = fixed('Avatar', 'HORIZONTAL', size, size)
  a.primaryAxisAlignItems = 'CENTER'
  a.counterAxisAlignItems = 'CENTER'
  a.cornerRadius = 999
  bindFillVar(ctx, a, 'color/primary/100', tintHex(ACCENT))
  a.appendChild(boundText(ctx, initial, Math.max(11, Math.round(size * 0.38)), 'color/primary', ACCENT, true))
  return a
}
/** 입력 상자(검색·셀렉트·텍스트). w=0이면 부모에서 grow/fill로 폭 지정. */
function input(
  ctx: Ctx,
  placeholder: string,
  w: number,
  opts?: { leadIcon?: string; trailIcon?: string; value?: string; h?: number },
): FrameNode {
  const h = opts?.h ?? CTRL_H
  const f = w > 0 ? fixed('Input', 'HORIZONTAL', w, h) : hbox('Input', 8)
  if (w <= 0) {
    f.counterAxisSizingMode = 'FIXED'
    f.resize(f.width, h)
  }
  f.counterAxisAlignItems = 'CENTER'
  f.itemSpacing = 8
  pad(f, 0, 12)
  f.cornerRadius = R_CTRL
  bindFillVar(ctx, f, 'color/bg', WHITE)
  bindStrokeVar(ctx, f, 'color/border', BORDER)
  f.strokeWeight = 1
  f.strokeAlign = 'INSIDE'
  if (opts?.leadIcon) f.appendChild(icon(ctx, opts.leadIcon, 16))
  const label = opts?.value ? tBody(ctx, opts.value) : tMuted(ctx, placeholder)
  label.name = 'Value'
  f.appendChild(grow(wrapText(label)))
  if (opts?.trailIcon) f.appendChild(icon(ctx, opts.trailIcon, 16))
  return f
}
/** 텍스트를 grow 가능한 프레임으로 감싼다(오토레이아웃 안에서 남는 폭 차지). */
function wrapText(t: TextNode): FrameNode {
  const f = hbox('Text', 0)
  f.counterAxisAlignItems = 'CENTER'
  f.appendChild(t)
  return f
}
/** 여러 줄 입력(메모·상세설명). */
function textarea(ctx: Ctx, placeholder: string, h: number): FrameNode {
  const f = vbox('Textarea', 0)
  fill(f)
  f.counterAxisSizingMode = 'FIXED'
  f.primaryAxisSizingMode = 'FIXED'
  f.resize(f.width, h)
  pad(f, 12)
  f.cornerRadius = R_CTRL
  bindFillVar(ctx, f, 'color/bg', WHITE)
  bindStrokeVar(ctx, f, 'color/border', BORDER)
  f.strokeWeight = 1
  f.strokeAlign = 'INSIDE'
  f.appendChild(tMuted(ctx, placeholder))
  return f
}
/**
 * 폼 한 줄 — 라벨(고정 폭) + 컨트롤.
 *
 * 조사 기록(2026-07): DS/FieldRow(admin.ts) 인스턴스로 바꾸지 않았다. 그 세트의 children 슬롯
 * ('content')은 규약 §7용 자리표시 빈 입력 박스 하나로 고정 렌더된다(admin.ts renderFieldRow —
 * miniInput(ctx, '', …), 값 없이 항상 빈 칸). 실제 화면의 control은 매번 다른 placeholder·값(예:
 * '오크 원목 1200 서랍형 책상')을 보여주는데 그 텍스트는 TEXT 속성으로 열려 있지 않다. 게다가 Figma
 * Plugin API는 인스턴스 안 프레임에 새 자식(control)을 붙이는 것 자체를 허용하지 않는다(TEXT·
 * BOOLEAN·INSTANCE_SWAP 속성 오버라이드만 가능) — control을 통째로 밀어 넣을 방법이 없다.
 * label·description(texts)만 살고 control이 항상 빈 칸으로 렌더되면 그것도 렌더 변경이라
 * 이 헬퍼로 남긴다.
 */
function fieldRow(ctx: Ctx, label: string, control: FrameNode, required = false, labelW = 140): FrameNode {
  const row = hbox('Field / ' + label, 16)
  fill(row)
  row.counterAxisAlignItems = 'CENTER'
  const lb = hbox('Label', 3)
  lb.counterAxisSizingMode = 'FIXED'
  lb.primaryAxisSizingMode = 'FIXED'
  lb.resize(labelW, 20)
  lb.counterAxisAlignItems = 'CENTER'
  lb.appendChild(tBody(ctx, label, true))
  if (required) lb.appendChild(boundText(ctx, '*', F_BODY, 'color/error', TONE_HEX.error, true))
  row.appendChild(lb)
  row.appendChild(grow(control))
  return row
}
/** 정의 목록 한 줄 — 라벨 / 값. */
function defRow(ctx: Ctx, label: string, value: string, opts?: { badge?: [string, Tone]; muted?: boolean }): FrameNode {
  const row = hbox('Def / ' + label, 12)
  fill(row)
  row.counterAxisAlignItems = 'CENTER'
  pad(row, 10, 0)
  bottomLine(ctx, row)
  const lb = hbox('Label', 0)
  lb.counterAxisSizingMode = 'FIXED'
  lb.primaryAxisSizingMode = 'FIXED'
  lb.resize(120, 20)
  lb.counterAxisAlignItems = 'CENTER'
  lb.appendChild(tSub(ctx, label))
  row.appendChild(lb)
  const val = hbox('Value', 8)
  val.counterAxisAlignItems = 'CENTER'
  val.appendChild(opts?.muted ? tMuted(ctx, value) : tBody(ctx, value))
  if (opts?.badge) val.appendChild(badge(ctx, opts.badge[0], opts.badge[1]))
  row.appendChild(grow(val))
  return row
}

// ── 카드 ─────────────────────────────────────────────────────────────
/** 흰 카드(패딩 20) — bgSubtle 위에 얹히는 기본 표면. */
function card(ctx: Ctx, name: string, gap = 16): FrameNode {
  const c = vbox('Card / ' + name, gap)
  fill(c)
  pad(c, 20)
  bindFillVar(ctx, c, 'color/bg', WHITE)
  outline(ctx, c)
  return c
}
/** 표 전용 카드(패딩 0 — 툴바·표가 카드 폭을 꽉 채운다). */
function flatCard(ctx: Ctx, name: string): FrameNode {
  const c = vbox('Card / ' + name, 0)
  fill(c)
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  outline(ctx, c)
  return c
}
/** 카드 헤더 행(제목 + 우측 액션). */
function cardHead(ctx: Ctx, title: string, right?: SceneNode, count?: string): FrameNode {
  const h = hbox('Card Head', 8)
  fill(h)
  h.counterAxisAlignItems = 'CENTER'
  const left = hbox('t', 8)
  left.counterAxisAlignItems = 'CENTER'
  left.appendChild(boundText(ctx, title, 15, 'color/text', INK, true))
  if (count) left.appendChild(badge(ctx, count, 'primary'))
  h.appendChild(grow(left))
  if (right) h.appendChild(right)
  return h
}

// ── 표 ───────────────────────────────────────────────────────────────
/**
 * 관리 열 'btns' 셀 — 텍스트 버튼(예: '수정'·'삭제', '보기'·'삭제', '답변' 1개).
 *
 * 조사 기록(2026-07): DS/RowActions(admin.ts) 인스턴스로 바꾸지 않았다. 실제 React
 * RowActions(src/ds/RowActions/RowActions.tsx)는 onView/onEdit/onDelete 중 넘긴 핸들러만 렌더한다 —
 * CategoryList·InquiryManageList·HistoryList 등은 실제로 2개(edit+delete 또는 view+delete)만 쓰고,
 * 3개를 동시에 쓰는 화면은 없다. 그런데 DS/RowActions 세트는 "문서 세트는 셋 다 보여준다"
 * (admin.ts:1940 주석 그대로)로 만들어져 있어 view·edit·delete를 개별로 껐다 켤 BOOLEAN 축이 없다.
 * inst()로 바꾸면 모든 행에 실제로는 없는 액션 아이콘이 하나씩 더 붙어 지금 렌더와도, 진짜 화면과도
 * 달라진다(§0-4 렌더 불변 위반) — 세트에 showView/showEdit/showDelete 같은 BOOLEAN 3개가 추가되기
 * 전까지는 텍스트 버튼으로 남긴다.
 */
type Align = 'left' | 'center' | 'right'
type Cell =
  | string
  | { t: 'strong'; v: string }
  | { t: 'muted'; v: string }
  | { t: 'link'; v: string }
  | { t: 'badge'; v: string; tone: Tone }
  | { t: 'thumb'; v: string; tags?: string[] }
  | { t: 'img' }
  | { t: 'check'; on?: boolean }
  | { t: 'drag' }
  | { t: 'toggle'; on: boolean }
  | { t: 'kebab' }
  | { t: 'btns'; v: string[] }
type Col = { label: string; w: number; grow?: boolean; align?: Align; head?: Cell }

function rowFrame(ctx: Ctx, width: number, h = ROW_H): FrameNode {
  const r = fixed('Row', 'HORIZONTAL', width, h)
  r.layoutAlign = 'STRETCH'
  r.counterAxisAlignItems = 'CENTER'
  r.itemSpacing = 0
  bottomLine(ctx, r)
  return r
}
function cellFrame(col: Col): FrameNode {
  const c = fixed('Cell / ' + (col.label || '-'), 'HORIZONTAL', col.w, ROW_H)
  c.layoutAlign = 'STRETCH'
  c.counterAxisAlignItems = 'CENTER'
  c.primaryAxisAlignItems = col.align === 'right' ? 'MAX' : col.align === 'center' ? 'CENTER' : 'MIN'
  c.itemSpacing = 8
  pad(c, CELL_PY, CELL_PX)
  c.clipsContent = true
  if (col.grow) grow(c)
  return c
}
function cellContent(ctx: Ctx, cell: FrameNode, data: Cell) {
  if (typeof data === 'string') {
    cell.appendChild(tBody(ctx, data))
    return
  }
  switch (data.t) {
    case 'strong':
      cell.appendChild(tBody(ctx, data.v, true))
      break
    case 'muted':
      cell.appendChild(tMuted(ctx, data.v))
      break
    case 'link':
      cell.appendChild(tLink(ctx, data.v))
      break
    case 'badge':
      cell.appendChild(badge(ctx, data.v, data.tone))
      break
    case 'thumb': {
      cell.appendChild(thumbBox(ctx, 28, 28))
      cell.appendChild(tBody(ctx, data.v, true))
      for (const tag of data.tags || []) cell.appendChild(badge(ctx, tag, 'secondary'))
      break
    }
    case 'img':
      cell.appendChild(thumbBox(ctx, 28, 28))
      break
    case 'check':
      cell.appendChild(checkbox(ctx, data.on))
      break
    case 'drag':
      cell.appendChild(icon(ctx, '_Icon/MoveVertical', 16))
      break
    case 'toggle':
      cell.appendChild(toggleMini(ctx, data.on))
      break
    case 'kebab':
      cell.appendChild(icon(ctx, '_Icon/MoreH', 16))
      break
    case 'btns': {
      for (const b of data.v) {
        const s = btn(ctx, b, 'outline', undefined, 28)
        pad(s, 0, 10)
        cell.appendChild(s)
      }
      break
    }
  }
}
/** 표 — 헤더(12px·bgSubtle) + 44px 행 + 선택 합계 행. 카드(flatCard) 안에 넣는다. */
function table(ctx: Ctx, width: number, cols: Col[], rows: Cell[][], summary?: Cell[]): FrameNode {
  const t = vbox('Table', 0)
  t.counterAxisSizingMode = 'FIXED'
  t.resize(width, 100)
  t.layoutAlign = 'STRETCH'
  t.fills = []

  const head = rowFrame(ctx, width)
  head.name = 'Table Head'
  bindFillVar(ctx, head, 'color/bgSubtle', SURFACE)
  bottomLine(ctx, head)
  for (const col of cols) {
    const c = cellFrame(col)
    if (col.head) cellContent(ctx, c, col.head)
    else if (col.label) c.appendChild(boundText(ctx, col.label, F_HEAD, 'color/secondary', SUB, true))
    head.appendChild(c)
  }
  t.appendChild(head)

  rows.forEach((r, i) => {
    const row = rowFrame(ctx, width)
    row.name = 'Row ' + (i + 1)
    row.fills = []
    if (i === rows.length - 1 && !summary) {
      row.strokes = [] // 마지막 행 — 카드 보더와 겹치지 않게
    }
    cols.forEach((col, ci) => {
      const c = cellFrame(col)
      const d = r[ci]
      if (d !== undefined) cellContent(ctx, c, d)
      row.appendChild(c)
    })
    t.appendChild(row)
  })

  if (summary) {
    const row = rowFrame(ctx, width)
    row.name = 'Summary'
    row.strokes = []
    bindFillVar(ctx, row, 'color/bgSubtle', SURFACE)
    cols.forEach((col, ci) => {
      const c = cellFrame(col)
      const d = summary[ci]
      if (d !== undefined) cellContent(ctx, c, typeof d === 'string' ? { t: 'strong', v: d } : d)
      row.appendChild(c)
    })
    t.appendChild(row)
  }
  return t
}
/**
 * 카드 안 툴바(검색·필터·액션) — 표 위, 하단 1px 구분선.
 *
 * 조사 기록(2026-07): DS/ListToolbar(admin.ts) 인스턴스로 바꾸지 않았다. 그 세트는 문서용 고정 조합
 * 하나만 그린다(좌: 상태 Select 1개 + 검색 1개, 우: 정렬 Select 1개 + 건수 + 등록 버튼 1개 —
 * admin.ts renderListToolbar). 화면마다 좌측 필터 Select 개수(문의 내역 2개·고객 목록 0개 등)와
 * 우측 액션 버튼(적립금 지급·삭제·담당자 지정·필터 …)이 다른데, 세트의 texts는 totalLabel·totalUnit·
 * searchPlaceholder·totalSuffix뿐이고 select 라벨·건수 숫자·action 라벨은 TEXT 속성이 아니다.
 * 그대로 inst()를 쓰면 화면마다 필요 없는 Select가 하나 더 생기거나 실제 필터·버튼이 사라진다 —
 * 이 헬퍼로 남긴다.
 */
function toolbar(ctx: Ctx, children: SceneNode[], right: SceneNode[] = []): FrameNode {
  const bar = hbox('Toolbar', 8)
  fill(bar)
  bar.counterAxisAlignItems = 'CENTER'
  pad(bar, 16, 20)
  bottomLine(ctx, bar)
  const left = hbox('left', 8)
  left.counterAxisAlignItems = 'CENTER'
  children.forEach((c) => left.appendChild(c))
  bar.appendChild(grow(left))
  right.forEach((c) => bar.appendChild(c))
  return bar
}
/** 표 아래 페이지네이션. */
function pagination(ctx: Ctx, total: string): FrameNode {
  const bar = hbox('Pagination', 8)
  fill(bar)
  bar.counterAxisAlignItems = 'CENTER'
  pad(bar, 12, 20)
  const l = hbox('l', 0)
  l.counterAxisAlignItems = 'CENTER'
  l.appendChild(tMuted(ctx, total))
  bar.appendChild(grow(l))
  const pages = hbox('pages', 4)
  pages.counterAxisAlignItems = 'CENTER'
  pages.appendChild(iconBtn(ctx, '_Icon/ChevronLeft', 32))
  ;['1', '2', '3', '4', '5'].forEach((p, i) => {
    const b = fixed('page', 'HORIZONTAL', 32, 32)
    b.primaryAxisAlignItems = 'CENTER'
    b.counterAxisAlignItems = 'CENTER'
    b.cornerRadius = R_CTRL
    if (i === 0) {
      bindFillVar(ctx, b, 'color/primary', ACCENT)
      b.appendChild(boundText(ctx, p, F_BODY, 'color/bg', WHITE, true))
    } else {
      b.fills = []
      b.appendChild(tSub(ctx, p))
    }
    pages.appendChild(b)
  })
  pages.appendChild(iconBtn(ctx, '_Icon/ChevronRight', 32))
  bar.appendChild(pages)
  return bar
}

// ── 공통 구조 ────────────────────────────────────────────────────────
/**
 * 화면의 콘텐츠 열(1680 = 1920 − 사이드바 240) — bgSubtle 배경, 세로 오토레이아웃.
 * 화면 프레임 자체는 screenShell이 만든다(사이드바 + 이 열). 빌더는 이 열에만 블록을 쌓는다.
 */
function screenFrame(ctx: Ctx, name: string): FrameNode {
  const f = figma.createFrame()
  f.name = 'Content / ' + name
  f.layoutMode = 'VERTICAL'
  f.counterAxisSizingMode = 'FIXED'
  f.resize(CONTENT_W, 900)
  f.primaryAxisSizingMode = 'AUTO'
  f.itemSpacing = GAP
  pad(f, SCREEN_PAD)
  bindFillVar(ctx, f, 'color/bgSubtle', SURFACE)
  return f
}

/**
 * 화면 셸 — DS/AdminSidebar 인스턴스 + 콘텐츠 열.
 *
 * 왜 셸을 화면이 갖는가: '지금 어느 메뉴에 있는지'는 화면마다 다르다. 라벨은 컴포넌트 TEXT 속성으로
 * 열려 있지 않고(그리고 인스턴스 내부 레이어를 화면이 만지는 건 이 파일의 금지 규약이다),
 * 선택 상태를 세트의 active 베리언트 축으로 만들어 화면은 축 값만 고른다 → 메뉴를 고치면 24화면이 함께 바뀐다.
 */
function screenShell(ctx: Ctx, name: string, content: FrameNode, active: AdminActive): FrameNode {
  const shell = figma.createFrame()
  shell.name = 'Screen/' + name
  shell.layoutMode = 'HORIZONTAL'
  shell.primaryAxisSizingMode = 'FIXED'
  shell.counterAxisSizingMode = 'FIXED'
  shell.resize(SCREEN_W, 900)
  shell.counterAxisSizingMode = 'AUTO' // 높이 hug — resize 뒤에 세워야 FIXED로 얼지 않는다
  shell.itemSpacing = 0
  bindFillVar(ctx, shell, 'color/bgSubtle', SURFACE)

  const nav = inst(ctx, 'DS/AdminSidebar', {
    name: 'Sidebar / ' + name,
    variant: { collapsed: 'false', active },
  })
  if (nav) {
    shell.appendChild(nav)
    // 가로 부모에서 STRETCH = '높이 채우기'. 인스턴스의 primary축(세로)이 hug면 늘어나지 않으므로
    // FIXED로 바꿔 콘텐츠 높이에 맞춰 세운다(sidePanel의 fillH와 같은 규약).
    nav.layoutAlign = 'STRETCH'
    nav.primaryAxisSizingMode = 'FIXED'
  } else {
    shell.appendChild(fillH(drawAdminSidebar(ctx, active)))
  }
  shell.appendChild(content)
  return shell
}

/** 폴백 — DS/AdminSidebar 세트가 없을 때 화면이 직접 그리는 사이드바(메뉴는 admin-menu.ts 단일 소스). */
function drawAdminSidebar(ctx: Ctx, active: AdminActive): FrameNode {
  const nav = vbox('Sidebar', 4)
  nav.counterAxisSizingMode = 'FIXED'
  nav.resize(SIDEBAR_W, 900)
  pad(nav, 12)
  bindFillVar(ctx, nav, 'color/bg', WHITE)
  rightLine(ctx, nav)

  const brand = hbox('Brand', 8)
  fill(brand)
  brand.counterAxisAlignItems = 'CENTER'
  pad(brand, 12, 8)
  brand.appendChild(icon(ctx, '_Icon/Sparkles', 22, 'color/primary', ACCENT))
  brand.appendChild(boundText(ctx, 'Admin Console', 16, 'color/text', INK, true))
  nav.appendChild(brand)

  const st = hbox('Section Title', 0)
  fill(st)
  st.paddingLeft = 12
  st.paddingTop = 8
  st.paddingBottom = 4
  st.appendChild(boundText(ctx, '메뉴', 11, 'color/secondary', SUB, true))
  nav.appendChild(st)

  const open = groupOfActive(active)
  for (const item of ADMIN_MENU) {
    const kids = item.children ?? []
    const selected = kids.length === 0 && item.id === active
    const expanded = kids.length > 0 && open === item
    const hot = selected || expanded

    const r = hbox('Nav / ' + item.label, 10)
    fill(r)
    r.counterAxisAlignItems = 'CENTER'
    pad(r, 10, 12)
    r.cornerRadius = R_CTRL
    if (selected) bindFillVar(ctx, r, 'color/primary/100', tintHex(ACCENT))
    else r.fills = []
    r.appendChild(icon(ctx, item.iconKey, 18, hot ? 'color/primary' : 'color/secondary', hot ? ACCENT : SUB))
    const lt = hbox('l', 0)
    lt.counterAxisAlignItems = 'CENTER'
    lt.appendChild(
      hot
        ? boundText(ctx, item.label, 14, 'color/primary', ACCENT, true)
        : boundText(ctx, item.label, 14, 'color/text', INK),
    )
    r.appendChild(grow(lt))
    if (item.badge) r.appendChild(badge(ctx, item.badge, 'primary'))
    if (kids.length) r.appendChild(icon(ctx, expanded ? '_Icon/ChevronDown' : '_Icon/ChevronRight', 14))
    nav.appendChild(r)

    if (!expanded) continue
    for (const kid of kids) {
      const on = kid.id === active
      const s = hbox('Sub / ' + kid.label, 0)
      fill(s)
      s.counterAxisAlignItems = 'CENTER'
      s.paddingTop = s.paddingBottom = 8
      s.paddingLeft = 40
      s.paddingRight = 12
      s.cornerRadius = R_CTRL
      if (on) bindFillVar(ctx, s, 'color/primary/100', tintHex(ACCENT))
      else s.fills = []
      s.appendChild(
        on
          ? boundText(ctx, kid.label, F_BODY, 'color/primary', ACCENT, true)
          : boundText(ctx, kid.label, F_BODY, 'color/secondary', SUB),
      )
      nav.appendChild(s)
    }
  }
  return nav
}
/**
 * 화면 헤더 — 제목·설명 + 우측 액션.
 * 제목·설명 블록은 DS/AdminTopbar 인스턴스(surface=plain)다. 액션은 화면마다 달라서
 * 컴포넌트의 액션·사용자 슬롯을 끄고(Show Actions/Show User=false) 화면이 자기 액션을 옆에 붙인다.
 */
function pageHead(ctx: Ctx, title: string, desc: string, actions: SceneNode[] = []): FrameNode {
  const h = hbox('Page Head', 16)
  fill(h)
  h.counterAxisAlignItems = 'CENTER'

  const bar = inst(ctx, 'DS/AdminTopbar', {
    name: 'Topbar / ' + title,
    variant: { stacked: 'true', surface: 'plain' },
    props: {
      title: title,
      description: desc,
      showBreadcrumb: false,
      'Show Actions': false,
      'Show User': false,
    },
  })
  if (bar) h.appendChild(instGrow(bar))
  else h.appendChild(grow(drawPageHeadText(ctx, title, desc)))

  const a = hbox('actions', 8)
  a.counterAxisAlignItems = 'CENTER'
  actions.forEach((x) => a.appendChild(x))
  h.appendChild(a)
  return h
}
/** 폴백 — DS/AdminTopbar 세트가 없을 때의 제목·설명 블록. */
function drawPageHeadText(ctx: Ctx, title: string, desc: string): FrameNode {
  const t = vbox('t', 6)
  t.appendChild(boundText(ctx, title, 24, 'color/text', INK, true))
  t.appendChild(tSub(ctx, desc, 14))
  return t
}
/**
 * 상태 탭 줄(전체/판매중/…) — 활성 탭은 하단 2px 강조. 6화면(상품·주문·대시보드·공지·문의·연혁)이
 * 이 모양 그대로 반복한다 — React 대응은 CategoryTabs(variant='underline', items[].count)로 1:1이다.
 *
 * 조사 기록(2026-07): 세트로 뽑지 않았다. DS/CategoryTabs는 이미 categories-nav-overlay.ts가
 * 만들어 두었지만(다른 페이지 소속), screens.ts의 inst()는 admin.ts가 등록한 ADMIN_SETS만 본다
 * (scripts/verify-screen-props.mjs의 SCREEN_FILES가 'screens.ts → admin' 레지스트리로 고정해 뒀다 —
 * 화면 파일이 참조할 수 있는 세트를 코드로 못박아 "몰래 다른 페이지 세트에 의존"을 막는 안전장치다).
 * admin.ts에 같은 이름으로 다시 만들면 verify-mapping의 세트 이름 유일성 검사가 중복으로 잡는다.
 * 이름을 바꿔 새로 만들면 그 자체가 '이름은 코드가 정한다' 규약 위반(CategoryTabs가 아닌 이름으로
 * CategoryTabs를 미러링하는 셈)이다. 크로스 페이지 조회를 열려면 scripts/(검사기)나 categories*.ts를
 * 고쳐야 하는데 둘 다 이 작업의 소유 범위 밖이라 손대지 않았다 — 오너 결정이 필요하다.
 */
function tabs(ctx: Ctx, items: Array<[string, string, boolean]>): FrameNode {
  const bar = hbox('Tabs', 4)
  fill(bar)
  bar.counterAxisAlignItems = 'CENTER'
  bindFillVar(ctx, bar, 'color/bg', WHITE)
  outline(ctx, bar)
  pad(bar, 0, 8)
  for (const [label, count, active] of items) {
    const t = hbox('Tab / ' + label, 6)
    t.counterAxisSizingMode = 'FIXED'
    t.resize(t.width, 48)
    t.counterAxisAlignItems = 'CENTER'
    pad(t, 0, 16)
    t.fills = []
    if (active) {
      bindStrokeVar(ctx, t, 'color/primary', ACCENT)
      t.strokeAlign = 'INSIDE'
      t.strokeTopWeight = 0
      t.strokeLeftWeight = 0
      t.strokeRightWeight = 0
      t.strokeBottomWeight = 2
    }
    t.appendChild(
      active
        ? boundText(ctx, label, 14, 'color/primary', ACCENT, true)
        : boundText(ctx, label, 14, 'color/secondary', SUB),
    )
    if (count) t.appendChild(active ? badge(ctx, count, 'primary') : tMuted(ctx, count, 12))
    bar.appendChild(t)
  }
  return bar
}
/**
 * 좌측 240 패널(그룹·부서 목록) — 고객 목록·운영진 2화면이 반복한다.
 * React 대응은 GroupPanel(items[].count · footer 버튼)이지만 딱 1가지가 안 맞는다:
 * 이 함수가 그리는 상단 '그룹'/'부서' 제목 + 필터 아이콘 줄은 GroupPanel.tsx에 없다
 * (실제 화면 MemberList.tsx도 GroupPanel을 <aside> 리스트+footer만으로 쓰고 별도 제목을 씌우지 않는다).
 *
 * 조사 기록(2026-07): 세트로 뽑지 않았다. 제목 줄을 그대로 두고 세트를 만들면 React에 없는 축을
 * Figma에만 새로 얹는 셈이라 파리티를 깨고(CLAUDE.md 규약 위반), 반대로 GroupPanel과 똑같이 제목을
 * 지우면 두 화면의 렌더 결과가 바뀐다(이번 작업 금지 사항). 두 규칙이 정면으로 부딪혀서 오너 결정
 * 없이는 어느 쪽으로도 진행하지 않았다.
 */
function sidePanel(ctx: Ctx, title: string, items: Array<[string, string, boolean]>, footer?: FrameNode): FrameNode {
  const p = vbox('Side Panel / ' + title, 4)
  p.counterAxisSizingMode = 'FIXED'
  p.resize(PANEL_W, 400)
  fillH(p)
  pad(p, 16)
  bindFillVar(ctx, p, 'color/bg', WHITE)
  outline(ctx, p)
  const head = hbox('head', 8)
  fill(head)
  head.counterAxisAlignItems = 'CENTER'
  pad(head, 4, 4)
  const ht = hbox('t', 0)
  ht.appendChild(boundText(ctx, title, 14, 'color/text', INK, true))
  head.appendChild(grow(ht))
  head.appendChild(icon(ctx, '_Icon/Filter', 15))
  p.appendChild(head)
  for (const [label, count, active] of items) {
    const it = hbox('Item / ' + label, 8)
    fill(it)
    it.counterAxisAlignItems = 'CENTER'
    pad(it, 9, 10)
    it.cornerRadius = R_CTRL
    if (active) bindFillVar(ctx, it, 'color/primary/100', tintHex(ACCENT))
    else it.fills = []
    const lt = hbox('l', 0)
    lt.counterAxisAlignItems = 'CENTER'
    lt.appendChild(
      active
        ? boundText(ctx, label, F_BODY, 'color/primary', ACCENT, true)
        : boundText(ctx, label, F_BODY, 'color/text', INK),
    )
    it.appendChild(grow(lt))
    it.appendChild(tMuted(ctx, count, 12))
    p.appendChild(it)
  }
  if (footer) {
    const sp = vbox('spacer', 0)
    fill(sp)
    grow(sp)
    sp.primaryAxisSizingMode = 'FIXED'
    sp.resize(sp.width, 8)
    p.appendChild(sp)
    p.appendChild(footer)
  }
  return p
}
/** 좌 패널 + 본문 2단 배치. */
function withPanel(panel: FrameNode, main: FrameNode): FrameNode {
  const body = hbox('Body', GAP)
  fill(body)
  body.counterAxisAlignItems = 'MIN'
  body.appendChild(panel)
  body.appendChild(grow(main))
  return body
}
/** 본문 세로 컬럼(폭 지정). */
function mainCol(w: number): FrameNode {
  const m = vbox('Main', GAP)
  m.counterAxisSizingMode = 'FIXED'
  m.resize(w, 100)
  return m
}
/**
 * 통계 타일(대시보드 3장·고객 상세 4장 — 총 7회). React 대응은 Statistics(items[].label/value/tone)다.
 *
 * 조사 기록(2026-07): 세트로 뽑지 않았다. 두 가지 이유가 겹친다.
 *  1) DS/Statistics는 이미 categories-data-kr-media.ts가 만들어 뒀다(다른 페이지 소속) — tabs()와
 *     같은 이유로 screens.ts의 inst()가 닿을 수 없고(admin.ts 레지스트리만 검사), 이름을 그대로
 *     admin.ts에 다시 선언하면 세트 이름 중복으로 verify-mapping이 실패한다.
 *  2) 설사 새로 만들 수 있어도 이 함수는 타일마다 아이콘을 그리는데, 실제 Statistics.tsx의
 *     StatItem에는 icon 필드가 없다(label/value/delta/hint/tone뿐). 아이콘을 그대로 두면 React에
 *     없는 축을 Figma 세트에 얹는 것이고, 아이콘을 빼면 두 화면의 렌더가 바뀐다 — 둘 다 이번
 *     작업의 금지 사항과 부딪힌다. (참고: TodoSummary·ActivityLog는 비슷한 아이콘을 '항목별로
 *     달라지는 실제 축'이 아니라 고정 데이터로 박아 넣어 이 문제를 피했는데, 그 예외는
 *     scripts/verify-naming.mjs의 ALLOWLIST에 사유가 등록돼 있어야 하고 그 파일은 소유 범위 밖이다.)
 */
function statTile(ctx: Ctx, label: string, value: string, iconKey?: string, tone: Tone = 'primary'): FrameNode {
  const t = vbox('Stat / ' + label, 8)
  grow(t)
  pad(t, 16)
  t.cornerRadius = R_CTRL
  bindFillVar(ctx, t, 'color/bgSubtle', SURFACE)
  const top = hbox('top', 6)
  fill(top)
  top.counterAxisAlignItems = 'CENTER'
  if (iconKey) top.appendChild(icon(ctx, iconKey, 15, `color/${tone}`, TONE_HEX[tone]))
  top.appendChild(tSub(ctx, label, 12))
  t.appendChild(top)
  t.appendChild(boundText(ctx, value, 20, 'color/text', INK, true))
  return t
}
/** 세로 막대 차트(2계열) — 값은 0~100 비율. */
function barChart(ctx: Ctx, h: number, labels: string[], a: number[], b: number[]): FrameNode {
  const wrap = vbox('Chart', 12)
  fill(wrap)
  const plot = hbox('Plot', 0)
  fill(plot)
  plot.primaryAxisAlignItems = 'SPACE_BETWEEN'
  plot.counterAxisAlignItems = 'MAX'
  plot.counterAxisSizingMode = 'FIXED'
  plot.resize(plot.width, h)
  pad(plot, 0, 12)
  labels.forEach((_, i) => {
    const g = hbox('g', 5)
    g.counterAxisAlignItems = 'MAX'
    const b1 = fixed('bar', 'VERTICAL', 22, Math.max(6, Math.round((a[i] / 100) * (h - 12))))
    b1.cornerRadius = 5
    bindFillVar(ctx, b1, 'color/primary', ACCENT)
    const b2 = fixed('bar', 'VERTICAL', 22, Math.max(6, Math.round((b[i] / 100) * (h - 12))))
    b2.cornerRadius = 5
    bindFillVar(ctx, b2, 'color/primary/300', tintHex(ACCENT, 0.44))
    g.appendChild(b1)
    g.appendChild(b2)
    plot.appendChild(g)
  })
  wrap.appendChild(plot)
  const axis = hbox('Axis', 0)
  fill(axis)
  axis.primaryAxisAlignItems = 'SPACE_BETWEEN'
  pad(axis, 0, 12)
  labels.forEach((l) => {
    const cellw = hbox('x', 0)
    cellw.primaryAxisAlignItems = 'CENTER'
    cellw.counterAxisSizingMode = 'FIXED'
    cellw.primaryAxisSizingMode = 'FIXED'
    cellw.resize(49, 16)
    cellw.appendChild(tMuted(ctx, l, 11))
    axis.appendChild(cellw)
  })
  wrap.appendChild(axis)
  return wrap
}
/** 차트 범례. */
function legend(ctx: Ctx, items: Array<[string, string, string]>): FrameNode {
  const l = hbox('Legend', 14)
  l.counterAxisAlignItems = 'CENTER'
  for (const [label, varName, hex] of items) {
    const it = hbox('i', 6)
    it.counterAxisAlignItems = 'CENTER'
    const dot = figma.createEllipse()
    dot.resize(8, 8)
    const v = ctx.vars.get(varName)
    dot.fills = [v ? boundPaint(v) : solid(hex)]
    it.appendChild(dot)
    it.appendChild(tSub(ctx, label, 12))
    l.appendChild(it)
  }
  return l
}

// ══ 1. 고객 목록 ═════════════════════════════════════════════════════
function screenMemberList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '고객 목록')
  s.appendChild(
    pageHead(ctx, '고객 목록', '회원 정보를 확인하고 그룹·적립금을 관리합니다.', [
      btn(ctx, '엑셀 내보내기', 'outline', '_Icon/Download'),
      btn(ctx, '회원 등록', 'primary', '_Icon/UserPlus'),
    ]),
  )

  const panel = sidePanel(
    ctx,
    '그룹',
    [
      ['전체 회원', '1,284', true],
      ['VIP', '86', false],
      ['신규 가입', '132', false],
      ['휴면 회원', '42', false],
      ['차단 회원', '7', false],
      ['그룹 없음', '108', false],
    ],
    btn(ctx, '새 그룹 만들기', 'outline', '_Icon/Plus'),
  )

  const main = mainCol(MAIN_W)
  const c = flatCard(ctx, '회원 표')
  c.appendChild(
    toolbar(
      ctx,
      [
        input(ctx, '닉네임·계정·연락처 검색', 320, { leadIcon: '_Icon/Search' }),
        input(ctx, '회원 유형 전체', 160, { trailIcon: '_Icon/ChevronDown' }),
        input(ctx, '가입일 전체', 160, { trailIcon: '_Icon/Calendar' }),
      ],
      [btn(ctx, '적립금 지급', 'outline', '_Icon/Coins'), btn(ctx, '삭제', 'danger', '_Icon/Trash2')],
    ),
  )
  const cols: Col[] = [
    { label: '', w: 48, align: 'center', head: { t: 'check', on: false } },
    { label: '닉네임', w: 140 },
    { label: '계정', w: 200 },
    { label: '회원유형', w: 100 },
    { label: '그룹', w: 120 },
    { label: '가입일', w: 120 },
    { label: '적립금', w: 100, align: 'right' },
    { label: '활동수', w: 120, align: 'center' },
    { label: '누적구매', w: 120, align: 'right' },
    { label: '메모', w: 180, grow: true },
    { label: '', w: 56, align: 'center' },
  ]
  const rows: Cell[][] = [
    [
      { t: 'check', on: true },
      { t: 'link', v: '민트초코' },
      'mint@example.com',
      { t: 'badge', v: 'VIP', tone: 'warning' },
      'VIP',
      '2024-03-11',
      '12,400',
      '8/12/3/1',
      '1,284,000',
      { t: 'muted', v: '재구매 문의 많음' },
      { t: 'kebab' },
    ],
    [
      { t: 'check' },
      { t: 'link', v: '해피토끼' },
      'happy.rabbit@example.com',
      { t: 'badge', v: '일반', tone: 'secondary' },
      '그룹 없음',
      '2024-06-02',
      '3,100',
      '2/5/1/0',
      '286,000',
      { t: 'muted', v: '—' },
      { t: 'kebab' },
    ],
    [
      { t: 'check' },
      { t: 'link', v: '나무늘보' },
      'sloth@example.com',
      { t: 'badge', v: '휴면', tone: 'secondary' },
      '휴면 회원',
      '2023-11-20',
      '0',
      '0/0/0/2',
      '54,000',
      { t: 'muted', v: '휴면 전환 안내 발송' },
      { t: 'kebab' },
    ],
    [
      { t: 'check' },
      { t: 'link', v: '초록별' },
      'green.star@example.com',
      { t: 'badge', v: '작가', tone: 'success' },
      '작가',
      '2025-01-08',
      '48,900',
      '31/64/12/4',
      '3,940,000',
      { t: 'muted', v: '정산 계좌 확인 필요' },
      { t: 'kebab' },
    ],
    [
      { t: 'check' },
      { t: 'link', v: '밤하늘' },
      'night.sky@example.com',
      { t: 'badge', v: '차단', tone: 'error' },
      '차단 회원',
      '2024-09-17',
      '0',
      '0/1/0/6',
      '0',
      { t: 'muted', v: '반복 취소 — 차단' },
      { t: 'kebab' },
    ],
  ]
  c.appendChild(table(ctx, MAIN_W, cols, rows))
  c.appendChild(pagination(ctx, '전체 1,284명 · 5명 표시'))
  main.appendChild(c)

  s.appendChild(withPanel(panel, main))
  return s
}

// ══ 2. 운영진 ════════════════════════════════════════════════════════
function screenStaffList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '운영진')
  s.appendChild(
    pageHead(ctx, '운영진', '부서·직급별 운영진 계정을 관리합니다.', [
      btn(ctx, '권한 설정', 'outline', '_Icon/ShieldCheck'),
      btn(ctx, '운영진 추가', 'primary', '_Icon/UserPlus'),
    ]),
  )

  const panel = sidePanel(
    ctx,
    '부서',
    [
      ['전체', '24', true],
      ['운영팀', '9', false],
      ['CS팀', '7', false],
      ['마케팅팀', '4', false],
      ['개발팀', '3', false],
      ['외부 협력', '1', false],
    ],
    btn(ctx, '새 부서 만들기', 'outline', '_Icon/Plus'),
  )

  const main = mainCol(MAIN_W)
  const c = flatCard(ctx, '운영진 표')
  c.appendChild(
    toolbar(
      ctx,
      [
        input(ctx, '닉네임·계정 검색', 320, { leadIcon: '_Icon/Search' }),
        input(ctx, '직급 전체', 160, { trailIcon: '_Icon/ChevronDown' }),
      ],
      [btn(ctx, '엑셀 내보내기', 'outline', '_Icon/Download')],
    ),
  )
  const cols: Col[] = [
    { label: '', w: 48, align: 'center', head: { t: 'check' } },
    { label: '닉네임', w: 160 },
    { label: '계정', w: 220 },
    { label: '그룹', w: 130 },
    { label: '가입일', w: 120 },
    { label: '부서', w: 130 },
    { label: '직급', w: 110 },
    { label: '연락처', w: 150 },
    { label: '메모', w: 200, grow: true },
    { label: '', w: 56, align: 'center' },
  ]
  const rows: Cell[][] = [
    [
      { t: 'check' },
      { t: 'link', v: '김운영' },
      'ops.kim@company.co.kr',
      { t: 'badge', v: '최고관리자', tone: 'primary' },
      '2023-02-01',
      '운영팀',
      '팀장',
      '010-1234-5678',
      { t: 'muted', v: '전체 권한' },
      { t: 'kebab' },
    ],
    [
      { t: 'check' },
      { t: 'link', v: '박상담' },
      'cs.park@company.co.kr',
      { t: 'badge', v: 'CS', tone: 'success' },
      '2023-08-14',
      'CS팀',
      '매니저',
      '010-2345-6789',
      { t: 'muted', v: '문의 1차 응대' },
      { t: 'kebab' },
    ],
    [
      { t: 'check' },
      { t: 'link', v: '이마케팅' },
      'mkt.lee@company.co.kr',
      { t: 'badge', v: '마케터', tone: 'warning' },
      '2024-01-09',
      '마케팅팀',
      '주임',
      '010-3456-7890',
      { t: 'muted', v: '기획전 담당' },
      { t: 'kebab' },
    ],
    [
      { t: 'check' },
      { t: 'link', v: '최개발' },
      'dev.choi@company.co.kr',
      { t: 'badge', v: '개발', tone: 'secondary' },
      '2024-05-27',
      '개발팀',
      '선임',
      '010-4567-8901',
      { t: 'muted', v: '연동/배치 담당' },
      { t: 'kebab' },
    ],
  ]
  c.appendChild(table(ctx, MAIN_W, cols, rows))
  c.appendChild(pagination(ctx, '전체 24명 · 4명 표시'))
  main.appendChild(c)

  s.appendChild(withPanel(panel, main))
  return s
}

// ══ 3. 상품 목록 ═════════════════════════════════════════════════════
function screenProductList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '상품 목록')
  s.appendChild(
    pageHead(ctx, '상품 목록', '판매 상품의 상태·재고·가격을 한눈에 관리합니다.', [
      btn(ctx, '엑셀 내보내기', 'outline', '_Icon/Download'),
      btn(ctx, '상품 등록', 'primary', '_Icon/Plus'),
    ]),
  )

  // 좌 카테고리 트리
  const panel = vbox('Side Panel / 카테고리', 2)
  panel.counterAxisSizingMode = 'FIXED'
  panel.resize(PANEL_W, 400)
  fillH(panel)
  pad(panel, 16)
  bindFillVar(ctx, panel, 'color/bg', WHITE)
  outline(ctx, panel)
  const ph = hbox('head', 8)
  fill(ph)
  ph.counterAxisAlignItems = 'CENTER'
  pad(ph, 4, 4)
  const pht = hbox('t', 0)
  pht.appendChild(boundText(ctx, '카테고리', 14, 'color/text', INK, true))
  ph.appendChild(grow(pht))
  ph.appendChild(icon(ctx, '_Icon/Plus', 15))
  panel.appendChild(ph)
  const tree: Array<[number, string, string, boolean, boolean]> = [
    [0, '전체 상품', '482', true, false],
    [0, '가구', '164', false, true],
    [1, '소파', '58', false, false],
    [1, '테이블', '47', false, false],
    [1, '수납장', '59', false, false],
    [0, '조명', '96', false, true],
    [1, '스탠드', '38', false, false],
    [1, '펜던트', '58', false, false],
    [0, '패브릭', '122', false, false],
    [0, '주방', '100', false, false],
  ]
  for (const [depth, label, count, active, open] of tree) {
    const it = hbox('Node / ' + label, 6)
    fill(it)
    it.counterAxisAlignItems = 'CENTER'
    it.paddingTop = it.paddingBottom = 8
    it.paddingLeft = 8 + depth * 16
    it.paddingRight = 8
    it.cornerRadius = R_CTRL
    if (active) bindFillVar(ctx, it, 'color/primary/100', tintHex(ACCENT))
    else it.fills = []
    it.appendChild(icon(ctx, open ? '_Icon/ChevronDown' : depth > 0 ? '_Icon/Tag' : '_Icon/Folder', 14))
    const lt = hbox('l', 0)
    lt.counterAxisAlignItems = 'CENTER'
    lt.appendChild(
      active
        ? boundText(ctx, label, F_BODY, 'color/primary', ACCENT, true)
        : boundText(ctx, label, F_BODY, 'color/text', INK),
    )
    it.appendChild(grow(lt))
    it.appendChild(tMuted(ctx, count, 12))
    panel.appendChild(it)
  }

  const main = mainCol(MAIN_W)
  main.appendChild(
    tabs(ctx, [
      ['전체', '482', true],
      ['판매중', '431', false],
      ['품절', '28', false],
      ['숨김', '23', false],
    ]),
  )

  const c = flatCard(ctx, '상품 표')
  c.appendChild(
    toolbar(
      ctx,
      [
        input(ctx, '상품명·상품번호 검색', 300, { leadIcon: '_Icon/Search' }),
        input(ctx, '카테고리 전체', 150, { trailIcon: '_Icon/ChevronDown' }),
        input(ctx, '기획전 전체', 150, { trailIcon: '_Icon/ChevronDown' }),
        btn(ctx, '검색', 'primary'),
      ],
      [iconBtn(ctx, '_Icon/LayoutGrid'), iconBtn(ctx, '_Icon/Refresh')],
    ),
  )
  const cols: Col[] = [
    { label: '', w: 48, align: 'center', head: { t: 'check' } },
    { label: '상품번호', w: 110 },
    { label: '상품명', w: 320, grow: true },
    { label: '판매가', w: 110, align: 'right' },
    { label: '상태', w: 90, align: 'center' },
    { label: '재고', w: 80, align: 'right' },
    { label: '카테고리', w: 120 },
    { label: '기획전', w: 130 },
    { label: '등록일', w: 110 },
    { label: '수정일', w: 110 },
  ]
  const rows: Cell[][] = [
    [
      { t: 'check', on: true },
      { t: 'muted', v: 'P-100482' },
      { t: 'thumb', v: '모듈형 3인용 소파', tags: ['신상', 'BEST'] },
      '1,290,000',
      { t: 'badge', v: '판매중', tone: 'success' },
      '32',
      '가구 > 소파',
      '봄맞이 기획전',
      '2026-05-02',
      '2026-07-01',
    ],
    [
      { t: 'check' },
      { t: 'muted', v: 'P-100477' },
      { t: 'thumb', v: '원목 4인 식탁 세트', tags: ['한정'] },
      '890,000',
      { t: 'badge', v: '품절', tone: 'error' },
      '0',
      '가구 > 테이블',
      '—',
      '2026-04-18',
      '2026-06-28',
    ],
    [
      { t: 'check' },
      { t: 'muted', v: 'P-100463' },
      { t: 'thumb', v: '북유럽 플로어 스탠드' },
      '129,000',
      { t: 'badge', v: '판매중', tone: 'success' },
      '148',
      '조명 > 스탠드',
      '조명 대전',
      '2026-03-30',
      '2026-06-11',
    ],
    [
      { t: 'check' },
      { t: 'muted', v: 'P-100455' },
      { t: 'thumb', v: '워싱 리넨 커튼 (2p)' },
      '78,000',
      { t: 'badge', v: '숨김', tone: 'secondary' },
      '12',
      '패브릭',
      '—',
      '2026-02-14',
      '2026-05-09',
    ],
    [
      { t: 'check' },
      { t: 'muted', v: 'P-100441' },
      { t: 'thumb', v: '스테인리스 냄비 3종', tags: ['재입고'] },
      '112,000',
      { t: 'badge', v: '판매중', tone: 'success' },
      '9',
      '주방',
      '주방 페어',
      '2026-01-22',
      '2026-04-30',
    ],
  ]
  // 표 = DS/AdminTable 인스턴스(frame=flush — 이미 카드 안이라 자체 보더를 뺀다).
  // 컬럼 폭·행 데이터가 세트와 같은 값이라 오버라이드 없이 그대로 붙는다.
  // 열을 빼려면 여기서 'Show Code' / 'Show Category' 같은 BOOLEAN을 false로 주면 된다(columnVisibility).
  const tbl = inst(ctx, 'DS/AdminTable', {
    name: 'Product Table',
    variant: { density: 'comfortable', frame: 'flush' },
    props: { 'Show Select': true, 'Show Thumb': true, 'Show Actions': true },
  })
  if (tbl) c.appendChild(instFill(tbl))
  else c.appendChild(table(ctx, MAIN_W, cols, rows)) // 폴백 — 세트 없이 화면만 생성한 경우
  c.appendChild(pagination(ctx, '전체 482개 · 5개 표시'))
  main.appendChild(c)

  s.appendChild(withPanel(panel, main))
  return s
}

// ══ 4. 주문 목록 ═════════════════════════════════════════════════════
// 조사 기록(2026-07): orderRow(아래)는 이 화면 안에서만 2번(주문 2건) 반복돼 세트 후보로 검토했다.
// 하지만 React의 OrderList는 AdminListPage 위에 조립된 화면 전체 컴포넌트(헤더·탭·툴바·행 40여 개
// prop)이고, '5분할 카드 행' 자체는 OrderList.tsx 안의 인라인 JSX일 뿐 별도로 export된 컴포넌트가
// 아니다. admin.ts가 지금까지 미러링한 세트(AdminSidebar·TodoSummary·DefinitionList 등)는 전부
// 이렇게 독립적으로 이름 붙은 작은 컴포넌트였다 — 이름 없는 조각을 위해 'DS/OrderList' 같은 이름을
// 새로 지어 붙이면 그 자체가 이름이 코드가 정한다는 규약과 어긋난다(실체 없는 이름을 미러링하는 셈).
// 그래서 세트로 뽑지 않았다.
/** 5분할 카드 행의 한 칸. */
function orderCell(ctx: Ctx, title: string, w: number, growCell = false): FrameNode {
  const c = vbox('Order / ' + title, 8)
  if (growCell) grow(c)
  else {
    c.counterAxisSizingMode = 'FIXED'
    c.resize(w, 100)
  }
  fillH(c)
  pad(c, 16)
  rightLine(ctx, c)
  c.appendChild(boundText(ctx, title, F_HEAD, 'color/secondary', SUB, true))
  return c
}
function kv(ctx: Ctx, k: string, v: string, strong = false): FrameNode {
  const r = hbox('kv', 8)
  fill(r)
  r.counterAxisAlignItems = 'CENTER'
  const l = hbox('k', 0)
  l.counterAxisSizingMode = 'FIXED'
  l.primaryAxisSizingMode = 'FIXED'
  l.resize(72, 18)
  l.counterAxisAlignItems = 'CENTER'
  l.appendChild(tMuted(ctx, k, 12))
  r.appendChild(l)
  const val = hbox('v', 0)
  val.counterAxisAlignItems = 'CENTER'
  val.appendChild(tBody(ctx, v, strong))
  r.appendChild(grow(val))
  return r
}
function orderRow(
  ctx: Ctx,
  o: {
    no: string
    channel?: string
    at: string
    status: [string, Tone]
    buyer: string
    account: string
    items: Array<[string, string, string]>
    carrier: string
    tracking: string
    pay: Array<[string, string]>
    total: string
    receiver: [string, string, string, string]
  },
): FrameNode {
  const c = flatCard(ctx, '주문 ' + o.no)

  // 상단 스트립
  const head = hbox('Order Head', 10)
  fill(head)
  head.counterAxisAlignItems = 'CENTER'
  pad(head, 12, 16)
  bindFillVar(ctx, head, 'color/bgSubtle', SURFACE)
  bottomLine(ctx, head)
  head.appendChild(checkbox(ctx, false))
  head.appendChild(tBody(ctx, o.no, true))
  if (o.channel) head.appendChild(badge(ctx, o.channel, 'success'))
  head.appendChild(tMuted(ctx, o.at, 12))
  head.appendChild(badge(ctx, o.status[0], o.status[1]))
  const sp = hbox('sp', 0)
  head.appendChild(grow(sp))
  head.appendChild(btn(ctx, '주문 상세', 'outline', undefined, 28))
  head.appendChild(btn(ctx, '송장 등록', 'primary', '_Icon/Truck', 28))
  c.appendChild(head)

  // 5분할
  const body = hbox('Order Body', 0)
  fill(body)
  body.counterAxisAlignItems = 'MIN'

  const c1 = orderCell(ctx, '주문정보', 240)
  c1.appendChild(kv(ctx, '주문자', o.buyer, true))
  c1.appendChild(kv(ctx, '계정', o.account))
  c1.appendChild(kv(ctx, '주문일시', o.at))
  body.appendChild(c1)

  const c2 = orderCell(ctx, '품목', 0, true)
  for (const [name, price, qty] of o.items) {
    const it = hbox('item', 10)
    fill(it)
    it.counterAxisAlignItems = 'CENTER'
    it.appendChild(thumbBox(ctx, 36, 36))
    const meta = vbox('meta', 3)
    meta.appendChild(tBody(ctx, name, true))
    meta.appendChild(tMuted(ctx, price + ' · ' + qty, 12))
    it.appendChild(grow(meta))
    it.appendChild(badge(ctx, '배송완료', 'secondary'))
    c2.appendChild(it)
  }
  body.appendChild(c2)

  const c3 = orderCell(ctx, '배송', 280)
  c3.appendChild(fill(input(ctx, '택배사 선택', 0, { value: o.carrier, trailIcon: '_Icon/ChevronDown', h: 32 })))
  c3.appendChild(fill(input(ctx, '운송장 번호', 0, { value: o.tracking, h: 32 })))
  c3.appendChild(tMuted(ctx, '입력 후 저장하면 고객에게 발송 알림이 갑니다.', 11))
  body.appendChild(c3)

  const c4 = orderCell(ctx, '결제', 260)
  for (const [k, v] of o.pay) c4.appendChild(kv(ctx, k, v))
  const tot = hbox('total', 8)
  fill(tot)
  tot.counterAxisAlignItems = 'CENTER'
  tot.paddingTop = 8
  const tl = hbox('l', 0)
  tl.appendChild(tSub(ctx, '결제 금액', 12))
  tot.appendChild(grow(tl))
  tot.appendChild(boundText(ctx, o.total, 15, 'color/primary', ACCENT, true))
  c4.appendChild(tot)
  body.appendChild(c4)

  const c5 = orderCell(ctx, '수령인', 280)
  c5.strokes = [] // 마지막 칸 — 오른쪽 구분선 없음
  c5.appendChild(kv(ctx, '이름', o.receiver[0], true))
  c5.appendChild(kv(ctx, '연락처', o.receiver[1]))
  c5.appendChild(kv(ctx, '주소', o.receiver[2]))
  c5.appendChild(kv(ctx, '요청사항', o.receiver[3]))
  body.appendChild(c5)

  c.appendChild(body)
  return c
}
function screenOrderList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '주문 목록')
  s.appendChild(
    pageHead(ctx, '주문 목록', '주문 상태별로 품목·배송·결제·수령인을 한 행에서 처리합니다.', [
      btn(ctx, '엑셀 내보내기', 'outline', '_Icon/Download'),
      btn(ctx, '일괄 송장 등록', 'primary', '_Icon/Upload'),
    ]),
  )
  s.appendChild(
    tabs(ctx, [
      ['전체', '1,024', true],
      ['결제대기', '18', false],
      ['상품준비중', '62', false],
      ['배송대기', '41', false],
      ['배송중', '87', false],
      ['배송완료', '790', false],
      ['취소접수', '14', false],
      ['반품접수', '12', false],
    ]),
  )

  const bar = flatCard(ctx, '주문 검색')
  const searchBar = toolbar(
    ctx,
    [
      input(ctx, '주문번호·주문자·연락처 검색', 340, { leadIcon: '_Icon/Search' }),
      input(ctx, '기간 전체', 180, { trailIcon: '_Icon/Calendar' }),
      input(ctx, '채널 전체', 150, { trailIcon: '_Icon/ChevronDown' }),
      btn(ctx, '검색', 'primary'),
    ],
    [btn(ctx, '필터', 'outline', '_Icon/Filter'), iconBtn(ctx, '_Icon/Settings2')],
  )
  searchBar.strokes = [] // 툴바만 있는 카드 — 하단 구분선 없음(카드 보더와 겹침 방지)
  bar.appendChild(searchBar)
  s.appendChild(bar)

  s.appendChild(
    orderRow(ctx, {
      no: '20260713-0001',
      channel: 'N',
      at: '2026-07-13 09:41',
      status: ['배송대기', 'warning'],
      buyer: '민트초코',
      account: 'mint@example.com',
      items: [
        ['모듈형 3인용 소파', '1,290,000원', '1개'],
        ['워싱 리넨 커튼 (2p)', '78,000원', '2개'],
      ],
      carrier: 'CJ대한통운',
      tracking: '6012 3456 7890',
      pay: [
        ['상품금액', '1,446,000원'],
        ['배송비', '0원'],
        ['할인', '-50,000원'],
        ['적립금', '-6,000원'],
        ['결제수단', '신용카드'],
      ],
      total: '1,390,000원',
      receiver: ['김수령', '010-1234-5678', '서울 강남구 테헤란로 123', '부재 시 경비실'],
    }),
  )
  s.appendChild(
    orderRow(ctx, {
      no: '20260712-0087',
      at: '2026-07-12 21:08',
      status: ['배송중', 'primary'],
      buyer: '해피토끼',
      account: 'happy.rabbit@example.com',
      items: [['북유럽 플로어 스탠드', '129,000원', '1개']],
      carrier: '한진택배',
      tracking: '4188 2210 5533',
      pay: [
        ['상품금액', '129,000원'],
        ['배송비', '3,000원'],
        ['할인', '0원'],
        ['적립금', '-1,000원'],
        ['결제수단', '간편결제'],
      ],
      total: '131,000원',
      receiver: ['이받음', '010-9876-5432', '경기 성남시 분당구 판교로 45', '문 앞에 놓아주세요'],
    }),
  )
  return s
}

// ══ 5. 대시보드 ══════════════════════════════════════════════════════
/** 폴백 — DS/TodoSummary 세트가 없을 때의 '오늘의 할일' 카드(세트와 같은 모양). */
function drawTodoCard(ctx: Ctx): FrameNode {
  const todo = flatCard(ctx, '오늘의 할일')
  const th = hbox('head', 8)
  fill(th)
  th.counterAxisAlignItems = 'CENTER'
  pad(th, 16, 20)
  bottomLine(ctx, th)
  const tt = hbox('t', 8)
  tt.counterAxisAlignItems = 'CENTER'
  tt.appendChild(boundText(ctx, '오늘의 할일', 15, 'color/text', INK, true))
  tt.appendChild(badge(ctx, '38건', 'primary'))
  th.appendChild(grow(tt))
  th.appendChild(tMuted(ctx, '2026-07-13 09:41 기준', 12))
  todo.appendChild(th)

  const todoRow = hbox('Todo Row', 0)
  fill(todoRow)
  const todos: Array<[string, string, string, Tone]> = [
    ['신규 주문', '12', '_Icon/Receipt', 'primary'],
    ['미입금', '3', '_Icon/Wallet', 'warning'],
    ['배송 준비', '8', '_Icon/Package', 'primary'],
    ['취소 요청', '2', '_Icon/CircleX', 'error'],
    ['신규 문의', '5', '_Icon/MessageSquare', 'success'],
    ['신규 회원', '8', '_Icon/UserPlus', 'secondary'],
  ]
  todos.forEach(([label, count, iconKey, tone], i) => {
    const cell = vbox('Todo / ' + label, 8)
    grow(cell)
    pad(cell, 20)
    if (i < todos.length - 1) rightLine(ctx, cell)
    const top = hbox('top', 6)
    fill(top)
    top.counterAxisAlignItems = 'CENTER'
    top.appendChild(icon(ctx, iconKey, 15, `color/${tone}`, TONE_HEX[tone]))
    top.appendChild(tSub(ctx, label, 12))
    cell.appendChild(top)
    const bot = hbox('bot', 4)
    fill(bot)
    bot.counterAxisAlignItems = 'CENTER'
    bot.appendChild(boundText(ctx, count, 24, 'color/text', INK, true))
    bot.appendChild(tMuted(ctx, '건', 12))
    const gp = hbox('gp', 0)
    bot.appendChild(grow(gp))
    bot.appendChild(icon(ctx, '_Icon/ChevronRight', 16))
    cell.appendChild(bot)
    todoRow.appendChild(cell)
  })
  todo.appendChild(todoRow)
  return todo
}

function screenDashboard(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '대시보드')
  s.appendChild(
    pageHead(ctx, '대시보드', '오늘 처리해야 할 일과 기간별 지표를 한 화면에서 확인합니다.', [
      input(ctx, '2026-07-01 ~ 2026-07-13', 240, { leadIcon: '_Icon/Calendar' }),
      iconBtn(ctx, '_Icon/Refresh'),
    ]),
  )
  s.appendChild(
    tabs(ctx, [
      ['중고', '', true],
      ['렌탈', '', false],
      ['시공', '', false],
    ]),
  )

  // 오늘의 할일 = DS/TodoSummary 인스턴스. 6칸·건수·기준 시각이 전부 컴포넌트 속성이다.
  const todoInst = inst(ctx, 'DS/TodoSummary', { name: 'Todo Summary' })
  s.appendChild(todoInst ? instFill(todoInst) : drawTodoCard(ctx))

  // 최근 주문 / 판매 신청 2열
  const feeds = hbox('Feeds', GAP)
  fill(feeds)
  feeds.counterAxisAlignItems = 'MIN'
  const feedData: Array<[string, string, Array<[string, string, string]>]> = [
    [
      '최근 주문',
      '12',
      [
        ['모듈형 3인용 소파', '민트초코', '2026-07-13'],
        ['원목 4인 식탁 세트', '해피토끼', '2026-07-13'],
        ['북유럽 플로어 스탠드', '초록별', '2026-07-12'],
        ['스테인리스 냄비 3종', '밤하늘', '2026-07-12'],
      ],
    ],
    [
      '판매 신청',
      '6',
      [
        ['빈티지 원목 서랍장', '나무늘보', '2026-07-13'],
        ['패브릭 1인 소파', '구름한점', '2026-07-12'],
        ['아카시아 도마 세트', '바다소리', '2026-07-12'],
        ['라탄 조명 갓', '민들레', '2026-07-11'],
      ],
    ],
  ]
  for (const [title, count, items] of feedData) {
    const fc = card(ctx, title, 12)
    grow(fc)
    fc.appendChild(cardHead(ctx, title, btn(ctx, '더보기', 'ghost', '_Icon/ChevronRight', 28), count + '건'))
    for (const [name, author, date] of items) {
      const it = hbox('feed', 12)
      fill(it)
      it.counterAxisAlignItems = 'CENTER'
      pad(it, 10, 0)
      bottomLine(ctx, it)
      it.appendChild(thumbBox(ctx, 40, 40))
      const meta = vbox('meta', 4)
      meta.appendChild(tBody(ctx, name, true))
      meta.appendChild(tMuted(ctx, author + ' · ' + date, 12))
      it.appendChild(grow(meta))
      it.appendChild(icon(ctx, '_Icon/ChevronRight', 16))
      fc.appendChild(it)
    }
    feeds.appendChild(fc)
  }
  s.appendChild(feeds)

  // 차트 + 기간별 분석표
  //
  // 조사 기록(2026-07): 두 블록 다 DS/AdminChart·DS/AnalyticsTable 인스턴스로 바꾸지 않았다. 두 세트
  // 모두 데이터(막대 값·범례, 표의 columns·rows·summaries)가 배열이라 축이 될 수 없어 고정 데모
  // 데이터로 박혀 있다 — AdminChart는 title/centerLabel 텍스트 축만 열려 있고 series 자체는
  // renderAdminChart(admin.ts:4664-4696) 안에 '월별 매출 추이' 데모로 고정, AnalyticsTable도 같은
  // 이유로 renderAnalyticsTable(admin.ts:4538) 안에 데모 표가 고정돼 있다. 세트로 바꾸면 이 화면의
  // 방문자/페이지뷰/일자별 매출 수치가 전부 그 데모 값으로 대체된다 — 그래서 아래는 이 화면 전용
  // 로컬 헬퍼(barChart·table)로 직접 그린다.
  const stats = hbox('Stats', GAP)
  fill(stats)
  stats.counterAxisAlignItems = 'MIN'

  const chartCard = card(ctx, '방문 추이', 16)
  grow(chartCard)
  chartCard.appendChild(
    cardHead(
      ctx,
      '방문자 · 페이지뷰 추이',
      legend(ctx, [
        ['방문자', 'color/primary', ACCENT],
        ['페이지뷰', 'color/primary/300', tintHex(ACCENT, 0.44)],
      ]),
    ),
  )
  chartCard.appendChild(
    barChart(
      ctx,
      220,
      ['07-06', '07-07', '07-08', '07-09', '07-10', '07-11', '07-12', '07-13'],
      [42, 58, 51, 74, 66, 88, 79, 95],
      [61, 72, 68, 92, 84, 100, 91, 97],
    ),
  )
  const statRow = hbox('stat row', 12)
  fill(statRow)
  statRow.appendChild(statTile(ctx, '방문자', '12,480', '_Icon/Users', 'primary'))
  statRow.appendChild(statTile(ctx, '주문', '1,024', '_Icon/Receipt', 'success'))
  statRow.appendChild(statTile(ctx, '매출', '184,200,000', '_Icon/Coins', 'warning'))
  chartCard.appendChild(statRow)
  stats.appendChild(chartCard)

  const anaW = 700
  const ana = flatCard(ctx, '기간별 분석')
  ana.counterAxisSizingMode = 'FIXED'
  ana.resize(anaW, 100)
  ana.layoutAlign = 'INHERIT'
  const ah = hbox('head', 8)
  fill(ah)
  ah.counterAxisAlignItems = 'CENTER'
  pad(ah, 16, 20)
  bottomLine(ctx, ah)
  const aht = hbox('t', 0)
  aht.appendChild(boundText(ctx, '기간별 분석', 15, 'color/text', INK, true))
  ah.appendChild(grow(aht))
  ah.appendChild(btn(ctx, '내보내기', 'outline', '_Icon/Download', 28))
  ana.appendChild(ah)
  const anaCols: Col[] = [
    { label: '일자', w: 120 },
    { label: '방문자', w: 100, align: 'right' },
    { label: '페이지뷰', w: 110, align: 'right' },
    { label: '주문', w: 90, align: 'right' },
    { label: '매출', w: 140, align: 'right', grow: true },
    { label: '전환율', w: 100, align: 'right' },
  ]
  const anaRows: Cell[][] = [
    ['2026-07-13', '1,842', '5,120', '128', '24,180,000', '6.9%'],
    ['2026-07-12', '1,530', '4,401', '112', '19,940,000', '7.3%'],
    ['2026-07-11', '1,704', '4,880', '131', '22,510,000', '7.7%'],
    ['2026-07-10', '1,288', '3,652', '96', '15,320,000', '7.5%'],
    ['2026-07-09', '1,436', '4,097', '104', '17,860,000', '7.2%'],
  ]
  ana.appendChild(
    table(ctx, anaW, anaCols, anaRows, ['합계', '7,800', '22,150', '571', '99,810,000', '7.3%']),
  )
  stats.appendChild(ana)
  s.appendChild(stats)
  return s
}

// ══ 6. 공지사항 ══════════════════════════════════════════════════════
function screenNotice(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '공지사항')
  s.appendChild(
    pageHead(ctx, '공지사항', '고객에게 노출되는 공지·이벤트 글을 관리합니다.', [
      btn(ctx, '공지 등록', 'primary', '_Icon/Plus'),
    ]),
  )
  s.appendChild(
    tabs(ctx, [
      ['전체', '128', true],
      ['공지', '54', false],
      ['이벤트', '41', false],
      ['업데이트', '33', false],
    ]),
  )

  const c = flatCard(ctx, '공지 표')
  c.appendChild(
    toolbar(
      ctx,
      [
        input(ctx, '제목·내용 검색', 320, { leadIcon: '_Icon/Search' }),
        input(ctx, '작성자 전체', 160, { trailIcon: '_Icon/ChevronDown' }),
        input(ctx, '기간 전체', 180, { trailIcon: '_Icon/Calendar' }),
        btn(ctx, '검색', 'primary'),
      ],
      [btn(ctx, '선택 삭제', 'danger', '_Icon/Trash2')],
    ),
  )
  const cols: Col[] = [
    { label: '', w: 48, align: 'center', head: { t: 'check' } },
    { label: '번호', w: 80, align: 'center' },
    { label: '분류', w: 110, align: 'center' },
    { label: '제목', w: 400, grow: true },
    { label: '작성자', w: 130 },
    { label: '등록일', w: 130 },
    { label: '조회수', w: 100, align: 'right' },
    { label: '상태', w: 100, align: 'center' },
    { label: '관리', w: 160, align: 'center' },
  ]
  const rows: Cell[][] = [
    [
      { t: 'check' },
      { t: 'muted', v: '128' },
      { t: 'badge', v: '공지', tone: 'primary' },
      { t: 'link', v: '[중요] 여름 휴가 기간 배송 일정 안내' },
      '김운영',
      '2026-07-10',
      '4,281',
      { t: 'badge', v: '노출', tone: 'success' },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'muted', v: '127' },
      { t: 'badge', v: '이벤트', tone: 'warning' },
      { t: 'link', v: '여름맞이 최대 40% 할인 기획전 오픈' },
      '이마케팅',
      '2026-07-05',
      '9,140',
      { t: 'badge', v: '노출', tone: 'success' },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'muted', v: '126' },
      { t: 'badge', v: '업데이트', tone: 'secondary' },
      { t: 'link', v: '적립금 정책 변경 안내 (2026-08-01 시행)' },
      '김운영',
      '2026-06-28',
      '2,014',
      { t: 'badge', v: '예약', tone: 'warning' },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'muted', v: '125' },
      { t: 'badge', v: '공지', tone: 'primary' },
      { t: 'link', v: '개인정보처리방침 개정 안내' },
      '박상담',
      '2026-06-14',
      '1,377',
      { t: 'badge', v: '숨김', tone: 'secondary' },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'muted', v: '124' },
      { t: 'badge', v: '이벤트', tone: 'warning' },
      { t: 'link', v: '첫 구매 고객 적립금 5,000원 지급' },
      '이마케팅',
      '2026-06-01',
      '12,908',
      { t: 'badge', v: '종료', tone: 'error' },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
  ]
  c.appendChild(table(ctx, INNER_W, cols, rows))
  c.appendChild(pagination(ctx, '전체 128건 · 5건 표시'))
  s.appendChild(c)
  return s
}

// ══ 7. 고객 상세 ═════════════════════════════════════════════════════
/** 폴백 — DS/DefinitionList 세트가 없을 때의 회원 정보 정의 리스트. */
function drawMemberDefinitions(ctx: Ctx): FrameNode {
  const dl = vbox('Definition List', 0)
  fill(dl)
  dl.appendChild(defRow(ctx, '회원 ID', 'MB-000482', { muted: true }))
  dl.appendChild(defRow(ctx, '계정', 'mint@example.com'))
  dl.appendChild(defRow(ctx, '연락처', '010-1234-5678', { badge: ['인증됨', 'success'] }))
  dl.appendChild(defRow(ctx, '생일', '1994-05-21'))
  dl.appendChild(defRow(ctx, '성별', '여성'))
  dl.appendChild(defRow(ctx, '회원 유형', 'VIP', { badge: ['VIP', 'warning'] }))
  const last = defRow(ctx, '가입 경로', '이메일 · PC 웹')
  last.strokes = []
  dl.appendChild(last)
  return dl
}
/** 폴백 — DS/MemoBox 세트가 없을 때의 관리자 메모 카드. */
function drawMemoCard(ctx: Ctx): FrameNode {
  const memo = card(ctx, '관리자 메모', 12)
  memo.appendChild(cardHead(ctx, '관리자 메모', tMuted(ctx, '고객에게 노출되지 않습니다', 12)))
  memo.appendChild(textarea(ctx, '메모를 입력하세요. (예: 재구매 문의 많음 — 쿠폰 발송 완료)', 96))
  const memoBar = hbox('bar', 8)
  fill(memoBar)
  memoBar.counterAxisAlignItems = 'CENTER'
  const ml = hbox('l', 0)
  ml.appendChild(tMuted(ctx, '최근 수정: 박상담 · 2026-07-02', 12))
  memoBar.appendChild(grow(ml))
  memoBar.appendChild(btn(ctx, '취소', 'outline'))
  memoBar.appendChild(btn(ctx, '메모 저장', 'primary', '_Icon/Save'))
  memo.appendChild(memoBar)
  return memo
}

function screenCustomerDetail(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '고객 상세')
  s.appendChild(
    pageHead(ctx, '고객 상세', '민트초코 · mint@example.com', [
      btn(ctx, '목록', 'outline', '_Icon/List'),
      btn(ctx, '차단', 'danger', '_Icon/Ban'),
      btn(ctx, '정보 수정', 'primary', '_Icon/Edit'),
    ]),
  )

  const body = hbox('Body', GAP)
  fill(body)
  body.counterAxisAlignItems = 'MIN'

  // 좌 — 회원 정보
  const left = card(ctx, '회원 정보', 16)
  left.counterAxisSizingMode = 'FIXED'
  left.resize(520, 100)
  left.layoutAlign = 'INHERIT'
  const profile = hbox('profile', 16)
  fill(profile)
  profile.counterAxisAlignItems = 'CENTER'
  profile.appendChild(avatar(ctx, 72, '민'))
  const pmeta = vbox('meta', 8)
  const nameRow = hbox('name', 8)
  nameRow.counterAxisAlignItems = 'CENTER'
  nameRow.appendChild(boundText(ctx, '민트초코', 20, 'color/text', INK, true))
  nameRow.appendChild(badge(ctx, '이메일 가입', 'secondary'))
  pmeta.appendChild(nameRow)
  const tagRow = hbox('tags', 6)
  tagRow.appendChild(badge(ctx, 'VIP', 'warning'))
  tagRow.appendChild(badge(ctx, '휴대폰 인증', 'success'))
  pmeta.appendChild(tagRow)
  profile.appendChild(grow(pmeta))
  left.appendChild(profile)

  // 회원 정보 = DS/DefinitionList 인스턴스(frame=flush — 이미 카드 안). 7행 전부 TEXT 속성.
  const dlInst = inst(ctx, 'DS/DefinitionList', {
    name: 'Member Definition List',
    variant: { frame: 'flush' },
    props: {
      'Label 1': '회원 ID',
      'Value 1': 'MB-000482',
      'Label 2': '계정',
      'Value 2': 'mint@example.com',
      'Label 3': '연락처',
      'Value 3': '010-1234-5678 (인증됨)',
      'Label 4': '생일',
      'Value 4': '1994-05-21',
      'Label 5': '성별',
      'Value 5': '여성',
      'Label 6': '회원 유형',
      'Value 6': 'VIP',
      'Label 7': '가입 경로',
      'Value 7': '이메일 · PC 웹',
    },
  })
  left.appendChild(dlInst ? instFill(dlInst) : drawMemberDefinitions(ctx))
  body.appendChild(left)

  // 우 — 활동/동의/메모
  const right = vbox('Right', GAP)
  grow(right)

  const act = card(ctx, '활동 정보', 16)
  act.appendChild(cardHead(ctx, '활동 정보', btn(ctx, '주문 내역 보기', 'ghost', '_Icon/ChevronRight', 28)))
  const tiles = hbox('tiles', 12)
  fill(tiles)
  tiles.appendChild(statTile(ctx, '주문', '18건', '_Icon/Receipt', 'primary'))
  tiles.appendChild(statTile(ctx, '누적 구매', '1,284,000원', '_Icon/Coins', 'warning'))
  tiles.appendChild(statTile(ctx, '문의', '3건', '_Icon/MessageSquare', 'success'))
  tiles.appendChild(statTile(ctx, '댓글', '12건', '_Icon/Chat', 'secondary'))
  act.appendChild(tiles)
  const meta2 = hbox('meta', 0)
  fill(meta2)
  const m1 = vbox('m', 4)
  grow(m1)
  m1.appendChild(tSub(ctx, '가입일', 12))
  m1.appendChild(tBody(ctx, '2024-03-11 (2년 4개월 전)'))
  const m2 = vbox('m', 4)
  grow(m2)
  m2.appendChild(tSub(ctx, '최근 로그인', 12))
  m2.appendChild(tBody(ctx, '2026-07-13 08:22 (1시간 전)'))
  const m3 = vbox('m', 4)
  grow(m3)
  m3.appendChild(tSub(ctx, '적립금', 12))
  m3.appendChild(tBody(ctx, '12,400원', true))
  meta2.appendChild(m1)
  meta2.appendChild(m2)
  meta2.appendChild(m3)
  act.appendChild(meta2)
  right.appendChild(act)

  // 조사 기록(2026-07): DS/ConsentList(admin.ts:3085 renderConsentList) 인스턴스로 바꾸지 않았다.
  // 그 세트는 항목별 날짜 서브텍스트(이 화면의 '2024-03-11 동의' 같은 줄)와 토글 컨트롤이 없고
  // (라벨 + 동의/미동의 배지만 그린다), 행 라벨 자체도 CONSENT_ITEMS에 고정돼 texts 축으로 열려
  // 있지 않다(agreedLabel·deniedLabel은 상태 문구 하나를 공유할 뿐 항목별 문구가 아니다). 세트로
  // 바꾸면 날짜·토글이 사라지고 라벨도 이 화면의 4개 동의 항목과 달라진다.
  const consent = card(ctx, '동의 정보', 12)
  consent.appendChild(cardHead(ctx, '동의 정보'))
  const consents: Array<[string, string, boolean]> = [
    ['이용약관 (필수)', '2024-03-11 동의', true],
    ['개인정보 수집·이용 (필수)', '2024-03-11 동의', true],
    ['마케팅 정보 수신 (선택)', '2025-02-04 동의', true],
    ['야간 광고 수신 (선택)', '미동의', false],
  ]
  consents.forEach(([label, at, on], i) => {
    const r = hbox('consent', 12)
    fill(r)
    r.counterAxisAlignItems = 'CENTER'
    pad(r, 10, 0)
    if (i < consents.length - 1) bottomLine(ctx, r)
    const l = vbox('l', 3)
    l.appendChild(tBody(ctx, label))
    l.appendChild(tMuted(ctx, at, 12))
    r.appendChild(grow(l))
    r.appendChild(badge(ctx, on ? '동의' : '미동의', on ? 'success' : 'secondary'))
    r.appendChild(toggleMini(ctx, on))
    consent.appendChild(r)
  })
  right.appendChild(consent)

  // 관리자 메모 = DS/MemoBox 인스턴스(제목·안내·플레이스홀더·카운터·저장 라벨이 전부 TEXT 속성).
  const memoInst = inst(ctx, 'DS/MemoBox', {
    name: 'Admin Memo',
    props: {
      title: '관리자 메모',
      description: '고객에게 노출되지 않습니다',
      placeholder: '메모를 입력하세요. (예: 재구매 문의 많음 — 쿠폰 발송 완료)',
      // 'Counter' TEXT는 제거됐다(React에 짝이 없다 → BOOLEAN showCounter로 대체).
      // 자유 문구('최근 수정: …')를 담을 속성이 더는 없어 오버라이드를 뺀다 — 세트 기본 카운터가 그려진다.
      saveLabel: '메모 저장',
    },
  })
  right.appendChild(memoInst ? instFill(memoInst) : drawMemoCard(ctx))

  body.appendChild(right)
  s.appendChild(body)
  return s
}

// ══ 8. 문의 내역 ═════════════════════════════════════════════════════
function screenInquiryList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '문의 내역')
  s.appendChild(
    pageHead(ctx, '문의 내역', '접수된 문의를 상태·담당자별로 관리합니다.', [
      btn(ctx, '문의 설정', 'outline', '_Icon/Settings'),
      btn(ctx, '엑셀 내보내기', 'primary', '_Icon/Download'),
    ]),
  )
  s.appendChild(
    tabs(ctx, [
      ['전체', '312', true],
      ['미답변', '27', false],
      ['답변완료', '271', false],
      ['보류', '14', false],
    ]),
  )

  const c = flatCard(ctx, '문의 표')
  c.appendChild(
    toolbar(
      ctx,
      [
        input(ctx, '문의번호·제목·신청자 검색', 340, { leadIcon: '_Icon/Search' }),
        input(ctx, '유형 전체', 150, { trailIcon: '_Icon/ChevronDown' }),
        input(ctx, '담당자 전체', 150, { trailIcon: '_Icon/ChevronDown' }),
        btn(ctx, '검색', 'primary'),
      ],
      [btn(ctx, '담당자 지정', 'outline', '_Icon/UserCheck')],
    ),
  )
  const cols: Col[] = [
    { label: '', w: 48, align: 'center', head: { t: 'check' } },
    { label: '문의번호', w: 130 },
    { label: '유형', w: 110, align: 'center' },
    { label: '제목', w: 360, grow: true },
    { label: '신청자', w: 130 },
    { label: '연락처', w: 150 },
    { label: '접수일', w: 130 },
    { label: '상태', w: 110, align: 'center' },
    { label: '담당자', w: 120 },
    { label: '관리', w: 100, align: 'center' },
  ]
  const rows: Cell[][] = [
    [
      { t: 'check' },
      { t: 'muted', v: 'Q-20260713-01' },
      { t: 'badge', v: '배송', tone: 'primary' },
      { t: 'link', v: '주문한 소파 배송일 변경 가능할까요?' },
      '민트초코',
      '010-1234-5678',
      '2026-07-13',
      { t: 'badge', v: '미답변', tone: 'error' },
      { t: 'muted', v: '미지정' },
      { t: 'btns', v: ['답변'] },
    ],
    [
      { t: 'check' },
      { t: 'muted', v: 'Q-20260712-08' },
      { t: 'badge', v: '교환/반품', tone: 'warning' },
      { t: 'link', v: '커튼 색상이 사진과 달라 교환하고 싶습니다' },
      '해피토끼',
      '010-2345-6789',
      '2026-07-12',
      { t: 'badge', v: '답변완료', tone: 'success' },
      '박상담',
      { t: 'btns', v: ['보기'] },
    ],
    [
      { t: 'check' },
      { t: 'muted', v: 'Q-20260712-03' },
      { t: 'badge', v: '상품', tone: 'secondary' },
      { t: 'link', v: '식탁 원목 종류가 어떻게 되나요?' },
      '초록별',
      '010-3456-7890',
      '2026-07-12',
      { t: 'badge', v: '답변완료', tone: 'success' },
      '박상담',
      { t: 'btns', v: ['보기'] },
    ],
    [
      { t: 'check' },
      { t: 'muted', v: 'Q-20260711-11' },
      { t: 'badge', v: '결제', tone: 'primary' },
      { t: 'link', v: '적립금이 결제에 반영되지 않았어요' },
      '밤하늘',
      '010-4567-8901',
      '2026-07-11',
      { t: 'badge', v: '보류', tone: 'warning' },
      '김운영',
      { t: 'btns', v: ['답변'] },
    ],
    [
      { t: 'check' },
      { t: 'muted', v: 'Q-20260710-02' },
      { t: 'badge', v: '시공', tone: 'success' },
      { t: 'link', v: '거실 조명 시공 견적 문의드립니다' },
      '나무늘보',
      '010-5678-9012',
      '2026-07-10',
      { t: 'badge', v: '답변완료', tone: 'success' },
      '이마케팅',
      { t: 'btns', v: ['보기'] },
    ],
  ]
  c.appendChild(table(ctx, INNER_W, cols, rows))
  c.appendChild(pagination(ctx, '전체 312건 · 5건 표시'))
  s.appendChild(c)
  return s
}

// ══ 9. 문의 상세 ═════════════════════════════════════════════════════
/** 폴백 — DS/DefinitionList 세트가 없을 때의 신청자 정보. */
function drawInquiryDefinitions(ctx: Ctx): FrameNode {
  const dl = vbox('dl', 0)
  fill(dl)
  dl.appendChild(defRow(ctx, '문의번호', 'Q-20260713-01', { muted: true }))
  dl.appendChild(defRow(ctx, '유형', '배송', { badge: ['배송', 'primary'] }))
  dl.appendChild(defRow(ctx, '연락처', '010-1234-5678'))
  dl.appendChild(defRow(ctx, '관련 주문', '20260713-0001'))
  dl.appendChild(defRow(ctx, '접수일', '2026-07-13 09:41'))
  const lastRow = defRow(ctx, '담당자', '미지정', { muted: true })
  lastRow.strokes = []
  dl.appendChild(lastRow)
  return dl
}
/** 폴백 — DS/StatusTimeline 세트가 없을 때의 처리 이력 목록. */
function drawInquiryLogs(ctx: Ctx): FrameNode {
  const wrap = vbox('Logs', 0)
  fill(wrap)
  const logs: Array<[string, string, string, Tone]> = [
    ['문의 접수', '민트초코 · 2026-07-13 09:41', '고객이 문의를 등록했습니다.', 'primary'],
    ['담당자 확인', '박상담 · 2026-07-13 10:02', '유형(배송) 기준 자동 분류 — 담당자가 확인했습니다.', 'secondary'],
  ]
  logs.forEach(([title, meta, desc, tone], i) => {
    const r = hbox('log', 12)
    fill(r)
    r.counterAxisAlignItems = 'MIN'
    pad(r, 12, 0)
    if (i < logs.length - 1) bottomLine(ctx, r)
    const dotWrap = fixed('dot', 'HORIZONTAL', 20, 20)
    dotWrap.primaryAxisAlignItems = 'CENTER'
    dotWrap.counterAxisAlignItems = 'CENTER'
    const dot = figma.createEllipse()
    dot.resize(8, 8)
    const v = ctx.vars.get(`color/${tone}`)
    dot.fills = [v ? boundPaint(v) : solid(TONE_HEX[tone])]
    dotWrap.appendChild(dot)
    r.appendChild(dotWrap)
    const col = vbox('c', 4)
    col.appendChild(tBody(ctx, title, true))
    col.appendChild(tMuted(ctx, meta, 12))
    col.appendChild(tSub(ctx, desc, 12))
    r.appendChild(grow(col))
    wrap.appendChild(r)
  })
  return wrap
}

function screenInquiryDetail(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '문의 상세')
  s.appendChild(
    pageHead(ctx, '문의 상세', 'Q-20260713-01 · 배송 문의 · 2026-07-13 접수', [
      btn(ctx, '목록', 'outline', '_Icon/List'),
      btn(ctx, '보류', 'outline', '_Icon/Clock'),
      btn(ctx, '답변 등록', 'primary', '_Icon/Send'),
    ]),
  )

  const body = hbox('Body', GAP)
  fill(body)
  body.counterAxisAlignItems = 'MIN'

  // 좌 — 신청자 정보
  const info = card(ctx, '신청자 정보', 16)
  info.counterAxisSizingMode = 'FIXED'
  info.resize(560, 100)
  info.layoutAlign = 'INHERIT'
  info.appendChild(cardHead(ctx, '신청자 정보', badge(ctx, '미답변', 'error')))
  const who = hbox('who', 12)
  fill(who)
  who.counterAxisAlignItems = 'CENTER'
  who.appendChild(avatar(ctx, 48, '민'))
  const wm = vbox('m', 4)
  wm.appendChild(boundText(ctx, '민트초코', 15, 'color/text', INK, true))
  wm.appendChild(tMuted(ctx, 'mint@example.com · VIP', 12))
  who.appendChild(grow(wm))
  who.appendChild(btn(ctx, '고객 상세', 'outline', undefined, 28))
  info.appendChild(who)

  // 신청자 정보 = DS/DefinitionList 인스턴스. 6행만 쓰므로 7행째는 'Show Row 7'로 끈다
  // → 행 프레임째 사라져 빈 자리·구분선이 남지 않는다(ON/OFF 규약).
  const dlInst = inst(ctx, 'DS/DefinitionList', {
    name: 'Inquiry Definition List',
    variant: { frame: 'flush' },
    props: {
      'Label 1': '문의번호',
      'Value 1': 'Q-20260713-01',
      'Label 2': '유형',
      'Value 2': '배송',
      'Label 3': '연락처',
      'Value 3': '010-1234-5678',
      'Label 4': '관련 주문',
      'Value 4': '20260713-0001',
      'Label 5': '접수일',
      'Value 5': '2026-07-13 09:41',
      'Label 6': '담당자',
      'Value 6': '미지정',
      'Show Row 7': false,
    },
  })
  info.appendChild(dlInst ? instFill(dlInst) : drawInquiryDefinitions(ctx))
  const att = vbox('att', 8)
  fill(att)
  att.appendChild(tSub(ctx, '첨부파일 2', 12))
  const attRow = hbox('files', 8)
  fill(attRow)
  for (const f of ['배송지_사진.jpg', '주문내역.pdf']) {
    const fr = hbox('file', 6)
    fr.counterAxisAlignItems = 'CENTER'
    pad(fr, 8, 10)
    fr.cornerRadius = R_CTRL
    bindFillVar(ctx, fr, 'color/bgSubtle', SURFACE)
    fr.appendChild(icon(ctx, '_Icon/Paperclip', 14))
    fr.appendChild(tSub(ctx, f, 12))
    attRow.appendChild(fr)
  }
  att.appendChild(attRow)
  info.appendChild(att)
  body.appendChild(info)

  // 우 — Q&A 응답
  const qa = vbox('QA', GAP)
  grow(qa)

  const q = card(ctx, '문의 내용', 12)
  q.appendChild(cardHead(ctx, '주문한 소파 배송일 변경 가능할까요?', tMuted(ctx, '2026-07-13 09:41', 12)))
  const qb = vbox('bubble', 8)
  fill(qb)
  pad(qb, 16)
  qb.cornerRadius = R_CTRL
  bindFillVar(ctx, qb, 'color/bgSubtle', SURFACE)
  const qtext = tBody(
    ctx,
    '안녕하세요. 7월 15일 배송 예정으로 안내받았는데, 이사 일정이 밀려서 7월 20일 이후로 변경하고 싶습니다.\n가능하다면 오전 시간대로 부탁드립니다. 추가 비용이 발생하는지도 알려주세요.',
  )
  qtext.textAutoResize = 'HEIGHT'
  qtext.layoutAlign = 'STRETCH'
  qb.appendChild(qtext)
  q.appendChild(qb)
  qa.appendChild(q)

  const a = card(ctx, '답변 작성', 12)
  a.appendChild(cardHead(ctx, '답변 작성', btn(ctx, '템플릿 불러오기', 'outline', '_Icon/BookOpen', 28)))
  const tmplRow = hbox('templates', 8)
  fill(tmplRow)
  for (const t of ['배송일 변경 안내', '교환/반품 안내', '재고 확인 중']) {
    const chip = hbox('chip', 0)
    chip.counterAxisAlignItems = 'CENTER'
    pad(chip, 6, 10)
    chip.cornerRadius = 999
    bindStrokeVar(ctx, chip, 'color/border', BORDER)
    chip.strokeWeight = 1
    chip.strokeAlign = 'INSIDE'
    chip.fills = []
    chip.appendChild(tSub(ctx, t, 12))
    tmplRow.appendChild(chip)
  }
  a.appendChild(tmplRow)
  a.appendChild(textarea(ctx, '고객에게 보낼 답변을 입력하세요.', 140))
  const aBar = hbox('bar', 8)
  fill(aBar)
  aBar.counterAxisAlignItems = 'CENTER'
  const abl = hbox('l', 8)
  abl.counterAxisAlignItems = 'CENTER'
  abl.appendChild(btn(ctx, '파일 첨부', 'outline', '_Icon/Paperclip', 32))
  abl.appendChild(tMuted(ctx, '이미지·PDF · 10MB 이하', 12))
  aBar.appendChild(grow(abl))
  aBar.appendChild(btn(ctx, '임시 저장', 'outline'))
  aBar.appendChild(btn(ctx, '답변 등록', 'primary', '_Icon/Send'))
  a.appendChild(aBar)
  qa.appendChild(a)

  // 처리 상태 = DS/StatusTimeline 인스턴스(vertical). 단계 라벨·시각은 TEXT 속성으로 덮어쓴다.
  const hist = card(ctx, '처리 상태', 12)
  hist.appendChild(cardHead(ctx, '처리 상태', undefined, '4단계'))
  const tl = inst(ctx, 'DS/StatusTimeline', {
    name: 'Status Timeline',
    variant: { direction: 'vertical' },
    props: {
      'Step 1': '문의 접수',
      'Step 1 Meta': '2026-07-13 09:41 · 민트초코',
      'Step 2': '담당자 확인',
      'Step 2 Meta': '2026-07-13 10:02 · 박상담',
      'Step 3': '답변 등록',
      'Step 3 Meta': '작성 중 · 미발송',
      'Step 4': '문의 종료',
      'Step 4 Meta': '-',
    },
  })
  hist.appendChild(tl ?? drawInquiryLogs(ctx))
  qa.appendChild(hist)

  body.appendChild(qa)
  s.appendChild(body)
  return s
}

// ══ 10. 포트폴리오 관리 ══════════════════════════════════════════════
function screenPortfolioList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '포트폴리오 관리')
  s.appendChild(
    pageHead(ctx, '포트폴리오 관리', '시공 사례를 순서대로 정렬하고 노출 여부를 관리합니다.', [
      btn(ctx, '순서 저장', 'outline', '_Icon/Save'),
      btn(ctx, '포트폴리오 등록', 'primary', '_Icon/Plus'),
    ]),
  )

  const c = flatCard(ctx, '포트폴리오 표')
  c.appendChild(
    toolbar(
      ctx,
      [
        input(ctx, '카테고리 전체', 170, { trailIcon: '_Icon/ChevronDown' }),
        input(ctx, '상태 전체', 150, { trailIcon: '_Icon/ChevronDown' }),
        input(ctx, '제목 검색', 300, { leadIcon: '_Icon/Search' }),
        input(ctx, '순번순', 150, { trailIcon: '_Icon/ChevronDown' }),
      ],
      [tMuted(ctx, '순번순일 때만 드래그 정렬', 12), iconBtn(ctx, '_Icon/Refresh')],
    ),
  )
  const cols: Col[] = [
    { label: '', w: 48, align: 'center' },
    { label: '순번', w: 80, align: 'center' },
    { label: '이미지', w: 90, align: 'center' },
    { label: '제목', w: 360, grow: true },
    { label: '카테고리', w: 150 },
    { label: '등록일', w: 120 },
    { label: '수정일', w: 120 },
    { label: '등록자', w: 110 },
    { label: '수정자', w: 110 },
    { label: '활성화', w: 100, align: 'center' },
    { label: '관리', w: 160, align: 'center' },
  ]
  const rows: Cell[][] = [
    [
      { t: 'drag' },
      { t: 'strong', v: '1' },
      { t: 'img' },
      { t: 'link', v: '한남동 60평 주방 리모델링' },
      { t: 'badge', v: '주방', tone: 'warning' },
      '2026-06-02',
      '2026-07-01',
      '이마케팅',
      '김운영',
      { t: 'toggle', on: true },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'drag' },
      { t: 'strong', v: '2' },
      { t: 'img' },
      { t: 'link', v: '판교 아파트 거실 조명 시공' },
      { t: 'badge', v: '조명', tone: 'primary' },
      '2026-05-19',
      '2026-06-24',
      '이마케팅',
      '이마케팅',
      { t: 'toggle', on: true },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'drag' },
      { t: 'strong', v: '3' },
      { t: 'img' },
      { t: 'link', v: '성수 카페 원목 가구 납품' },
      { t: 'badge', v: '가구', tone: 'success' },
      '2026-04-30',
      '—',
      '김운영',
      '—',
      { t: 'toggle', on: false },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'drag' },
      { t: 'strong', v: '4' },
      { t: 'img' },
      { t: 'link', v: '제주 스테이 패브릭 스타일링' },
      { t: 'badge', v: '패브릭', tone: 'secondary' },
      '2026-03-11',
      '2026-05-02',
      '박상담',
      '이마케팅',
      { t: 'toggle', on: true },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'drag' },
      { t: 'strong', v: '5' },
      { t: 'img' },
      { t: 'link', v: '연남동 소형 오피스 전체 시공' },
      { t: 'badge', v: '시공', tone: 'error' },
      '2026-02-08',
      '2026-04-17',
      '최개발',
      '김운영',
      { t: 'toggle', on: false },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
  ]
  c.appendChild(table(ctx, INNER_W, cols, rows))
  c.appendChild(pagination(ctx, '전체 42건 · 5건 표시'))
  s.appendChild(c)
  return s
}

// ══ 11. 포트폴리오 등록 ══════════════════════════════════════════════
/** 폴백 — DS/DropZone 세트가 없을 때의 업로드 영역. */
function drawDropZone(ctx: Ctx): FrameNode {
  const drop = vbox('DropZone', 8)
  grow(drop)
  drop.counterAxisSizingMode = 'FIXED'
  drop.primaryAxisSizingMode = 'FIXED'
  drop.resize(drop.width, 180)
  drop.primaryAxisAlignItems = 'CENTER'
  drop.counterAxisAlignItems = 'CENTER'
  drop.cornerRadius = R_CARD
  bindFillVar(ctx, drop, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, drop, 'color/border', BORDER)
  drop.strokeWeight = 1
  drop.strokeAlign = 'INSIDE'
  drop.dashPattern = [6, 4]
  drop.appendChild(icon(ctx, '_Icon/Upload', 28, 'color/primary', ACCENT))
  drop.appendChild(tBody(ctx, '이미지를 끌어다 놓거나 클릭해 업로드', true))
  drop.appendChild(tMuted(ctx, '대표 이미지 1장 + 상세 이미지 최대 10장', 12))
  drop.appendChild(btn(ctx, '파일 선택', 'outline', '_Icon/FolderOpen', 32))
  return drop
}

function screenPortfolioForm(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '포트폴리오 등록')
  s.appendChild(
    pageHead(ctx, '포트폴리오 등록', '시공 사례의 기본 정보·대표 이미지·상세 내용을 등록합니다.', [
      btn(ctx, '취소', 'outline'),
      btn(ctx, '임시 저장', 'outline', '_Icon/Save'),
      btn(ctx, '등록', 'primary', '_Icon/Check'),
    ]),
  )

  // 기본 정보 — 2열 폼
  const basic = card(ctx, '기본 정보', 16)
  basic.appendChild(cardHead(ctx, '기본 정보', tMuted(ctx, '* 필수 항목', 12)))
  const grid = hbox('grid', 32)
  fill(grid)
  grid.counterAxisAlignItems = 'MIN'
  const gl = vbox('col', 14)
  grow(gl)
  gl.appendChild(fieldRow(ctx, '제목', input(ctx, '예) 한남동 60평 주방 리모델링', 0), true))
  gl.appendChild(fieldRow(ctx, '카테고리', input(ctx, '카테고리 선택', 0, { trailIcon: '_Icon/ChevronDown' }), true))
  gl.appendChild(fieldRow(ctx, '노출 순번', input(ctx, '1', 0), false))
  grid.appendChild(gl)
  const gr = vbox('col', 14)
  grow(gr)
  gr.appendChild(fieldRow(ctx, '외부 링크', input(ctx, 'https://', 0, { leadIcon: '_Icon/Link' })))
  gr.appendChild(fieldRow(ctx, '시공일', input(ctx, '2026-07-13', 0, { trailIcon: '_Icon/Calendar' })))
  const actRow = hbox('t', 10)
  actRow.counterAxisAlignItems = 'CENTER'
  actRow.counterAxisSizingMode = 'FIXED'
  actRow.resize(actRow.width, CTRL_H)
  actRow.appendChild(toggleMini(ctx, true))
  actRow.appendChild(tSub(ctx, '목록에 노출합니다'))
  gr.appendChild(fieldRow(ctx, '활성화', actRow))
  grid.appendChild(gr)
  basic.appendChild(grid)
  s.appendChild(basic)

  // 대표 이미지
  const media = card(ctx, '대표 이미지', 16)
  media.appendChild(cardHead(ctx, '대표 이미지', tMuted(ctx, 'JPG·PNG · 5MB 이하 · 권장 1200×800', 12)))
  const mrow = hbox('mrow', 16)
  fill(mrow)
  mrow.counterAxisAlignItems = 'MIN'
  // 드롭존 = DS/DropZone 인스턴스(문구·힌트·버튼 라벨이 TEXT 속성).
  const dz = inst(ctx, 'DS/DropZone', {
    name: 'Image DropZone',
    variant: { state: 'idle' },
    props: {
      label: '이미지를 끌어다 놓거나 클릭해 업로드',
      hint: '대표 이미지 1장 + 상세 이미지 최대 10장',
      // 'Action' TEXT는 제거됐다(React에 짝 없음). 넘기던 값이 옛 기본값과 같아 그림은 그대로다.
    },
  })
  mrow.appendChild(dz ? instGrow(dz) : drawDropZone(ctx))
  // 미리보기 4장
  const previews = hbox('Previews', 12)
  previews.counterAxisAlignItems = 'MIN'
  for (let i = 0; i < 4; i++) {
    const p = vbox('p', 6)
    const th = thumbBox(ctx, 180, 120, R_CTRL)
    if (i === 0) {
      bindStrokeVar(ctx, th, 'color/primary', ACCENT)
      th.strokeWeight = 2
      th.strokeAlign = 'INSIDE'
    }
    p.appendChild(th)
    p.appendChild(i === 0 ? badge(ctx, '대표', 'primary') : tMuted(ctx, '상세 ' + i, 12))
    previews.appendChild(p)
  }
  mrow.appendChild(previews)
  media.appendChild(mrow)
  s.appendChild(media)

  // 에디터
  const editor = flatCard(ctx, '상세 내용')
  const eh = hbox('head', 8)
  fill(eh)
  eh.counterAxisAlignItems = 'CENTER'
  pad(eh, 16, 20)
  bottomLine(ctx, eh)
  const eht = hbox('t', 0)
  eht.appendChild(boundText(ctx, '상세 내용', 15, 'color/text', INK, true))
  eh.appendChild(grow(eht))
  eh.appendChild(tMuted(ctx, '0 / 5,000자', 12))
  editor.appendChild(eh)

  const tb = hbox('Editor Toolbar', 4)
  fill(tb)
  tb.counterAxisAlignItems = 'CENTER'
  pad(tb, 8, 12)
  bindFillVar(ctx, tb, 'color/bgSubtle', SURFACE)
  bottomLine(ctx, tb)
  const tools = [
    '_Icon/Type',
    '_Icon/Bold',
    '_Icon/Italic',
    '_Icon/Underline',
    '_Icon/Strikethrough',
    '_Icon/AlignLeft',
    '_Icon/AlignCenter',
    '_Icon/AlignRight',
    '_Icon/ListOrdered',
    '_Icon/List',
    '_Icon/Quote',
    '_Icon/Link2',
    '_Icon/Image',
    '_Icon/Table',
    '_Icon/Code',
    '_Icon/Undo',
    '_Icon/Redo',
  ]
  tools.forEach((t, i) => {
    if (i === 5 || i === 9 || i === 15) {
      const divider = figma.createRectangle()
      divider.resize(1, 18)
      const v = ctx.vars.get('color/border')
      divider.fills = [v ? boundPaint(v) : solid(BORDER)]
      tb.appendChild(divider)
    }
    const b = fixed('tool', 'HORIZONTAL', 30, 30)
    b.primaryAxisAlignItems = 'CENTER'
    b.counterAxisAlignItems = 'CENTER'
    b.cornerRadius = 6
    b.fills = []
    b.appendChild(icon(ctx, t, 16))
    tb.appendChild(b)
  })
  editor.appendChild(tb)

  const canvas = vbox('Editor Canvas', 12)
  fill(canvas)
  canvas.primaryAxisSizingMode = 'FIXED'
  canvas.resize(canvas.width, 300)
  pad(canvas, 20)
  bindFillVar(ctx, canvas, 'color/bg', WHITE)
  canvas.appendChild(boundText(ctx, '시공 개요', 16, 'color/text', INK, true))
  const p1 = tSub(ctx, '한남동 60평 주방 전체 리모델링 사례입니다. 아일랜드 상판은 세라믹으로, 하부장은 무광 도장으로 마감했습니다.')
  p1.textAutoResize = 'HEIGHT'
  p1.layoutAlign = 'STRETCH'
  canvas.appendChild(p1)
  const imgRow = hbox('images', 12)
  fill(imgRow)
  imgRow.appendChild(thumbBox(ctx, 260, 150, R_CTRL))
  imgRow.appendChild(thumbBox(ctx, 260, 150, R_CTRL))
  canvas.appendChild(imgRow)
  canvas.appendChild(tMuted(ctx, '본문을 입력하세요…'))
  editor.appendChild(canvas)
  s.appendChild(editor)

  // 하단 액션
  const footer = hbox('Footer', 8)
  fill(footer)
  footer.counterAxisAlignItems = 'CENTER'
  footer.primaryAxisAlignItems = 'CENTER'
  pad(footer, 16, 20)
  bindFillVar(ctx, footer, 'color/bg', WHITE)
  outline(ctx, footer)
  footer.appendChild(btn(ctx, '취소', 'outline'))
  footer.appendChild(btn(ctx, '등록', 'primary', '_Icon/Check'))
  s.appendChild(footer)
  return s
}

// ══ 12. 상품 등록 ════════════════════════════════════════════════════
function screenProductForm(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '상품 등록')
  s.appendChild(
    pageHead(ctx, '상품 등록', '기본 정보부터 노출 설정까지 입력하고 모바일 화면으로 미리 확인합니다.', [
      btn(ctx, '취소', 'outline'),
      btn(ctx, '임시 저장', 'outline', '_Icon/Save'),
      btn(ctx, '등록', 'primary', '_Icon/Check'),
    ]),
  )

  const body = hbox('Body', GAP)
  fill(body)
  body.counterAxisAlignItems = 'MIN'

  // 좌 — 앵커 네비
  // 조사 기록(2026-07): DS/FormAnchorNav(admin.ts) 인스턴스로 바꾸지 않았다. 그 세트는 섹션 5개
  // ('기본 정보'·'이미지'·'옵션'·'배송·반품'·'노출·기간', admin.ts FAN_SECTIONS)가 렌더 함수에 고정
  // 상수로 박혀 있고 아이콘도 없다. 이 화면은 실제 7개 섹션(기본 정보·판매 정보·옵션·재고·이미지·
  // 상세 설명·배송 정보·노출 설정)에 아이콘(_Icon/Info 등)·완료 체크·진행률 바까지 그린다. 섹션
  // 라벨이 TEXT 속성으로 열려 있지 않아(activeKey처럼 "화면에 원래 안 보이는" 축이 아니라 실제로
  // 보이는 문구다) 세트를 그대로 쓰면 7개 진짜 섹션이 5개 가짜 섹션으로 바뀐다 — 직접 그린다.
  const nav = vbox('Anchor Nav', 2)
  nav.counterAxisSizingMode = 'FIXED'
  nav.resize(PANEL_W, 100)
  fillH(nav)
  pad(nav, 16)
  bindFillVar(ctx, nav, 'color/bg', WHITE)
  outline(ctx, nav)
  const navHead = hbox('h', 0)
  fill(navHead)
  pad(navHead, 4, 10)
  navHead.appendChild(boundText(ctx, '작성 항목', 14, 'color/text', INK, true))
  nav.appendChild(navHead)
  const anchors: Array<[string, string, boolean, boolean]> = [
    ['기본 정보', '_Icon/Info', true, true],
    ['판매 정보', '_Icon/Coins', false, true],
    ['옵션 · 재고', '_Icon/Layers', false, false],
    ['이미지', '_Icon/Image', false, false],
    ['상세 설명', '_Icon/Type', false, false],
    ['배송 정보', '_Icon/Truck', false, false],
    ['노출 설정', '_Icon/Eye', false, false],
  ]
  for (const [label, iconKey, active, done] of anchors) {
    const it = hbox('Anchor / ' + label, 8)
    fill(it)
    it.counterAxisAlignItems = 'CENTER'
    pad(it, 10, 10)
    it.cornerRadius = R_CTRL
    if (active) bindFillVar(ctx, it, 'color/primary/100', tintHex(ACCENT))
    else it.fills = []
    it.appendChild(
      active ? icon(ctx, iconKey, 16, 'color/primary', ACCENT) : icon(ctx, iconKey, 16),
    )
    const lt = hbox('l', 0)
    lt.counterAxisAlignItems = 'CENTER'
    lt.appendChild(
      active
        ? boundText(ctx, label, F_BODY, 'color/primary', ACCENT, true)
        : boundText(ctx, label, F_BODY, 'color/text', INK),
    )
    it.appendChild(grow(lt))
    if (done) it.appendChild(icon(ctx, '_Icon/CircleCheck', 14, 'color/success', TONE_HEX.success))
    nav.appendChild(it)
  }
  const navFoot = vbox('foot', 8)
  fill(navFoot)
  navFoot.paddingTop = 12
  const prog = fixed('Progress', 'HORIZONTAL', PANEL_W - 32, 6)
  prog.cornerRadius = 999
  bindFillVar(ctx, prog, 'color/bgSubtle', SURFACE)
  const bar = fixed('bar', 'HORIZONTAL', Math.round((PANEL_W - 32) * 0.42), 6)
  bar.cornerRadius = 999
  bindFillVar(ctx, bar, 'color/primary', ACCENT)
  prog.appendChild(bar)
  navFoot.appendChild(prog)
  navFoot.appendChild(tMuted(ctx, '작성률 42% · 3/7 완료', 12))
  nav.appendChild(navFoot)
  body.appendChild(nav)

  // 중앙 — 폼 섹션
  const form = vbox('Form', GAP)
  grow(form)

  const c1 = card(ctx, '기본 정보', 14)
  c1.appendChild(cardHead(ctx, '기본 정보', tMuted(ctx, '* 필수 항목', 12)))
  c1.appendChild(fieldRow(ctx, '상품명', input(ctx, '예) 모듈형 3인용 소파', 0), true))
  const catRow = hbox('cats', 8)
  catRow.counterAxisAlignItems = 'CENTER'
  catRow.appendChild(input(ctx, '대분류', 180, { trailIcon: '_Icon/ChevronDown', value: '가구' }))
  catRow.appendChild(input(ctx, '중분류', 180, { trailIcon: '_Icon/ChevronDown', value: '소파' }))
  catRow.appendChild(input(ctx, '소분류', 180, { trailIcon: '_Icon/ChevronDown' }))
  c1.appendChild(fieldRow(ctx, '카테고리', catRow, true))
  c1.appendChild(fieldRow(ctx, '상품번호', input(ctx, '자동 생성', 0, { value: 'P-100483' })))
  const tagInput = hbox('tags', 6)
  tagInput.counterAxisAlignItems = 'CENTER'
  tagInput.counterAxisSizingMode = 'FIXED'
  tagInput.resize(tagInput.width, CTRL_H)
  tagInput.appendChild(badge(ctx, '신상', 'primary'))
  tagInput.appendChild(badge(ctx, 'BEST', 'warning'))
  tagInput.appendChild(btn(ctx, '태그 추가', 'outline', '_Icon/Plus', 28))
  c1.appendChild(fieldRow(ctx, '태그', tagInput))
  form.appendChild(c1)

  const c2 = card(ctx, '판매 정보', 14)
  c2.appendChild(cardHead(ctx, '판매 정보'))
  const priceRow = hbox('price', 8)
  priceRow.counterAxisAlignItems = 'CENTER'
  priceRow.appendChild(input(ctx, '0', 200, { value: '1,290,000', trailIcon: '_Icon/Dollar' }))
  priceRow.appendChild(tMuted(ctx, '원'))
  c2.appendChild(fieldRow(ctx, '판매가', priceRow, true))
  const saleRow = hbox('sale', 8)
  saleRow.counterAxisAlignItems = 'CENTER'
  saleRow.appendChild(input(ctx, '0', 200, { value: '1,090,000' }))
  saleRow.appendChild(badge(ctx, '15% 할인', 'error'))
  c2.appendChild(fieldRow(ctx, '할인가', saleRow))
  const stockRow = hbox('stock', 8)
  stockRow.counterAxisAlignItems = 'CENTER'
  stockRow.appendChild(input(ctx, '0', 140, { value: '32' }))
  stockRow.appendChild(tMuted(ctx, '개 · 10개 이하면 재고 부족으로 표시됩니다', 12))
  c2.appendChild(fieldRow(ctx, '재고', stockRow, true))
  form.appendChild(c2)

  const c3 = card(ctx, '이미지 · 상세 설명', 14)
  c3.appendChild(cardHead(ctx, '이미지 · 상세 설명', btn(ctx, '이미지 추가', 'outline', '_Icon/Upload', 28)))
  const imgs = hbox('imgs', 12)
  fill(imgs)
  for (let i = 0; i < 5; i++) {
    const th = thumbBox(ctx, 120, 120, R_CTRL)
    if (i === 0) {
      bindStrokeVar(ctx, th, 'color/primary', ACCENT)
      th.strokeWeight = 2
      th.strokeAlign = 'INSIDE'
    }
    imgs.appendChild(th)
  }
  const addImg = fixed('Add', 'VERTICAL', 120, 120)
  addImg.primaryAxisAlignItems = 'CENTER'
  addImg.counterAxisAlignItems = 'CENTER'
  addImg.itemSpacing = 6
  addImg.cornerRadius = R_CTRL
  bindFillVar(ctx, addImg, 'color/bg', WHITE)
  bindStrokeVar(ctx, addImg, 'color/border', BORDER)
  addImg.strokeWeight = 1
  addImg.strokeAlign = 'INSIDE'
  addImg.dashPattern = [6, 4]
  addImg.appendChild(icon(ctx, '_Icon/Plus', 20))
  addImg.appendChild(tMuted(ctx, '추가', 12))
  imgs.appendChild(addImg)
  c3.appendChild(imgs)
  c3.appendChild(textarea(ctx, '상세 설명을 입력하세요. (에디터 · 이미지 삽입 지원)', 140))
  form.appendChild(c3)

  const c4 = card(ctx, '노출 설정', 14)
  c4.appendChild(cardHead(ctx, '배송 · 노출 설정'))
  const shipRow = hbox('ship', 8)
  shipRow.counterAxisAlignItems = 'CENTER'
  shipRow.appendChild(input(ctx, '배송비', 180, { value: '무료배송', trailIcon: '_Icon/ChevronDown' }))
  shipRow.appendChild(input(ctx, '출고일', 180, { value: '결제일 +2일', trailIcon: '_Icon/ChevronDown' }))
  c4.appendChild(fieldRow(ctx, '배송', shipRow))
  const expoRow = hbox('expo', 10)
  expoRow.counterAxisAlignItems = 'CENTER'
  expoRow.counterAxisSizingMode = 'FIXED'
  expoRow.resize(expoRow.width, CTRL_H)
  expoRow.appendChild(toggleMini(ctx, true))
  expoRow.appendChild(tSub(ctx, '판매중으로 즉시 노출'))
  expoRow.appendChild(badge(ctx, '판매중', 'success'))
  c4.appendChild(fieldRow(ctx, '판매 상태', expoRow))
  c4.appendChild(fieldRow(ctx, '기획전', input(ctx, '기획전 선택', 0, { trailIcon: '_Icon/ChevronDown', value: '봄맞이 기획전' })))
  form.appendChild(c4)
  body.appendChild(form)

  // 우 — 모바일 미리보기 320
  const side = vbox('Preview', 12)
  side.counterAxisSizingMode = 'FIXED'
  side.resize(320, 100)
  const ph = hbox('h', 8)
  fill(ph)
  ph.counterAxisAlignItems = 'CENTER'
  const pht = hbox('t', 0)
  pht.appendChild(boundText(ctx, '모바일 미리보기', 14, 'color/text', INK, true))
  ph.appendChild(grow(pht))
  ph.appendChild(iconBtn(ctx, '_Icon/Refresh', 28))
  side.appendChild(ph)

  const phone = vbox('Mobile', 0)
  fill(phone)
  phone.clipsContent = true
  phone.cornerRadius = 20
  bindFillVar(ctx, phone, 'color/bg', WHITE)
  outline(ctx, phone, 20)
  // 상태바
  const statusBar = hbox('Status Bar', 8)
  fill(statusBar)
  statusBar.counterAxisAlignItems = 'CENTER'
  pad(statusBar, 10, 16)
  bindFillVar(ctx, statusBar, 'color/bgSubtle', SURFACE)
  statusBar.appendChild(tMuted(ctx, '9:41', 11))
  const sbSp = hbox('sp', 0)
  statusBar.appendChild(grow(sbSp))
  statusBar.appendChild(icon(ctx, '_Icon/Wifi', 12))
  statusBar.appendChild(icon(ctx, '_Icon/Battery', 12))
  phone.appendChild(statusBar)
  // 앱바
  const appBar = hbox('App Bar', 8)
  fill(appBar)
  appBar.counterAxisAlignItems = 'CENTER'
  pad(appBar, 10, 12)
  bottomLine(ctx, appBar)
  appBar.appendChild(icon(ctx, '_Icon/ChevronLeft', 18, 'color/text', INK))
  const abt = hbox('t', 0)
  abt.primaryAxisAlignItems = 'CENTER'
  abt.appendChild(boundText(ctx, '상품 상세', F_BODY, 'color/text', INK, true))
  appBar.appendChild(grow(abt))
  appBar.appendChild(icon(ctx, '_Icon/Cart', 18, 'color/text', INK))
  phone.appendChild(appBar)
  // 히어로
  const hero = thumbBox(ctx, 320, 220, 0)
  hero.layoutAlign = 'STRETCH'
  phone.appendChild(hero)
  // 내용
  const pc = vbox('Content', 10)
  fill(pc)
  pad(pc, 16)
  const badges = hbox('b', 6)
  badges.appendChild(badge(ctx, '신상', 'primary'))
  badges.appendChild(badge(ctx, 'BEST', 'warning'))
  pc.appendChild(badges)
  const title = boundText(ctx, '모듈형 3인용 소파', 16, 'color/text', INK, true)
  title.textAutoResize = 'HEIGHT'
  title.layoutAlign = 'STRETCH'
  pc.appendChild(title)
  const priceLine = hbox('price', 8)
  fill(priceLine)
  priceLine.counterAxisAlignItems = 'CENTER'
  priceLine.appendChild(boundText(ctx, '15%', 16, 'color/error', TONE_HEX.error, true))
  priceLine.appendChild(boundText(ctx, '1,090,000원', 18, 'color/text', INK, true))
  const old = tMuted(ctx, '1,290,000원', 12)
  old.textDecoration = 'STRIKETHROUGH'
  priceLine.appendChild(old)
  pc.appendChild(priceLine)
  const shipLine = hbox('ship', 6)
  shipLine.counterAxisAlignItems = 'CENTER'
  shipLine.appendChild(icon(ctx, '_Icon/Truck', 14, 'color/success', TONE_HEX.success))
  shipLine.appendChild(tSub(ctx, '무료배송 · 결제일 +2일 출고', 12))
  pc.appendChild(shipLine)
  const divider2 = figma.createRectangle()
  divider2.resize(288, 1)
  const bv = ctx.vars.get('color/border')
  divider2.fills = [bv ? boundPaint(bv) : solid(BORDER)]
  divider2.layoutAlign = 'STRETCH'
  pc.appendChild(divider2)
  const optBtn = input(ctx, '옵션을 선택하세요', 0, { trailIcon: '_Icon/ChevronDown', h: 40 })
  pc.appendChild(fill(optBtn))
  const cta = hbox('CTA', 8)
  fill(cta)
  const wish = fixed('Wish', 'HORIZONTAL', 48, 44)
  wish.primaryAxisAlignItems = 'CENTER'
  wish.counterAxisAlignItems = 'CENTER'
  wish.cornerRadius = R_CTRL
  bindFillVar(ctx, wish, 'color/bg', WHITE)
  bindStrokeVar(ctx, wish, 'color/border', BORDER)
  wish.strokeWeight = 1
  wish.strokeAlign = 'INSIDE'
  wish.appendChild(icon(ctx, '_Icon/Heart', 18))
  cta.appendChild(wish)
  const buy = btn(ctx, '구매하기', 'primary', '_Icon/Cart', 44)
  cta.appendChild(grow(buy))
  buy.primaryAxisAlignItems = 'CENTER'
  pc.appendChild(cta)
  phone.appendChild(pc)
  side.appendChild(phone)
  side.appendChild(tMuted(ctx, '실제 앱 화면과 폰트·간격이 다를 수 있습니다.', 11))
  body.appendChild(side)

  s.appendChild(body)
  return s
}

// ══ 13. 회사소개 관리 ════════════════════════════════════════════════
// 스토리북 src/ds/CompanyForm(AdminFormPage 프리셋)의 골격 그대로 옮긴다:
//   헤더(타이틀 · 강조색 배지 · 저장) → 섹션 카드 7장 → sticky 액션 바([취소][저장]).
// 섹션 번호·문구·필드 구성은 CompanyForm의 SECTION_COPY / *Fields 선언과 1:1이다.
function screenCompanyForm(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '회사소개 관리')
  s.appendChild(
    pageHead(ctx, '회사소개 관리', '고객용 회사소개 페이지에 그대로 노출되는 내용입니다.', [
      // 헤더 배지 = 현재 강조색(저장 즉시 고객 화면 톤이 바뀌므로 계속 보여 준다)
      badge(ctx, '강조색 그린', 'success'),
      btn(ctx, '미리보기', 'outline', '_Icon/Eye'),
      btn(ctx, '저장', 'primary', '_Icon/Save'),
    ]),
  )

  // 1. 기본 정보 — 히어로 카피
  const c1 = card(ctx, '기본 정보', 14)
  c1.appendChild(cardHead(ctx, '1. 기본 정보', tMuted(ctx, '* 필수 항목', 12)))
  c1.appendChild(fieldRow(ctx, '상단 라벨', input(ctx, '예) About us', 0)))
  c1.appendChild(fieldRow(ctx, '헤드라인', input(ctx, '예) We design sound for space.', 0), true))
  c1.appendChild(fieldRow(ctx, '서브카피', textarea(ctx, '헤드라인 아래에 놓이는 한글 카피를 입력하세요.', 72), true))
  s.appendChild(c1)

  // 2. 히어로 이미지 — 썸네일(16:9) + 드롭존을 한 줄에(교체가 잦은 자리, CompanyForm layout:'row')
  const c2 = card(ctx, '히어로 이미지', 14)
  c2.appendChild(cardHead(ctx, '2. 히어로 이미지', tMuted(ctx, 'JPG · PNG 이미지 · 최대 10MB', 12)))
  const heroRow = hbox('hero', 16)
  fill(heroRow)
  heroRow.counterAxisAlignItems = 'MIN'
  heroRow.appendChild(thumbBox(ctx, 240, 135, R_CTRL))
  const heroDrop = inst(ctx, 'DS/DropZone', {
    name: 'Hero DropZone',
    variant: { state: 'idle' },
    props: {
      label: '이미지를 끌어다 놓거나 클릭해서 선택하세요',
      hint: 'JPG · PNG 이미지 · 최대 10MB',
      // 'Action' TEXT는 제거됐다(React에 짝 없음). 넘기던 값이 옛 기본값과 같아 그림은 그대로다.
    },
  })
  heroRow.appendChild(heroDrop ? instGrow(heroDrop) : drawDropZone(ctx))
  c2.appendChild(heroRow)
  c2.appendChild(fieldRow(ctx, '대체 텍스트', input(ctx, '예) 스튜디오 전경', 0)))
  s.appendChild(c2)

  // 3. 소개 본문 — 문단(빈 줄 = 문단 경계) + 본문 이미지(4:3)
  const c3 = card(ctx, '소개 본문', 14)
  c3.appendChild(cardHead(ctx, '3. 소개 본문', tMuted(ctx, '빈 줄(엔터 2번)로 문단을 나눕니다.', 12)))
  const introTop = hbox('intro top', 16)
  fill(introTop)
  introTop.appendChild(grow(fieldRow(ctx, '헤드라인', input(ctx, '예) Who we are', 0), true)))
  introTop.appendChild(grow(fieldRow(ctx, '서브카피', input(ctx, '헤드라인 아래 한 줄 설명', 0), false, 90)))
  c3.appendChild(introTop)
  c3.appendChild(fieldRow(ctx, '소개 문단', textarea(ctx, '미션·비전을 2~3개 문단으로 입력하세요.', 160), true))
  const introImg = hbox('intro image', 16)
  fill(introImg)
  introImg.counterAxisAlignItems = 'MIN'
  introImg.appendChild(thumbBox(ctx, 200, 150, R_CTRL))
  const introDrop = inst(ctx, 'DS/DropZone', {
    name: 'Intro DropZone',
    variant: { state: 'idle' },
    props: {
      label: '이미지를 끌어다 놓거나 클릭해서 선택하세요',
      hint: 'JPG · PNG 이미지 · 최대 10MB',
      // 'Action' TEXT는 제거됐다(React에 짝 없음). 넘기던 값이 옛 기본값과 같아 그림은 그대로다.
    },
  })
  introImg.appendChild(introDrop ? instGrow(introDrop) : drawDropZone(ctx))
  c3.appendChild(introImg)
  c3.appendChild(fieldRow(ctx, '대체 텍스트', input(ctx, '예) 작업 중인 팀', 0)))
  s.appendChild(c3)

  /** 반복 항목 한 칸 — 라벨 위 · 컨트롤 아래(CompanyForm의 FieldRow span=1 3열 그리드와 같은 배치). */
  const cell3 = (label: string, control: FrameNode, stretch = true): FrameNode => {
    const col = vbox('Field / ' + label, 6)
    grow(col)
    col.appendChild(tSub(ctx, label, 12))
    col.appendChild(stretch ? fill(control) : control)
    return col
  }

  // 4. 핵심 역량 — 섹션 카피 + 카드 목록([제목][설명][삭제] 한 줄)
  const c4 = card(ctx, '핵심 역량', 14)
  c4.appendChild(cardHead(ctx, '4. 핵심 역량', btn(ctx, '역량 카드 추가', 'outline', '_Icon/Plus', 32)))
  const capCopy = hbox('cap copy', 16)
  fill(capCopy)
  capCopy.appendChild(grow(fieldRow(ctx, '섹션 헤드라인', input(ctx, '예) What we do', 0))))
  capCopy.appendChild(grow(fieldRow(ctx, '섹션 서브카피', input(ctx, '섹션 헤드라인 아래 한 줄 설명', 0), false, 100)))
  c4.appendChild(capCopy)
  ;[
    ['음향 설계', '공간의 용도에 맞춰 잔향과 소음을 계산해 설계합니다.'],
    ['시공 · 감리', '자재 반입부터 마감까지 현장을 직접 관리합니다.'],
    ['사후 관리', '준공 후 6개월간 정기 점검을 제공합니다.'],
  ].forEach(([title, desc], i) => {
    const row = hbox('Capability ' + (i + 1), 16)
    fill(row)
    row.counterAxisAlignItems = 'MAX'
    row.appendChild(cell3(`역량 ${i + 1} 제목`, input(ctx, '예) 음향 설계', 0, { value: title })))
    row.appendChild(cell3('설명', textarea(ctx, desc, 64)))
    row.appendChild(cell3('관리', btn(ctx, '삭제', 'danger', '_Icon/Trash2'), false))
    c4.appendChild(row)
  })
  s.appendChild(c4)

  // 5. 숫자 성과 — [숫자][라벨][삭제]
  const c5 = card(ctx, '숫자 성과', 14)
  c5.appendChild(cardHead(ctx, '5. 숫자 성과', btn(ctx, '통계 항목 추가', 'outline', '_Icon/Plus', 32)))
  const statCopy = hbox('stat copy', 16)
  fill(statCopy)
  statCopy.appendChild(grow(fieldRow(ctx, '섹션 헤드라인', input(ctx, '예) By the numbers', 0))))
  statCopy.appendChild(grow(fieldRow(ctx, '섹션 서브카피', input(ctx, '섹션 헤드라인 아래 한 줄 설명', 0), false, 100)))
  c5.appendChild(statCopy)
  ;[
    ['120+', '완료 프로젝트'],
    ['15년', '업력'],
  ].forEach(([value, label], i) => {
    const row = hbox('Stat ' + (i + 1), 16)
    fill(row)
    row.counterAxisAlignItems = 'MAX'
    row.appendChild(cell3(`통계 ${i + 1} 숫자`, input(ctx, '예) 120+', 0, { value })))
    row.appendChild(cell3('라벨', input(ctx, '예) 완료 프로젝트', 0, { value: label })))
    row.appendChild(cell3('관리', btn(ctx, '삭제', 'danger', '_Icon/Trash2'), false))
    c5.appendChild(row)
  })
  s.appendChild(c5)

  // 6. CTA 밴드 — 헤더의 토글이 '데이터 스위치'(value.ctaEnabled). 끄면 고객 화면에서 밴드가 사라진다.
  const c6 = card(ctx, 'CTA 밴드', 14)
  const ctaSwitch = hbox('switch', 8)
  ctaSwitch.counterAxisAlignItems = 'CENTER'
  ctaSwitch.appendChild(tSub(ctx, 'CTA 밴드 사용', 12))
  ctaSwitch.appendChild(toggleMini(ctx, true))
  c6.appendChild(cardHead(ctx, '6. CTA 밴드', ctaSwitch))
  const ctaRow = hbox('cta', 16)
  fill(ctaRow)
  ctaRow.appendChild(grow(fieldRow(ctx, '밴드 제목', input(ctx, "예) Let's build it together.", 0), true)))
  ctaRow.appendChild(grow(fieldRow(ctx, '밴드 설명', input(ctx, '문의를 유도하는 한 줄 설명', 0), false, 90)))
  c6.appendChild(ctaRow)
  c6.appendChild(fieldRow(ctx, '버튼 문구', input(ctx, '예) 프로젝트 문의하기', 0), true))
  s.appendChild(c6)

  // 7. 노출 설정 — 강조색 · 구분선 · 히어로 스크림
  const c7 = card(ctx, '노출 설정', 14)
  c7.appendChild(cardHead(ctx, '7. 노출 설정', tMuted(ctx, '저장 즉시 고객 화면에 반영됩니다.', 12)))
  const visRow = hbox('visibility', 16)
  fill(visRow)
  visRow.counterAxisAlignItems = 'MAX'
  visRow.appendChild(
    cell3('강조색', input(ctx, '강조색을 선택하세요', 0, { value: '그린(기본)', trailIcon: '_Icon/ChevronDown' })),
  )
  const dividerSw = hbox('divider switch', 10)
  dividerSw.counterAxisSizingMode = 'FIXED'
  dividerSw.resize(dividerSw.width, CTRL_H)
  dividerSw.counterAxisAlignItems = 'CENTER'
  dividerSw.appendChild(toggleMini(ctx, true))
  dividerSw.appendChild(tSub(ctx, '섹션 헤딩 아래 구분선', 12))
  visRow.appendChild(cell3('섹션 구분선', dividerSw, false))
  const scrimSw = hbox('scrim switch', 10)
  scrimSw.counterAxisSizingMode = 'FIXED'
  scrimSw.resize(scrimSw.width, CTRL_H)
  scrimSw.counterAxisAlignItems = 'CENTER'
  scrimSw.appendChild(toggleMini(ctx, false))
  scrimSw.appendChild(tSub(ctx, '배경 사진 위 흰 스크림', 12))
  visRow.appendChild(cell3('히어로 스크림', scrimSw, false))
  c7.appendChild(visRow)
  s.appendChild(c7)

  // sticky 액션 바 — 스크롤과 무관하게 항상 바닥에 붙는 [취소][저장](AdminFormPage 셸의 footer)
  const footer = hbox('Sticky Footer', 8)
  fill(footer)
  footer.counterAxisAlignItems = 'CENTER'
  pad(footer, 16, 20)
  bindFillVar(ctx, footer, 'color/bg', WHITE)
  outline(ctx, footer)
  const fnote = hbox('note', 0)
  fnote.counterAxisAlignItems = 'CENTER'
  fnote.appendChild(tMuted(ctx, '저장하면 고객용 회사소개 페이지에 즉시 반영됩니다.', 12))
  footer.appendChild(grow(fnote))
  footer.appendChild(btn(ctx, '취소', 'outline'))
  footer.appendChild(btn(ctx, '저장', 'primary', '_Icon/Check'))
  s.appendChild(footer)
  return s
}

// ══ 14. 연혁 관리 ════════════════════════════════════════════════════
// 스토리북 src/ds/HistoryList(AdminListPage 프리셋)의 골격 그대로:
//   헤더(타이틀 · 설명 · [연혁 등록]) → 탭(전체/노출/숨김) → 툴바(제목 검색 · 정렬 · 총 N건) →
//   표(순번 · 연도 · 월 · 제목 · 설명 · 대표 이미지 · 노출 토글 · 등록일 · 관리) → 페이지네이션.
function screenHistoryList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '연혁 관리')
  s.appendChild(
    pageHead(ctx, '연혁 관리', '연도별 연혁의 노출 여부와 대표 이미지를 관리합니다.', [
      btn(ctx, '엑셀 내보내기', 'outline', '_Icon/Download'),
      btn(ctx, '연혁 등록', 'primary', '_Icon/Plus'),
    ]),
  )
  // 탭 = 노출 상태 축(HistoryList의 HistoryTabKey: all/visible/hidden)
  s.appendChild(
    tabs(ctx, [
      ['전체', '24', true],
      ['노출', '18', false],
      ['숨김', '6', false],
    ]),
  )

  const c = flatCard(ctx, '연혁 표')
  c.appendChild(
    toolbar(
      ctx,
      [
        input(ctx, '제목 검색', 320, { leadIcon: '_Icon/Search' }),
        // 연혁은 '언제 등록했나'보다 '언제 있었던 일인가'를 자주 본다 → 정렬 축 2종
        input(ctx, '최신순', 150, { trailIcon: '_Icon/ChevronDown', value: '연도순' }),
        tMuted(ctx, '총 24건', 12),
      ],
      [btn(ctx, '컬럼', 'outline', '_Icon/Columns'), iconBtn(ctx, '_Icon/Refresh')],
    ),
  )
  const cols: Col[] = [
    { label: '', w: 48, align: 'center', head: { t: 'check' } },
    { label: '순번', w: 70, align: 'center' },
    { label: '연도', w: 90 },
    { label: '월', w: 70 },
    { label: '제목', w: 320, grow: true },
    { label: '설명', w: 400 },
    { label: '대표 이미지', w: 110, align: 'center' },
    { label: '노출', w: 90, align: 'center' },
    { label: '등록일', w: 120 },
    { label: '관리', w: 150, align: 'center' },
  ]
  const rows: Cell[][] = [
    [
      { t: 'check', on: true },
      { t: 'strong', v: '1' },
      { t: 'strong', v: '2026' },
      '3월',
      { t: 'link', v: '스튜디오 이전 · 사옥 준공' },
      { t: 'muted', v: '성수동 신사옥으로 이전했습니다.' },
      { t: 'img' },
      { t: 'toggle', on: true },
      '2026-03-04',
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'strong', v: '2' },
      { t: 'strong', v: '2024' },
      '11월',
      { t: 'link', v: '누적 프로젝트 100건 달성' },
      { t: 'muted', v: '공공·민간 합계 기준입니다.' },
      { t: 'img' },
      { t: 'toggle', on: true },
      '2024-11-20',
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'strong', v: '3' },
      { t: 'strong', v: '2022' },
      '5월',
      { t: 'link', v: '음향 설계 부문 신설' },
      { t: 'muted', v: '설계 전담 조직을 분리했습니다.' },
      { t: 'img' },
      { t: 'toggle', on: false },
      '2022-05-09',
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'strong', v: '4' },
      { t: 'strong', v: '2019' },
      '9월',
      { t: 'link', v: '기업부설연구소 인정' },
      { t: 'muted', v: '—' },
      { t: 'img' },
      { t: 'toggle', on: true },
      '2019-09-16',
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'strong', v: '5' },
      { t: 'strong', v: '2015' },
      { t: 'muted', v: '-' },
      { t: 'link', v: '법인 설립' },
      { t: 'muted', v: '월이 없으면 그 해의 맨 뒤로 정렬됩니다.' },
      { t: 'img' },
      { t: 'toggle', on: true },
      '2015-01-08',
      { t: 'btns', v: ['수정', '삭제'] },
    ],
  ]
  c.appendChild(table(ctx, INNER_W, cols, rows))
  // 선택 일괄 처리 바 — AdminListPage의 bulk 축(선택 삭제는 확인창을 거친다)
  const bulk = hbox('Bulk Bar', 8)
  fill(bulk)
  bulk.counterAxisAlignItems = 'CENTER'
  pad(bulk, 10, 20)
  bindFillVar(ctx, bulk, 'color/bgSubtle', SURFACE)
  bottomLine(ctx, bulk)
  const bl = hbox('l', 0)
  bl.counterAxisAlignItems = 'CENTER'
  bl.appendChild(tSub(ctx, '1건 선택됨', 12))
  bulk.appendChild(grow(bl))
  bulk.appendChild(btn(ctx, '선택 노출', 'outline', '_Icon/Eye', 30))
  bulk.appendChild(btn(ctx, '선택 삭제', 'danger', '_Icon/Trash2', 30))
  c.appendChild(bulk)
  c.appendChild(pagination(ctx, '전체 24건 · 5건 표시'))
  s.appendChild(c)
  return s
}

// ── §A 신설 화면 공용 원자 ───────────────────────────────────────────
/** 정보 안내 박스(Callout 톤 info) — 아이콘 + 제목 + 본문. MainVisualForm 섹션 하단 도움말이 쓰는 모양(2곳)이다. */
function calloutBox(ctx: Ctx, title: string, body: string): FrameNode {
  const c = vbox('Callout / ' + title, 6)
  fill(c)
  pad(c, 12, 14)
  c.cornerRadius = R_CTRL
  bindFillVar(ctx, c, 'color/primary/100', tintHex(ACCENT))
  const head = hbox('head', 6)
  head.counterAxisAlignItems = 'CENTER'
  head.appendChild(icon(ctx, '_Icon/Info', 14, 'color/primary', ACCENT))
  head.appendChild(boundText(ctx, title, 12, 'color/primary', ACCENT, true))
  c.appendChild(head)
  const b = tSub(ctx, body, 12)
  b.textAutoResize = 'HEIGHT'
  b.layoutAlign = 'STRETCH'
  c.appendChild(b)
  return c
}
/** 단일 계열 막대 차트 — ProductDetail의 '최근 6개월 판매량'(AdminChart bar, 계열 1개)용. */
function chartSingle(ctx: Ctx, h: number, labels: string[], values: number[]): FrameNode {
  const max = Math.max(...values, 1)
  const wrap = vbox('Chart', 12)
  fill(wrap)
  const plot = hbox('Plot', 0)
  fill(plot)
  plot.primaryAxisAlignItems = 'SPACE_BETWEEN'
  plot.counterAxisAlignItems = 'MAX'
  plot.counterAxisSizingMode = 'FIXED'
  plot.resize(plot.width, h)
  pad(plot, 0, 12)
  values.forEach((v) => {
    const b1 = fixed('bar', 'VERTICAL', 28, Math.max(6, Math.round((v / max) * (h - 12))))
    b1.cornerRadius = 5
    bindFillVar(ctx, b1, 'color/primary', ACCENT)
    plot.appendChild(b1)
  })
  wrap.appendChild(plot)
  const axis = hbox('Axis', 0)
  fill(axis)
  axis.primaryAxisAlignItems = 'SPACE_BETWEEN'
  pad(axis, 0, 12)
  labels.forEach((l) => {
    const cellw = hbox('x', 0)
    cellw.primaryAxisAlignItems = 'CENTER'
    cellw.counterAxisSizingMode = 'FIXED'
    cellw.primaryAxisSizingMode = 'FIXED'
    cellw.resize(60, 16)
    cellw.appendChild(tMuted(ctx, l, 11))
    axis.appendChild(cellw)
  })
  wrap.appendChild(axis)
  return wrap
}

// ══ 15. 카테고리 관리 ════════════════════════════════════════════════
// 오너 시안 + src/ds/CategoryList/CategoryList.tsx 1:1 — 드래그핸들·순번·브랜드(강조색)·
// 카테고리명(이모지/이미지 표식)·설명·하위(뱃지 "N개")·등록일·활성화(토글)·관리(RowActions 수정·삭제).
// 목데이터는 CategoryList.stories.tsx의 시공 분야 카테고리(도배·바닥재·욕실 리모델링 …) 그대로 옮겼다.
function screenCategoryList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '카테고리 관리')
  s.appendChild(
    pageHead(
      ctx,
      '카테고리 관리',
      '1Depth 카테고리를 등록하고, 각 카테고리의 하위(2Depth)를 설정합니다.',
      [btn(ctx, '카테고리 등록', 'primary', '_Icon/Plus')],
    ),
  )
  // 탭 = 상태 필터(all/active/inactive) — 스토리 목데이터 18건과 같은 결
  s.appendChild(
    tabs(ctx, [
      ['전체', '18', true],
      ['활성', '16', false],
      ['비활성', '2', false],
    ]),
  )

  const c = flatCard(ctx, '카테고리 표')
  c.appendChild(
    toolbar(ctx, [
      input(ctx, '전체 브랜드', 150, { trailIcon: '_Icon/ChevronDown' }),
      input(ctx, '카테고리명·설명 검색', 260, { leadIcon: '_Icon/Search' }),
      input(ctx, '순번순', 130, { trailIcon: '_Icon/ChevronDown' }),
      tMuted(ctx, '18건', 12),
    ]),
  )
  const cols: Col[] = [
    { label: '', w: 40, align: 'center' },
    { label: '순번', w: 56, align: 'center' },
    { label: '브랜드', w: 110 },
    { label: '카테고리명', w: 220, grow: true },
    { label: '설명', w: 300 },
    { label: '하위', w: 80, align: 'center' },
    { label: '등록일', w: 110 },
    { label: '활성화', w: 90, align: 'center' },
    { label: '관리', w: 130, align: 'center' },
  ]
  const rows: Cell[][] = [
    [
      { t: 'drag' },
      { t: 'strong', v: '1' },
      { t: 'link', v: '한샘' },
      { t: 'strong', v: '🧻 도배' },
      { t: 'muted', v: '합지·실크 도배, 부분 보수 시공' },
      { t: 'badge', v: '3개', tone: 'secondary' },
      '2025-01-06',
      { t: 'toggle', on: true },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'drag' },
      { t: 'strong', v: '2' },
      { t: 'link', v: '리바트' },
      { t: 'strong', v: '🪵 바닥재' },
      { t: 'muted', v: '장판·강마루·강화마루·데코타일' },
      { t: 'badge', v: '4개', tone: 'secondary' },
      '2025-01-06',
      { t: 'toggle', on: true },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'drag' },
      { t: 'strong', v: '3' },
      { t: 'link', v: '자체 브랜드' },
      { t: 'strong', v: '🛁 욕실 리모델링' },
      { t: 'muted', v: '욕실 전체 철거 후 방수·타일·도기 교체' },
      { t: 'badge', v: '2개', tone: 'secondary' },
      '2025-01-06',
      { t: 'toggle', on: true },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'drag' },
      { t: 'strong', v: '4' },
      { t: 'link', v: '한샘' },
      { t: 'strong', v: '🍳 주방·싱크대' },
      { t: 'muted', v: '싱크대 교체, 상판·타일 시공, 아일랜드 제작' },
      { t: 'badge', v: '1개', tone: 'secondary' },
      '2025-01-06',
      { t: 'toggle', on: true },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'drag' },
      { t: 'strong', v: '5' },
      { t: 'link', v: '리바트' },
      { t: 'thumb', v: '창호·샤시' },
      { t: 'muted', v: '이중창 교체, 발코니 샤시, 방충망' },
      { t: 'badge', v: '1개', tone: 'secondary' },
      '2025-02-14',
      { t: 'toggle', on: true },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
  ]
  c.appendChild(table(ctx, INNER_W, cols, rows))
  c.appendChild(pagination(ctx, '전체 18건 · 5건 표시'))
  s.appendChild(c)
  return s
}

// ══ 16. 카테고리 등록 ════════════════════════════════════════════════
// 오너 시안 + src/ds/CategoryForm/CategoryForm.tsx 1:1 — 카드 '카테고리 정보' 하나뿐이다:
// 브랜드*·카테고리명*·카테고리 이미지(업로더, 없으면 아이콘 선택)·설명·활성화.
function screenCategoryForm(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '카테고리 등록')
  s.appendChild(pageHead(ctx, '카테고리 등록', '', [btn(ctx, '저장', 'primary', '_Icon/Save')]))

  const info = card(ctx, '카테고리 정보', 16)
  info.appendChild(cardHead(ctx, '카테고리 정보', tMuted(ctx, '* 필수 항목', 12)))
  info.appendChild(
    fieldRow(ctx, '브랜드', input(ctx, '브랜드를 선택하세요', 0, { value: '한샘', trailIcon: '_Icon/ChevronDown' }), true),
  )
  info.appendChild(fieldRow(ctx, '카테고리명', input(ctx, '예: 거실 인테리어', 0, { value: '거실 인테리어' }), true))

  // 카테고리 이미지 — '이미지 사용' 스위치 + (ON) 업로더/미리보기 또는 (OFF) 아이콘 선택
  const imgField = vbox('Image Field', 10)
  fill(imgField)
  const switchRow = hbox('switch', 8)
  switchRow.counterAxisAlignItems = 'CENTER'
  switchRow.appendChild(tBody(ctx, '이미지 사용'))
  switchRow.appendChild(toggleMini(ctx, true))
  imgField.appendChild(switchRow)
  const imgRow = hbox('img row', 16)
  fill(imgRow)
  imgRow.counterAxisAlignItems = 'MIN'
  imgRow.appendChild(thumbBox(ctx, 160, 160, R_CTRL))
  // 업로더 = DS/DropZone 인스턴스. 힌트는 CategoryForm.tsx의 실제 기본값(권장 640×640 · JPG/PNG · 2MB 이하).
  const catDrop = inst(ctx, 'DS/DropZone', {
    name: 'Category Image DropZone',
    variant: { state: 'idle' },
    props: {
      label: '이미지를 끌어다 놓거나 클릭해서 선택하세요',
      hint: '권장 640×640 · JPG/PNG · 2MB 이하',
    },
  })
  imgRow.appendChild(catDrop ? instGrow(catDrop) : drawDropZone(ctx))
  imgField.appendChild(imgRow)
  info.appendChild(fieldRow(ctx, '카테고리 이미지', imgField))

  info.appendChild(
    fieldRow(
      ctx,
      '설명',
      textarea(ctx, '아파트·주택 거실 시공 사례를 모아 보여주는 카테고리입니다. 대표 이미지는 목록 썸네일로도 함께 쓰입니다.', 90),
    ),
  )

  const activeRow = hbox('active', 10)
  activeRow.counterAxisAlignItems = 'CENTER'
  activeRow.counterAxisSizingMode = 'FIXED'
  activeRow.resize(activeRow.width, CTRL_H)
  activeRow.appendChild(toggleMini(ctx, true))
  activeRow.appendChild(tSub(ctx, '끄면 목록과 메뉴에서 이 카테고리가 노출되지 않습니다.'))
  info.appendChild(fieldRow(ctx, '활성화', activeRow))
  s.appendChild(info)

  const footer = hbox('Footer', 8)
  fill(footer)
  footer.counterAxisAlignItems = 'CENTER'
  footer.primaryAxisAlignItems = 'CENTER'
  pad(footer, 16, 20)
  bindFillVar(ctx, footer, 'color/bg', WHITE)
  outline(ctx, footer)
  footer.appendChild(btn(ctx, '취소', 'outline'))
  footer.appendChild(btn(ctx, '저장', 'primary', '_Icon/Check'))
  s.appendChild(footer)
  return s
}

// ══ 17. 메인비주얼 관리 ══════════════════════════════════════════════
// src/ds/MainVisualList/MainVisualList.tsx 1:1 — 탭(중고2·렌탈3·시공2)은 이 화면이 아니라
// 부모가 걸러서 넘긴 값이라 무상태다. 렌탈 탭(3건, 이미지 없는 행 1건 포함)을 기본으로 보여준다.
function screenMainVisualList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '메인비주얼 관리')
  s.appendChild(
    pageHead(ctx, '메인 비주얼 관리', '메인 화면 상단에 노출되는 비주얼을 등록하고 순서를 관리합니다.', [
      btn(ctx, '렌탈 메인 비주얼 등록', 'primary', '_Icon/Plus'),
    ]),
  )
  s.appendChild(
    tabs(ctx, [
      ['중고', '2', false],
      ['렌탈', '3', true],
      ['시공', '2', false],
    ]),
  )

  const c = flatCard(ctx, '메인비주얼 표')
  c.appendChild(
    toolbar(ctx, [
      input(ctx, '전체 상태', 130, { trailIcon: '_Icon/ChevronDown' }),
      input(ctx, '제목·문구 검색', 260, { leadIcon: '_Icon/Search' }),
      input(ctx, '순번순', 130, { trailIcon: '_Icon/ChevronDown' }),
      tMuted(ctx, '3건', 12),
    ]),
  )
  const cols: Col[] = [
    { label: '', w: 40, align: 'center', head: { t: 'check' } },
    { label: '', w: 32, align: 'center' },
    { label: '순번', w: 56, align: 'center' },
    { label: '이미지', w: 70, align: 'center' },
    { label: '타입', w: 84, align: 'center' },
    { label: '제목', w: 260, grow: true },
    { label: '등록일', w: 100 },
    { label: '수정일', w: 100 },
    { label: '등록자', w: 90 },
    { label: '수정자', w: 90 },
    { label: '활성화', w: 84, align: 'center' },
    { label: '관리', w: 130, align: 'center' },
  ]
  const rows: Cell[][] = [
    [
      { t: 'check' },
      { t: 'drag' },
      { t: 'strong', v: '1' },
      { t: 'img' },
      { t: 'badge', v: '히어로', tone: 'primary' },
      { t: 'link', v: '단기 렌탈 3일 무료 체험 이벤트' },
      '2026-06-01',
      '2026-07-02',
      '김서연',
      '홍성보',
      { t: 'toggle', on: true },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'drag' },
      { t: 'strong', v: '2' },
      { t: 'img' },
      { t: 'badge', v: '히어로', tone: 'primary' },
      { t: 'link', v: '월 렌탈 신규 고객 20% 할인' },
      '2026-05-21',
      '2026-05-29',
      '이지훈',
      '김서연',
      { t: 'toggle', on: true },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'drag' },
      { t: 'strong', v: '3' },
      { t: 'img' },
      { t: 'badge', v: '서브', tone: 'secondary' },
      { t: 'link', v: '현장 맞춤 장비 렌탈 상담 신청' },
      '2026-03-14',
      '2026-06-11',
      '박준호',
      '이지훈',
      { t: 'toggle', on: false },
      { t: 'btns', v: ['수정', '삭제'] },
    ],
  ]
  c.appendChild(table(ctx, INNER_W, cols, rows))
  c.appendChild(pagination(ctx, '전체 3건 · 3건 표시'))
  s.appendChild(c)
  // 재정렬 안내 — MainVisualList.tsx의 footerNote(핸들 드래그가 실제로 켜져 있을 때만 보인다)
  const hint = hbox('Reorder Hint', 6)
  hint.counterAxisAlignItems = 'CENTER'
  hint.appendChild(icon(ctx, '_Icon/MoveVertical', 14))
  hint.appendChild(tMuted(ctx, '핸들을 드래그하거나 화살표 키로 순번을 바꿉니다.', 12))
  s.appendChild(hint)
  return s
}

// ══ 18. 메인비주얼 등록 ══════════════════════════════════════════════
// src/ds/MainVisualForm/MainVisualForm.tsx 1:1 — 카드 번호 1~4 고정: 배너 구분 · 문구·콘텐츠 ·
// 이미지 · 링크·노출. 1·2번 카드 하단의 Callout(도움말)까지 문구 그대로 옮겼다.
function screenMainVisualForm(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '메인비주얼 등록')
  s.appendChild(
    pageHead(ctx, '메인 비주얼 수정', '', [
      badge(ctx, '활성', 'success'),
      btn(ctx, '저장', 'primary', '_Icon/Save'),
    ]),
  )

  // 1. 배너 구분
  const c1 = card(ctx, '배너 구분', 14)
  c1.appendChild(cardHead(ctx, '1. 배너 구분'))
  c1.appendChild(fieldRow(ctx, '섹션', input(ctx, '섹션을 선택하세요', 0, { value: '렌탈', trailIcon: '_Icon/ChevronDown' }), true))
  c1.appendChild(
    calloutBox(
      ctx,
      '도움말',
      '섹션은 저장 후 변경할 수 없습니다. 다른 섹션에 노출하려면 해당 섹션 목록에서 새로 등록하세요.',
    ),
  )
  s.appendChild(c1)

  // 2. 문구·콘텐츠 — '문구 사용' 밴드(toggleable FormSection)
  // 조사 기록(2026-07): DS/FormSection(admin.ts) 인스턴스로 바꾸지 않았다. toggleable=true 축과
  // title/toggleLabel 같은 texts는 이 카드 헤더와 그대로 맞지만, 본문(제목 textarea·오버라인 문구·
  // 우측 메뉴 라벨·버튼 문구 입력 4개 + calloutBox)은 세트의 'content' 슬롯(자리표시 필드 2장 고정,
  // admin.ts renderFormSection)에 넣을 수 없다 — Figma 인스턴스는 내부 프레임에 새 자식을 붙이는 것
  // 자체가 안 된다(컴포넌트 속성 오버라이드만 가능). 헤더만 인스턴스로 바꾸고 본문을 밖에서 이어
  // 붙이면 카드 하나가 인스턴스+일반 프레임으로 쪼개져 구조가 흐트러진다 — 카드 전체를 직접 그린다.
  const c2 = card(ctx, '문구·콘텐츠', 14)
  const c2Head = hbox('head', 8)
  fill(c2Head)
  c2Head.counterAxisAlignItems = 'CENTER'
  c2Head.appendChild(boundText(ctx, '2. 문구·콘텐츠', 15, 'color/text', INK, true))
  const c2Sp = hbox('sp', 0)
  c2Head.appendChild(grow(c2Sp))
  c2Head.appendChild(tSub(ctx, '문구 사용'))
  c2Head.appendChild(toggleMini(ctx, true))
  c2.appendChild(c2Head)
  c2.appendChild(
    fieldRow(ctx, '제목', textarea(ctx, '예: 사무실 이전, 중고 가구로 예산을 아끼세요', 56), true),
  )
  const c2Row = hbox('row', 12)
  fill(c2Row)
  c2Row.appendChild(grow(fieldRow(ctx, '오버라인 문구', input(ctx, '예: 신규 입고', 0), false, 110)))
  c2Row.appendChild(grow(fieldRow(ctx, '우측 메뉴 라벨', input(ctx, '예: 중고 가구', 0), false, 110)))
  c2.appendChild(c2Row)
  c2.appendChild(
    fieldRow(ctx, '버튼 문구', input(ctx, '예: 매물 보러가기', 0), false, 110),
  )
  c2.appendChild(
    calloutBox(
      ctx,
      '도움말',
      '오버라인 문구는 제목 위 작은 글씨로, 우측 메뉴 라벨은 메인 우측 퀵메뉴에 표시됩니다. 제목은 두 줄(60자) 안으로 맞추는 것을 권장합니다.',
    ),
  )
  s.appendChild(c2)

  // 3. 이미지 — 대표 1장
  const c3 = card(ctx, '이미지', 14)
  c3.appendChild(cardHead(ctx, '3. 이미지', tMuted(ctx, 'JPG·PNG 이미지 · 최대 10MB', 12)))
  const imgRow = hbox('img', 16)
  fill(imgRow)
  imgRow.counterAxisAlignItems = 'MIN'
  imgRow.appendChild(thumbBox(ctx, 200, 112, R_CTRL))
  const bannerDrop = inst(ctx, 'DS/DropZone', {
    name: 'Banner Image DropZone',
    variant: { state: 'idle' },
    props: {
      label: '다른 이미지를 끌어다 놓거나 클릭해서 교체하세요',
      hint: 'JPG·PNG 이미지 · 최대 10MB',
    },
  })
  imgRow.appendChild(bannerDrop ? instGrow(bannerDrop) : drawDropZone(ctx))
  c3.appendChild(imgRow)
  s.appendChild(c3)

  // 4. 링크·노출
  const c4 = card(ctx, '링크·노출', 14)
  c4.appendChild(cardHead(ctx, '4. 링크·노출'))
  c4.appendChild(
    fieldRow(ctx, '링크 URL', input(ctx, 'https://spaceplanning.ai/used', 0, { leadIcon: '_Icon/Link' })),
  )
  const visRow = hbox('vis', 10)
  visRow.counterAxisAlignItems = 'CENTER'
  visRow.counterAxisSizingMode = 'FIXED'
  visRow.resize(visRow.width, CTRL_H)
  visRow.appendChild(toggleMini(ctx, true))
  visRow.appendChild(tSub(ctx, '클라이언트 페이지에 노출됩니다.'))
  c4.appendChild(fieldRow(ctx, '활성화', visRow))
  s.appendChild(c4)

  const footer = hbox('Footer', 8)
  fill(footer)
  footer.counterAxisAlignItems = 'CENTER'
  footer.primaryAxisAlignItems = 'CENTER'
  pad(footer, 16, 20)
  bindFillVar(ctx, footer, 'color/bg', WHITE)
  outline(ctx, footer)
  footer.appendChild(btn(ctx, '취소', 'outline'))
  footer.appendChild(btn(ctx, '저장', 'primary', '_Icon/Check'))
  s.appendChild(footer)
  return s
}

// ══ 19. 시공 문의 내역(관리) ═════════════════════════════════════════
// src/ds/InquiryManageList/InquiryManageList.tsx 1:1 — 챗봇으로 접수된 시공 문의.
// 문의관리(inquiries) 메뉴 안에서 기존 '문의 내역'(문의게시판 데모)과는 다른 화면이라 이름을 갈랐다.
function screenInquiryManageList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '시공 문의 내역')
  s.appendChild(
    pageHead(ctx, '시공 문의 내역', '시공 문의 챗봇을 통해 접수된 신청 내역을 조회·관리합니다.', [
      btn(ctx, '엑셀 다운로드', 'outline', '_Icon/Download'),
    ]),
  )
  s.appendChild(
    tabs(ctx, [
      ['전체', '4', true],
      ['대기중', '3', false],
      ['답변완료', '1', false],
      ['보류', '0', false],
    ]),
  )

  const c = flatCard(ctx, '시공 문의 표')
  c.appendChild(
    toolbar(ctx, [
      input(ctx, '신청자, 연락처, 이메일로 검색', 320, { leadIcon: '_Icon/Search' }),
      input(ctx, '최신순', 130, { trailIcon: '_Icon/ChevronDown' }),
      tMuted(ctx, '4건', 12),
    ]),
  )
  const cols: Col[] = [
    { label: '', w: 40, align: 'center', head: { t: 'check' } },
    { label: '순번', w: 60, align: 'center' },
    { label: '신청자', w: 200, grow: true },
    { label: '연락처', w: 150 },
    { label: '이메일', w: 220 },
    { label: '신청일', w: 110 },
    { label: '상태', w: 100, align: 'center' },
    { label: '관리', w: 110, align: 'center' },
  ]
  const rows: Cell[][] = [
    [
      { t: 'check' },
      { t: 'strong', v: '4' },
      { t: 'link', v: '최유나' },
      '010-7745-2213',
      { t: 'muted', v: 'yuna.choi@gmail.com' },
      '2026-07-12',
      { t: 'badge', v: '답변완료', tone: 'success' },
      { t: 'btns', v: ['보기', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'strong', v: '3' },
      { t: 'link', v: '박서준' },
      '010-4821-7734',
      { t: 'muted', v: 'seojun.park@gmail.com' },
      '2026-07-11',
      { t: 'badge', v: '대기중', tone: 'error' },
      { t: 'btns', v: ['보기', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'strong', v: '2' },
      { t: 'link', v: '김민지' },
      '010-3376-1902',
      { t: 'muted', v: 'minji.kim@naver.com' },
      '2026-07-09',
      { t: 'badge', v: '대기중', tone: 'error' },
      { t: 'btns', v: ['보기', '삭제'] },
    ],
    [
      { t: 'check' },
      { t: 'strong', v: '1' },
      { t: 'link', v: '이도현' },
      '010-2914-5580',
      { t: 'muted', v: 'dohyun.lee@daum.net' },
      '2026-07-07',
      { t: 'badge', v: '대기중', tone: 'error' },
      { t: 'btns', v: ['보기', '삭제'] },
    ],
  ]
  c.appendChild(table(ctx, INNER_W, cols, rows))
  c.appendChild(pagination(ctx, '전체 4건 · 4건 표시'))
  s.appendChild(c)
  return s
}

// ══ 20. 시공 문의 상세(관리) ═════════════════════════════════════════
// src/ds/InquiryManageDetail/InquiryManageDetail.tsx 1:1 — [신청자 정보](3칸+동의배지+메타)
// → [문의 응답](QaList) → [답변](토글 밴드 + textarea). 목데이터는 InquiryManageDetail.stories.tsx.
function screenInquiryManageDetail(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '시공 문의 상세')
  s.appendChild(
    pageHead(ctx, '시공 문의 상세', '', [
      badge(ctx, '대기중', 'warning'),
      btn(ctx, '저장', 'primary', '_Icon/Save'),
    ]),
  )

  // [신청자 정보] — 이름·연락처·이메일 3칸 + 동의 배지 + 메타 줄
  const applicant = card(ctx, '신청자 정보', 14)
  applicant.appendChild(cardHead(ctx, '신청자 정보'))
  const triple = hbox('triple', 24)
  fill(triple)
  const fields: Array<[string, string]> = [
    ['이름', '정하늘'],
    ['연락처', '010-4872-1130'],
    ['이메일', 'haneul.jung@example.com'],
  ]
  for (const [label, value] of fields) {
    const f = vbox('f', 4)
    grow(f)
    f.appendChild(tSub(ctx, label, 12))
    f.appendChild(tBody(ctx, value, true))
    triple.appendChild(f)
  }
  applicant.appendChild(triple)
  const consentRow = hbox('consent', 6)
  consentRow.counterAxisAlignItems = 'CENTER'
  consentRow.appendChild(badge(ctx, '개인정보 동의', 'success'))
  consentRow.appendChild(badge(ctx, '마케팅 미동의', 'secondary'))
  applicant.appendChild(consentRow)
  applicant.appendChild(
    tMuted(ctx, '신청일 2026-07-09 14:26 · 수정일 2026-07-12 10:03 · 수정자 김상담', 12),
  )
  s.appendChild(applicant)

  // [문의 응답] — QaList(신청 폼에 입력된 Q1~Qn). 3건만 보여준다(전체 6건).
  const qa = card(ctx, '문의 응답', 14)
  qa.appendChild(cardHead(ctx, '문의 응답', undefined))
  qa.appendChild(tSub(ctx, '신청 폼에 입력된 답변입니다.', 12))
  const qaPairs: Array<[string, string]> = [
    ['현재 운영 상태를 알려주세요.', '오픈 준비 중 (2026년 9월 오픈 예정)'],
    ['지역은 어디인가요?', '서울 성동구 성수동2가'],
    ['공간 종류를 선택해 주세요.', '카페 · 베이커리 (1층 로드샵)'],
  ]
  qaPairs.forEach(([q, a], i) => {
    const item = vbox('qa', 6)
    fill(item)
    pad(item, 10, 0)
    if (i < qaPairs.length - 1) bottomLine(ctx, item)
    const qRow = hbox('q', 6)
    qRow.counterAxisAlignItems = 'CENTER'
    qRow.appendChild(boundText(ctx, 'Q' + (i + 1), 12, 'color/primary', ACCENT, true))
    qRow.appendChild(tBody(ctx, q, true))
    item.appendChild(qRow)
    const aRow = hbox('a', 6)
    aRow.counterAxisAlignItems = 'MIN'
    aRow.appendChild(tMuted(ctx, 'A', 12))
    aRow.appendChild(grow(wrapText(tSub(ctx, a, 13))))
    item.appendChild(aRow)
    qa.appendChild(item)
  })
  s.appendChild(qa)

  // [답변] — 답변 사용 토글 밴드 + textarea(초안). DS/FormSection이 안 맞는 이유는 위 2번
  // (screenMainVisualForm '문구·콘텐츠')과 같다 — 본문(fieldRow '답변 내용')을 세트 인스턴스 안에
  // 넣을 방법이 없다.
  const answer = card(ctx, '답변', 14)
  const aHead = hbox('head', 8)
  fill(aHead)
  aHead.counterAxisAlignItems = 'CENTER'
  aHead.appendChild(boundText(ctx, '답변', 15, 'color/text', INK, true))
  const aSp = hbox('sp', 0)
  aHead.appendChild(grow(aSp))
  aHead.appendChild(tSub(ctx, '답변 사용'))
  aHead.appendChild(toggleMini(ctx, true))
  answer.appendChild(aHead)
  answer.appendChild(tSub(ctx, '등록한 답변은 신청자 메일로 함께 발송됩니다.', 12))
  answer.appendChild(
    fieldRow(
      ctx,
      '답변 내용',
      textarea(
        ctx,
        '안녕하세요, 문의 주셔서 감사합니다.\n보내주신 도면 기준으로 실링 스피커 6개 + 앰프 1대 구성을 제안드립니다.',
        100,
      ),
      true,
    ),
  )
  s.appendChild(answer)

  const footer = hbox('Footer', 8)
  fill(footer)
  footer.counterAxisAlignItems = 'CENTER'
  footer.primaryAxisAlignItems = 'CENTER'
  pad(footer, 16, 20)
  bindFillVar(ctx, footer, 'color/bg', WHITE)
  outline(ctx, footer)
  footer.appendChild(btn(ctx, '목록', 'outline', '_Icon/List'))
  const fSp = hbox('sp', 0)
  footer.appendChild(grow(fSp))
  footer.appendChild(btn(ctx, '삭제', 'danger', '_Icon/Trash2'))
  footer.appendChild(btn(ctx, '저장', 'primary', '_Icon/Save'))
  s.appendChild(footer)
  return s
}

// ══ 21. 문의 설정 ════════════════════════════════════════════════════
// src/ds/InquirySettings/InquirySettings.tsx 1:1 — 탭 4개(문의 유형·자동화·알림·상태 배지) 중
// 기본 탭 '문의 유형 관리'(SortableList: 핸들·순번·유형명/코드·사용배지·토글·RowActions)를 그린다.
// 페이지 타이틀·설명은 AdminSuite의 menuMeta['inquiry-settings']를 그대로 옮겼다(컴포넌트 자체엔 헤더가 없다).
//
// 조사 기록(2026-07): 행을 DS/SortableList 인스턴스로, 우측 액션을 DS/RowActions 인스턴스로 바꾸지
// 않았다. SortableList(admin.ts)는 축 3개(direction·disabled·handleOnly)뿐 texts/bools 오버라이드가
// 하나도 없어(직전 배치가 이미 보고한 문제 그대로) 실제 문의 유형 5개(상품·배송·주문·결제·취소 문의)
// 라벨을 넣을 통로가 없다. RowActions는 view·edit·delete를 개별로 껐다 켤 BOOLEAN이 없어(이 화면은
// edit+delete 2개만 쓴다) 인스턴스로 바꾸면 없는 '상세보기' 아이콘이 하나 더 붙는다 — 둘 다 직접 그린다.
function screenInquirySettings(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '문의 설정')
  s.appendChild(pageHead(ctx, '문의 설정', '문의 유형·자동화·알림·상태 배지를 설정합니다.'))
  s.appendChild(
    tabs(ctx, [
      ['문의 유형', '', true],
      ['자동화', '', false],
      ['알림', '', false],
      ['상태 배지', '', false],
    ]),
  )

  const c = card(ctx, '문의 유형 관리', 12)
  c.appendChild(
    cardHead(ctx, '문의 유형 관리', btn(ctx, '유형 추가', 'primary', '_Icon/Plus', 30)),
  )
  c.appendChild(
    tSub(ctx, '접수 화면에 노출되는 유형입니다. 핸들을 끌거나 Ctrl/Cmd + ↑ ↓ 로 순서를 바꿉니다.', 12),
  )
  const types: Array<[string, string, boolean]> = [
    ['상품 문의', 'product', true],
    ['배송 문의', 'delivery', true],
    ['주문 문의', 'order', true],
    ['결제 문의', 'payment', true],
    ['취소 문의', 'cancel', true],
  ]
  types.forEach(([label, key, enabled], i) => {
    const row = hbox('Type / ' + label, 12)
    fill(row)
    row.counterAxisAlignItems = 'CENTER'
    pad(row, 10, 4)
    if (i < types.length - 1) bottomLine(ctx, row)
    row.appendChild(icon(ctx, '_Icon/MoveVertical', 16))
    row.appendChild(tMuted(ctx, String(i + 1), 12))
    const main = vbox('main', 2)
    grow(main)
    main.appendChild(tBody(ctx, label, true))
    main.appendChild(tMuted(ctx, key, 11))
    row.appendChild(main)
    row.appendChild(badge(ctx, enabled ? '사용' : '미사용', enabled ? 'success' : 'secondary'))
    row.appendChild(toggleMini(ctx, enabled))
    const rActions = hbox('actions', 6)
    rActions.counterAxisAlignItems = 'CENTER'
    const editB = iconBtn(ctx, '_Icon/Edit', 28)
    const delB = iconBtn(ctx, '_Icon/Trash2', 28)
    rActions.appendChild(editB)
    rActions.appendChild(delB)
    row.appendChild(rActions)
    c.appendChild(row)
  })
  s.appendChild(c)
  return s
}

// ══ 22. 사용자 목록 ══════════════════════════════════════════════════
// src/ds/CustomerList/CustomerList.tsx 1:1 — 오너 확정 사이드바 '회원관리 › 사용자'.
// 기존 '고객 목록' 화면(active=users)은 다른 컴포넌트(MemberList, 그룹 패널이 있는 화면)라서
// 화면 이름을 '사용자 목록'으로 분리했다 — 실제 화면 타이틀(AdminTopbar 문구)은
// CustomerList.tsx의 기본값 그대로 '고객 목록'이다(두 화면이 같은 문구를 보여줄 수 있다).
function screenCustomerList(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '사용자 목록')
  s.appendChild(
    pageHead(ctx, '고객 목록', '가입한 일반회원·아티스트회원을 조회하고 메모를 관리합니다.', [
      btn(ctx, '엑셀 다운로드', 'outline', '_Icon/Download'),
    ]),
  )
  s.appendChild(
    tabs(ctx, [
      ['전체', '5', true],
      ['일반회원', '2', false],
      ['아티스트회원', '3', false],
    ]),
  )

  const c = flatCard(ctx, '사용자 표')
  c.appendChild(
    toolbar(
      ctx,
      [input(ctx, '닉네임 · 계정 · 연락처로 검색', 320, { leadIcon: '_Icon/Search' }), tMuted(ctx, '5명', 12)],
      [btn(ctx, '필터', 'outline', '_Icon/Filter')],
    ),
  )
  const cols: Col[] = [
    { label: '닉네임', w: 110 },
    { label: '연락처', w: 130 },
    { label: '이메일', w: 200 },
    { label: '회원 유형', w: 100, align: 'center' },
    { label: '가입 경로', w: 90, align: 'center' },
    { label: '가입일', w: 100 },
    { label: '주문', w: 60, align: 'right' },
    { label: '누적 구매금액', w: 130, align: 'right' },
    { label: '메모', w: 260, grow: true },
  ]
  const rows: Cell[][] = [
    [
      { t: 'link', v: '서준작가' },
      { t: 'muted', v: '010-4821-7734' },
      { t: 'link', v: 'seojun.kim@example.com' },
      { t: 'badge', v: '아티스트회원', tone: 'primary' },
      { t: 'badge', v: '이메일', tone: 'secondary' },
      '2024-11-02',
      '42',
      '3,284,000원',
      { t: 'muted', v: '배송 지연 클레임 건으로 3,000원 쿠폰 지급 완료.' },
    ],
    [
      { t: 'link', v: '하윤' },
      { t: 'muted', v: '010-2937-1120' },
      { t: 'link', v: 'hayun.park@example.com' },
      { t: 'badge', v: '일반회원', tone: 'secondary' },
      { t: 'badge', v: '이메일', tone: 'secondary' },
      '2025-03-18',
      '7',
      '412,000원',
      { t: 'muted', v: '—' },
    ],
    [
      { t: 'link', v: '도현스튜디오' },
      { t: 'muted', v: '010-7645-8892' },
      { t: 'link', v: 'dohyun.lee@example.com' },
      { t: 'badge', v: '아티스트회원', tone: 'primary' },
      { t: 'badge', v: '이메일', tone: 'secondary' },
      '2025-09-04',
      '0',
      '0원',
      { t: 'muted', v: '포트폴리오 검수 대기 중.' },
    ],
    [
      { t: 'link', v: '은비' },
      { t: 'muted', v: '010-3318-2047' },
      { t: 'link', v: 'eunbi.choi@example.com' },
      { t: 'badge', v: '일반회원', tone: 'secondary' },
      { t: 'badge', v: '이메일', tone: 'secondary' },
      '2026-01-27',
      '3',
      '128,500원',
      { t: 'muted', v: '—' },
    ],
    [
      { t: 'link', v: '예린' },
      { t: 'muted', v: '010-5502-6613' },
      { t: 'link', v: 'yerin.jung@example.com' },
      { t: 'badge', v: '아티스트회원', tone: 'primary' },
      { t: 'badge', v: '이메일', tone: 'secondary' },
      '2026-07-12',
      '0',
      '0원',
      { t: 'muted', v: '—' },
    ],
  ]
  c.appendChild(table(ctx, INNER_W, cols, rows))
  c.appendChild(pagination(ctx, '전체 5명 · 5명 표시'))
  s.appendChild(c)
  return s
}

/**
 * 폴백 — DS/DefinitionList 세트가 없을 때의 상품 메타(상품코드·등록일·수정일·등록자).
 * metaInst(아래)의 props와 같은 4행이다 — 문의 상세용 drawInquiryDefinitions(문의번호·유형·연락처…)를
 * 여기서 재사용하면 상품 상세에 문의 데이터가 그려진다(2026-07 적대적 검증에서 지적된 오조합).
 */
function drawProductMetaDefinitions(ctx: Ctx): FrameNode {
  const dl = vbox('dl', 0)
  fill(dl)
  dl.appendChild(defRow(ctx, '상품코드', 'SHOE-AERO-X2', { muted: true }))
  dl.appendChild(defRow(ctx, '등록일', '2026-03-02'))
  dl.appendChild(defRow(ctx, '수정일', '2026-07-12 17:40'))
  const lastRow = defRow(ctx, '등록자', '김상품')
  lastRow.strokes = []
  dl.appendChild(lastRow)
  return dl
}
/**
 * 폴백 — DS/StatusTimeline 세트가 없을 때의 판매 진행 단계(등록→검수→판매중→판매종료).
 * flowInst(아래)의 Step N/Step N Meta props와 같은 4단계다 — 문의 처리 이력용 drawInquiryLogs
 * (문의 접수·담당자 확인)를 여기서 재사용하면 상품의 판매 흐름과 무관한 문의 이력이 그려진다.
 */
function drawProductFlow(ctx: Ctx): FrameNode {
  const wrap = vbox('Flow', 0)
  fill(wrap)
  const steps: Array<[string, string, Tone]> = [
    ['등록', '2026-03-02', 'secondary'],
    ['검수', '완료', 'secondary'],
    ['판매중', '진행중', 'primary'],
    ['판매종료', '-', 'secondary'],
  ]
  steps.forEach(([title, meta, tone], i) => {
    const r = hbox('step', 12)
    fill(r)
    r.counterAxisAlignItems = 'MIN'
    pad(r, 12, 0)
    if (i < steps.length - 1) bottomLine(ctx, r)
    const dotWrap = fixed('dot', 'HORIZONTAL', 20, 20)
    dotWrap.primaryAxisAlignItems = 'CENTER'
    dotWrap.counterAxisAlignItems = 'CENTER'
    const dot = figma.createEllipse()
    dot.resize(8, 8)
    const v = ctx.vars.get(`color/${tone}`)
    dot.fills = [v ? boundPaint(v) : solid(TONE_HEX[tone])]
    dotWrap.appendChild(dot)
    r.appendChild(dotWrap)
    const col = vbox('c', 4)
    col.appendChild(tBody(ctx, title, true))
    col.appendChild(tMuted(ctx, meta, 12))
    r.appendChild(grow(col))
    wrap.appendChild(r)
  })
  return wrap
}

// ══ 23. 상품 상세 ════════════════════════════════════════════════════
// src/ds/ProductDetail/ProductDetail.tsx 1:1 — DetailLayout(본문 + aside). 목데이터는
// ProductDetail.stories.tsx의 '에어로 러닝화 X2'(SHOE-AERO-X2)를 그대로 옮겼다.
function screenProductDetail(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '상품 상세')
  s.appendChild(
    pageHead(ctx, '에어로 러닝화 X2 (남녀공용)', 'SHOE-AERO-X2 · 스포츠 > 러닝화', [
      btn(ctx, '목록', 'outline', '_Icon/List'),
      btn(ctx, '수정', 'outline', '_Icon/Edit'),
      btn(ctx, '저장', 'primary', '_Icon/Save'),
    ]),
  )

  const body = hbox('Body', GAP)
  fill(body)
  body.counterAxisAlignItems = 'MIN'

  // ── 본문 ──
  const main = mainCol(MAIN_W)

  // 헤더 블록 — 상태 배지 · 태그 · 판매 토글 · 메타(DefinitionList)
  const headCard = card(ctx, '상태', 12)
  const badgeRow = hbox('badges', 8)
  badgeRow.counterAxisAlignItems = 'CENTER'
  badgeRow.appendChild(badge(ctx, '판매중', 'success'))
  badgeRow.appendChild(badge(ctx, '스포츠 > 러닝화', 'primary'))
  const badgeSp = hbox('sp', 0)
  badgeRow.appendChild(grow(badgeSp))
  const saleRow = hbox('sale', 8)
  saleRow.counterAxisAlignItems = 'CENTER'
  saleRow.appendChild(tSub(ctx, '판매'))
  saleRow.appendChild(toggleMini(ctx, true))
  badgeRow.appendChild(saleRow)
  fill(badgeRow)
  headCard.appendChild(badgeRow)
  const metaInst = inst(ctx, 'DS/DefinitionList', {
    name: 'Product Meta',
    variant: { frame: 'flush', density: 'compact' },
    props: {
      'Label 1': '상품코드',
      'Value 1': 'SHOE-AERO-X2',
      'Label 2': '등록일',
      'Value 2': '2026-03-02',
      'Label 3': '수정일',
      'Value 3': '2026-07-12 17:40',
      'Label 4': '등록자',
      'Value 4': '김상품',
      'Show Row 5': false,
      'Show Row 6': false,
      'Show Row 7': false,
    },
  })
  headCard.appendChild(metaInst ? instFill(metaInst) : drawProductMetaDefinitions(ctx))
  main.appendChild(headCard)

  // 상품 이미지 갤러리
  const gallery = card(ctx, '상품 이미지', 12)
  gallery.appendChild(cardHead(ctx, '상품 이미지', btn(ctx, '크게 보기', 'outline', '_Icon/Maximize2', 28), '총 3장 · 첫 번째가 대표 이미지'))
  const thumbs = hbox('thumbs', 12)
  fill(thumbs)
  for (let i = 0; i < 3; i++) {
    const th = thumbBox(ctx, 140, 140, R_CTRL)
    if (i === 0) {
      bindStrokeVar(ctx, th, 'color/primary', ACCENT)
      th.strokeWeight = 2
      th.strokeAlign = 'INSIDE'
    }
    thumbs.appendChild(th)
  }
  gallery.appendChild(thumbs)
  main.appendChild(gallery)

  // 기본 정보
  const basic = card(ctx, '기본 정보', 0)
  basic.appendChild(cardHead(ctx, '기본 정보'))
  // defRow는 값이 문자열 하나뿐이라 '취소선+할인가+배지' 조합은 같은 모양을 직접 짠다(라벨 폭 120은 defRow와 동일).
  const priceRowWrap = hbox('Def / 판매가', 12)
  fill(priceRowWrap)
  priceRowWrap.counterAxisAlignItems = 'CENTER'
  pad(priceRowWrap, 10, 0)
  bottomLine(ctx, priceRowWrap)
  const priceLabel = hbox('Label', 0)
  priceLabel.counterAxisSizingMode = 'FIXED'
  priceLabel.primaryAxisSizingMode = 'FIXED'
  priceLabel.resize(120, 20)
  priceLabel.counterAxisAlignItems = 'CENTER'
  priceLabel.appendChild(tSub(ctx, '판매가'))
  priceRowWrap.appendChild(priceLabel)
  const priceValRow = hbox('Value', 8)
  priceValRow.counterAxisAlignItems = 'CENTER'
  const strike = tMuted(ctx, '149,000원', 12)
  strike.textDecoration = 'STRIKETHROUGH'
  priceValRow.appendChild(strike)
  priceValRow.appendChild(boundText(ctx, '129,000원', F_BODY, 'color/text', INK, true))
  priceValRow.appendChild(badge(ctx, '13%', 'error'))
  priceRowWrap.appendChild(grow(priceValRow))
  basic.appendChild(priceRowWrap)
  basic.appendChild(defRow(ctx, '재고', '78개'))
  basic.appendChild(defRow(ctx, '배송비', '무료배송'))
  const lastDef = defRow(ctx, '과세여부', '과세')
  lastDef.strokes = []
  basic.appendChild(lastDef)
  main.appendChild(basic)

  // 옵션
  const options = card(ctx, '옵션', 12)
  options.appendChild(cardHead(ctx, '옵션', undefined, '5개 옵션'))
  const optCols: Col[] = [
    { label: '옵션명', w: 140 },
    { label: '옵션값', w: 220, grow: true },
    { label: '추가금액', w: 110, align: 'right' },
    { label: '재고', w: 90, align: 'right' },
    { label: '사용', w: 90, align: 'center' },
  ]
  const optRows: Cell[][] = [
    ['컬러 / 사이즈', '블랙 / 250', '-', '24', { t: 'badge', v: '사용', tone: 'success' }],
    ['컬러 / 사이즈', '블랙 / 260', '-', '12', { t: 'badge', v: '사용', tone: 'success' }],
    ['컬러 / 사이즈', '블랙 / 270', '-', { t: 'strong', v: '0' }, { t: 'badge', v: '사용', tone: 'success' }],
    ['컬러 / 사이즈', '화이트 / 250', '5,000원', '8', { t: 'badge', v: '사용', tone: 'success' }],
    ['컬러 / 사이즈', '화이트 / 260', '5,000원', '31', { t: 'badge', v: '사용', tone: 'success' }],
  ]
  options.appendChild(table(ctx, MAIN_W, optCols, optRows))
  main.appendChild(options)

  // 상세 설명 + 첨부
  const desc = card(ctx, '상세 설명', 10)
  desc.appendChild(cardHead(ctx, '상세 설명'))
  desc.appendChild(boundText(ctx, '가벼움과 반발력을 동시에', 15, 'color/text', INK, true))
  const p1 = tSub(ctx, '에어로 러닝화 X2는 235g(270 기준)의 경량 미드솔과 카본 플레이트를 결합해 장거리 러닝에서도 발목 피로를 줄여줍니다.')
  p1.textAutoResize = 'HEIGHT'
  p1.layoutAlign = 'STRETCH'
  desc.appendChild(p1)
  const p2 = tSub(ctx, '· 초경량 EVA 미드솔 · 통기성 니트 어퍼 · 미끄럼 방지 러버 아웃솔', 12)
  desc.appendChild(p2)
  const attRow = hbox('files', 8)
  fill(attRow)
  for (const f of ['상품_상세스펙.pdf', 'KC인증서.pdf']) {
    const fr = hbox('file', 6)
    fr.counterAxisAlignItems = 'CENTER'
    pad(fr, 8, 10)
    fr.cornerRadius = R_CTRL
    bindFillVar(ctx, fr, 'color/bgSubtle', SURFACE)
    fr.appendChild(icon(ctx, '_Icon/Paperclip', 14))
    fr.appendChild(tSub(ctx, f, 12))
    attRow.appendChild(fr)
  }
  desc.appendChild(attRow)
  main.appendChild(desc)

  // 탭 — 판매 통계 / 최근 주문 / 문의(건수만 표기, 판매 통계 패널을 기본으로 그린다)
  main.appendChild(
    tabs(ctx, [
      ['판매 통계', '', true],
      ['최근 주문', '4', false],
      ['문의', '4', false],
    ]),
  )
  const chartCard = card(ctx, '최근 6개월 판매량', 12)
  chartCard.appendChild(cardHead(ctx, '최근 6개월 판매량'))
  chartCard.appendChild(
    chartSingle(ctx, 180, ['2월', '3월', '4월', '5월', '6월', '7월'], [128, 164, 142, 203, 251, 187]),
  )
  main.appendChild(chartCard)
  body.appendChild(main)

  // ── aside ──
  const aside = vbox('Aside', GAP)
  aside.counterAxisSizingMode = 'FIXED'
  aside.resize(PANEL_W + 120, 100)

  const stats = card(ctx, '재고 현황', 12)
  stats.appendChild(cardHead(ctx, '재고 현황'))
  const statsRow1 = hbox('r1', 12)
  fill(statsRow1)
  statsRow1.appendChild(statTile(ctx, '총 재고', '78개'))
  statsRow1.appendChild(statTile(ctx, '품절 옵션', '1/5', undefined, 'warning'))
  stats.appendChild(statsRow1)
  const statsRow2 = hbox('r2', 12)
  fill(statsRow2)
  statsRow2.appendChild(statTile(ctx, '6개월 판매', '1,075개'))
  statsRow2.appendChild(statTile(ctx, '미답변 문의', '1건', undefined, 'error'))
  stats.appendChild(statsRow2)
  aside.appendChild(stats)

  const visibility = card(ctx, '노출 상태', 12)
  visibility.appendChild(cardHead(ctx, '노출 상태'))
  const dispRow = hbox('disp', 10)
  dispRow.counterAxisAlignItems = 'CENTER'
  dispRow.counterAxisSizingMode = 'FIXED'
  dispRow.resize(dispRow.width, CTRL_H)
  dispRow.appendChild(toggleMini(ctx, true))
  dispRow.appendChild(tSub(ctx, '쇼핑몰 목록/검색 노출'))
  visibility.appendChild(fieldRow(ctx, '전시 노출', dispRow))
  const saleRow2 = hbox('sale2', 10)
  saleRow2.counterAxisAlignItems = 'CENTER'
  saleRow2.counterAxisSizingMode = 'FIXED'
  saleRow2.resize(saleRow2.width, CTRL_H)
  saleRow2.appendChild(toggleMini(ctx, true))
  saleRow2.appendChild(tSub(ctx, '판매중'))
  visibility.appendChild(fieldRow(ctx, '판매', saleRow2))
  aside.appendChild(visibility)

  const taxo = card(ctx, '카테고리 · 태그', 10)
  taxo.appendChild(cardHead(ctx, '카테고리 · 태그', btn(ctx, '편집', 'ghost', '_Icon/Edit', 26)))
  taxo.appendChild(tSub(ctx, '카테고리', 12))
  const catChip = hbox('cat', 6)
  catChip.appendChild(badge(ctx, '스포츠 > 러닝화', 'primary'))
  taxo.appendChild(catChip)
  taxo.appendChild(tSub(ctx, '태그', 12))
  const tagChips = hbox('tags', 6)
  ;['신상품', '베스트', '무료배송'].forEach((t) => tagChips.appendChild(badge(ctx, t, 'secondary')))
  taxo.appendChild(tagChips)
  aside.appendChild(taxo)

  // 판매 진행 = DS/StatusTimeline 인스턴스(vertical)
  const flow = card(ctx, '판매 진행', 12)
  flow.appendChild(cardHead(ctx, '판매 진행'))
  const flowInst = inst(ctx, 'DS/StatusTimeline', {
    name: 'Product Flow',
    variant: { direction: 'vertical' },
    props: {
      'Step 1': '등록',
      'Step 1 Meta': '2026-03-02',
      'Step 2': '검수',
      'Step 2 Meta': '완료',
      'Step 3': '판매중',
      'Step 3 Meta': '진행중',
      'Step 4': '판매종료',
      'Step 4 Meta': '-',
    },
  })
  flow.appendChild(flowInst ?? drawProductFlow(ctx))
  aside.appendChild(flow)

  const manager = card(ctx, '담당자', 0)
  manager.appendChild(cardHead(ctx, '담당자'))
  manager.appendChild(defRow(ctx, '담당 MD', '박엠디'))
  manager.appendChild(defRow(ctx, '등록자', '김상품'))
  const managerLast = defRow(ctx, '최근 수정', '2026-07-12 17:40')
  managerLast.strokes = []
  manager.appendChild(managerLast)
  aside.appendChild(manager)

  const quick = card(ctx, '빠른 액션', 8)
  quick.appendChild(cardHead(ctx, '빠른 액션'))
  quick.appendChild(fill(btn(ctx, '수정', 'outline', '_Icon/Edit')))
  quick.appendChild(fill(btn(ctx, '복제', 'outline', '_Icon/Copy')))
  quick.appendChild(fill(btn(ctx, '삭제', 'danger', '_Icon/Trash2')))
  aside.appendChild(quick)

  body.appendChild(aside)
  s.appendChild(body)

  const footer = hbox('Footer', 8)
  fill(footer)
  footer.counterAxisAlignItems = 'CENTER'
  footer.primaryAxisAlignItems = 'CENTER'
  pad(footer, 16, 20)
  bindFillVar(ctx, footer, 'color/bg', WHITE)
  outline(ctx, footer)
  footer.appendChild(btn(ctx, '목록', 'outline'))
  const fSp = hbox('sp', 0)
  footer.appendChild(grow(fSp))
  footer.appendChild(btn(ctx, '삭제', 'danger', '_Icon/Trash2'))
  footer.appendChild(btn(ctx, '복제', 'outline', '_Icon/Copy'))
  footer.appendChild(btn(ctx, '수정', 'outline'))
  footer.appendChild(btn(ctx, '저장', 'primary'))
  s.appendChild(footer)
  return s
}

// ══ 24. 상품 등록/수정 ═══════════════════════════════════════════════
// src/ds/ProductEditPage/ProductEditPage.tsx 1:1 — 좌 FormAnchorNav(10섹션) · 중앙 섹션 카드 ·
// 우 MobilePreview. 목데이터는 ProductEditPage.stories.tsx의 '오크 원목 1200 서랍형 책상'.
// (React ProductForm의 '상품 등록' 화면과는 다른 컴포넌트다 — 기존 12번 화면 '상품 등록'이 그 쪽이다.)
function screenProductEditPage(ctx: Ctx): FrameNode {
  const s = screenFrame(ctx, '상품 등록·수정')
  s.appendChild(
    pageHead(ctx, '상품 등록/수정', '이미지·가격·적립금·배송·옵션·SEO를 한 화면에서 편집합니다.', [
      badge(ctx, '판매중', 'success'),
      btn(ctx, '저장', 'primary', '_Icon/Save'),
    ]),
  )

  const body = hbox('Body', GAP)
  fill(body)
  body.counterAxisAlignItems = 'MIN'

  // 좌 — 앵커 내비(10섹션). DS/FormAnchorNav를 안 쓰는 이유는 위 screenProductForm과 같다 —
  // 세트는 5개 고정 섹션·아이콘 없음이라 여기 10개 아이콘 섹션과 맞지 않는다.
  const nav = vbox('Anchor Nav', 2)
  nav.counterAxisSizingMode = 'FIXED'
  nav.resize(PANEL_W, 100)
  fillH(nav)
  pad(nav, 16)
  bindFillVar(ctx, nav, 'color/bg', WHITE)
  outline(ctx, nav)
  const anchors: Array<[string, string]> = [
    ['상품 정보', '_Icon/Info'],
    ['상세 설명', '_Icon/Type'],
    ['가격', '_Icon/Coins'],
    ['적립금', '_Icon/Percent'],
    ['배송', '_Icon/Truck'],
    ['재고', '_Icon/Package'],
    ['옵션', '_Icon/Layers'],
    ['상품 강조', '_Icon/Star'],
    ['노출 설정', '_Icon/Eye'],
    ['SEO', '_Icon/Search'],
  ]
  anchors.forEach(([label, iconKey], i) => {
    const active = i === 0
    const it = hbox('Anchor / ' + label, 8)
    fill(it)
    it.counterAxisAlignItems = 'CENTER'
    pad(it, 10, 10)
    it.cornerRadius = R_CTRL
    if (active) bindFillVar(ctx, it, 'color/primary/100', tintHex(ACCENT))
    else it.fills = []
    it.appendChild(active ? icon(ctx, iconKey, 16, 'color/primary', ACCENT) : icon(ctx, iconKey, 16))
    it.appendChild(
      grow(
        wrapText(
          active
            ? boundText(ctx, label, F_BODY, 'color/primary', ACCENT, true)
            : boundText(ctx, label, F_BODY, 'color/text', INK),
        ),
      ),
    )
    nav.appendChild(it)
  })
  body.appendChild(nav)

  // 중앙 — 섹션 카드
  const form = vbox('Form', GAP)
  grow(form)

  const c1 = card(ctx, '상품 정보', 14)
  c1.appendChild(cardHead(ctx, '상품 정보'))
  const brandRow = hbox('brand', 12)
  fill(brandRow)
  brandRow.appendChild(grow(fieldRow(ctx, '브랜드', input(ctx, '브랜드를 선택하세요', 0, { value: '한샘', trailIcon: '_Icon/ChevronDown' }), true, 90)))
  brandRow.appendChild(grow(fieldRow(ctx, '1차 카테고리', input(ctx, '1차 카테고리', 0, { value: '가구', trailIcon: '_Icon/ChevronDown' }), true, 100)))
  brandRow.appendChild(grow(fieldRow(ctx, '2차 카테고리', input(ctx, '2차 카테고리', 0, { value: '책상·테이블', trailIcon: '_Icon/ChevronDown' }), false, 100)))
  c1.appendChild(brandRow)
  c1.appendChild(fieldRow(ctx, '상품명', input(ctx, '상품명을 입력하세요', 0, { value: '오크 원목 1200 서랍형 책상' }), true, 90))
  const imgsRow = hbox('imgs', 12)
  fill(imgsRow)
  for (let i = 0; i < 3; i++) imgsRow.appendChild(thumbBox(ctx, 110, 110, R_CTRL))
  const c1Drop = inst(ctx, 'DS/DropZone', {
    name: 'Product Images DropZone',
    variant: { compact: 'true' },
    props: { label: '이미지 추가', hint: 'JPG·PNG 최대 10MB(최대 8장) · 3/8' },
  })
  imgsRow.appendChild(c1Drop ? instGrow(c1Drop) : drawDropZone(ctx))
  c1.appendChild(fieldRow(ctx, '상품 이미지', imgsRow, false, 90))
  c1.appendChild(fieldRow(ctx, '요약 문구', input(ctx, '예: 3분 조립, 5년 무상 A/S', 0, { value: '3분 조립 · 5년 무상 A/S' }), false, 90))
  form.appendChild(c1)

  const c2 = card(ctx, '가격', 14)
  c2.appendChild(cardHead(ctx, '가격'))
  const priceRow = hbox('price', 12)
  fill(priceRow)
  priceRow.appendChild(grow(fieldRow(ctx, '판매가', input(ctx, '0', 0, { value: '389,000원' }), true, 80)))
  priceRow.appendChild(grow(fieldRow(ctx, '할인가', input(ctx, '0', 0, { value: '299,000원' }), false, 80)))
  priceRow.appendChild(grow(fieldRow(ctx, '할인율', input(ctx, '-', 0, { value: '23% · 90,000원 할인' }), false, 80)))
  c2.appendChild(priceRow)
  form.appendChild(c2)

  const c3 = card(ctx, '적립금 · 배송 · 재고', 14)
  c3.appendChild(cardHead(ctx, '적립금 · 배송 · 재고'))
  const pointRow = hbox('point', 12)
  fill(pointRow)
  const pointToggle = hbox('t', 8)
  pointToggle.counterAxisAlignItems = 'CENTER'
  pointToggle.counterAxisSizingMode = 'FIXED'
  pointToggle.resize(pointToggle.width, CTRL_H)
  pointToggle.appendChild(toggleMini(ctx, true))
  pointToggle.appendChild(tSub(ctx, '판매가의 3%'))
  pointRow.appendChild(grow(fieldRow(ctx, '적립금 지급', pointToggle, false, 90)))
  pointRow.appendChild(grow(fieldRow(ctx, '배송비', input(ctx, '0', 0, { value: '3,000원(5만원 이상 무료)' }), false, 90)))
  pointRow.appendChild(grow(fieldRow(ctx, '재고', input(ctx, '0', 0, { value: '42개' }), false, 90)))
  c3.appendChild(pointRow)
  form.appendChild(c3)

  const c4 = card(ctx, '옵션', 14)
  c4.appendChild(cardHead(ctx, '옵션', undefined, '3개'))
  const optCols: Col[] = [
    { label: '옵션명', w: 120 },
    { label: '옵션값', w: 220, grow: true },
    { label: '추가금액', w: 110, align: 'right' },
    { label: '재고', w: 90, align: 'right' },
  ]
  const optRows: Cell[][] = [
    ['색상', '내추럴 오크', '-', '24'],
    ['색상', '월넛', '20,000원', '18'],
    ['사이즈', '1400mm', '50,000원', '12'],
  ]
  c4.appendChild(table(ctx, MAIN_W, optCols, optRows))
  form.appendChild(c4)

  const c5 = card(ctx, '상품 강조 · 노출 설정', 12)
  c5.appendChild(cardHead(ctx, '상품 강조 · 노출 설정'))
  const highlightRow = hbox('highlights', 8)
  highlightRow.counterAxisAlignItems = 'CENTER'
  highlightRow.appendChild(badge(ctx, 'BEST', 'primary'))
  highlightRow.appendChild(badge(ctx, 'MD 추천', 'primary'))
  c5.appendChild(fieldRow(ctx, '강조 배지', highlightRow, false, 90))
  const visRow2 = hbox('vis', 10)
  visRow2.counterAxisAlignItems = 'CENTER'
  visRow2.counterAxisSizingMode = 'FIXED'
  visRow2.resize(visRow2.width, CTRL_H)
  visRow2.appendChild(toggleMini(ctx, true))
  visRow2.appendChild(tSub(ctx, '판매중 · 목록 노출 · 검색 노출'))
  c5.appendChild(fieldRow(ctx, '노출 설정', visRow2, false, 90))
  form.appendChild(c5)
  body.appendChild(form)

  // 우 — 모바일 미리보기(MobilePreview)
  const side = vbox('Preview', 12)
  side.counterAxisSizingMode = 'FIXED'
  side.resize(320, 100)
  side.appendChild(boundText(ctx, '모바일 미리보기', 14, 'color/text', INK, true))
  const phone = vbox('Mobile', 0)
  fill(phone)
  phone.clipsContent = true
  phone.cornerRadius = 20
  bindFillVar(ctx, phone, 'color/bg', WHITE)
  outline(ctx, phone, 20)
  const hero = thumbBox(ctx, 320, 200, 0)
  hero.layoutAlign = 'STRETCH'
  phone.appendChild(hero)
  const pc = vbox('Content', 10)
  fill(pc)
  pad(pc, 16)
  const tagsRow = hbox('t', 6)
  tagsRow.appendChild(badge(ctx, 'BEST', 'primary'))
  tagsRow.appendChild(badge(ctx, 'MD 추천', 'primary'))
  pc.appendChild(tagsRow)
  const pname = boundText(ctx, '오크 원목 1200 서랍형 책상', 15, 'color/text', INK, true)
  pname.textAutoResize = 'HEIGHT'
  pname.layoutAlign = 'STRETCH'
  pc.appendChild(pname)
  const priceLine = hbox('price', 8)
  priceLine.counterAxisAlignItems = 'CENTER'
  priceLine.appendChild(boundText(ctx, '23%', 15, 'color/error', TONE_HEX.error, true))
  priceLine.appendChild(boundText(ctx, '299,000원', 16, 'color/text', INK, true))
  pc.appendChild(priceLine)
  const old2 = tMuted(ctx, '389,000원', 12)
  old2.textDecoration = 'STRIKETHROUGH'
  pc.appendChild(old2)
  const cta = hbox('CTA', 8)
  fill(cta)
  const cartBtn = btn(ctx, '장바구니', 'outline', undefined, 44)
  cta.appendChild(grow(cartBtn))
  const buyBtn = btn(ctx, '렌탈하기', 'primary', undefined, 44)
  cta.appendChild(grow(buyBtn))
  pc.appendChild(cta)
  phone.appendChild(pc)
  side.appendChild(phone)
  side.appendChild(tMuted(ctx, '실제 상세페이지와 다르게 보일 수 있어요', 11))
  body.appendChild(side)

  s.appendChild(body)

  const footer = hbox('Footer', 8)
  fill(footer)
  footer.counterAxisAlignItems = 'CENTER'
  footer.primaryAxisAlignItems = 'CENTER'
  pad(footer, 16, 20)
  bindFillVar(ctx, footer, 'color/bg', WHITE)
  outline(ctx, footer)
  footer.appendChild(btn(ctx, '취소', 'outline'))
  const fSp2 = hbox('sp', 0)
  footer.appendChild(grow(fSp2))
  footer.appendChild(btn(ctx, '임시저장', 'outline'))
  footer.appendChild(btn(ctx, '저장', 'primary'))
  s.appendChild(footer)
  return s
}

// ── 생성 ─────────────────────────────────────────────────────────────
// [화면 이름, 빌더, 사이드바 active 메뉴]. 배열 순서 = 캔버스 세로 배치 순서이며 사이드바 메뉴 순서를 따른다.
// 'none' = 메뉴에 없는 화면(공지사항) — 사이드바는 그리되 아무 항목도 강조하지 않는다.
const SCREEN_BUILDERS: Array<[string, (ctx: Ctx) => FrameNode, AdminActive]> = [
  ['대시보드', screenDashboard, 'dashboard'],
  ['고객 목록', screenMemberList, 'users'],
  ['고객 상세', screenCustomerDetail, 'users'],
  // 오너 확정 사이드바의 실제 '사용자' 라우트(CustomerList) — 위 '고객 목록'(MemberList)과는 다른 컴포넌트다.
  ['사용자 목록', screenCustomerList, 'users'],
  ['운영진', screenStaffList, 'staff'],
  ['카테고리 관리', screenCategoryList, 'categories'],
  ['카테고리 등록', screenCategoryForm, 'categories'],
  ['상품 목록', screenProductList, 'products'],
  ['상품 등록', screenProductForm, 'products'],
  ['상품 상세', screenProductDetail, 'products'],
  ['상품 등록·수정', screenProductEditPage, 'products'],
  ['주문 목록', screenOrderList, 'orders'],
  ['문의 내역', screenInquiryList, 'inquiries'],
  ['문의 상세', screenInquiryDetail, 'inquiries'],
  ['시공 문의 내역', screenInquiryManageList, 'inquiries'],
  ['시공 문의 상세', screenInquiryManageDetail, 'inquiries'],
  ['문의 설정', screenInquirySettings, 'inquiries'],
  ['회사소개 관리', screenCompanyForm, 'about'],
  ['연혁 관리', screenHistoryList, 'history'],
  ['포트폴리오 관리', screenPortfolioList, 'portfolio'],
  ['포트폴리오 등록', screenPortfolioForm, 'portfolio'],
  ['메인비주얼 관리', screenMainVisualList, 'mainvisual'],
  ['메인비주얼 등록', screenMainVisualForm, 'mainvisual'],
  ['공지사항', screenNotice, 'none'],
]

/** 어드민 화면 24종을 1920 폭 프레임(사이드바 + 콘텐츠)으로 생성한다(세로 나열). */
export async function generateScreens(
  fontFamily: string,
  colors?: Record<string, string>,
  preset?: PresetName,
): Promise<string[]> {
  const ctx = await setup(fontFamily, colors, preset)
  warnedMissing.clear() // 실행마다 세트 누락 경고를 새로 낸다
  if (!ctx.vars.get('color/primary')) {
    ctx.warnings.push("Variables가 없습니다 — '토큰'을 먼저 생성하세요(화면 색이 프리셋과 연결되지 않습니다).")
  }
  if (!figma.root.children.some((p) => p.name.indexOf('Icon System') >= 0)) {
    ctx.warnings.push('Icon System 페이지가 없어 화면 아이콘이 인라인 폴백됩니다 — 함께 생성하는 것을 권장합니다.')
  }
  // 세트가 없으면(= 이번 실행에서 어드민 컴포넌트를 안 만들었으면) 파일에 이미 있는 PAGE_ADMIN
  // 페이지에서 세트를 입양해 본다. 그것도 없으면 24화면 전부 직접 그리기로 내려간다
  // → 그 상태에서는 컴포넌트를 고쳐도 화면이 안 바뀌므로 분명히 경고한다.
  // 페이지 이름은 admin.ts의 PAGE_ADMIN을 그대로 쓴다(문자열을 두 곳에 적으면 개명 때 한쪽만 바뀐다).
  if (ADMIN_SETS.size === 0) {
    const adopted = adoptAdminSets()
    if (adopted > 0) {
      ctx.warnings.push(`'${PAGE_ADMIN}'의 기존 컴포넌트 세트 ${adopted}개로 화면을 조립합니다.`)
    } else {
      ctx.warnings.push(
        `'${PAGE_ADMIN}' 컴포넌트 세트가 없습니다 — 화면을 직접 그립니다. ` +
          "'어드민 컴포넌트' 스코프를 함께 켜면 화면이 컴포넌트 인스턴스로 조립됩니다.",
      )
    }
  }
  if (figma.root.children.some((p) => p.name === PAGE_SCREENS)) {
    ctx.warnings.push(`페이지 '${PAGE_SCREENS}' 이미 존재 — 건너뜀(재생성하려면 '기존 삭제 후 재생성').`)
    return ctx.warnings
  }

  const page = figma.createPage()
  page.name = PAGE_SCREENS
  applyPageColorMode(ctx, page)

  let y = 0
  for (const [name, build, active] of SCREEN_BUILDERS) {
    try {
      // 콘텐츠 열을 만든 뒤 사이드바와 함께 셸로 감싼다 — 화면 프레임(Screen/*)은 항상 셸이다.
      const frame = screenShell(ctx, name, build(ctx), active)
      page.appendChild(frame)
      frame.x = 0
      frame.y = y
      // 인스턴스 내부는 건너뛴다 — 세트(15. Admin)에서 이미 바인딩됐다(위 주석 참고).
      bindTokens(ctx, frame, { skipInstances: true }) // 보더·패딩·간격·라운드·불투명도 변수 바인딩(화면당 1회)
      y += frame.height + SCREEN_GAP
    } catch (e) {
      ctx.warnings.push(`Screen/${name} 생성 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return ctx.warnings
}
