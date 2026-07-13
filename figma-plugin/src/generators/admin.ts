// 어드민(관리자 화면) 컴포넌트 문서 — 스토리북 src/ds의 어드민 계열을 Figma 베리언트 세트로.
// categories.ts와 같은 machinery(setup/buildSet/makeRoot/makeHeader/makeSection/variantItem)를 쓰되
// categories.ts는 건드리지 않는다 → 비-export 헬퍼는 이 파일에 그대로 복제하고 출처를 표기했다.
// 대상: AdminSidebar · AdminTopbar · AdminTable · AdminCard · ViewSwitch · SearchPanel ·
//       CrudDialog · DropZone · StatusTimeline · TodoSummary · ActivityLog · MemoBox · DefinitionList
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
import { buildSet, addTextProp, addBoolProp, addSwapProp, type Axis, type TextProp, type PropSpec, type State } from './lib/build-set'
// screens.ts가 './admin'에서 propKeys를 가져간다 — 정본은 lib/build-set.ts, 여기선 경로만 유지한다.
export { propKeys } from './lib/build-set'
import { solidToneHex, onToneHex, solidVarName, onVarName } from './tone'
// 사이드바 메뉴의 단일 소스 — 화면(17)도 같은 모듈을 본다(라벨을 두 곳에 쓰지 않는다).
import { ADMIN_MENU, ADMIN_ACTIVE_VALUES, groupOfActive, type AdminMenuItem } from './admin-menu'
import type { PresetName } from '../presets'

// 오너 규칙: 페이지 탭은 "순번. System - 이름". 카테고리(1~14) 다음 번호.
const PAGE_ADMIN = '15. System - Admin'
// reset 대상 등록용 — reset.ts가 이 배열을 함께 삭제해야 재생성이 된다.
export const ADMIN_PAGE_NAMES = [PAGE_ADMIN]

// ── 어드민 컴포넌트 세트 레지스트리 ───────────────────────────────────
// 아이콘의 ICON_COMPONENTS와 같은 패턴. generateAdmin이 세트를 만들 때마다 여기에 등록하고,
// '17. System - Admin Screens'(screens.ts)는 이 맵에서 세트를 꺼내 인스턴스로 화면을 조립한다.
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
 * 이미 있는 '15. System - Admin' 페이지의 컴포넌트 세트를 레지스트리에 입양한다.
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

// ── 색·토큰 바인딩 헬퍼 (출처: categories.ts — 비-export라 동일 구현을 복제) ──
function boundText(ctx: Ctx, chars: string, size: number, varName: string, hex: string, bold = false): TextNode {
  const t = txt(ctx, chars, size, ctx.userColors[varName] ?? hex, bold)
  const v = ctx.vars.get(varName)
  if (v) t.fills = [boundPaint(v)]
  // 오너: 텍스트 크기·굵기·글씨체도 변수로.
  const bind = t as unknown as { setBoundVariable: (field: string, v: Variable) => void }
  const sv = ctx.vars.get('font/size/' + size)
  if (sv) {
    try {
      bind.setBoundVariable('fontSize', sv)
    } catch {
      /* skip */
    }
  }
  const wv = ctx.vars.get(bold ? 'font/weight/bold' : 'font/weight/regular')
  if (wv) {
    try {
      bind.setBoundVariable('fontWeight', wv)
    } catch {
      /* skip */
    }
  }
  // ctx.fontFamilyVar가 null이면 절대 바인딩하지 않는다(미로드 폰트 바인딩 = 노드 생성 실패).
  if (ctx.fontFamilyVar) {
    try {
      bind.setBoundVariable('fontFamily', ctx.fontFamilyVar)
    } catch {
      /* skip */
    }
  }
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
/** 보더·패딩·라운드·불투명도를 값이 맞는 변수에 후처리 바인딩. 출처: categories.ts bindTokens */
function bindTokens(ctx: Ctx, root: SceneNode) {
  const all: SceneNode[] = [root]
  const rf = root as unknown as { findAll?: (cb: (n: SceneNode) => boolean) => SceneNode[] }
  if (typeof rf.findAll === 'function') all.push(...rf.findAll(() => true))
  for (const node of all) {
    const a = node as unknown as {
      cornerRadius?: number | symbol
      strokeWeight?: number | symbol
      strokes?: readonly Paint[]
      layoutMode?: string
      paddingTop?: number
      paddingRight?: number
      paddingBottom?: number
      paddingLeft?: number
      itemSpacing?: number
      opacity?: number
      setBoundVariable: (field: string, v: Variable) => void
    }
    if (typeof a.opacity === 'number' && a.opacity > 0 && a.opacity < 1) {
      const ov = ctx.vars.get('opacity/' + Math.round(a.opacity * 100))
      if (ov)
        try {
          a.setBoundVariable('opacity', ov)
        } catch {
          /* skip */
        }
    }
    if (typeof a.cornerRadius === 'number' && a.cornerRadius > 0) {
      const rv = ctx.vars.get('radius/' + a.cornerRadius)
      if (rv)
        for (const c of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) {
          try {
            a.setBoundVariable(c, rv)
          } catch {
            /* skip */
          }
        }
    }
    if (typeof a.strokeWeight === 'number' && a.strokeWeight > 0 && a.strokes && a.strokes.length) {
      const bv = ctx.vars.get('border/' + a.strokeWeight)
      if (bv)
        try {
          a.setBoundVariable('strokeWeight', bv)
        } catch {
          /* skip */
        }
    }
    if (a.layoutMode && a.layoutMode !== 'NONE') {
      for (const p of ['paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'itemSpacing'] as const) {
        const val = a[p]
        if (typeof val === 'number' && val > 0) {
          const sv = ctx.vars.get('space/' + val)
          if (sv)
            try {
              a.setBoundVariable(p, sv)
            } catch {
              /* skip */
            }
        }
      }
    }
  }
}
/** 인스턴스 안 VECTOR의 stroke를 덮어써 아이콘 색을 맞춘다. 출처: categories.ts recolorIcon */
function recolorIcon(node: SceneNode, hex: string) {
  const f = node as unknown as { findAll?: (cb: (n: SceneNode) => boolean) => SceneNode[] }
  if (typeof f.findAll !== 'function') return
  for (const v of f.findAll((n) => n.type === 'VECTOR')) (v as VectorNode).strokes = [solid(hex)]
}
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


// ── 문서 안 변형 아이템(인스턴스 + 캡션). 출처: categories.ts variantItem ──
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
 * → 이름이 같은 래퍼(CSS 클래스 이름 'meta', hug·투명)를 두고 거기에 붙인다.
 */
function metaRow(ctx: Ctx, at: string, i: number): FrameNode {
  const wrap = autoFrame('meta', 'HORIZONTAL')
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
            bools: [{ prop: 'showMeta', layer: 'meta', def: true }],
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
  return ctx.warnings
}
