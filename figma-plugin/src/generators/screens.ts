// 어드민 화면(스크린) 페이지 — 스토리북 어드민 14화면을 1920 폭 화면 프레임으로.
//
// 화면 = 사이드바(DS/AdminSidebar 인스턴스) + 콘텐츠 열. 사이드바의 active 베리언트가 화면마다 달라
//   '지금 어느 메뉴인지'가 프레임 안에서 그대로 보인다. 메뉴 라벨의 단일 소스는 ./admin-menu(ADMIN_MENU)다.
//
// 오너 확정(2026-07): 화면은 '15. System - Admin'이 만든 컴포넌트 세트의 **인스턴스로 조립**한다.
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
  txt,
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
import { ADMIN_SETS, adminSet, adoptAdminSets, propKeys } from './admin'
import { ADMIN_MENU, groupOfActive, type AdminActive } from './admin-menu'
import type { PresetName } from '../presets'

// 오너 규칙: 페이지 탭은 "순번. System - 이름". 카테고리(1~14) · Admin(15) · Layout(16) 다음 번호.
const PAGE_SCREENS = '17. System - Admin Screens'
// reset 대상(재생성 시 삭제) — reset.ts가 이 배열을 읽는다.
export const SCREEN_PAGE_NAMES = [PAGE_SCREENS]

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

// ── 바인딩 헬퍼(categories.ts와 동일 규약) ───────────────────────────
/** 텍스트 — 색·크기·굵기(·글씨체)를 변수에 바인딩. 화면 안 텍스트는 전부 이걸 쓴다. */
function boundText(ctx: Ctx, chars: string, size: number, varName: string, hex: string, bold = false): TextNode {
  const t = txt(ctx, chars, size, ctx.userColors[varName] ?? hex, bold)
  const v = ctx.vars.get(varName)
  if (v) t.fills = [boundPaint(v)]
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
  // ctx.fontFamilyVar가 null이면 절대 바인딩하지 않는다(미로드 폰트 바인딩 → 노드 생성 실패).
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
/** 보더·패딩·간격·라운드·불투명도를 값이 맞는 변수에 후처리 바인딩(화면 프레임마다 1회). */
function bindTokens(ctx: Ctx, root: SceneNode) {
  // 인스턴스 내부는 건너뛴다 — 세트(15. Admin)에서 이미 바인딩됐고, 여기서 또 만지면
  // 인스턴스에 의미 없는 오버라이드가 쌓여 "컴포넌트를 고쳐도 화면이 안 바뀌는" 상태로 되돌아간다.
  const all: SceneNode[] = []
  const walk = (n: SceneNode) => {
    all.push(n)
    if (n.type === 'INSTANCE') return
    const kids = (n as unknown as { children?: readonly SceneNode[] }).children
    if (kids) for (const k of kids) walk(k)
  }
  walk(root)
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
    // 개별 보더(행 하단선 등)는 strokeWeight가 figma.mixed(symbol) → 자동으로 건너뛴다.
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

// ── 컴포넌트 인스턴스 조립 ───────────────────────────────────────────
// 화면의 블록은 여기를 통해서만 컴포넌트가 된다. 세트가 없으면 null → 호출부가 draw* 폴백으로 내려간다.
type InstOpts = {
  /** 베리언트 축(축 이름 그대로). 예: { density: 'compact', frame: 'flush' } */
  variant?: Record<string, string>
  /** TEXT·BOOLEAN 속성(표시 이름 기준). 예: { Title: '상품 목록', 'Show Select': false } */
  props?: Record<string, string | boolean>
  name?: string
}
/** 세트가 없다고 이미 경고한 이름 — 14화면 × 같은 세트로 경고가 도배되는 걸 막는다. */
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
/** 흐린 보조 텍스트 — 색은 secondary 변수 + opacity 60(변수 바인딩 유지). */
function tMuted(ctx: Ctx, s: string, size = F_BODY): TextNode {
  const t = boundText(ctx, s, size, 'color/secondary', SUB)
  t.opacity = 0.6
  return t
}
const tLink = (ctx: Ctx, s: string) => boundText(ctx, s, F_BODY, 'color/primary', ACCENT, true)

// ── 원자(자체 구현 — admin.ts 인스턴스에 의존하지 않는다) ────────────
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
  knob.fills = [solid(WHITE)]
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
/** 폼 한 줄 — 라벨(고정 폭) + 컨트롤. */
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
/** 카드 안 툴바(검색·필터·액션) — 표 위, 하단 1px 구분선. */
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
 * 선택 상태를 세트의 active 베리언트 축으로 만들어 화면은 축 값만 고른다 → 메뉴를 고치면 14화면이 함께 바뀐다.
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
/** 상태 탭 줄(전체/판매중/…) — 활성 탭은 하단 2px 강조. */
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
/** 좌측 240 패널(그룹·부서·카테고리 트리). */
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
/** 통계 타일(대시보드·고객 상세). */
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

// ── 생성 ─────────────────────────────────────────────────────────────
// [화면 이름, 빌더, 사이드바 active 메뉴]. 배열 순서 = 캔버스 세로 배치 순서이며 사이드바 메뉴 순서를 따른다.
// 'none' = 메뉴에 없는 화면(공지사항) — 사이드바는 그리되 아무 항목도 강조하지 않는다.
const SCREEN_BUILDERS: Array<[string, (ctx: Ctx) => FrameNode, AdminActive]> = [
  ['대시보드', screenDashboard, 'dashboard'],
  ['고객 목록', screenMemberList, 'users'],
  ['고객 상세', screenCustomerDetail, 'users'],
  ['운영진', screenStaffList, 'staff'],
  ['상품 목록', screenProductList, 'products'],
  ['상품 등록', screenProductForm, 'products'],
  ['주문 목록', screenOrderList, 'orders'],
  ['문의 내역', screenInquiryList, 'inquiries'],
  ['문의 상세', screenInquiryDetail, 'inquiries'],
  ['회사소개 관리', screenCompanyForm, 'about'],
  ['연혁 관리', screenHistoryList, 'history'],
  ['포트폴리오 관리', screenPortfolioList, 'portfolio'],
  ['포트폴리오 등록', screenPortfolioForm, 'portfolio'],
  ['공지사항', screenNotice, 'none'],
]

/** 어드민 화면 14종을 1920 폭 프레임(사이드바 + 콘텐츠)으로 생성한다(세로 나열). */
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
  // 세트가 없으면(= 이번 실행에서 어드민 컴포넌트를 안 만들었으면) 파일에 이미 있는 '15. System - Admin'
  // 페이지에서 세트를 입양해 본다. 그것도 없으면 14화면 전부 직접 그리기로 내려간다
  // → 그 상태에서는 컴포넌트를 고쳐도 화면이 안 바뀌므로 분명히 경고한다.
  if (ADMIN_SETS.size === 0) {
    const adopted = adoptAdminSets()
    if (adopted > 0) {
      ctx.warnings.push(`'15. System - Admin'의 기존 컴포넌트 세트 ${adopted}개로 화면을 조립합니다.`)
    } else {
      ctx.warnings.push(
        "'15. System - Admin' 컴포넌트 세트가 없습니다 — 화면을 직접 그립니다. " +
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
      bindTokens(ctx, frame) // 보더·패딩·간격·라운드·불투명도 변수 바인딩(화면당 1회)
      y += frame.height + SCREEN_GAP
    } catch (e) {
      ctx.warnings.push(`Screen/${name} 생성 실패: ${e instanceof Error ? e.message : String(e)}`)
    }
  }
  return ctx.warnings
}
