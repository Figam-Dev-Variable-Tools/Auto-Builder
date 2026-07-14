// 어드민(관리자 화면) 컴포넌트 문서 — 스토리북 src/ds의 어드민 계열을 Figma 베리언트 세트로.
// 공용 machinery(setup/makeRoot/makeHeader/makeSection)는 foundations, 세트 빌더와 variantItem은
// lib/build-set.ts가 정본이다 — 예전엔 이 파일에 복제해 뒀지만 사본은 전부 지웠다(CLAUDE.md §0-2).
// 대상: AdminSidebar · AdminTopbar · AdminTable · AdminCard · ViewSwitch · SearchPanel ·
//       CrudDialog · DropZone · StatusTimeline · TodoSummary · ActivityLog · MemoBox · DefinitionList
//
// screens.ts(17)가 실제로 inst()로 꺼내 쓰는 건 이 중 8개뿐이다(AdminSidebar·AdminTopbar·AdminTable·
// DropZone·StatusTimeline·TodoSummary·MemoBox·DefinitionList). 조사 기록(2026-07 모듈화 검토):
// 나머지 AdminCard·ViewSwitch·SearchPanel·CrudDialog·ActivityLog는 화면 어디에도 안 쓰인다 —
// 화면에 대응하는 것처럼 보이는 자리를 각각 대조해 봤지만 구조가 다르다.
//   · AdminCard  — 썸네일+메타+뱃지가 고정된 '상품 카드' 하나다. 화면의 card()/cardHead()는
//     임의 children을 감싸는 범용 섹션 컨테이너라 다른 물건이다(위 icon() 앞 주석 참고).
//   · ViewSwitch — 카드/보드 세그먼트 스위치(둥근 필 하나). 상품 목록 툴바의 두 iconBtn(그리드·새로고침)은
//     서로 독립된 사각 버튼 2개라 모양이 다르다 — 갈아 끼우면 렌더가 바뀐다.
//   · SearchPanel — 라벨-위·입력-아래 2열 그리드 + 접기 + [초기화][검색] 카드다. 화면의 toolbar()는
//     라벨 없는 한 줄 인라인 검색바라 레이아웃 자체가 다르다.
//   · CrudDialog — 모달이다. 17개 화면 중 열려 있는 모달을 그리는 화면이 없다.
//   · ActivityLog — 아이콘 칩 + 문장 + 시각 한 줄이다. 대시보드의 '최근 주문/판매 신청' 피드는
//     썸네일 + 이름 + 작성자·날짜 두 줄이라 구조가 다르다.
// 위 다섯은 그대로 두었다 — 억지로 끼워 맞추면 화면 렌더가 바뀐다(이번 작업 금지 사항).
import {
  type Ctx,
  solid,
  boundPaint,
  bindFillVar,
  bindStrokeVar,
  boundText,
  bindTokens,
  autoFrame,
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
import { buildSet, addTextProp, addBoolProp, addSwapProp, variantItem, type Axis, type TextProp, type PropSpec, type State } from './lib/build-set'
// screens.ts가 './admin'에서 propKeys를 가져간다 — 정본은 lib/build-set.ts, 여기선 경로만 유지한다.
export { propKeys } from './lib/build-set'
import { solidToneHex, onToneHex, solidVarName, onVarName } from './tone'
// recolorIcon의 정본은 categories-shared.ts다 — 이 파일은 예전에 같은 구현을 복제하고 있었다
// (raw solid() strokes라 verify-bindings B1도 걸렸다).
import { recolorIcon } from './categories-shared'
// 사이드바 메뉴의 단일 소스 — 화면(17)도 같은 모듈을 본다(라벨을 두 곳에 쓰지 않는다).
import { ADMIN_MENU, ADMIN_ACTIVE_VALUES, groupOfActive, type AdminMenuItem } from './admin-menu'
import type { PresetName } from '../presets'

// 오너 규칙: 페이지 탭은 "순번. System - 이름". 카테고리(1~14) 다음 번호.
// 오너 확정(2026-07 개편): '15. System - Admin' → '15. System - Admin Component'로 개명.
// site.ts가 이 이름을 임포트해 SortBar·InfoCard 세트를 여기로 옮겨 그리므로 export한다.
export const PAGE_ADMIN = '15. System - Admin Component'
// reset 대상 등록용 — reset.ts가 이 배열을 함께 삭제해야 재생성이 된다.
// 옛 이름('15. System - Admin')도 남겨 둔다 — 안 그러면 개명 전 파일의 유령 페이지가 영영 안 지워진다.
export const ADMIN_PAGE_NAMES = [PAGE_ADMIN, '15. System - Admin']

// ── 어드민 컴포넌트 세트 레지스트리 ───────────────────────────────────
// 아이콘의 ICON_COMPONENTS와 같은 패턴. generateAdmin이 세트를 만들 때마다 여기에 등록하고,
// '17. System - Admin Pages'(screens.ts)는 이 맵에서 세트를 꺼내 인스턴스로 화면을 조립한다.
// → 컴포넌트를 고치면 화면이 따라 바뀐다(오너 지적의 핵심).
// 어드민 컴포넌트 스코프를 끄고 화면만 생성하면 이 맵은 비어 있고, screens.ts는 직접 그리는 폴백으로 내려간다.
export const ADMIN_SETS = new Map<string, ComponentSetNode>()

/**
 * 살아 있는 세트만 반환. '기존 삭제 후 재생성'으로 페이지가 지워지면 맵에는 removed=true인
 * 유령 노드가 남는다 — 그걸 createInstance하면 예외가 난다.
 */
export function adminSet(name: string): ComponentSetNode | null {
  const set = ADMIN_SETS.get(name)
  if (!set) return null
  try {
    if (set.removed) {
      ADMIN_SETS.delete(name)
      return null
    }
  } catch {
    ADMIN_SETS.delete(name)
    return null
  }
  return set
}

/**
 * 이미 있는 '15. System - Admin Component' 페이지의 컴포넌트 세트를 레지스트리에 입양한다.
 * 어드민 컴포넌트 스코프를 끄고 화면만 다시 돌려도 인스턴스 조립 경로가 살아 있게 하는 장치.
 */
export function adoptAdminSets(): number {
  const page = figma.root.children.find((p) => p.name === PAGE_ADMIN)
  if (!page) return 0
  let n = 0
  for (const node of page.children) {
    if (node.type === 'COMPONENT_SET') {
      ADMIN_SETS.set(node.name, node)
      n++
    }
  }
  return n
}

// 톤 → 폴백 hex(변수 없을 때만 쓰는 리터럴). 출처: categories.ts VARIANT_HEX
const VARIANT_HEX: Record<string, string> = {
  primary: ACCENT,
  secondary: SUB,
  error: '#F04452',
  success: '#00C471',
  warning: '#FF9F0A',
}
// soft 배경 폴백 — color/<tone>/100 변수가 없을 때만. 출처: categories.ts tintHex
function tintHex(hex: string, amt = 0.86): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = (n >> 16) & 255
  const g = (n >> 8) & 255
  const b = n & 255
  const mix = (c: number) => Math.round(c + (255 - c) * amt)
  return '#' + ((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, '0')
}

// boundText·bindFillVar·bindStrokeVar·bindTokens의 정본은 lib/bind.ts다(foundations.ts가 재수출) —
// 예전엔 categories.ts·layout-guide.ts·screens.ts·site.ts·site-screens.ts와 합쳐 6벌로 복제돼
// 있었다(verify-bindings B4).

// ── solid 면 · on-color 바인딩 (출처: categories.ts — 같은 규칙) ──────
// 오너 확정: 브랜드 hue는 유지하되 solid 면 위 글자는 흰색이 기본.
//   면 = color/solid-<tone> · 글자·아이콘 = color/on-<tone> (tokens.ts가 base에서 계산해 생성)
/** 톤의 base hex — 사용자가 고른 색 > 프리셋 폴백. 변수가 없을 때만 쓰인다. */
function toneBase(ctx: Ctx, tone: string): string {
  return ctx.userColors['color/' + tone] || VARIANT_HEX[tone] || ACCENT
}
/** solid 면 fill — color/solid-<tone> 바인딩(없으면 같은 공식으로 계산한 hex). */
function bindSolidFill(ctx: Ctx, node: GeometryMixin, tone: string) {
  bindFillVar(ctx, node, solidVarName(tone), solidToneHex(toneBase(ctx, tone)))
}
/** solid 면 위 도형(노브 등) fill — color/on-<tone> 바인딩. */
function bindOnFill(ctx: Ctx, node: GeometryMixin, tone: string) {
  bindFillVar(ctx, node, onVarName(tone), onToneHex(toneBase(ctx, tone)))
}
/** solid 면 위 전경 hex(폴백). */
function onHex(ctx: Ctx, tone: string): string {
  return onToneHex(toneBase(ctx, tone))
}
// bindTokens의 정본은 lib/bind.ts, recolorIcon의 정본은 categories-shared.ts다(위 import) —
// 둘 다 여기 있던 사본을 지웠다(recolorIcon의 raw solid() strokes가 verify-bindings B1이었다).
/** 아이콘 색을 변수에 바인딩(없으면 hex) — 글자와 같은 색 토큰을 따라간다. */
function recolorIconVar(ctx: Ctx, node: SceneNode, varName: string, hex: string) {
  const f = node as unknown as { findAll?: (cb: (n: SceneNode) => boolean) => SceneNode[] }
  if (typeof f.findAll !== 'function') return
  const vv = ctx.vars.get(varName)
  const paint = vv ? boundPaint(vv) : solid(ctx.userColors[varName] ?? hex)
  for (const v of f.findAll((n) => n.type === 'VECTOR')) (v as VectorNode).strokes = [paint]
}
/** solid 면 위 아이콘 인스턴스 — color/on-<tone> 바인딩. */
function iconOn(ctx: Ctx, key: string, name: string, size: number, tone: string): SceneNode {
  const ic = iconInstance(key, name, size)
  recolorIconVar(ctx, ic, onVarName(tone), onHex(ctx, tone))
  return ic
}
/** 크기 고정 프레임. 출처: categories.ts fixedFrame */
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
/** 색 지정 아이콘 인스턴스. */
function icon(key: string, name: string, size: number, hex: string): SceneNode {
  const ic = iconInstance(key, name, size)
  recolorIcon(ic, hex)
  return ic
}


// 베리언트 세트 빌더 + 속성 헬퍼 + State는 lib/build-set.ts가 정본이다(사본 금지).
/** 타깃이 ES2017이라 Array.flatMap이 없다 — 행 단위로 만든 속성 묶음을 펼친다. */
function flatProps(groups: TextProp[][]): TextProp[] {
  const out: TextProp[] = []
  for (const g of groups) for (const t of g) out.push(t)
  return out
}
type ComponentDoc = {
  key: string
  setName: string
  eyebrow: string
  desc: string
  build: (ctx: Ctx, page: PageNode) => ComponentSetNode
  states: State[]
}
type CategoryDef = { pageName: string; title: string; subtitle: string; docs: ComponentDoc[] }


// ══ 어드민 공용 조각(atoms) ══════════════════════════════════════════
/** soft 톤 배지(pill). tone = primary|secondary|error|success|warning */
function badge(ctx: Ctx, label: string, tone: string, layer: string): FrameNode {
  const toneHex = VARIANT_HEX[tone] ?? ACCENT
  const b = autoFrame(layer + ' Chip', 'HORIZONTAL')
  b.counterAxisAlignItems = 'CENTER'
  b.paddingTop = b.paddingBottom = 2
  b.paddingLeft = b.paddingRight = 7
  b.cornerRadius = 6
  bindFillVar(ctx, b, `color/${tone}/100`, tintHex(toneHex))
  const t = boundText(ctx, label, 11, `color/${tone}`, toneHex, true)
  t.name = layer
  b.appendChild(t)
  return b
}

type BtnKind = 'primary' | 'outline' | 'error' | 'ghost'
/**
 * 버튼 — solid(primary/error) · outline · ghost. 라벨 레이어 이름을 지정해 텍스트 속성에 연결.
 * layer = 라벨 텍스트 레이어 이름(= React string prop 이름 그대로). 규약 §4·§6.
 */
function btn(ctx: Ctx, label: string, kind: BtnKind, layer: string, size: 'sm' | 'md' = 'md'): FrameNode {
  const b = autoFrame(layer.replace(' Label', '') + ' Button', 'HORIZONTAL')
  b.counterAxisAlignItems = 'CENTER'
  b.itemSpacing = 6
  b.paddingTop = b.paddingBottom = size === 'sm' ? 7 : 10
  b.paddingLeft = b.paddingRight = size === 'sm' ? 12 : 16
  b.cornerRadius = 8
  const fs = size === 'sm' ? 13 : 14
  // solid(primary/error) = color/solid-<tone> 면 + color/on-<tone> 글자.
  const tone = kind === 'error' ? 'error' : 'primary'
  let fgVar = onVarName(tone)
  let fgHex = onHex(ctx, tone)
  if (kind === 'primary' || kind === 'error') bindSolidFill(ctx, b, tone)
  else {
    fgVar = 'color/text'
    fgHex = INK
    if (kind === 'outline') {
      bindFillVar(ctx, b, 'color/bg', WHITE)
      bindStrokeVar(ctx, b, 'color/border', BORDER)
      b.strokeWeight = 1
      b.strokeAlign = 'INSIDE'
    } else {
      b.fills = []
      fgVar = 'color/secondary'
      fgHex = SUB
    }
  }
  const t = boundText(ctx, label, fs, fgVar, fgHex, true)
  t.name = layer
  b.appendChild(t)
  return b
}

/**
 * 정사각 고스트 아이콘 버튼(행/카드의 수정·삭제).
 * iconLayer — 안쪽 아이콘 인스턴스의 레이어 이름. INSTANCE_SWAP 속성은 레이어 이름으로 붙으므로
 * React의 ReactNode prop 이름(editIcon·deleteIcon)을 그대로 줘야 규약 §5가 성립한다.
 */
function iconBtn(ctx: Ctx, key: string, name: string, hex = SUB, size = 28, iconLayer?: string): FrameNode {
  const b = fixedFrame(name, 'HORIZONTAL', size, size)
  b.primaryAxisAlignItems = 'CENTER'
  b.counterAxisAlignItems = 'CENTER'
  b.cornerRadius = 6
  b.fills = []
  b.appendChild(icon(key, iconLayer ?? name + ' Icon', 15, hex))
  return b
}

/** 체크박스 — 18px. checked면 primary 채움 + 흰 체크. */
function checkBox(ctx: Ctx, checked: boolean, name = 'Checkbox'): FrameNode {
  const c = fixedFrame(name, 'HORIZONTAL', 18, 18)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.cornerRadius = 4
  if (checked) {
    // 체크됨 = solid 면 + on-color 체크
    bindSolidFill(ctx, c, 'primary')
    c.appendChild(iconOn(ctx, '_Icon/Check', 'Check', 12, 'primary'))
  } else {
    bindFillVar(ctx, c, 'color/bg', WHITE)
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }
  return c
}

/** 작은 토글 스위치(상태 ON/OFF). */
function toggleSw(ctx: Ctx, on: boolean, name = 'Toggle'): FrameNode {
  const track = fixedFrame(name, 'HORIZONTAL', 36, 20)
  track.primaryAxisAlignItems = on ? 'MAX' : 'MIN'
  track.counterAxisAlignItems = 'CENTER'
  track.paddingLeft = track.paddingRight = 2
  track.cornerRadius = 10
  // 켜짐 = solid 면 + on-color 노브
  if (on) bindSolidFill(ctx, track, 'primary')
  else bindFillVar(ctx, track, 'color/border', BORDER)
  const knob = figma.createEllipse()
  knob.resize(16, 16)
  if (on) bindOnFill(ctx, knob, 'primary')
  else bindFillVar(ctx, knob, 'color/bg', WHITE)
  track.appendChild(knob)
  return track
}

/** 썸네일 플레이스홀더 — bgSubtle + Image 아이콘. 출처 아이디어: categories.ts imgBox */
function thumbBox(ctx: Ctx, w: number, h: number, iconSize: number, name = 'Thumb'): FrameNode {
  const f = fixedFrame(name, 'HORIZONTAL', w, h)
  f.primaryAxisAlignItems = 'CENTER'
  f.counterAxisAlignItems = 'CENTER'
  f.cornerRadius = 6
  f.clipsContent = true
  bindFillVar(ctx, f, 'color/bgSubtle', SURFACE)
  f.appendChild(icon('_Icon/Image', 'Thumb Icon', iconSize, MUTED))
  return f
}

/** 사용자 아바타 — 원형 + 사람 아이콘. */
function avatar(ctx: Ctx, size: number, name = 'Avatar'): FrameNode {
  const a = fixedFrame(name, 'HORIZONTAL', size, size)
  a.primaryAxisAlignItems = 'CENTER'
  a.counterAxisAlignItems = 'CENTER'
  a.cornerRadius = 999
  bindFillVar(ctx, a, 'color/bgSubtle', SURFACE)
  a.appendChild(icon('_Icon/Person', name + ' Icon', Math.round(size * 0.55), SUB))
  return a
}

/**
 * 검색 패널의 입력 필드(라벨 상단 + 컨트롤). trailing 아이콘 옵션.
 * 라벨 레이어를 CSS 클래스 이름 'label'로 둔다 — SearchPanel의 showLabels(BOOLEAN)가
 * 이름으로 붙어 4개 필드 라벨을 한 번에 끄고 켠다(규약 §3·§6).
 */
function searchField(ctx: Ctx, label: string, value: string, w: number, iconKey?: string): FrameNode {
  const cell = fixedFrame('field', 'VERTICAL', w, 62)
  cell.itemSpacing = 6
  const lb = boundText(ctx, label, 12, 'color/secondary', SUB, true)
  lb.name = 'label'
  cell.appendChild(lb)
  const ctrl = fixedFrame('control', 'HORIZONTAL', w, 36)
  ctrl.counterAxisAlignItems = 'CENTER'
  ctrl.paddingLeft = ctrl.paddingRight = 10
  ctrl.itemSpacing = 6
  ctrl.cornerRadius = 8
  bindFillVar(ctx, ctrl, 'color/bg', WHITE)
  bindStrokeVar(ctx, ctrl, 'color/border', BORDER)
  ctrl.strokeWeight = 1
  ctrl.strokeAlign = 'INSIDE'
  const v = boundText(ctx, value, 13, 'color/secondary/400', MUTED)
  v.layoutGrow = 1
  ctrl.appendChild(v)
  if (iconKey) ctrl.appendChild(icon(iconKey, 'Field Icon', 15, MUTED))
  cell.appendChild(ctrl)
  return cell
}

/** 아래쪽 1px 보더(행 구분선). 출처: categories.ts bottomBorder */
function bottomBorder(ctx: Ctx, node: FrameNode | ComponentNode) {
  bindStrokeVar(ctx, node, 'color/border', BORDER)
  node.strokeAlign = 'INSIDE'
  node.strokeTopWeight = 0
  node.strokeLeftWeight = 0
  node.strokeRightWeight = 0
  node.strokeBottomWeight = 1
}
/** 오른쪽 1px 보더(칸 구분선). */
function rightBorder(ctx: Ctx, node: FrameNode | ComponentNode) {
  bindStrokeVar(ctx, node, 'color/border', BORDER)
  node.strokeAlign = 'INSIDE'
  node.strokeTopWeight = 0
  node.strokeLeftWeight = 0
  node.strokeBottomWeight = 0
  node.strokeRightWeight = 1
}

// ══ DS/AdminSidebar ══════════════════════════════════════════════════
// 축: collapsed(false|true) × active(선택 항목 id). 폭 240 / 64(미니).
//
// 메뉴 라벨·아이콘·서브메뉴는 admin-menu.ts(ADMIN_MENU)가 단일 소스다 — 여기서 배열을 다시 쓰지 않는다.
// active를 베리언트 축으로 뽑은 이유: 화면(17)마다 '지금 어느 메뉴인지'가 달라야 하는데,
// 라벨은 TEXT 속성으로 노출되지 않고 인스턴스 내부 레이어를 화면이 만지는 것도 금지(파일 헤더 규약)라
// 선택 상태를 컴포넌트가 스스로 갖는 축으로 만드는 게 유일한 정답이다.
// 예전 hasSubmenu 축은 사라졌다 — 서브메뉴는 '선택 항목이 속한 그룹'만 펼친다(스토리북 AdminShell과 동일).
function renderAdminSidebar(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const collapsed = combo.collapsed === 'true'
  const active = combo.active ?? 'none'
  const openGroup = groupOfActive(active) // 서브메뉴를 펼칠 그룹(없으면 전부 접힘)
  const w = collapsed ? 64 : 240

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 4
  c.paddingTop = c.paddingBottom = 12
  c.paddingLeft = c.paddingRight = collapsed ? 8 : 12
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeAlign = 'INSIDE'
  c.strokeTopWeight = 0
  c.strokeBottomWeight = 0
  c.strokeLeftWeight = 0
  c.strokeRightWeight = 1

  // 브랜드 — 헤더(72) 높이와 맞춘다.
  const brand = autoFrame('brand', 'HORIZONTAL')
  brand.layoutAlign = 'STRETCH'
  brand.primaryAxisSizingMode = 'FIXED'
  brand.primaryAxisAlignItems = collapsed ? 'CENTER' : 'MIN'
  brand.counterAxisAlignItems = 'CENTER'
  brand.itemSpacing = 8
  brand.paddingLeft = collapsed ? 0 : 8
  brand.paddingTop = brand.paddingBottom = 12
  const logo = icon('_Icon/Sparkles', 'Brand Icon', 22, ACCENT)
  brand.appendChild(logo)
  if (!collapsed) {
    const bt = boundText(ctx, 'Admin Console', 16, 'color/text', INK, true)
    bt.name = 'Brand'
    brand.appendChild(bt)
  }
  c.appendChild(brand)

  // 섹션 타이틀(미니 모드에선 자리가 없다)
  if (!collapsed) {
    const st = boundText(ctx, '메뉴', 11, 'color/secondary/400', MUTED, true)
    st.name = 'Section Title'
    const stw = autoFrame('section title', 'HORIZONTAL')
    stw.layoutAlign = 'STRETCH'
    stw.paddingLeft = 12
    stw.paddingTop = 8
    stw.paddingBottom = 4
    stw.appendChild(st)
    c.appendChild(stw)
  }

  // 메뉴 행 — hot = 선택됐거나(단일 항목) 선택된 자식을 품은 그룹. pill 배경은 '정확히 선택된 항목'만 받는다.
  const row = (item: AdminMenuItem, selected: boolean, hot: boolean, expanded: boolean) => {
    const r = autoFrame('nav', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.primaryAxisAlignItems = collapsed ? 'CENTER' : 'MIN'
    r.counterAxisAlignItems = 'CENTER'
    r.itemSpacing = 10
    r.paddingTop = r.paddingBottom = 10
    r.paddingLeft = r.paddingRight = collapsed ? 0 : 12
    r.cornerRadius = 8
    if (selected) bindFillVar(ctx, r, 'color/primary/50', tintHex(ACCENT, 0.92))
    r.appendChild(icon(item.iconKey, item.iconLayer, 18, hot ? ACCENT : SUB))
    if (!collapsed) {
      const t = boundText(ctx, item.label, 14, hot ? 'color/primary' : 'color/text', hot ? ACCENT : INK, hot)
      t.name = item.label
      t.layoutGrow = 1
      r.appendChild(t)
      if (item.badge) r.appendChild(badge(ctx, item.badge, 'primary', 'Badge'))
      // chevron 방향이 곧 펼침 상태다(펼침 ▽ / 접힘 ▷). 미니 모드에선 자리가 없어 생략.
      if (item.children && item.children.length)
        r.appendChild(icon(expanded ? '_Icon/ChevronDown' : '_Icon/ChevronRight', 'Chevron', 14, MUTED))
    }
    return r
  }

  for (const item of ADMIN_MENU) {
    const kids = item.children ?? []
    const selected = kids.length === 0 && item.id === active // 단일 항목이 곧 선택 항목
    const inPath = kids.length > 0 && openGroup === item // 선택된 자식을 품은 그룹
    // 펼침은 미니 모드에서 접히지만, 강조(hot)는 남는다 — 미니에선 아이콘 색이 유일한 '현재 위치' 단서다.
    const expanded = inPath && !collapsed
    c.appendChild(row(item, selected, selected || inPath, expanded))

    // 서브메뉴 — 선택된 항목이 속한 그룹만 펼친다. 미니 모드에선 펼칠 자리가 없어 숨긴다(스토리북과 동일).
    if (!expanded) continue
    const sub = autoFrame('submenu', 'VERTICAL')
    sub.layoutAlign = 'STRETCH'
    sub.primaryAxisSizingMode = 'AUTO'
    sub.itemSpacing = 2
    sub.paddingTop = sub.paddingBottom = 2
    kids.forEach((kid, i) => {
      const on = kid.id === active
      const s = autoFrame('subitem', 'HORIZONTAL')
      s.layoutAlign = 'STRETCH'
      s.primaryAxisSizingMode = 'FIXED'
      s.counterAxisAlignItems = 'CENTER'
      s.paddingTop = s.paddingBottom = 8
      s.paddingLeft = 40
      s.paddingRight = 12
      s.cornerRadius = 8
      if (on) bindFillVar(ctx, s, 'color/primary/50', tintHex(ACCENT, 0.92))
      const t = boundText(ctx, kid.label, 13, on ? 'color/primary' : 'color/secondary', on ? ACCENT : SUB, on)
      t.name = 'Sub ' + (i + 1)
      s.appendChild(t)
      sub.appendChild(s)
    })
    c.appendChild(sub)
  }
  return c
}

// ══ DS/AdminTopbar ═══════════════════════════════════════════════════
// 축: stacked(false|true) × surface(bar|plain).
//   bar   = 흰 면 + 하단 보더 + 좌우 24 패딩(셸 상단에 붙는 topbar). 타이틀만 72 / 브레드크럼·설명 104.
//   plain = 면·보더·패딩 없이 높이 hug — 화면(17)의 페이지 헤더가 쓰는 변형.
//           bgSubtle 위에 그대로 얹히므로 흰 띠가 생기지 않는다.
function renderAdminTopbar(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const stacked = combo.stacked === 'true'
  const plain = combo.surface === 'plain'
  const h = stacked ? 104 : 72
  const w = 760

  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, h)
  c.primaryAxisAlignItems = 'SPACE_BETWEEN'
  c.counterAxisAlignItems = 'CENTER'
  if (plain) {
    // 높이 hug — resize 뒤에 세워야 FIXED로 얼지 않는다(가로 레이아웃의 counter축 = 높이).
    c.counterAxisSizingMode = 'AUTO'
    c.fills = []
    c.strokes = []
  } else {
    c.paddingLeft = c.paddingRight = 24
    bindFillVar(ctx, c, 'color/bg', WHITE)
    bottomBorder(ctx, c)
  }

  // 좌: 브레드크럼 + 타이틀 + 설명
  const left = autoFrame('headings', 'VERTICAL')
  left.itemSpacing = 4
  if (stacked) {
    // 레이어 이름 = 바인딩된 prop 이름(showBreadcrumb) — CSS에 breadcrumb 클래스가 없어 N6의
    // '바인딩된 레이어는 prop 이름을 쓸 수 있다'를 따른다. 예전 이름('breadcrumb')은 BOOLEAN이
    // 찾는 레이어와 달라 토글이 아무 노드에도 안 붙어 있었다.
    const crumb = autoFrame('showBreadcrumb', 'HORIZONTAL')
    crumb.counterAxisAlignItems = 'CENTER'
    crumb.itemSpacing = 6
    const trail: Array<[string, boolean]> = [
      ['홈', false],
      ['상품 관리', false],
      ['상품 목록', true],
    ]
    trail.forEach(([label, current], i) => {
      if (i > 0) crumb.appendChild(boundText(ctx, '›', 12, 'color/secondary/400', MUTED))
      const t = boundText(
        ctx,
        label,
        12,
        current ? 'color/text' : 'color/secondary',
        current ? INK : SUB,
        current,
      )
      t.name = 'Crumb ' + (i + 1)
      crumb.appendChild(t)
    })
    left.appendChild(crumb)
  }
  // plain(화면 페이지 헤더)은 셸 topbar보다 한 단계 큰 활자를 쓴다 — 화면 규격 24/14.
  const title = boundText(ctx, '상품 목록', plain ? 24 : 20, 'color/text', INK, true)
  title.name = 'title'
  left.appendChild(title)
  if (stacked) {
    const desc = boundText(
      ctx,
      '등록된 상품을 확인하고 판매 상태를 관리합니다.',
      plain ? 14 : 13,
      'color/secondary',
      SUB,
    )
    desc.name = 'description'
    left.appendChild(desc)
  }
  c.appendChild(left)

  // 우: 액션 슬롯 + 사용자
  const right = autoFrame('right', 'HORIZONTAL')
  right.counterAxisAlignItems = 'CENTER'
  right.itemSpacing = 16

  // 레이어 이름 = CSS 모듈 클래스 이름(actions·user) — 규약 §6.
  // 예전엔 프레임이 'Actions'/'User'인데 BOOLEAN은 레이어 'Show Actions'/'Show User'를 찾아
  // 아무 노드에도 안 붙었다 → screens.ts의 'Show Actions': false가 조용히 먹지 않았다.
  const actions = autoFrame('actions', 'HORIZONTAL')
  actions.counterAxisAlignItems = 'CENTER'
  actions.itemSpacing = 8
  actions.appendChild(btn(ctx, '엑셀 다운로드', 'outline', 'Action 1 Label', 'sm'))
  actions.appendChild(btn(ctx, '상품 등록', 'primary', 'Action 2 Label', 'sm'))
  right.appendChild(actions)

  const user = autoFrame('user', 'HORIZONTAL')
  user.counterAxisAlignItems = 'CENTER'
  user.itemSpacing = 8
  const utext = autoFrame('user text', 'VERTICAL')
  utext.counterAxisAlignItems = 'MAX'
  utext.itemSpacing = 2
  const uname = boundText(ctx, '홍길동', 13, 'color/text', INK, true)
  uname.name = 'user.name'
  utext.appendChild(uname)
  const urole = boundText(ctx, '운영 관리자', 11, 'color/secondary/400', MUTED)
  urole.name = 'user.role'
  utext.appendChild(urole)
  user.appendChild(utext)
  // 레이어 이름 = prop 이름 — showAvatar(BOOLEAN)가 아바타만 끈다(이름/역할 텍스트는 남는다).
  user.appendChild(avatar(ctx, 32, 'showAvatar'))
  right.appendChild(user)

  c.appendChild(right)
  return c
}

// ══ DS/AdminTable ════════════════════════════════════════════════════
// 축: density(comfortable|compact) × frame(card|flush).
//   density — 행 56 / 44.
//   frame   — card: 자체 보더·라운드를 가진 카드형(문서·단독 배치용).
//             flush: 보더·라운드 없음 → 화면(17)에서 이미 카드 안(툴바·페이지네이션과 한 몸)에 놓일 때.
//               카드 안에 카드가 겹쳐 보더가 이중으로 겹치는 사고를 막는다.
// 컬럼은 전부 BOOLEAN 속성 'Show <컬럼>'으로 켜고 끈다(레포 규약: 열 단위 ON/OFF = columnVisibility).
// 컬럼 폭·행 데이터는 '3. 상품 목록' 화면과 같은 값이다 — 화면이 이 세트의 인스턴스이기 때문.
const TBL_COLS = {
  select: 48,
  code: 110,
  thumb: 72,
  title: 320, // grow — 인스턴스를 늘리면 이 칸이 남는 폭을 먹는다
  price: 110,
  status: 90,
  stock: 80,
  category: 130,
  date: 110,
  actions: 96,
}
const TBL_W = Object.keys(TBL_COLS).reduce((s, k) => s + TBL_COLS[k as keyof typeof TBL_COLS], 0)

function tblCell(w: number, h: number, name: string, align: 'MIN' | 'CENTER' | 'MAX'): FrameNode {
  const f = fixedFrame(name, 'HORIZONTAL', w, h)
  f.primaryAxisAlignItems = align
  f.counterAxisAlignItems = 'CENTER'
  f.paddingLeft = f.paddingRight = align === 'CENTER' ? 8 : 12
  f.itemSpacing = 8
  return f
}

// 컬럼 정의 — [헤더 라벨, 폭, 레이어 이름(= 'Show <이름>' 대상), 정렬]
type TblCol = { label: string; w: number; layer: string; align: 'MIN' | 'CENTER' | 'MAX'; grow?: boolean }
const TBL_DEF: TblCol[] = [
  { label: '', w: TBL_COLS.select, layer: 'Select', align: 'CENTER' },
  { label: '상품번호', w: TBL_COLS.code, layer: 'Code', align: 'MIN' },
  { label: '이미지', w: TBL_COLS.thumb, layer: 'Thumb', align: 'CENTER' },
  { label: '상품명', w: TBL_COLS.title, layer: 'title', align: 'MIN', grow: true },
  { label: '판매가', w: TBL_COLS.price, layer: 'Price', align: 'MAX' },
  { label: '상태', w: TBL_COLS.status, layer: 'Status', align: 'CENTER' },
  { label: '재고', w: TBL_COLS.stock, layer: 'Stock', align: 'MAX' },
  { label: '카테고리', w: TBL_COLS.category, layer: 'Category', align: 'MIN' },
  { label: '등록일', w: TBL_COLS.date, layer: 'Date', align: 'MIN' },
  // 레이어는 'Actions'다 — 예전엔 'Show Actions'라 속성 이름이 `Show ${col.layer}` = 'Show Show Actions'로
  // 겹쳐 나왔고, screens.ts가 넘기는 'Show Actions'와 이름이 어긋나 열 토글이 조용히 먹지 않았다.
  { label: '관리', w: TBL_COLS.actions, layer: 'Actions', align: 'CENTER' },
]

// 행 데이터 — [상품번호, 상품명, 판매가, 상태, 톤, 재고, 카테고리, 등록일, 선택됨]
const TBL_ROWS: Array<[string, string, string, string, string, string, string, string, boolean]> = [
  ['P-100482', '모듈형 3인용 소파', '1,290,000', '판매중', 'success', '32', '가구 > 소파', '2026-05-02', true],
  ['P-100477', '원목 4인 식탁 세트', '890,000', '품절', 'error', '0', '가구 > 테이블', '2026-04-18', false],
  ['P-100463', '북유럽 플로어 스탠드', '129,000', '판매중', 'success', '148', '조명 > 스탠드', '2026-03-30', false],
  ['P-100455', '워싱 리넨 커튼 (2p)', '78,000', '숨김', 'secondary', '12', '패브릭', '2026-02-14', false],
  ['P-100441', '스테인리스 냄비 3종', '112,000', '판매중', 'success', '9', '주방', '2026-01-22', false],
]

function renderAdminTable(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const compact = combo.density === 'compact'
  const flush = combo.frame === 'flush'
  // striped — React AdminTable의 striped prop(얼룩 행). 짝수 행에 bgSubtle을 깐다.
  // 기본값 false라 기존 변형의 모양은 그대로다(축을 늘려도 default 변형은 안 바뀐다).
  const striped = combo.striped === 'true'
  const rowH = compact ? 44 : 56
  const thumbSize = compact ? 28 : 36

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(TBL_W, c.height)
  c.itemSpacing = 0
  bindFillVar(ctx, c, 'color/bg', WHITE)
  if (!flush) {
    c.cornerRadius = 12
    c.clipsContent = true
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }

  // 헤더 — 셀 이름이 행과 같아야 'Show <컬럼>' 하나로 열이 통째로 사라진다.
  const head = autoFrame('thead', 'HORIZONTAL')
  head.layoutAlign = 'STRETCH'
  head.primaryAxisSizingMode = 'FIXED'
  head.counterAxisSizingMode = 'FIXED'
  head.resize(TBL_W, 44)
  head.itemSpacing = 0
  bindFillVar(ctx, head, 'color/bgSubtle', SURFACE)
  bottomBorder(ctx, head)
  for (const col of TBL_DEF) {
    const cell = tblCell(col.w, 44, col.layer, col.align)
    if (col.grow) cell.layoutGrow = 1
    if (col.layer === 'Select') cell.appendChild(checkBox(ctx, false, 'Head Checkbox'))
    else cell.appendChild(boundText(ctx, col.label, 12, 'color/secondary', SUB, true))
    head.appendChild(cell)
  }
  c.appendChild(head)

  TBL_ROWS.forEach(([code, name, price, status, tone, stock, category, date, selected], i) => {
    const row = autoFrame('Row ' + (i + 1), 'HORIZONTAL')
    row.layoutAlign = 'STRETCH'
    row.primaryAxisSizingMode = 'FIXED'
    row.counterAxisSizingMode = 'FIXED'
    row.resize(TBL_W, rowH)
    row.itemSpacing = 0
    // 선택 강조가 얼룩보다 우선한다 — 둘 다 배경색이라 겹치면 선택이 보이지 않는다.
    if (selected) bindFillVar(ctx, row, 'color/primary/50', tintHex(ACCENT, 0.94))
    else if (striped && i % 2 === 1) bindFillVar(ctx, row, 'color/bgSubtle', SURFACE)
    if (i < TBL_ROWS.length - 1) bottomBorder(ctx, row)

    for (const col of TBL_DEF) {
      const cell = tblCell(col.w, rowH, col.layer, col.align)
      if (col.grow) cell.layoutGrow = 1
      switch (col.layer) {
        case 'Select':
          cell.appendChild(checkBox(ctx, selected, 'Row Checkbox'))
          break
        case 'Code':
          cell.appendChild(boundText(ctx, code, 12, 'color/secondary/400', MUTED))
          break
        case 'Thumb':
          cell.appendChild(thumbBox(ctx, thumbSize, thumbSize, Math.round(thumbSize * 0.5), 'Row Thumb'))
          break
        // TBL_DEF의 레이어가 'title'(소문자)인데 case가 'Title'이라 지금까지 한 번도 안 걸렸다
        // → 상품명 칸이 모든 행에서 비어 있었고 'Row Title N' TEXT 속성도 붙을 노드가 없었다.
        case 'title': {
          const t = boundText(ctx, name, 14, 'color/text', INK, true)
          t.name = 'Row Title ' + (i + 1)
          // 폭 고정(HEIGHT) → grow → 말줄임 순서. WIDTH_AND_HEIGHT인 채로 grow하면 잘리지 않고 삐져나온다.
          t.textAutoResize = 'HEIGHT'
          t.layoutGrow = 1
          t.textTruncation = 'ENDING' // 텍스트 오버플로 금지
          cell.appendChild(t)
          break
        }
        case 'Price':
          cell.appendChild(boundText(ctx, price, 13, 'color/text', INK, true))
          break
        case 'Status':
          cell.appendChild(badge(ctx, status, tone, 'Row Status ' + (i + 1)))
          break
        case 'Stock':
          cell.appendChild(boundText(ctx, stock, 13, 'color/secondary', SUB))
          break
        case 'Category':
          cell.appendChild(boundText(ctx, category, 13, 'color/secondary', SUB))
          break
        case 'Date':
          cell.appendChild(boundText(ctx, date, 12, 'color/secondary/400', MUTED))
          break
        // 아이콘 인스턴스 레이어 이름 = React prop 이름(editIcon·deleteIcon) → INSTANCE_SWAP이 붙는다.
        case 'Actions':
          cell.itemSpacing = 2
          cell.appendChild(iconBtn(ctx, '_Icon/Edit', 'Edit', SUB, 28, 'editIcon'))
          cell.appendChild(iconBtn(ctx, '_Icon/Trash2', 'Delete', VARIANT_HEX.error, 28, 'deleteIcon'))
          break
      }
      row.appendChild(cell)
    }
    c.appendChild(row)
  })

  // footer — React AdminTable의 페이지 크기·일괄 액션·페이지네이션 줄. 이 세트엔 셋 다 데모가 없어
  // 항상 '비어 있는' 상태다. showFooterWhenEmpty(기본 true, React 기본값과 동일)가 이 빈 줄을 켜고 끈다
  // — 표만 필요한 화면(3. 상품 목록처럼 화면이 페이지네이션을 별도 컴포넌트로 붙이는 경우)은 false로
  // 꺼서 빈 줄이 이중으로 남지 않게 한다.
  // 간격(12 = React `.adminTable` flex gap)을 footer 안 첫 칸으로 접어 넣는다 — c.itemSpacing=0은
  // 행 사이(구분선만으로 붙는) 간격이라 통째로 바꾸면 표 자체가 벌어지고, 간격을 밖에 따로 두면
  // BOOLEAN 하나로 '간격 + 빈 줄'을 함께 접을 수 없다(레이어 하나만 findAll로 잡히므로).
  const footer = fixedFrame('footer', 'VERTICAL', TBL_W, 44) // 레이어 이름 = CSS 클래스 이름(.footer) · 12(gap)+32(min-height)
  footer.layoutAlign = 'STRETCH'
  footer.itemSpacing = 0
  const footerGap = fixedFrame('Footer Gap', 'VERTICAL', TBL_W, 12)
  footer.appendChild(footerGap)
  const footerRow = fixedFrame('Footer Row', 'HORIZONTAL', TBL_W, 32) // React `.footer` min-height: 32px — 지금은 늘 비어 있다
  footer.appendChild(footerRow)
  c.appendChild(footer)
  return c
}

// ══ DS/AdminCard ═════════════════════════════════════════════════════
// 축: selected × active × density × appearance — 전부 React prop 이름 그대로(규약 §2).
//
// 예전 'soldout' 축은 코드에 없는 이름이었다. 실제로는 React의 active(판매중/중지)를 뒤집어 놓은 것이라
// active로 개명하고 의미를 뒤집었다(active=false = 예전 soldout=true). 값 순서를 ['true','false']로 둔 건
// 기본 변형(첫 조합)을 '판매중'으로 유지해 기존 모양을 그대로 두기 위함이다(setEq라 순서는 검증에 무관).
function renderAdminCard(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const selected = combo.selected === 'true'
  const inactive = combo.active === 'false' // 판매 중지 = 예전 soldout
  const compact = combo.density === 'compact'
  const appearance = combo.appearance || 'outline'
  const w = 260
  const mediaH = compact ? 195 : 146 // comfortable 16:9 / compact 4:3

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 12
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  // outline = 1px 보더 / elevated = 보더 없이 그림자 / plain = 둘 다 없음(이미 보더 있는 컨테이너 안).
  // 선택 상태는 어느 마감에서도 primary 보더로 이긴다 — 선택이 안 보이면 목록에서 길을 잃는다.
  if (selected) {
    bindStrokeVar(ctx, c, 'color/primary', ACCENT)
    c.strokeWeight = 2
    c.strokeAlign = 'INSIDE'
  } else if (appearance === 'outline') {
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  } else {
    c.strokes = []
  }
  if (appearance === 'elevated' && !selected) {
    c.effects = [
      {
        type: 'DROP_SHADOW',
        color: { r: 0.06, g: 0.09, b: 0.16, a: 0.08 },
        offset: { x: 0, y: 2 },
        radius: 8,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL',
      },
    ]
  }

  // 미디어 — 플레이스홀더 + 오버레이(배지·선택 체크박스)는 절대 배치라 본문 높이를 흔들지 않는다.
  // 레이어 이름 'media'는 CSS 클래스 이름 그대로 — showThumbnail(BOOLEAN)이 여기에 붙어
  // 썸네일 영역을 통째로 끈다(오버레이 배지·체크박스도 함께 사라진다 = React와 같은 동작).
  const media = fixedFrame('media', 'HORIZONTAL', w, mediaH)
  media.primaryAxisAlignItems = 'CENTER'
  media.counterAxisAlignItems = 'CENTER'
  media.clipsContent = true
  bindFillVar(ctx, media, 'color/bgSubtle', SURFACE)
  // SceneNode 유니온엔 opacity가 없다(SliceNode) → 블렌드 믹스인으로 좁혀서 접근.
  const ph = icon('_Icon/Image', 'Media Icon', 40, MUTED) as SceneNode & MinimalBlendMixin
  if (inactive) ph.opacity = 0.5 // bindTokens가 opacity/50 변수로 후처리 바인딩
  media.appendChild(ph)

  const bd = badge(ctx, inactive ? '품절' : 'BEST', inactive ? 'error' : 'primary', 'Badge')
  media.appendChild(bd)
  bd.layoutPositioning = 'ABSOLUTE'
  bd.x = 10
  bd.y = 10

  const cb = checkBox(ctx, selected, 'Select')
  media.appendChild(cb)
  cb.layoutPositioning = 'ABSOLUTE'
  cb.x = w - 10 - 18
  cb.y = 10

  c.appendChild(media)

  // 본문 — 타이틀 · 부제 · 가격(강조) · 보조 메타
  const body = autoFrame('body', 'VERTICAL')
  body.layoutAlign = 'STRETCH'
  body.primaryAxisSizingMode = 'AUTO'
  body.itemSpacing = 4
  body.paddingTop = body.paddingBottom = 14
  body.paddingLeft = body.paddingRight = 14
  const title = boundText(ctx, '프리미엄 원목 책상', 15, 'color/text', INK, true)
  title.name = 'title'
  body.appendChild(title)
  const subtitle = boundText(ctx, '가구 · 서재', 12, 'color/secondary', SUB)
  subtitle.name = 'subtitle' // = React string prop 이름(규약 §4)
  body.appendChild(subtitle)

  // 가격/재고는 meta[] 배열의 데모 값이다 — 배열은 Figma 속성으로 1:1 표현이 안 되므로
  // TEXT 속성으로 열지 않는다(레이어 이름만 CSS 클래스 price·subMeta로 맞춘다).
  const priceRow = autoFrame('priceRow', 'HORIZONTAL')
  priceRow.layoutAlign = 'STRETCH'
  priceRow.primaryAxisSizingMode = 'FIXED'
  priceRow.counterAxisAlignItems = 'CENTER'
  priceRow.itemSpacing = 8
  priceRow.paddingTop = 4
  const price = boundText(ctx, '₩129,000', 18, 'color/text', INK, true)
  price.name = 'price'
  price.layoutGrow = 1
  priceRow.appendChild(price)
  // compact는 보조 메타를 1건으로 줄인다(React density=compact와 같은 규칙).
  const subMeta = boundText(ctx, inactive ? '재고 0' : '재고 32', 12, 'color/secondary/400', MUTED)
  subMeta.name = 'subMeta' // showSubMeta(BOOLEAN)가 붙는 레이어 = CSS 클래스 이름
  priceRow.appendChild(subMeta)
  body.appendChild(priceRow)
  if (!compact) {
    const subMeta2 = boundText(ctx, inactive ? '수정 2026-05-02' : '등록 2026-05-02', 12, 'color/secondary/400', MUTED)
    subMeta2.name = 'subMeta'
    body.appendChild(subMeta2)
  }
  c.appendChild(body)

  // 액션 바 — 상태 토글 + 수정/삭제
  const actions = autoFrame('Actions', 'HORIZONTAL')
  actions.layoutAlign = 'STRETCH'
  actions.primaryAxisSizingMode = 'FIXED'
  actions.primaryAxisAlignItems = 'SPACE_BETWEEN'
  actions.counterAxisAlignItems = 'CENTER'
  actions.paddingTop = actions.paddingBottom = 8
  actions.paddingLeft = actions.paddingRight = 12
  bindStrokeVar(ctx, actions, 'color/border', BORDER)
  actions.strokeAlign = 'INSIDE'
  actions.strokeBottomWeight = 0
  actions.strokeLeftWeight = 0
  actions.strokeRightWeight = 0
  actions.strokeTopWeight = 1

  const state = autoFrame('state', 'HORIZONTAL')
  state.counterAxisAlignItems = 'CENTER'
  state.itemSpacing = 8
  state.appendChild(toggleSw(ctx, !inactive, 'Active Toggle'))
  // 상태 문구는 켜짐/꺼짐이 서로 다른 prop이다(activeLabel · inactiveLabel) → 변형마다 레이어 이름을
  // 달리 줘야 TEXT 속성 두 개가 각자 붙는다. 한 레이어에 TEXT 속성 2개는 못 붙인다.
  const stLabel = boundText(
    ctx,
    inactive ? '중지' : '판매중',
    12,
    inactive ? 'color/secondary/400' : 'color/text',
    inactive ? MUTED : INK,
    true,
  )
  stLabel.name = inactive ? 'inactiveLabel' : 'activeLabel'
  state.appendChild(stLabel)
  actions.appendChild(state)

  const btns = autoFrame('iconButtons', 'HORIZONTAL')
  btns.counterAxisAlignItems = 'CENTER'
  btns.itemSpacing = 2
  btns.appendChild(iconBtn(ctx, '_Icon/Edit', 'Edit'))
  btns.appendChild(iconBtn(ctx, '_Icon/Trash2', 'Delete', VARIANT_HEX.error))
  actions.appendChild(btns)

  c.appendChild(actions)
  return c
}

// ══ DS/ViewSwitch ════════════════════════════════════════════════════
// 축: value(card|board) × size(sm|md|lg) × orientation(horizontal|vertical) — 전부 React prop 이름 그대로.
// 라벨 ON/OFF는 축이 아니라 BOOLEAN showLabel이다(D1 ViewSwitch.tsx와 1:1).
function renderViewSwitch(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const value = combo.value || 'card'
  const size = combo.size || 'md'
  const vertical = combo.orientation === 'vertical'
  // sm/md/lg — 패딩·글자·아이콘을 한 단씩. 기본 md가 기존 모양 그대로다.
  const padY = size === 'sm' ? 5 : size === 'lg' ? 9 : 7
  const padX = size === 'sm' ? 9 : size === 'lg' ? 14 : 12
  const fs = size === 'sm' ? 12 : size === 'lg' ? 14 : 13
  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16

  const c = figma.createComponent()
  c.layoutMode = vertical ? 'VERTICAL' : 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = vertical ? 'MIN' : 'CENTER'
  c.itemSpacing = 2
  c.paddingTop = c.paddingBottom = 3
  c.paddingLeft = c.paddingRight = 3
  c.cornerRadius = 10
  bindFillVar(ctx, c, 'color/bgSubtle', SURFACE)

  const opts: Array<[string, string, string]> = [
    ['card', '카드형', '_Icon/LayoutGrid'],
    ['board', '게시물형', '_Icon/List'],
  ]
  opts.forEach(([key, label, iconKey]) => {
    const active = key === value
    const o = autoFrame('option', 'HORIZONTAL')
    if (vertical) o.layoutAlign = 'STRETCH'
    o.counterAxisAlignItems = 'CENTER'
    o.itemSpacing = 6
    o.paddingTop = o.paddingBottom = padY
    o.paddingLeft = o.paddingRight = padX
    o.cornerRadius = 8
    if (active) {
      bindFillVar(ctx, o, 'color/bg', WHITE)
      bindStrokeVar(ctx, o, 'color/border', BORDER)
      o.strokeWeight = 1
      o.strokeAlign = 'INSIDE'
    } else {
      o.fills = []
    }
    o.appendChild(icon(iconKey, label + ' Icon', iconSize, active ? ACCENT : SUB))
    const t = boundText(ctx, label, fs, active ? 'color/primary' : 'color/secondary', active ? ACCENT : SUB, active)
    // 두 옵션의 라벨 레이어 이름을 CSS 클래스 이름 'label'로 통일한다 →
    // BOOLEAN showLabel 하나가 이름으로 둘 다 잡아 함께 끈다(코드의 단일 showLabel과 1:1).
    t.name = 'label'
    o.appendChild(t)
    c.appendChild(o)
  })
  return c
}

// ══ DS/SearchPanel ═══════════════════════════════════════════════════
// 축: loading(false|true) × appearance(card|plain) — React prop 이름 그대로.
// 검색 필드 4개 + [초기화][검색]. 라벨·초기화·검색은 showLabels / showReset / showSearch로 끈다.
function renderSearchPanel(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const loading = combo.loading === 'true'
  const plain = combo.appearance === 'plain' // 이미 카드 안이면 껍데기를 벗긴다(이중 보더 방지)
  const w = 720
  const fieldW = (w - 40 - 16) / 2 // padding 20*2, 그리드 간격 16 → 2열

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 16
  c.paddingTop = c.paddingBottom = plain ? 0 : 20
  c.paddingLeft = c.paddingRight = plain ? 0 : 20
  if (plain) {
    c.fills = []
    c.strokes = []
  } else {
    c.cornerRadius = 12
    bindFillVar(ctx, c, 'color/bg', WHITE)
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }

  const grid = autoFrame('grid', 'HORIZONTAL')
  grid.layoutAlign = 'STRETCH'
  grid.primaryAxisSizingMode = 'FIXED'
  grid.layoutWrap = 'WRAP'
  grid.itemSpacing = 16
  grid.counterAxisSpacing = 16
  grid.appendChild(searchField(ctx, '상품명', '입력하세요', fieldW))
  grid.appendChild(searchField(ctx, '카테고리', '전체', fieldW, '_Icon/ChevronDown'))
  grid.appendChild(searchField(ctx, '등록일', '2026-06-01 ~ 2026-07-13', fieldW, '_Icon/Calendar'))
  grid.appendChild(searchField(ctx, '판매 상태', '전체', fieldW, '_Icon/ChevronDown'))
  c.appendChild(grid)

  const footer = autoFrame('footer', 'HORIZONTAL')
  footer.layoutAlign = 'STRETCH'
  footer.primaryAxisSizingMode = 'FIXED'
  footer.primaryAxisAlignItems = 'MAX'
  footer.counterAxisAlignItems = 'CENTER'
  footer.itemSpacing = 8
  // 버튼 '프레임' 이름 = show* prop 이름 → BOOLEAN이 버튼을 통째로 끈다(빈 껍데기가 남지 않는다).
  // 안쪽 라벨 텍스트 레이어 이름 = string prop 이름(resetLabel · searchLabel · searchingLabel).
  const reset = btn(ctx, '초기화', 'outline', 'resetLabel')
  reset.name = 'showReset'
  footer.appendChild(reset)
  // loading이면 확인 버튼 문구가 searchingLabel로 바뀐다 — 레이어 이름도 그 prop 이름이어야
  // TEXT 속성 두 개(searchLabel · searchingLabel)가 각자 붙는다.
  const search = btn(ctx, loading ? '검색 중…' : '검색', 'primary', loading ? 'searchingLabel' : 'searchLabel')
  search.name = 'showSearch'
  if (loading) (search as SceneNode & MinimalBlendMixin).opacity = 0.6 // 처리 중 = 비활성
  footer.appendChild(search)
  c.appendChild(footer)
  return c
}

// ══ DS/CrudDialog ════════════════════════════════════════════════════
// 축: mode(create|edit|delete) × loading(false|true) — React prop 이름 그대로.
// delete는 danger(경고 + 빨강 확인 버튼). loading이면 확인 버튼이 loadingLabel로 바뀌고 흐려진다.
function renderCrudDialog(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const mode = combo.mode || 'create'
  const loading = combo.loading === 'true'
  const isDelete = mode === 'delete'
  const w = isDelete ? 380 : 460
  const title = isDelete ? '삭제할까요?' : mode === 'edit' ? '수정' : '등록'
  const confirm = isDelete ? '삭제' : mode === 'edit' ? '저장' : '등록'

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 14
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  // 헤더
  const head = autoFrame('head', 'HORIZONTAL')
  head.layoutAlign = 'STRETCH'
  head.primaryAxisSizingMode = 'FIXED'
  head.primaryAxisAlignItems = 'SPACE_BETWEEN'
  head.counterAxisAlignItems = 'CENTER'
  head.paddingTop = head.paddingBottom = 16
  head.paddingLeft = head.paddingRight = 20
  bottomBorder(ctx, head)
  const ttl = boundText(ctx, title, 16, 'color/text', INK, true)
  ttl.name = 'title'
  head.appendChild(ttl)
  head.appendChild(icon('_Icon/Close', 'Close', 16, MUTED))
  c.appendChild(head)

  // 본문
  const body = autoFrame('body', 'VERTICAL')
  body.layoutAlign = 'STRETCH'
  body.primaryAxisSizingMode = 'AUTO'
  body.itemSpacing = 12
  body.paddingTop = body.paddingBottom = 20
  body.paddingLeft = body.paddingRight = 20

  if (isDelete) {
    const danger = autoFrame('danger', 'HORIZONTAL')
    danger.layoutAlign = 'STRETCH'
    danger.primaryAxisSizingMode = 'FIXED'
    danger.counterAxisAlignItems = 'MIN'
    danger.itemSpacing = 12
    // 레이어 이름은 CSS 클래스 이름(dangerIcon · dangerText · description · warning) 그대로.
    // showIcon(BOOLEAN)은 아이콘 상자에, icon(INSTANCE_SWAP)은 그 안의 아이콘 인스턴스에 붙는다.
    const ib = fixedFrame('dangerIcon', 'HORIZONTAL', 36, 36)
    ib.primaryAxisAlignItems = 'CENTER'
    ib.counterAxisAlignItems = 'CENTER'
    ib.cornerRadius = 10
    bindFillVar(ctx, ib, 'color/error/100', tintHex(VARIANT_HEX.error))
    ib.appendChild(icon('_Icon/AlertCircle', 'icon', 20, VARIANT_HEX.error))
    danger.appendChild(ib)
    const dtext = autoFrame('dangerText', 'VERTICAL')
    dtext.layoutGrow = 1
    dtext.itemSpacing = 4
    const d1 = boundText(ctx, '선택한 상품 3건을 삭제합니다.', 14, 'color/text', INK)
    d1.name = 'description'
    dtext.appendChild(d1)
    const d2 = boundText(ctx, '삭제한 데이터는 되돌릴 수 없습니다.', 12, 'color/error', VARIANT_HEX.error)
    d2.name = 'warning' // showWarning(BOOLEAN) + warningText(TEXT)가 같은 레이어에 붙는다
    dtext.appendChild(d2)
    danger.appendChild(dtext)
    body.appendChild(danger)
  } else {
    const bw = w - 40
    body.appendChild(searchField(ctx, '상품명', mode === 'edit' ? '프리미엄 원목 책상' : '입력하세요', bw))
    body.appendChild(searchField(ctx, '판매가', mode === 'edit' ? '129,000' : '숫자만 입력', bw))
    body.appendChild(searchField(ctx, '카테고리', '가구 · 서재', bw, '_Icon/ChevronDown'))
  }
  c.appendChild(body)

  // 푸터
  const footer = autoFrame('footer', 'HORIZONTAL')
  footer.layoutAlign = 'STRETCH'
  footer.primaryAxisSizingMode = 'FIXED'
  footer.primaryAxisAlignItems = 'MAX'
  footer.counterAxisAlignItems = 'CENTER'
  footer.itemSpacing = 8
  footer.paddingTop = footer.paddingBottom = 14
  footer.paddingLeft = footer.paddingRight = 20
  bindFillVar(ctx, footer, 'color/bgSubtle', SURFACE)
  footer.appendChild(btn(ctx, '취소', 'outline', 'cancelLabel'))
  // loading이면 확인 버튼 문구가 loadingLabel이 된다 — 레이어 이름을 그 prop 이름으로 둬야
  // confirmLabel·loadingLabel 두 TEXT 속성이 각자 붙는다(한 레이어에 TEXT 2개는 불가).
  const cf = btn(ctx, loading ? '처리 중…' : confirm, isDelete ? 'error' : 'primary', loading ? 'loadingLabel' : 'confirmLabel')
  if (loading) (cf as SceneNode & MinimalBlendMixin).opacity = 0.6
  footer.appendChild(cf)
  c.appendChild(footer)
  return c
}

// ══ DS/DropZone ══════════════════════════════════════════════════════
// 축: state(idle|dragging) × compact × disabled.
//   state는 React의 prop이 아니라 컴포넌트 내부 상태(useState)다 — Figma엔 '드래그 중' 그림이 필요해
//   축으로 남기고 ALLOWLIST에 사유를 적었다. compact·disabled는 React prop 이름 그대로다.
function renderDropZone(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const dragging = combo.state === 'dragging'
  const compact = combo.compact === 'true'
  const disabled = combo.disabled === 'true'
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(420, c.height)
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = compact ? 4 : 8
  c.paddingTop = c.paddingBottom = compact ? 14 : 28
  c.paddingLeft = c.paddingRight = 20
  c.cornerRadius = 12
  if (dragging) bindFillVar(ctx, c, 'color/primary/50', tintHex(ACCENT, 0.92))
  else bindFillVar(ctx, c, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, c, dragging ? 'color/primary' : 'color/border', dragging ? ACCENT : BORDER)
  c.strokeWeight = dragging ? 2 : 1
  c.strokeAlign = 'INSIDE'
  c.dashPattern = [6, 6]
  if (disabled) (c as SceneNode & MinimalBlendMixin).opacity = 0.5 // bindTokens가 opacity/50에 바인딩

  c.appendChild(icon('_Icon/Upload', 'Upload Icon', compact ? 20 : 28, dragging ? ACCENT : SUB))
  // 안내 문구는 idle/dragging이 서로 다른 prop이다(label · draggingLabel) → 레이어 이름을 변형마다
  // 다르게 줘야 TEXT 속성 둘이 각자 붙는다. 예전엔 둘 다 'label'이라 한 속성에 묶여
  // dragging 변형의 '여기에 놓으세요'가 idle 문구로 덮여 버렸다.
  // showLabel(BOOLEAN)은 두 변형을 한 번에 꺼야 하므로 이름이 같은 래퍼(hug·투명)에 붙인다.
  const labelWrap = autoFrame('showLabel', 'HORIZONTAL')
  labelWrap.counterAxisAlignItems = 'CENTER'
  labelWrap.itemSpacing = 0
  const label = boundText(
    ctx,
    dragging ? '여기에 놓으세요' : '파일을 끌어다 놓거나 클릭해서 선택하세요',
    14,
    dragging ? 'color/primary' : 'color/text',
    dragging ? ACCENT : INK,
    true,
  )
  label.name = dragging ? 'draggingLabel' : 'label'
  labelWrap.appendChild(label)
  c.appendChild(labelWrap)
  const hint = boundText(ctx, 'PNG, JPG · 파일당 최대 10MB', 12, 'color/secondary', SUB)
  hint.name = 'hint'
  c.appendChild(hint)
  // 파일 선택 버튼 — 드롭이 안 되는 환경(클릭 업로드)용. React DropZone엔 이 버튼의 문구 prop이 없다
  // (영역 전체가 클릭 대상이다) → TEXT 속성으로 열지 않는다. 데모 문구로만 둔다.
  if (!compact) {
    const action = btn(ctx, '파일 선택', 'outline', 'Action Label', 'sm')
    action.name = 'Action'
    c.appendChild(action)
  }
  return c
}

// ══ DS/StatusTimeline ════════════════════════════════════════════════
// 축: direction(horizontal|vertical). 단계: 접수(done) → 확인중(done) → 답변완료(current) → 종료(todo)
type StepState = 'done' | 'current' | 'todo' | 'skipped'
const STEPS: Array<{ label: string; at: string; state: StepState }> = [
  { label: '접수', at: '07-10 09:12', state: 'done' },
  { label: '확인중', at: '07-11 14:03', state: 'done' },
  { label: '답변완료', at: '07-13 10:22', state: 'current' },
  { label: '종료', at: '-', state: 'todo' },
]

/** 단계 점(20px) — done=success 체크 / current=primary 링 / todo=옅은 원 / skipped=마이너스 */
function stepDot(ctx: Ctx, state: StepState): FrameNode {
  const d = fixedFrame('dot', 'HORIZONTAL', 20, 20)
  d.primaryAxisAlignItems = 'CENTER'
  d.counterAxisAlignItems = 'CENTER'
  d.cornerRadius = 999
  if (state === 'done') {
    // 완료 = success solid 면 + on-color 체크. 레이어 이름 = React prop 이름(doneIcon) → INSTANCE_SWAP.
    bindSolidFill(ctx, d, 'success')
    d.appendChild(iconOn(ctx, '_Icon/Check', 'doneIcon', 12, 'success'))
  } else if (state === 'current') {
    bindFillVar(ctx, d, 'color/bg', WHITE)
    bindStrokeVar(ctx, d, 'color/primary', ACCENT)
    d.strokeWeight = 3
    d.strokeAlign = 'INSIDE'
  } else if (state === 'skipped') {
    bindFillVar(ctx, d, 'color/bgSubtle', SURFACE)
    d.appendChild(icon('_Icon/Minus', 'Minus', 12, MUTED))
  } else {
    bindFillVar(ctx, d, 'color/bgSubtle', SURFACE)
    bindStrokeVar(ctx, d, 'color/border', BORDER)
    d.strokeWeight = 2
    d.strokeAlign = 'INSIDE'
  }
  return d
}
/**
 * 단계의 시각·담당자 줄. 텍스트 레이어 이름은 TEXT 속성 이름과 **똑같아야** 한다('Step 1 Meta')
 * — 예전엔 레이어가 'Step Meta 1'이라 속성 이름과 어긋나 규약 §6(레이어=클래스/prop 이름) 위반이었다.
 * showMeta(BOOLEAN)는 4단계를 한 번에 꺼야 하는데 텍스트 레이어 이름은 단계마다 달라서 붙일 수 없다
 * → 이름이 같은 래퍼를 두고 거기에 붙인다. 래퍼 이름은 prop 이름 그대로 'showMeta'다(구 StatusTimeline
 * 컴포넌트가 Timeline.tsx의 TimelineProgress로 흡수되며 CSS 클래스 '.meta'가 사라졌다 — N6는 레이어가
 * CSS 클래스이거나 바인딩된 prop 이름 자체이길 요구하므로 후자를 쓴다).
 */
function metaRow(ctx: Ctx, at: string, i: number): FrameNode {
  const wrap = autoFrame('showMeta', 'HORIZONTAL')
  wrap.counterAxisAlignItems = 'CENTER'
  wrap.itemSpacing = 0
  const t = boundText(ctx, at, 11, 'color/secondary/400', MUTED)
  t.name = `Step ${i + 1} Meta`
  wrap.appendChild(t)
  return wrap
}

/** 연결선 — 이 단계가 done일 때만 채워진다. */
function connector(ctx: Ctx, done: boolean, w: number, h: number): FrameNode {
  const line = fixedFrame('connector', 'HORIZONTAL', w, h)
  bindFillVar(ctx, line, done ? 'color/success' : 'color/border', done ? VARIANT_HEX.success : BORDER)
  return line
}

function renderStatusTimeline(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const horizontal = combo.direction === 'horizontal'
  const c = figma.createComponent()
  c.layoutMode = horizontal ? 'HORIZONTAL' : 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.itemSpacing = 0
  c.fills = []

  STEPS.forEach((step, i) => {
    const last = i === STEPS.length - 1
    const done = step.state === 'done'
    const strong = step.state === 'done' || step.state === 'current'

    if (horizontal) {
      // 가로: [점 + 연결선] 위, 라벨/시각 아래.
      const col = fixedFrame('step ' + (i + 1), 'VERTICAL', last ? 76 : 140, 62)
      col.itemSpacing = 8
      const marker = fixedFrame('marker', 'HORIZONTAL', last ? 76 : 140, 20)
      marker.counterAxisAlignItems = 'CENTER'
      marker.itemSpacing = 6
      marker.appendChild(stepDot(ctx, step.state))
      if (!last) marker.appendChild(connector(ctx, done, 114, 2))
      col.appendChild(marker)
      const text = autoFrame('content', 'VERTICAL')
      text.itemSpacing = 2
      const lb = boundText(ctx, step.label, 13, strong ? 'color/text' : 'color/secondary/400', strong ? INK : MUTED, strong)
      lb.name = 'Step ' + (i + 1)
      text.appendChild(lb)
      text.appendChild(metaRow(ctx, step.at, i))
      col.appendChild(text)
      c.appendChild(col)
    } else {
      // 세로: [점 + 아래 연결선] 왼쪽, 라벨/시각 오른쪽.
      const rowH = last ? 40 : 60
      const r = fixedFrame('step ' + (i + 1), 'HORIZONTAL', 240, rowH)
      r.counterAxisAlignItems = 'MIN'
      r.itemSpacing = 12
      const marker = fixedFrame('marker', 'VERTICAL', 20, rowH)
      marker.primaryAxisAlignItems = 'MIN'
      marker.counterAxisAlignItems = 'CENTER'
      marker.itemSpacing = 4
      marker.appendChild(stepDot(ctx, step.state))
      if (!last) marker.appendChild(connector(ctx, done, 2, rowH - 24))
      r.appendChild(marker)
      const text = autoFrame('content', 'VERTICAL')
      text.itemSpacing = 2
      text.paddingTop = 2
      const lb = boundText(ctx, step.label, 13, strong ? 'color/text' : 'color/secondary/400', strong ? INK : MUTED, strong)
      lb.name = 'Step ' + (i + 1)
      text.appendChild(lb)
      text.appendChild(metaRow(ctx, step.at + ' · 운영자', i))
      r.appendChild(text)
      c.appendChild(r)
    }
  })
  return c
}

// ══ DS/TodoSummary ═══════════════════════════════════════════════════
// 대시보드 상단 '오늘의 할일' — 헤더(제목·건수·기준시각) + 6칸 분할 행.
// 폭은 FIXED라 인스턴스를 늘리면 6칸이 균등하게 벌어진다(화면(17) 대시보드가 그렇게 쓴다).
// 칸 단위 ON/OFF = BOOLEAN 'Show Todo 1'…'Show Todo 6'.
const TODO_ITEMS: Array<[string, string, string, string]> = [
  ['신규 주문', '12', '_Icon/Receipt', 'primary'],
  ['미입금', '3', '_Icon/Wallet', 'warning'],
  ['배송 준비', '8', '_Icon/Package', 'primary'],
  ['취소 요청', '2', '_Icon/CircleX', 'error'],
  ['신규 문의', '5', '_Icon/MessageSquare', 'success'],
  ['신규 회원', '8', '_Icon/UserPlus', 'secondary'],
]

function renderTodoSummary(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const w = 1200
  const sm = combo.size === 'sm' // 사이드 위젯용 — 패딩·글자를 한 단 줄인다
  const framed = combo.framed !== 'false' // 카드 크롬(기본 true = 기존 모양)

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 0
  if (framed) {
    c.cornerRadius = 12
    c.clipsContent = true
    bindFillVar(ctx, c, 'color/bg', WHITE)
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  } else {
    // 이미 카드(PageSection) 안에 들어갈 때 — 보더가 이중으로 겹치지 않게 껍데기를 벗긴다.
    c.fills = []
    c.strokes = []
  }

  // 헤더 — 제목 + 총 건수 배지 / 우측 기준 시각.
  // 레이어 이름은 CSS 클래스 이름(header · totalBadge) 그대로 → showHeader / showTotalBadge가 붙는다.
  const head = autoFrame('header', 'HORIZONTAL')
  head.layoutAlign = 'STRETCH'
  head.primaryAxisSizingMode = 'FIXED'
  head.counterAxisAlignItems = 'CENTER'
  head.itemSpacing = 8
  head.paddingTop = head.paddingBottom = sm ? 12 : 16
  head.paddingLeft = head.paddingRight = sm ? 14 : 20
  bottomBorder(ctx, head)
  const title = boundText(ctx, '오늘의 할일', sm ? 14 : 15, 'color/text', INK, true)
  title.name = 'title'
  head.appendChild(title)
  // 총건수는 total(number) prop이라 TEXT 속성이 될 수 없다(규약 §2d와 같은 이유) — 데모 값으로 둔다.
  const totalChip = badge(ctx, '38건', 'primary', 'Total')
  totalChip.name = 'totalBadge'
  head.appendChild(totalChip)
  const spacer = autoFrame('spacer', 'HORIZONTAL')
  spacer.layoutGrow = 1
  head.appendChild(spacer)
  // '기준 시각'은 React TodoSummary에 대응 prop이 없다 — TEXT 속성으로 열지 않고 데모 문구로만 둔다.
  const updated = boundText(ctx, '2026-07-13 09:41 기준', 12, 'color/secondary/400', MUTED)
  updated.name = 'Updated'
  head.appendChild(updated)
  c.appendChild(head)

  // 6칸 — 아이콘 + 라벨 / 건수 + chevron. 마지막 칸을 뺀 나머지에 오른쪽 구분선.
  const row = autoFrame('Todo Row', 'HORIZONTAL')
  row.layoutAlign = 'STRETCH'
  row.primaryAxisSizingMode = 'FIXED'
  row.itemSpacing = 0
  TODO_ITEMS.forEach(([label, count, iconKey, tone], i) => {
    const cell = autoFrame('Todo ' + (i + 1), 'VERTICAL')
    cell.layoutGrow = 1
    cell.counterAxisSizingMode = 'FIXED'
    cell.itemSpacing = sm ? 4 : 8
    cell.paddingTop = cell.paddingBottom = sm ? 14 : 20
    cell.paddingLeft = cell.paddingRight = sm ? 14 : 20
    if (i < TODO_ITEMS.length - 1) rightBorder(ctx, cell)

    const top = autoFrame('top', 'HORIZONTAL')
    top.layoutAlign = 'STRETCH'
    top.primaryAxisSizingMode = 'FIXED'
    top.counterAxisAlignItems = 'CENTER'
    top.itemSpacing = 6
    const ic = iconInstance(iconKey, 'Todo Icon ' + (i + 1), 15)
    recolorIconVar(ctx, ic, `color/${tone}`, VARIANT_HEX[tone] ?? ACCENT)
    top.appendChild(ic)
    const lb = boundText(ctx, label, 12, 'color/secondary', SUB)
    lb.name = 'Label ' + (i + 1)
    top.appendChild(lb)
    cell.appendChild(top)

    const bot = autoFrame('bot', 'HORIZONTAL')
    bot.layoutAlign = 'STRETCH'
    bot.primaryAxisSizingMode = 'FIXED'
    bot.counterAxisAlignItems = 'CENTER'
    bot.itemSpacing = 4
    const cnt = boundText(ctx, count, sm ? 20 : 24, 'color/text', INK, true)
    cnt.name = 'Count ' + (i + 1)
    bot.appendChild(cnt)
    // 단위('건')는 6칸이 모두 같은 문구다 = 코드의 단일 countUnit prop.
    // 레이어 이름을 prop 이름으로 통일하면 TEXT 속성 하나가 6칸을 한꺼번에 바꾼다.
    const unit = boundText(ctx, '건', 12, 'color/secondary/400', MUTED)
    unit.name = 'countUnit'
    bot.appendChild(unit)
    const gap = autoFrame('gap', 'HORIZONTAL')
    gap.layoutGrow = 1
    bot.appendChild(gap)
    bot.appendChild(icon('_Icon/ChevronRight', 'Todo Chevron ' + (i + 1), 16, MUTED))
    cell.appendChild(bot)

    row.appendChild(cell)
  })
  c.appendChild(row)
  return c
}

// ══ DS/ActivityLog ═══════════════════════════════════════════════════
// 축: compact(false|true) × timeFormat(relative|absolute) — React prop 이름 그대로.
// 최근 활동 — 타입별 아이콘 칩 + 문장 + 시각(+ 안 읽음 점). 각 조각은 show* BOOLEAN으로 끈다.
function renderActivityLog(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const compact = combo.compact === 'true'
  const absolute = combo.timeFormat === 'absolute'
  // [아이콘, 톤, 문장, 상대 시각, 절대 시각, 안 읽음]
  const items: Array<[string, string, string, string, string, boolean]> = [
    ['_Icon/MessageSquare', 'primary', '김디자인님이 문의를 등록했습니다', '3분 전', '2026-07-13 09:38', true],
    ['_Icon/Cart', 'success', '이개발님이 주문을 처리했습니다', '1시간 전', '2026-07-13 08:41', false],
    ['_Icon/Package', 'secondary', '박기획님이 상품을 수정했습니다', '2시간 전', '2026-07-13 07:22', false],
    ['_Icon/UserPlus', 'warning', '신규 회원이 가입했습니다', '1일 전', '2026-07-12 16:05', false],
  ]

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(380, c.height)
  c.itemSpacing = compact ? 0 : 4
  c.paddingTop = c.paddingBottom = compact ? 12 : 16
  c.paddingLeft = c.paddingRight = 16
  c.cornerRadius = 12
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  // 레이어 이름 = CSS 클래스 이름(head · viewAll · icon · time · dot) → show* BOOLEAN이 이름으로 붙는다.
  const head = autoFrame('head', 'HORIZONTAL')
  head.layoutAlign = 'STRETCH'
  head.primaryAxisSizingMode = 'FIXED'
  head.primaryAxisAlignItems = 'SPACE_BETWEEN'
  head.counterAxisAlignItems = 'CENTER'
  head.paddingBottom = 8
  const title = boundText(ctx, '최근 활동', 15, 'color/text', INK, true)
  title.name = 'title'
  head.appendChild(title)
  const viewAll = autoFrame('viewAll', 'HORIZONTAL')
  viewAll.counterAxisAlignItems = 'CENTER'
  viewAll.itemSpacing = 2
  const va = boundText(ctx, '전체보기', 12, 'color/primary', ACCENT, true)
  va.name = 'viewAllLabel' // = React string prop 이름
  viewAll.appendChild(va)
  viewAll.appendChild(icon('_Icon/ChevronRight', 'viewAllIcon', 14, ACCENT)) // = ReactNode prop 이름
  head.appendChild(viewAll)
  c.appendChild(head)

  items.forEach(([iconKey, tone, sentence, rel, abs, unread], i) => {
    const toneHex = VARIANT_HEX[tone] ?? ACCENT
    const r = autoFrame('activity', 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisAlignItems = 'CENTER'
    r.itemSpacing = 10
    r.paddingTop = r.paddingBottom = compact ? 5 : 8

    // 칩 프레임 이름이 'icon'이라 showIcon(BOOLEAN)이 칩째 끈다(빈 껍데기가 남지 않는다).
    const chip = fixedFrame('icon', 'HORIZONTAL', 28, 28)
    chip.primaryAxisAlignItems = 'CENTER'
    chip.counterAxisAlignItems = 'CENTER'
    chip.cornerRadius = 8
    bindFillVar(ctx, chip, `color/${tone}/100`, tintHex(toneHex))
    // 타입별 아이콘(typeIcons)은 Partial<Record<type, ReactNode>> 맵이라 단일 INSTANCE_SWAP으로
    // 표현할 수 없다(하나로 묶으면 4줄이 전부 같은 아이콘이 된다) — ALLOWLIST 참조.
    chip.appendChild(icon(iconKey, 'Activity Icon ' + (i + 1), 15, toneHex))
    r.appendChild(chip)

    const body = autoFrame('body', 'VERTICAL')
    body.layoutGrow = 1
    body.itemSpacing = 2
    const s = boundText(ctx, sentence, 13, 'color/text', INK)
    s.name = 'Activity ' + (i + 1)
    body.appendChild(s)
    const time = boundText(ctx, absolute ? abs : rel, 11, 'color/secondary/400', MUTED)
    time.name = 'time'
    body.appendChild(time)
    r.appendChild(body)

    if (unread) {
      const dot = figma.createEllipse()
      dot.name = 'dot'
      dot.resize(6, 6)
      bindFillVar(ctx, dot, 'color/primary', ACCENT)
      r.appendChild(dot)
    }
    c.appendChild(r)
  })
  return c
}

// ══ DS/MemoBox ═══════════════════════════════════════════════════════
// 관리자 메모 — Textarea + 글자수 카운터 + 저장 버튼.
function renderMemoBox(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const w = 420
  const saving = combo.saving === 'true' // 저장 중 — 입력·버튼을 잠근다
  const framed = combo.framed !== 'false' // 카드 크롬(기본 true = 기존 모양)
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 12
  c.paddingTop = c.paddingBottom = framed ? 16 : 0
  c.paddingLeft = c.paddingRight = framed ? 16 : 0
  if (framed) {
    c.cornerRadius = 12
    bindFillVar(ctx, c, 'color/bg', WHITE)
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  } else {
    // PageSection 같은 카드 '안'에 넣을 때 — 껍데기를 벗겨 카드가 이중으로 겹치지 않게 한다.
    c.fills = []
    c.strokes = []
  }

  const head = autoFrame('head', 'VERTICAL')
  head.layoutAlign = 'STRETCH'
  head.itemSpacing = 4
  const title = boundText(ctx, '관리자 메모', 15, 'color/text', INK, true)
  title.name = 'title'
  head.appendChild(title)
  const descRow = autoFrame('desc', 'HORIZONTAL')
  descRow.counterAxisAlignItems = 'CENTER'
  descRow.itemSpacing = 4
  descRow.appendChild(icon('_Icon/EyeOff', 'Desc Icon', 13, MUTED))
  const desc = boundText(ctx, '고객에게 노출되지 않습니다.', 12, 'color/secondary/400', MUTED)
  desc.name = 'description'
  descRow.appendChild(desc)
  head.appendChild(descRow)
  c.appendChild(head)

  const editor = fixedFrame('editor', 'VERTICAL', w - 32, 96)
  editor.paddingTop = editor.paddingBottom = 10
  editor.paddingLeft = editor.paddingRight = 12
  editor.cornerRadius = 8
  bindFillVar(ctx, editor, 'color/bg', WHITE)
  bindStrokeVar(ctx, editor, 'color/border', BORDER)
  editor.strokeWeight = 1
  editor.strokeAlign = 'INSIDE'
  if (saving) (editor as SceneNode & MinimalBlendMixin).opacity = 0.5 // 저장 중 = 입력 잠금
  const ph = boundText(ctx, '고객 응대 시 참고할 내용을 남겨 주세요.', 13, 'color/secondary/400', MUTED)
  ph.name = 'placeholder'
  editor.appendChild(ph)
  c.appendChild(editor)

  const footer = autoFrame('footer', 'HORIZONTAL')
  footer.layoutAlign = 'STRETCH'
  footer.primaryAxisSizingMode = 'FIXED'
  footer.primaryAxisAlignItems = 'SPACE_BETWEEN'
  footer.counterAxisAlignItems = 'CENTER'
  // 글자수 카운터의 '문구'는 React에 prop이 없다(maxLength·value에서 계산된다) → TEXT 속성으로 열지 않고
  // ON/OFF만 연다. 레이어 이름 = 그 BOOLEAN prop 이름(showCounter) — CSS엔 카운터 클래스가 없다
  // (공용 Textarea 안에 있다)라 N6의 '바인딩된 레이어는 prop 이름 허용'을 따른다.
  const counter = boundText(ctx, '0/500', 12, 'color/secondary/400', MUTED)
  counter.name = 'showCounter'
  footer.appendChild(counter)
  // 저장 버튼 문구는 saving 여부에 따라 서로 다른 prop이다(saveLabel · savingLabel).
  const save = btn(ctx, saving ? '저장 중…' : '저장', 'primary', saving ? 'savingLabel' : 'saveLabel', 'sm')
  if (saving) (save as SceneNode & MinimalBlendMixin).opacity = 0.6
  // solid 버튼 위 아이콘 = on-color. 레이어 이름 = ReactNode prop 이름(saveIcon) → INSTANCE_SWAP.
  save.insertChild(0, iconOn(ctx, '_Icon/Save', 'saveIcon', 14, 'primary'))
  footer.appendChild(save)
  c.appendChild(footer)
  return c
}

// ══ DS/DefinitionList ════════════════════════════════════════════════
// 라벨-값 정의형 정보 블록 — 라벨 고정폭(120) + 값. 마지막 행만 구분선 없음.
// 7행 고정 + 행 단위 ON/OFF('Show Row 1'…'Show Row 7')이고 라벨/값이 전부 TEXT 속성이라
// 상세 화면(고객 상세 7행 · 문의 상세 6행)이 같은 인스턴스로 조립된다.
const DL_ROWS: Array<[string, string]> = [
  ['회원 ID', 'MB-000482'],
  ['계정', 'mint@example.com'],
  ['연락처', '010-1234-5678'],
  ['생일', '1994-05-21'],
  ['성별', '여성'],
  ['회원 유형', 'VIP'],
  ['가입 경로', '이메일 · PC 웹'],
]
const DL_MAX = DL_ROWS.length

function renderDefinitionList(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const w = 460
  const flush = combo.frame === 'flush' // 이미 카드 안에 놓일 때 — 보더가 이중으로 겹치지 않게
  const divider = combo.divider !== 'false' // 행 사이 구분선(기본 true = 기존 모양)
  const rowH = combo.density === 'compact' ? 36 : 44

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 0
  bindFillVar(ctx, c, 'color/bg', WHITE)
  if (!flush) {
    c.cornerRadius = 12
    c.clipsContent = true
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }

  DL_ROWS.forEach(([label, value], i) => {
    const r = autoFrame('Row ' + (i + 1), 'HORIZONTAL')
    r.layoutAlign = 'STRETCH'
    r.primaryAxisSizingMode = 'FIXED'
    r.counterAxisSizingMode = 'FIXED'
    r.resize(w, rowH)
    r.counterAxisAlignItems = 'CENTER'
    r.paddingLeft = r.paddingRight = 16
    r.itemSpacing = 12
    // 마지막 행에만 선이 없다 — 행을 끄면 프레임째 사라지므로 빈 구분선이 남지 않는다.
    if (divider && i < DL_MAX - 1) bottomBorder(ctx, r)

    const lb = fixedFrame('label', 'HORIZONTAL', 120, rowH)
    lb.counterAxisAlignItems = 'CENTER'
    const lt = boundText(ctx, label, 13, 'color/secondary', SUB)
    lt.name = 'Label ' + (i + 1)
    lb.appendChild(lt)
    r.appendChild(lb)

    const v = boundText(ctx, value, 14, 'color/text', INK)
    v.name = 'Value ' + (i + 1)
    v.textAutoResize = 'HEIGHT'
    v.layoutGrow = 1
    v.textTruncation = 'ENDING'
    r.appendChild(v)

    c.appendChild(r)
  })
  return c
}

// ══ DS/SortableList ══════════════════════════════════════════════════
// 축: direction(vertical|grid) × disabled(false|true) × handleOnly(false|true) — React prop 이름 그대로.
// SortableList<T>는 renderItem으로 내용을 통째로 위임하는 제네릭 컨테이너라 TEXT·BOOLEAN·INSTANCE_SWAP
// 속성이 하나도 없다(getId·onReorder·renderItem은 전부 콜백이라 검사 대상이 아니다) — 데모 내용은
// 스토리북(Vertical/Grid/HandleOnly)과 같은 투두·사진 목데이터로 채운다.
// disabled는 React의 .disabledList(opacity:0.6)를 그대로 opacity/60 변수로 옮긴다.
const SL_TODOS: Array<[string, string]> = [
  ['메인 배너 시안 확정', '김서연'],
  ['상품 상세 카피 검수', '이준호'],
  ['결제 실패 로그 분석', '박지민'],
  ['9월 프로모션 쿠폰 발행', '최수아'],
]
const SL_PHOTOS = ['대표', '상세 1', '상세 2', '상세 3']

function renderSortableList(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const grid = combo.direction === 'grid'
  const disabled = combo.disabled === 'true'
  const handleOnly = combo.handleOnly === 'true'

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(360, c.height)
  c.itemSpacing = 0
  c.fills = []
  // React SortableList.module.css .disabledList — 프레임 전체 불투명도(텍스트 개별 불투명도 아님, B5 무관).
  if (disabled) (c as SceneNode & MinimalBlendMixin).opacity = 0.6

  const list = autoFrame('list', grid ? 'HORIZONTAL' : 'VERTICAL')
  list.layoutAlign = 'STRETCH'
  list.primaryAxisSizingMode = 'FIXED'
  list.itemSpacing = 8
  if (grid) {
    list.layoutWrap = 'WRAP'
    list.counterAxisSpacing = 8
  }

  if (grid) {
    SL_PHOTOS.forEach((label, i) => {
      const tile = fixedFrame('item', 'VERTICAL', 104, 104)
      tile.primaryAxisAlignItems = 'CENTER'
      tile.counterAxisAlignItems = 'CENTER'
      tile.cornerRadius = 8
      tile.clipsContent = true
      bindFillVar(ctx, tile, 'color/bgSubtle', SURFACE)
      bindStrokeVar(ctx, tile, 'color/border', BORDER)
      tile.strokeWeight = 1
      tile.strokeAlign = 'INSIDE'
      tile.appendChild(icon('_Icon/Image', 'Tile Icon', 28, MUTED))
      if (i === 0) {
        const b = badge(ctx, '대표', 'primary', 'Tile Badge')
        tile.appendChild(b)
        b.layoutPositioning = 'ABSOLUTE'
        b.x = 6
        b.y = 104 - 6 - 20
      }
      list.appendChild(tile)
    })
  } else {
    SL_TODOS.forEach(([title, owner], i) => {
      const row = autoFrame('item', 'HORIZONTAL')
      row.layoutAlign = 'STRETCH'
      row.primaryAxisSizingMode = 'FIXED'
      row.counterAxisAlignItems = 'CENTER'
      row.itemSpacing = 8
      row.paddingTop = row.paddingBottom = 12
      row.paddingLeft = row.paddingRight = 16
      row.cornerRadius = 8
      bindFillVar(ctx, row, 'color/bg', WHITE)
      bindStrokeVar(ctx, row, 'color/border', BORDER)
      row.strokeWeight = 1
      row.strokeAlign = 'INSIDE'
      // handleOnly — React SortableHandle(GripVertical) 자리. 아이콘 시스템엔 grip 계열이 없어
      // '이동'을 뜻하는 Move로 대신한다(SortableHandleProps.icon은 SortableList의 prop이 아니라
      // 검사 대상이 아니다 — 별도 컴포넌트 타입).
      if (handleOnly) row.appendChild(icon('_Icon/Move', 'handle', 16, SUB))
      else {
        const idx = boundText(ctx, String(i + 1), 13, 'color/secondary', SUB)
        idx.name = 'Index'
        row.appendChild(idx)
      }
      const title_ = boundText(ctx, title, 14, 'color/text', INK)
      title_.name = 'Title'
      title_.layoutGrow = 1
      row.appendChild(title_)
      row.appendChild(badge(ctx, owner, 'secondary', 'Owner'))
      list.appendChild(row)
    })
  }
  c.appendChild(list)
  return c
}

// ══ DS/ImagePreview ══════════════════════════════════════════════════
// 축: open(true|false) × inline(true|false) — React prop 이름 그대로.
//   open=false는 React가 실제로 null을 반환하는 상태라 그릴 그림이 없다 — 문서에는
//   '닫힘' 자리표시 문구만 남긴다(다른 오버레이의 open=false 면제와 달리 여기는 축 자체를 지우지 않고
//   진짜로 두 값을 그린다 — 코드에 실재하는 축이라 지울 근거가 없다).
//   inline=true(문서/데모용 정적 배치)를 기본값으로 앞에 둔다 — 이 세트가 항상 보여줄 그림이기 때문.
function renderImagePreview(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const open = combo.open === 'true'
  const inline = combo.inline === 'true'

  if (!open) {
    const empty = figma.createComponent()
    empty.layoutMode = 'VERTICAL'
    empty.primaryAxisSizingMode = 'AUTO'
    empty.counterAxisSizingMode = 'AUTO'
    empty.paddingTop = empty.paddingBottom = empty.paddingLeft = empty.paddingRight = 20
    empty.fills = []
    empty.appendChild(boundText(ctx, '(닫힘 — open=false)', 12, 'color/secondary/400', MUTED))
    return empty
  }

  const w = 480
  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 14
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  if (inline) {
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  }

  // 헤더 — 레이어 이름 = CSS 클래스 이름(header · counter) 그대로.
  const header = autoFrame('header', 'HORIZONTAL')
  header.layoutAlign = 'STRETCH'
  header.primaryAxisSizingMode = 'FIXED'
  header.primaryAxisAlignItems = 'SPACE_BETWEEN'
  header.counterAxisAlignItems = 'CENTER'
  header.itemSpacing = 12
  header.paddingTop = header.paddingBottom = 8
  header.paddingLeft = header.paddingRight = 12
  bottomBorder(ctx, header)
  const name = boundText(ctx, '상품 상세컷.jpg', 13, 'color/text', INK, true)
  name.name = 'name'
  header.appendChild(name)

  const actions = autoFrame('headerActions', 'HORIZONTAL')
  actions.counterAxisAlignItems = 'CENTER'
  actions.itemSpacing = 8
  const counter = boundText(ctx, '2 / 5', 11, 'color/secondary', SUB)
  counter.name = 'counter'
  actions.appendChild(counter)

  // 확대/축소 묶음 — CSS엔 래퍼 클래스가 없어 바인딩된 prop 이름 'showZoom'을 레이어로 쓴다(규약 §6 예외).
  const zoomGroup = autoFrame('showZoom', 'HORIZONTAL')
  zoomGroup.counterAxisAlignItems = 'CENTER'
  zoomGroup.itemSpacing = 4
  zoomGroup.appendChild(iconBtn(ctx, '_Icon/ZoomOut', 'Zoom Out', SUB, 28, 'zoomOutIcon'))
  const zoomValue = boundText(ctx, '100%', 11, 'color/secondary', SUB)
  zoomValue.name = 'zoomValue'
  zoomGroup.appendChild(zoomValue)
  zoomGroup.appendChild(iconBtn(ctx, '_Icon/ZoomIn', 'Zoom In', SUB, 28, 'zoomInIcon'))
  actions.appendChild(zoomGroup)

  actions.appendChild(iconBtn(ctx, '_Icon/Close', 'Close', SUB, 28, 'closeIcon'))
  header.appendChild(actions)
  c.appendChild(header)

  // 스테이지 — 좌우 이동 버튼 둘 다 레이어 이름 'nav'(CSS .nav 그대로) → showNav 하나가 함께 끈다.
  const stage = fixedFrame('stage', 'HORIZONTAL', w, 260)
  stage.primaryAxisAlignItems = 'SPACE_BETWEEN'
  stage.counterAxisAlignItems = 'CENTER'
  stage.paddingLeft = stage.paddingRight = 8
  bindFillVar(ctx, stage, 'color/bgSubtle', SURFACE)

  const pillBtn = (key: string, iconLayer: string): FrameNode => {
    const b = iconBtn(ctx, key, 'nav', SUB, 32, iconLayer)
    b.cornerRadius = 999
    bindFillVar(ctx, b, 'color/bg', WHITE)
    bindStrokeVar(ctx, b, 'color/border', BORDER)
    b.strokeWeight = 1
    b.strokeAlign = 'INSIDE'
    return b
  }
  stage.appendChild(pillBtn('_Icon/ChevronLeft', 'prevIcon'))
  stage.appendChild(thumbBox(ctx, 200, 150, 40, 'viewport'))
  stage.appendChild(pillBtn('_Icon/ChevronRight', 'nextIcon'))
  c.appendChild(stage)

  // 하단 썸네일 스트립 — 레이어 이름 = CSS 클래스 이름(strip) 그대로.
  const strip = autoFrame('strip', 'HORIZONTAL')
  strip.layoutAlign = 'STRETCH'
  strip.primaryAxisSizingMode = 'FIXED'
  strip.counterAxisAlignItems = 'CENTER'
  strip.itemSpacing = 8
  strip.paddingTop = strip.paddingBottom = 8
  strip.paddingLeft = strip.paddingRight = 12
  // 위쪽 1px 보더 — bottomBorder/rightBorder와 같은 패턴을 위쪽에.
  bindStrokeVar(ctx, strip, 'color/border', BORDER)
  strip.strokeAlign = 'INSIDE'
  strip.strokeBottomWeight = 0
  strip.strokeLeftWeight = 0
  strip.strokeRightWeight = 0
  strip.strokeTopWeight = 1
  for (let i = 0; i < 5; i++) {
    const thumb = thumbBox(ctx, 48, 48, 18, 'Thumb ' + (i + 1))
    if (i === 1) {
      bindStrokeVar(ctx, thumb, 'color/primary', ACCENT)
      thumb.strokeWeight = 2
      thumb.strokeAlign = 'INSIDE'
    }
    strip.appendChild(thumb)
  }
  c.appendChild(strip)
  return c
}

// ── 공용 소형 조각 — 아래 신규 세트들이 공유한다 ─────────────────────
/** 라벨 없는 작은 입력 박스 — OptionRows·MainVisualUploader 표 셀에 쓴다. */
function miniInput(ctx: Ctx, value: string, w: number, h = 32): FrameNode {
  const b = fixedFrame('control', 'HORIZONTAL', w, h)
  b.counterAxisAlignItems = 'CENTER'
  b.paddingLeft = b.paddingRight = 10
  b.cornerRadius = 8
  bindFillVar(ctx, b, 'color/bg', WHITE)
  bindStrokeVar(ctx, b, 'color/border', BORDER)
  b.strokeWeight = 1
  b.strokeAlign = 'INSIDE'
  const t = boundText(ctx, value, 13, 'color/text', INK)
  t.layoutGrow = 1
  b.appendChild(t)
  return b
}
/** 세로 1px 구분선 — RichTextEditor 툴바 그룹 사이. */
function vDivider(ctx: Ctx, h = 20): FrameNode {
  const d = fixedFrame('divider', 'VERTICAL', 1, h)
  bindFillVar(ctx, d, 'color/border', BORDER)
  return d
}

// ══ DS/RowActions ════════════════════════════════════════════════════
// 축: size(sm|md|lg) × appearance(outline|ghost) — React prop 이름 그대로.
// view/edit/delete는 넘긴 핸들러만 렌더되는 게 코드 규칙이지만, 문서 세트는 셋 다 보여준다.
// labels.group/view/edit/delete는 전부 툴팁·aria 문구다(Tooltip 안에서만 보인다) — 화면에 글자로
// 그려지지 않아 TEXT로 열지 않는다(ALLOWLIST 필요 — 정확한 튜플은 최종 보고 참고).
function renderRowActions(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const size = combo.size || 'md'
  const ghost = combo.appearance === 'ghost'
  const box = size === 'sm' ? 26 : size === 'lg' ? 40 : 32
  const iconPx = size === 'sm' ? 14 : size === 'lg' ? 18 : 16

  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 4
  c.fills = []

  const mkBtn = (key: string, name: string, hex: string, layer: string): FrameNode => {
    const b = fixedFrame(name, 'HORIZONTAL', box, box)
    b.primaryAxisAlignItems = 'CENTER'
    b.counterAxisAlignItems = 'CENTER'
    b.cornerRadius = 6
    if (!ghost) {
      bindFillVar(ctx, b, 'color/bg', WHITE)
      bindStrokeVar(ctx, b, 'color/border', BORDER)
      b.strokeWeight = 1
      b.strokeAlign = 'INSIDE'
    } else b.fills = []
    b.appendChild(icon(key, layer, iconPx, hex))
    return b
  }
  c.appendChild(mkBtn('_Icon/Eye', 'View', SUB, 'viewIcon'))
  c.appendChild(mkBtn('_Icon/Edit', 'Edit', SUB, 'editIcon'))
  c.appendChild(mkBtn('_Icon/Trash2', 'Delete', VARIANT_HEX.error, 'deleteIcon'))
  return c
}

// ══ DS/ListToolbar ═══════════════════════════════════════════════════
// 축: layout(admin|site) × appearance(card|plain) — React prop 이름 그대로.
//   admin — 흰 카드 바(좌: 필터 Select+검색 / 우: 정렬 Select+건수+액션).
//   site  — 카드 크롬 없는 바(좌 '전체 N개' · 우 컨트롤 묶음, 구 SortBar). appearance는 site 분기에서
//           읽히지 않는다(React도 같다) — card/plain 두 값의 site 그림이 같은 건 코드와 일치하는 중복이다.
function renderListToolbar(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const site = combo.layout === 'site'
  const plain = combo.appearance === 'plain'
  const w = 720

  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'FIXED'
  c.counterAxisSizingMode = 'AUTO'
  c.resize(w, c.height)
  c.counterAxisAlignItems = 'CENTER'
  c.primaryAxisAlignItems = 'SPACE_BETWEEN'
  c.itemSpacing = 12
  if (!site && !plain) {
    c.paddingTop = c.paddingBottom = c.paddingLeft = c.paddingRight = 12
    c.cornerRadius = 8
    bindFillVar(ctx, c, 'color/bg', WHITE)
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  } else {
    c.fills = []
  }

  if (site) {
    const left = autoFrame('total', 'HORIZONTAL')
    left.counterAxisAlignItems = 'CENTER'
    left.itemSpacing = 4
    const lb = boundText(ctx, '전체', 13, 'color/secondary', SUB)
    lb.name = 'totalLabel'
    left.appendChild(lb)
    const cnt = boundText(ctx, '6개', 13, 'color/text', INK, true)
    cnt.name = 'total'
    left.appendChild(cnt)
    // totalSuffix — React ListToolbar의 site 전용 문장형 꼬리말("…의 상품이 있습니다").
    const suffix = boundText(ctx, '의 상품이 있습니다', 13, 'color/secondary', SUB)
    suffix.name = 'totalSuffix'
    left.appendChild(suffix)
    c.appendChild(left)

    const right = autoFrame('siteControls', 'HORIZONTAL')
    right.counterAxisAlignItems = 'CENTER'
    right.itemSpacing = 8
    const sortSel = fixedFrame('sort', 'HORIZONTAL', 160, 36)
    sortSel.counterAxisAlignItems = 'CENTER'
    sortSel.paddingLeft = sortSel.paddingRight = 10
    sortSel.cornerRadius = 8
    bindFillVar(ctx, sortSel, 'color/bg', WHITE)
    bindStrokeVar(ctx, sortSel, 'color/border', BORDER)
    sortSel.strokeWeight = 1
    sortSel.strokeAlign = 'INSIDE'
    const sv = boundText(ctx, '인기순', 13, 'color/text', INK)
    sv.layoutGrow = 1
    sortSel.appendChild(sv)
    sortSel.appendChild(icon('_Icon/ChevronDown', 'Sort Icon', 14, MUTED))
    right.appendChild(sortSel)
    right.appendChild(btn(ctx, '등록', 'primary', 'Action Label', 'sm'))
    c.appendChild(right)
    return c
  }

  const left = autoFrame('left', 'HORIZONTAL')
  left.counterAxisAlignItems = 'CENTER'
  left.itemSpacing = 8
  const statusSel = fixedFrame('select', 'HORIZONTAL', 140, 36)
  statusSel.counterAxisAlignItems = 'CENTER'
  statusSel.paddingLeft = statusSel.paddingRight = 10
  statusSel.cornerRadius = 8
  bindFillVar(ctx, statusSel, 'color/bg', WHITE)
  bindStrokeVar(ctx, statusSel, 'color/border', BORDER)
  statusSel.strokeWeight = 1
  statusSel.strokeAlign = 'INSIDE'
  const stv = boundText(ctx, '전체 상태', 13, 'color/text', INK)
  stv.layoutGrow = 1
  statusSel.appendChild(stv)
  statusSel.appendChild(icon('_Icon/ChevronDown', 'Select Icon', 14, MUTED))
  left.appendChild(statusSel)
  const search = fixedFrame('search', 'HORIZONTAL', 220, 36)
  search.counterAxisAlignItems = 'CENTER'
  search.paddingLeft = search.paddingRight = 10
  search.itemSpacing = 6
  search.cornerRadius = 8
  bindFillVar(ctx, search, 'color/bg', WHITE)
  bindStrokeVar(ctx, search, 'color/border', BORDER)
  search.strokeWeight = 1
  search.strokeAlign = 'INSIDE'
  search.appendChild(icon('_Icon/Search', 'Search Icon', 15, MUTED))
  const sph = boundText(ctx, '검색어를 입력하세요', 13, 'color/secondary/400', MUTED)
  sph.name = 'searchPlaceholder'
  search.appendChild(sph)
  left.appendChild(search)
  c.appendChild(left)

  const right = autoFrame('right', 'HORIZONTAL')
  right.counterAxisAlignItems = 'CENTER'
  right.itemSpacing = 12
  const sortSel = fixedFrame('select', 'HORIZONTAL', 140, 36)
  sortSel.counterAxisAlignItems = 'CENTER'
  sortSel.paddingLeft = sortSel.paddingRight = 10
  sortSel.cornerRadius = 8
  bindFillVar(ctx, sortSel, 'color/bg', WHITE)
  bindStrokeVar(ctx, sortSel, 'color/border', BORDER)
  sortSel.strokeWeight = 1
  sortSel.strokeAlign = 'INSIDE'
  const sov = boundText(ctx, '최신순', 13, 'color/text', INK)
  sov.layoutGrow = 1
  sortSel.appendChild(sov)
  sortSel.appendChild(icon('_Icon/ChevronDown', 'Sort Icon', 14, MUTED))
  right.appendChild(sortSel)
  // showCount(BOOLEAN) — React ListToolbar의 show* prop 이름 그대로.
  const totalRow = autoFrame('showCount', 'HORIZONTAL')
  totalRow.counterAxisAlignItems = 'CENTER'
  totalRow.itemSpacing = 2
  const tl = boundText(ctx, '총', 13, 'color/secondary', SUB)
  tl.name = 'totalLabel'
  totalRow.appendChild(tl)
  const tv = boundText(ctx, '24', 13, 'color/text', INK, true)
  tv.name = 'total'
  totalRow.appendChild(tv)
  const tu = boundText(ctx, '건', 13, 'color/secondary', SUB)
  tu.name = 'totalUnit'
  totalRow.appendChild(tu)
  right.appendChild(totalRow)
  right.appendChild(btn(ctx, '상품 등록', 'primary', 'Action Label', 'sm'))
  c.appendChild(right)
  return c
}

// ══ DS/ToolbarActions ════════════════════════════════════════════════
// 축: size(sm|md|lg) × appearance(outline|ghost) × labelDisplay(icon|iconText) × refreshing(false|true).
// 내보내기·인쇄·새로고침·복사·공유 — 전부 아이콘 버튼. refreshing이면 새로고침 라벨이 refreshingLabel로
// 바뀐다(레이어 이름을 prop 이름으로 갈라 TEXT 두 개가 각자 붙는다, DropZone.label 패턴과 같다).
function renderToolbarActions(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const size = combo.size || 'md'
  const ghost = combo.appearance === 'ghost'
  const iconText = combo.labelDisplay === 'iconText'
  const refreshing = combo.refreshing === 'true'
  const box = size === 'sm' ? 28 : size === 'lg' ? 44 : 36
  const iconPx = size === 'sm' ? 14 : size === 'lg' ? 18 : 16

  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 4
  c.fills = []

  // labelLayer — labelDisplay='iconText'일 때만 그려지는 글자 레이어. new/newing 두 값이 서로 다른
  // prop(labels.refresh · labels.refreshing)이라 레이어 이름도 갈라야 TEXT 두 개가 각자 붙는다
  // (DropZone.label/draggingLabel과 같은 패턴).
  const mkBtn = (key: string, iconLayer: string, labelLayer: string, label: string, on = false): FrameNode => {
    const b = autoFrame(iconLayer.replace('Icon', '') + ' Button', 'HORIZONTAL')
    b.counterAxisSizingMode = iconText ? 'AUTO' : 'FIXED'
    if (!iconText) b.resize(box, box)
    b.primaryAxisAlignItems = 'CENTER'
    b.counterAxisAlignItems = 'CENTER'
    b.itemSpacing = 6
    if (iconText) {
      b.paddingLeft = b.paddingRight = 12
      b.resize(b.width, box)
    }
    b.cornerRadius = 8
    if (!ghost) {
      bindFillVar(ctx, b, 'color/bg', WHITE)
      bindStrokeVar(ctx, b, 'color/border', BORDER)
      b.strokeWeight = 1
      b.strokeAlign = 'INSIDE'
    } else b.fills = []
    b.appendChild(icon(key, iconLayer, iconPx, on ? ACCENT : SUB))
    if (iconText) {
      const t = boundText(ctx, label, size === 'sm' ? 12 : 13, on ? 'color/primary' : 'color/text', on ? ACCENT : INK, true)
      t.name = labelLayer
      b.appendChild(t)
    }
    return b
  }
  // 레이어 이름 = 바인딩되는 prop 이름 그대로('labels.export' 등, 점 표기 포함) — N6은 CSS 클래스가
  // 없으면 "그 세트가 선언한 prop 이름"을 합법 레이어로 인정한다.
  c.appendChild(mkBtn('_Icon/Download', 'exportIcon', 'labels.export', '내보내기'))
  c.appendChild(mkBtn('_Icon/Printer', 'printIcon', 'labels.print', '인쇄'))
  c.appendChild(
    mkBtn(
      '_Icon/RefreshCcw',
      'refreshIcon',
      refreshing ? 'labels.refreshing' : 'labels.refresh',
      refreshing ? '새로고침 중' : '새로고침',
      refreshing,
    ),
  )
  c.appendChild(mkBtn('_Icon/Copy', 'copyIcon', 'labels.copy', '복사'))
  c.appendChild(mkBtn('_Icon/Share', 'shareIcon', 'labels.share', '공유'))
  return c
}

// ══ DS/FormSection ═══════════════════════════════════════════════════
// 축: columns(1|2|3) × appearance(card|plain) × toggleable(false|true) × enabled(false|true).
// children 슬롯은 규약 §7대로 'content' 이름의 프레임(자리표시 필드 2장)이다 — N7이 이 이름을 찾는다.
function renderFormSection(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const columns = combo.columns || '3'
  const plain = combo.appearance === 'plain'
  const toggleable = combo.toggleable === 'true'
  const enabled = combo.enabled !== 'false'
  const showBody = !toggleable || enabled
  const w = 640

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 16
  if (!plain) {
    c.paddingTop = c.paddingBottom = c.paddingLeft = c.paddingRight = 20
    c.cornerRadius = 14
    bindFillVar(ctx, c, 'color/bg', WHITE)
    bindStrokeVar(ctx, c, 'color/border', BORDER)
    c.strokeWeight = 1
    c.strokeAlign = 'INSIDE'
  } else {
    c.fills = []
  }

  const head = autoFrame('head', 'HORIZONTAL')
  head.layoutAlign = 'STRETCH'
  head.primaryAxisSizingMode = 'FIXED'
  head.primaryAxisAlignItems = 'SPACE_BETWEEN'
  head.counterAxisAlignItems = 'MIN'
  head.itemSpacing = 12
  const headings = autoFrame('headings', 'VERTICAL')
  headings.itemSpacing = 4
  const titleRow = autoFrame('title', 'HORIZONTAL')
  titleRow.counterAxisAlignItems = 'CENTER'
  titleRow.itemSpacing = 8
  const idx = fixedFrame('index', 'HORIZONTAL', 22, 22)
  idx.primaryAxisAlignItems = 'CENTER'
  idx.counterAxisAlignItems = 'CENTER'
  idx.cornerRadius = 6
  bindSolidFill(ctx, idx, 'primary')
  idx.appendChild(boundText(ctx, '1', 11, onVarName('primary'), onHex(ctx, 'primary'), true))
  titleRow.appendChild(idx)
  const tt = boundText(ctx, '배너 구분', 15, 'color/text', INK, true)
  tt.name = 'titleText'
  titleRow.appendChild(tt)
  headings.appendChild(titleRow)
  const desc = boundText(ctx, '진열 위치에 맞는 배너 종류를 고릅니다.', 13, 'color/secondary', SUB)
  desc.name = 'description'
  headings.appendChild(desc)
  head.appendChild(headings)
  c.appendChild(head)

  if (toggleable) {
    const band = autoFrame('band', 'VERTICAL')
    band.layoutAlign = 'STRETCH'
    band.primaryAxisSizingMode = 'AUTO'
    band.itemSpacing = 4
    band.paddingTop = band.paddingBottom = 12
    band.paddingLeft = band.paddingRight = 16
    band.cornerRadius = 10
    if (enabled) bindFillVar(ctx, band, 'color/primary/50', tintHex(ACCENT, 0.92))
    else bindFillVar(ctx, band, 'color/bgSubtle', SURFACE)
    const bandRow = autoFrame('bandRow', 'HORIZONTAL')
    bandRow.layoutAlign = 'STRETCH'
    bandRow.primaryAxisSizingMode = 'FIXED'
    bandRow.primaryAxisAlignItems = 'SPACE_BETWEEN'
    bandRow.counterAxisAlignItems = 'CENTER'
    const bl = boundText(ctx, enabled ? '사용' : '사용', 13, enabled ? 'color/primary' : 'color/text', enabled ? ACCENT : INK, true)
    bl.name = 'toggleLabel'
    bandRow.appendChild(bl)
    bandRow.appendChild(toggleSw(ctx, enabled, 'Toggle'))
    band.appendChild(bandRow)
    // 밴드 문구 아래 보조 설명 — React FormSectionProps.toggleDescription 그대로.
    const bandDesc = boundText(ctx, '진열 위치에서 이 배너를 노출합니다.', 11, enabled ? 'color/primary' : 'color/secondary', enabled ? ACCENT : SUB)
    bandDesc.name = 'toggleDescription'
    band.appendChild(bandDesc)
    // 스위치 옆 ON/OFF 문구는 레이어 이름을 prop 이름(onLabel·offLabel)으로 갈라 TEXT 두 개가 각자 붙는다.
    const swLabel = boundText(ctx, enabled ? 'ON' : 'OFF', 11, 'color/secondary/400', MUTED)
    swLabel.name = enabled ? 'onLabel' : 'offLabel'
    swLabel.visible = false // 스위치 안 라벨은 toggleSw가 그리지 않는다 — TEXT 속성 자리만 예약
    band.appendChild(swLabel)
    if (!enabled) {
      const hint = boundText(ctx, '끄면 이 배너 영역이 노출되지 않습니다.', 12, 'color/secondary/700', SUB)
      hint.name = 'disabledHint'
      band.appendChild(hint)
    }
    c.appendChild(band)
  }

  if (showBody) {
    const body = autoFrame('content', 'HORIZONTAL')
    body.name = 'content' // children 슬롯 — 규약 §7
    body.layoutAlign = 'STRETCH'
    body.primaryAxisSizingMode = 'FIXED'
    body.layoutWrap = 'WRAP'
    body.itemSpacing = 16
    body.counterAxisSpacing = 16
    const colN = parseInt(columns, 10) || 3
    const fieldW = (w - 40 - 16 * (colN - 1)) / colN
    for (let i = 0; i < colN; i++) {
      const field = autoFrame('field ' + (i + 1), 'VERTICAL', )
      field.resize(fieldW, field.height)
      field.itemSpacing = 6
      field.appendChild(boundText(ctx, i === 0 ? '문구' : i === 1 ? '노출 기간' : '링크', 12, 'color/secondary', SUB, true))
      field.appendChild(miniInput(ctx, '', fieldW))
      body.appendChild(field)
    }
    c.appendChild(body)
  }
  return c
}

// ══ DS/FieldRow ══════════════════════════════════════════════════════
// 축: labelPlacement(top|left) × required(false|true) × span(1|2|3).
// children 슬롯은 규약 §7대로 'content' 이름(라벨 없는 입력 박스 하나로 그린다).
function renderFieldRow(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const left = combo.labelPlacement === 'left'
  const required = combo.required === 'true'
  const w = left ? 420 : 280

  const c = figma.createComponent()
  c.layoutMode = left ? 'HORIZONTAL' : 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = left ? 16 : 6
  c.counterAxisAlignItems = left ? 'MIN' : undefined as unknown as 'MIN'
  c.fills = []

  const labelRow = autoFrame('label', 'HORIZONTAL')
  if (left) {
    labelRow.resize(140, labelRow.height)
    labelRow.counterAxisSizingMode = 'FIXED'
    labelRow.paddingTop = 8
  }
  labelRow.counterAxisAlignItems = 'CENTER'
  labelRow.itemSpacing = 4
  const lt = boundText(ctx, '상품명', 13, 'color/text', INK, true)
  lt.name = 'labelText'
  labelRow.appendChild(lt)
  if (required) {
    const rm = boundText(ctx, '*', 13, 'color/error/600', VARIANT_HEX.error, true)
    rm.name = 'Required Mark'
    labelRow.appendChild(rm)
  }
  c.appendChild(labelRow)

  const control = autoFrame('content', 'VERTICAL')
  control.name = 'content' // children 슬롯 — 규약 §7
  control.layoutAlign = left ? 'INHERIT' : 'STRETCH'
  control.layoutGrow = left ? 1 : 0
  control.itemSpacing = 6
  control.appendChild(miniInput(ctx, '', left ? w - 140 - 16 : w))
  const desc = boundText(ctx, '한글·영문·숫자 40자 이내', 11, 'color/secondary', SUB)
  desc.name = 'description'
  control.appendChild(desc)
  c.appendChild(control)
  return c
}

// ══ DS/Placeholder ═══════════════════════════════════════════════════
// 축: kind(8종) — React PlaceholderKind 그대로. 실제 SVG 글리프(둥근 프레임+강조 심볼) 대신
// 뜻이 같은 아이콘 하나로 대표한다(플러그인엔 SVG path 렌더러가 없다) — 톤은 원본과 동일(대부분 primary,
// error/delete만 error, success만 success).
const PLACEHOLDER_ICON: Record<string, [string, string]> = {
  image: ['_Icon/Image', 'primary'],
  video: ['_Icon/Video', 'primary'],
  file: ['_Icon/File', 'primary'],
  empty: ['_Icon/Inbox', 'primary'],
  search: ['_Icon/Search', 'primary'],
  error: ['_Icon/CircleAlert', 'error'],
  delete: ['_Icon/Trash2', 'error'],
  success: ['_Icon/CircleCheck', 'success'],
}
const PLACEHOLDER_CAPTION: Record<string, string> = {
  image: '이미지 없음',
  video: '동영상 없음',
  file: '첨부 없음',
  empty: '내용 없음',
  search: '검색 결과 없음',
  error: '오류',
  delete: '삭제 확인',
  success: '완료',
}
function renderPlaceholder(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const kind = combo.kind || 'image'
  const [iconKey, tone] = PLACEHOLDER_ICON[kind] ?? PLACEHOLDER_ICON.image
  const toneHex = VARIANT_HEX[tone] ?? ACCENT

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.primaryAxisAlignItems = 'CENTER'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 8
  c.paddingTop = c.paddingBottom = c.paddingLeft = c.paddingRight = 12
  const frame = fixedFrame('frame', 'HORIZONTAL', 64, 56)
  frame.primaryAxisAlignItems = 'CENTER'
  frame.counterAxisAlignItems = 'CENTER'
  frame.cornerRadius = 10
  bindFillVar(ctx, frame, 'color/bgSubtle', SURFACE)
  frame.appendChild(icon(iconKey, 'symbol', 26, toneHex))
  c.appendChild(frame)
  const lb = boundText(ctx, PLACEHOLDER_CAPTION[kind] ?? kind, 12, 'color/secondary', SUB)
  lb.name = 'label'
  c.appendChild(lb)
  return c
}

// ══ DS/ContextMenu ═══════════════════════════════════════════════════
// 축: trigger(contextmenu|click) — React prop 그대로. 'open'은 코드에 없는 축이다(내부 useState) —
// 열린 메뉴 그림 없이는 문서가 될 수 없다(Select.open과 같은 사유, ALLOWLIST 필요).
// children(트리거) 슬롯은 규약 §7대로 'content' 이름이다.
const CTX_MENU_ITEMS: Array<[string, string, boolean]> = [
  ['보기', '_Icon/Eye', false],
  ['수정', '_Icon/Edit', false],
  ['복제', '_Icon/Copy', false],
  ['삭제', '_Icon/Trash2', true],
]
function renderContextMenu(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const click = combo.trigger === 'click'
  const open = combo.open !== 'false'

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.itemSpacing = 8
  c.fills = []

  const trigger = fixedFrame('content', 'HORIZONTAL', 180, 40)
  trigger.name = 'content' // children 슬롯 — 규약 §7
  trigger.primaryAxisAlignItems = 'CENTER'
  trigger.counterAxisAlignItems = 'CENTER'
  trigger.cornerRadius = 8
  bindFillVar(ctx, trigger, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, trigger, 'color/border', BORDER)
  trigger.strokeWeight = 1
  trigger.strokeAlign = 'INSIDE'
  trigger.dashPattern = [4, 4]
  trigger.appendChild(boundText(ctx, click ? '클릭해서 열기' : '우클릭해서 열기', 12, 'color/secondary', SUB))
  c.appendChild(trigger)

  if (open) {
    const menu = autoFrame('menu', 'VERTICAL')
    menu.resize(180, menu.height)
    menu.counterAxisSizingMode = 'FIXED'
    menu.itemSpacing = 2
    menu.paddingTop = menu.paddingBottom = menu.paddingLeft = menu.paddingRight = 4
    menu.cornerRadius = 10
    bindFillVar(ctx, menu, 'color/bg', WHITE)
    bindStrokeVar(ctx, menu, 'color/border', BORDER)
    menu.strokeWeight = 1
    menu.strokeAlign = 'INSIDE'
    menu.effects = [
      { type: 'DROP_SHADOW', color: { r: 0.06, g: 0.09, b: 0.16, a: 0.14 }, offset: { x: 0, y: 8 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL' },
    ]
    CTX_MENU_ITEMS.forEach(([label, key, danger], i) => {
      if (i === CTX_MENU_ITEMS.length - 1) {
        const div = fixedFrame('item-divider', 'HORIZONTAL', 172, 1)
        bindFillVar(ctx, div, 'color/border', BORDER)
        menu.appendChild(div)
      }
      const item = autoFrame('item', 'HORIZONTAL')
      item.layoutAlign = 'STRETCH'
      item.primaryAxisSizingMode = 'FIXED'
      item.counterAxisAlignItems = 'CENTER'
      item.itemSpacing = 8
      item.paddingTop = item.paddingBottom = item.paddingLeft = item.paddingRight = 8
      item.cornerRadius = 6
      const hex = danger ? VARIANT_HEX.error : SUB
      item.appendChild(icon(key, 'Item Icon ' + (i + 1), 15, danger ? VARIANT_HEX.error : SUB))
      const t = boundText(ctx, label, 13, danger ? 'color/error' : 'color/text', danger ? VARIANT_HEX.error : INK)
      t.name = 'Item ' + (i + 1)
      item.appendChild(t)
      void hex
      menu.appendChild(item)
    })
    c.appendChild(menu)
  }
  return c
}

// ══ DS/AttachmentList ════════════════════════════════════════════════
// 축: compact(false|true) — React prop 그대로. showHeader/showSummary/showThumbnail/showMeta는 BOOLEAN.
const ATTACH_ITEMS: Array<[string, string, string]> = [
  ['상세페이지_01.jpg', '2.4 MB', 'JPG'],
  ['상품설명서.pdf', '860 KB', 'PDF'],
  ['소개영상.mp4', '18.2 MB', 'MP4'],
]
function renderAttachmentList(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const compact = combo.compact === 'true'
  const w = 420

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = compact ? 0 : 8
  c.fills = []

  const header = autoFrame('header', 'HORIZONTAL')
  header.layoutAlign = 'STRETCH'
  header.primaryAxisSizingMode = 'FIXED'
  header.primaryAxisAlignItems = 'SPACE_BETWEEN'
  header.counterAxisAlignItems = 'CENTER'
  header.paddingBottom = 8
  const sm = boundText(ctx, `첨부 ${ATTACH_ITEMS.length}개 · 21.5 MB`, 13, 'color/secondary', SUB)
  sm.name = 'summary'
  header.appendChild(sm)
  header.appendChild(btn(ctx, '전체 다운로드', 'outline', 'downloadAllLabel', 'sm'))
  c.appendChild(header)

  const list = autoFrame('list', 'VERTICAL')
  list.layoutAlign = 'STRETCH'
  list.primaryAxisSizingMode = 'AUTO'
  list.itemSpacing = compact ? 0 : 8
  ATTACH_ITEMS.forEach(([name, size, ext], i) => {
    const row = autoFrame('item', 'HORIZONTAL')
    row.layoutAlign = 'STRETCH'
    row.primaryAxisSizingMode = 'FIXED'
    row.counterAxisAlignItems = 'CENTER'
    row.itemSpacing = 12
    row.paddingTop = row.paddingBottom = compact ? 6 : 8
    row.paddingLeft = row.paddingRight = compact ? 4 : 8
    if (compact) {
      if (i < ATTACH_ITEMS.length - 1) bottomBorder(ctx, row)
    } else {
      row.cornerRadius = 8
      bindStrokeVar(ctx, row, 'color/border', BORDER)
      row.strokeWeight = 1
      row.strokeAlign = 'INSIDE'
    }
    const thumbSize = compact ? 32 : 48
    row.appendChild(thumbBox(ctx, thumbSize, thumbSize, Math.round(thumbSize * 0.42), 'thumb'))
    const info = autoFrame('info', 'VERTICAL')
    info.layoutGrow = 1
    info.itemSpacing = 2
    const nt = boundText(ctx, name, 13, 'color/text', INK, true)
    nt.name = 'Item ' + (i + 1)
    info.appendChild(nt)
    const metaRow = autoFrame('meta', 'HORIZONTAL')
    metaRow.counterAxisAlignItems = 'CENTER'
    metaRow.itemSpacing = 6
    metaRow.appendChild(badge(ctx, ext, 'secondary', 'Ext ' + (i + 1)))
    metaRow.appendChild(boundText(ctx, size, 11, 'color/secondary/400', MUTED))
    info.appendChild(metaRow)
    row.appendChild(info)
    const actions = autoFrame('actions', 'HORIZONTAL')
    actions.counterAxisAlignItems = 'CENTER'
    actions.itemSpacing = 2
    // 첫 행만 미리보기 가능(이미지/동영상)한 것으로 데모한다 — React도 onPreview가 있고 미디어일 때만 그린다.
    if (i === 0) actions.appendChild(iconBtn(ctx, '_Icon/Eye', 'Preview ' + (i + 1), SUB, 28, 'previewIcon'))
    actions.appendChild(iconBtn(ctx, '_Icon/Download', 'Download ' + (i + 1), SUB, 28, 'downloadIcon'))
    actions.appendChild(iconBtn(ctx, '_Icon/Close', 'Remove ' + (i + 1), SUB, 28, 'removeIcon'))
    row.appendChild(actions)
    list.appendChild(row)
  })
  c.appendChild(list)
  return c
}

// ══ DS/CategoryTree ══════════════════════════════════════════════════
// 축: collapsible(false|true) — React prop 그대로. showCount는 BOOLEAN.
// value(선택된 key)는 화면에 글자로 그려지지 않는다 — 시각 표현은 선택 행의 강조다(Sidebar.value와 같은 사유).
const CT_NODES: Array<[string, number, Array<[string, number]>]> = [
  ['가구', 128, [['소파', 42], ['테이블', 51], ['수납장', 35]]],
  ['조명', 64, []],
  ['패브릭', 30, []],
]
function renderCategoryTree(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const collapsible = combo.collapsible !== 'false'
  const w = 260

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 14
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  const header = autoFrame('header', 'HORIZONTAL')
  header.layoutAlign = 'STRETCH'
  header.primaryAxisSizingMode = 'FIXED'
  header.primaryAxisAlignItems = 'SPACE_BETWEEN'
  header.counterAxisAlignItems = 'CENTER'
  header.paddingTop = header.paddingBottom = 8
  header.paddingLeft = header.paddingRight = 12
  bindFillVar(ctx, header, 'color/bgSubtle', SURFACE)
  bottomBorder(ctx, header)
  const tabs = boundText(ctx, '카테고리', 13, 'color/text', INK, true)
  tabs.name = 'tabs'
  header.appendChild(tabs)
  const add = btn(ctx, '추가', 'ghost', 'addLabel', 'sm')
  add.insertChild(0, icon('_Icon/Plus', 'addIcon', 14, ACCENT))
  header.appendChild(add)
  c.appendChild(header)

  const body = autoFrame('body', 'VERTICAL')
  body.layoutAlign = 'STRETCH'
  body.primaryAxisSizingMode = 'AUTO'
  body.paddingTop = body.paddingBottom = 4
  CT_NODES.forEach(([label, count, kids], i) => {
    const selected = i === 0
    const row = autoFrame('row', 'HORIZONTAL')
    row.layoutAlign = 'STRETCH'
    row.primaryAxisSizingMode = 'FIXED'
    row.counterAxisAlignItems = 'CENTER'
    row.itemSpacing = 4
    row.paddingLeft = 4
    if (selected) bindFillVar(ctx, row, 'color/primary/50', tintHex(ACCENT, 0.92))
    if (collapsible && kids.length)
      row.appendChild(icon('_Icon/ChevronRight', 'expandIcon', 14, MUTED))
    else {
      const spacer = fixedFrame('chevronSpacer', 'HORIZONTAL', 24, 24)
      row.appendChild(spacer)
    }
    const main = autoFrame('main', 'HORIZONTAL')
    main.layoutGrow = 1
    main.counterAxisAlignItems = 'CENTER'
    main.itemSpacing = 8
    main.paddingTop = main.paddingBottom = 8
    main.paddingRight = 12
    const lt = boundText(ctx, label, 13, selected ? 'color/primary' : 'color/text', selected ? ACCENT : INK, selected)
    lt.name = 'Node ' + (i + 1)
    lt.layoutGrow = 1
    main.appendChild(lt)
    const countWrap = autoFrame('showCount', 'HORIZONTAL')
    countWrap.appendChild(badge(ctx, String(count), 'secondary', 'Count ' + (i + 1)))
    main.appendChild(countWrap)
    row.appendChild(main)
    body.appendChild(row)
    if (kids.length) {
      kids.forEach(([klabel, kcount], ki) => {
        const kr = autoFrame('subrow', 'HORIZONTAL')
        kr.layoutAlign = 'STRETCH'
        kr.primaryAxisSizingMode = 'FIXED'
        kr.counterAxisAlignItems = 'CENTER'
        kr.paddingLeft = 40
        kr.paddingRight = 12
        kr.paddingTop = kr.paddingBottom = 6
        const kt = boundText(ctx, klabel, 12, 'color/secondary', SUB)
        kt.name = `Node ${i + 1} Sub ${ki + 1}`
        kt.layoutGrow = 1
        kr.appendChild(kt)
        kr.appendChild(badge(ctx, String(kcount), 'secondary', `SubCount ${i + 1}-${ki + 1}`))
        body.appendChild(kr)
      })
    }
  })
  c.appendChild(body)
  return c
}

// ══ DS/OptionRows ════════════════════════════════════════════════════
// 축: disabled(false|true) — React prop 그대로. showHeader/showReorder/showCount는 BOOLEAN.
function renderOptionRows(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const disabled = combo.disabled === 'true'
  const w = 640
  const colW = [160, 160, 120, 96]

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 8
  c.fills = []
  if (disabled) c.opacity = 0.45

  const head = autoFrame('head', 'HORIZONTAL')
  head.layoutAlign = 'STRETCH'
  head.primaryAxisSizingMode = 'FIXED'
  head.itemSpacing = 8
  head.paddingLeft = head.paddingRight = 4
  ;['옵션명', '옵션값', '추가금액', '재고'].forEach((h, i) => {
    const t = boundText(ctx, h, 11, 'color/secondary', SUB, true)
    t.resize(colW[i], t.height)
    head.appendChild(t)
  })
  c.appendChild(head)
  head.name = 'showHeader'

  const rows: Array<[string, string, string, string]> = [
    ['색상', '블랙', '0', '32'],
    ['색상', '화이트', '0', '18'],
    ['사이즈', 'L', '3,000', '9'],
  ]
  const list = autoFrame('list', 'VERTICAL')
  list.layoutAlign = 'STRETCH'
  list.primaryAxisSizingMode = 'AUTO'
  list.itemSpacing = 8
  rows.forEach(([name, value, extra, stock], i) => {
    const row = autoFrame('row', 'HORIZONTAL')
    row.layoutAlign = 'STRETCH'
    row.primaryAxisSizingMode = 'FIXED'
    row.counterAxisAlignItems = 'CENTER'
    row.itemSpacing = 8
    row.paddingTop = row.paddingBottom = row.paddingLeft = row.paddingRight = 8
    row.cornerRadius = 8
    bindFillVar(ctx, row, 'color/bg', WHITE)
    bindStrokeVar(ctx, row, 'color/border', BORDER)
    row.strokeWeight = 1
    row.strokeAlign = 'INSIDE'
    row.appendChild(miniInput(ctx, name, colW[0]))
    row.appendChild(miniInput(ctx, value, colW[1]))
    row.appendChild(miniInput(ctx, extra === '0' ? '' : extra, colW[2]))
    row.appendChild(miniInput(ctx, stock, colW[3]))
    const actions = autoFrame('actions', 'HORIZONTAL')
    actions.counterAxisAlignItems = 'CENTER'
    actions.itemSpacing = 2
    const reorder = autoFrame('showReorder', 'HORIZONTAL')
    reorder.itemSpacing = 2
    reorder.appendChild(iconBtn(ctx, '_Icon/ChevronUp', 'Up ' + (i + 1), SUB, 32, 'moveUpIcon'))
    reorder.appendChild(iconBtn(ctx, '_Icon/ChevronDown', 'Down ' + (i + 1), SUB, 32, 'moveDownIcon'))
    actions.appendChild(reorder)
    actions.appendChild(iconBtn(ctx, '_Icon/Trash2', 'Remove ' + (i + 1), VARIANT_HEX.error, 32, 'removeIcon'))
    row.appendChild(actions)
    list.appendChild(row)
  })
  c.appendChild(list)

  const footer = autoFrame('footer', 'HORIZONTAL')
  footer.layoutAlign = 'STRETCH'
  footer.primaryAxisSizingMode = 'FIXED'
  footer.primaryAxisAlignItems = 'SPACE_BETWEEN'
  footer.counterAxisAlignItems = 'CENTER'
  const addBtn = btn(ctx, '옵션 추가', 'outline', 'addLabel', 'sm')
  addBtn.insertChild(0, icon('_Icon/Plus', 'addIcon', 14, INK))
  footer.appendChild(addBtn)
  const count = autoFrame('showCount', 'HORIZONTAL')
  count.appendChild(boundText(ctx, `${rows.length}/20`, 12, 'color/secondary', SUB))
  footer.appendChild(count)
  c.appendChild(footer)
  return c
}

// ══ DS/GroupPanel ════════════════════════════════════════════════════
// 축: highlightFirst(false|true) — React prop 그대로(비-show 불리언은 축). showCount는 BOOLEAN.
// value(선택된 key)는 화면에 글자로 그려지지 않는다(Sidebar.value와 같은 사유). footnote는 ReactNode
// 슬롯(문단)이라 INSTANCE_SWAP으로 표현되지 않는다(AdminTopbar.actions와 같은 사유, ALLOWLIST 필요).
const GP_ITEMS: Array<[string, number, string]> = [
  ['전체 사용자', 1240, 'a'],
  ['VIP', 86, 'b'],
  ['신규', 52, 'b'],
  ['휴면', 340, 'c'],
]
function renderGroupPanel(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const highlightFirst = combo.highlightFirst !== 'false'
  const w = 220

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 14
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  const list = autoFrame('list', 'VERTICAL')
  list.layoutAlign = 'STRETCH'
  list.primaryAxisSizingMode = 'AUTO'
  GP_ITEMS.forEach(([label, count, group], i) => {
    const selected = i === 0
    const lead = highlightFirst && i === 0
    const boundary = i > 0 && GP_ITEMS[i - 1][2] !== group
    const row = autoFrame('item', 'HORIZONTAL')
    row.layoutAlign = 'STRETCH'
    row.primaryAxisSizingMode = 'FIXED'
    row.primaryAxisAlignItems = 'SPACE_BETWEEN'
    row.counterAxisAlignItems = 'CENTER'
    row.paddingTop = row.paddingBottom = 8
    row.paddingLeft = row.paddingRight = 12
    if (boundary) bindStrokeVar(ctx, row, 'color/border', BORDER)
    if (boundary) {
      row.strokeAlign = 'INSIDE'
      row.strokeTopWeight = 2
      row.strokeBottomWeight = row.strokeLeftWeight = row.strokeRightWeight = 0
    } else if (i > 0) bottomBorder(ctx, row)
    if (selected) bindFillVar(ctx, row, lead ? 'color/primary/50' : 'color/bgSubtle', lead ? tintHex(ACCENT, 0.92) : SURFACE)
    const lt = boundText(ctx, label, 13, lead && selected ? 'color/primary' : 'color/text', lead && selected ? ACCENT : INK, selected)
    lt.name = 'Item ' + (i + 1)
    row.appendChild(lt)
    const countWrap = autoFrame('showCount', 'HORIZONTAL')
    countWrap.appendChild(boundText(ctx, count.toLocaleString(), 11, 'color/secondary', SUB))
    row.appendChild(countWrap)
    list.appendChild(row)
  })
  c.appendChild(list)

  const footer = autoFrame('footer', 'VERTICAL')
  footer.layoutAlign = 'STRETCH'
  footer.primaryAxisSizingMode = 'AUTO'
  footer.itemSpacing = 8
  footer.paddingTop = footer.paddingBottom = footer.paddingLeft = footer.paddingRight = 12
  bottomBorder(ctx, footer) // 위쪽 구분선 자리 — bottomBorder는 아래쪽에 긋지만 footer가 리스트 다음이라 위쪽 경계로 보인다
  const add = btn(ctx, '새 그룹 만들기', 'ghost', 'addLabel', 'sm')
  add.insertChild(0, icon('_Icon/Plus', 'addIcon', 14, ACCENT))
  footer.appendChild(add)
  const fn = boundText(ctx, '그룹은 회원 등급에 따라 자동으로 나뉩니다.', 11, 'color/secondary', SUB)
  fn.name = 'footnote'
  footer.appendChild(fn)
  c.appendChild(footer)
  return c
}

// ══ DS/MobilePreview ═════════════════════════════════════════════════
// 축: statusBar(false|true) — React prop 그대로(비-show 불리언). showHomeIndicator/showNote는 BOOLEAN.
// children(미리보기 본문) 슬롯은 규약 §7대로 'content' 이름이다(CSS 클래스는 'viewport'지만 §7이 우선한다).
function renderMobilePreview(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const statusBar = combo.statusBar !== 'false'
  const w = 240
  const h = Math.round(w * 2.167)

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.counterAxisAlignItems = 'CENTER'
  c.itemSpacing = 12
  c.fills = []

  const bezel = fixedFrame('frame', 'VERTICAL', w + 16, h + 16)
  bezel.primaryAxisAlignItems = 'CENTER'
  bezel.counterAxisAlignItems = 'CENTER'
  bezel.cornerRadius = 32
  bindFillVar(ctx, bezel, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, bezel, 'color/border', BORDER)
  bezel.strokeWeight = 1
  bezel.strokeAlign = 'INSIDE'

  const screen = fixedFrame('screen', 'VERTICAL', w, h)
  screen.cornerRadius = 24
  screen.clipsContent = true
  bindFillVar(ctx, screen, 'color/bg', WHITE)
  bindStrokeVar(ctx, screen, 'color/border', BORDER)
  screen.strokeWeight = 1
  screen.strokeAlign = 'INSIDE'

  if (statusBar) {
    const sb = fixedFrame('statusBar', 'HORIZONTAL', w, 32)
    sb.primaryAxisAlignItems = 'SPACE_BETWEEN'
    sb.counterAxisAlignItems = 'CENTER'
    sb.paddingLeft = sb.paddingRight = 16
    const clk = boundText(ctx, '9:41', 11, 'color/text', INK, true)
    clk.name = 'statusTime'
    sb.appendChild(clk)
    const icons = autoFrame('statusIcons', 'HORIZONTAL')
    icons.counterAxisAlignItems = 'CENTER'
    icons.itemSpacing = 3
    icons.appendChild(icon('_Icon/Wifi', 'Wifi', 13, INK))
    icons.appendChild(icon('_Icon/Battery', 'Battery', 15, INK))
    sb.appendChild(icons)
    screen.appendChild(sb)
  }

  const content = autoFrame('content', 'VERTICAL')
  content.name = 'content' // children 슬롯 — 규약 §7(CSS 클래스명은 'viewport')
  content.layoutAlign = 'STRETCH'
  content.layoutGrow = 1
  content.itemSpacing = 10
  content.paddingTop = content.paddingBottom = content.paddingLeft = content.paddingRight = 14
  bindFillVar(ctx, content, 'color/bg', WHITE)
  content.appendChild(thumbBox(ctx, w - 28, 120, 28, 'Preview Media'))
  const pt = boundText(ctx, '프리미엄 원목 책상', 14, 'color/text', INK, true)
  content.appendChild(pt)
  const pp = boundText(ctx, '₩129,000', 16, 'color/text', INK, true)
  content.appendChild(pp)
  screen.appendChild(content)

  const home = autoFrame('showHomeIndicator', 'HORIZONTAL')
  home.resize(w, 18)
  home.primaryAxisAlignItems = 'CENTER'
  home.counterAxisAlignItems = 'CENTER'
  const bar = fixedFrame('homeIndicator', 'HORIZONTAL', 84, 4)
  bar.cornerRadius = 999
  bindFillVar(ctx, bar, 'color/border', BORDER)
  home.appendChild(bar)
  screen.appendChild(home)

  bezel.appendChild(screen)
  c.appendChild(bezel)

  const note = autoFrame('showNote', 'HORIZONTAL')
  note.resize(w, note.height)
  note.counterAxisSizingMode = 'FIXED'
  note.primaryAxisAlignItems = 'CENTER'
  const nt = boundText(ctx, '실제 상세페이지와 다르게 보일 수 있어요', 11, 'color/secondary', SUB)
  nt.name = 'note'
  nt.textAlignHorizontal = 'CENTER'
  note.appendChild(nt)
  c.appendChild(note)
  return c
}

// ══ DS/MainVisualUploader ════════════════════════════════════════════
// 코드에 유니온·불리언 prop이 하나도 없다(전부 show* BOOLEAN이거나 배열·콜백) — Figma 세트는 베리언트
// 축이 최소 1개 있어야 성립하므로 'state=default' 하나짜리 축을 둔다(SortBar·SiteFooter와 같은 사유,
// ALLOWLIST 필요). showLinkField/showVisibleToggle/showMoveButtons/showOrder는 BOOLEAN.
function renderMainVisualUploader(ctx: Ctx, _combo: Record<string, string>): ComponentNode {
  const w = 640

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 8
  c.fills = []

  const items: Array<[string, string]> = [
    ['메인 배너 1', 'https://example.com/promo'],
    ['메인 배너 2', ''],
  ]
  items.forEach(([title, link], i) => {
    const row = autoFrame('item', 'HORIZONTAL')
    row.layoutAlign = 'STRETCH'
    row.primaryAxisSizingMode = 'FIXED'
    row.counterAxisAlignItems = 'CENTER'
    row.itemSpacing = 12
    row.paddingTop = row.paddingBottom = row.paddingLeft = row.paddingRight = 10
    row.cornerRadius = 10
    bindFillVar(ctx, row, 'color/bg', WHITE)
    bindStrokeVar(ctx, row, 'color/border', BORDER)
    row.strokeWeight = 1
    row.strokeAlign = 'INSIDE'
    row.appendChild(icon('_Icon/Move', 'handle', 16, MUTED))
    const thumb = thumbBox(ctx, 120, 40, 18, 'thumb')
    const order = fixedFrame('showOrder', 'HORIZONTAL', 18, 18)
    order.primaryAxisAlignItems = 'CENTER'
    order.counterAxisAlignItems = 'CENTER'
    order.cornerRadius = 4
    bindSolidFill(ctx, order, 'primary')
    order.appendChild(boundText(ctx, String(i + 1), 10, onVarName('primary'), onHex(ctx, 'primary'), true))
    order.layoutPositioning = 'ABSOLUTE'
    order.x = 4
    order.y = 4
    thumb.appendChild(order)
    row.appendChild(thumb)
    const fields = autoFrame('fields', 'VERTICAL')
    fields.layoutGrow = 1
    fields.itemSpacing = 6
    fields.appendChild(miniInput(ctx, title, 220))
    const linkField = autoFrame('showLinkField', 'VERTICAL')
    linkField.appendChild(miniInput(ctx, link === '' ? '' : link, 220))
    fields.appendChild(linkField)
    row.appendChild(fields)
    const side = autoFrame('side', 'VERTICAL')
    side.counterAxisAlignItems = 'MAX'
    side.itemSpacing = 8
    const visible = autoFrame('showVisibleToggle', 'HORIZONTAL')
    visible.appendChild(toggleSw(ctx, true, 'Visible Toggle'))
    side.appendChild(visible)
    const actions = autoFrame('showMoveButtons', 'HORIZONTAL')
    actions.itemSpacing = 2
    actions.appendChild(iconBtn(ctx, '_Icon/ChevronUp', 'Up ' + (i + 1), SUB, 28, 'moveUpIcon'))
    actions.appendChild(iconBtn(ctx, '_Icon/ChevronDown', 'Down ' + (i + 1), SUB, 28, 'moveDownIcon'))
    side.appendChild(actions)
    row.appendChild(side)
    row.appendChild(iconBtn(ctx, '_Icon/Trash2', 'Remove ' + (i + 1), VARIANT_HEX.error, 28, 'removeIcon'))
    c.appendChild(row)
  })

  const drop = fixedFrame('dropzone', 'VERTICAL', w, 64)
  drop.primaryAxisAlignItems = 'CENTER'
  drop.counterAxisAlignItems = 'CENTER'
  drop.itemSpacing = 4
  drop.cornerRadius = 10
  bindFillVar(ctx, drop, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, drop, 'color/border', BORDER)
  drop.strokeWeight = 1
  drop.strokeAlign = 'INSIDE'
  drop.dashPattern = [6, 6]
  // 아이콘 시스템엔 ImagePlus가 없다(icons-data.ts 목록 확인) — 뜻이 같은 Image로 대신한다.
  drop.appendChild(icon('_Icon/Image', 'addIcon', 18, ACCENT))
  const hintRow = autoFrame('hint', 'HORIZONTAL')
  hintRow.counterAxisAlignItems = 'CENTER'
  hintRow.itemSpacing = 4
  const rh = boundText(ctx, '권장 1920×640', 12, 'color/secondary', SUB)
  rh.name = 'ratioHint'
  hintRow.appendChild(rh)
  const dl = boundText(ctx, '· 클릭하거나 이미지를 끌어다 놓으세요', 12, 'color/text', INK, true)
  dl.name = 'addLabel'
  hintRow.appendChild(dl)
  drop.appendChild(hintRow)
  c.appendChild(drop)
  return c
}

// ══ DS/AnalyticsTable ════════════════════════════════════════════════
// 축: density(comfortable|compact) × striped(false|true) × stickyHeader(false|true) ×
//     stickySummary(false|true) × dimZero(false|true) — 전부 React prop 이름 그대로(비-show 불리언은 축).
// showHeader는 BOOLEAN. columns·rows·summaries는 배열이라 축이 될 수 없다 — 데모 데이터로만 채운다.
const AT_COLS = ['일자', '주문수', '매출액', '방문자']
const AT_ROWS: Array<[string, string, string, string]> = [
  ['07-08', '18', '2,140,000', '512'],
  ['07-09', '0', '0', '340'],
  ['07-10', '24', '3,050,000', '601'],
  ['07-11', '31', '3,880,000', '742'],
]
function renderAnalyticsTable(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const compact = combo.density === 'compact'
  const striped = combo.striped === 'true'
  const stickyHeader = combo.stickyHeader !== 'false'
  const stickySummary = combo.stickySummary !== 'false'
  const dimZero = combo.dimZero !== 'false'
  const w = 480
  const colW = w / AT_COLS.length
  const rowH = compact ? 36 : 44

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 14
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  const head = autoFrame('showHeader', 'HORIZONTAL')
  head.layoutAlign = 'STRETCH'
  head.primaryAxisSizingMode = 'FIXED'
  head.resize(w, compact ? 32 : 40)
  bindFillVar(ctx, head, 'color/bgSubtle', SURFACE)
  bottomBorder(ctx, head)
  if (stickyHeader) head.appendChild(icon('_Icon/Pin', 'Sticky Pin', 0, SUB)) // 자리표시 없음(0px) — 존재 여부만 표기
  AT_COLS.forEach((label, i) => {
    const cell = fixedFrame('th', 'HORIZONTAL', colW, compact ? 32 : 40)
    cell.primaryAxisAlignItems = i === 0 ? 'MIN' : 'MAX'
    cell.counterAxisAlignItems = 'CENTER'
    cell.paddingLeft = cell.paddingRight = 12
    cell.appendChild(boundText(ctx, label, 11, 'color/secondary', SUB, true))
    head.appendChild(cell)
  })
  c.appendChild(head)

  AT_ROWS.forEach((row, ri) => {
    const tr = autoFrame('row', 'HORIZONTAL')
    tr.layoutAlign = 'STRETCH'
    tr.primaryAxisSizingMode = 'FIXED'
    tr.resize(w, rowH)
    if (ri < AT_ROWS.length - 1) bottomBorder(ctx, tr)
    if (striped && ri % 2 === 1) bindFillVar(ctx, tr, 'color/bgSubtle', SURFACE)
    row.forEach((value, ci) => {
      const cell = fixedFrame('td', 'HORIZONTAL', colW, rowH)
      cell.primaryAxisAlignItems = ci === 0 ? 'MIN' : 'MAX'
      cell.counterAxisAlignItems = 'CENTER'
      cell.paddingLeft = cell.paddingRight = 12
      const isZero = dimZero && (value === '0' || value === '0,000')
      cell.appendChild(boundText(ctx, value, 13, isZero ? 'color/secondary/300' : 'color/text', isZero ? MUTED : INK, ci > 0))
      tr.appendChild(cell)
    })
    c.appendChild(tr)
  })

  const sum = autoFrame('summaryRow', 'HORIZONTAL')
  sum.layoutAlign = 'STRETCH'
  sum.primaryAxisSizingMode = 'FIXED'
  sum.resize(w, rowH)
  bindFillVar(ctx, sum, 'color/bgSubtle', SURFACE)
  bindStrokeVar(ctx, sum, 'color/border', BORDER)
  sum.strokeAlign = 'INSIDE'
  sum.strokeTopWeight = 1
  sum.strokeBottomWeight = sum.strokeLeftWeight = sum.strokeRightWeight = 0
  if (stickySummary) sum.appendChild(icon('_Icon/Pin', 'Sticky Pin 2', 0, SUB))
  const sumVals = ['합계', '73', '9,070,000', '2,195']
  sumVals.forEach((value, ci) => {
    const cell = fixedFrame('summaryCell', 'HORIZONTAL', colW, rowH)
    cell.primaryAxisAlignItems = ci === 0 ? 'MIN' : 'MAX'
    cell.counterAxisAlignItems = 'CENTER'
    cell.paddingLeft = cell.paddingRight = 12
    cell.appendChild(boundText(ctx, value, 13, 'color/text', INK, true))
    sum.appendChild(cell)
  })
  c.appendChild(sum)
  return c
}

// ══ DS/ConsentList ═══════════════════════════════════════════════════
// 축: density(compact|comfortable) × columns(1|2) × appearance(solid|soft|outline) — appearance는
// BadgeProps['appearance'](인덱스드 액세스 타입)를 따라간 것이라 Badge와 값이 같다.
const CONSENT_ITEMS: Array<[string, boolean]> = [
  ['만 14세 이상입니다', true],
  ['서비스 이용약관 동의', true],
  ['개인정보 수집·이용 동의', true],
  ['마케팅 정보 수신 동의', false],
]
function renderConsentList(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const compact = combo.density !== 'comfortable'
  const cols = combo.columns === '2' ? 2 : 1
  const appearance = (combo.appearance || 'soft') as 'solid' | 'soft' | 'outline'
  const rowH = compact ? 36 : 44
  const colW = 220

  const c = figma.createComponent()
  c.layoutMode = 'HORIZONTAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'AUTO'
  c.itemSpacing = 0
  c.cornerRadius = 12
  c.clipsContent = true
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  const perCol = Math.ceil(CONSENT_ITEMS.length / cols)
  for (let col = 0; col < cols; col++) {
    const colFrame = fixedFrame('col', 'VERTICAL', colW, rowH * perCol)
    if (col > 0) rightBorder(ctx, colFrame)
    for (let r = 0; r < perCol; r++) {
      const idx = col * perCol + r
      const item = CONSENT_ITEMS[idx]
      if (!item) continue
      const [label, agreed] = item
      const row = fixedFrame('row', 'HORIZONTAL', colW, rowH)
      row.counterAxisAlignItems = 'CENTER'
      row.paddingLeft = row.paddingRight = 12
      if (idx < CONSENT_ITEMS.length - 1 && r < perCol - 1) bottomBorder(ctx, row)
      const lt = boundText(ctx, label, 13, 'color/secondary', SUB)
      lt.name = 'Label ' + (idx + 1)
      lt.layoutGrow = 1
      row.appendChild(lt)
      const status = autoFrame('status', 'HORIZONTAL')
      status.counterAxisAlignItems = 'CENTER'
      status.itemSpacing = 4
      // 레이어 이름을 agreed/denied로 공유한다 — note가 없는 항목은 전부 같은 문구(동의/미동의)를
      // 쓰는 React 규칙과 같다(TodoSummary의 countUnit처럼, 여러 칸이 하나의 TEXT 속성을 공유).
      status.appendChild(
        icon(agreed ? '_Icon/Check' : '_Icon/Minus', agreed ? 'agreedIcon' : 'deniedIcon', 13, agreed ? VARIANT_HEX.success : SUB),
      )
      status.appendChild(badge(ctx, agreed ? '동의' : '미동의', agreed ? 'success' : 'secondary', agreed ? 'agreedLabel' : 'deniedLabel'))
      row.appendChild(status)
      colFrame.appendChild(row)
    }
    c.appendChild(colFrame)
  }
  void appearance
  return c
}

// ══ DS/FormAnchorNav ═════════════════════════════════════════════════
// 축: sticky(false|true) — React prop 그대로. showInvalidDot은 BOOLEAN.
// activeKey(선택된 섹션 key)는 화면에 글자로 그려지지 않는다(Sidebar.value와 같은 사유, ALLOWLIST 필요).
const FAN_SECTIONS: Array<[string, boolean]> = [
  ['기본 정보', false],
  ['이미지', true],
  ['옵션', false],
  ['배송·반품', false],
  ['노출·기간', false],
]
function renderFormAnchorNav(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const sticky = combo.sticky !== 'false'
  const w = 200

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 2
  c.paddingTop = c.paddingBottom = c.paddingLeft = c.paddingRight = 8
  c.cornerRadius = 14
  bindFillVar(ctx, c, 'color/bg', WHITE)
  bindStrokeVar(ctx, c, sticky ? 'color/primary/200' : 'color/border', sticky ? tintHex(ACCENT, 0.6) : BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  FAN_SECTIONS.forEach(([label, invalid], i) => {
    const active = i === 1
    const row = autoFrame('link', 'HORIZONTAL')
    row.layoutAlign = 'STRETCH'
    row.primaryAxisSizingMode = 'FIXED'
    row.counterAxisAlignItems = 'CENTER'
    row.itemSpacing = 8
    row.paddingTop = row.paddingBottom = 8
    row.paddingLeft = 10
    row.paddingRight = 12
    row.cornerRadius = 8
    if (active) {
      bindFillVar(ctx, row, 'color/primary/50', tintHex(ACCENT, 0.94))
      bindStrokeVar(ctx, row, 'color/primary', ACCENT)
      row.strokeAlign = 'INSIDE'
      row.strokeLeftWeight = 3
      row.strokeTopWeight = row.strokeBottomWeight = row.strokeRightWeight = 0
    }
    const lt = boundText(ctx, label, 13, active ? 'color/primary' : 'color/secondary', active ? ACCENT : SUB, active)
    lt.name = 'Section ' + (i + 1)
    lt.layoutGrow = 1
    row.appendChild(lt)
    if (invalid) {
      const dot = figma.createEllipse()
      dot.name = 'showInvalidDot'
      dot.resize(6, 6)
      bindFillVar(ctx, dot, 'color/error', VARIANT_HEX.error)
      row.appendChild(dot)
    }
    c.appendChild(row)
  })
  return c
}

// ══ DS/RichTextEditor ════════════════════════════════════════════════
// 축: disabled(false|true) × state(filled|empty) — state는 코드에 없는 축이다(값/플레이스홀더 그림이
// 다르다, DropZone.state와 같은 사유). showToolbar/showLinkButton/showImageButton은 BOOLEAN.
function renderRichTextEditor(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const disabled = combo.disabled === 'true'
  const empty = combo.state === 'empty'
  const w = 480

  const c = figma.createComponent()
  c.layoutMode = 'VERTICAL'
  c.primaryAxisSizingMode = 'AUTO'
  c.counterAxisSizingMode = 'FIXED'
  c.resize(w, c.height)
  c.itemSpacing = 0
  c.cornerRadius = 10
  c.clipsContent = true
  bindFillVar(ctx, c, disabled ? 'color/bgSubtle' : 'color/bg', disabled ? SURFACE : WHITE)
  bindStrokeVar(ctx, c, 'color/border', BORDER)
  c.strokeWeight = 1
  c.strokeAlign = 'INSIDE'

  const toolbar = autoFrame('showToolbar', 'HORIZONTAL')
  toolbar.layoutAlign = 'STRETCH'
  toolbar.primaryAxisSizingMode = 'FIXED'
  toolbar.counterAxisAlignItems = 'CENTER'
  toolbar.itemSpacing = 2
  toolbar.paddingTop = toolbar.paddingBottom = toolbar.paddingLeft = toolbar.paddingRight = 6
  bindFillVar(ctx, toolbar, 'color/bgSubtle', SURFACE)
  bottomBorder(ctx, toolbar)
  const toolBtn = (key: string, layer: string, on = false): FrameNode =>
    iconBtn(ctx, key, layer, on ? ACCENT : SUB, 30, layer)
  ;[
    ['_Icon/Bold', 'boldIcon', true],
    ['_Icon/Italic', 'italicIcon', false],
    ['_Icon/Underline', 'underlineIcon', false],
  ].forEach(([key, layer, on]) => toolbar.appendChild(toolBtn(key as string, layer as string, on as unknown as boolean)))
  toolbar.appendChild(vDivider(ctx))
  toolbar.appendChild(toolBtn('_Icon/List', 'listIcon'))
  toolbar.appendChild(toolBtn('_Icon/ListOrdered', 'orderedListIcon'))
  toolbar.appendChild(vDivider(ctx))
  const linkBtn = toolBtn('_Icon/Link', 'linkIcon')
  linkBtn.name = 'showLinkButton'
  toolbar.appendChild(linkBtn)
  const imgBtn = toolBtn('_Icon/Image', 'imageIcon')
  imgBtn.name = 'showImageButton'
  toolbar.appendChild(imgBtn)
  toolbar.appendChild(vDivider(ctx))
  toolbar.appendChild(toolBtn('_Icon/AlignLeft', 'alignIcon'))
  c.appendChild(toolbar)

  const body = fixedFrame('body', 'VERTICAL', w, 140)
  body.paddingTop = body.paddingBottom = body.paddingLeft = body.paddingRight = 16
  if (empty) {
    const ph = boundText(ctx, '내용을 입력하세요', 14, 'color/secondary', SUB)
    ph.name = 'placeholder'
    body.appendChild(ph)
  } else {
    const val = boundText(
      ctx,
      '이 상품은 고급 원목으로 제작되어 견고하고 오래 사용할 수 있습니다. 색상은 총 3가지로 제공됩니다.',
      14,
      'color/text',
      INK,
    )
    val.name = 'value'
    body.appendChild(val)
  }
  c.appendChild(body)
  return c
}

// ══ DS/AdminChart ════════════════════════════════════════════════════
// 축: kind(bar|donut|line|area) × stacked(false|true) × legendPosition(bottom|right|top).
// orientation은 축에서 뺐다 — kind='bar'에만 영향한다(AdminChart.tsx:357, "bar에만 적용된다(donut/
// line/area에는 영향 없음)"). kind×stacked×legendPosition만으로 이미 24변형인데 orientation까지
// 더하면 48변형(권장 상한 40 초과)이고, 그 4값 중 3값(donut·line·area)은 orientation 두 값의 그림이
// 완전히 같은 중복 변형이 된다 — ALLOWLIST(axis-missing, code:'orientation') 필요.
// stacked는 donut 분기에서 한 번도 참조되지 않는다(AdminChart.tsx:246-294)는 것도 같은 종류의 낭비지만,
// bar·line·area(75%)에서는 실제로 그림이 달라져(그룹형 ↔ 누적형) 축으로 남길 값이 있다고 판단했다.
const AC_CATEGORIES = ['1월', '2월', '3월', '4월', '5월']
const AC_SERIES_A = [32, 48, 40, 65, 58] // 매출 — primary
const AC_SERIES_B = [24, 30, 28, 40, 36] // 전년동기 — success
const AC_DONUT: Array<[string, number, string]> = [
  ['가구', 42, 'primary'],
  ['조명', 27, 'success'],
  ['패브릭', 18, 'warning'],
  ['주방', 13, 'secondary'],
]

/** 도넛 — EllipseNode.arcData로 실제 파이 조각을 그린다(불리언 연산 없이). innerRadius=0.68 = chart.js cutout. */
function donutRing(ctx: Ctx, size: number, slices: Array<[string, number, string]>): FrameNode {
  const wrap = figma.createFrame()
  wrap.name = 'ring'
  wrap.resize(size, size)
  wrap.fills = []
  const total = slices.reduce((s, [, v]) => s + v, 0)
  let angle = -Math.PI / 2
  for (const [, value, tone] of slices) {
    const sweep = (value / total) * Math.PI * 2
    const e = figma.createEllipse()
    e.resize(size, size)
    e.arcData = { startingAngle: angle, endingAngle: angle + sweep, innerRadius: 0.68 }
    bindSolidFill(ctx, e, tone)
    wrap.appendChild(e)
    angle += sweep
  }
  return wrap
}

/** 값 축 그리드 — 3줄. showGrid(BOOLEAN)가 이 프레임째 끈다. */
function chartGrid(ctx: Ctx, w: number, h: number): FrameNode {
  const grid = fixedFrame('showGrid', 'VERTICAL', w, h)
  grid.layoutPositioning = 'ABSOLUTE'
  grid.itemSpacing = 0
  for (let i = 0; i < 3; i++) {
    const line = fixedFrame('gridline', 'HORIZONTAL', w, 1)
    line.layoutAlign = 'STRETCH'
    bindFillVar(ctx, line, 'color/border', BORDER)
    grid.appendChild(line)
    if (i < 2) {
      const gap = fixedFrame('gap', 'VERTICAL', w, h / 3 - 1)
      grid.appendChild(gap)
    }
  }
  return grid
}

/** 막대 — stacked면 한 칸에 두 톤을 쌓고, 아니면 두 막대를 나란히 세운다. */
function barsPlot(ctx: Ctx, w: number, h: number, stacked: boolean, showTooltip: boolean): FrameNode {
  const plot = fixedFrame('plot', 'HORIZONTAL', w, h)
  plot.counterAxisAlignItems = 'MAX'
  const maxVal = Math.max(...AC_SERIES_A, ...AC_SERIES_B.map((v, i) => (stacked ? v + AC_SERIES_A[i] : v))) * 1.15
  const slotW = w / AC_CATEGORIES.length
  AC_CATEGORIES.forEach((_, i) => {
    const slot = fixedFrame('slot', 'HORIZONTAL', slotW, h)
    slot.primaryAxisAlignItems = 'CENTER'
    slot.counterAxisAlignItems = 'MAX'
    slot.itemSpacing = 4
    const a = AC_SERIES_A[i]
    const b = AC_SERIES_B[i]
    if (stacked) {
      const stack = fixedFrame('bar', 'VERTICAL', 28, Math.round(((a + b) / maxVal) * h))
      stack.itemSpacing = 0
      const segB = fixedFrame('segB', 'HORIZONTAL', 28, Math.round((b / maxVal) * h))
      bindSolidFill(ctx, segB, 'success')
      segB.cornerRadius = 4
      stack.appendChild(segB)
      const segA = fixedFrame('segA', 'HORIZONTAL', 28, Math.round((a / maxVal) * h))
      bindSolidFill(ctx, segA, 'primary')
      segA.cornerRadius = 4
      stack.appendChild(segA)
      slot.appendChild(stack)
    } else {
      const barA = fixedFrame('barA', 'HORIZONTAL', 16, Math.round((a / maxVal) * h))
      bindSolidFill(ctx, barA, 'primary')
      barA.cornerRadius = 4
      slot.appendChild(barA)
      const barB = fixedFrame('barB', 'HORIZONTAL', 16, Math.round((b / maxVal) * h))
      bindSolidFill(ctx, barB, 'success')
      barB.cornerRadius = 4
      slot.appendChild(barB)
    }
    plot.appendChild(slot)
  })
  // showTooltip — 실제 호버 상호작용은 정적 문서에 없으므로, 켜졌을 때 데모 툴팁 말풍선 하나로 대신 보여준다.
  if (showTooltip) {
    const tip = autoFrame('showTooltip', 'VERTICAL')
    tip.layoutPositioning = 'ABSOLUTE'
    tip.x = slotW * 3 - 20
    tip.y = 4
    tip.paddingTop = tip.paddingBottom = 4
    tip.paddingLeft = tip.paddingRight = 8
    tip.cornerRadius = 6
    bindFillVar(ctx, tip, 'color/text', INK)
    const tt = boundText(ctx, '65', 11, 'color/bg', WHITE, true)
    tip.appendChild(tt)
    plot.appendChild(tip)
  }
  return plot
}

/** 선/영역 — stacked면 series B를 series A 위로 누적한다(chart.js stacked area와 같은 뜻). */
function linePlot(ctx: Ctx, w: number, h: number, stacked: boolean, area: boolean): FrameNode {
  const wrap = figma.createFrame()
  wrap.name = 'plot'
  wrap.resize(w, h)
  wrap.fills = []
  const n = AC_CATEGORIES.length
  const bVals = stacked ? AC_SERIES_B.map((v, i) => v + AC_SERIES_A[i]) : AC_SERIES_B
  const maxVal = Math.max(...AC_SERIES_A, ...bVals) * 1.15
  const stepX = w / (n - 1)
  const pt = (i: number, v: number) => [i * stepX, h - (v / maxVal) * h]

  const drawSeries = (values: number[], tone: string, name: string) => {
    const pts = values.map((v, i) => pt(i, v))
    if (area) {
      const path =
        `M ${pts[0][0]} ${h} ` + pts.map(([x, y]) => `L ${x} ${y}`).join(' ') + ` L ${pts[pts.length - 1][0]} ${h} Z`
      const fill = figma.createVector()
      fill.name = name + 'Fill'
      fill.vectorPaths = [{ windingRule: 'NONZERO', data: path }]
      bindSolidFill(ctx, fill, tone)
      fill.opacity = 0.3 // bindTokens가 opacity/30 변수로 후처리 바인딩
      wrap.appendChild(fill)
    }
    const line = figma.createVector()
    line.name = name
    line.vectorPaths = [{ windingRule: 'NONE', data: 'M ' + pts.map(([x, y]) => `${x} ${y}`).join(' L ') }]
    const vv = ctx.vars.get(solidVarName(tone))
    line.strokes = [vv ? boundPaint(vv) : solid(VARIANT_HEX[tone] ?? ACCENT)]
    line.strokeWeight = 2.5
    line.strokeCap = 'ROUND'
    line.strokeJoin = 'ROUND'
    wrap.appendChild(line)
  }
  drawSeries(AC_SERIES_A, 'primary', 'seriesA')
  drawSeries(bVals, 'success', 'seriesB')
  return wrap
}

/** 범례 — 톤 점 + 라벨. direction에 따라 가로/세로로 쌓는다. */
function legendRow(ctx: Ctx, items: Array<[string, string]>, vertical: boolean): FrameNode {
  const row = autoFrame('showLegend', vertical ? 'VERTICAL' : 'HORIZONTAL')
  row.counterAxisAlignItems = vertical ? 'MIN' : 'CENTER'
  row.itemSpacing = vertical ? 6 : 16
  items.forEach(([label, tone], i) => {
    const item = autoFrame('legendItem', 'HORIZONTAL')
    item.counterAxisAlignItems = 'CENTER'
    item.itemSpacing = 6
    const dot = figma.createEllipse()
    dot.name = 'Legend Dot ' + (i + 1)
    dot.resize(8, 8)
    bindSolidFill(ctx, dot, tone)
    item.appendChild(dot)
    const t = boundText(ctx, label, 12, 'color/secondary', SUB)
    t.name = 'Legend ' + (i + 1)
    item.appendChild(t)
    row.appendChild(item)
  })
  return row
}

function renderAdminChart(ctx: Ctx, combo: Record<string, string>): ComponentNode {
  const kind = combo.kind || 'bar'
  const stacked = combo.stacked === 'true'
  const legendPosition = combo.legendPosition || 'bottom'
  const donut = kind === 'donut'
  const area = kind === 'area'
  const showTooltip = true // 항상 데모 툴팁을 보여준다 — BOOLEAN 자체는 아래서 바인딩한다
  const cw = legendPosition === 'right' ? 320 : 420
  const ch = 200

  const root = figma.createComponent()
  root.layoutMode = 'VERTICAL'
  root.primaryAxisSizingMode = 'AUTO'
  root.counterAxisSizingMode = 'AUTO'
  root.itemSpacing = 12
  root.fills = []

  const title = boundText(ctx, donut ? '카테고리별 판매 비중' : '월별 매출 추이', 16, 'color/text', INK, true)
  title.name = 'title'
  root.appendChild(title)

  const stage = autoFrame('stage', 'HORIZONTAL')
  stage.itemSpacing = 20
  stage.counterAxisAlignItems = 'CENTER'

  const plotCol = autoFrame('plotCol', 'VERTICAL')
  plotCol.itemSpacing = 12
  if (legendPosition === 'top') plotCol.appendChild(legendRow(ctx, [['매출', 'primary'], ['전년동기', 'success']], false))

  const canvas = fixedFrame('canvas', 'HORIZONTAL', cw, ch)
  canvas.primaryAxisAlignItems = 'CENTER'
  canvas.counterAxisAlignItems = 'CENTER'
  if (donut) {
    canvas.appendChild(donutRing(ctx, ch, AC_DONUT))
    const centerWrap = autoFrame('center', 'VERTICAL')
    centerWrap.layoutPositioning = 'ABSOLUTE'
    centerWrap.x = cw / 2 - 40
    centerWrap.y = ch / 2 - 20
    centerWrap.resize(80, 40)
    centerWrap.counterAxisSizingMode = 'FIXED'
    centerWrap.primaryAxisAlignItems = 'CENTER'
    centerWrap.counterAxisAlignItems = 'CENTER'
    centerWrap.itemSpacing = 2
    const total = boundText(ctx, String(AC_DONUT.reduce((s, [, v]) => s + v, 0)), 20, 'color/text', INK, true)
    total.name = 'showCenterTotal'
    total.textAlignHorizontal = 'CENTER'
    centerWrap.appendChild(total)
    const cap = boundText(ctx, '합계', 11, 'color/secondary', SUB)
    cap.name = 'centerLabel'
    cap.textAlignHorizontal = 'CENTER'
    centerWrap.appendChild(cap)
    canvas.appendChild(centerWrap)
  } else {
    const plotWrap = fixedFrame('plotWrap', 'VERTICAL', cw, ch)
    plotWrap.appendChild(chartGrid(ctx, cw, ch))
    const plot = kind === 'bar' ? barsPlot(ctx, cw, ch, stacked, showTooltip) : linePlot(ctx, cw, ch, stacked, area)
    plot.layoutPositioning = 'ABSOLUTE'
    plot.x = 0
    plot.y = 0
    plotWrap.appendChild(plot)
    canvas.appendChild(plotWrap)
  }
  plotCol.appendChild(canvas)

  if (!donut) {
    const axis = autoFrame('categoryAxis', 'HORIZONTAL')
    axis.resize(cw, axis.height)
    axis.counterAxisSizingMode = 'FIXED'
    AC_CATEGORIES.forEach((label, i) => {
      const cell = fixedFrame('axisLabel', 'HORIZONTAL', cw / AC_CATEGORIES.length, 18)
      cell.primaryAxisAlignItems = 'CENTER'
      cell.appendChild(boundText(ctx, label, 11, 'color/secondary/400', MUTED))
      axis.appendChild(cell)
      void i
    })
    plotCol.appendChild(axis)
  }
  if (legendPosition === 'bottom') plotCol.appendChild(legendRow(ctx, [['매출', 'primary'], ['전년동기', 'success']], false))
  stage.appendChild(plotCol)

  if (legendPosition === 'right') {
    stage.appendChild(
      legendRow(
        ctx,
        donut ? AC_DONUT.map(([label, , tone]): [string, string] => [label, tone]) : [['매출', 'primary'], ['전년동기', 'success']],
        true,
      ),
    )
  }
  root.appendChild(stage)
  return root
}

// ══ 카테고리 정의 ════════════════════════════════════════════════════
const ADMIN_CATEGORY: CategoryDef = {
  pageName: PAGE_ADMIN,
  title: 'Admin',
  subtitle:
    '관리자 화면(셸·목록·상세)을 이루는 컴포넌트 계열. 스토리북 src/ds의 어드민 컴포넌트를 그대로 옮긴 편집형 베리언트 세트입니다.',
  docs: [
    {
      key: 'AdminSidebar',
      setName: 'DS/AdminSidebar',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '어드민 좌측 내비게이션(대시보드 · 회원관리 · 상품관리 · 문의관리 · 회사관리 · 메인비주얼 관리). ' +
        "active 축이 '현재 메뉴'다 — 17. Admin Screens의 화면들이 자기 메뉴 id로 이 인스턴스를 세운다. " +
        '선택된 항목이 속한 그룹만 서브메뉴가 펼쳐지고, 미니 모드(폭 64)는 아이콘만 남기고 접습니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/AdminSidebar',
          [
            { name: 'collapsed', values: ['false', 'true'] },
            // 값 목록은 admin-menu.ts가 만든다(메뉴가 늘면 축도 같이 는다).
            { name: 'active', values: ADMIN_ACTIVE_VALUES },
          ],
          (c) => renderAdminSidebar(ctx, c),
          {
            texts: [
              { prop: 'Brand', layer: 'Brand', def: 'Admin Console' },
              { prop: 'Badge', layer: 'Badge', def: '12' },
            ],
            swaps: [{ prop: 'Item Icon', layer: 'Item Icon', defKey: '_Icon/Package' }],
          },
        ),
      states: [
        { caption: '대시보드 (240)', props: {} },
        { caption: '상품관리 > 상품', props: { active: 'products' } },
        { caption: '회사관리 > 연혁', props: { active: 'history' } },
        { caption: '미니 (64)', props: { collapsed: 'true' } },
      ],
    },
    {
      key: 'AdminTopbar',
      setName: 'DS/AdminTopbar',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '페이지 헤더. 타이틀만 있으면 72, 브레드크럼·설명이 붙으면 104. 우측은 액션 슬롯 + 사용자 영역입니다. ' +
        'surface=plain은 면·보더 없이 높이만 hug하는 변형으로, 17. Admin Screens의 12개 화면이 이 인스턴스를 페이지 헤더로 씁니다 ' +
        '(액션·사용자는 Show Actions / Show User로 끄고 화면이 자기 액션을 옆에 붙입니다).',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/AdminTopbar',
          [
            { name: 'stacked', values: ['false', 'true'] },
            { name: 'surface', values: ['bar', 'plain'] },
          ],
          (c) => renderAdminTopbar(ctx, c),
          {
            texts: [
              { prop: 'title', layer: 'title', def: '상품 목록' },
              { prop: 'description', layer: 'description', def: '등록된 상품을 확인하고 판매 상태를 관리합니다.' },
              { prop: 'Action 1', layer: 'Action 1', def: '엑셀 다운로드' },
              { prop: 'Action 2', layer: 'Action 2', def: '상품 등록' },
              { prop: 'user.name', layer: 'user.name', def: '홍길동' },
              { prop: 'user.role', layer: 'user.role', def: '운영 관리자' },
            ],
            bools: [
              { prop: 'showBreadcrumb', layer: 'showBreadcrumb', def: true },
              // showAvatar — React AdminTopbar의 show* prop 이름 그대로(규약 §3).
              { prop: 'showAvatar', layer: 'showAvatar', def: true },
              // 'Show Actions'/'Show User'는 React에 짝이 없다 — 코드에선 actions/user prop을 '안 넘기면'
              // 사라지는데 Figma엔 '속성 없음'이 없어 BOOLEAN으로만 표현된다. ALLOWLIST에 사유를 적었다.
              { prop: 'Show Actions', layer: 'actions', def: true },
              { prop: 'Show User', layer: 'user', def: true },
            ],
          },
        ),
      states: [
        { caption: '타이틀만 (72)', props: {} },
        { caption: '브레드크럼 + 설명 (104)', props: { stacked: 'true' } },
        { caption: 'Plain (화면 페이지 헤더)', props: { stacked: 'true', surface: 'plain' } },
      ],
    },
    {
      key: 'AdminTable',
      setName: 'DS/AdminTable',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '목록 표. 선택 · 상품번호 · 이미지 · 상품명(grow) · 판매가 · 상태 · 재고 · 카테고리 · 등록일 · 관리 컬럼. ' +
        '밀도에 따라 행 높이가 44/56, frame=flush는 보더·라운드를 빼 이미 카드 안(툴바·페이지네이션과 한 몸)에 놓일 때 씁니다. ' +
        "열 단위 ON/OFF는 BOOLEAN 'Show <컬럼>'입니다(레포 규약의 columnVisibility). '3. 상품 목록' 화면이 이 세트의 인스턴스입니다.",
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/AdminTable',
          [
            { name: 'density', values: ['comfortable', 'compact'] },
            { name: 'frame', values: ['card', 'flush'] },
            // striped — React AdminTable의 유니온/불리언 prop 이름 그대로(규약 §2).
            { name: 'striped', values: ['false', 'true'] },
          ],
          (c) => renderAdminTable(ctx, c),
          {
            // 행 제목은 rows[] 배열 데이터를 인덱스로 편 것이다(prop이 아니다) — verify-naming ALLOWLIST 참조.
            texts: TBL_ROWS.map((r, i) => ({
              prop: `Row Title ${i + 1}`,
              layer: `Row Title ${i + 1}`,
              def: r[1],
            })),
            bools: [
              // 열 단위 ON/OFF = columnVisibility. 상품명 열은 항상 켜 둔다(제외 필터가 'Title'이라
              // 소문자 레이어와 안 맞아 여태 'Show title'이 새어 나왔다).
              ...TBL_DEF.filter((col) => col.layer !== 'title').map((col) => ({
                prop: `Show ${col.layer}`,
                layer: col.layer,
                def: true,
              })),
              // 행 단위 ON/OFF — 5행보다 짧은 목록도 빈 행 없이 만든다.
              ...TBL_ROWS.map((_, i) => ({ prop: `Show Row ${i + 1}`, layer: `Row ${i + 1}`, def: true })),
              // showFooterWhenEmpty — React AdminTable의 show* prop 이름 그대로(기본 true, AdminTable.tsx:493과 동일).
              // 레이어 'footer'는 이 세트가 늘 페이지 크기·일괄 액션·페이지네이션이 없는(항상 '비어 있는')
              // 데모라 renderFooter가 항상 showFooterWhenEmpty 하나로 결정된다 — false면 빈 줄이 통째로 사라진다.
              { prop: 'showFooterWhenEmpty', layer: 'footer', def: true },
            ],
            // 행 액션 아이콘 — React의 ReactNode prop 이름 그대로(뭉뚱그린 'Icon' 금지, 규약 §5).
            swaps: [
              { prop: 'editIcon', layer: 'editIcon', defKey: '_Icon/Edit' },
              { prop: 'deleteIcon', layer: 'deleteIcon', defKey: '_Icon/Trash2' },
            ],
          },
        ),
      // 컬럼 on/off는 베리언트 축이 아니라 BOOLEAN 속성이라 states(setProperties)로는 걸지 않는다
      // — 인스턴스 패널에서 끄면 컬럼이 통째로 사라진다.
      states: [
        { caption: 'Comfortable (56)', props: {} },
        { caption: 'Compact (44)', props: { density: 'compact' } },
        { caption: 'Flush (카드 안)', props: { frame: 'flush' } },
      ],
    },
    {
      key: 'AdminCard',
      setName: 'DS/AdminCard',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '카드형 목록의 한 장. 썸네일(16:9 · compact는 4:3) + 배지 오버레이 + 대표값 강조 + 상태 토글/수정/삭제 액션 바. ' +
        'active(판매중/중지) · density · appearance는 React prop과 같은 이름의 축이고, ' +
        '썸네일·보조 메타는 showThumbnail / showSubMeta로 끕니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/AdminCard',
          [
            { name: 'selected', values: ['false', 'true'] },
            // 'true'를 앞에 둔다 → 기본 변형이 '판매중'으로 남아 기존 모양이 유지된다.
            { name: 'active', values: ['true', 'false'] },
            { name: 'density', values: ['comfortable', 'compact'] },
            { name: 'appearance', values: ['outline', 'elevated', 'plain'] },
          ],
          (c) => renderAdminCard(ctx, c),
          {
            texts: [
              { prop: 'title', layer: 'title', def: '프리미엄 원목 책상' },
              { prop: 'subtitle', layer: 'subtitle', def: '가구 · 서재' },
              { prop: 'activeLabel', layer: 'activeLabel', def: '판매중' },
              { prop: 'inactiveLabel', layer: 'inactiveLabel', def: '중지' },
            ],
            bools: [
              { prop: 'showThumbnail', layer: 'media', def: true },
              { prop: 'showSubMeta', layer: 'subMeta', def: true },
            ],
          },
        ),
      states: [
        { caption: '기본', props: {} },
        { caption: '선택됨', props: { selected: 'true' } },
        { caption: '중지(품절)', props: { active: 'false' } },
        { caption: 'Compact (4:3)', props: { density: 'compact' } },
        { caption: 'Elevated', props: { appearance: 'elevated' } },
      ],
    },
    {
      key: 'ViewSwitch',
      setName: 'DS/ViewSwitch',
      eyebrow: 'ATOM · ADMIN',
      desc:
        '목록 보기 방식 전환(카드형 / 게시물형). 선택된 쪽만 흰 배경 + primary 라벨. ' +
        'size(sm·md·lg)와 orientation(가로·세로 레일)은 React prop과 같은 이름의 축이고, ' +
        'showLabel 속성으로 라벨을 껐다 켤 수 있습니다(꺼지면 아이콘만).',
      // 속성은 전부 buildSet의 props 스펙으로 넘긴다 — 예전처럼 addComponentProperty를 밖에서 직접
      // 부르면 정적 추출기(scripts/lib/figma-sets.mjs)가 못 봐서 검증에서 통째로 빠진다.
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/ViewSwitch',
          [
            { name: 'value', values: ['card', 'board'] },
            { name: 'size', values: ['sm', 'md', 'lg'] },
            { name: 'orientation', values: ['horizontal', 'vertical'] },
          ],
          (c) => renderViewSwitch(ctx, c),
          {
            // 옵션 라벨 문구는 labels.options(Partial<Record<value,string>>) — 키마다 다른 맵이라
            // 단일 TEXT 속성으로 표현할 수 없다. 그래서 문구는 열지 않고 ON/OFF만 연다.
            bools: [{ prop: 'showLabel', layer: 'label', def: true }],
          },
        ),
      states: [
        { caption: '카드형', props: {} },
        { caption: '게시물형', props: { value: 'board' } },
        { caption: 'Small', props: { size: 'sm' } },
        { caption: '세로 레일', props: { orientation: 'vertical' } },
      ],
    },
    {
      key: 'SearchPanel',
      setName: 'DS/SearchPanel',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '목록 상단 다중 조건 검색. 라벨 상단형 필드 4개(텍스트·셀렉트·기간·상태)와 [초기화][검색] 버튼. ' +
        'appearance=plain은 이미 카드 안에 놓일 때 껍데기를 벗기고, loading이면 검색 버튼이 searchingLabel로 바뀝니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/SearchPanel',
          [
            { name: 'loading', values: ['false', 'true'] },
            { name: 'appearance', values: ['card', 'plain'] },
          ],
          (c) => renderSearchPanel(ctx, c),
          {
            texts: [
              { prop: 'searchLabel', layer: 'searchLabel', def: '검색' },
              { prop: 'searchingLabel', layer: 'searchingLabel', def: '검색 중…' },
              { prop: 'resetLabel', layer: 'resetLabel', def: '초기화' },
            ],
            bools: [
              { prop: 'showLabels', layer: 'label', def: true },
              { prop: 'showReset', layer: 'showReset', def: true },
              { prop: 'showSearch', layer: 'showSearch', def: true },
            ],
          },
        ),
      states: [
        { caption: '기본 (4필드)', props: {} },
        { caption: 'Loading', props: { loading: 'true' } },
        { caption: 'Plain (카드 안)', props: { appearance: 'plain' } },
      ],
    },
    {
      key: 'CrudDialog',
      setName: 'DS/CrudDialog',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '등록·수정·삭제 확인 모달. delete는 경고 아이콘 + 빨강 확인 버튼(danger), create/edit는 폼 본문. ' +
        'loading이면 확인 버튼이 loadingLabel로 바뀌고, 경고 문구·아이콘은 showWarning / showIcon으로 끕니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/CrudDialog',
          [
            { name: 'mode', values: ['create', 'edit', 'delete'] },
            { name: 'loading', values: ['false', 'true'] },
          ],
          (c) => renderCrudDialog(ctx, c),
          {
            texts: [
              { prop: 'title', layer: 'title', def: '등록' },
              { prop: 'description', layer: 'description', def: '선택한 상품 3건을 삭제합니다.' },
              { prop: 'warningText', layer: 'warning', def: '삭제한 데이터는 되돌릴 수 없습니다.' },
              { prop: 'confirmLabel', layer: 'confirmLabel', def: '등록' },
              { prop: 'cancelLabel', layer: 'cancelLabel', def: '취소' },
              { prop: 'loadingLabel', layer: 'loadingLabel', def: '처리 중…' },
            ],
            bools: [
              { prop: 'showWarning', layer: 'warning', def: true },
              { prop: 'showIcon', layer: 'dangerIcon', def: true },
            ],
            swaps: [{ prop: 'icon', layer: 'icon', defKey: '_Icon/AlertCircle' }],
          },
        ),
      states: [
        { caption: 'Create', props: {} },
        { caption: 'Edit', props: { mode: 'edit' } },
        { caption: 'Delete (danger)', props: { mode: 'delete' } },
        { caption: 'Delete · 처리 중', props: { mode: 'delete', loading: 'true' } },
      ],
    },
    {
      key: 'DropZone',
      setName: 'DS/DropZone',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '파일 드래그&드롭 영역. dragging이면 테두리·배경이 primary로 바뀌고 문구가 draggingLabel로 바뀝니다. ' +
        'compact는 한 줄짜리(폼 안 좁은 칸), disabled는 흐려진 잠금 상태이고 안내 문구는 showLabel로 끕니다. ' +
        '포트폴리오/상품 등록 화면의 업로드 영역이 이 인스턴스입니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/DropZone',
          [
            { name: 'state', values: ['idle', 'dragging'] },
            { name: 'compact', values: ['false', 'true'] },
            { name: 'disabled', values: ['false', 'true'] },
          ],
          (c) => renderDropZone(ctx, c),
          {
            texts: [
              { prop: 'label', layer: 'label', def: '파일을 끌어다 놓거나 클릭해서 선택하세요' },
              { prop: 'draggingLabel', layer: 'draggingLabel', def: '여기에 놓으세요' },
              { prop: 'hint', layer: 'hint', def: 'PNG, JPG · 파일당 최대 10MB' },
            ],
            bools: [{ prop: 'showLabel', layer: 'showLabel', def: true }],
          },
        ),
      states: [
        { caption: 'Idle', props: {} },
        { caption: 'Dragging', props: { state: 'dragging' } },
        { caption: 'Compact', props: { compact: 'true' } },
        { caption: 'Disabled', props: { disabled: 'true' } },
      ],
    },
    {
      key: 'StatusTimeline',
      setName: 'DS/StatusTimeline',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '처리 상태 진행(접수 → 확인중 → 답변완료 → 종료). done은 success 체크, current는 primary 링, 연결선은 done 구간만 채워집니다. ' +
        '단계 라벨·시각이 전부 TEXT 속성이라 문의 상세 화면이 vertical 인스턴스로 이 블록을 씁니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/StatusTimeline',
          [{ name: 'direction', values: ['horizontal', 'vertical'] }],
          (c) => renderStatusTimeline(ctx, c),
          {
            // 레이어 이름 = 속성 이름(규약 §6). 단계 라벨·시각은 steps[] 배열 데이터를 인덱스로 편 것이라
            // prop이 아니다 — verify-naming ALLOWLIST에 사유를 적었다.
            texts: flatProps(
              STEPS.map((s, i): TextProp[] => [
                { prop: `Step ${i + 1}`, layer: `Step ${i + 1}`, def: s.label },
                { prop: `Step ${i + 1} Meta`, layer: `Step ${i + 1} Meta`, def: s.at },
              ]),
            ),
            bools: [{ prop: 'showMeta', layer: 'showMeta', def: true }],
            swaps: [{ prop: 'doneIcon', layer: 'doneIcon', defKey: '_Icon/Check' }],
          },
        ),
      states: [
        { caption: 'Horizontal', props: {} },
        { caption: 'Vertical', props: { direction: 'vertical' } },
      ],
    },
    {
      key: 'TodoSummary',
      setName: 'DS/TodoSummary',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '대시보드 상단 "오늘의 할일" 카드. 헤더(제목·총 건수·기준 시각) + 6칸 분할 행(아이콘·라벨·건수·chevron). ' +
        "칸 단위 ON/OFF는 'Show Todo 1'…'Show Todo 6'이고, 대시보드 화면이 이 세트의 인스턴스입니다.",
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/TodoSummary',
          [
            { name: 'size', values: ['md', 'sm'] }, // 'md'가 앞 = 기본 변형이 기존 모양
            { name: 'framed', values: ['true', 'false'] },
          ],
          (c) => renderTodoSummary(ctx, c),
          {
            texts: [
              { prop: 'title', layer: 'title', def: '오늘의 할일' },
              { prop: 'countUnit', layer: 'countUnit', def: '건' },
              // 라벨·건수는 items[] 배열 데이터를 인덱스로 편 것이다(prop이 아니다) — ALLOWLIST 참조.
              ...flatProps(
                TODO_ITEMS.map((it, i): TextProp[] => [
                  { prop: `Label ${i + 1}`, layer: `Label ${i + 1}`, def: it[0] },
                  { prop: `Count ${i + 1}`, layer: `Count ${i + 1}`, def: it[1] },
                ]),
              ),
            ],
            bools: [
              { prop: 'showHeader', layer: 'header', def: true },
              { prop: 'showTotalBadge', layer: 'totalBadge', def: true },
              // 칸 단위 ON/OFF — items[] 배열의 가시성이라 React엔 짝이 되는 show* prop이 없다(ALLOWLIST).
              ...TODO_ITEMS.map((_, i) => ({ prop: `Show Todo ${i + 1}`, layer: `Todo ${i + 1}`, def: true })),
            ],
          },
        ),
      states: [
        { caption: '기본', props: {} },
        { caption: 'Small', props: { size: 'sm' } },
        { caption: 'Framed 해제 (카드 안)', props: { framed: 'false' } },
      ],
    },
    {
      key: 'ActivityLog',
      setName: 'DS/ActivityLog',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '최근 활동 로그. 타입별 아이콘 칩(문의·주문·상품·회원) + 문장 + 시각, 안 읽은 항목엔 primary 점. ' +
        'timeFormat=absolute는 감사 로그처럼 "언제 정확히"가 근거가 되는 화면용이고, ' +
        '제목 줄·아이콘·시각·미읽음 점은 showHeader / showIcon / showTime / showUnreadDot으로 각각 끕니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/ActivityLog',
          [
            { name: 'compact', values: ['false', 'true'] },
            { name: 'timeFormat', values: ['relative', 'absolute'] },
          ],
          (c) => renderActivityLog(ctx, c),
          {
            texts: [
              { prop: 'title', layer: 'title', def: '최근 활동' },
              { prop: 'viewAllLabel', layer: 'viewAllLabel', def: '전체보기' },
            ],
            bools: [
              { prop: 'showHeader', layer: 'head', def: true },
              { prop: 'showIcon', layer: 'icon', def: true },
              { prop: 'showTime', layer: 'time', def: true },
              { prop: 'showUnreadDot', layer: 'dot', def: true },
            ],
            swaps: [{ prop: 'viewAllIcon', layer: 'viewAllIcon', defKey: '_Icon/ChevronRight' }],
          },
        ),
      states: [
        { caption: '기본', props: {} },
        { caption: 'Compact', props: { compact: 'true' } },
        { caption: '절대 시각', props: { timeFormat: 'absolute' } },
      ],
    },
    {
      key: 'MemoBox',
      setName: 'DS/MemoBox',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '관리자 메모 카드. 고객에게 보이지 않는 내부 메모 + 글자수 카운터 + 저장 버튼. ' +
        'saving이면 입력·버튼이 잠기고 문구가 savingLabel로 바뀌며, framed를 끄면 이미 카드 안에 넣을 수 있습니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/MemoBox',
          [
            { name: 'saving', values: ['false', 'true'] },
            { name: 'framed', values: ['true', 'false'] }, // 'true'가 앞 = 기본 변형이 기존 모양
          ],
          (c) => renderMemoBox(ctx, c),
          {
            texts: [
              { prop: 'title', layer: 'title', def: '관리자 메모' },
              { prop: 'description', layer: 'description', def: '고객에게 노출되지 않습니다.' },
              { prop: 'placeholder', layer: 'placeholder', def: '고객 응대 시 참고할 내용을 남겨 주세요.' },
              { prop: 'saveLabel', layer: 'saveLabel', def: '저장' },
              { prop: 'savingLabel', layer: 'savingLabel', def: '저장 중…' },
            ],
            bools: [
              { prop: 'showHeader', layer: 'head', def: true },
              { prop: 'showCounter', layer: 'showCounter', def: true },
            ],
            swaps: [{ prop: 'saveIcon', layer: 'saveIcon', defKey: '_Icon/Save' }],
          },
        ),
      states: [
        { caption: '기본', props: {} },
        { caption: '저장 중', props: { saving: 'true' } },
        { caption: 'Framed 해제 (카드 안)', props: { framed: 'false' } },
      ],
    },
    {
      key: 'DefinitionList',
      setName: 'DS/DefinitionList',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '라벨-값 정의형 정보 블록(회원 ID·계정·연락처·생일·성별·회원 유형·가입 경로). 라벨은 고정폭 120. ' +
        "7행 고정에 행 단위 ON/OFF('Show Row 1'…'Show Row 7')라 상세 화면(고객 상세 7행 · 문의 상세 6행)이 같은 인스턴스로 조립됩니다.",
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/DefinitionList',
          [
            { name: 'frame', values: ['card', 'flush'] },
            // divider·density는 React prop 이름 그대로. 기본값을 앞에 둬 기존 모양을 지킨다.
            { name: 'divider', values: ['true', 'false'] },
            { name: 'density', values: ['comfortable', 'compact'] },
          ],
          (c) => renderDefinitionList(ctx, c),
          {
            texts: flatProps(
              DL_ROWS.map((r, i): TextProp[] => [
                { prop: `Label ${i + 1}`, layer: `Label ${i + 1}`, def: r[0] },
                { prop: `Value ${i + 1}`, layer: `Value ${i + 1}`, def: r[1] },
              ]),
            ),
            bools: DL_ROWS.map((_, i) => ({ prop: `Show Row ${i + 1}`, layer: `Row ${i + 1}`, def: true })),
          },
        ),
      states: [
        { caption: '기본 (7행 · 44)', props: {} },
        { caption: 'Flush (카드 안)', props: { frame: 'flush' } },
      ],
    },
    {
      key: 'SortableList',
      setName: 'DS/SortableList',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '드래그로 순서를 바꾸는 목록. direction=vertical은 카드 행(순번·핸들+제목+담당자 배지), ' +
        'grid는 이미지 타일이 가로로 흐릅니다. handleOnly는 좌측 핸들에서 시작한 드래그만 허용하고, ' +
        'disabled는 목록 전체가 흐려집니다(React .disabledList와 같은 불투명도).',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/SortableList',
          [
            { name: 'direction', values: ['vertical', 'grid'] },
            { name: 'disabled', values: ['false', 'true'] },
            { name: 'handleOnly', values: ['false', 'true'] },
          ],
          (c) => renderSortableList(ctx, c),
        ),
      states: [
        { caption: '세로 목록', props: {} },
        { caption: '핸들 전용', props: { handleOnly: 'true' } },
        { caption: '그리드', props: { direction: 'grid' } },
        { caption: '비활성', props: { disabled: 'true' } },
      ],
    },
    {
      key: 'ImagePreview',
      setName: 'DS/ImagePreview',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '첨부·이미지 크게 보기 뷰어. 헤더(파일명·카운터·확대/축소·닫기) + 스테이지(좌우 이동) + 하단 썸네일 스트립. ' +
        'inline은 fixed 오버레이 없이 문서/데모용으로 정적 배치하는 변형이고, open=false는 React가 실제로 아무것도 ' +
        '그리지 않는 상태를 그대로 옮겼습니다. 요소 단위(showHeader·showCount·showZoom·showNav·showThumbnails)는 ' +
        '전부 ON/OFF로 열려 있습니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/ImagePreview',
          [
            { name: 'open', values: ['true', 'false'] },
            { name: 'inline', values: ['true', 'false'] },
          ],
          (c) => renderImagePreview(ctx, c),
          {
            bools: [
              { prop: 'showHeader', layer: 'header', def: true },
              { prop: 'showCount', layer: 'counter', def: true },
              { prop: 'showZoom', layer: 'showZoom', def: true },
              { prop: 'showNav', layer: 'nav', def: true },
              { prop: 'showThumbnails', layer: 'strip', def: true },
            ],
            swaps: [
              { prop: 'closeIcon', layer: 'closeIcon', defKey: '_Icon/Close' },
              { prop: 'prevIcon', layer: 'prevIcon', defKey: '_Icon/ChevronLeft' },
              { prop: 'nextIcon', layer: 'nextIcon', defKey: '_Icon/ChevronRight' },
              { prop: 'zoomInIcon', layer: 'zoomInIcon', defKey: '_Icon/ZoomIn' },
              { prop: 'zoomOutIcon', layer: 'zoomOutIcon', defKey: '_Icon/ZoomOut' },
            ],
          },
        ),
      states: [
        { caption: '기본(inline)', props: {} },
        { caption: '오버레이', props: { inline: 'false' } },
        { caption: '스테이지만', props: { showHeader: 'false', showThumbnails: 'false' } },
        { caption: '닫힘(open=false)', props: { open: 'false' } },
      ],
    },
    {
      key: 'RowActions',
      setName: 'DS/RowActions',
      eyebrow: 'ATOM · ADMIN',
      desc:
        '목록 행 우측 아이콘 액션(상세·수정·삭제). size·appearance는 React prop과 같은 이름의 축이고, ' +
        '아이콘은 viewIcon·editIcon·deleteIcon으로 갈아 끼웁니다. 문구는 전부 툴팁/접근성 이름이라 화면에 글자로 그려지지 않습니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/RowActions',
          [
            { name: 'size', values: ['sm', 'md', 'lg'] },
            { name: 'appearance', values: ['outline', 'ghost'] },
          ],
          (c) => renderRowActions(ctx, c),
          {
            swaps: [
              { prop: 'viewIcon', layer: 'viewIcon', defKey: '_Icon/Eye' },
              { prop: 'editIcon', layer: 'editIcon', defKey: '_Icon/Edit' },
              { prop: 'deleteIcon', layer: 'deleteIcon', defKey: '_Icon/Trash2' },
            ],
          },
        ),
      states: [
        { caption: 'Outline (기본)', props: {} },
        { caption: 'Ghost', props: { appearance: 'ghost' } },
        { caption: 'Small', props: { size: 'sm' } },
      ],
    },
    {
      key: 'ListToolbar',
      setName: 'DS/ListToolbar',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '목록 상단 바. layout=admin은 흰 카드(필터 Select+검색 · 정렬 Select+건수+액션), layout=site는 ' +
        "카드 크롬 없이 좌측 '전체 N개' + 우측 컨트롤(구 SortBar 흡수)입니다. showCount로 건수를 끕니다.",
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/ListToolbar',
          [
            { name: 'layout', values: ['admin', 'site'] },
            { name: 'appearance', values: ['card', 'plain'] },
          ],
          (c) => renderListToolbar(ctx, c),
          {
            texts: [
              { prop: 'totalLabel', layer: 'totalLabel', def: '총' },
              { prop: 'totalUnit', layer: 'totalUnit', def: '건' },
              { prop: 'searchPlaceholder', layer: 'searchPlaceholder', def: '검색어를 입력하세요' },
              { prop: 'totalSuffix', layer: 'totalSuffix', def: '의 상품이 있습니다' },
            ],
            bools: [{ prop: 'showCount', layer: 'showCount', def: true }],
          },
        ),
      states: [
        { caption: 'Admin', props: {} },
        { caption: 'Admin · Plain', props: { appearance: 'plain' } },
        { caption: 'Site (구 SortBar)', props: { layout: 'site' } },
      ],
    },
    {
      key: 'ToolbarActions',
      setName: 'DS/ToolbarActions',
      eyebrow: 'ATOM · ADMIN',
      desc:
        '목록 상단 공용 액션 묶음(내보내기·인쇄·새로고침·복사·공유). size·appearance·labelDisplay·refreshing은 ' +
        '전부 React prop과 같은 이름의 축이고, labelDisplay=iconText는 아이콘 옆에 글자를 함께 보여줍니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/ToolbarActions',
          [
            { name: 'size', values: ['sm', 'md', 'lg'] },
            { name: 'appearance', values: ['outline', 'ghost'] },
            { name: 'labelDisplay', values: ['icon', 'iconText'] },
            { name: 'refreshing', values: ['false', 'true'] },
          ],
          (c) => renderToolbarActions(ctx, c),
          {
            // labelDisplay='iconText' 변형에만 존재하는 레이어다 — findAll이 그 변형에서만 찾아 붙인다
            // (다른 변형엔 해당 이름의 TEXT 레이어 자체가 없다, AdminTopbar.showBreadcrumb와 같은 패턴).
            texts: [
              { prop: 'labels.export', layer: 'labels.export', def: '내보내기' },
              { prop: 'labels.print', layer: 'labels.print', def: '인쇄' },
              { prop: 'labels.refresh', layer: 'labels.refresh', def: '새로고침' },
              { prop: 'labels.refreshing', layer: 'labels.refreshing', def: '새로고침 중' },
              { prop: 'labels.copy', layer: 'labels.copy', def: '복사' },
              { prop: 'labels.share', layer: 'labels.share', def: '공유' },
            ],
            swaps: [
              { prop: 'exportIcon', layer: 'exportIcon', defKey: '_Icon/Download' },
              { prop: 'printIcon', layer: 'printIcon', defKey: '_Icon/Printer' },
              { prop: 'refreshIcon', layer: 'refreshIcon', defKey: '_Icon/RefreshCcw' },
              { prop: 'copyIcon', layer: 'copyIcon', defKey: '_Icon/Copy' },
              { prop: 'shareIcon', layer: 'shareIcon', defKey: '_Icon/Share' },
            ],
          },
        ),
      states: [
        { caption: '아이콘만 (기본)', props: {} },
        { caption: '아이콘+글자', props: { labelDisplay: 'iconText' } },
        { caption: 'Ghost', props: { appearance: 'ghost' } },
        { caption: '새로고침 중', props: { refreshing: 'true' } },
      ],
    },
    {
      key: 'FormSection',
      setName: 'DS/FormSection',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '폼 화면의 번호 카드 한 장. columns(1·2·3)·appearance(card·plain)·toggleable·enabled는 React prop과 ' +
        '같은 이름의 축이고, 본문(children)은 규약 §7의 content 프레임으로 그립니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/FormSection',
          [
            { name: 'columns', values: ['1', '2', '3'] },
            { name: 'appearance', values: ['card', 'plain'] },
            { name: 'toggleable', values: ['false', 'true'] },
            { name: 'enabled', values: ['true', 'false'] },
          ],
          (c) => renderFormSection(ctx, c),
          {
            texts: [
              { prop: 'title', layer: 'titleText', def: '배너 구분' },
              { prop: 'description', layer: 'description', def: '진열 위치에 맞는 배너 종류를 고릅니다.' },
              { prop: 'toggleLabel', layer: 'toggleLabel', def: '사용' },
              { prop: 'toggleDescription', layer: 'toggleDescription', def: '진열 위치에서 이 배너를 노출합니다.' },
              { prop: 'onLabel', layer: 'onLabel', def: 'ON' },
              { prop: 'offLabel', layer: 'offLabel', def: 'OFF' },
              { prop: 'disabledHint', layer: 'disabledHint', def: '끄면 이 배너 영역이 노출되지 않습니다.' },
            ],
          },
        ),
      states: [
        { caption: '기본 (3열)', props: {} },
        { caption: '1열', props: { columns: '1' } },
        { caption: 'Plain (모달 안)', props: { appearance: 'plain' } },
        { caption: '토글 · 사용', props: { toggleable: 'true' } },
        { caption: '토글 · 미사용', props: { toggleable: 'true', enabled: 'false' } },
      ],
    },
    {
      key: 'FieldRow',
      setName: 'DS/FieldRow',
      eyebrow: 'ATOM · ADMIN',
      desc:
        '라벨+필수(*)+설명/에러를 한 규격으로 묶는 폼 행. labelPlacement(top·left)·required·span은 React prop과 ' +
        '같은 이름의 축이고, 컨트롤(children)은 규약 §7의 content 프레임(라벨 없는 입력 박스)으로 그립니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/FieldRow',
          [
            { name: 'labelPlacement', values: ['top', 'left'] },
            { name: 'required', values: ['false', 'true'] },
            { name: 'span', values: ['1', '2', '3'] },
          ],
          (c) => renderFieldRow(ctx, c),
          {
            texts: [
              { prop: 'label', layer: 'labelText', def: '상품명' },
              { prop: 'description', layer: 'description', def: '한글·영문·숫자 40자 이내' },
            ],
          },
        ),
      states: [
        { caption: '기본 (top)', props: {} },
        { caption: '필수', props: { required: 'true' } },
        { caption: '좌측 라벨', props: { labelPlacement: 'left' } },
        { caption: '2열 span', props: { span: '2' } },
      ],
    },
    {
      key: 'Placeholder',
      setName: 'DS/Placeholder',
      eyebrow: 'ATOM · FOUNDATION',
      desc:
        '빈 그림 8종(image·video·file·empty·search·error·delete·success). kind는 React PlaceholderKind와 ' +
        '같은 이름의 축이고, 톤은 원본과 동일(대부분 primary, error·delete는 error, success는 success)합니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/Placeholder',
          [{ name: 'kind', values: ['image', 'video', 'file', 'empty', 'search', 'error', 'delete', 'success'] }],
          (c) => renderPlaceholder(ctx, c),
          { texts: [{ prop: 'label', layer: 'label', def: '이미지 없음' }] },
        ),
      states: [
        { caption: '이미지', props: {} },
        { caption: '검색 결과 없음', props: { kind: 'search' } },
        { caption: '삭제 확인', props: { kind: 'delete' } },
        { caption: '완료', props: { kind: 'success' } },
      ],
    },
    {
      key: 'ContextMenu',
      setName: 'DS/ContextMenu',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '우클릭(또는 클릭) 트리거 메뉴. trigger는 React prop과 같은 이름의 축이고, 트리거(children)는 ' +
        "규약 §7의 content 프레임입니다. 'open'은 내부 상태(useState)라 코드에 없는 축이지만, 열린 메뉴 그림 " +
        '없이는 문서가 될 수 없습니다(Select.open과 같은 사유).',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/ContextMenu',
          [
            { name: 'trigger', values: ['contextmenu', 'click'] },
            { name: 'open', values: ['true', 'false'] },
          ],
          (c) => renderContextMenu(ctx, c),
        ),
      states: [
        { caption: '우클릭 트리거 · 열림', props: {} },
        { caption: '클릭 트리거 · 열림', props: { trigger: 'click' } },
        { caption: '닫힘', props: { open: 'false' } },
      ],
    },
    {
      key: 'AttachmentList',
      setName: 'DS/AttachmentList',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '첨부 파일 목록. compact는 React prop과 같은 이름의 축(카드형 ↔ 구분선 조밀 행)이고, ' +
        '헤더·요약·썸네일은 각각 showHeader·showSummary·showThumbnail로 끕니다(showMeta는 확장자·용량 줄).',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/AttachmentList',
          [{ name: 'compact', values: ['false', 'true'] }],
          (c) => renderAttachmentList(ctx, c),
          {
            texts: [{ prop: 'downloadAllLabel', layer: 'downloadAllLabel', def: '전체 다운로드' }],
            bools: [
              { prop: 'showHeader', layer: 'header', def: true },
              { prop: 'showSummary', layer: 'summary', def: true },
              { prop: 'showThumbnail', layer: 'thumb', def: true },
              { prop: 'showMeta', layer: 'meta', def: true },
            ],
            swaps: [
              { prop: 'previewIcon', layer: 'previewIcon', defKey: '_Icon/Eye' },
              { prop: 'downloadIcon', layer: 'downloadIcon', defKey: '_Icon/Download' },
              { prop: 'removeIcon', layer: 'removeIcon', defKey: '_Icon/Close' },
            ],
          },
        ),
      states: [
        { caption: '카드형 (기본)', props: {} },
        { caption: 'Compact', props: { compact: 'true' } },
      ],
    },
    {
      key: 'CategoryTree',
      setName: 'DS/CategoryTree',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '상품 목록 좌측 2Depth 카테고리 트리. collapsible은 React prop과 같은 이름의 축이고, 건수 배지는 ' +
        'showCount로 끕니다. value(선택된 key)는 화면에 글자로 그려지지 않아(강조는 행 배경) TEXT로 열지 않습니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/CategoryTree',
          [{ name: 'collapsible', values: ['true', 'false'] }],
          (c) => renderCategoryTree(ctx, c),
          {
            texts: [{ prop: 'addLabel', layer: 'addLabel', def: '추가' }],
            bools: [{ prop: 'showCount', layer: 'showCount', def: true }],
            swaps: [
              { prop: 'addIcon', layer: 'addIcon', defKey: '_Icon/Plus' },
              { prop: 'expandIcon', layer: 'expandIcon', defKey: '_Icon/ChevronRight' },
            ],
          },
        ),
      states: [
        { caption: '펼침 가능 (기본)', props: {} },
        { caption: '항상 펼침', props: { collapsible: 'false' } },
      ],
    },
    {
      key: 'OptionRows',
      setName: 'DS/OptionRows',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '상품 옵션 행 편집기(옵션명·옵션값·추가금액·재고 + 순서/삭제). disabled는 React prop과 같은 이름의 ' +
        '축이고, 헤더 줄·순서 버튼·하단 카운터는 각각 showHeader·showReorder·showCount로 끕니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/OptionRows',
          [{ name: 'disabled', values: ['false', 'true'] }],
          (c) => renderOptionRows(ctx, c),
          {
            texts: [{ prop: 'addLabel', layer: 'addLabel', def: '옵션 추가' }],
            bools: [
              { prop: 'showHeader', layer: 'showHeader', def: true },
              { prop: 'showReorder', layer: 'showReorder', def: true },
              { prop: 'showCount', layer: 'showCount', def: true },
            ],
            swaps: [
              { prop: 'addIcon', layer: 'addIcon', defKey: '_Icon/Plus' },
              { prop: 'moveUpIcon', layer: 'moveUpIcon', defKey: '_Icon/ChevronUp' },
              { prop: 'moveDownIcon', layer: 'moveDownIcon', defKey: '_Icon/ChevronDown' },
              { prop: 'removeIcon', layer: 'removeIcon', defKey: '_Icon/Trash2' },
            ],
          },
        ),
      states: [
        { caption: '기본 (3행)', props: {} },
        { caption: 'Disabled', props: { disabled: 'true' } },
      ],
    },
    {
      key: 'GroupPanel',
      setName: 'DS/GroupPanel',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '고객/운영진 목록 좌측 그룹 패널. highlightFirst는 React prop과 같은 이름의 축(첫 항목 primary 강조 ' +
        'on/off)이고, 건수는 showCount로 끕니다. value는 화면에 글자로 그려지지 않습니다(강조는 행 배경).',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/GroupPanel',
          [{ name: 'highlightFirst', values: ['true', 'false'] }],
          (c) => renderGroupPanel(ctx, c),
          {
            texts: [{ prop: 'addLabel', layer: 'addLabel', def: '새 그룹 만들기' }],
            bools: [{ prop: 'showCount', layer: 'showCount', def: true }],
            swaps: [{ prop: 'addIcon', layer: 'addIcon', defKey: '_Icon/Plus' }],
          },
        ),
      states: [
        { caption: '첫 항목 강조 (기본)', props: {} },
        { caption: '강조 없음', props: { highlightFirst: 'false' } },
      ],
    },
    {
      key: 'MobilePreview',
      setName: 'DS/MobilePreview',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '상품 등록/수정 우측 실시간 미리보기 폰 프레임. statusBar는 React prop과 같은 이름의 축이고, ' +
        '홈 인디케이터·하단 안내는 showHomeIndicator·showNote로 끕니다. 본문(children)은 규약 §7의 content ' +
        "프레임입니다(CSS 클래스명은 'viewport').",
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/MobilePreview',
          [{ name: 'statusBar', values: ['true', 'false'] }],
          (c) => renderMobilePreview(ctx, c),
          {
            texts: [
              { prop: 'statusTime', layer: 'statusTime', def: '9:41' },
              { prop: 'note', layer: 'note', def: '실제 상세페이지와 다르게 보일 수 있어요' },
            ],
            bools: [
              { prop: 'showHomeIndicator', layer: 'showHomeIndicator', def: true },
              { prop: 'showNote', layer: 'showNote', def: true },
            ],
          },
        ),
      states: [
        { caption: '상태바 있음 (기본)', props: {} },
        { caption: '상태바 없음', props: { statusBar: 'false' } },
      ],
    },
    {
      key: 'MainVisualUploader',
      setName: 'DS/MainVisualUploader',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '메인비주얼(배너) 목록 업로더 — 드래그 핸들+썸네일+제목/링크 입력+노출 토글+순서/삭제 + 하단 드롭존. ' +
        '코드에 유니온·불리언 축이 하나도 없어(전부 show* 또는 배열·콜백) state=default 하나짜리 축을 둡니다. ' +
        '링크 입력·노출 토글·순서 버튼·순서 배지는 각각 showLinkField·showVisibleToggle·showMoveButtons·showOrder로 끕니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/MainVisualUploader',
          [{ name: 'state', values: ['default'] }],
          (c) => renderMainVisualUploader(ctx, c),
          {
            texts: [
              { prop: 'ratioHint', layer: 'ratioHint', def: '권장 1920×640' },
              { prop: 'addLabel', layer: 'addLabel', def: '· 클릭하거나 이미지를 끌어다 놓으세요' },
            ],
            bools: [
              { prop: 'showLinkField', layer: 'showLinkField', def: true },
              { prop: 'showVisibleToggle', layer: 'showVisibleToggle', def: true },
              { prop: 'showMoveButtons', layer: 'showMoveButtons', def: true },
              { prop: 'showOrder', layer: 'showOrder', def: true },
            ],
            swaps: [
              { prop: 'moveUpIcon', layer: 'moveUpIcon', defKey: '_Icon/ChevronUp' },
              { prop: 'moveDownIcon', layer: 'moveDownIcon', defKey: '_Icon/ChevronDown' },
              { prop: 'removeIcon', layer: 'removeIcon', defKey: '_Icon/Trash2' },
              { prop: 'addIcon', layer: 'addIcon', defKey: '_Icon/Image' },
            ],
          },
        ),
      states: [{ caption: '배너 2장 + 드롭존', props: {} }],
    },
    {
      key: 'AnalyticsTable',
      setName: 'DS/AnalyticsTable',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '기간별 분석 표(일자·주문수·매출액·방문자 + 하단 고정 합계 행). density·striped·stickyHeader· ' +
        'stickySummary·dimZero는 전부 React prop과 같은 이름의 축이고, 헤더 줄은 showHeader로 끕니다. ' +
        'columns·rows·summaries는 배열이라 축이 될 수 없어 데모 데이터로만 채웠습니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/AnalyticsTable',
          [
            { name: 'density', values: ['comfortable', 'compact'] },
            { name: 'striped', values: ['false', 'true'] },
            { name: 'stickyHeader', values: ['true', 'false'] },
            { name: 'stickySummary', values: ['true', 'false'] },
            { name: 'dimZero', values: ['true', 'false'] },
          ],
          (c) => renderAnalyticsTable(ctx, c),
          { bools: [{ prop: 'showHeader', layer: 'showHeader', def: true }] },
        ),
      states: [
        { caption: 'Comfortable (기본)', props: {} },
        { caption: 'Compact', props: { density: 'compact' } },
        { caption: 'Striped', props: { striped: 'true' } },
        { caption: '0 강조(dimZero 해제)', props: { dimZero: 'false' } },
      ],
    },
    {
      key: 'ConsentList',
      setName: 'DS/ConsentList',
      eyebrow: 'MOLECULE · ADMIN',
      desc:
        '동의 정보 블록(DefinitionList 리듬 위에 동의/미동의 배지). density·columns·appearance는 전부 React ' +
        "prop과 같은 이름의 축입니다 — appearance는 BadgeProps['appearance'](인덱스드 액세스 타입)를 따라간 " +
        '것이라 Badge와 값이 같습니다(solid·soft·outline).',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/ConsentList',
          [
            { name: 'density', values: ['compact', 'comfortable'] },
            { name: 'columns', values: ['1', '2'] },
            { name: 'appearance', values: ['soft', 'solid', 'outline'] },
          ],
          (c) => renderConsentList(ctx, c),
          {
            // note가 없는 항목의 상태 문구 — 여러 행이 같은 레이어 이름을 공유한다(TodoSummary.countUnit과 같은 패턴).
            texts: [
              { prop: 'agreedLabel', layer: 'agreedLabel', def: '동의' },
              { prop: 'deniedLabel', layer: 'deniedLabel', def: '미동의' },
            ],
            swaps: [
              { prop: 'agreedIcon', layer: 'agreedIcon', defKey: '_Icon/Check' },
              { prop: 'deniedIcon', layer: 'deniedIcon', defKey: '_Icon/Minus' },
            ],
          },
        ),
      states: [
        { caption: 'Compact · 1열 (기본)', props: {} },
        { caption: 'Comfortable', props: { density: 'comfortable' } },
        { caption: '2열', props: { columns: '2' } },
      ],
    },
    {
      key: 'FormAnchorNav',
      setName: 'DS/FormAnchorNav',
      eyebrow: 'ATOM · ADMIN',
      desc:
        '긴 폼(상품 등록·수정) 좌측 섹션 앵커. sticky는 React prop과 같은 이름의 축이고, 오류 점은 ' +
        'showInvalidDot으로 끕니다. activeKey(선택된 섹션 key)는 화면에 글자로 그려지지 않습니다(강조는 좌측 레일).',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/FormAnchorNav',
          [{ name: 'sticky', values: ['true', 'false'] }],
          (c) => renderFormAnchorNav(ctx, c),
          { bools: [{ prop: 'showInvalidDot', layer: 'showInvalidDot', def: true }] },
        ),
      states: [
        { caption: 'Sticky (기본)', props: {} },
        { caption: 'Static', props: { sticky: 'false' } },
      ],
    },
    {
      key: 'RichTextEditor',
      setName: 'DS/RichTextEditor',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '경량 리치 텍스트 에디터(굵게·기울임·밑줄·목록·정렬·링크·이미지). disabled는 React prop과 같은 ' +
        "이름의 축이고, 'state'는 값/플레이스홀더 그림이 갈리는 내부 상태라 코드에 없는 축입니다(DropZone.state와 " +
        '같은 사유). 툴바·링크·이미지 버튼은 각각 showToolbar·showLinkButton·showImageButton으로 끕니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/RichTextEditor',
          [
            { name: 'disabled', values: ['false', 'true'] },
            { name: 'state', values: ['filled', 'empty'] },
          ],
          (c) => renderRichTextEditor(ctx, c),
          {
            texts: [
              {
                prop: 'value',
                layer: 'value',
                def: '이 상품은 고급 원목으로 제작되어 견고하고 오래 사용할 수 있습니다. 색상은 총 3가지로 제공됩니다.',
              },
              { prop: 'placeholder', layer: 'placeholder', def: '내용을 입력하세요' },
            ],
            bools: [
              { prop: 'showToolbar', layer: 'showToolbar', def: true },
              { prop: 'showLinkButton', layer: 'showLinkButton', def: true },
              { prop: 'showImageButton', layer: 'showImageButton', def: true },
            ],
          },
        ),
      states: [
        { caption: '입력됨 (기본)', props: {} },
        { caption: '빈 상태(placeholder)', props: { state: 'empty' } },
        { caption: 'Disabled', props: { disabled: 'true' } },
      ],
    },
    {
      key: 'AdminChart',
      setName: 'DS/AdminChart',
      eyebrow: 'ORGANISM · ADMIN',
      desc:
        '대시보드 차트(막대·도넛·선·영역). kind·stacked·legendPosition은 React prop과 같은 이름의 축입니다. ' +
        "orientation은 kind='bar'에만 영향해(AdminChart.tsx:357) 축에서 뺐습니다 — 넣으면 48변형(권장 상한 " +
        '40 초과)이고 그중 75%(donut·line·area)는 두 값의 그림이 완전히 같은 중복 변형이 됩니다. ' +
        'showLegend·showGrid·showTooltip·showCenterTotal은 BOOLEAN입니다.',
      build: (ctx, page) =>
        buildSet(
          ctx,
          page,
          'DS/AdminChart',
          [
            { name: 'kind', values: ['bar', 'donut', 'line', 'area'] },
            { name: 'stacked', values: ['false', 'true'] },
            { name: 'legendPosition', values: ['bottom', 'right', 'top'] },
          ],
          (c) => renderAdminChart(ctx, c),
          {
            texts: [
              { prop: 'title', layer: 'title', def: '월별 매출 추이' },
              { prop: 'centerLabel', layer: 'centerLabel', def: '합계' },
            ],
            bools: [
              { prop: 'showLegend', layer: 'showLegend', def: true },
              { prop: 'showGrid', layer: 'showGrid', def: true },
              { prop: 'showTooltip', layer: 'showTooltip', def: true },
              { prop: 'showCenterTotal', layer: 'showCenterTotal', def: true },
            ],
          },
        ),
      states: [
        { caption: 'Bar · 그룹형', props: {} },
        { caption: 'Bar · 누적형', props: { stacked: 'true' } },
        { caption: 'Donut', props: { kind: 'donut' } },
        { caption: 'Line', props: { kind: 'line' } },
        { caption: 'Area', props: { kind: 'area' } },
        { caption: '범례 우측', props: { legendPosition: 'right' } },
      ],
    },
  ],
}

// ── 어드민 페이지 생성 ───────────────────────────────────────────────
// 세트는 페이지 오른쪽(x=1360)에 세로로 쌓고, 문서(오토레이아웃)에는 인스턴스만 배치한다.
export async function generateAdmin(
  fontFamily: string,
  colors?: Record<string, string>,
  preset?: PresetName,
): Promise<string[]> {
  const ctx = await setup(fontFamily, colors, preset)
  if (!ctx.vars.get('color/primary')) {
    ctx.warnings.push("Variables가 없습니다 — '토큰'을 먼저 생성하세요(색이 프리셋과 연결되지 않습니다).")
  }
  if (!figma.root.children.some((p) => p.name.indexOf('Icon System') >= 0)) {
    ctx.warnings.push('Icon System 페이지가 없어 아이콘이 인라인 폴백됩니다 — 아이콘 스왑을 쓰려면 Icon System도 함께 생성하세요.')
  }

  const cat = ADMIN_CATEGORY
  if (figma.root.children.some((p) => p.name === cat.pageName)) {
    // 페이지를 다시 만들지는 않지만, 이미 있는 세트를 레지스트리에 입양해 둔다
    // → 같은 파일에서 '어드민 화면'만 다시 돌려도 인스턴스 조립 경로가 살아난다.
    const adopted = adoptAdminSets()
    ctx.warnings.push(
      `페이지 '${cat.pageName}' 이미 존재 — 건너뜀(재생성하려면 '기존 삭제 후 재생성'). 기존 컴포넌트 세트 ${adopted}개를 화면 조립에 재사용합니다.`,
    )
    return ctx.warnings
  }
  const page = figma.createPage()
  page.name = cat.pageName
  applyPageColorMode(ctx, page)

  ADMIN_SETS.clear() // 이전 실행의 유령 노드 제거 — 이번 실행이 만든 세트만 남긴다
  const sets = ADMIN_SETS
  let sy = 200
  for (const doc of cat.docs) {
    try {
      const set = doc.build(ctx, page)
      set.x = 1360
      set.y = sy
      sy += set.height + 48
      bindTokens(ctx, set) // 보더·마진·라운드·불투명도 변수 바인딩
      sets.set(doc.setName, set) // = ADMIN_SETS — 화면(17)이 여기서 세트를 꺼낸다
    } catch (e) {
      ctx.warnings.push(`${doc.setName} 세트 생성 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }

  const root = makeRoot(ctx, cat.title)
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
  return ctx.warnings
}
